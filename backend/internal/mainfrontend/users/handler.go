package users

import (
	"database/sql"
	"fmt"
	"io"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type S3Client interface {
	UploadFile(key string, data io.Reader, contentType string) (string, error)
	DeleteObject(key string) error
}

type Handler struct {
	db       *sql.DB
	s3Client S3Client
}

func NewHandler(db *sql.DB, s3Client S3Client) *Handler {
	return &Handler{
		db:       db,
		s3Client: s3Client,
	}
}

// GetAll - получить всех пользователей (админский функционал, но перенесен в монолит)
func (h *Handler) GetAll(c *gin.Context) {
	query := `
		SELECT 
			u.id, u.name, u.email, u.last_name, 
			u.avatar, u.verified, u.created_at,
			ua.last_seen
		FROM users u
		LEFT JOIN user_activity ua ON u.id = ua.user_id
		ORDER BY u.created_at DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	var usersList []map[string]interface{}

	for rows.Next() {
		var (
			id                            int
			name, email                   string
			lastName, avatar              sql.NullString
			verified                      bool
			createdAt                     string
			lastSeen                      sql.NullTime
		)

		if err := rows.Scan(
			&id, &name, &email, &lastName,
			&avatar, &verified, &createdAt,
			&lastSeen,
		); err != nil {
			continue // пропускаем битые строки
		}

		isOnline := false
		lastSeenStr := ""
		if lastSeen.Valid {
			if time.Since(lastSeen.Time) < 5*time.Minute {
				isOnline = true
			}
			lastSeenStr = lastSeen.Time.Format(time.RFC3339)
		}

		user := map[string]interface{}{
			"id":           id,
			"name":         name,
			"last_name":    lastName.String,
			"email":        email,
			"avatar":       avatar.String,
			"verified":     verified,
			"is_online":    isOnline,
			"last_seen":    lastSeenStr,
			"created_at":   createdAt,
		}

		usersList = append(usersList, user)
	}

	if usersList == nil {
		usersList = []map[string]interface{}{}
	}

	c.JSON(200, gin.H{"success": true, "data": usersList})
}

// GetByID - получить пользователя по ID
func (h *Handler) GetByID(c *gin.Context) {
	userID := c.Param("id")

	query := `
		SELECT 
			u.id, u.name, u.email, u.last_name, 
			u.avatar, u.bio, u.phone, u.location, u.cover_photo,
			u.verified, u.created_at,
			ua.last_seen
		FROM users u
		LEFT JOIN user_activity ua ON u.id = ua.user_id
		WHERE u.id = $1
	`

	var (
		id                                                 int
		name, email                                        string
		lastName, avatar, bio, phone, location, coverPhoto sql.NullString
		verified                                           bool
		createdAt                                string
		lastSeen                                 sql.NullTime
	)

	err := h.db.QueryRow(query, userID).Scan(
		&id, &name, &email, &lastName,
		&avatar, &bio, &phone, &location, &coverPhoto,
		&verified, &createdAt,
		&lastSeen,
	)

	if err == sql.ErrNoRows {
		c.JSON(404, gin.H{"success": false, "error": "User not found"})
		return
	}

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Получаем количество друзей
	var friendsCount int
	friendsQuery := `
		SELECT COUNT(*) FROM friendships 
		WHERE (user_id = $1 OR friend_id = $1) AND status = 'accepted'
	`
	h.db.QueryRow(friendsQuery, userID).Scan(&friendsCount)

	// Получаем количество постов
	var postsCount int
	postsQuery := `
		SELECT COUNT(*) FROM posts 
		WHERE author_id = $1 AND author_type = 'user' AND is_deleted = false
	`
	h.db.QueryRow(postsQuery, userID).Scan(&postsCount)

	// Получаем количество подписчиков (те, кто подписан на этого юзера, не являясь другом)
	var followersCount int
	followersQuery := `
		SELECT COUNT(*) FROM followers f 
		WHERE f.following_id = $1
		AND NOT EXISTS (
			SELECT 1 FROM friendships fr 
			WHERE (fr.user_id = f.following_id AND fr.friend_id = f.follower_id OR fr.user_id = f.follower_id AND fr.friend_id = f.following_id) 
			AND fr.status = 'accepted'
		)
	`
	h.db.QueryRow(followersQuery, userID).Scan(&followersCount)

	// Получаем количество подписок (на кого подписан этот юзер, не являясь другом)
	var followingCount int
	followingQuery := `
		SELECT COUNT(*) FROM followers f 
		WHERE f.follower_id = $1
		AND NOT EXISTS (
			SELECT 1 FROM friendships fr 
			WHERE (fr.user_id = f.following_id AND fr.friend_id = f.follower_id OR fr.user_id = f.follower_id AND fr.friend_id = f.following_id) 
			AND fr.status = 'accepted'
		)
	`
	h.db.QueryRow(followingQuery, userID).Scan(&followingCount)

	// Проверяем онлайн статус (если last_seen в последнюю минуту)
	isOnline := false
	lastSeenStr := ""
	if lastSeen.Valid {
		// Считаем пользователя онлайн, если активность была в последнюю минуту
		if time.Since(lastSeen.Time) < 1*time.Minute {
			isOnline = true
		}
		lastSeenStr = lastSeen.Time.Format(time.RFC3339)
	}

	user := map[string]interface{}{
		"id":              id,
		"name":            name,
		"first_name":      name, // Дублируем для совместимости
		"last_name":       lastName.String,
		"email":           email,
		"avatar":          avatar.String,
		"avatar_url":      avatar.String, // Дублируем для совместимости
		"bio":             bio.String,
		"phone":           phone.String,
		"location":        location.String,
		"city":            location.String, // Дублируем для совместимости
		"cover_photo":     coverPhoto.String,
		"verified":        verified,
		"is_verified":     verified, // Дублируем для совместимости
		"is_online":       isOnline,
		"last_seen":       lastSeenStr,
		"last_seen_at":    lastSeenStr, // Дублируем для совместимости
		"created_at":      createdAt,
		"friends_count":   friendsCount,
		"posts_count":     postsCount,
		"followers_count": followersCount,
		"following_count": followingCount,
	}

	c.JSON(200, gin.H{"success": true, "data": user})
}

// GetLogs - получить логи действий пользователя
func (h *Handler) GetLogs(c *gin.Context) {
	userID := c.Param("id")
	
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	query := `
		SELECT 
			id, action_type, entity_type, entity_id, 
			action_details, ip_address, created_at
		FROM user_activity_logs
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	rows, err := h.db.Query(query, userID, limit)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	logs := []map[string]interface{}{}

	for rows.Next() {
		var (
			id                                                       int
			actionType, entityType                                   string
			entityID                                                 sql.NullInt64
			actionDetails, ipAddress                                 sql.NullString
			createdAt                                                string
		)

		err := rows.Scan(
			&id, &actionType, &entityType, &entityID,
			&actionDetails, &ipAddress, &createdAt,
		)
		if err != nil {
			continue
		}

		log := map[string]interface{}{
			"id":             id,
			"action_type":    actionType,
			"entity_type":    entityType,
			"entity_id":      entityID.Int64,
			"action_details": actionDetails.String,
			"ip_address":     ipAddress.String,
			"created_at":     createdAt,
		}

		logs = append(logs, log)
	}

	c.JSON(200, gin.H{"success": true, "data": logs})
}

// GetStorage - получить статистику использования платформы (кол-во записей)
func (h *Handler) GetStorage(c *gin.Context) {
	userID := c.Param("id")

	var (
		postsCount, petsCount, mediaCount, friendsCount, orgsCount, commentsCount int
		mediaSizeTotal sql.NullFloat64
	)

	// Посты
	h.db.QueryRow(`SELECT COUNT(*) FROM posts WHERE author_id = $1 AND author_type = 'user' AND is_deleted = false`, userID).Scan(&postsCount)
	// Питомцы
	h.db.QueryRow(`SELECT COUNT(*) FROM pets WHERE user_id = $1 AND relationship = 'owner'`, userID).Scan(&petsCount)
	// Медиа
	h.db.QueryRow(`SELECT COUNT(*), SUM(file_size) FROM user_media WHERE user_id = $1`, userID).Scan(&mediaCount, &mediaSizeTotal)
	// Друзья
	h.db.QueryRow(`SELECT COUNT(*) FROM friendships WHERE (user_id = $1 OR friend_id = $1) AND status = 'accepted'`, userID).Scan(&friendsCount)
	// Организации
	h.db.QueryRow(`SELECT COUNT(*) FROM organizations WHERE owner_user_id = $1`, userID).Scan(&orgsCount)
	// Комментарии
	h.db.QueryRow(`SELECT COUNT(*) FROM comments WHERE user_id = $1`, userID).Scan(&commentsCount)

	mediaSizeMb := 0.0
	if mediaSizeTotal.Valid {
		mediaSizeMb = mediaSizeTotal.Float64 / (1024 * 1024)
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"posts_count":         postsCount,
			"pets_count":          petsCount,
			"media_count":         mediaCount,
			"media_size_mb":       mediaSizeMb,
			"friends_count":       friendsCount,
			"organizations_count": orgsCount,
			"comments_count":      commentsCount,
		},
	})
}

