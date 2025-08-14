-- Fintr Database Schema
-- PostgreSQL schema for direct connection (no Drizzle)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for reference, but we'll use Clerk for auth)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),
    plaid_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount INTEGER NOT NULL, -- Amount in cents
    payee VARCHAR(255) NOT NULL,
    notes TEXT,
    date DATE NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    category_id VARCHAR(255),
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Connected banks table (for Plaid integration)
CREATE TABLE IF NOT EXISTS connected_banks (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    item_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    lemon_squeezy_id VARCHAR(255),
    order_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_connected_banks_user_id ON connected_banks(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_connected_banks_updated_at BEFORE UPDATE ON connected_banks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
-- Sample accounts
INSERT INTO accounts (id, name, user_id, plaid_id) VALUES 
('acc_1', 'Chase Checking', 'user_demo_123', 'plaid_acc_1'),
('acc_2', 'Savings Account', 'user_demo_123', 'plaid_acc_2'),
('acc_3', 'Credit Card', 'user_demo_123', 'plaid_acc_3')
ON CONFLICT (id) DO NOTHING;

-- Sample categories  
INSERT INTO categories (id, name, user_id) VALUES
('cat_1', 'Food & Dining', 'user_demo_123'),
('cat_2', 'Transportation', 'user_demo_123'),
('cat_3', 'Shopping', 'user_demo_123'),
('cat_4', 'Entertainment', 'user_demo_123'),
('cat_5', 'Bills & Utilities', 'user_demo_123'),
('cat_6', 'Healthcare', 'user_demo_123'),
('cat_7', 'Groceries', 'user_demo_123'),
('cat_8', 'Income', 'user_demo_123')
ON CONFLICT (id) DO NOTHING;

-- Sample transactions
INSERT INTO transactions (id, amount, payee, notes, date, account_id, category_id, user_id) VALUES
('txn_1', -4500, 'Starbucks', 'Morning coffee', '2025-08-13', 'acc_1', 'cat_1', 'user_demo_123'),
('txn_2', -12500, 'Uber', 'Ride to airport', '2025-08-13', 'acc_1', 'cat_2', 'user_demo_123'),
('txn_3', -8900, 'Amazon', 'Office supplies', '2025-08-12', 'acc_3', 'cat_3', 'user_demo_123'),
('txn_4', -15600, 'Netflix & Spotify', 'Monthly subscriptions', '2025-08-12', 'acc_1', 'cat_4', 'user_demo_123'),
('txn_5', -125000, 'Electric Company', 'Monthly electricity bill', '2025-08-11', 'acc_1', 'cat_5', 'user_demo_123'),
('txn_6', 250000, 'Salary Deposit', 'Monthly salary', '2025-08-10', 'acc_1', 'cat_8', 'user_demo_123'),
('txn_7', -6700, 'CVS Pharmacy', 'Prescription refill', '2025-08-10', 'acc_1', 'cat_6', 'user_demo_123'),
('txn_8', -45600, 'Whole Foods', 'Weekly groceries', '2025-08-09', 'acc_1', 'cat_7', 'user_demo_123'),
('txn_9', -8900, 'McDonald''s', 'Quick lunch', '2025-08-09', 'acc_1', 'cat_1', 'user_demo_123'),
('txn_10', -35000, 'Gas Station', 'Fill up tank', '2025-08-08', 'acc_1', 'cat_2', 'user_demo_123'),
('txn_11', -12000, 'Coffee Shop', 'Work meeting', '2025-08-08', 'acc_1', 'cat_1', 'user_demo_123'),
('txn_12', -89000, 'Best Buy', 'New laptop', '2025-08-07', 'acc_3', 'cat_3', 'user_demo_123'),
('txn_13', -25000, 'Internet Bill', 'Monthly internet', '2025-08-07', 'acc_1', 'cat_5', 'user_demo_123'),
('txn_14', -15000, 'Pharmacy', 'Monthly prescriptions', '2025-08-06', 'acc_1', 'cat_6', 'user_demo_123'),
('txn_15', -67000, 'Grocery Store', 'Weekly shopping', '2025-08-05', 'acc_1', 'cat_7', 'user_demo_123'),
('txn_16', 50000, 'Freelance Payment', 'Web design project', '2025-08-05', 'acc_1', 'cat_8', 'user_demo_123'),
('txn_17', -78000, 'Target', 'Household items', '2025-08-04', 'acc_3', 'cat_3', 'user_demo_123'),
('txn_18', -23000, 'Movie Theater', 'Date night', '2025-08-03', 'acc_1', 'cat_4', 'user_demo_123'),
('txn_19', -34000, 'Gas Station', 'Road trip fuel', '2025-08-02', 'acc_1', 'cat_2', 'user_demo_123'),
('txn_20', -56000, 'Restaurant', 'Birthday dinner', '2025-08-01', 'acc_1', 'cat_1', 'user_demo_123'),
('txn_21', 75000, 'Side Hustle', 'Consulting work', '2025-07-31', 'acc_1', 'cat_8', 'user_demo_123'),
('txn_22', -12000, 'Parking', 'Downtown parking', '2025-07-30', 'acc_1', 'cat_2', 'user_demo_123'),
('txn_23', 50000, 'Transfer from Checking', 'Monthly savings', '2025-08-10', 'acc_2', 'cat_8', 'user_demo_123'),
('txn_24', -156000, 'Phone Bill', 'Family plan monthly', '2025-07-29', 'acc_1', 'cat_5', 'user_demo_123'),
('txn_25', -23400, 'Streaming Services', 'Hulu, Disney+, HBO', '2025-07-28', 'acc_1', 'cat_4', 'user_demo_123')
ON CONFLICT (id) DO NOTHING;

-- Sample connected bank
INSERT INTO connected_banks (id, user_id, access_token, item_id, name) VALUES
('bank_1', 'user_demo_123', 'access-sandbox-token', 'item_sandbox_123', 'Chase Bank')
ON CONFLICT (id) DO NOTHING;

-- Sample subscription
INSERT INTO subscriptions (id, user_id, name, description, status) VALUES
('sub_1', 'user_demo_123', 'Fintr Pro', 'Premium financial tracking features', 'active')
ON CONFLICT (id) DO NOTHING;

COMMIT;
