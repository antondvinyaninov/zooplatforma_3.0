package org

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/zooplatforma/backend/internal/shared/config"
)

// getUserID извлекает user_id из контекста (установлен AuthOptional middleware)
func getUserID(c *gin.Context) (int, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}
	switch v := userID.(type) {
	case float64:
		return int(v), true
	case int:
		return v, true
	}
	return 0, false
}

func SetupRoutes(r *gin.RouterGroup, db *sql.DB, cfg *config.Config) {
	// Список организаций текущего пользователя (для страницы-селектора)
	// AuthOptional уже применён глобально и читает cookie auth_token
	r.GET("/my", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}

		query := `
			SELECT 
				o.id, o.name, COALESCE(o.short_name, ''), o.type, 
				COALESCE(o.logo, ''), COALESCE(o.bio, ''),
				COALESCE(o.address_city, ''), COALESCE(o.address_region, ''), 
				o.is_verified, o.created_at,
				om.role
			FROM organizations o
			JOIN organization_members om ON o.id = om.organization_id
			WHERE om.user_id = $1 AND o.is_active = true
			ORDER BY o.created_at DESC
		`

		rows, err := db.Query(query, intUserID)
		if err != nil {
			fmt.Printf("❌ Error fetching user organizations: %v\n", err)
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}
		defer rows.Close()

		organizations := []map[string]interface{}{}

		for rows.Next() {
			var (
				id                         int
				name, orgType              string
				shortName, logo, bio       string
				addressCity, addressRegion string
				isVerified                 bool
				createdAt                  string
				role                       string
			)

			if err := rows.Scan(
				&id, &name, &shortName, &orgType,
				&logo, &bio,
				&addressCity, &addressRegion,
				&isVerified, &createdAt,
				&role,
			); err != nil {
				continue
			}

			organizations = append(organizations, map[string]interface{}{
				"id":             id,
				"name":           name,
				"short_name":     shortName,
				"type":           orgType,
				"logo":           logo,
				"bio":            bio,
				"address_city":   addressCity,
				"address_region": addressRegion,
				"is_verified":    isVerified,
				"created_at":     createdAt,
				"role":           role,
			})
		}

		c.JSON(200, gin.H{"success": true, "data": organizations})
	})

	// Проверка членства текущего пользователя в организации
	r.GET("/:orgId/membership", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")

		var role string
		err := db.QueryRow(`
			SELECT role FROM organization_members 
			WHERE organization_id = $1 AND user_id = $2
		`, orgId, intUserID).Scan(&role)

		if err == sql.ErrNoRows {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}

		c.JSON(200, gin.H{"success": true, "role": role})
	})

	// Профиль конкретной организации (кабинет)
	r.GET("/:orgId/profile", func(c *gin.Context) {
		if _, ok := getUserID(c); !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		c.JSON(200, gin.H{"success": true, "message": "org/:orgId/profile — в разработке"})
	})

	// Животные организации
	r.GET("/:orgId/animals", func(c *gin.Context) {
		if _, ok := getUserID(c); !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		c.JSON(200, gin.H{"success": true, "animals": []interface{}{}, "message": "org/:orgId/animals — в разработке"})
	})

	// Команда организации
	r.GET("/:orgId/team", func(c *gin.Context) {
		if _, ok := getUserID(c); !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		c.JSON(200, gin.H{"success": true, "team": []interface{}{}, "message": "org/:orgId/team — в разработке"})
	})

	// Настройки организации
	r.GET("/:orgId/settings", func(c *gin.Context) {
		if _, ok := getUserID(c); !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		c.JSON(200, gin.H{"success": true, "message": "org/:orgId/settings — в разработке"})
	})
}
