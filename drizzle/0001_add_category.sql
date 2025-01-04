-- Add category column to tasks table
ALTER TABLE tasks ADD COLUMN category text NOT NULL DEFAULT 'Tasks';

-- Add category column to goals table
ALTER TABLE goals ADD COLUMN category text NOT NULL DEFAULT 'Goals'; 