// UpdateProfile - обновить профиль пользователя
func (h *Handler) UpdateProfile(c *gin.Context) {
	// Получаем ID текущего пользователя из контекста
userIDInterface, hasUser := c.Get("user_id")
if !hasUser {
c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
return
}
currentUserID := userIDInterface.(int)

	var req struct {
		Name              string `json:"name"`
		LastName          string `json:"last_name"`
		Bio               string `json:"bio"`
		Phone             string `json:"phone"`
		Location          string `json:"location"`
		ProfileVisibility string `json:"profile_visibility"`
		ShowPhone         string `json:"show_phone"`
		ShowEmail         string `json:"show_email"`
		AllowMessages     string `json:"allow_messages"`
		ShowOnline        string `json:"show_online"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	// Обновляем профиль
	query := `
		UPDATE users 
		SET name = $1, last_name = $2, bio = $3, phone = $4, location = $5,
		    profile_visibility = $6, show_phone = $7, show_email = $8,
		    allow_messages = $9, show_online = $10
		WHERE id = $11
	`

	_, err := h.db.Exec(query,
		req.Name, req.LastName, req.Bio, req.Phone, req.Location,
		req.ProfileVisibility, req.ShowPhone, req.ShowEmail,
		req.AllowMessages, req.ShowOnline,
		currentUserID,
	)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to update profile"})
		return
	}

	// Получаем обновленные данные пользователя
	var (
		id                                                                 int
		name, email, lastName                                              string
		avatar, bio, phone, location, coverPhoto                           sql.NullString
		profileVisibility, showPhone, showEmail, allowMessages, showOnline string
		verified                                                           bool
		createdAt                                                          string
	)

	selectQuery := `
		SELECT 
			id, name, email, last_name, 
			avatar, bio, phone, location, cover_photo,
			profile_visibility, show_phone, show_email,
			allow_messages, show_online,
			verified, created_at
		FROM users
		WHERE id = $1
	`

	err = h.db.QueryRow(selectQuery, currentUserID).Scan(
		&id, &name, &email, &lastName,
		&avatar, &bio, &phone, &location, &coverPhoto,
		&profileVisibility, &showPhone, &showEmail,
		&allowMessages, &showOnline,
		&verified, &createdAt,
	)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to fetch updated user"})
		return
	}

	user := map[string]interface{}{
		"id":                 id,
		"name":               name,
		"last_name":          lastName,
		"email":              email,
		"bio":                bio.String,
		"phone":              phone.String,
		"location":           location.String,
		"avatar":             avatar.String,
		"cover_photo":        coverPhoto.String,
		"profile_visibility": profileVisibility,
		"show_phone":         showPhone,
		"show_email":         showEmail,
		"allow_messages":     allowMessages,
		"show_online":        showOnline,
		"verified":           verified,
		"created_at":         createdAt,
	}

	c.JSON(200, gin.H{"success": true, "data": user})
}

// UploadAvatar загружает аватар пользователя в S3
func (h *Handler) UploadAvatar(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	file, header, err := c.Request.FormFile("avatar")
	if err != nil {
		c.JSON(400, gin.H{"success": false, "error": "No file uploaded"})
		return
	}
	defer file.Close()

	if !strings.HasPrefix(header.Header.Get("Content-Type"), "image/") {
		c.JSON(400, gin.H{"success": false, "error": "Invalid file type"})
		return
	}

	ext := filepath.Ext(header.Filename)
	key := fmt.Sprintf("avatars/%d/%d%s", userID, time.Now().UnixNano(), ext)

	url, err := h.s3Client.UploadFile(key, file, header.Header.Get("Content-Type"))
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to upload to S3"})
		return
	}

	_, err = h.db.Exec(`UPDATE users SET avatar = $1 WHERE id = $2`, url, userID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Database error"})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"avatar_url": url,
			"message":    "Аватар успешно обновлен",
		},
	})
}

// UploadCover загружает обложку пользователя в S3
func (h *Handler) UploadCover(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	file, header, err := c.Request.FormFile("cover")
	if err != nil {
		c.JSON(400, gin.H{"success": false, "error": "No file uploaded"})
		return
	}
	defer file.Close()

	if !strings.HasPrefix(header.Header.Get("Content-Type"), "image/") {
		c.JSON(400, gin.H{"success": false, "error": "Invalid file type"})
		return
	}

	ext := filepath.Ext(header.Filename)
	key := fmt.Sprintf("covers/%d/%d%s", userID, time.Now().UnixNano(), ext)

	url, err := h.s3Client.UploadFile(key, file, header.Header.Get("Content-Type"))
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to upload to S3"})
		return
	}

	_, err = h.db.Exec(`UPDATE users SET cover_photo = $1 WHERE id = $2`, url, userID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Database error"})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"cover_url": url,
			"message":   "Обложка успешно обновлена",
		},
	})
}

// DeleteAvatar удаляет аватар
func (h *Handler) DeleteAvatar(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	_, err := h.db.Exec(`UPDATE users SET avatar = NULL WHERE id = $1`, userID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to remove avatar"})
		return
	}

	c.JSON(200, gin.H{"success": true, "data": map[string]interface{}{"message": "Avatar deleted"}})
}

// DeleteCover удаляет обложку
func (h *Handler) DeleteCover(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	_, err := h.db.Exec(`UPDATE users SET cover_photo = NULL WHERE id = $1`, userID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to remove cover"})
		return
	}

	c.JSON(200, gin.H{"success": true, "data": map[string]interface{}{"message": "Cover deleted"}})
}
