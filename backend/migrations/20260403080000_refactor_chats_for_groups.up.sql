CREATE TABLE IF NOT EXISTS chat_participants (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_message_id INTEGER DEFAULT 0,
    UNIQUE(chat_id, user_id)
);

ALTER TABLE chats ADD COLUMN type VARCHAR(50) DEFAULT 'direct';
ALTER TABLE chats ADD COLUMN name VARCHAR(255);
ALTER TABLE chats ADD COLUMN avatar_url VARCHAR(1024);
ALTER TABLE chats ADD COLUMN creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

INSERT INTO chat_participants (chat_id, user_id, role, joined_at)
SELECT id, user1_id, 'member', created_at FROM chats;

INSERT INTO chat_participants (chat_id, user_id, role, joined_at)
SELECT id, user2_id, 'member', created_at FROM chats;

-- Drop constraints related to user1_id and user2_id
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_user1_id_user2_id_key;
DROP INDEX IF EXISTS idx_chats_user1_id;
DROP INDEX IF EXISTS idx_chats_user2_id;
DROP INDEX IF EXISTS idx_chats_users;

ALTER TABLE chats DROP COLUMN user1_id CASCADE;
ALTER TABLE chats DROP COLUMN user2_id CASCADE;

-- Update last read message
UPDATE chat_participants cp
SET last_read_message_id = COALESCE((
    SELECT MAX(id) FROM messages m
    WHERE m.chat_id = cp.chat_id AND m.receiver_id = cp.user_id AND m.is_read = true
), 0);

-- Clean up messages
DROP INDEX IF EXISTS idx_messages_unread;
DROP INDEX IF EXISTS idx_messages_receiver_id;
DROP INDEX IF EXISTS idx_messages_is_read;

ALTER TABLE messages DROP COLUMN receiver_id CASCADE;
ALTER TABLE messages DROP COLUMN is_read CASCADE;
ALTER TABLE messages DROP COLUMN read_at CASCADE;
