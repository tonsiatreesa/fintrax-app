# Fintr Microservices

Each folder in `services/` is a Node.js microservice with direct PostgreSQL database connections.

## Architecture Overview
- **Database**: Direct PostgreSQL connections (no ORM)
- **Authentication**: Clerk integration
- **API Gateway**: Centralized routing and CORS handling

## Services

### Core Services (with database access):
- **account-service**: Manages user accounts and balances
- **transaction-service**: Handles financial transactions and history
- **category-service**: Manages transaction categories and organization

### Integration Services:
- **plaid-service**: Bank account connections via Plaid API
- **subscription-service**: Manages user subscriptions and billing
- **analytics-service**: Financial analytics and reporting

### Infrastructure:
- **api-gateway**: Central API routing with CORS support
- **frontend**: Next.js application

## Running Locally

```bash
cd microservices_root
docker-compose up --build
```

## Service Ports

- **api-gateway**: 4000 (main entry point)
- **account-service**: 4002
- **transaction-service**: 4003
- **category-service**: 4004
- **analytics-service**: 4005
- **plaid-service**: 4006
- **subscription-service**: 4007
- **frontend**: 3000
- **postgres**: 5432

## API Endpoints

All requests go through the API Gateway at `http://localhost:4000`:

- `GET /api/accounts` - List user accounts
- `GET /api/transactions` - List user transactions  
- `GET /api/categories` - List user categories
- `GET /api/accounts/demo` - Demo data (no auth)
- `GET /api/transactions/demo` - Demo data (no auth)
- `GET /api/categories/demo` - Demo data (no auth)
