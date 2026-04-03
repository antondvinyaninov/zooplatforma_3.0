package followers

import (
	"database/sql"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/zooplatforma/backend/internal/shared/notificationservice"
)

type Handler struct {
	db              *sql.DB
	notificationSvc *notificationservice.Service
}

func NewHandler(db *sql.DB, notifSvc *notificationservice.Service) *Handler {
	return &Handler{
		db:              db,
		notificationSvc: notifSvc,
	}
}

// Follow - подписаться на пользователя
func (h *Handler) Follow(c *gin.Context) {
	targetUserID := c.Param("id")

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

	// Нельзя подписаться на самого себя
	targetID := 0
	err := h.db.QueryRow("SELECT id FROM users WHERE id = $1", targetUserID).Scan(&targetID)
	if err != nil {
		c.JSON(404, gin.H{"success": false, "error": "User not found"})
		return
	}
	if currentUserID == targetID {
		c.JSON(400, gin.H{"success": false, "error": "Cannot follow yourself"})
		return
	}

	// Используем xmax или проверяем affected rows для postgres, 
	// но проще вернуть id или просто проверить affected rows
	result, err := h.db.Exec(`
		INSERT INTO followers (follower_id, following_id) 
		VALUES ($1, $2)
		ON CONFLICT (follower_id, following_id) DO NOTHING
	`, currentUserID, targetID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to follow user"})
		return
	}

	rowsAffected, _ := result.RowsAffected()

	if rowsAffected > 0 {
		// Отправляем уведомление только если это новая подписка
		var followerName string
		h.db.QueryRow("SELECT name FROM users WHERE id = $1", currentUserID).Scan(&followerName)
		_ = h.notificationSvc.NotifyNewFollower(c.Request.Context(), targetID, currentUserID, followerName)
	}

	c.JSON(200, gin.H{"success": true, "message": "Successfully followed"})
}

// Unfollow - отписаться от пользователя
func (h *Handler) Unfollow(c *gin.Context) {
	targetUserID := c.Param("id")

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

	_, err := h.db.Exec(`
		DELETE FROM followers 
		WHERE follower_id = $1 AND following_id = $2
	`, currentUserID, targetUserID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to unfollow user"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Successfully unfollowed"})
}

// GetFollowers - получить список подписчиков (тех, кто подписан на id)
func (h *Handler) GetFollowers(c *gin.Context) {
	targetUserID := c.Param("id")

	rows, err := h.db.Query(`
		SELECT 
			u.id, u.name, u.last_name, u.avatar, u.location,
			CASE WHEN ua.last_seen > NOW() - INTERVAL '5 minutes' THEN true ELSE false END as is_online,
			f.created_at
		FROM followers f
		JOIN users u ON u.id = f.follower_id
		LEFT JOIN user_activity ua ON u.id = ua.user_id
		WHERE f.following_id = $1
		AND NOT EXISTS (
			SELECT 1 FROM friendships fr 
			WHERE (fr.user_id = f.following_id AND fr.friend_id = f.follower_id OR fr.user_id = f.follower_id AND fr.friend_id = f.following_id) 
			AND fr.status = 'accepted'
		)
		ORDER BY f.created_at DESC
	`, targetUserID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to get followers"})
		return
	}
	defer rows.Close()

	users := []map[string]interface{}{}
	for rows.Next() {
		var id int
		var name string
		var lastName, avatar, location sql.NullString
		var isOnline bool
		var followedAt time.Time

		err := rows.Scan(&id, &name, &lastName, &avatar, &location, &isOnline, &followedAt)
		if err != nil {
			continue
		}

		user := map[string]interface{}{
			"id":          id,
			"name":        name,
			"last_name":   lastName.String,
			"is_online":   isOnline,
			"followed_at": followedAt,
		}
		if avatar.Valid {
			user["avatar"] = avatar.String
		}
		if location.Valid {
			user["location"] = location.String
		}

		users = append(users, user)
	}

	c.JSON(200, gin.H{"success": true, "data": users})
}

// GetFollowing - получить список подписок (на кого подписан id)
func (h *Handler) GetFollowing(c *gin.Context) {
	targetUserID := c.Param("id")

	rows, err := h.db.Query(`
		SELECT 
			u.id, u.name, u.last_name, u.avatar, u.location,
			CASE WHEN ua.last_seen > NOW() - INTERVAL '5 minutes' THEN true ELSE false END as is_online,
			f.created_at
		FROM followers f
		JOIN users u ON u.id = f.following_id
		LEFT JOIN user_activity ua ON u.id = ua.user_id
		WHERE f.follower_id = $1
		AND NOT EXISTS (
			SELECT 1 FROM friendships fr 
			WHERE (fr.user_id = f.following_id AND fr.friend_id = f.follower_id OR fr.user_id = f.follower_id AND fr.friend_id = f.following_id) 
			AND fr.status = 'accepted'
		)
		ORDER BY f.created_at DESC
	`, targetUserID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to get following"})
		return
	}
	defer rows.Close()

	users := []map[string]interface{}{}
	for rows.Next() {
		var id int
		var name string
		var lastName, avatar, location sql.NullString
		var isOnline bool
		var followedAt time.Time

		err := rows.Scan(&id, &name, &lastName, &avatar, &location, &isOnline, &followedAt)
		if err != nil {
			continue
		}

		user := map[string]interface{}{
			"id":          id,
			"name":        name,
			"last_name":   lastName.String,
			"is_online":   isOnline,
			"followed_at": followedAt,
		}
		if avatar.Valid {
			user["avatar"] = avatar.String
		}
		if location.Valid {
			user["location"] = location.String
		}

		users = append(users, user)
	}

	c.JSON(200, gin.H{"success": true, "data": users})
}

// GetStatus - получить статус подписки (текущий пользователь -> target)
func (h *Handler) GetStatus(c *gin.Context) {
	targetUserID := c.Param("id")

	userIDInterface, hasUser := c.Get("user_id")
	if !hasUser {
		c.JSON(200, gin.H{"success": true, "data": map[string]interface{}{
			"is_following": false,
			"is_follower":  false,
		}})
		return
	}

	currentUserID, ok := userIDInterface.(int)
	if !ok {
		c.JSON(401, gin.H{"success": false, "error": "Invalid user ID"})
		return
	}

	var isFollowing, isFollower bool

	h.db.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM followers WHERE follower_id = $1 AND following_id = $2)
	`, currentUserID, targetUserID).Scan(&isFollowing)

	h.db.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM followers WHERE follower_id = $1 AND following_id = $2)
	`, targetUserID, currentUserID).Scan(&isFollower)

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"is_following": isFollowing,
			"is_follower":  isFollower,
		},
	})
}
