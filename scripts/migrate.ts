import { sql } from "../db/index.js";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigrations() {
  try {
    console.log("Starting migrations...");

    // Drop existing tables if they exist
    console.log("Dropping existing tables...");
    await sql`
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS goals CASCADE;
    `;

    // Read and execute the initial migration
    console.log("Creating fresh tables...");
    const initialMigration = readFileSync(
      join(process.cwd(), "drizzle", "0000_free_pretty_boy.sql"),
      "utf-8"
    );
    await sql.unsafe(initialMigration);

    // Read and execute the fresh start migration
    console.log("Applying fresh start migration...");
    const freshStartMigration = readFileSync(
      join(process.cwd(), "drizzle", "0002_fresh_start.sql"),
      "utf-8"
    );
    await sql.unsafe(freshStartMigration);

    console.log("All migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

runMigrations(); 