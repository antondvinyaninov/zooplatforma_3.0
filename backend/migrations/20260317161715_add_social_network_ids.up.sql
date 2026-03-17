-- Добавляем поля для поддержки сторонних социальных сетей (OK, Mail.ru и другие) без удаления существующих данных

ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS ok_id VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS ok_access_token TEXT,
    ADD COLUMN IF NOT EXISTS mailru_id VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS mailru_access_token TEXT;
