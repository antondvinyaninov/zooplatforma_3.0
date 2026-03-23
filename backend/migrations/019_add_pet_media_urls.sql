-- Up
ALTER TABLE pets ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb;

-- Down
-- ALTER TABLE pets DROP COLUMN IF EXISTS media_urls;
