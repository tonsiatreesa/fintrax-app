const { Hono } = require("hono");
const { serve } = require("@hono/node-server");
const { z } = require("zod");
const { createId } = require("@paralleldrive/cuid2");
const { zValidator } = require("@hono/zod-validator");
const { clerkMiddleware, getAuth } = require("@hono/clerk-auth");

// Import our new database utilities
const { DatabaseConnection, CategoryService } = require("./database");

// Initialize database connection
const db = new DatabaseConnection();
const categoryService = new CategoryService(db);

// Request validation schemas
const insertCategorySchema = z.object({
  name: z.string().min(1),
});

const app = new Hono();

// Health check
app.get("/health", async (c) => {
  try {
    const dbHealth = await db.healthCheck();
    return c.json({ 
      status: "ok", 
      service: "category-service",
      timestamp: new Date().toISOString(),
      database: dbHealth
    });
  } catch (error) {
    return c.json({ 
      status: "error", 
      service: "category-service",
      timestamp: new Date().toISOString(),
      error: error.message
    }, 500);
  }
});

// Test endpoint to view all data (for development/testing)
app.get("/test/data", async (c) => {
  try {
    const allCategories = await categoryService.getAllCategoriesTest();
    
    return c.json({ 
      message: "Test data endpoint",
      total_categories: allCategories.length,
      categories: allCategories,
      note: "This endpoint is for testing - shows all categories regardless of user"
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
    const allCategories = await categoryService.getAllCategoriesTest();
    
    return c.json({ 
      data: allCategories.map(category => ({
        id: category.id,
        name: category.name,
        created_at: category.created_at,
        updated_at: category.updated_at
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

      const data = await categoryService.getAllCategories(auth.userId);
      return c.json({ data });
    } catch (error) {
      console.error("Category service error:", error);
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
      const data = await categoryService.getCategoryById(id, auth.userId);
      
      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    } catch (error) {
      console.error("Category service error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
)

app.post(
  "/",
  clerkMiddleware(),
  zValidator("json", insertCategorySchema),
  async (c) => {
    const auth = getAuth(c);
    const values = c.req.valid("json");

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      const data = await categoryService.createCategory({
        ...values,
        id: createId(), // Add ID generation
      }, auth.userId);

      return c.json({ data });
    } catch (error) {
      console.error("Category service error:", error);
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
      const data = await categoryService.bulkDeleteCategories(values.ids, auth.userId);
      return c.json({ data });
    } catch (error) {
      console.error("Category service error:", error);
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
  zValidator("json", insertCategorySchema),
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
      const data = await categoryService.updateCategory(id, values, auth.userId);

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    } catch (error) {
      console.error("Category service error:", error);
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
      const data = await categoryService.deleteCategory(id, auth.userId);

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    } catch (error) {
      console.error("Category service error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

const port = process.env.PORT || 4004;

console.log(`Category Service running on port ${port}`);
serve({
  fetch: app.fetch,
  port,
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down category service...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down category service...');
  await db.close();
  process.exit(0);
});
