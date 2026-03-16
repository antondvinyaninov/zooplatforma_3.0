-- +goose Up
-- Add VK OAuth support
ALTER TABLE users ADD COLUMN IF NOT EXISTS vk_id INTEGER UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vk_access_token TEXT;

-- Create index for faster VK ID lookups
CREATE INDEX IF NOT EXISTS idx_users_vk_id ON users(vk_id);

-- Add comment
COMMENT ON COLUMN users.vk_id IS 'VK user ID for OAuth authentication';
COMMENT ON COLUMN users.vk_access_token IS 'VK OAuth access token (optional, for future use)';
