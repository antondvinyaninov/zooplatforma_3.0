-- Удаляем поля для соцсетей

ALTER TABLE users 
    DROP COLUMN IF EXISTS ok_id,
    DROP COLUMN IF EXISTS ok_access_token,
    DROP COLUMN IF EXISTS mailru_id,
    DROP COLUMN IF EXISTS mailru_access_token;
