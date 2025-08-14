const { Hono } = require("hono");
const { serve } = require("@hono/node-server");

const app = new Hono();

// Manual CORS middleware
app.use("*", async (c, next) => {
  // Set CORS headers
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.header("Access-Control-Allow-Credentials", "true");
  
  // Handle preflight requests
  if (c.req.method === "OPTIONS") {
    return c.text("", 204);
  }
  
  await next();
});

// Service URLs - these would be environment variables in production
const ACCOUNT_SERVICE_URL = process.env.ACCOUNT_SERVICE_URL || "http://account-service:4002";
const TRANSACTION_SERVICE_URL = process.env.TRANSACTION_SERVICE_URL || "http://transaction-service:4003";
const CATEGORY_SERVICE_URL = process.env.CATEGORY_SERVICE_URL || "http://category-service:4004";
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || "http://analytics-service:4005";
const PLAID_SERVICE_URL = process.env.PLAID_SERVICE_URL || "http://plaid-service:4006";
const SUBSCRIPTION_SERVICE_URL = process.env.SUBSCRIPTION_SERVICE_URL || "http://subscription-service:4007";

// Proxy function to forward requests to microservices
async function proxyRequest(c, serviceUrl, path) {
  try {
    const url = `${serviceUrl}${path}`;
    const method = c.req.method;
    const headers = {};
    
    // Forward auth headers
    const authHeader = c.req.header("authorization");
    if (authHeader) {
      headers["authorization"] = authHeader;
    }
    
    const body = method !== "GET" ? await c.req.text() : undefined;
    
    const response = await fetch(url, {
      method,
      headers: {
        ...headers,
        "content-type": "application/json",
      },
      body,
    });
    
    const responseData = await response.text();
    
    return c.text(responseData, response.status, {
      "content-type": "application/json",
    });
  } catch (error) {
    console.error(`Proxy error for ${serviceUrl}${path}:`, error);
    return c.json({ error: "Service unavailable" }, 503);
  }
}

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "api-gateway" });
});

// Simple test route
app.get("/test", (c) => {
  return c.json({ message: "Test route working" });
});

// Debug route to test routing
app.get("/debug/routes", (c) => {
  return c.json({
    message: "API Gateway Routes Debug",
    routes: [
      "/api/accounts",
      "/api/accounts/*",
      "/api/transactions",
      "/api/transactions/*",
      "/api/categories",
      "/api/categories/*"
    ],
    services: {
      ACCOUNT_SERVICE_URL,
      TRANSACTION_SERVICE_URL,
      CATEGORY_SERVICE_URL
    }
  });
});

// Route definitions with proper path handling
app.all("/api/accounts", async (c) => {
  console.log("Route matched: /api/accounts", c.req.path);
  console.log("Proxying to:", ACCOUNT_SERVICE_URL, "/");
  return proxyRequest(c, ACCOUNT_SERVICE_URL, "/");
});

app.all("/api/accounts/*", async (c) => {
  console.log("Route matched: /api/accounts/*", c.req.path);
  const path = c.req.path.replace("/api/accounts", "");
  console.log("Proxying to:", ACCOUNT_SERVICE_URL, "path:", path);
  return proxyRequest(c, ACCOUNT_SERVICE_URL, path);
});

app.all("/api/transactions", async (c) => {
  return proxyRequest(c, TRANSACTION_SERVICE_URL, "/");
});

app.all("/api/transactions/*", async (c) => {
  const path = c.req.path.replace("/api/transactions", "");
  return proxyRequest(c, TRANSACTION_SERVICE_URL, path);
});

app.all("/api/categories", async (c) => {
  return proxyRequest(c, CATEGORY_SERVICE_URL, "/");
});

app.all("/api/categories/*", async (c) => {
  const path = c.req.path.replace("/api/categories", "");
  return proxyRequest(c, CATEGORY_SERVICE_URL, path);
});

app.all("/api/summary/*", async (c) => {
  const path = c.req.path.replace("/api/summary", "/api/summary");
  return proxyRequest(c, ANALYTICS_SERVICE_URL, path);
});

app.all("/api/summary", async (c) => {
  return proxyRequest(c, ANALYTICS_SERVICE_URL, "/api/summary");
});

app.all("/api/plaid/*", async (c) => {
  const path = c.req.path.replace("/api/plaid", "/api/plaid");
  return proxyRequest(c, PLAID_SERVICE_URL, path);
});

app.all("/api/subscriptions/*", async (c) => {
  const path = c.req.path.replace("/api/subscriptions", "/api/subscriptions");
  return proxyRequest(c, SUBSCRIPTION_SERVICE_URL, path);
});

app.all("/api/subscriptions", async (c) => {
  return proxyRequest(c, SUBSCRIPTION_SERVICE_URL, "/api/subscriptions");
});

// Removed duplicate health check - already defined above

const port = process.env.PORT || 4000;

console.log(`API Gateway running on port ${port}`);
serve({
  fetch: app.fetch,
  port,
});
