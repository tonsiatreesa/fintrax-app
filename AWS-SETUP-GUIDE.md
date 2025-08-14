# 🚀 Fintr Microservices - AWS Setup Guide

## Overview
This guide will help you set up your Fintr microservices with:
- ✅ Your real Clerk authentication keys
- ✅ AWS RDS PostgreSQL database
- ✅ Production-ready configuration

## Prerequisites
- AWS CLI installed and configured
- Docker and Docker Compose
- Your Clerk API keys

## Step 1: Configure AWS CLI

If you haven't already, install and configure AWS CLI:

```bash
# Install AWS CLI (if not installed)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key  
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

## Step 2: Create AWS RDS PostgreSQL Database

Run the automated setup script:

```bash
./setup-aws-rds.sh
```

This script will:
- Create a PostgreSQL RDS instance
- Set up security groups
- Generate secure credentials
- Provide you with the DATABASE_URL

**Expected output:** You'll get a DATABASE_URL like:
```
postgresql://postgres:generated_password@fintr-db.xyz.rds.amazonaws.com:5432/fintr
```

## Step 3: Configure Environment Variables

### 3.1 Copy the template and add your keys:

```bash
cp .env.local.template .env.local
```

### 3.2 Edit `.env.local` with your actual values:

```bash
# ===== DATABASE (from Step 2) =====
DATABASE_URL=postgresql://postgres:your_password@your-rds-endpoint.region.rds.amazonaws.com:5432/fintr

# ===== CLERK AUTHENTICATION (your real keys) =====
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_real_publishable_key
CLERK_SECRET_KEY=sk_test_your_real_secret_key

# ===== PLAID (if you have them) =====
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# Other settings are pre-configured
```

### 3.3 Update all microservice environments:

```bash
# Copy the DATABASE_URL to all services
echo "DATABASE_URL=your_aws_database_url_here" > services/account-service/.env
echo "DATABASE_URL=your_aws_database_url_here" > services/transaction-service/.env
echo "DATABASE_URL=your_aws_database_url_here" > services/category-service/.env
echo "DATABASE_URL=your_aws_database_url_here" > services/analytics-service/.env
echo "DATABASE_URL=your_aws_database_url_here" > services/plaid-service/.env
echo "DATABASE_URL=your_aws_database_url_here" > services/subscription-service/.env
```

## Step 4: Migrate Database Schema

Run the migration script:

```bash
./migrate-to-aws.sh
```

This will:
- Set up all database tables
- Optionally seed with sample data
- Verify connections

## Step 5: Update and Restart Services

```bash
# Update frontend environment
cp .env.local frontend/.env.local

# Rebuild and restart all services
docker-compose down
docker-compose build
docker-compose up -d
```

## Step 6: Test Everything

```bash
# Run comprehensive tests
./test-local.sh

# Test individual services
curl http://localhost:4000/health  # API Gateway
curl http://localhost:4002/health  # Account Service
curl http://localhost:3000         # Frontend
```

## Step 7: Verify Clerk Authentication

1. Open http://localhost:3000 in your browser
2. Try to sign up/sign in
3. Check if authentication works properly

## 🎯 Expected Results

After completing all steps:

- ✅ AWS RDS PostgreSQL database running
- ✅ All microservices connected to AWS database
- ✅ Clerk authentication working with your real keys
- ✅ Frontend communicating with microservices
- ✅ Ready for production deployment

## 📋 Troubleshooting

### Database Connection Issues:
```bash
# Test database connection directly
psql "postgresql://username:password@your-endpoint:5432/fintr"
```

### Service Issues:
```bash
# Check service logs
docker-compose logs api-gateway
docker-compose logs account-service
```

### Authentication Issues:
- Verify Clerk keys are correct
- Check Clerk dashboard for webhook URLs
- Ensure CORS is properly configured

## 💰 AWS Costs

Estimated monthly costs:
- RDS db.t3.micro: ~$13/month
- Storage (20GB): ~$2/month
- Data transfer: Minimal for development

## 🗑️ Cleanup (when done testing)

To avoid charges, delete the RDS instance:

```bash
aws rds delete-db-instance \
  --db-instance-identifier fintr-microservices-db \
  --skip-final-snapshot
```

## 🚀 Next Steps

Once everything is working:
1. Set up AWS EKS for Kubernetes deployment
2. Configure CI/CD pipelines
3. Set up monitoring and logging
4. Configure custom domain and SSL

---

## 📞 Need Help?

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify environment variables are set correctly
3. Test database connectivity separately
4. Ensure AWS credentials are configured properly
