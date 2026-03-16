package reports

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// CreateReport - создать жалобу
func (h *Handler) CreateReport(c *gin.Context) {
	currentUserID := 0
	if userID, exists := c.Get("user_id"); exists {
		if uid, ok := userID.(int); ok {
			currentUserID = uid
		}
	}
	if currentUserID == 0 {
		currentUserID = 1
	}

	var req struct {
		EntityType string `json:"entity_type"` // "post", "comment", "user"
		EntityID   int    `json:"entity_id"`
		Reason     string `json:"reason"`
		Details    string `json:"details"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	// Валидация
	if req.EntityType == "" || req.EntityID == 0 || req.Reason == "" {
		c.JSON(400, gin.H{"success": false, "error": "entity_type, entity_id and reason are required"})
		return
	}

	// Проверяем что пользователь еще не жаловался на этот объект
	var exists bool
	h.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM reports 
			WHERE reporter_id = $1 AND entity_type = $2 AND entity_id = $3
		)
	`, currentUserID, req.EntityType, req.EntityID).Scan(&exists)

	if exists {
		c.JSON(400, gin.H{"success": false, "error": "You have already reported this"})
		return
	}

	// Создаем жалобу
	var reportID int
	err := h.db.QueryRow(`
		INSERT INTO reports (reporter_id, entity_type, entity_id, reason, details, status, created_at)
		VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
		RETURNING id
	`, currentUserID, req.EntityType, req.EntityID, req.Reason, req.Details).Scan(&reportID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to create report"})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "Report created successfully",
		"data":    gin.H{"id": reportID},
	})
}
