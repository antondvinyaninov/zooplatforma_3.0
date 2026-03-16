package auth

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

func (h *Handler) Register(c *gin.Context) {
	var req struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Проверяем, существует ли пользователь с таким email
	var existingID int
	checkQuery := `SELECT id FROM users WHERE email = $1`
	err := h.db.QueryRow(checkQuery, req.Email).Scan(&existingID)

	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"success": false, "error": "User with this email already exists"})
		return
	}

	if err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}

	// Хешируем пароль
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to hash password"})
		return
	}

	// Создаем нового пользователя
	var userID int
	insertQuery := `
		INSERT INTO users (name, email, password_hash, created_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`

	err = h.db.QueryRow(insertQuery, req.Name, req.Email, string(passwordHash), time.Now().UTC()).Scan(&userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to create user: " + err.Error()})
		return
	}

	// Генерируем JWT токен
	token, err := GenerateToken(userID, req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to generate token"})
		return
	}

	// Устанавливаем cookie с токеном
	c.SetCookie(
		"auth_token", // name
		token,        // value
		30*24*60*60,  // maxAge (30 дней)
		"/",          // path
		"",           // domain (пустой = текущий домен)
		false,        // secure (false для localhost)
		true,         // httpOnly
	)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"user": gin.H{
				"id":         userID,
				"name":       req.Name,
				"first_name": req.Name,
				"email":      req.Email,
			},
			"token": token,
		},
	})
}

func (h *Handler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ищем пользователя по email
	var userID int
	var name string
	var lastName sql.NullString
	var avatar, bio, phone, location, coverPhoto sql.NullString
	var verified bool
	var passwordHash string

	query := `
		SELECT id, name, last_name, avatar, bio, phone, location, cover_photo, verified, password_hash
		FROM users 
		WHERE email = $1
	`
	err := h.db.QueryRow(query, req.Email).Scan(
		&userID, &name, &lastName, &avatar, &bio, &phone, &location, &coverPhoto, &verified, &passwordHash,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Invalid email or password"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error: " + err.Error()})
		return
	}

	// Проверяем пароль
	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Invalid email or password"})
		return
	}

	// Генерируем JWT токен
	token, err := GenerateToken(userID, req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to generate token"})
		return
	}

	// Устанавливаем cookie с токеном
	c.SetCookie(
		"auth_token", // name
		token,        // value
		30*24*60*60,  // maxAge (30 дней)
		"/",          // path
		"",           // domain (пустой = текущий домен)
		false,        // secure (false для localhost)
		true,         // httpOnly
	)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"user": gin.H{
				"id":          userID,
				"name":        name,
				"first_name":  name,
				"last_name":   lastName.String,
				"email":       req.Email,
				"avatar":      avatar.String,
				"avatar_url":  avatar.String,
				"bio":         bio.String,
				"phone":       phone.String,
				"location":    location.String,
				"city":        location.String,
				"cover_photo": coverPhoto.String,
				"verified":    verified,
				"is_verified": verified,
			},
			"token": token,
		},
	})
}

func (h *Handler) Logout(c *gin.Context) {
	// Удаляем cookie
	c.SetCookie(
		"auth_token", // name
		"",           // value (пустое)
		-1,           // maxAge (отрицательное = удалить)
		"/",          // path
		"",           // domain
		false,        // secure
		true,         // httpOnly
	)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"message": "Logged out successfully",
		},
	})
}

func (h *Handler) Me(c *gin.Context) {
	// Получаем user_id из контекста (устанавливается в AuthOptional middleware)
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	userID, ok := userIDInterface.(int)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Invalid user ID"})
		return
	}

	query := `
		SELECT 
			id, name, email, last_name, 
			avatar, bio, phone, location, cover_photo,
			profile_visibility, show_phone, show_email,
			allow_messages, show_online,
			verified, last_seen,
			created_at
		FROM users
		WHERE id = $1
	`

	var (
		id                                       int
		name, email                              string
		lastName                                 sql.NullString
		avatar, bio, phone, location, coverPhoto sql.NullString
		profileVisibility, showPhone, showEmail  sql.NullString
		allowMessages, showOnline                sql.NullString
		verified                                 bool
		lastSeen                                 sql.NullString
		createdAt                                string
	)

	err := h.db.QueryRow(query, userID).Scan(
		&id, &name, &email, &lastName,
		&avatar, &bio, &phone, &location, &coverPhoto,
		&profileVisibility, &showPhone, &showEmail,
		&allowMessages, &showOnline,
		&verified, &lastSeen,
		&createdAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(404, gin.H{"success": false, "error": "User not found"})
		return
	}

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Проверяем онлайн статус
	isOnline := false
	if lastSeen.Valid && lastSeen.String != "" {
		lastSeenTime, err := time.Parse(time.RFC3339, lastSeen.String)
		if err == nil {
			// Считаем пользователя онлайн, если активность была в последнюю минуту
			if time.Since(lastSeenTime) < 1*time.Minute {
				isOnline = true
			}
		}
	}

	user := map[string]interface{}{
		"id":                 id,
		"name":               name,
		"first_name":         name,
		"last_name":          lastName.String,
		"email":              email,
		"avatar":             avatar.String,
		"avatar_url":         avatar.String,
		"bio":                bio.String,
		"phone":              phone.String,
		"location":           location.String,
		"city":               location.String,
		"cover_photo":        coverPhoto.String,
		"profile_visibility": profileVisibility.String,
		"show_phone":         showPhone.String,
		"show_email":         showEmail.String,
		"allow_messages":     allowMessages.String,
		"show_online":        showOnline.String,
		"verified":           verified,
		"is_verified":        verified,
		"is_online":          isOnline,
		"last_seen":          lastSeen.String,
		"created_at":         createdAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user,
	})
}
