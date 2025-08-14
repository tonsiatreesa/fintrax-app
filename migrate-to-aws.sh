#!/bin/bash

# Database Migration Script for AWS RDS
# This script sets up the database schema and initial data

echo "🗄️  Fintr Database Migration to AWS RDS"
echo "======================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create one with your AWS RDS DATABASE_URL"
    echo "   You can copy from .env.production or .env.local.template"
    exit 1
fi

# Load environment variables
source .env

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env file"
    exit 1
fi

echo "✅ Using database: $DATABASE_URL"

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🔄 Running database migrations..."

# Generate migrations if needed
echo "📝 Generating migration files..."
npx drizzle-kit generate

# Push schema to database
echo "📤 Pushing schema to AWS RDS..."
npx drizzle-kit push

# Optional: Seed database with sample data
read -p "🌱 Do you want to seed the database with sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    
    # Create a simple seed script
    cat > temp_seed.js << 'EOF'
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { accounts, categories, transactions } = require('./shared/schema.js');
const { createId } = require('@paralleldrive/cuid2');

async function seed() {
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);
    
    console.log('🌱 Seeding database...');
    
    try {
        // Create sample categories
        const sampleCategories = [
            { id: createId(), name: 'Food & Dining', userId: 'sample_user' },
            { id: createId(), name: 'Transportation', userId: 'sample_user' },
            { id: createId(), name: 'Shopping', userId: 'sample_user' },
            { id: createId(), name: 'Entertainment', userId: 'sample_user' },
            { id: createId(), name: 'Bills & Utilities', userId: 'sample_user' },
            { id: createId(), name: 'Income', userId: 'sample_user' },
        ];
        
        console.log('📁 Creating categories...');
        await db.insert(categories).values(sampleCategories);
        
        // Create sample accounts
        const sampleAccounts = [
            { id: createId(), name: 'Checking Account', userId: 'sample_user' },
            { id: createId(), name: 'Savings Account', userId: 'sample_user' },
            { id: createId(), name: 'Credit Card', userId: 'sample_user' },
        ];
        
        console.log('🏦 Creating accounts...');
        await db.insert(accounts).values(sampleAccounts);
        
        console.log('✅ Database seeded successfully!');
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await client.end();
    }
}

seed();
EOF
    
    node temp_seed.js
    rm temp_seed.js
fi

echo ""
echo "🎉 Database migration completed!"
echo "================================"
echo ""
echo "✅ Your AWS RDS PostgreSQL database is ready!"
echo "✅ Schema has been created"
echo "✅ Microservices can now connect to AWS RDS"
echo ""
echo "🔗 Next steps:"
echo "1. Update all microservice .env files with the new DATABASE_URL"
echo "2. Restart your microservices: docker-compose restart"
echo "3. Test the connections: ./test-local.sh"
