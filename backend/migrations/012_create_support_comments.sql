CREATE TABLE support_message_comments (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES support_messages(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
