package activity

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

// GetUserActivityLogs - получить логи активности пользователей
func (h *Handler) GetUserActivityLogs(c *gin.Context) {
	userIDStr := c.Query("user_id")
	actionType := c.Query("action_type")
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
			if limit > 1000 {
				limit = 1000
			}
		}
	}

	query := `
		SELECT 
			ual.id, ual.user_id,
			u.name || ' ' || COALESCE(u.last_name, '') as user_name,
			u.email as user_email,
			ual.action_type, ual.target_type, ual.target_id,
			ual.metadata, ual.ip_address, ual.user_agent, ual.created_at
		FROM user_activity_logs ual
		LEFT JOIN users u ON ual.user_id = u.id
		WHERE 1=1
	`

	args := []interface{}{}
	argIndex := 1

	if userIDStr != "" {
		if userID, err := strconv.Atoi(userIDStr); err == nil {
			query += " AND ual.user_id = $" + strconv.Itoa(argIndex)
			args = append(args, userID)
			argIndex++
		}
	}

	if actionType != "" {
		query += " AND ual.action_type = $" + strconv.Itoa(argIndex)
		args = append(args, actionType)
		argIndex++
	}

	if dateFrom != "" {
		query += " AND ual.created_at >= $" + strconv.Itoa(argIndex)
		args = append(args, dateFrom)
		argIndex++
	}

	if dateTo != "" {
		query += " AND ual.created_at <= $" + strconv.Itoa(argIndex)
		args = append(args, dateTo)
		argIndex++
	}

	query += " ORDER BY ual.created_at DESC LIMIT $" + strconv.Itoa(argIndex)
	args = append(args, limit)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	logs := []map[string]interface{}{}
	for rows.Next() {
		var id, targetID int
		var userID sql.NullInt64
		var userName, userEmail, actionType, targetType sql.NullString
		var metadata, ipAddress, userAgent sql.NullString
		var createdAt time.Time

		rows.Scan(&id, &userID, &userName, &userEmail, &actionType,
			&targetType, &targetID, &metadata, &ipAddress, &userAgent, &createdAt)

		logEntry := map[string]interface{}{
			"id":         id,
			"target_id":  targetID,
			"created_at": createdAt,
		}

		if userID.Valid {
			logEntry["user_id"] = int(userID.Int64)
		}
		if userName.Valid {
			logEntry["user_name"] = userName.String
		}
		if userEmail.Valid {
			logEntry["user_email"] = userEmail.String
		}
		if actionType.Valid {
			logEntry["action_type"] = actionType.String
		}
		if targetType.Valid {
			logEntry["target_type"] = targetType.String
		}
		if metadata.Valid {
			logEntry["metadata"] = metadata.String
		}
		if ipAddress.Valid {
			logEntry["ip_address"] = ipAddress.String
		}
		if userAgent.Valid {
			logEntry["user_agent"] = userAgent.String
		}

		logs = append(logs, logEntry)
	}

	c.JSON(200, gin.H{"success": true, "data": logs})
}

