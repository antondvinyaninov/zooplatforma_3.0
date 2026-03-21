CREATE TABLE IF NOT EXISTS platform_reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
    liked_text TEXT,
    disliked_text TEXT,
    improvements_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
