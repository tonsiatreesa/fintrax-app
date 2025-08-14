#!/bin/bash

# FinTrax ECR Public Repositories Setup Script
# This script deploys CloudFormation stack to create ECR Public repositories

set -e

echo "🏗️  FinTrax ECR Public Repositories Setup"
echo "========================================"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"

# Get current region and switch to us-east-1 for ECR Public
CURRENT_REGION=$(aws configure get region)
ECR_REGION="us-east-1"

echo "ℹ️  Note: ECR Public repositories must be created in us-east-1"
echo "ℹ️  Current region: $CURRENT_REGION"
echo "ℹ️  ECR region: $ECR_REGION"

# Environment selection
echo ""
echo "Select environment to create ECR repositories:"
echo "1) All environments (dev + staging + prod) - Recommended"
echo "2) Development only"
echo "3) Staging only" 
echo "4) Production only"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        ENVIRONMENT="all"
        STACK_NAME="fintrax-ecr-all"
        PARAMS_FILE="parameters-ecr-all.json"
        ;;
    2)
        ENVIRONMENT="dev"
        STACK_NAME="fintrax-ecr-dev"
        PARAMS_FILE="parameters-ecr-dev.json"
        ;;
    3)
        ENVIRONMENT="staging"
        STACK_NAME="fintrax-ecr-staging"
        PARAMS_FILE="parameters-ecr-staging.json"
        ;;
    4)
        ENVIRONMENT="prod"
        STACK_NAME="fintrax-ecr-prod"
        PARAMS_FILE="parameters-ecr-prod.json"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎯 Selected: $ENVIRONMENT environment(s)"
echo "📦 Stack name: $STACK_NAME"
echo "⚙️  Parameters: $PARAMS_FILE"

# Validate CloudFormation template
echo ""
echo "🔍 Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://ecr-repositories.yml \
    --region $ECR_REGION

echo "✅ Template validation successful"

# Deploy the stack
echo ""
echo "🚀 Deploying ECR repositories stack..."
echo "⏳ This may take a few minutes..."

aws cloudformation deploy \
    --template-file ecr-repositories.yml \
    --stack-name $STACK_NAME \
    --parameter-overrides file://$PARAMS_FILE \
    --region $ECR_REGION \
    --no-fail-on-empty-changeset

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ECR repositories stack deployed successfully!"
    
    # Get stack outputs
    echo ""
    echo "📋 Repository Information:"
    echo "========================="
    
    aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $ECR_REGION \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table
    
    echo ""
    echo "🎯 Next Steps:"
    echo "=============="
    echo "1. Your ECR Public repositories are now ready"
    echo "2. CI/CD pipeline will automatically push images to these repositories"
    echo "3. Images will be available at: public.ecr.aws/fintrax/{env}-{service}:latest"
    echo ""
    echo "📚 Example Usage:"
    case $ENVIRONMENT in
        "all"|"dev")
            echo "   docker pull public.ecr.aws/fintrax/dev-frontend:latest"
            echo "   docker pull public.ecr.aws/fintrax/dev-api-gateway:latest"
            ;;
    esac
    case $ENVIRONMENT in
        "all"|"staging")
            echo "   docker pull public.ecr.aws/fintrax/staging-frontend:latest"
            echo "   docker pull public.ecr.aws/fintrax/staging-api-gateway:latest"
            ;;
    esac
    case $ENVIRONMENT in
        "all"|"prod")
            echo "   docker pull public.ecr.aws/fintrax/prod-frontend:latest"
            echo "   docker pull public.ecr.aws/fintrax/prod-api-gateway:latest"
            ;;
    esac
    
    echo ""
    echo "🎉 ECR setup complete! Ready for CI/CD deployments."
    
else
    echo ""
    echo "❌ Stack deployment failed!"
    echo "Check AWS CloudFormation console for details: https://console.aws.amazon.com/cloudformation"
    exit 1
fi
