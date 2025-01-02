import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { tasks, goals, workspaces } from "@db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import archiver from "archiver";

export function registerRoutes(app: Express): Server {
  // Download project endpoint
  app.get("/api/download", (req, res) => {
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    res.attachment('fidlygrid-project.zip');
    archive.pipe(res);

    // Add project files to the archive
    const filesToInclude = [
      'client',
      'server',
      'db',
      'theme.json',
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'tailwind.config.ts',
      'postcss.config.js',
      'drizzle.config.ts'
    ];

    filesToInclude.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        if (fs.statSync(filePath).isDirectory()) {
          archive.directory(filePath, file);
        } else {
          archive.file(filePath, { name: file });
        }
      }
    });

    archive.finalize();
  });

  // Theme API endpoint
  app.post("/api/theme", async (req, res) => {
    try {
      const { appearance } = req.body;

      if (!['light', 'dark'].includes(appearance)) {
        return res.status(400).json({ error: "Invalid theme value" });
      }

      const themeFilePath = path.resolve(process.cwd(), 'theme.json');
      const currentTheme = JSON.parse(fs.readFileSync(themeFilePath, 'utf8'));

      const newTheme = {
        ...currentTheme,
        appearance
      };

      fs.writeFileSync(themeFilePath, JSON.stringify(newTheme, null, 2));
      res.json(newTheme);
    } catch (error) {
      console.error("Error updating theme:", error);
      res.status(500).json({ error: "Failed to update theme" });
    }
  });

  // Tasks API endpoints
  app.get("/api/tasks", async (_req, res) => {
    try {
      const allTasks = await db.select().from(tasks);
      res.json(allTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const { title, category } = req.body;
      const [task] = await db
        .insert(tasks)
        .values({ 
          title, 
          category,
          completed: false,
          favorite: false,
          deleted: false,
          workspaceId: null
        })
        .returning();
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedTask = await db
        .update(tasks)
        .set(updates)
        .where(eq(tasks.id, parseInt(id)))
        .returning();
      res.json(updatedTask[0]);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedTask = await db
        .update(tasks)
        .set({ deleted: true, updatedAt: new Date() })
        .where(eq(tasks.id, parseInt(id)))
        .returning();
      res.json(updatedTask[0]);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id/permanent", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(tasks).where(eq(tasks.id, parseInt(id)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error permanently deleting task:", error);
      res.status(500).json({ error: "Failed to permanently delete task" });
    }
  });

  // Goals API endpoints
  app.get("/api/goals", async (_req, res) => {
    try {
      const allGoals = await db.select().from(goals);
      res.json(allGoals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const { title, category } = req.body;
      const [goal] = await db
        .insert(goals)
        .values({
          title,
          category,
          completed: false,
          favorite: false,
          deleted: false
        })
        .returning();
      res.json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedGoal = await db
        .update(goals)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(goals.id, parseInt(id)))
        .returning();
      res.json(updatedGoal[0]);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedGoal = await db
        .update(goals)
        .set({ deleted: true, updatedAt: new Date() })
        .where(eq(goals.id, parseInt(id)))
        .returning();
      res.json(updatedGoal[0]);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id/permanent", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(goals).where(eq(goals.id, parseInt(id)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error permanently deleting goal:", error);
      res.status(500).json({ error: "Failed to permanently delete goal" });
    }
  });

  // Workspace routes
  app.get("/api/workspaces", async (_req, res) => {
    try {
      const allWorkspaces = await db.select().from(workspaces);
      res.json(allWorkspaces);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      res.status(500).json({ error: "Failed to fetch workspaces" });
    }
  });

  app.post("/api/workspaces", async (req, res) => {
    try {
      console.log("Received workspace creation request:", req.body);
      const { name } = req.body;
      
      if (!name) {
        console.log("Name is missing in request");
        return res.status(400).json({ error: "Name is required" });
      }

      console.log("Creating workspace with name:", name);
      const [workspace] = await db
        .insert(workspaces)
        .values({ name })
        .returning();
      
      console.log("Created workspace:", workspace);
      res.json(workspace);
    } catch (error) {
      console.error("Error creating workspace:", error);
      res.status(500).json({ error: "Failed to create workspace" });
    }
  });

  app.delete("/api/workspaces/:id", async (req, res) => {
    const { id } = req.params;
    await db.delete(workspaces).where(eq(workspaces.id, parseInt(id)));
    res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}