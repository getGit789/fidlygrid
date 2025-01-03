import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

console.log("Connecting to database...");
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  debug: (connection_id, message) => {
    console.log(`[DB Debug] Connection ${connection_id}:`, message);
  },
  onnotice: (notice) => {
    console.log('[DB Notice]:', notice);
  },
  onparameter: (parameterStatus) => {
    console.log('[DB Parameter]:', parameterStatus);
  }
});

// Test the connection
async function testConnection() {
  try {
    console.log("Testing database connection...");
    await client`SELECT 1`;
    console.log("Database connection test successful");
  } catch (error) {
    console.error("Database connection test failed:", error);
    throw error;
  }
}

// Initialize database
async function initializeDb() {
  try {
    await testConnection();
    const db = drizzle(client, { schema });
    console.log("Database connection established successfully");
    return db;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

const db = await initializeDb();

export { db };
