package auth

import (
	"crypto/rand"
	"database/sql"
	"math/big"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// GenerateNumericCode генерирует 6-значный цифровой код
func GenerateNumericCode() string {
	max := big.NewInt(1000000)
	n, _ := rand.Int(rand.Reader, max)
	return mapNumberTo6Digits(n.Int64())
}

func mapNumberTo6Digits(n int64) string {
	code := ""
	for i := 0; i < 6; i++ {
		digit := n % 10
		code = string(rune('0'+digit)) + code
		n /= 10
	}
	return code
}

// MergeRequest отправляет 6-значный код на почту для подтверждения владения аккаунтом
func (h *Handler) MergeRequest(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Некорректный email адрес"})
		return
	}

	// Убедимся, что пользователь с таким email существует
	var existingUserID int
	var existingName string
	err := h.db.QueryRow(`SELECT id, name FROM users WHERE email = $1`, req.Email).Scan(&existingUserID, &existingName)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Пользователь с таким email не найден"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Ошибка базы данных"})
		return
	}

	// Генерируем 6-значный код
	code := GenerateNumericCode()
	expiresAt := time.Now().UTC().Add(15 * time.Minute)

	// Сохраняем код в БД
	_, err = h.db.Exec(`
		INSERT INTO email_verification_codes (email, code, expires_at)
		VALUES ($1, $2, $3)
	`, req.Email, code, expiresAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Не удалось сохранить код подтверждения"})
		return
	}

	// Отправляем письмо
	err = h.mailer.SendVerificationCodeEmail(req.Email, existingName, code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Не удалось отправить письмо"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Письмо с кодом отправлено",
	})
}

// MergeConfirm проверяет код и объединяет профили
func (h *Handler) MergeConfirm(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
		Code  string `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Некорректные данные"})
		return
	}

	// Текущий пользователь (пустышка из VK)
	currentUserIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Не авторизован"})
		return
	}
	currentUserID := currentUserIDInterface.(int)

	// Проверяем актуальность кода
	var codeID int
	var expiresAt time.Time
	err := h.db.QueryRow(`
		SELECT id, expires_at FROM email_verification_codes 
		WHERE email = $1 AND code = $2 
		ORDER BY id DESC LIMIT 1
	`, req.Email, req.Code).Scan(&codeID, &expiresAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Неверный код подтверждения"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Ошибка базы данных при проверке кода"})
		return
	}

	if time.Now().UTC().After(expiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Срок действия кода истек"})
		return
	}

	// Удаляем использованный код
	h.db.Exec(`DELETE FROM email_verification_codes WHERE id = $1`, codeID)

	// Находим старый (настоящий) аккаунт по email
	var targetUserID int
	err = h.db.QueryRow(`SELECT id FROM users WHERE email = $1`, req.Email).Scan(&targetUserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Целевой аккаунт не найден"})
		return
	}

	// Начинаем транзакцию для схлопывания аккаунтов
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Ошибка при начале объединения"})
		return
	}
	defer tx.Rollback()

	// Получаем VK данные из текущего аккаунта-пустышки
	var vkID sql.NullInt64
	var vkAccessToken sql.NullString
	err = tx.QueryRow(`SELECT vk_id, vk_access_token FROM users WHERE id = $1`, currentUserID).Scan(&vkID, &vkAccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Ошибка чтения исходного аккаунта"})
		return
	}

	// Если это реально VK аккаунт, переносим VK данные в целевой профиль
	if vkID.Valid {
		// Сначала отвязываем vk_id у пустышки, чтобы не было конфликтов UNIQUE constraint при обновлении целевого аккаунта
		_, err = tx.Exec(`UPDATE users SET vk_id = NULL WHERE id = $1`, currentUserID)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Ошибка отвязки VK"})
			return
		}

		_, err = tx.Exec(`
			UPDATE users 
			SET vk_id = $1, vk_access_token = COALESCE($2, vk_access_token)
			WHERE id = $3
		`, vkID, vkAccessToken, targetUserID)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Ошибка обновления целевого аккаунта"})
			return
		}

		// Логически (или физически) удаляем профиль-пустышку. Удали физически, т.к. он только что создан.
		_, err = tx.Exec(`DELETE FROM users WHERE id = $1`, currentUserID)
		if err != nil {
			// Если падает из-за внешних ключей (успел создать посты?), мы логически удаляем
			tx.Exec(`UPDATE users SET is_deleted = true, email = email || '_deleted_' || id WHERE id = $1`, currentUserID)
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Ошибка полного объединения профилей"})
		return
	}

	// Выпускаем новый токен для СТАРОГО аккаунта (в который мы перенесли данные)
	newToken, err := GenerateToken(targetUserID, req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Ошибка генерации нового токена"})
		return
	}

	// Обновляем cookie
	c.SetCookie("auth_token", newToken, 30*24*60*60, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"token":   newToken,
		"message": "Профили успешно объединены!",
	})
}
