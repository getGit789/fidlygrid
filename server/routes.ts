import type { Express } from "express";
import { db, sql } from "../db/index.js";
import { tasks, goals } from "../db/schema.js";

export function registerRoutes(app: Express) {
  // Add cache control middleware for API routes
  app.use("/api", (_req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
  });

  // Debug endpoint to check table structure
  app.get("/api/debug/schema", async (_req, res) => {
    try {
      const taskSchema = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        ORDER BY ordinal_position;
      `;
      
      const goalSchema = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'goals'
        ORDER BY ordinal_position;
      `;
      
      res.json({
        tasks: taskSchema,
        goals: goalSchema
      });
    } catch (error: any) {
      console.error("Error fetching schema:", error);
      res.status(500).json({ error: "Failed to fetch schema" });
    }
  });

  // Tasks API endpoints
  app.get("/api/tasks", async (_req, res) => {
    try {
      console.log("Fetching tasks...");
      const result = await sql`
        SELECT * FROM tasks 
        WHERE is_deleted = false 
        ORDER BY created_at DESC
      `;
      console.log("Tasks fetched:", result);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching tasks:", {
        code: error.code,
        message: error.message,
        detail: error.detail,
        hint: error.hint,
        where: error.where
      });
      res.status(500).json({ 
        error: "Failed to fetch tasks",
        details: error.message
      });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const { title, emoji = null } = req.body;
      console.log("Creating task with data:", req.body);
      
      if (!title) {
        return res.status(400).json({ 
          error: "Title is required",
          received: req.body
        });
      }

      const result = await sql`
        INSERT INTO tasks (
          title, 
          emoji,
          completed, 
          is_favorite, 
          is_deleted,
          created_at,
          updated_at
        ) VALUES (
          ${title}, 
          ${emoji},
          false, 
          false, 
          false,
          NOW(),
          NOW()
        ) 
        RETURNING *
      `;
      
      console.log("Task created:", result[0]);
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error creating task:", {
        code: error.code,
        message: error.message,
        detail: error.detail,
        hint: error.hint,
        where: error.where,
        body: req.body,
        stack: error.stack
      });
      res.status(500).json({ 
        error: "Failed to create task",
        details: error.message,
        code: error.code
      });
    }
  });

  // Goals API endpoints
  app.get("/api/goals", async (_req, res) => {
    try {
      console.log("Fetching goals...");
      const result = await sql`
        SELECT * FROM goals 
        WHERE is_deleted = false 
        ORDER BY created_at DESC
      `;
      console.log("Goals fetched:", result);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching goals:", {
        code: error.code,
        message: error.message,
        detail: error.detail,
        hint: error.hint,
        where: error.where
      });
      res.status(500).json({ 
        error: "Failed to fetch goals",
        details: error.message
      });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const { title, emoji = null } = req.body;
      console.log("Creating goal with data:", req.body);

      if (!title) {
        return res.status(400).json({ 
          error: "Title is required",
          received: req.body
        });
      }

      const result = await sql`
        INSERT INTO goals (
          title, 
          emoji,
          completed, 
          is_favorite, 
          is_deleted,
          created_at,
          updated_at
        ) VALUES (
          ${title}, 
          ${emoji},
          false, 
          false, 
          false,
          NOW(),
          NOW()
        ) 
        RETURNING *
      `;
      
      console.log("Goal created:", result[0]);
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error creating goal:", {
        code: error.code,
        message: error.message,
        detail: error.detail,
        hint: error.hint,
        where: error.where,
        body: req.body,
        stack: error.stack
      });
      res.status(500).json({ 
        error: "Failed to create goal",
        details: error.message,
        code: error.code
      });
    }
  });

  return app;
}