// GetUserActivityStats - получить статистику активности пользователей
func (h *Handler) GetUserActivityStats(c *gin.Context) {
	stats := map[string]interface{}{}

	var totalActions, actionsLast24h, actionsLast7days int

	h.db.QueryRow("SELECT COUNT(*) FROM user_activity_logs").Scan(&totalActions)
	h.db.QueryRow(`
		SELECT COUNT(*) FROM user_activity_logs 
		WHERE created_at > NOW() - INTERVAL '24 hours'
	`).Scan(&actionsLast24h)
	h.db.QueryRow(`
		SELECT COUNT(*) FROM user_activity_logs 
		WHERE created_at > NOW() - INTERVAL '7 days'
	`).Scan(&actionsLast7days)

	stats["total_actions"] = totalActions
	stats["actions_last_24h"] = actionsLast24h
	stats["actions_last_7days"] = actionsLast7days

	// Группировка по типу действия
	rows, err := h.db.Query(`
		SELECT action_type, COUNT(*) as count
		FROM user_activity_logs
		WHERE action_type IS NOT NULL
		GROUP BY action_type
		ORDER BY count DESC
		LIMIT 20
	`)
	if err == nil {
		defer rows.Close()
		byActionType := []map[string]interface{}{}
		for rows.Next() {
			var actionType string
			var count int
			rows.Scan(&actionType, &count)
			byActionType = append(byActionType, map[string]interface{}{
				"action_type": actionType,
				"count":       count,
			})
		}
		stats["by_action_type"] = byActionType
	}

	// Топ активных пользователей
	rows, err = h.db.Query(`
		SELECT 
			ual.user_id, u.email as user_email, u.name as user_name,
			COUNT(*) as count
		FROM user_activity_logs ual
		LEFT JOIN users u ON ual.user_id = u.id
		WHERE ual.user_id IS NOT NULL
		GROUP BY ual.user_id, u.email, u.name
		ORDER BY count DESC
		LIMIT 10
	`)
	if err == nil {
		defer rows.Close()
		mostActiveUsers := []map[string]interface{}{}
		for rows.Next() {
			var userID, count int
			var userEmail, userName sql.NullString
			rows.Scan(&userID, &userEmail, &userName, &count)
			user := map[string]interface{}{
				"user_id": userID,
				"count":   count,
			}
			if userEmail.Valid {
				user["user_email"] = userEmail.String
			}
			if userName.Valid {
				user["user_name"] = userName.String
			}
			mostActiveUsers = append(mostActiveUsers, user)
		}
		stats["most_active_users"] = mostActiveUsers
	}

	c.JSON(200, gin.H{"success": true, "data": stats})
}

// GetUserActivityByUserID - получить активность конкретного пользователя
func (h *Handler) GetUserActivityByUserID(c *gin.Context) {
	userID := c.Param("id")

	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
			if limit > 1000 {
				limit = 1000
			}
		}
	}

	rows, err := h.db.Query(`
		SELECT 
			id, action_type, target_type, target_id,
			metadata, ip_address, user_agent, created_at
		FROM user_activity_logs
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`, userID, limit)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	logs := []map[string]interface{}{}
	for rows.Next() {
		var id, targetID int
		var actionType, targetType sql.NullString
		var metadata, ipAddress, userAgent sql.NullString
		var createdAt time.Time

		rows.Scan(&id, &actionType, &targetType, &targetID,
			&metadata, &ipAddress, &userAgent, &createdAt)

		logEntry := map[string]interface{}{
			"id":         id,
			"target_id":  targetID,
			"created_at": createdAt,
		}

		if actionType.Valid {
			logEntry["action_type"] = actionType.String
		}
		if targetType.Valid {
			logEntry["target_type"] = targetType.String
		}
		if metadata.Valid {
			logEntry["metadata"] = metadata.String
		}
		if ipAddress.Valid {
			logEntry["ip_address"] = ipAddress.String
		}
		if userAgent.Valid {
			logEntry["user_agent"] = userAgent.String
		}

		logs = append(logs, logEntry)
	}

	c.JSON(200, gin.H{"success": true, "data": logs})
}

// GetAdminLogs - получить логи действий администраторов
func (h *Handler) GetAdminLogs(c *gin.Context) {
	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
			if limit > 1000 {
				limit = 1000
			}
		}
	}

	rows, err := h.db.Query(`
		SELECT 
			al.id, al.admin_id, a.email as admin_email,
			al.action_type, al.target_type, al.target_id, al.target_name,
			al.details, al.ip_address, al.created_at
		FROM admin_logs al
		LEFT JOIN users a ON al.admin_id = a.id
		ORDER BY al.created_at DESC
		LIMIT $1
	`, limit)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	logs := []map[string]interface{}{}
	for rows.Next() {
		var id, adminID, targetID int
		var adminEmail, actionType, targetType sql.NullString
		var targetName, details, ipAddress sql.NullString
		var createdAt time.Time

		rows.Scan(&id, &adminID, &adminEmail, &actionType, &targetType,
			&targetID, &targetName, &details, &ipAddress, &createdAt)

		logEntry := map[string]interface{}{
			"id":         id,
			"admin_id":   adminID,
			"target_id":  targetID,
			"created_at": createdAt,
		}

		if adminEmail.Valid {
			logEntry["admin_email"] = adminEmail.String
		}
		if actionType.Valid {
			logEntry["action_type"] = actionType.String
		}
		if targetType.Valid {
			logEntry["target_type"] = targetType.String
		}
		if targetName.Valid {
			logEntry["target_name"] = targetName.String
		}
		if details.Valid {
			logEntry["details"] = details.String
		}
		if ipAddress.Valid {
			logEntry["ip_address"] = ipAddress.String
		}

		logs = append(logs, logEntry)
	}

	c.JSON(200, gin.H{"success": true, "data": logs})
}

