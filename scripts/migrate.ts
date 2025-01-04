import { sql } from "../db/index.js";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigrations() {
  try {
    console.log("Starting fresh with minimal schema...");

    // Read and execute the minimal schema
    const minimalSchema = readFileSync(
      join(process.cwd(), "drizzle", "0003_minimal.sql"),
      "utf-8"
    );
    await sql.unsafe(minimalSchema);

    console.log("Schema created successfully");
  } catch (error) {
    console.error("Error creating schema:", error);
    process.exit(1);
  }
}

runMigrations(); 