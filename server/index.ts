import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "../db";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from 'drizzle-orm';

const app = express();
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

  // Setup routes and middleware
  app.use(express.json());
  registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Server Error:", err);
    res.status(status).json({ message, error: err.toString() });
  });

  if (app.get("env") === "development") {
    await setupVite(app, registerRoutes(app));
  } else {
    serveStatic(app);
  }

  const PORT = parseInt(process.env.PORT || "5000", 10);
  app.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
}

main().catch(console.error);