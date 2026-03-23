package gov

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
	// Список государственных органов текущего пользователя
	// На старте используем таблицу organization_members с фильтром по типу организации
	r.GET("/my", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}

		// Госорганы — это организации с типом из списка gov-типов
		// (в будущем вынести в отдельную таблицу gov_members)
		query := `
			SELECT 
				o.id, o.name, COALESCE(o.short_name, ''), o.type,
				COALESCE(o.logo, ''), COALESCE(o.bio, ''),
				COALESCE(o.address_city, ''), COALESCE(o.address_region, ''),
				o.is_verified, o.created_at,
				om.role
			FROM organizations o
			JOIN organization_members om ON o.id = om.organization_id
			WHERE om.user_id = $1 
			  AND o.is_active = true
			  AND o.type IN ('municipality', 'vet_department', 'animal_control', 'inspectorate', 'ministry')
			ORDER BY o.created_at DESC
		`

		rows, err := db.Query(query, intUserID)
		if err != nil {
			fmt.Printf("❌ Error fetching gov entities: %v\n", err)
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}
		defer rows.Close()

		entities := []map[string]interface{}{}

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

			entities = append(entities, map[string]interface{}{
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

		c.JSON(200, gin.H{"success": true, "data": entities})
	})

	// Проверка членства в ведомстве
	r.GET("/:govId/membership", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		govId := c.Param("govId")

		var role string
		err := db.QueryRow(`
			SELECT role FROM organization_members 
			WHERE organization_id = $1 AND user_id = $2
		`, govId, intUserID).Scan(&role)

		if err == sql.ErrNoRows {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this entity"})
			return
		}
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}

		c.JSON(200, gin.H{"success": true, "role": role})
	})

	// Профиль ведомства
	r.GET("/:govId/profile", func(c *gin.Context) {
		if _, ok := getUserID(c); !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		c.JSON(200, gin.H{"success": true, "message": "gov/:govId/profile — в разработке"})
	})

	// Реестр организаций
	r.GET("/:govId/registry", func(c *gin.Context) {
		if _, ok := getUserID(c); !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		c.JSON(200, gin.H{"success": true, "registry": []interface{}{}, "message": "gov/:govId/registry — в разработке"})
	})

	// Сводные отчёты
	r.GET("/:govId/reports", func(c *gin.Context) {
		if _, ok := getUserID(c); !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		c.JSON(200, gin.H{"success": true, "reports": []interface{}{}, "message": "gov/:govId/reports — в разработке"})
	})

	// Настройки
	r.GET("/:govId/settings", func(c *gin.Context) {
		if _, ok := getUserID(c); !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		c.JSON(200, gin.H{"success": true, "message": "gov/:govId/settings — в разработке"})
	})
}
