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
      max: 1, // Reduce to single connection for testing
      idle_timeout: 20,
      connect_timeout: 30,
      ssl: { rejectUnauthorized: false },
      transform: {
        undefined: null,
      },
    });

    // Test the connection with basic queries
    try {
      console.log("Testing database connection...");
      
      // Test basic connection
      const [{ now }] = await client`SELECT NOW() as now`;
      console.log("Database time:", now);

      // Test tasks table
      const taskCount = await client`SELECT COUNT(*) as count FROM tasks`;
      console.log("Tasks count:", taskCount[0].count);

      // Test goals table
      const goalCount = await client`SELECT COUNT(*) as count FROM goals`;
      console.log("Goals count:", goalCount[0].count);

      console.log("All database tests passed successfully");
      return client;
    } catch (testError: any) {
      console.error("Database test failed:", {
        code: testError.code,
        message: testError.message,
        detail: testError.detail,
        hint: testError.hint,
        position: testError.position,
        where: testError.where
      });
      throw testError;
    }
  } catch (error: any) {
    console.error(`Database connection attempt ${retryCount + 1} failed:`, {
      code: error.code,
      message: error.message,
      detail: error.detail,
      hint: error.hint,
      where: error.where
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
let sql: postgres.Sql<{}>;

// Initialize database connection
try {
  console.log("Starting database connection...");
  const client = postgres(connectionString, { 
    max: 1,
    ssl: { rejectUnauthorized: false },
    transform: {
      undefined: null,
    },
  });
  
  // Store both Drizzle and raw SQL client
  db = drizzle(client, { schema });
  sql = client;
  
  console.log("Initial database connection established");
  
  // Test connection asynchronously
  createConnection().then(newClient => {
    sql = newClient;
    db = drizzle(newClient, { schema });
    console.log("Database connection pool initialized successfully");
  }).catch(error => {
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

export { db, sql };
