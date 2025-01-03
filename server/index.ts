import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "../db/index.js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on http://${HOST}:${PORT}`);
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Logging middleware
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
      console.log(logLine);
    }
  });
  next();
});

async function main() {
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
  }

  try {
    console.log("Database check complete");

    // Register API routes
    registerRoutes(app);

    if (process.env.NODE_ENV === 'development') {
      // In development, use Vite's dev server
      const { setupVite } = await import('./vite.js');
      await setupVite(app, server);
    } else {
      // In production, serve static files
      const publicPath = path.resolve(__dirname, '../../dist/public');
      console.log('Serving static files from:', publicPath);
      app.use(express.static(publicPath));
      
      // Handle client-side routing
      app.get('*', (req, res) => {
        res.sendFile(path.join(publicPath, 'index.html'));
      });
    }

    console.log(`Server running in ${process.env.NODE_ENV} mode`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch(console.error);