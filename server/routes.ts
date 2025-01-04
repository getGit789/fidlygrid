import type { Express } from "express";
import { db, sql } from "../db/index.js";
import { tasks, goals } from "../db/schema.js";

export function registerRoutes(app: Express) {
  // Tasks API endpoints
  app.get("/api/tasks", async (_req, res) => {
    try {
      console.log("Fetching tasks...");
      const result = await sql`
        SELECT * FROM tasks 
        WHERE deleted = false 
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
      const { title, category } = req.body;
      console.log("Creating task:", { title, category });
      
      if (!title || !category) {
        return res.status(400).json({ 
          error: "Title and category are required",
          received: { title, category }
        });
      }

      const result = await sql`
        INSERT INTO tasks (
          title, 
          category, 
          completed, 
          favorite, 
          deleted
        ) VALUES (
          ${title}, 
          ${category}, 
          false, 
          false, 
          false
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
        body: req.body
      });
      res.status(500).json({ 
        error: "Failed to create task",
        details: error.message
      });
    }
  });

  // Goals API endpoints
  app.get("/api/goals", async (_req, res) => {
    try {
      console.log("Fetching goals...");
      const result = await sql`
        SELECT * FROM goals 
        WHERE deleted = false 
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
      const { title, category } = req.body;
      console.log("Creating goal:", { title, category });

      if (!title || !category) {
        return res.status(400).json({ 
          error: "Title and category are required",
          received: { title, category }
        });
      }

      const result = await sql`
        INSERT INTO goals (
          title, 
          category, 
          completed, 
          favorite, 
          deleted
        ) VALUES (
          ${title}, 
          ${category}, 
          false, 
          false, 
          false
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
        body: req.body
      });
      res.status(500).json({ 
        error: "Failed to create goal",
        details: error.message
      });
    }
  });

  return app;
}