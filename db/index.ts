import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

console.log("Connecting to database...");
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Max seconds a connection can be idle
  connect_timeout: 10, // Max seconds to wait for connection
});

const db = drizzle(client, { schema });
console.log("Database connection established successfully");

export { db };
