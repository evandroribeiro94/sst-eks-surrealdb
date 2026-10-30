import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { Surreal } from "surrealdb";

const app = new Hono();
const db = new Surreal();

let isConnected = false;

// Initialize database connection
async function getDb(): Promise<Surreal> {
  if (isConnected) return db;

  const url = process.env.SURREALDB_URL || "ws://localhost:8000/rpc";
  const user = process.env.SURREALDB_USER || "root";
  const pass = process.env.SURREALDB_PASS || "root";
  const ns = process.env.SURREALDB_NS || "test";
  const database = process.env.SURREALDB_DB || "test";

  try {
    await db.connect(url);
    if (user && pass) {
      await db.signin({ user, pass });
    }
    await db.use({ namespace: ns, database: database });
    isConnected = true;
    console.log(`[SurrealDB] Successfully connected to ${url} (ns: ${ns}, db: ${database})`);
  } catch (error) {
    console.error("[SurrealDB] Connection error:", error);
    throw error;
  }
  return db;
}

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    storage: "tikv",
    surrealdb: isConnected ? "connected" : "standby"
  });
});

// Example endpoint to create a record
app.post("/users", async (c) => {
  try {
    const client = await getDb();
    const body = await c.req.json();
    const user = await client.create("user", body);
    return c.json(user, 201);
  } catch (error: any) {
    return c.json({ error: "Failed to create user", message: error.message }, 500);
  }
});

// Example endpoint to get all users
app.get("/users", async (c) => {
  try {
    const client = await getDb();
    const users = await client.select("user");
    return c.json(users);
  } catch (error: any) {
    return c.json({ error: "Failed to fetch users", message: error.message }, 500);
  }
});

export const handler = handle(app);
export default app;
