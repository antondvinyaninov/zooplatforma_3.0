-- Создаем таблицу followers
CREATE TABLE IF NOT EXISTS followers (
    follower_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);

-- Миграция существующих "друзей":
-- Если статус accepted - оба подписаны друг на друга.
-- Если status pending - user_id (отправитель) подписан на friend_id (получатель).

-- 1. Для принятых заявок (обе стороны подписаны)
INSERT INTO followers (follower_id, following_id, created_at)
SELECT user_id, friend_id, created_at
FROM friendships
WHERE status = 'accepted'
ON CONFLICT DO NOTHING;

INSERT INTO followers (follower_id, following_id, created_at)
SELECT friend_id, user_id, created_at
FROM friendships
WHERE status = 'accepted'
ON CONFLICT DO NOTHING;

-- 2. Для отправленных (на рассмотрении) заявок (отправитель подписан на получателя)
INSERT INTO followers (follower_id, following_id, created_at)
SELECT user_id, friend_id, created_at
FROM friendships
WHERE status = 'pending'
ON CONFLICT DO NOTHING;
