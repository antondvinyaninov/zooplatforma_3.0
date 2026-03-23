-- Add views_count to pets table
ALTER TABLE pets ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
