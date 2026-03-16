package friends

import (
	"database/sql"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// GetStatus - получить статус дружбы с пользователем
func (h *Handler) GetStatus(c *gin.Context) {
	targetUserID := c.Param("id")

	// Получаем user_id из контекста (устанавливается в AuthOptional middleware)
	userIDInterface, hasUser := c.Get("user_id")
	if !hasUser {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	currentUserID, ok := userIDInterface.(int)
	if !ok {
		c.JSON(401, gin.H{"success": false, "error": "Invalid user ID"})
		return
	}

	// Проверяем существует ли дружба
	var friendshipID int
	var userID, friendID int
	var status string
	var createdAt time.Time

	query := `
		SELECT id, user_id, friend_id, status, created_at
		FROM friendships
		WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
	`

	err := h.db.QueryRow(query, currentUserID, targetUserID).Scan(
		&friendshipID, &userID, &friendID, &status, &createdAt,
	)

	if err == sql.ErrNoRows {
		// Дружбы нет
		c.JSON(200, gin.H{
			"success": true,
			"data": map[string]interface{}{
				"status": "none",
			},
		})
		return
	}

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Определяем направление запроса
	isOutgoing := userID == currentUserID

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"id":          friendshipID,
			"status":      status,
			"is_outgoing": isOutgoing,
			"created_at":  createdAt,
		},
	})
}

