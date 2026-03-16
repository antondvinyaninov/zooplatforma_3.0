package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/zooplatforma/backend/internal/router"
	"github.com/zooplatforma/backend/internal/shared/config"
	"github.com/zooplatforma/backend/internal/shared/database"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Файл .env не найден")
	}

	cfg := config.Load()

	db, err := database.Connect(cfg.Database)
	if err != nil {
		log.Fatalf("Ошибка подключения к БД: %v", err)
	}
	defer db.Close()

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Увеличиваем лимит для multipart form (для загрузки видео до 500MB)
	r.MaxMultipartMemory = 500 << 20 // 500 MB

	router.Setup(r, db, cfg)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Сервер запускается на порту %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
