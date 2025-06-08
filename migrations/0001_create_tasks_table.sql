-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  due_date DATE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_slug ON tasks(slug);

-- Create index on completed status for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- Create index on due_date for sorting
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);