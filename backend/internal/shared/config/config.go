package config

import (
	"os"
	"strconv"
)

type Config struct {
	Database    DatabaseConfig
	JWT         JWTConfig
	S3          S3Config
	VK          VKOAuthConfig
	Environment string
	SMTP        SMTPConfig
	Telegram    TelegramConfig
}

type TelegramConfig struct {
	Token  string
	ChatID string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type JWTConfig struct {
	Secret string
}

type S3Config struct {
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
	BucketName      string
	Region          string
	UseSSL          bool
}

type VKOAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

type SMTPConfig struct {
	Host string
	Port int
	User string
	Pass string
	From string
}

func Load() *Config {
	s3UseSSL, _ := strconv.ParseBool(getEnv("S3_USE_SSL", "true"))
	smtpPort, _ := strconv.Atoi(getEnv("SMTP_PORT", "465"))

	return &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "zp-db"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", "change-this-secret"),
		},
		S3: S3Config{
			Endpoint:        getEnv("S3_ENDPOINT", "s3.firstvds.ru"),
			AccessKeyID:     getEnv("S3_ACCESS_KEY_ID", ""),
			SecretAccessKey: getEnv("S3_SECRET_ACCESS_KEY", ""),
			BucketName:      getEnv("S3_BUCKET_NAME", "zooplatforma"),
			Region:          getEnv("S3_REGION", "ru-1"),
			UseSSL:          s3UseSSL,
		},
		VK: VKOAuthConfig{
			ClientID:     getEnv("VK_CLIENT_ID", ""),
			ClientSecret: getEnv("VK_CLIENT_SECRET", ""),
			RedirectURL:  getEnv("VK_REDIRECT_URL", "http://localhost:8000/api/auth/vk/callback"),
		},
		Environment: getEnv("ENVIRONMENT", "development"),
		SMTP: SMTPConfig{
			Host: getEnv("SMTP_HOST", "smtp.yandex.ru"),
			Port: smtpPort,
			User: getEnv("SMTP_USER", ""),
			Pass: getEnv("SMTP_PASS", ""),
			From: getEnv("SMTP_FROM", "info@zooplatforma.ru"),
		},
		Telegram: TelegramConfig{
			Token:  getEnv("TELEGRAM_BOT_TOKEN", ""),
			ChatID: getEnv("TELEGRAM_CHAT_ID", ""),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
