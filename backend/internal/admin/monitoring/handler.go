package monitoring

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

// GetErrorLogs - получить логи ошибок
func (h *Handler) GetErrorLogs(c *gin.Context) {
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
			if limit > 500 {
				limit = 500
			}
		}
	}

	rows, err := h.db.Query(`
		SELECT 
			id, service, endpoint, method, error_message,
			user_id, ip_address, user_agent, created_at
		FROM error_logs
		ORDER BY created_at DESC
		LIMIT $1
	`, limit)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	errors := []map[string]interface{}{}
	for rows.Next() {
		var id int
		var service, endpoint, method, errorMessage string
		var userID sql.NullInt64
		var ipAddress, userAgent sql.NullString
		var createdAt time.Time

		rows.Scan(&id, &service, &endpoint, &method, &errorMessage,
			&userID, &ipAddress, &userAgent, &createdAt)

		errorLog := map[string]interface{}{
			"id":            id,
			"service":       service,
			"endpoint":      endpoint,
			"method":        method,
			"error_message": errorMessage,
			"created_at":    createdAt,
		}

		if userID.Valid {
			errorLog["user_id"] = int(userID.Int64)
		}
		if ipAddress.Valid {
			errorLog["ip_address"] = ipAddress.String
		}
		if userAgent.Valid {
			errorLog["user_agent"] = userAgent.String
		}

		errors = append(errors, errorLog)
	}

	c.JSON(200, gin.H{"success": true, "data": errors})
}

// GetMetrics - получить системные метрики
func (h *Handler) GetMetrics(c *gin.Context) {
	metrics := map[string]interface{}{}

	// Активные пользователи
	var activeUsers int
	h.db.QueryRow(`
		SELECT COUNT(DISTINCT user_id) 
		FROM user_activity 
		WHERE last_seen > NOW() - INTERVAL '15 minutes'
	`).Scan(&activeUsers)
	metrics["active_users"] = activeUsers

	// Размер БД
	var dbSizeMB float64
	h.db.QueryRow(`
		SELECT pg_database_size(current_database()) / 1024.0 / 1024.0
	`).Scan(&dbSizeMB)
	metrics["database_size_mb"] = dbSizeMB

	// Ошибки за последний час
	var lastHourErrors int
	h.db.QueryRow(`
		SELECT COUNT(*) 
		FROM error_logs 
		WHERE created_at > NOW() - INTERVAL '1 hour'
	`).Scan(&lastHourErrors)
	metrics["last_hour_errors"] = lastHourErrors

	// Ошибки за последние 24 часа
	var last24HourErrors int
	h.db.QueryRow(`
		SELECT COUNT(*) 
		FROM error_logs 
		WHERE created_at > NOW() - INTERVAL '24 hours'
	`).Scan(&last24HourErrors)
	metrics["last_24hour_errors"] = last24HourErrors

	// Общее количество ошибок
	var totalErrors int
	h.db.QueryRow("SELECT COUNT(*) FROM error_logs").Scan(&totalErrors)
	metrics["total_errors"] = totalErrors

	c.JSON(200, gin.H{"success": true, "data": metrics})
}

// GetErrorStats - получить статистику ошибок по сервисам
func (h *Handler) GetErrorStats(c *gin.Context) {
	rows, err := h.db.Query(`
		SELECT service, COUNT(*) as count
		FROM error_logs
		WHERE created_at > NOW() - INTERVAL '24 hours'
		GROUP BY service
		ORDER BY count DESC
	`)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	stats := map[string]int{}
	for rows.Next() {
		var service string
		var count int
		rows.Scan(&service, &count)
		stats[service] = count
	}

	c.JSON(200, gin.H{"success": true, "data": stats})
}
