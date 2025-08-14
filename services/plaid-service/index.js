const { Hono } = require('hono');
const { serve } = require('@hono/node-server');

const app = new Hono();

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'plaid-service',
    timestamp: new Date().toISOString()
  });
});

// Mock Plaid endpoints
app.post('/api/plaid/create-link-token', (c) => {
  return c.json({ 
    link_token: 'link-sandbox-mock-token-12345',
    expiration: '2024-02-01T00:00:00Z'
  });
});

app.post('/api/plaid/exchange-public-token', (c) => {
  return c.json({ 
    access_token: 'access-sandbox-mock-token-67890',
    item_id: 'item-mock-12345'
  });
});

const port = process.env.PORT || 4006;

console.log(`Plaid service starting on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
