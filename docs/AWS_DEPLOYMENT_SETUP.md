# AWS Lambda Deployment Setup

## Problem: Package Size Exceeds Limit

The Lambda function dependencies (~800MB node_modules) exceed AWS Lambda's direct upload limit of 70MB.

### Solutions

**Option 1: S3-based Deployment (Recommended)** ✅
- Supports packages up to 5GB
- Better for iterative deployments
- Requires IAM S3 permissions

**Option 2: Lambda Layers** 
- Limited to 250MB per layer
- Good for shared dependencies
- Requires separating core vs. application code

**Option 3: Dependency Optimization**
- Remove unused peer dependencies
- Requires monorepo restructuring

## Option 1: Configure S3 Deployment

### Step 1: Create IAM Policy

1. Go to **AWS IAM Console** → **Policies** → **Create Policy**
2. Use the JSON editor and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3DeploymentBucket",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::imperfect-coach-lambda-*",
        "arn:aws:s3:::imperfect-coach-lambda-*/*"
      ]
    },
    {
      "Sid": "LambdaUpdateFunction",
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration"
      ],
      "Resource": "arn:aws:lambda:eu-north-1:*:function:imperfect-*"
    }
  ]
}
```

3. Name it: `ImperfectCoachLambdaS3Deploy`
4. Click **Create Policy**

### Step 2: Attach Policy to Your IAM User

1. Go to **IAM Console** → **Users** → Select your user (e.g., `imperfectform`)
2. Click **Add Permissions** → **Attach Policies**
3. Search for `ImperfectCoachLambdaS3Deploy` and attach it

### Step 3: Deploy Using S3

```bash
cd aws-lambda
./deploy-s3.sh
```

The script will:
1. Create the S3 bucket (if needed)
2. Build the deployment package
3. Upload to S3
4. Update Lambda via S3 reference
5. Clean up old versions (keeps last 5)

## Option 2: Lambda Layers

### Step 1: Create Layer Package

```bash
mkdir -p layer/nodejs
cd layer/nodejs
npm init -y

# Install only essential dependencies
npm install \
  @aws-sdk/client-bedrock-runtime \
  @aws-sdk/client-bedrock-agent-runtime \
  viem \
  bs58 \
  tweetnacl
```

### Step 2: Package Layer

```bash
cd aws-lambda/layer
zip -r lambda-layer.zip nodejs/
```

### Step 3: Create Layer in AWS

```bash
aws lambda publish-layer-version \
  --layer-name imperfect-coach-dependencies \
  --zip-file fileb://lambda-layer.zip \
  --compatible-runtimes nodejs18.x \
  --region eu-north-1
```

### Step 4: Attach to Lambda

```bash
aws lambda update-function-configuration \
  --function-name imperfect-coach-premium-analysis \
  --layers arn:aws:lambda:eu-north-1:YOUR_ACCOUNT_ID:layer:imperfect-coach-dependencies:1 \
  --region eu-north-1
```

### Step 5: Deploy Function Code Only

```bash
cd aws-lambda
rm -rf node_modules
zip function.zip *.mjs lib/
aws lambda update-function-code \
  --function-name imperfect-coach-premium-analysis \
  --zip-file fileb://function.zip \
  --region eu-north-1
```

**Note**: Lambda Layers can exceed 250MB limit due to @ workspace scoping. S3 deployment is more reliable.

## Current Setup

Your account is configured with:
- **Region**: eu-north-1
- **Account ID**: 595105651762
- **IAM User**: imperfectform
- **Missing Permission**: S3 access for deployment buckets

## Troubleshooting

### "RequestEntityTooLargeException"
Package is >70MB. Use S3 deployment (`deploy-s3.sh`).

### "User is not authorized to perform: s3:ListBuckets"
The policy is too restrictive. Add:
```json
{
  "Effect": "Allow",
  "Action": "s3:ListAllMyBuckets",
  "Resource": "*"
}
```

### "NoSuchBucket"
The S3 bucket doesn't exist yet. Run `./deploy-s3.sh` - it creates it automatically.

## Production Deployment

For production, consider:

1. **Use ECR + Lambda container images** (up to 10GB)
   - Better for very large packages
   - Slightly higher cost

2. **Vendor dependencies** in source control
   - Trade storage for faster deployments
   - Not recommended for this size

3. **Monorepo optimization**
   - Split into multiple Lambda functions
   - Share layers for common deps

## Monitoring

View deployment status:

```bash
# Check Lambda function
aws lambda get-function-configuration \
  --function-name imperfect-coach-premium-analysis \
  --region eu-north-1 \
  --query 'LastModified,CodeSize'

# View logs
aws logs tail /aws/lambda/imperfect-coach-premium-analysis \
  --follow --region eu-north-1

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=imperfect-coach-premium-analysis \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region eu-north-1
```

## References

- [AWS Lambda Deployment Packages](https://docs.aws.amazon.com/lambda/latest/dg/python-package.html)
- [Lambda Layers](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-layers.html)
- [S3 as Lambda Deployment Source](https://docs.aws.amazon.com/lambda/latest/dg/API_FunctionCode.html)
