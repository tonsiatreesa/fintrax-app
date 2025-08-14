-- Fintr Database Seed Script
-- Create sample data for testing the application

-- Insert sample accounts
INSERT INTO accounts (id, plaid_id, name, user_id) VALUES
('acc_1', 'plaid_acc_1', 'Chase Checking', 'user_demo_123'),
('acc_2', 'plaid_acc_2', 'Savings Account', 'user_demo_123'),
('acc_3', 'plaid_acc_3', 'Credit Card', 'user_demo_123');

-- Insert sample categories
INSERT INTO categories (id, plaid_id, name, user_id) VALUES
('cat_1', 'plaid_cat_1', 'Food & Dining', 'user_demo_123'),
('cat_2', 'plaid_cat_2', 'Transportation', 'user_demo_123'),
('cat_3', 'plaid_cat_3', 'Shopping', 'user_demo_123'),
('cat_4', 'plaid_cat_4', 'Entertainment', 'user_demo_123'),
('cat_5', 'plaid_cat_5', 'Bills & Utilities', 'user_demo_123'),
('cat_6', 'plaid_cat_6', 'Income', 'user_demo_123'),
('cat_7', 'plaid_cat_7', 'Healthcare', 'user_demo_123'),
('cat_8', 'plaid_cat_8', 'Groceries', 'user_demo_123');

-- Insert sample transactions (amounts in cents)
INSERT INTO transactions (id, amount, payee, notes, date, account_id, category_id) VALUES
-- Recent transactions (this month)
('txn_1', -4500, 'Starbucks', 'Morning coffee', '2025-08-13', 'acc_1', 'cat_1'),
('txn_2', -12500, 'Uber', 'Ride to airport', '2025-08-13', 'acc_1', 'cat_2'),
('txn_3', -8900, 'Amazon', 'Office supplies', '2025-08-12', 'acc_3', 'cat_3'),
('txn_4', -15600, 'Netflix & Spotify', 'Monthly subscriptions', '2025-08-12', 'acc_1', 'cat_4'),
('txn_5', -125000, 'Electric Company', 'Monthly electricity bill', '2025-08-11', 'acc_1', 'cat_5'),
('txn_6', 250000, 'Salary Deposit', 'Monthly salary', '2025-08-10', 'acc_1', 'cat_6'),
('txn_7', -6700, 'CVS Pharmacy', 'Prescription refill', '2025-08-10', 'acc_1', 'cat_7'),
('txn_8', -45600, 'Whole Foods', 'Weekly groceries', '2025-08-09', 'acc_1', 'cat_8'),
('txn_9', -8900, 'McDonald''s', 'Quick lunch', '2025-08-09', 'acc_1', 'cat_1'),
('txn_10', -23400, 'Gas Station', 'Fill up tank', '2025-08-08', 'acc_1', 'cat_2'),

-- Last month transactions  
('txn_11', -5600, 'Chipotle', 'Dinner', '2025-07-28', 'acc_1', 'cat_1'),
('txn_12', -134500, 'Target', 'Shopping spree', '2025-07-25', 'acc_3', 'cat_3'),
('txn_13', -78900, 'Movie Theater', 'Date night', '2025-07-22', 'acc_1', 'cat_4'),
('txn_14', -156700, 'Internet Provider', 'Monthly internet', '2025-07-20', 'acc_1', 'cat_5'),
('txn_15', 250000, 'Salary Deposit', 'Monthly salary', '2025-07-10', 'acc_1', 'cat_6'),
('txn_16', -89000, 'Dentist', 'Dental cleaning', '2025-07-15', 'acc_1', 'cat_7'),
('txn_17', -67800, 'Trader Joe''s', 'Weekly groceries', '2025-07-14', 'acc_1', 'cat_8'),

-- Older transactions for trend analysis
('txn_18', -4300, 'Coffee Shop', 'Afternoon coffee', '2025-06-25', 'acc_1', 'cat_1'),
('txn_19', -45600, 'Lyft', 'Airport ride', '2025-06-20', 'acc_1', 'cat_2'),
('txn_20', 250000, 'Salary Deposit', 'Monthly salary', '2025-06-10', 'acc_1', 'cat_6'),
('txn_21', -198700, 'Best Buy', 'New laptop', '2025-06-05', 'acc_3', 'cat_3'),
('txn_22', -123400, 'Water Company', 'Monthly water bill', '2025-06-01', 'acc_1', 'cat_5'),

-- Savings account transactions
('txn_23', 50000, 'Transfer from Checking', 'Monthly savings', '2025-08-10', 'acc_2', 'cat_6'),
('txn_24', 50000, 'Transfer from Checking', 'Monthly savings', '2025-07-10', 'acc_2', 'cat_6'),
('txn_25', 50000, 'Transfer from Checking', 'Monthly savings', '2025-06-10', 'acc_2', 'cat_6');

-- Insert sample connected bank (for Plaid integration demo)
INSERT INTO connected_banks (id, user_id, access_token) VALUES
('bank_1', 'user_demo_123', 'access_sandbox_demo_token_123');

-- Insert sample subscription (for payment processing demo)
INSERT INTO subscriptions (id, user_id, subscription_id, status) VALUES
('sub_1', 'user_demo_123', 'stripe_sub_demo_123', 'active');
