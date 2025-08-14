const { Pool } = require('pg');

class DatabaseConnection {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client:', err);
    });
  }

  // Execute a query
  async query(text, params = []) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text: text.substring(0, 50) + '...', duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Get a client from the pool for transactions
  async getClient() {
    return await this.pool.connect();
  }

  // Close the pool
  async close() {
    await this.pool.end();
  }

  // Health check
  async healthCheck() {
    try {
      const result = await this.query('SELECT NOW() as current_time, version() as version');
      return {
        status: 'healthy',
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

// Account service methods
class AccountService {
  constructor(db) {
    this.db = db;
  }

  async getAllAccounts(userId) {
    const query = `
      SELECT id, name, plaid_id, created_at, updated_at 
      FROM accounts 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  async getAccountById(id, userId) {
    const query = `
      SELECT id, name, plaid_id, created_at, updated_at 
      FROM accounts 
      WHERE id = $1 AND user_id = $2
    `;
    const result = await this.db.query(query, [id, userId]);
    return result.rows[0];
  }

  async createAccount(data, userId) {
    const { name, plaidId } = data;
    const query = `
      INSERT INTO accounts (name, plaid_id, user_id) 
      VALUES ($1, $2, $3) 
      RETURNING id, name, plaid_id, created_at, updated_at
    `;
    const result = await this.db.query(query, [name, plaidId || null, userId]);
    return result.rows[0];
  }

  async updateAccount(id, data, userId) {
    const { name } = data;
    const query = `
      UPDATE accounts 
      SET name = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 AND user_id = $3 
      RETURNING id, name, plaid_id, created_at, updated_at
    `;
    const result = await this.db.query(query, [name, id, userId]);
    return result.rows[0];
  }

  async deleteAccount(id, userId) {
    const query = `
      DELETE FROM accounts 
      WHERE id = $1 AND user_id = $2 
      RETURNING id
    `;
    const result = await this.db.query(query, [id, userId]);
    return result.rows[0];
  }

  async bulkDeleteAccounts(ids, userId) {
    const query = `
      DELETE FROM accounts 
      WHERE id = ANY($1) AND user_id = $2 
      RETURNING id
    `;
    const result = await this.db.query(query, [ids, userId]);
    return result.rows;
  }

  // Test method to get all accounts (no auth)
  async getAllAccountsTest() {
    const query = `
      SELECT id, name, plaid_id, user_id, created_at, updated_at 
      FROM accounts 
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query);
    return result.rows;
  }
}

// Transaction service methods
class TransactionService {
  constructor(db) {
    this.db = db;
  }

  async getAllTransactions(userId, filters = {}) {
    let query = `
      SELECT 
        t.id, t.amount, t.payee, t.notes, t.date,
        t.account_id, t.category_id,
        a.name as account_name,
        c.name as category_name,
        t.created_at, t.updated_at
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;
    
    const params = [userId];
    let paramCount = 1;

    // Add filters
    if (filters.accountId) {
      paramCount++;
      query += ` AND t.account_id = $${paramCount}`;
      params.push(filters.accountId);
    }

    if (filters.from) {
      paramCount++;
      query += ` AND t.date >= $${paramCount}`;
      params.push(filters.from);
    }

    if (filters.to) {
      paramCount++;
      query += ` AND t.date <= $${paramCount}`;
      params.push(filters.to);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async getTransactionById(id, userId) {
    const query = `
      SELECT 
        t.id, t.amount, t.payee, t.notes, t.date,
        t.account_id, t.category_id,
        a.name as account_name,
        c.name as category_name,
        t.created_at, t.updated_at
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = $1 AND t.user_id = $2
    `;
    const result = await this.db.query(query, [id, userId]);
    return result.rows[0];
  }

  async createTransaction(data, userId) {
    const { amount, payee, notes, date, accountId, categoryId } = data;
    const query = `
      INSERT INTO transactions (amount, payee, notes, date, account_id, category_id, user_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id, amount, payee, notes, date, account_id, category_id, created_at, updated_at
    `;
    const result = await this.db.query(query, [amount, payee, notes || null, date, accountId, categoryId || null, userId]);
    return result.rows[0];
  }

  async updateTransaction(id, data, userId) {
    const { amount, payee, notes, date, accountId, categoryId } = data;
    const query = `
      UPDATE transactions 
      SET amount = $1, payee = $2, notes = $3, date = $4, account_id = $5, category_id = $6, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $7 AND user_id = $8 
      RETURNING id, amount, payee, notes, date, account_id, category_id, created_at, updated_at
    `;
    const result = await this.db.query(query, [amount, payee, notes || null, date, accountId, categoryId || null, id, userId]);
    return result.rows[0];
  }

  async deleteTransaction(id, userId) {
    const query = `
      DELETE FROM transactions 
      WHERE id = $1 AND user_id = $2 
      RETURNING id
    `;
    const result = await this.db.query(query, [id, userId]);
    return result.rows[0];
  }

  async bulkDeleteTransactions(ids, userId) {
    const query = `
      DELETE FROM transactions 
      WHERE id = ANY($1) AND user_id = $2 
      RETURNING id
    `;
    const result = await this.db.query(query, [ids, userId]);
    return result.rows;
  }

  // Test method to get recent transactions (no auth)
  async getRecentTransactionsTest(limit = 10) {
    const query = `
      SELECT 
        t.id, t.amount, t.payee, t.notes, t.date,
        a.name as account_name,
        c.name as category_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT $1
    `;
    const result = await this.db.query(query, [limit]);
    return result.rows;
  }
}

// Category service methods
class CategoryService {
  constructor(db) {
    this.db = db;
  }

  async getAllCategories(userId) {
    const query = `
      SELECT id, name, created_at, updated_at 
      FROM categories 
      WHERE user_id = $1 
      ORDER BY name ASC
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  async getCategoryById(id, userId) {
    const query = `
      SELECT id, name, created_at, updated_at 
      FROM categories 
      WHERE id = $1 AND user_id = $2
    `;
    const result = await this.db.query(query, [id, userId]);
    return result.rows[0];
  }

  async createCategory(data, userId) {
    const { name } = data;
    const query = `
      INSERT INTO categories (name, user_id) 
      VALUES ($1, $2) 
      RETURNING id, name, created_at, updated_at
    `;
    const result = await this.db.query(query, [name, userId]);
    return result.rows[0];
  }

  async updateCategory(id, data, userId) {
    const { name } = data;
    const query = `
      UPDATE categories 
      SET name = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 AND user_id = $3 
      RETURNING id, name, created_at, updated_at
    `;
    const result = await this.db.query(query, [name, id, userId]);
    return result.rows[0];
  }

  async deleteCategory(id, userId) {
    const query = `
      DELETE FROM categories 
      WHERE id = $1 AND user_id = $2 
      RETURNING id
    `;
    const result = await this.db.query(query, [id, userId]);
    return result.rows[0];
  }

  async bulkDeleteCategories(ids, userId) {
    const query = `
      DELETE FROM categories 
      WHERE id = ANY($1) AND user_id = $2 
      RETURNING id
    `;
    const result = await this.db.query(query, [ids, userId]);
    return result.rows;
  }

  // Test method to get all categories (no auth)
  async getAllCategoriesTest() {
    const query = `
      SELECT id, name, user_id, created_at, updated_at 
      FROM categories 
      ORDER BY name ASC
    `;
    const result = await this.db.query(query);
    return result.rows;
  }
}

module.exports = {
  DatabaseConnection,
  AccountService,
  TransactionService,
  CategoryService
};
