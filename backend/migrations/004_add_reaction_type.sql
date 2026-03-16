-- +goose Up
-- +goose StatementBegin
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='likes' AND column_name='reaction_type') THEN
        ALTER TABLE likes ADD COLUMN reaction_type VARCHAR(20) DEFAULT 'like' NOT NULL;
    END IF;
END $$;
-- +goose StatementEnd
