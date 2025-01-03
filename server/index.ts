import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "../db";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

const server = app.listen(PORT, HOST, () => {
  log(`Server running in ${process.env.NODE_ENV} mode on http://${HOST}:${PORT}`);
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function main() {
  // Check if tables exist before running migrations
  try {
    console.log("Checking database state...");
    const tablesExist = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'goals'
      );
    `);
    
    if (!tablesExist[0].exists) {
      console.log("Tables don't exist, running migrations...");
      await migrate(db, { migrationsFolder: "./drizzle" });
      console.log("Migrations completed successfully");
    } else {
      console.log("Tables already exist, skipping migrations");
    }
  } catch (error) {
    console.error("Database setup error:", error);
    // Continue anyway since tables might exist
  }

  try {
    console.log("Database check complete");

    // Register API routes
    registerRoutes(app);

    if (app.get("env") === "development") {
      // Setup Vite development server
      await setupVite(app, server);
    } else {
      // Serve static files in production
      const clientDist = path.join(__dirname, '../dist');
      app.use(express.static(clientDist));
      
      // Handle client-side routing
      app.get('*', (req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
      });
    }

    console.log(`Server running in ${app.get("env")} mode`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch(console.error);