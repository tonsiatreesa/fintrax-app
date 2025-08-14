const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const { z } = require("zod");
const { createId } = require("@paralleldrive/cuid2");
const { zValidator } = require("@hono/zod-validator");
const { clerkMiddleware, getAuth } = require("@hono/clerk-auth");

// Import our new database utilities
const { DatabaseConnection, TransactionService } = require("./database");

// Initialize database connection
const db = new DatabaseConnection();
const transactionService = new TransactionService(db);

// Request validation schemas
const insertTransactionSchema = z.object({
  amount: z.number(),
  payee: z.string().min(1),
  notes: z.string().optional(),
  date: z.string().transform((str) => new Date(str)),
  accountId: z.string(),
  categoryId: z.string().optional(),
});

const app = new Hono();

// Health check endpoint
app.get('/health', async (c) => {
  try {
    const dbHealth = await db.healthCheck();
    return c.json({
      status: 'ok',
      service: 'transaction-service',
      timestamp: new Date().toISOString(),
      database: dbHealth
    });
  } catch (error) {
    return c.json({
      status: 'error',
      service: 'transaction-service',
      timestamp: new Date().toISOString(),
      error: error.message
    }, 500);
  }
});

// Test endpoint to view real data from database
app.get('/test/data', async (c) => {
  try {
    const recentTransactions = await transactionService.getRecentTransactionsTest(10);
    
    return c.json({ 
      message: "Recent transactions from database",
      total_transactions: recentTransactions.length,
      transactions: recentTransactions,
      note: "Amounts are in cents - divide by 100 for dollars"
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
    const recentTransactions = await transactionService.getRecentTransactionsTest(10);
    
    return c.json({ 
      data: recentTransactions.map(transaction => ({
        id: transaction.id,
        amount: transaction.amount,
        payee: transaction.payee,
        notes: transaction.notes,
        date: transaction.date,
        account_name: transaction.account_name,
        category_name: transaction.category_name
      }))
    });
  } catch (error) {
    return c.json({ 
      error: "Database error", 
      details: error.message 
    }, 500);
  }
});

// Legacy API endpoints for compatibility
app.get('/api/transactions', async (c) => {
  try {
    const recentTransactions = await transactionService.getRecentTransactionsTest(10);
    return c.json({ data: recentTransactions });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/transactions', (c) => {
  return c.json({ message: 'Transaction created', id: 'new-transaction-id' });
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

      // Get query parameters for filtering
      const { accountId, from, to } = c.req.query();
      const filters = {};
      
      if (accountId) filters.accountId = accountId;
      if (from) filters.from = from;
      if (to) filters.to = to;

      const data = await transactionService.getAllTransactions(auth.userId, filters);
      return c.json({ data });
    } catch (error) {
      console.error("Transaction service error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
)

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
      const data = await transactionService.getTransactionById(id, auth.userId);
      
      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    } catch (error) {
      console.error("Transaction service error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
)

app.post(
  "/",
  clerkMiddleware(),
  zValidator("json", insertTransactionSchema),
  async (c) => {
    const auth = getAuth(c);
    const values = c.req.valid("json");

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      const data = await transactionService.createTransaction({
        ...values,
        id: createId(), // Add ID generation
      }, auth.userId);

      return c.json({ data });
    } catch (error) {
      console.error("Transaction service error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
)

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
      const data = await transactionService.bulkDeleteTransactions(values.ids, auth.userId);
      return c.json({ data });
    } catch (error) {
      console.error("Transaction service error:", error);
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
  zValidator("json", insertTransactionSchema.partial()),
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
      const data = await transactionService.updateTransaction(id, values, auth.userId);

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    } catch (error) {
      console.error("Transaction service error:", error);
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
      const data = await transactionService.deleteTransaction(id, auth.userId);

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    } catch (error) {
      console.error("Transaction service error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

const port = process.env.PORT || 4003;

console.log(`Transaction service starting on port ${port}`);

serve({
  fetch: app.fetch,
  port
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down transaction service...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down transaction service...');
  await db.close();
  process.exit(0);
});
