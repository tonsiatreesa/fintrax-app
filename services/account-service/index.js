const { Hono } = require("hono");
const { serve } = require("@hono/node-server");
const { z } = require("zod");
const { createId } = require("@paralleldrive/cuid2");
const { zValidator } = require("@hono/zod-validator");
const { clerkMiddleware, getAuth } = require("@hono/clerk-auth");

// Import our new database utilities
const { DatabaseConnection, AccountService } = require("./database");

// Initialize database connection
const db = new DatabaseConnection();
const accountService = new AccountService(db);

// Request validation schemas
const insertAccountSchema = z.object({
  name: z.string().min(1),
  plaidId: z.string().optional(),
});

const app = new Hono();

// Health check
app.get("/health", async (c) => {
  try {
    const dbHealth = await db.healthCheck();
    return c.json({ 
      status: "ok", 
      service: "account-service",
      timestamp: new Date().toISOString(),
      database: dbHealth
    });
  } catch (error) {
    return c.json({ 
      status: "error", 
      service: "account-service",
      timestamp: new Date().toISOString(),
      error: error.message
    }, 500);
  }
});

// Test endpoint to view all data (for development/testing)
app.get("/test/data", async (c) => {
  try {
    const allAccounts = await accountService.getAllAccountsTest();
    
    return c.json({ 
      message: "Test data endpoint",
      total_accounts: allAccounts.length,
      accounts: allAccounts,
      note: "This endpoint is for testing - shows all accounts regardless of user"
    });
  } catch (error) {
    return c.json({ 
      error: "Database error", 
      details: error.message 
    }, 500);
  }
});

// Demo endpoint for frontend testing without auth
app.get("/demo", async (c) => {
  try {
    const allAccounts = await accountService.getAllAccountsTest();
    
    return c.json({ 
      data: allAccounts.map(account => ({
        id: account.id,
        name: account.name,
        created_at: account.created_at,
        updated_at: account.updated_at
      }))
    });
  } catch (error) {
    return c.json({ 
      error: "Database error", 
      details: error.message 
    }, 500);
  }
});

app.get(
  "/",
  clerkMiddleware(),
  async (c) => {
    try {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = await accountService.getAllAccounts(auth.userId);
      return c.json({ data });
    } catch (error) {
      console.error("Account service error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
})

app.get(
  "/:id",
  zValidator("param", z.object({
    id: z.string().optional(),
  })),
  clerkMiddleware(),
  async (c) => {
    const auth = getAuth(c);
    const { id } = c.req.valid("param");

    if (!id) {
      return c.json({ error: "Missing id" }, 400);
    }
    
    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      const data = await accountService.getAccountById(id, auth.userId);
      
      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    } catch (error) {
      console.error("Account service error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
)

app.post(
  "/",
  clerkMiddleware(),
  zValidator("json", insertAccountSchema),
  async (c) => {
    const auth = getAuth(c);
    const values = c.req.valid("json");

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      const data = await accountService.createAccount({
        ...values,
        id: createId(), // Add ID generation
      }, auth.userId);

      return c.json({ data });
    } catch (error) {
      console.error("Account service error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
})

app.post(
  "/bulk-delete",
  clerkMiddleware(),
  zValidator(
    "json",
    z.object({
      ids: z.array(z.string()),
    }),
  ),
  async (c) => {
    const auth = getAuth(c);
    const values = c.req.valid("json");

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      const data = await accountService.bulkDeleteAccounts(values.ids, auth.userId);
      return c.json({ data });
    } catch (error) {
      console.error("Account service error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
)

app.patch(
  "/:id",
  clerkMiddleware(),
  zValidator(
    "param",
    z.object({
      id: z.string().optional(),
    }),
  ),
  zValidator("json", insertAccountSchema.pick({ name: true })),
  async (c) => {
    const auth = getAuth(c);
    const { id } = c.req.valid("param");
    const values = c.req.valid("json");

    if (!id) {
      return c.json({ error: "Missing id" }, 400);
    }

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      const data = await accountService.updateAccount(id, values, auth.userId);

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    } catch (error) {
      console.error("Account service error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
)

app.delete(
  "/:id",
  clerkMiddleware(),
  zValidator(
    "param",
    z.object({
      id: z.string().optional(),
    }),
  ),
  async (c) => {
    const auth = getAuth(c);
    const { id } = c.req.valid("param");

    if (!id) {
      return c.json({ error: "Missing id" }, 400);
    }

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      const data = await accountService.deleteAccount(id, auth.userId);

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    } catch (error) {
      console.error("Account service error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

const port = process.env.PORT || 4002;

console.log(`Account Service running on port ${port}`);
serve({
  fetch: app.fetch,
  port,
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down account service...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down account service...');
  await db.close();
  process.exit(0);
});
