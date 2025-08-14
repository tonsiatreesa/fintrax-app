#!/bin/bash

# AWS RDS PostgreSQL Setup Script for Fintr Microservices
# This script helps you create an AWS RDS PostgreSQL instance

echo "🚀 Setting up AWS RDS PostgreSQL for Fintr Microservices"
echo "========================================================"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first:"
    echo "   curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'"
    echo "   unzip awscliv2.zip"
    echo "   sudo ./aws/install"
    exit 1
fi

echo "✅ AWS CLI found"

# Check if user is authenticated
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run:"
    echo "   aws configure"
    echo "   And provide your AWS Access Key ID, Secret Access Key, and region"
    exit 1
fi

echo "✅ AWS CLI configured"

# Set variables
DB_INSTANCE_IDENTIFIER="fintr-microservices-db"
DB_NAME="fintr"
DB_USERNAME="postgres"
DB_PASSWORD="$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-25)"
DB_INSTANCE_CLASS="db.t3.micro"  # Free tier eligible
VPC_SECURITY_GROUP_ID=""

echo ""
echo "📋 Database Configuration:"
echo "   Instance ID: $DB_INSTANCE_IDENTIFIER"
echo "   Database Name: $DB_NAME"
echo "   Username: $DB_USERNAME"
echo "   Password: $DB_PASSWORD"
echo "   Instance Class: $DB_INSTANCE_CLASS"
echo ""

# Get default VPC
echo "🔍 Finding default VPC..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)

if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
    echo "❌ No default VPC found. Creating one..."
    VPC_ID=$(aws ec2 create-default-vpc --query 'Vpc.VpcId' --output text)
fi

echo "✅ VPC ID: $VPC_ID"

# Create security group for RDS
echo "🔒 Creating security group for RDS..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name fintr-rds-sg \
    --description "Security group for Fintr RDS PostgreSQL" \
    --vpc-id $VPC_ID \
    --query 'GroupId' --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=fintr-rds-sg" \
    --query 'SecurityGroups[0].GroupId' --output text)

echo "✅ Security Group ID: $SECURITY_GROUP_ID"

# Add inbound rule for PostgreSQL (port 5432)
echo "🔓 Adding PostgreSQL access rule..."
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0 2>/dev/null || echo "   (Rule may already exist)"

# Create DB subnet group
echo "🌐 Creating DB subnet group..."
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[].SubnetId' --output text)
SUBNET_ARRAY=($SUBNETS)

aws rds create-db-subnet-group \
    --db-subnet-group-name fintr-db-subnet-group \
    --db-subnet-group-description "Subnet group for Fintr RDS" \
    --subnet-ids ${SUBNET_ARRAY[@]} 2>/dev/null || echo "   (Subnet group may already exist)"

# Create RDS instance
echo "🗄️  Creating RDS PostgreSQL instance..."
echo "   This will take several minutes..."

aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --db-instance-class $DB_INSTANCE_CLASS \
    --engine postgres \
    --engine-version 15.4 \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids $SECURITY_GROUP_ID \
    --db-subnet-group-name fintr-db-subnet-group \
    --db-name $DB_NAME \
    --backup-retention-period 7 \
    --no-multi-az \
    --publicly-accessible \
    --storage-encrypted \
    --auto-minor-version-upgrade

echo "⏳ Waiting for RDS instance to be available..."
aws rds wait db-instance-available --db-instance-identifier $DB_INSTANCE_IDENTIFIER

# Get the endpoint
ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --query 'DBInstances[0].Endpoint.Address' --output text)

echo ""
echo "🎉 RDS PostgreSQL instance created successfully!"
echo "=============================================="
echo ""
echo "📋 Connection Details:"
echo "   Endpoint: $ENDPOINT"
echo "   Port: 5432"
echo "   Database: $DB_NAME"
echo "   Username: $DB_USERNAME"
echo "   Password: $DB_PASSWORD"
echo ""
echo "🔗 DATABASE_URL:"
echo "postgresql://$DB_USERNAME:$DB_PASSWORD@$ENDPOINT:5432/$DB_NAME"
echo ""
echo "💡 Next Steps:"
echo "1. Copy the DATABASE_URL above"
echo "2. Update your .env files with this URL"
echo "3. Run database migrations"
echo ""
echo "💰 Cost Information:"
echo "   - Instance: ~$13/month (db.t3.micro)"
echo "   - Storage: ~$2/month (20GB GP2)"
echo "   - Backups: Free (7 days)"
echo ""
echo "🗑️  To delete this instance later:"
echo "   aws rds delete-db-instance --db-instance-identifier $DB_INSTANCE_IDENTIFIER --skip-final-snapshot"

# Save credentials to file
cat > aws-rds-credentials.txt << EOF
# AWS RDS PostgreSQL Credentials for Fintr Microservices
# Generated on $(date)

ENDPOINT=$ENDPOINT
DATABASE_NAME=$DB_NAME
USERNAME=$DB_USERNAME
PASSWORD=$DB_PASSWORD
PORT=5432

# Complete DATABASE_URL
DATABASE_URL=postgresql://$DB_USERNAME:$DB_PASSWORD@$ENDPOINT:5432/$DB_NAME

# Security Group ID: $SECURITY_GROUP_ID
# Instance Identifier: $DB_INSTANCE_IDENTIFIER
EOF

echo "💾 Credentials saved to: aws-rds-credentials.txt"