// GetUserFriends - получить список друзей конкретного пользователя
func (h *Handler) GetUserFriends(c *gin.Context) {
	targetUserID := c.Param("id")

	rows, err := h.db.Query(`
		SELECT 
			f.id, f.user_id, f.friend_id, f.status, f.created_at, f.updated_at,
			u.id, u.name, u.last_name, u.avatar, u.location,
			CASE WHEN ua.last_seen > NOW() - INTERVAL '5 minutes' THEN true ELSE false END as is_online
		FROM friendships f
		JOIN users u ON (
			CASE 
				WHEN f.user_id = $1 THEN u.id = f.friend_id
				ELSE u.id = f.user_id
			END
		)
		LEFT JOIN user_activity ua ON u.id = ua.user_id
		WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
		ORDER BY f.created_at DESC
	`, targetUserID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	friendships := []map[string]interface{}{}
	for rows.Next() {
		var friendshipID, userID, friendID, friendUserID int
		var status string
		var createdAt, updatedAt time.Time
		var name string
		var lastName, avatar, location sql.NullString
		var isOnline bool

		rows.Scan(&friendshipID, &userID, &friendID, &status, &createdAt, &updatedAt,
			&friendUserID, &name, &lastName, &avatar, &location, &isOnline)

		friend := map[string]interface{}{
			"id":        friendUserID,
			"name":      name,
			"last_name": lastName.String,
			"is_online": isOnline,
		}
		if avatar.Valid {
			friend["avatar"] = avatar.String
		}
		if location.Valid {
			friend["location"] = location.String
		}

		friendship := map[string]interface{}{
			"id":         friendshipID,
			"user_id":    userID,
			"friend_id":  friendID,
			"status":     status,
			"created_at": createdAt,
			"updated_at": updatedAt,
			"friend":     friend,
		}

		friendships = append(friendships, friendship)
	}

	c.JSON(200, gin.H{"success": true, "data": friendships})
}

// GetFriends - получить список друзей
func (h *Handler) GetFriends(c *gin.Context) {
	// Получаем user_id из контекста (устанавливается в AuthOptional middleware)
	userIDInterface, hasUser := c.Get("user_id")
	if !hasUser {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	currentUserID, ok := userIDInterface.(int)
	if !ok {
		c.JSON(401, gin.H{"success": false, "error": "Invalid user ID"})
		return
	}

	rows, err := h.db.Query(`
		SELECT 
			f.id, f.user_id, f.friend_id, f.status, f.created_at, f.updated_at,
			u.id, u.name, u.last_name, u.avatar, u.location,
			CASE WHEN ua.last_seen > NOW() - INTERVAL '5 minutes' THEN true ELSE false END as is_online
		FROM friendships f
		JOIN users u ON (
			CASE 
				WHEN f.user_id = $1 THEN u.id = f.friend_id
				ELSE u.id = f.user_id
			END
		)
		LEFT JOIN user_activity ua ON u.id = ua.user_id
		WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
		ORDER BY f.created_at DESC
	`, currentUserID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	friendships := []map[string]interface{}{}
	for rows.Next() {
		var friendshipID, userID, friendID, friendUserID int
		var status string
		var createdAt, updatedAt time.Time
		var name string
		var lastName, avatar, location sql.NullString
		var isOnline bool

		rows.Scan(&friendshipID, &userID, &friendID, &status, &createdAt, &updatedAt,
			&friendUserID, &name, &lastName, &avatar, &location, &isOnline)

		friend := map[string]interface{}{
			"id":        friendUserID,
			"name":      name,
			"last_name": lastName.String,
			"is_online": isOnline,
		}
		if avatar.Valid {
			friend["avatar"] = avatar.String
		}
		if location.Valid {
			friend["location"] = location.String
		}

		friendship := map[string]interface{}{
			"id":         friendshipID,
			"user_id":    userID,
			"friend_id":  friendID,
			"status":     status,
			"created_at": createdAt,
			"updated_at": updatedAt,
			"friend":     friend,
		}

		friendships = append(friendships, friendship)
	}

	c.JSON(200, gin.H{"success": true, "data": friendships})
}

// SendRequest - отправить запрос в друзья
func (h *Handler) SendRequest(c *gin.Context) {
userIDInterface, hasUser := c.Get("user_id")
if !hasUser {
c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
return
}
currentUserID := userIDInterface.(int)

	var req struct {
		FriendID int `json:"friend_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	// Проверяем что не отправляем запрос самому себе
	if req.FriendID == currentUserID {
		c.JSON(400, gin.H{"success": false, "error": "Cannot send friend request to yourself"})
		return
	}

	// Проверяем что запрос еще не существует
	var exists bool
	h.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM friendships 
			WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
		)
	`, currentUserID, req.FriendID).Scan(&exists)

	if exists {
		c.JSON(400, gin.H{"success": false, "error": "Friend request already exists"})
		return
	}

	// Создаем запрос
	_, err := h.db.Exec(`
		INSERT INTO friendships (user_id, friend_id, status, created_at)
		VALUES ($1, $2, 'pending', NOW())
	`, currentUserID, req.FriendID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to send friend request"})
		return
	}

	// Автоматически подписываем на пользователя (как в VK)
	_, _ = h.db.Exec(`
		INSERT INTO followers (follower_id, following_id) 
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`, currentUserID, req.FriendID)

	// Отправляем уведомление получателю
	_, err = h.db.Exec(`
		INSERT INTO notifications (user_id, actor_id, type, message, is_read, created_at, updated_at)
		VALUES ($1, $2, 'friend_request', 'отправил(а) вам заявку в друзья', false, NOW(), NOW())
	`, req.FriendID, currentUserID)

	if err != nil {
		// Логируем ошибку, но не прерываем выполнение (заявка уже отправлена)
		// log.Printf("Failed to create notification for friend request: %v", err)
	}

	c.JSON(200, gin.H{"success": true, "message": "Friend request sent"})
}

// AcceptRequest - принять запрос в друзья
func (h *Handler) AcceptRequest(c *gin.Context) {
userIDInterface, hasUser := c.Get("user_id")
if !hasUser {
c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
return
}
currentUserID := userIDInterface.(int)

	var req struct {
		FriendID int `json:"friend_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	// Обновляем статус - принимаем запрос где текущий пользователь является friend_id
	result, err := h.db.Exec(`
		UPDATE friendships 
		SET status = 'accepted', updated_at = NOW()
		WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
	`, req.FriendID, currentUserID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to accept friend request"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(404, gin.H{"success": false, "error": "Friend request not found"})
		return
	}

	// При принятии заявки в друзья оформляем взаимную подписку (получатель подписывается на отправителя)
	_, _ = h.db.Exec(`
		INSERT INTO followers (follower_id, following_id) 
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`, currentUserID, req.FriendID)

	// И на всякий случай убеждаемся, что отправитель подписан на получателя
	_, _ = h.db.Exec(`
		INSERT INTO followers (follower_id, following_id) 
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`, req.FriendID, currentUserID)

	c.JSON(200, gin.H{"success": true, "message": "Friend request accepted"})
}

// RejectRequest - отклонить запрос в друзья
func (h *Handler) RejectRequest(c *gin.Context) {
userIDInterface, hasUser := c.Get("user_id")
if !hasUser {
c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
return
}
currentUserID := userIDInterface.(int)

	var req struct {
		FriendID int `json:"friend_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	// Удаляем запрос
	result, err := h.db.Exec(`
		DELETE FROM friendships 
		WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
	`, req.FriendID, currentUserID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to reject friend request"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(404, gin.H{"success": false, "error": "Friend request not found"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Friend request rejected"})
}

// RemoveFriend - удалить из друзей
func (h *Handler) RemoveFriend(c *gin.Context) {
userIDInterface, hasUser := c.Get("user_id")
if !hasUser {
c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
return
}
currentUserID := userIDInterface.(int)

	var req struct {
		FriendID int `json:"friend_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	// Удаляем дружбу
	result, err := h.db.Exec(`
		DELETE FROM friendships 
		WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
		AND status = 'accepted'
	`, currentUserID, req.FriendID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to remove friend"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(404, gin.H{"success": false, "error": "Friendship not found"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Friend removed"})
}

// GetRequests - получить входящие запросы в друзья
func (h *Handler) GetRequests(c *gin.Context) {
userIDInterface, hasUser := c.Get("user_id")
if !hasUser {
c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
return
}
currentUserID := userIDInterface.(int)

	rows, err := h.db.Query(`
		SELECT 
			f.id, f.user_id, f.friend_id, f.status, f.created_at, f.updated_at,
			u.id, u.name, u.last_name, u.avatar, u.location,
			CASE WHEN ua.last_seen > NOW() - INTERVAL '5 minutes' THEN true ELSE false END as is_online
		FROM friendships f
		JOIN users u ON f.user_id = u.id
		LEFT JOIN user_activity ua ON u.id = ua.user_id
		WHERE f.friend_id = $1 AND f.status = 'pending'
		ORDER BY f.created_at DESC
	`, currentUserID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	requests := []map[string]interface{}{}
	for rows.Next() {
		var friendshipID, userID, friendID, friendUserID int
		var status string
		var createdAt, updatedAt time.Time
		var name string
		var lastName, avatar, location sql.NullString
		var isOnline bool

		rows.Scan(&friendshipID, &userID, &friendID, &status, &createdAt, &updatedAt,
			&friendUserID, &name, &lastName, &avatar, &location, &isOnline)

		friend := map[string]interface{}{
			"id":        friendUserID,
			"name":      name,
			"last_name": lastName.String,
			"is_online": isOnline,
		}
		if avatar.Valid {
			friend["avatar"] = avatar.String
		}
		if location.Valid {
			friend["location"] = location.String
		}

		request := map[string]interface{}{
			"id":         friendshipID,
			"user_id":    userID,
			"friend_id":  friendID,
			"status":     status,
			"created_at": createdAt,
			"updated_at": updatedAt,
			"friend":     friend,
		}

		requests = append(requests, request)
	}

	c.JSON(200, gin.H{"success": true, "data": requests})
}
