package sitemap

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

type SitemapItem struct {
	ID        int       `json:"id"`
	UpdatedAt time.Time `json:"updated_at"`
}

// GetSitemapPosts отдает список id и updated_at всех постов
func (h *Handler) GetSitemapPosts(c *gin.Context) {
	query := `
		SELECT id, updated_at 
		FROM posts 
		ORDER BY id DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch posts"})
		return
	}
	defer rows.Close()

	var posts []SitemapItem
	for rows.Next() {
		var item SitemapItem
		if err := rows.Scan(&item.ID, &item.UpdatedAt); err != nil {
			continue
		}
		posts = append(posts, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    posts,
	})
}

// GetSitemapUsers отдает список id и updated_at (или created_at) всех пользователей
func (h *Handler) GetSitemapUsers(c *gin.Context) {
	query := `
		SELECT id, created_at as updated_at 
		FROM users 
		ORDER BY id DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch users"})
		return
	}
	defer rows.Close()

	var users []SitemapItem
	for rows.Next() {
		var item SitemapItem
		if err := rows.Scan(&item.ID, &item.UpdatedAt); err != nil {
			continue
		}
		users = append(users, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    users,
	})
}

// GetSitemapPets отдает список id и updated_at всех питомцев
func (h *Handler) GetSitemapPets(c *gin.Context) {
	query := `
		SELECT id, updated_at 
		FROM pets 
		ORDER BY id DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch pets"})
		return
	}
	defer rows.Close()

	var pets []SitemapItem
	for rows.Next() {
		var item SitemapItem
		if err := rows.Scan(&item.ID, &item.UpdatedAt); err != nil {
			continue
		}
		pets = append(pets, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    pets,
	})
}

// GetSitemapOrganizations отдает список id и updated_at всех приютов и организаций
func (h *Handler) GetSitemapOrganizations(c *gin.Context) {
	query := `
		SELECT id, updated_at 
		FROM organizations 
		ORDER BY id DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch organizations"})
		return
	}
	defer rows.Close()

	var orgs []SitemapItem
	for rows.Next() {
		var item SitemapItem
		if err := rows.Scan(&item.ID, &item.UpdatedAt); err != nil {
			continue
		}
		orgs = append(orgs, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    orgs,
	})
}
