package notifications

import (
	"database/sql"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// GetNotifications - получить уведомления
func (h *Handler) GetNotifications(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	currentUserID := userIDInterface.(int)

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	rows, err := h.db.Query(`
		SELECT n.id, n.type, n.message, n.is_read, n.created_at,
		       u.id, u.name, u.last_name, u.avatar
		FROM notifications n
		LEFT JOIN users u ON n.actor_id = u.id
		WHERE n.user_id = $1
		ORDER BY n.created_at DESC
		LIMIT $2
	`, currentUserID, limit)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	notifications := []map[string]interface{}{}
	for rows.Next() {
		var id int
		var notifType, message string
		var isRead bool
		var createdAt time.Time
		var senderID sql.NullInt64
		var senderName, senderLastName sql.NullString
		var senderAvatar sql.NullString

		rows.Scan(&id, &notifType, &message, &isRead, &createdAt,
			&senderID, &senderName, &senderLastName, &senderAvatar)

		notification := map[string]interface{}{
			"id":         id,
			"type":       notifType,
			"title":      message, // Используем message как title для совместимости
			"message":    message,
			"is_read":    isRead,
			"created_at": createdAt,
		}

		if senderID.Valid {
			sender := map[string]interface{}{
				"id": int(senderID.Int64),
			}
			if senderName.Valid {
				sender["name"] = senderName.String
			}
			if senderLastName.Valid {
				sender["last_name"] = senderLastName.String
			}
			if senderAvatar.Valid {
				sender["avatar"] = senderAvatar.String
			}
			notification["sender"] = sender
		}

		notifications = append(notifications, notification)
	}

	c.JSON(200, gin.H{"success": true, "data": notifications})
}

// GetUnreadCount - получить количество непрочитанных уведомлений
func (h *Handler) GetUnreadCount(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	currentUserID := userIDInterface.(int)

	var count int
	err := h.db.QueryRow(`
		SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false
	`, currentUserID).Scan(&count)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "data": gin.H{"count": count}})
}

// MarkAsRead - отметить уведомление как прочитанное
func (h *Handler) MarkAsRead(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	currentUserID := userIDInterface.(int)

	notificationID := c.Param("id")

	result, err := h.db.Exec(`
		UPDATE notifications 
		SET is_read = true
		WHERE id = $1 AND user_id = $2
	`, notificationID, currentUserID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to mark as read"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(404, gin.H{"success": false, "error": "Notification not found"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Notification marked as read"})
}

// MarkAllAsRead - отметить все уведомления как прочитанные
func (h *Handler) MarkAllAsRead(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	currentUserID := userIDInterface.(int)

	_, err := h.db.Exec(`
		UPDATE notifications 
		SET is_read = true
		WHERE user_id = $1 AND is_read = false
	`, currentUserID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to mark all as read"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "All notifications marked as read"})
}
