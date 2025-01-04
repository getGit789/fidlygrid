import { sql } from "../db/index.js";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigrations() {
  try {
    console.log("Starting migrations...");

    // Read and execute each migration file
    const migrations = [
      "0000_free_pretty_boy.sql",
      "0001_add_category.sql"
    ];

    for (const migration of migrations) {
      console.log(`Running migration: ${migration}`);
      const filePath = join(process.cwd(), "drizzle", migration);
      const sqlContent = readFileSync(filePath, "utf-8");
      
      await sql.unsafe(sqlContent);
      console.log(`Completed migration: ${migration}`);
    }

    console.log("All migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

runMigrations(); 