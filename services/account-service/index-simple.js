const { Hono } = require("hono");
const { serve } = require("@hono/node-server");

const app = new Hono();

// Simple health check
app.get("/health", (c) => {
  return c.json({ 
    status: "ok", 
    service: "account-service",
    timestamp: new Date().toISOString()
  });
});

// Mock endpoints for testing
app.get("/", (c) => {
  return c.json({ 
    data: [],
    message: "Account service is running - no auth for testing" 
  });
});

const port = process.env.PORT || 4002;

console.log(`Account Service running on port ${port}`);
serve({
  fetch: app.fetch,
  port,
});
