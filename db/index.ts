import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function createConnection(retryCount = 0) {
  try {
    console.log("Connecting to database...");
    const client = postgres(connectionString as string, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 20,
      max_lifetime: 60 * 30, // 30 minutes
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
    await client`SELECT 1`;
    console.log("Database connection test successful");
    return client;
  } catch (error) {
    console.error(`Database connection attempt ${retryCount + 1} failed:`, error);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return createConnection(retryCount + 1);
    }
    
    throw new Error(`Failed to connect to database after ${MAX_RETRIES} attempts`);
  }
}

let db: ReturnType<typeof drizzle>;

// Initialize db with retries
async function initializeDb() {
  const client = await createConnection();
  db = drizzle(client, { schema });
  console.log("Database initialized successfully");
  return db;
}

// Initialize database connection
try {
  const client = postgres(connectionString as string, { max: 1 });
  db = drizzle(client, { schema });
  console.log("Initial database connection established");
  
  // Initialize proper connection pool asynchronously
  initializeDb().catch(error => {
    console.error("Failed to initialize database pool:", error);
    process.exit(1);
  });
} catch (error) {
  console.error("Failed to create initial database connection:", error);
  throw error;
}

export { db };
