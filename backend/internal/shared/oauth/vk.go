package oauth

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/zooplatforma/backend/internal/shared/auth"
	"github.com/zooplatforma/backend/internal/shared/config"
)

type VKHandler struct {
	db     *sql.DB
	config *config.Config
}

func NewVKHandler(db *sql.DB, cfg *config.Config) *VKHandler {
	return &VKHandler{
		db:     db,
		config: cfg,
	}
}

// VKUser структура ответа от VK API
type VKUser struct {
	ID        int    `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Photo     string `json:"photo_200"`
	Email     string `json:"email"`
}

type VKTokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	UserID      int    `json:"user_id"`
	Email       string `json:"email"`
}

type VKAPIResponse struct {
	Response []VKUser `json:"response"`
}

// Login - начало OAuth процесса
func (h *VKHandler) Login(c *gin.Context) {
	// Формируем URL для авторизации VK
	authURL := fmt.Sprintf(
		"https://oauth.vk.com/authorize?client_id=%s&redirect_uri=%s&display=page&scope=email&response_type=code&v=5.131",
		h.config.VK.ClientID,
		h.config.VK.RedirectURL,
	)

	c.Redirect(http.StatusTemporaryRedirect, authURL)
}

// Callback - обработка ответа от VK
func (h *VKHandler) Callback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "No authorization code provided"})
		return
	}

	// Обмениваем code на access_token
	tokenURL := fmt.Sprintf(
		"https://oauth.vk.com/access_token?client_id=%s&client_secret=%s&redirect_uri=%s&code=%s",
		h.config.VK.ClientID,
		h.config.VK.ClientSecret,
		h.config.VK.RedirectURL,
		code,
	)

	resp, err := http.Get(tokenURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to get access token"})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to read response"})
		return
	}

	var tokenResp VKTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to parse token response"})
		return
	}

	// Получаем информацию о пользователе
	userInfoURL := fmt.Sprintf(
		"https://api.vk.com/method/users.get?user_ids=%d&fields=photo_200&access_token=%s&v=5.131",
		tokenResp.UserID,
		tokenResp.AccessToken,
	)

	userResp, err := http.Get(userInfoURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to get user info"})
		return
	}
	defer userResp.Body.Close()

	userBody, err := io.ReadAll(userResp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to read user info"})
		return
	}

	var vkAPIResp VKAPIResponse
	if err := json.Unmarshal(userBody, &vkAPIResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to parse user info"})
		return
	}

	if len(vkAPIResp.Response) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "No user data received"})
		return
	}

	vkUser := vkAPIResp.Response[0]

	// Используем email из токена, если он есть
	email := tokenResp.Email
	if email == "" {
		// Если email не предоставлен, создаем временный
		email = fmt.Sprintf("vk%d@vk.placeholder", vkUser.ID)
	}

	// Проверяем, существует ли пользователь с таким VK ID
	var userID int
	var existingEmail string
	checkQuery := `SELECT id, email FROM users WHERE vk_id = $1`
	err = h.db.QueryRow(checkQuery, vkUser.ID).Scan(&userID, &existingEmail)

	if err == sql.ErrNoRows {
		// Пользователь не найден, создаем нового
		insertQuery := `
			INSERT INTO users (name, last_name, email, vk_id, avatar, created_at, verified)
			VALUES ($1, $2, $3, $4, $5, $6, true)
			RETURNING id
		`
		err = h.db.QueryRow(
			insertQuery,
			vkUser.FirstName,
			vkUser.LastName,
			email,
			vkUser.ID,
			vkUser.Photo,
			time.Now().UTC(),
		).Scan(&userID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to create user: " + err.Error()})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}

	// Генерируем JWT токен
	token, err := auth.GenerateToken(userID, email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to generate token"})
		return
	}

	// Устанавливаем cookie с токеном
	c.SetCookie(
		"auth_token",
		token,
		30*24*60*60, // 30 дней
		"/",
		"",
		false,
		true,
	)

	// Редирект на фронтенд
	c.Redirect(http.StatusTemporaryRedirect, "http://localhost:3000/main/dashboard")
}

// SDKCallback - обработка данных от VK ID SDK
func (h *VKHandler) SDKCallback(c *gin.Context) {
	var req struct {
		AccessToken string `json:"access_token"`
		UserID      int    `json:"user_id"`
		ExpiresIn   int    `json:"expires_in"`
		Email       string `json:"email"`
		FirstName   string `json:"first_name"`
		LastName    string `json:"last_name"`
		AvatarURL   string `json:"avatar_url"`
		Phone       string `json:"phone"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	// Для VK ID SDK access_token может быть привязан к IP клиента.
	// Поэтому в SDK сценарии не делаем server-side users.get с этим токеном.
	if req.UserID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Missing VK user_id"})
		return
	}

	vkUser := VKUser{
		ID:        req.UserID,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Photo:     req.AvatarURL,
	}
	if vkUser.FirstName == "" {
		vkUser.FirstName = "VK"
	}
	if vkUser.LastName == "" {
		vkUser.LastName = "User"
	}

	email := req.Email
	if email == "" {
		email = fmt.Sprintf("vk%d@vk.placeholder", vkUser.ID)
	}

	// Проверяем, существует ли пользователь с таким VK ID
	var userID int
	checkQuery := `SELECT id FROM users WHERE vk_id = $1`
	err := h.db.QueryRow(checkQuery, vkUser.ID).Scan(&userID)

	if err == sql.ErrNoRows {
		// Пользователь не найден по VK ID, проверим по email
		checkEmailQuery := `SELECT id FROM users WHERE email = $1`
		errEmail := h.db.QueryRow(checkEmailQuery, email).Scan(&userID)

		if errEmail == sql.ErrNoRows {
			// Пользователь не найден ни по vk_id, ни по email
			// Создаем абсолютно нового пользователя
			insertQuery := `
				INSERT INTO users (name, last_name, email, vk_id, avatar, phone, vk_access_token, created_at, verified, password_hash)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, '')
				RETURNING id
			`
			err = h.db.QueryRow(
				insertQuery,
				vkUser.FirstName,
				vkUser.LastName,
				email,
				vkUser.ID,
				vkUser.Photo,
				req.Phone,
				req.AccessToken,
				time.Now().UTC(),
			).Scan(&userID)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to create user: " + err.Error()})
				return
			}
		} else if errEmail != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error while verifying email"})
			return
		} else {
			// Пользователь с таким email уже существует!
			// Мы должны "привязать" его VK профиль к старому аккаунту
			updateQuery := `UPDATE users SET vk_id = $1, vk_access_token = $2 WHERE id = $3`
			_, err = h.db.Exec(updateQuery, vkUser.ID, req.AccessToken, userID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to link existing user account"})
				return
			}
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	} else {
		// Пользователь уже был найден по vk_id, обновляем access_token
		updateQuery := `UPDATE users SET vk_access_token = $1 WHERE id = $2`
		_, err = h.db.Exec(updateQuery, req.AccessToken, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to update token"})
			return
		}
	}

	// Досохраняем профиль VK в локальный аккаунт (без перезаписи заполненных данных),
	// и если VK наконец вернул email — заменяем placeholder.
	_, _ = h.db.Exec(`
		UPDATE users
		SET
			vk_id = $1,
			vk_access_token = $2,
			name = COALESCE(NULLIF(name, ''), $3),
			last_name = COALESCE(NULLIF(last_name, ''), $4),
			avatar = COALESCE(NULLIF(avatar, ''), $5),
			phone = COALESCE(NULLIF(phone, ''), $6),
			email = CASE
				WHEN email LIKE 'vk%@vk.placeholder' AND $7 <> '' THEN $7
				ELSE email
			END
		WHERE id = $8
	`, vkUser.ID, req.AccessToken, vkUser.FirstName, vkUser.LastName, vkUser.Photo, req.Phone, req.Email, userID)

	// Читаем финальные данные пользователя из БД
	var dbEmail string
	var dbFirstName, dbLastName, dbAvatar sql.NullString
	err = h.db.QueryRow(`
		SELECT email, name, last_name, avatar
		FROM users
		WHERE id = $1
	`, userID).Scan(&dbEmail, &dbFirstName, &dbLastName, &dbAvatar)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to load user profile"})
		return
	}

	if dbEmail == "" {
		dbEmail = email
	}

	// Генерируем JWT токен
	token, err := auth.GenerateToken(userID, dbEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to generate token"})
		return
	}

	// Устанавливаем cookie с токеном
	c.SetCookie(
		"auth_token",
		token,
		30*24*60*60, // 30 дней
		"/",
		"",
		false,
		true,
	)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"user": gin.H{
				"id":         userID,
				"first_name": dbFirstName.String,
				"last_name":  dbLastName.String,
				"avatar_url": dbAvatar.String,
				"email":      dbEmail,
				"vk_id":      vkUser.ID,
			},
			"token": token,
		},
	})
}
