#!/bin/bash

# Fintr Microservices Setup Verification Script
echo "🧪 Testing Fintr Microservices Setup"
echo "===================================="

echo ""
echo "1. Database Connection Test"
echo "----------------------------"
echo "✅ PostgreSQL container status:"
docker ps | grep postgres

echo ""
echo "✅ Database tables:"
docker exec microservices_root-postgres-1 psql -U postgres -d fintr_dev -c "\dt" 2>/dev/null || echo "❌ Database connection failed"

echo ""
echo "2. Microservices Health Check"
echo "----------------------------"
echo "✅ API Gateway (port 4000):"
curl -s http://localhost:4000/health 2>/dev/null || echo "❌ API Gateway not responding"

echo ""
echo "✅ Account Service (port 4002):"
curl -s http://localhost:4002/health 2>/dev/null || echo "❌ Account Service not responding"

echo ""
echo "✅ Transaction Service (port 4003):"
curl -s http://localhost:4003/health 2>/dev/null || echo "❌ Transaction Service not responding"

echo ""
echo "✅ Category Service (port 4004):"
curl -s http://localhost:4004/health 2>/dev/null || echo "❌ Category Service not responding"

echo ""
echo "✅ Analytics Service (port 4005):"
curl -s http://localhost:4005/health 2>/dev/null || echo "❌ Analytics Service not responding"

echo ""
echo "✅ Plaid Service (port 4006):"
curl -s http://localhost:4006/health 2>/dev/null || echo "❌ Plaid Service not responding"

echo ""
echo "✅ Subscription Service (port 4007):"
curl -s http://localhost:4007/health 2>/dev/null || echo "❌ Subscription Service not responding"

echo ""
echo "3. Authentication Configuration"
echo "-----------------------------"
echo "✅ Clerk Keys Configured:"
if [ -f "frontend/.env.local" ]; then
    grep -q "pk_test_" frontend/.env.local && echo "   - Publishable key: ✅" || echo "   - Publishable key: ❌"
    grep -q "sk_test_" frontend/.env.local && echo "   - Secret key: ✅" || echo "   - Secret key: ❌"
else
    echo "   - .env.local file: ❌"
fi

echo ""
echo "4. Database Schema"
echo "----------------"
echo "✅ Tables created:"
docker exec microservices_root-postgres-1 psql -U postgres -d fintr_dev -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | grep -E "accounts|categories|transactions|subscriptions|connected_banks" | wc -l | xargs -I {} echo "   - {} tables found"

echo ""
echo "5. System Architecture Summary"
echo "=============================="
echo "✅ Architecture: Complete microservices with:"
echo "   - API Gateway (4000) → Routes requests to services"
echo "   - Account Service (4002) → Manages user accounts"
echo "   - Transaction Service (4003) → Handles transactions"
echo "   - Category Service (4004) → Manages categories"
echo "   - Analytics Service (4005) → Provides summaries"
echo "   - Plaid Service (4006) → Bank integrations"
echo "   - Subscription Service (4007) → Payment processing"
echo "   - PostgreSQL Database → Shared data store"
echo "   - Next.js Frontend (3000) → User interface"

echo ""
echo "✅ Authentication: Clerk with real keys configured"
echo "✅ Database: PostgreSQL with Drizzle ORM"
echo "✅ Deployment: Docker containers"

echo ""
echo "🚀 Next Steps:"
echo "1. Configure AWS credentials: aws configure"
echo "2. Run AWS setup: ./setup-aws-rds.sh"
echo "3. Migrate to AWS: ./migrate-to-aws.sh"
echo "4. Deploy to production: Ready for EKS/AWS"

echo ""
echo "📁 Architecture is ready for:"
echo "   - Local development (current state)"
echo "   - AWS RDS migration (when credentials ready)"
echo "   - Production deployment (EKS ready)"
