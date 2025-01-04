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
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  try {
    console.log("Connecting to database with URL pattern:", connectionString.replace(/:[^:@]+@/, ':***@'));
    const client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 20,
      max_lifetime: 60 * 30, // 30 minutes
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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

    // Test the connection with error details
    try {
      console.log("Testing database connection...");
      await client`SELECT current_database(), current_user, version()`;
      const [{ current_database, current_user, version }] = await client`
        SELECT current_database(), current_user, version();
      `;
      console.log("Database connection details:", {
        database: current_database,
        user: current_user,
        version: version
      });
    } catch (testError: any) {
      console.error("Connection test failed with details:", {
        code: testError.code,
        message: testError.message,
        detail: testError.detail,
        hint: testError.hint,
        position: testError.position
      });
      throw testError;
    }

    return client;
  } catch (error: any) {
    console.error(`Database connection attempt ${retryCount + 1} failed:`, {
      code: error.code,
      message: error.message,
      detail: error.detail,
      hint: error.hint,
      position: error.position
    });
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return createConnection(retryCount + 1);
    }
    
    throw new Error(`Failed to connect to database after ${MAX_RETRIES} attempts: ${error.message}`);
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
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  console.log("Starting initial database connection...");
  const client = postgres(connectionString, { 
    max: 1,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  db = drizzle(client, { schema });
  console.log("Initial database connection established");
  
  // Initialize proper connection pool asynchronously
  initializeDb().catch(error => {
    console.error("Failed to initialize database pool:", error);
    process.exit(1);
  });
} catch (error: any) {
  console.error("Failed to create initial database connection:", {
    code: error.code,
    message: error.message,
    detail: error.detail,
    hint: error.hint
  });
  throw error;
}

export { db };
