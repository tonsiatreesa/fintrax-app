const { Hono } = require('hono');
const { serve } = require('@hono/node-server');

const app = new Hono();

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'subscription-service',
    timestamp: new Date().toISOString()
  });
});

// Mock subscription endpoints
app.get('/api/subscriptions', (c) => {
  return c.json({
    data: [
      { id: '1', name: 'Netflix', amount: 15.99, status: 'active', billing_date: '2024-01-15' },
      { id: '2', name: 'Spotify', amount: 9.99, status: 'active', billing_date: '2024-01-20' }
    ]
  });
});

app.post('/api/subscriptions', (c) => {
  return c.json({ message: 'Subscription created', id: 'new-subscription-id' });
});

const port = process.env.PORT || 4007;

console.log(`Subscription service starting on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
