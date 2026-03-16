package announcements

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

// GetAnnouncements - получить список объявлений
func (h *Handler) GetAnnouncements(c *gin.Context) {
	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	if o := c.Query("offset"); o != "" {
		if parsedOffset, err := strconv.Atoi(o); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	category := c.Query("category")

	query := `
		SELECT a.id, a.title, a.description, a.category, a.price, a.location, 
		       a.contact_phone, a.contact_email, a.status, a.created_at,
		       u.id, u.name, u.last_name, u.avatar
		FROM announcements a
		JOIN users u ON a.user_id = u.id
		WHERE a.status = 'active'
	`

	args := []interface{}{}
	argIndex := 1

	if category != "" {
		query += ` AND a.category = $` + strconv.Itoa(argIndex)
		args = append(args, category)
		argIndex++
	}

	query += ` ORDER BY a.created_at DESC LIMIT $` + strconv.Itoa(argIndex) + ` OFFSET $` + strconv.Itoa(argIndex+1)
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	announcements := []map[string]interface{}{}
	for rows.Next() {
		var id, userID int
		var title, description, category, status string
		var price sql.NullFloat64
		var location, contactPhone, contactEmail sql.NullString
		var createdAt time.Time
		var userName, userLastName string
		var userAvatar sql.NullString

		rows.Scan(&id, &title, &description, &category, &price, &location,
			&contactPhone, &contactEmail, &status, &createdAt,
			&userID, &userName, &userLastName, &userAvatar)

		announcement := map[string]interface{}{
			"id":          id,
			"title":       title,
			"description": description,
			"category":    category,
			"status":      status,
			"created_at":  createdAt,
			"user": map[string]interface{}{
				"id":        userID,
				"name":      userName,
				"last_name": userLastName,
			},
		}

		if price.Valid {
			announcement["price"] = price.Float64
		}
		if location.Valid {
			announcement["location"] = location.String
		}
		if contactPhone.Valid {
			announcement["contact_phone"] = contactPhone.String
		}
		if contactEmail.Valid {
			announcement["contact_email"] = contactEmail.String
		}
		if userAvatar.Valid {
			announcement["user"].(map[string]interface{})["avatar"] = userAvatar.String
		}

		announcements = append(announcements, announcement)
	}

	c.JSON(200, gin.H{"success": true, "data": announcements})
}

// GetAnnouncementByID - получить объявление по ID
func (h *Handler) GetAnnouncementByID(c *gin.Context) {
	announcementID := c.Param("id")

	var id, userID int
	var title, description, category, status string
	var price sql.NullFloat64
	var location, contactPhone, contactEmail sql.NullString
	var createdAt time.Time
	var userName, userLastName string
	var userAvatar sql.NullString

	err := h.db.QueryRow(`
		SELECT a.id, a.title, a.description, a.category, a.price, a.location,
		       a.contact_phone, a.contact_email, a.status, a.created_at,
		       u.id, u.name, u.last_name, u.avatar
		FROM announcements a
		JOIN users u ON a.user_id = u.id
		WHERE a.id = $1
	`, announcementID).Scan(&id, &title, &description, &category, &price, &location,
		&contactPhone, &contactEmail, &status, &createdAt,
		&userID, &userName, &userLastName, &userAvatar)

	if err == sql.ErrNoRows {
		c.JSON(404, gin.H{"success": false, "error": "Announcement not found"})
		return
	}
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	announcement := map[string]interface{}{
		"id":          id,
		"title":       title,
		"description": description,
		"category":    category,
		"status":      status,
		"created_at":  createdAt,
		"user": map[string]interface{}{
			"id":        userID,
			"name":      userName,
			"last_name": userLastName,
		},
	}

	if price.Valid {
		announcement["price"] = price.Float64
	}
	if location.Valid {
		announcement["location"] = location.String
	}
	if contactPhone.Valid {
		announcement["contact_phone"] = contactPhone.String
	}
	if contactEmail.Valid {
		announcement["contact_email"] = contactEmail.String
	}
	if userAvatar.Valid {
		announcement["user"].(map[string]interface{})["avatar"] = userAvatar.String
	}

	c.JSON(200, gin.H{"success": true, "data": announcement})
}
