-- Create new tasks table
CREATE TABLE new_tasks (
  id serial PRIMARY KEY NOT NULL,
  title text NOT NULL,
  emoji text,
  completed boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  category text NOT NULL DEFAULT 'Tasks',
  workspace_id integer REFERENCES workspaces(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create new goals table
CREATE TABLE new_goals (
  id serial PRIMARY KEY NOT NULL,
  title text NOT NULL,
  emoji text,
  completed boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  category text NOT NULL DEFAULT 'Goals',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Copy data from old tables to new ones
INSERT INTO new_tasks (
  id, title, emoji, completed, is_favorite, is_deleted, 
  workspace_id, created_at, updated_at
)
SELECT 
  id, title, emoji, completed, is_favorite, is_deleted, 
  workspace_id, created_at, updated_at
FROM tasks;

INSERT INTO new_goals (
  id, title, emoji, completed, is_favorite, is_deleted, 
  created_at, updated_at
)
SELECT 
  id, title, emoji, completed, is_favorite, is_deleted, 
  created_at, updated_at
FROM goals;

-- Drop old tables
DROP TABLE tasks;
DROP TABLE goals;

-- Rename new tables to original names
ALTER TABLE new_tasks RENAME TO tasks;
ALTER TABLE new_goals RENAME TO goals; 