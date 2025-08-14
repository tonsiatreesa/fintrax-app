# Fintr Microservices Architecture

A modern financial management application built with microservices architecture, featuring direct PostgreSQL connections and Clerk authentication.

## 🏗️ Architecture Overview

```
Frontend (Next.js) → API Gateway → Microservices → PostgreSQL Database
```

- **Direct Database Connections**: No ORM overhead, raw SQL for performance
- **Container-First**: All services run in Docker containers
- **Authentication**: Clerk integration with JWT tokens
- **API Gateway**: Centralized routing with CORS support

## 🚀 Quick Start

```bash
# Start all services
docker-compose up --build

# Access the application
open http://localhost:3000

# API Gateway (for direct API access)
curl http://localhost:4000/api/accounts/demo
```

## 📊 Services

| Service | Port | Purpose | Database Access |
|---------|------|---------|----------------|
| Frontend | 3000 | Next.js web application | Via API Gateway |
| API Gateway | 4000 | Request routing & CORS | No |
| Account Service | 4002 | Account management | Direct PostgreSQL |
| Transaction Service | 4003 | Financial transactions | Direct PostgreSQL |
| Category Service | 4004 | Transaction categorization | Direct PostgreSQL |
| Analytics Service | 4005 | Financial analytics | Direct PostgreSQL |
| Plaid Service | 4006 | Bank integrations | Direct PostgreSQL |
| Subscription Service | 4007 | User billing | Direct PostgreSQL |
| PostgreSQL | 5432 | Primary database | - |

## 🗄️ Database

- **Engine**: PostgreSQL 15
- **Schema**: Complete financial data model (see `schema.sql`)
- **Sample Data**: 3 accounts, 8 categories, 25 realistic transactions
- **Connection**: Direct via `pg` library (no ORM)

### Sample Data Included:
- **Accounts**: Chase Checking, Savings Account, Credit Card
- **Categories**: Food & Dining, Transportation, Shopping, Entertainment, etc.
- **Transactions**: Coffee purchases, ride shares, salary deposits, bills

## 🔧 Development

### Running Individual Services
```bash
# Start only database
docker-compose up postgres

# Start specific service
docker-compose up account-service

# Rebuild after code changes
docker-compose up --build account-service
```

### Environment Configuration
- **Local**: `.env` (included, ready to use)
- **Production**: `.env.production` (AWS RDS ready)
- **Template**: `.env.example` (for new deployments)

### Adding New Services
1. Create service directory in `services/`
2. Add Dockerfile and package.json
3. Implement database utilities from existing services
4. Add service to `docker-compose.yml`
5. Update API Gateway routing

## 🌐 API Endpoints

### Authenticated Endpoints (require Clerk token)
```bash
GET /api/accounts          # User's accounts
GET /api/transactions      # User's transactions
GET /api/categories        # User's categories
POST /api/accounts         # Create account
POST /api/transactions     # Create transaction
```

### Demo Endpoints (no authentication)
```bash
GET /api/accounts/demo     # Sample accounts
GET /api/transactions/demo # Sample transactions  
GET /api/categories/demo   # Sample categories
```

### Health Checks
```bash
GET /api/accounts/health   # Account service status
GET /api/transactions/health # Transaction service status
GET /api/categories/health # Category service status
```

## 🚀 Production Deployment

### AWS RDS Setup
```bash
# Configure AWS credentials first
aws configure

# Create RDS instance (included script)
./setup-aws-rds.sh
```

### Environment Updates
1. Update `DATABASE_URL` to point to AWS RDS
2. Set `NODE_ENV=production`
3. Configure SSL certificates
4. Update CORS origins for production domains

## 🔒 Security Features

- **Authentication**: Clerk JWT validation on all protected endpoints
- **Database**: Connection pooling with SSL support
- **CORS**: Properly configured for frontend domain
- **Environment**: Sensitive data in environment variables
- **Health Checks**: Database connectivity monitoring

## 📁 Project Structure

```
microservices_root/
├── services/
│   ├── account-service/     # Account management
│   ├── transaction-service/ # Financial transactions
│   ├── category-service/    # Transaction categories
│   ├── analytics-service/   # Financial analytics
│   ├── plaid-service/      # Bank integrations
│   ├── subscription-service/ # User billing
│   └── api-gateway/        # Request routing
├── frontend/               # Next.js application
├── schema.sql             # Database schema
├── docker-compose.yml     # Service orchestration
└── setup-aws-rds.sh      # AWS deployment script
```

## 🧪 Testing

```bash
# Test all services
curl http://localhost:4000/api/accounts/demo
curl http://localhost:4000/api/transactions/demo
curl http://localhost:4000/api/categories/demo

# Health checks
curl http://localhost:4002/health
curl http://localhost:4003/health
curl http://localhost:4004/health
```

## 📈 Performance Features

- **Connection Pooling**: Efficient database connections
- **Direct SQL**: No ORM overhead
- **Container Isolation**: Independent service scaling
- **Health Monitoring**: Database connectivity checks
- **Graceful Shutdown**: Proper connection cleanup

## 🎯 Key Benefits

1. **No ORM Complexity**: Direct SQL control for performance
2. **Microservices Architecture**: Independent scaling and deployment
3. **Production Ready**: SSL, health checks, graceful shutdown
4. **Real Sample Data**: Comprehensive test dataset included
5. **AWS Ready**: RDS deployment scripts included

---

**Status**: ✅ Production Ready - Drizzle ORM removed, direct PostgreSQL connections implemented
