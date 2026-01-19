# Imperfect Coach AWS Lambda Functions

This directory contains the AWS Lambda functions for the Imperfect Coach application, implementing privacy-enhanced AI agent services with x402 payment verification.

## Directory Structure

```
aws-lambda/
├── src/
│   ├── handlers/           # Lambda function entry points
│   │   ├── agent-coach-handler.mjs    # Main AI coach agent handler
│   │   ├── index.mjs                 # Alternative entry point
│   │   └── agent-discovery.js        # Agent discovery functionality
│   ├── lib/                # Shared libraries and utilities
│   │   ├── core-agent-handler.mjs    # Core agent logic and privacy features
│   │   ├── signature-verification.mjs # Cryptographic signature verification
│   │   ├── dynamodb-service.mjs      # DynamoDB interaction utilities
│   │   ├── x402-config.mjs          # x402 payment configuration
│   │   └── agents.mjs               # Agent registry and management
│   └── types/              # TypeScript definitions (if applicable)
├── layers/                 # Lambda layers for shared dependencies
│   └── shared-dependencies/ # Common packages shared across functions
├── tests/                  # Test suite
│   ├── unit/               # Unit tests
│   │   ├── lib/            # Library unit tests
│   │   └── handlers/       # Handler unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
│       ├── test-booking-flow.mjs
│       ├── test-e2e-specialist-call.mjs
│       ├── test-privacy-verification.mjs
│       └── ...             # Other end-to-end tests
├── deployment/             # Deployment configuration and scripts
│   ├── scripts/            # Deployment automation scripts
│   │   ├── build.sh        # Build and bundle functions
│   │   ├── deploy-core.sh  # Deploy core agent function
│   │   ├── deploy-agent.sh # Deploy agent coach function
│   │   └── setup-dynamodb.sh # DynamoDB setup script
│   ├── infrastructure/     # IaC templates (Terraform/CloudFormation)
│   └── config/             # Environment configuration
│       └── .env.example    # Environment variable template
├── docs/                   # Documentation
│   └── DYNAMODB_INTEGRATION.md # DynamoDB integration guide
├── utils/                  # Utility scripts
├── Dockerfile              # Container configuration (if applicable)
├── package.json            # Project dependencies and scripts
└── README.md               # This file
```

## Key Features

### Privacy-Enhanced Payments
- **x402 Payment Protocol**: Implements the x402 payment standard for blockchain-based micropayments
- **Privacy Cash Integration**: Supports Privacy Cash SDK for private Solana transactions
- **Multi-Chain Support**: Works with Base, Avalanche, and Solana networks
- **Dual Payment Modes**: Supports both public and private payment modes

### AI Agent Services
- **Autonomous Coaching**: AI-powered fitness coaching with multi-step reasoning
- **Specialist Agent Integration**: Calls specialist agents for nutrition, biomechanics, etc.
- **SLA Tracking**: Monitors service level agreements for agent performance
- **Reputation System**: Tracks agent reputation and quality metrics

## Environment Variables

See `deployment/config/.env.example` for required environment variables.

Key variables include:
- `BEDROCK_MODEL_ID`: Amazon Bedrock model to use
- `CDP_API_KEY_ID` / `CDP_API_KEY_SECRET`: Coinbase Developer Platform credentials
- `AGENT_WALLET_KEY`: Agent wallet private key
- `PRIVACY_FEATURES_ENABLED`: Flag to enable privacy features

## Deployment

To deploy the Lambda functions:

1. Ensure AWS credentials are configured
2. Run the build script: `./deployment/scripts/build.sh`
3. Deploy the core function: `./deployment/scripts/deploy-core.sh`
4. Deploy the agent function: `./deployment/scripts/deploy-agent.sh`

## Testing

Unit tests are located in `tests/unit/`
Integration tests are in `tests/integration/`
End-to-end tests are in `tests/e2e/`

Run tests with: `npm test` (as configured in package.json)