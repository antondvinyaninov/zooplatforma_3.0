-- +goose Up
-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    phone VARCHAR(50),
    location VARCHAR(255),
    avatar VARCHAR(500),
    cover_photo VARCHAR(500),
    profile_visibility VARCHAR(50) DEFAULT 'public',
    show_phone VARCHAR(50) DEFAULT 'friends',
    show_email VARCHAR(50) DEFAULT 'private',
    allow_messages VARCHAR(50) DEFAULT 'all',
    show_online VARCHAR(50) DEFAULT 'yes',
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