// GetAdminLogsStats - получить статистику логов администраторов
func (h *Handler) GetAdminLogsStats(c *gin.Context) {
	stats := map[string]interface{}{}

	var totalLogs, logsLast24h, logsLast7days int

	h.db.QueryRow("SELECT COUNT(*) FROM admin_logs").Scan(&totalLogs)
	h.db.QueryRow(`
		SELECT COUNT(*) FROM admin_logs 
		WHERE created_at > NOW() - INTERVAL '24 hours'
	`).Scan(&logsLast24h)
	h.db.QueryRow(`
		SELECT COUNT(*) FROM admin_logs 
		WHERE created_at > NOW() - INTERVAL '7 days'
	`).Scan(&logsLast7days)

	stats["total_logs"] = totalLogs
	stats["logs_last_24h"] = logsLast24h
	stats["logs_last_7days"] = logsLast7days

	// Группировка по типу действия
	rows, err := h.db.Query(`
		SELECT action_type, COUNT(*) as count
		FROM admin_logs
		WHERE action_type IS NOT NULL
		GROUP BY action_type
		ORDER BY count DESC
		LIMIT 10
	`)
	if err == nil {
		defer rows.Close()
		byActionType := []map[string]interface{}{}
		for rows.Next() {
			var actionType string
			var count int
			rows.Scan(&actionType, &count)
			byActionType = append(byActionType, map[string]interface{}{
				"action_type": actionType,
				"count":       count,
			})
		}
		stats["by_action_type"] = byActionType
	}

	// Топ админов
	rows, err = h.db.Query(`
		SELECT 
			al.admin_id, u.email as admin_email, COUNT(*) as count
		FROM admin_logs al
		LEFT JOIN users u ON al.admin_id = u.id
		GROUP BY al.admin_id, u.email
		ORDER BY count DESC
		LIMIT 10
	`)
	if err == nil {
		defer rows.Close()
		topAdmins := []map[string]interface{}{}
		for rows.Next() {
			var adminID, count int
			var adminEmail sql.NullString
			rows.Scan(&adminID, &adminEmail, &count)
			admin := map[string]interface{}{
				"admin_id": adminID,
				"count":    count,
			}
			if adminEmail.Valid {
				admin["admin_email"] = adminEmail.String
			}
			topAdmins = append(topAdmins, admin)
		}
		stats["top_admins"] = topAdmins
	}

	c.JSON(200, gin.H{"success": true, "data": stats})
}

// GetActivityStats - получить общую статистику активности
func (h *Handler) GetActivityStats(c *gin.Context) {
	stats := map[string]interface{}{}

	// Online now (последние 5 минут)
	var onlineNow int
	h.db.QueryRow(`
		SELECT COUNT(DISTINCT user_id) 
		FROM user_activity 
		WHERE last_seen > NOW() - INTERVAL '1 minute'
	`).Scan(&onlineNow)
	stats["online_now"] = onlineNow

	// Active last hour
	var activeLastHour int
	h.db.QueryRow(`
		SELECT COUNT(DISTINCT user_id) 
		FROM user_activity 
		WHERE last_seen > NOW() - INTERVAL '1 hour'
	`).Scan(&activeLastHour)
	stats["active_last_hour"] = activeLastHour

	// Active last 24h
	var activeLast24h int
	h.db.QueryRow(`
		SELECT COUNT(DISTINCT user_id) 
		FROM user_activity 
		WHERE last_seen > NOW() - INTERVAL '24 hours'
	`).Scan(&activeLast24h)
	stats["active_last_24h"] = activeLast24h

	c.JSON(200, gin.H{"success": true, "data": stats})
}
