ALTER TABLE chats ADD COLUMN user1_id INTEGER;
ALTER TABLE chats ADD COLUMN user2_id INTEGER;

-- Try to restore user1 and user2 from chat_participants
-- Note: this is a lossy conversion since groups > 2 users will lose data
WITH numbered AS (
    SELECT chat_id, user_id, row_number() OVER (PARTITION BY chat_id ORDER BY id) as rn
    FROM chat_participants
)
UPDATE chats c
SET user1_id = n1.user_id,
    user2_id = n2.user_id
FROM numbered n1
LEFT JOIN numbered n2 ON n1.chat_id = n2.chat_id AND n2.rn = 2
WHERE c.id = n1.chat_id AND n1.rn = 1;

-- Add constraints back
ALTER TABLE chats ADD CONSTRAINT chats_user1_id_user2_id_key UNIQUE (user1_id, user2_id);
CREATE INDEX idx_chats_user1_id ON chats(user1_id);
CREATE INDEX idx_chats_user2_id ON chats(user2_id);
CREATE INDEX idx_chats_users ON chats(user1_id, user2_id);

-- Restore messages
ALTER TABLE messages ADD COLUMN receiver_id INTEGER;
ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN read_at TIMESTAMP;

-- Restore receiver_id. Since we dropped it, we have to guess it.
-- In a 2-person chat, receiver_id is the user who is NOT the sender_id.
UPDATE messages m
SET receiver_id = (
    SELECT user_id FROM chat_participants cp 
    WHERE cp.chat_id = m.chat_id AND cp.user_id != m.sender_id LIMIT 1
);

-- Restore read state (lossy)
UPDATE messages m
SET is_read = true, read_at = m.created_at
WHERE m.id <= (
    SELECT MAX(last_read_message_id) FROM chat_participants cp 
    WHERE cp.chat_id = m.chat_id AND cp.user_id != m.sender_id
);

-- Add indexes back
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = false;
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Finally drop the new objects
ALTER TABLE chats DROP COLUMN type;
ALTER TABLE chats DROP COLUMN name;
ALTER TABLE chats DROP COLUMN avatar_url;
ALTER TABLE chats DROP COLUMN creator_id;

DROP TABLE IF EXISTS chat_participants;
