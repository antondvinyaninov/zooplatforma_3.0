package middleware

import (
	"database/sql"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// UpdateLastSeen - middleware для обновления времени последней активности
func UpdateLastSeen(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Пропускаем запрос дальше
		c.Next()

		// Получаем user_id из контекста (устанавливается в AuthOptional middleware)
		userIDInterface, exists := c.Get("user_id")
		if !exists {
			return
		}

		userID, ok := userIDInterface.(int)
		if !ok {
			return
		}

		// Обновляем last_seen асинхронно, чтобы не замедлять ответ
		go func() {
			// Используем UPSERT для обновления или создания записи в user_activity
			query := `
				INSERT INTO user_activity (user_id, last_seen)
				VALUES ($1, $2)
				ON CONFLICT (user_id)
				DO UPDATE SET last_seen = $2
			`
			_, err := db.Exec(query, userID, time.Now().UTC())
			if err != nil {
				log.Printf("Failed to update last_seen for user %d: %v", userID, err)
			}
		}()
	}
}
