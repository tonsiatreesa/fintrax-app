const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const { Pool } = require('pg');

const app = new Hono();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'analytics-service',
    timestamp: new Date().toISOString()
  });
});

// Real analytics endpoints using database data
app.get('/api/summary', async (c) => {
  try {
    const client = await pool.connect();
    
    // Get query parameters
    const { from, to, accountId } = c.req.query();
    
    // Build date filter
    let dateFilter = '';
    let accountFilter = '';
    let queryParams = [];
    let paramCount = 0;
    
    if (from) {
      paramCount++;
      dateFilter += ` AND date >= $${paramCount}`;
      queryParams.push(from);
    }
    
    if (to) {
      paramCount++;
      dateFilter += ` AND date <= $${paramCount}`;
      queryParams.push(to);
    }
    
    if (accountId) {
      paramCount++;
      accountFilter = ` AND account_id = $${paramCount}`;
      queryParams.push(accountId);
    }

    // Calculate income (positive amounts)
    const incomeQuery = `
      SELECT COALESCE(SUM(amount), 0) as total_income
      FROM transactions 
      WHERE amount > 0 ${dateFilter} ${accountFilter}
    `;
    const incomeResult = await client.query(incomeQuery, queryParams);
    const incomeAmount = parseInt(incomeResult.rows[0].total_income) || 0;

    // Calculate expenses (negative amounts, make positive for display)
    const expensesQuery = `
      SELECT COALESCE(ABS(SUM(amount)), 0) as total_expenses
      FROM transactions 
      WHERE amount < 0 ${dateFilter} ${accountFilter}
    `;
    const expensesResult = await client.query(expensesQuery, queryParams);
    const expensesAmount = parseInt(expensesResult.rows[0].total_expenses) || 0;

    // Calculate remaining
    const remainingAmount = incomeAmount - expensesAmount;

    // Get category breakdown (expenses only)
    const categoriesQuery = `
      SELECT c.name, ABS(SUM(t.amount)) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.amount < 0 ${dateFilter} ${accountFilter}
      GROUP BY c.id, c.name
      ORDER BY total DESC
      LIMIT 5
    `;
    const categoriesResult = await client.query(categoriesQuery, queryParams);
    const categories = categoriesResult.rows.map(row => ({
      name: row.name,
      value: parseInt(row.total) || 0
    }));

    // Generate daily data for the last 30 days
    const daysQuery = `
      SELECT 
        date,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as daily_income,
        ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)) as daily_expenses
      FROM transactions
      WHERE date >= CURRENT_DATE - INTERVAL '30 days' ${accountFilter}
      GROUP BY date
      ORDER BY date
    `;
    const daysResult = await client.query(daysQuery, accountId ? [accountId] : []);
    const days = daysResult.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      income: parseInt(row.daily_income) || 0,
      expenses: parseInt(row.daily_expenses) || 0,
    }));

    client.release();

    return c.json({
      data: {
        incomeAmount: incomeAmount,
        expensesAmount: expensesAmount,
        remainingAmount: remainingAmount,
        incomeChange: 0, // TODO: Calculate percentage change
        expensesChange: 0, // TODO: Calculate percentage change  
        remainingChange: 0, // TODO: Calculate percentage change
        categories: categories,
        days: days
      }
    });
    
  } catch (error) {
    console.error('Analytics service error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

const port = process.env.PORT || 4005;

console.log(`Analytics service starting on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
