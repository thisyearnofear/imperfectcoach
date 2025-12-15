terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment" {
  type        = string
  description = "Environment (dev, staging, prod)"
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "enable_pitr" {
  type        = bool
  description = "Enable Point-in-Time Recovery"
  default     = false
}

variable "enable_ttl" {
  type        = bool
  description = "Enable TTL for auto-cleanup"
  default     = true
}

# DynamoDB Table for Agent Registry
resource "aws_dynamodb_table" "agent_registry" {
  name           = "AgentRegistry-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"  # Auto-scaling
  hash_key       = "agentId"

  # Primary attributes
  attribute {
    name = "agentId"
    type = "S"
  }

  attribute {
    name = "type"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "lastHeartbeat"
    type = "N"
  }

  attribute {
    name = "registeredAt"
    type = "N"
  }

  # Global Secondary Index: Query by type (core/dynamic)
  global_secondary_index {
    name            = "TypeIndex"
    hash_key        = "type"
    range_key       = "registeredAt"
    projection_type = "ALL"
  }

  # Global Secondary Index: Find stale agents
  global_secondary_index {
    name            = "StatusHeartbeatIndex"
    hash_key        = "status"
    range_key       = "lastHeartbeat"
    projection_type = "ALL"
  }

  # Point-in-Time Recovery (backup)
  point_in_time_recovery {
    enabled = var.enable_pitr
  }

  # TTL for auto-cleanup of inactive agents
  ttl {
    attribute_name = "expiresAt"
    enabled        = var.enable_ttl
  }

  tags = {
    Service     = "agent-registry"
    Environment = var.environment
  }
}

# IAM Role for Lambda to access the table
resource "aws_iam_role" "lambda_agent_registry_role" {
  name = "lambda-agent-registry-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Lambda DynamoDB access
resource "aws_iam_role_policy" "lambda_dynamodb_policy" {
  name = "lambda-dynamodb-policy-${var.environment}"
  role = aws_iam_role.lambda_agent_registry_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem"
        ]
        Resource = [
          aws_dynamodb_table.agent_registry.arn,
          "${aws_dynamodb_table.agent_registry.arn}/index/*"
        ]
      }
    ]
  })
}

# Outputs
output "agent_registry_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.agent_registry.name
}

output "agent_registry_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.agent_registry.arn
}

output "lambda_role_arn" {
  description = "IAM role ARN for Lambda"
  value       = aws_iam_role.lambda_agent_registry_role.arn
}
