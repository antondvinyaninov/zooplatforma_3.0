package database

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
	"github.com/zooplatforma/backend/internal/shared/config"
)

func Connect(cfg config.DatabaseConfig) (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host,
		cfg.Port,
		cfg.User,
		cfg.Password,
		cfg.DBName,
		cfg.SSLMode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %w", err)
	}

	// Настройка connection pool для оптимизации работы с удаленной БД
	db.SetMaxOpenConns(25)                 // Максимум 25 открытых соединений
	db.SetMaxIdleConns(10)                 // Держать 10 соединений в пуле
	db.SetConnMaxLifetime(5 * time.Minute) // Переиспользовать соединение до 5 минут

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error connecting to database: %w", err)
	}

	return db, nil
}
