-- Drop all existing tables
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;

-- Create minimal tasks table
CREATE TABLE tasks (
  id serial PRIMARY KEY,
  title text NOT NULL,
  emoji text,
  completed boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create minimal goals table
CREATE TABLE goals (
  id serial PRIMARY KEY,
  title text NOT NULL,
  emoji text,
  completed boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
); 