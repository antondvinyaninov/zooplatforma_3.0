package moderation

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

// GetReports - получить список жалоб
func (h *Handler) GetReports(c *gin.Context) {
	status := c.Query("status")

	query := `
		SELECT 
			r.id, r.reporter_id, r.entity_type, r.entity_id, r.reason, r.details,
			r.status, r.moderator_id, r.moderator_action, r.moderator_comment,
			r.reviewed_at, r.created_at,
			reporter.name as reporter_name, reporter.email as reporter_email,
			moderator.name as moderator_name
		FROM reports r
		LEFT JOIN users reporter ON r.reporter_id = reporter.id
		LEFT JOIN users moderator ON r.moderator_id = moderator.id
	`

	args := []interface{}{}
	if status != "" {
		query += " WHERE r.status = $1"
		args = append(args, status)
	}

	query += " ORDER BY r.created_at DESC LIMIT 100"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	reports := []map[string]interface{}{}
	for rows.Next() {
		var id, reporterID, entityID int
		var entityType, reason, reportStatus string
		var details, moderatorAction, moderatorComment sql.NullString
		var moderatorID sql.NullInt64
		var reviewedAt sql.NullTime
		var createdAt time.Time
		var reporterName, reporterEmail, moderatorName sql.NullString

		rows.Scan(&id, &reporterID, &entityType, &entityID, &reason,
			&details, &reportStatus, &moderatorID, &moderatorAction, &moderatorComment,
			&reviewedAt, &createdAt, &reporterName, &reporterEmail, &moderatorName)

		report := map[string]interface{}{
			"id":          id,
			"reporter_id": reporterID,
			"entity_type": entityType,
			"entity_id":   entityID,
			"reason":      reason,
			"status":      reportStatus,
			"created_at":  createdAt,
		}

		if details.Valid {
			report["details"] = details.String
		}
		if moderatorID.Valid {
			report["moderator_id"] = int(moderatorID.Int64)
		}
		if moderatorAction.Valid {
			report["moderator_action"] = moderatorAction.String
		}
		if moderatorComment.Valid {
			report["moderator_comment"] = moderatorComment.String
		}
		if reviewedAt.Valid {
			report["reviewed_at"] = reviewedAt.Time
		}
		if reporterName.Valid {
			report["reporter_name"] = reporterName.String
		}
		if reporterEmail.Valid {
			report["reporter_email"] = reporterEmail.String
		}
		if moderatorName.Valid {
			report["moderator_name"] = moderatorName.String
		}

		reports = append(reports, report)
	}

	c.JSON(200, gin.H{"success": true, "data": reports})
}

// ReviewReport - рассмотреть жалобу
func (h *Handler) ReviewReport(c *gin.Context) {
	reportID := c.Param("id")

	currentUserID := 0
	if userID, exists := c.Get("user_id"); exists {
		if uid, ok := userID.(int); ok {
			currentUserID = uid
		}
	}

	var req struct {
		Action  string `json:"action"`
		Comment string `json:"comment"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	result, err := h.db.Exec(`
		UPDATE reports 
		SET status = 'resolved',
		    moderator_id = $1,
		    moderator_action = $2,
		    moderator_comment = $3,
		    reviewed_at = NOW()
		WHERE id = $4
	`, currentUserID, req.Action, req.Comment, reportID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Database error"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(404, gin.H{"success": false, "error": "Report not found"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Report reviewed successfully"})
}

// GetStats - получить статистику модерации
func (h *Handler) GetStats(c *gin.Context) {
	stats := map[string]interface{}{}

	var totalReports, pendingReports, resolvedReports int

	h.db.QueryRow("SELECT COUNT(*) FROM reports").Scan(&totalReports)
	h.db.QueryRow("SELECT COUNT(*) FROM reports WHERE status = 'pending'").Scan(&pendingReports)
	h.db.QueryRow("SELECT COUNT(*) FROM reports WHERE status = 'resolved'").Scan(&resolvedReports)

	stats["total_reports"] = totalReports
	stats["pending_reports"] = pendingReports
	stats["resolved_reports"] = resolvedReports

	// Группировка по типу
	rows, err := h.db.Query(`
		SELECT reason, COUNT(*) as count
		FROM reports
		GROUP BY reason
		ORDER BY count DESC
	`)
	if err == nil {
		defer rows.Close()
		byType := []map[string]interface{}{}
		for rows.Next() {
			var reason string
			var count int
			rows.Scan(&reason, &count)
			byType = append(byType, map[string]interface{}{
				"reason": reason,
				"count":  count,
			})
		}
		stats["by_type"] = byType
	}

	c.JSON(200, gin.H{"success": true, "data": stats})
}
