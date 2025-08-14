const { Hono } = require('hono');
const { serve } = require('@hono/node-server');

const app = new Hono();

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'analytics-service',
    timestamp: new Date().toISOString()
  });
});

// Mock analytics endpoints
app.get('/api/summary', (c) => {
  return c.json({
    data: {
      income: 5000,
      expenses: 3000,
      remaining: 2000,
      categories: [
        { name: 'Food', value: 1000 },
        { name: 'Transportation', value: 500 },
        { name: 'Entertainment', value: 300 }
      ]
    }
  });
});

const port = process.env.PORT || 4005;

console.log(`Analytics service starting on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
