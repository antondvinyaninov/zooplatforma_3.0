-- +goose Up
-- +goose StatementBegin
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='comments' AND column_name='status') THEN
        ALTER TABLE comments ADD COLUMN status VARCHAR(20) DEFAULT 'published';
        UPDATE comments SET status = 'published' WHERE status IS NULL;
    END IF;
END $$;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='comments' AND column_name='status') THEN
        ALTER TABLE comments DROP COLUMN status;
    END IF;
END $$;
-- +goose StatementEnd
