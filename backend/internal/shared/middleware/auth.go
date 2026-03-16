package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/zooplatforma/backend/internal/shared/auth"
)

// AuthRequired - middleware для проверки JWT токена
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Получаем токен из заголовка Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Authorization header required"})
			c.Abort()
			return
		}

		// Проверяем формат "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Валидируем токен
		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Сохраняем user_id в контексте
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)

		c.Next()
	}
}

// AuthOptional - middleware для опциональной проверки JWT токена
// Не блокирует запрос если токена нет, но устанавливает user_id если токен валидный
func AuthOptional() gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string

		// Сначала пробуем получить токен из заголовка Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			// Проверяем формат "Bearer <token>"
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}

		// Если токена нет в заголовке, пробуем получить из cookie
		if tokenString == "" {
			cookie, err := c.Cookie("auth_token")
			if err == nil && cookie != "" {
				tokenString = cookie
			}
		}

		// Если токена нет вообще, продолжаем без авторизации
		if tokenString == "" {
			c.Next()
			return
		}

		// Валидируем токен
		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			c.Next()
			return
		}

		// Сохраняем user_id в контексте
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)

		c.Next()
	}
}
