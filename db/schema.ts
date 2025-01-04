import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  isCompleted: boolean("is_completed").default(false),
  category: text("category").notNull(),
  isFavorite: boolean("is_favorite").default(false),
  isDeleted: boolean("is_deleted").default(false),
  workspaceId: integer("workspace_id").references(() => workspaces.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  isCompleted: boolean("is_completed").default(false),
  isFavorite: boolean("is_favorite").default(false),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema for tasks
export const insertTaskSchema = createInsertSchema(tasks);
export const selectTaskSchema = createSelectSchema(tasks);
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

// Schema for goals
export const insertGoalSchema = createInsertSchema(goals);
export const selectGoalSchema = createSelectSchema(goals);
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;