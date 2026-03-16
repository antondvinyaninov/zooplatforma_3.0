package users

import (
	"github.com/gin-gonic/gin"
)

// GetStats - получить общую статистику пользователей
func (h *Handler) GetStats(c *gin.Context) {
	// Получаем общее количество пользователей
	var total, verified int
	err := h.db.QueryRow(`
		SELECT 
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE verified = true) as verified
		FROM users
	`).Scan(&total, &verified)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Получаем количество онлайн пользователей
	var online int
	err = h.db.QueryRow(`
		SELECT COUNT(*) 
		FROM user_activity 
		WHERE last_seen > NOW() - INTERVAL '1 minute'
	`).Scan(&online)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Получаем статистику постов
	var posts, likes, comments int
	statsQuery := `
		SELECT 
			COUNT(DISTINCT p.id) as posts,
			COALESCE(SUM(p.likes_count), 0) as likes,
			COALESCE(SUM(p.comments_count), 0) as comments
		FROM posts p
		WHERE p.is_deleted = false
	`

	err = h.db.QueryRow(statsQuery).Scan(&posts, &likes, &comments)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Получаем статистику питомцев
	var petsTotal, petsOwner, petsCurator int
	petsQuery := `
		SELECT 
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE relationship = 'owner' OR relationship IS NULL) as owner,
			COUNT(*) FILTER (WHERE relationship = 'curator') as curator
		FROM pets
	`

	err = h.db.QueryRow(petsQuery).Scan(&petsTotal, &petsOwner, &petsCurator)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	stats := map[string]interface{}{
		"total":          total,
		"verified_users": verified,
		"online":         online,
		"posts":          posts,
		"likes":          likes,
		"comments":       comments,
		"pets_total":     petsTotal,
		"pets_owner":     petsOwner,
		"pets_curator":   petsCurator,
	}

	c.JSON(200, gin.H{"success": true, "data": stats})
}
