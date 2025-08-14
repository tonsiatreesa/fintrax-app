# FinTrax AWS Infrastructure Deployment

## 🆓 Free Tier Deployment (Recommended)

Deploy infrastructure that stays within AWS Free Tier limits.

### 1. Validate the template
```bash
aws cloudformation validate-template --template-body file://free-tier-infrastructure.yml
```

### 2. Create the stack
```bash
aws cloudformation create-stack \
  --stack-name fintrax-free-tier-dev \
  --template-body file://free-tier-infrastructure.yml \
  --parameters file://parameters-free-tier-dev.json \
  --tags Key=Environment,Value=dev Key=Project,Value=FinTrax Key=Tier,Value=FreeTier
```

### 3. Monitor deployment progress
```bash
aws cloudformation describe-stacks --stack-name fintrax-free-tier-dev --query 'Stacks[0].StackStatus'
```

### 4. Get database connection details
```bash
aws cloudformation describe-stacks \
  --stack-name fintrax-free-tier-dev \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table
```

### 5. Get just the database endpoint
```bash
aws cloudformation describe-stacks \
  --stack-name fintrax-free-tier-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text
```

## 💰 Full Infrastructure (with costs)

If you prefer the full setup with private subnets and NAT gateways (~$65/month):

### 1. Validate template
```bash
aws cloudformation validate-template --template-body file://complete-infrastructure.yml
```

### 2. Create stack
```bash
aws cloudformation create-stack \
  --stack-name fintrax-infrastructure-dev \
  --template-body file://complete-infrastructure.yml \
  --parameters file://parameters-complete-dev.json \
  --capabilities CAPABILITY_IAM \
  --tags Key=Environment,Value=dev Key=Project,Value=FinTrax
```

## 🔄 Stack Management Commands

### Update a stack
```bash
aws cloudformation update-stack \
  --stack-name fintrax-free-tier-dev \
  --template-body file://free-tier-infrastructure.yml \
  --parameters file://parameters-free-tier-dev.json
```

### Delete a stack
```bash
aws cloudformation delete-stack --stack-name fintrax-free-tier-dev
```

### Check if stack exists
```bash
aws cloudformation describe-stacks --stack-name fintrax-free-tier-dev
```

## 📊 What Gets Created (Free Tier)

- ✅ **VPC** with DNS support
- ✅ **2 Public Subnets** in different AZs  
- ✅ **Internet Gateway** for internet access
- ✅ **Security Groups** (database only accessible from app)
- ✅ **RDS PostgreSQL** (db.t3.micro, 20GB, single AZ)
- ✅ **No NAT Gateways** (saves ~$45/month)
- ✅ **No enhanced monitoring** (free tier)

## 🔗 Database Connection Info

After deployment, your database will be accessible at:
- **Host**: `{stack-outputs-DatabaseEndpoint}`
- **Port**: `5432`
- **Database**: `fintrax`
- **Username**: `postgres`
- **Password**: `Nidhun@123456789`

## 🛡️ Security Notes

- Database is in public subnet but **NOT publicly accessible**
- Only accessible from application security group
- Security group restricts access to port 5432 from app servers only
- No inbound internet access to database

## 💡 Next Steps

1. Deploy the infrastructure using commands above
2. Get the database endpoint from stack outputs
3. Update your application's database connection string
4. Migrate your local data to RDS (optional)
