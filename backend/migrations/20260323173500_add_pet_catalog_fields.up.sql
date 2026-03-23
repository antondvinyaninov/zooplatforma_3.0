ALTER TABLE pets
ADD COLUMN catalog_status VARCHAR(50) DEFAULT 'draft',
ADD COLUMN catalog_data JSONB DEFAULT '{}'::jsonb;
