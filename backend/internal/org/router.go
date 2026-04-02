package org

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/zooplatforma/backend/internal/mainfrontend/pets"
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
	// Список организаций текущего пользователя
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

	// Проверка членства
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

	// Профиль организации
	r.GET("/:orgId/profile", func(c *gin.Context) {
		if _, ok := getUserID(c); !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		c.JSON(200, gin.H{"success": true, "message": "org/:orgId/profile — в разработке"})
	})

	// Питомцы организации — список
	r.GET("/:orgId/pets", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")

		// Проверяем членство
		var role string
		memberErr := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&role)
		if memberErr == sql.ErrNoRows {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}

		rows, err := db.Query(`
			SELECT 
				p.id, p.name, p.species_id, COALESCE(s.name, '') as species_name,
				p.breed_id, COALESCE(b.name, '') as breed_name,
				COALESCE(p.birth_date::text, ''), COALESCE(p.gender, ''),
				COALESCE(p.description, ''), COALESCE(p.photo_url, ''),
				COALESCE(p.color, ''), COALESCE(p.size, ''),
				COALESCE(p.org_pet_number, 0),
				COALESCE(p.marking_specialist, ''), COALESCE(p.marking_org, ''),
				COALESCE(p.created_at::text, '')
			FROM pets p
			LEFT JOIN species s ON p.species_id = s.id
			LEFT JOIN breeds b ON p.breed_id = b.id
			WHERE p.org_id = $1
			ORDER BY p.org_pet_number ASC
		`, orgId)
		if err != nil {
			fmt.Printf("❌ Org pets fetch error: %v\n", err)
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}
		defer rows.Close()

		type Pet struct {
			ID           int    `json:"id"`
			OrgPetNumber int    `json:"org_pet_number"`
			Name         string `json:"name"`
			SpeciesID    *int   `json:"species_id"`
			SpeciesName  string `json:"species_name"`
			BreedID      *int   `json:"breed_id"`
			BreedName    string `json:"breed_name"`
			BirthDate    string `json:"birth_date"`
			Gender       string `json:"gender"`
			Description  string `json:"description"`
			PhotoURL     string `json:"photo_url"`
			Color             string `json:"color"`
			Size              string `json:"size"`
			MarkingSpecialist string `json:"marking_specialist"`
			MarkingOrg        string `json:"marking_org"`
			CreatedAt         string `json:"created_at"`
		}

		var pets []Pet
		for rows.Next() {
			var pet Pet
			if err := rows.Scan(
				&pet.ID, &pet.Name, &pet.SpeciesID, &pet.SpeciesName,
				&pet.BreedID, &pet.BreedName,
				&pet.BirthDate, &pet.Gender,
				&pet.Description, &pet.PhotoURL,
				&pet.Color, &pet.Size, &pet.OrgPetNumber,
				&pet.MarkingSpecialist, &pet.MarkingOrg,
				&pet.CreatedAt,
			); err != nil {
				fmt.Printf("Scan error org/pets: %v\n", err)
				continue
			}
			pets = append(pets, pet)
		}
		if pets == nil {
			pets = []Pet{}
		}

		c.JSON(200, gin.H{"success": true, "pets": pets})
	})

	// Питомец организации — карточка
	r.GET("/:orgId/pets/:petId", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")
		petId := c.Param("petId")

		var role string
		memberErr := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&role)
		if memberErr == sql.ErrNoRows {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}

		type PetDetail struct {
			ID               int      `json:"id"`
			OrgPetNumber     int      `json:"org_pet_number"`
			Name             string   `json:"name"`
			SpeciesID        *int     `json:"species_id"`
			SpeciesName      string   `json:"species_name"`
			BreedID          *int     `json:"breed_id"`
			BreedName        string   `json:"breed_name"`
			BirthDate        string   `json:"birth_date"`
			AgeType          string   `json:"age_type"`
			ApproxYears      int      `json:"approximate_years"`
			ApproxMonths     int      `json:"approximate_months"`
			Gender           string   `json:"gender"`
			Description      string   `json:"description"`
			PhotoURL         string   `json:"photo_url"`
			Color            string   `json:"color"`
			Fur              string   `json:"fur"`
			Ears             string   `json:"ears"`
			Tail             string   `json:"tail"`
			Size             string   `json:"size"`
			SpecialMarks     string   `json:"special_marks"`
			Relationship     string   `json:"relationship"`
			// Идентификация
			MarkingDate       string   `json:"marking_date"`
			TagNumber         string   `json:"tag_number"`
			BrandNumber       string   `json:"brand_number"`
			ChipNumber        string   `json:"chip_number"`
			MarkingSpecialist string   `json:"marking_specialist"`
			MarkingOrg        string   `json:"marking_org"`
			// Место содержания
			LocationType     string   `json:"location_type"`
			LocationAddress  string   `json:"location_address"`
			City             string   `json:"city"`
			ActualCity       string   `json:"actual_city"`
			LocationCage     string   `json:"location_cage"`
			LocationContact  string   `json:"location_contact"`
			LocationPhone    string   `json:"location_phone"`
			LocationNotes    string   `json:"location_notes"`
			// Здоровье
			Weight             float64  `json:"weight"`
			SterilizationDate  string   `json:"sterilization_date"`
			SterilizationSpec  string   `json:"sterilization_specialist"`
			SterilizationOrg   string   `json:"sterilization_org"`
			SterilizationType  string   `json:"sterilization_type"`
			HealthNotes        string   `json:"health_notes"`
			CreatedAt          string   `json:"created_at"`
			// Медиа
			MediaURLs          []string `json:"media_urls"`
			FacePhotoURL       string   `json:"face_photo_url"`
			BodyPhotoURL       string   `json:"body_photo_url"`
			// Каталог
			CatalogStatus      string   `json:"catalog_status"`
			CatalogData        any      `json:"catalog_data"`
			// Опекун (Организация)
			OrgID              int      `json:"org_id"`
			OrgName            string   `json:"org_name"`
			OrgEmail           string   `json:"org_email"`
			OrgPhone           string   `json:"org_phone"`
			OrgLogo            string   `json:"org_logo"`
		}

		var pet PetDetail
		var mediaURLsRaw []byte
		var catalogDataRaw []byte
		err := db.QueryRow(`
			SELECT
				p.id, COALESCE(p.org_pet_number, 0), COALESCE(p.name, ''),
				COALESCE(p.species_id, 0), COALESCE(s.name, ''),
				COALESCE(p.breed_id, 0), COALESCE(b.name, ''),
				COALESCE(p.birth_date::text, ''), COALESCE(p.age_type, 'exact'),
				COALESCE(p.approximate_years, 0), COALESCE(p.approximate_months, 0),
				COALESCE(p.gender, ''), COALESCE(p.description, ''), COALESCE(p.photo_url, ''),
				COALESCE(p.color, ''), COALESCE(p.fur, ''), COALESCE(p.ears, ''),
				COALESCE(p.tail, ''), COALESCE(p.size, ''), COALESCE(p.special_marks, ''),
				COALESCE(p.relationship, 'org'),
				COALESCE(p.marking_date::text, ''), COALESCE(p.tag_number, ''),
				COALESCE(p.brand_number, ''), COALESCE(p.chip_number, ''),
				COALESCE(p.marking_specialist, ''), COALESCE(p.marking_org, ''),
				COALESCE(p.location_type, ''), COALESCE(p.location_address, ''),
				COALESCE(NULLIF(p.city, ''), NULLIF(o.city, ''), NULLIF(o.address_city, ''), NULLIF(o.address, ''), ''), COALESCE(p.city, ''),
				COALESCE(p.location_cage, ''), COALESCE(p.location_contact, ''),
				COALESCE(p.location_phone, ''), COALESCE(p.location_notes, ''),
				COALESCE(p.weight, 0), COALESCE(p.sterilization_date::text, ''), 
				COALESCE(p.sterilization_specialist, ''), COALESCE(p.sterilization_org, ''), COALESCE(p.sterilization_type, ''),
				COALESCE(p.health_notes, ''),
				p.created_at,
				COALESCE(p.media_urls::text, '[]'),
				COALESCE(p.face_photo_url, ''),
				COALESCE(p.body_photo_url, ''),
				COALESCE(p.catalog_status, 'draft'),
				COALESCE(p.catalog_data::text, '{}'),
				COALESCE(p.org_id, 0),
				COALESCE(o.name, ''), COALESCE(o.email, ''), COALESCE(o.phone, ''), COALESCE(o.logo, '')
			FROM pets p
			LEFT JOIN species s ON p.species_id = s.id
			LEFT JOIN breeds b ON p.breed_id = b.id
			LEFT JOIN organizations o ON p.org_id = o.id
			WHERE p.id = $1 AND p.org_id = $2
		`, petId, orgId).Scan(
			&pet.ID, &pet.OrgPetNumber, &pet.Name,
			&pet.SpeciesID, &pet.SpeciesName,
			&pet.BreedID, &pet.BreedName,
			&pet.BirthDate, &pet.AgeType,
			&pet.ApproxYears, &pet.ApproxMonths,
			&pet.Gender, &pet.Description, &pet.PhotoURL,
			&pet.Color, &pet.Fur, &pet.Ears,
			&pet.Tail, &pet.Size, &pet.SpecialMarks,
			&pet.Relationship,
			&pet.MarkingDate, &pet.TagNumber,
			&pet.BrandNumber, &pet.ChipNumber,
			&pet.MarkingSpecialist, &pet.MarkingOrg,
			&pet.LocationType, &pet.LocationAddress,
			&pet.City, &pet.ActualCity,
			&pet.LocationCage, &pet.LocationContact,
			&pet.LocationPhone, &pet.LocationNotes,
			&pet.Weight, &pet.SterilizationDate, 
			&pet.SterilizationSpec, &pet.SterilizationOrg, &pet.SterilizationType,
			&pet.HealthNotes,
			&pet.CreatedAt,
			&mediaURLsRaw,
			&pet.FacePhotoURL,
			&pet.BodyPhotoURL,
			&pet.CatalogStatus,
			&catalogDataRaw,
			&pet.OrgID,
			&pet.OrgName, &pet.OrgEmail, &pet.OrgPhone, &pet.OrgLogo,
		)
		if err == sql.ErrNoRows {
			c.JSON(404, gin.H{"success": false, "error": "Pet not found"})
			return
		}
		if err != nil {
			fmt.Printf("\u274c Pet detail error: %v\n", err)
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}
		// Парсим media_urls из JSON
		if len(mediaURLsRaw) > 0 {
			_ = json.Unmarshal(mediaURLsRaw, &pet.MediaURLs)
		}
		if pet.MediaURLs == nil {
			pet.MediaURLs = []string{}
		}
		if len(catalogDataRaw) > 0 {
			var parsedCatalogData map[string]interface{}
			if err := json.Unmarshal(catalogDataRaw, &parsedCatalogData); err == nil {
				pet.CatalogData = parsedCatalogData
			} else {
				pet.CatalogData = map[string]interface{}{}
			}
		} else {
			pet.CatalogData = map[string]interface{}{}
		}
		c.JSON(200, gin.H{"success": true, "pet": pet})
	})

	// Питомцы организации — создание
	r.POST("/:orgId/pets", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")
		orgIdInt, err := strconv.Atoi(orgId)
		if err != nil {
			c.JSON(400, gin.H{"success": false, "error": "Invalid org ID"})
			return
		}

		// Проверяем членство
		var role string
		memberErr := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&role)
		if memberErr == sql.ErrNoRows {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}

		var input struct {
			Name              string  `json:"name"`
			SpeciesID         int     `json:"species_id"`
			BreedID           *int    `json:"breed_id"`
			BirthDate         string  `json:"birth_date"`
			Gender            string  `json:"gender"`
			Description       *string `json:"description"`
			AgeType           string  `json:"age_type"`
			ApproximateYears  int     `json:"approximate_years"`
			ApproximateMonths int     `json:"approximate_months"`
			Color             *string `json:"color"`
			Fur               *string `json:"fur"`
			Ears              *string `json:"ears"`
			Tail              *string `json:"tail"`
			Size              *string `json:"size"`
			SpecialMarks      *string `json:"special_marks"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"success": false, "error": "Invalid input"})
			return
		}
		var nextNum int
		db.QueryRow(`SELECT COALESCE(MAX(org_pet_number), 0) + 1 FROM pets WHERE org_id = $1`, orgIdInt).Scan(&nextNum)

		if input.Name == "" {
			input.Name = fmt.Sprintf("Питомец #%d", nextNum)
		}

		var speciesName string
		if err := db.QueryRow("SELECT name FROM species WHERE id = $1", input.SpeciesID).Scan(&speciesName); err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Invalid species_id"})
			return
		}

		var birthDate *string
		if input.BirthDate != "" {
			birthDate = &input.BirthDate
		}

		var id int
		err = db.QueryRow(`
			INSERT INTO pets (
				name, species, species_id, breed_id, user_id, org_id, org_pet_number,
				birth_date, age_type, approximate_years, approximate_months,
				gender, description, relationship, color, fur, ears, tail, size, special_marks
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'org',$14,$15,$16,$17,$18,$19)
			RETURNING id
		`,
			input.Name, speciesName, input.SpeciesID, input.BreedID, intUserID, orgIdInt, nextNum,
			birthDate, input.AgeType, input.ApproximateYears, input.ApproximateMonths,
			input.Gender, input.Description,
			input.Color, input.Fur, input.Ears, input.Tail, input.Size, input.SpecialMarks,
		).Scan(&id)

		if err != nil {
			fmt.Printf("❌ Org pet create error: %v\n", err)
			c.JSON(500, gin.H{"success": false, "error": "Database error: " + err.Error()})
			return
		}

		c.JSON(200, gin.H{"success": true, "id": id, "org_pet_number": nextNum})
	})

	// Хронология питомца организации
	r.GET("/:orgId/pets/:petId/timeline", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")
		petId := c.Param("petId")

		var role string
		memberErr := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&role)
		if memberErr == sql.ErrNoRows {
			c.JSON(403, gin.H{"success": false, "error": "Not a member"})
			return
		}

		// Используем общий обработчик для формирования единой хронологии из PetID и Org
		petsHandler := pets.NewHandler(db)
		c.Params = append(c.Params, gin.Param{Key: "id", Value: petId})
		petsHandler.GetTimeline(c)
	})

	// Legacy animals alias
	r.GET("/:orgId/animals", func(c *gin.Context) {
		if _, ok := getUserID(c); !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		c.JSON(200, gin.H{"success": true, "animals": []interface{}{}})
	})

	// Команда организации
	r.GET("/:orgId/team", func(c *gin.Context) {
		if _, ok := getUserID(c); !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		c.JSON(200, gin.H{"success": true, "team": []interface{}{}})
	})

	// Настройки организации
	r.GET("/:orgId/settings", func(c *gin.Context) {
		if _, ok := getUserID(c); !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		c.JSON(200, gin.H{"success": true, "message": "org/:orgId/settings — в разработке"})
	})

	// Обновить питомца организации (media_urls и другие поля)
	r.PUT("/:orgId/pets/:petId", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")
		petId := c.Param("petId")

		petIdInt, err := strconv.Atoi(petId)
		if err != nil {
			c.JSON(400, gin.H{"success": false, "error": "Invalid pet ID"})
			return
		}

		// Проверяем членство в организации
		var role string
		memberErr := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&role)
		if memberErr == sql.ErrNoRows {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}

		// Проверяем что питомец принадлежит организации
		var existingOrgID int
		err = db.QueryRow(`SELECT org_id FROM pets WHERE id = $1`, petIdInt).Scan(&existingOrgID)
		if err == sql.ErrNoRows {
			c.JSON(404, gin.H{"success": false, "error": "Pet not found"})
			return
		}
		if err != nil || fmt.Sprintf("%d", existingOrgID) != orgId {
			c.JSON(403, gin.H{"success": false, "error": "Access denied"})
			return
		}

		var input map[string]interface{}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"success": false, "error": "Invalid input"})
			return
		}

		// Вызов общего метода обновления питомца и логирования в хронологию
		petsHandler := pets.NewHandler(db)
		err = petsHandler.UpdatePetCore(petId, input)
		if err != nil {
			fmt.Printf("❌ UpdatePetCore error in org: %v\n", err)
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}

		c.JSON(200, gin.H{"success": true})
	})

	// Удаление питомца
	r.DELETE("/:orgId/pets/:petId", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")
		petId := c.Param("petId")

		// Проверка прав 
		var role string
		err := db.QueryRow(`
			SELECT role FROM organization_members 
			WHERE organization_id = $1 AND user_id = $2
		`, orgId, intUserID).Scan(&role)
		
		if err == sql.ErrNoRows {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}
		if role != "owner" && role != "admin" {
			c.JSON(403, gin.H{"success": false, "error": "Только администратор может удалять питомцев"})
			return
		}

		orgIDInt, err := strconv.Atoi(orgId)
		if err != nil {
			c.JSON(400, gin.H{"success": false, "error": "Invalid org ID"})
			return
		}

		petsHandler := pets.NewHandler(db)
		err = petsHandler.DeletePetCore(petId, orgIDInt, "org")
		if err != nil {
			fmt.Printf("❌ Delete pet error: %v\n", err)
			c.JSON(400, gin.H{"success": false, "error": err.Error()})
			return
		}

		c.JSON(200, gin.H{"success": true, "message": "Pet deleted successfully"})
	})

	// Подключаем эндпоинты здоровья (Вакцинации, Обработки, Медкарты)
	SetupHealthRoutes(r, db)

	// ─────────────────────────────────────────────────────────────────────────
	// Модуль: Сотрудники организации
	// ─────────────────────────────────────────────────────────────────────────
	
	r.GET("/:orgId/staff", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")

		var role string
		if err := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&role); err != nil {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}

		rows, err := db.Query(`
			SELECT u.id, 
			       COALESCE(u.name, '') || CASE WHEN u.last_name IS NOT NULL AND u.last_name != '' THEN ' ' || u.last_name ELSE '' END, 
			       u.email,
			       COALESCE(u.avatar, ''), 
			       COALESCE(om.role, ''), 
			       COALESCE(om.position, ''),
			       COALESCE(om.org_avatar, ''),
			       COALESCE(om.permissions::text, '{"pets":true,"medical":true,"finance":false}')
			FROM organization_members om
			JOIN users u ON om.user_id = u.id
			WHERE om.organization_id = $1
			ORDER BY u.name ASC
		`, orgId)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}
		defer rows.Close()

		var staff []map[string]interface{}
		for rows.Next() {
			var id int
			var name, email, avatar, role, position, orgAvatar, permStr string
			if err := rows.Scan(&id, &name, &email, &avatar, &role, &position, &orgAvatar, &permStr); err == nil {
			    var perms map[string]interface{}
			    json.Unmarshal([]byte(permStr), &perms)
				staff = append(staff, map[string]interface{}{
					"id": id,
					"name": name,
					"email": email,
					"avatar": avatar,
					"orgAvatarUrl": orgAvatar,
					"role": role,
					"jobTitle": position,
					"permissions": perms,
					"isOwner": role == "owner",
				})
			}
		}
		if staff == nil {
			staff = []map[string]interface{}{}
		}
		c.JSON(200, gin.H{"success": true, "data": staff})
	})

	r.GET("/:orgId/staff/:staffId", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")
		staffId := c.Param("staffId")

		var myRole string
		if err := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&myRole); err != nil {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}

        var id int
        var name, email, avatar, role, position, orgAvatar, permStr string
		err := db.QueryRow(`
			SELECT u.id, 
			       COALESCE(u.name, '') || CASE WHEN u.last_name IS NOT NULL AND u.last_name != '' THEN ' ' || u.last_name ELSE '' END, 
			       u.email,
			       COALESCE(u.avatar, ''), 
			       COALESCE(om.role, ''), 
			       COALESCE(om.position, ''),
			       COALESCE(om.org_avatar, ''),
			       COALESCE(om.permissions::text, '{"pets":true,"medical":true,"finance":false}')
			FROM organization_members om
			JOIN users u ON om.user_id = u.id
			WHERE om.organization_id = $1 AND u.id = $2
		`, orgId, staffId).Scan(&id, &name, &email, &avatar, &role, &position, &orgAvatar, &permStr)
		
		if err == sql.ErrNoRows {
		    c.JSON(404, gin.H{"success": false, "error": "Staff not found"})
			return
		} else if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}
		
        var perms map[string]interface{}
        json.Unmarshal([]byte(permStr), &perms)
        
        c.JSON(200, gin.H{"success": true, "data": map[string]interface{}{
            "id": id,
            "name": name,
            "email": email,
            "avatar": avatar,
            "orgAvatarUrl": orgAvatar,
            "role": role,
            "jobTitle": position,
            "permissions": perms,
            "isOwner": role == "owner",
        }})
	})

	r.PUT("/:orgId/staff/:staffId", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")
		staffId := c.Param("staffId")

		var myRole string
		if err := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&myRole); err != nil {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}
		
		if myRole != "owner" && myRole != "admin" && fmt.Sprintf("%d", intUserID) != staffId {
		    c.JSON(403, gin.H{"success": false, "error": "Insufficient permissions"})
			return
		}

		var input struct {
			JobTitle     *string                `json:"jobTitle"`
			OrgAvatarUrl *string                `json:"orgAvatarUrl"`
			Permissions  map[string]interface{} `json:"permissions"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"success": false, "error": "Invalid input"})
			return
		}
		
		permBytes, _ := json.Marshal(input.Permissions)

		_, err := db.Exec(`
		    UPDATE organization_members 
		    SET position = COALESCE($1, position),
		        org_avatar = COALESCE($2, org_avatar),
		        permissions = COALESCE($3, permissions)
		    WHERE organization_id = $4 AND user_id = $5
		`, input.JobTitle, input.OrgAvatarUrl, string(permBytes), orgId, staffId)
		
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}

		c.JSON(200, gin.H{"success": true})
	})

	r.POST("/:orgId/staff", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")

		var myRole string
		if err := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&myRole); err != nil {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}
		if myRole != "owner" && myRole != "admin" {
		    c.JSON(403, gin.H{"success": false, "error": "Insufficient permissions"})
			return
		}

		var input struct {
			Email    string `json:"email"`
			JobTitle string `json:"jobTitle"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"success": false, "error": "Invalid input"})
			return
		}
		
		var targetUserId int
		err := db.QueryRow(`SELECT id FROM users WHERE email = $1`, input.Email).Scan(&targetUserId)
		if err == sql.ErrNoRows {
		    c.JSON(404, gin.H{"success": false, "error": "Пользователь с таким email не найден в системе"})
			return
		} else if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}
		
		jobTitle := "Специалист"
		if input.JobTitle != "" {
		    jobTitle = input.JobTitle
		}
		
		_, err = db.Exec(`
		    INSERT INTO organization_members (organization_id, user_id, role, position, permissions)
		    VALUES ($1, $2, 'specialist', $3, '{"pets":true,"medical":true,"finance":false}')
		    ON CONFLICT (organization_id, user_id) DO NOTHING
		`, orgId, targetUserId, jobTitle)
		
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}

		c.JSON(200, gin.H{"success": true})
	})
	
	r.DELETE("/:orgId/staff/:staffId", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")
		staffId := c.Param("staffId")

		var myRole string
		if err := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&myRole); err != nil {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}
		if myRole != "owner" && myRole != "admin" {
		    c.JSON(403, gin.H{"success": false, "error": "Insufficient permissions"})
			return
		}
		
		var targetRole string
		db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, staffId).Scan(&targetRole)
		if targetRole == "owner" {
		    c.JSON(400, gin.H{"success": false, "error": "Cannot delete owner"})
			return
		}

		_, err := db.Exec(`DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, staffId)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}

		c.JSON(200, gin.H{"success": true})
	})

	// ─────────────────────────────────────────────────────────────────────────
	// Модуль: Регистрация питомцев
	// ─────────────────────────────────────────────────────────────────────────

	// GET /:orgId/pets/:petId/registrations — история регистраций
	r.GET("/:orgId/pets/:petId/registrations", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")
		petId := c.Param("petId")

		var role string
		if err := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&role); err != nil {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}

		type Registration struct {
			ID                 int    `json:"id"`
			RegisteredAt       string `json:"registered_at"`
			SpecialistName     string `json:"specialist_name"`
			SpecialistPosition string `json:"specialist_position"`
			Notes              string `json:"notes"`
			CreatedByName      string `json:"created_by_name"`
			CreatedAt          string `json:"created_at"`
		}

		rows, err := db.Query(`
			SELECT r.id, r.registered_at, COALESCE(r.specialist_name,''), COALESCE(r.specialist_position,''),
			       COALESCE(r.notes,''), COALESCE(u.name,''), r.created_at
			FROM pet_registrations r
			LEFT JOIN users u ON r.created_by = u.id
			WHERE r.pet_id = $1 AND r.org_id = $2
			ORDER BY r.registered_at DESC
		`, petId, orgId)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}
		defer rows.Close()

		var registrations []Registration
		for rows.Next() {
			var reg Registration
			if err := rows.Scan(&reg.ID, &reg.RegisteredAt, &reg.SpecialistName, &reg.SpecialistPosition, &reg.Notes, &reg.CreatedByName, &reg.CreatedAt); err != nil {
				continue
			}
			registrations = append(registrations, reg)
		}
		if registrations == nil {
			registrations = []Registration{}
		}
		c.JSON(200, gin.H{"success": true, "registrations": registrations})
	})

	// POST /:orgId/pets/:petId/registrations — создать запись регистрации
	r.POST("/:orgId/pets/:petId/registrations", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")
		petId := c.Param("petId")

		var role string
		if err := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&role); err != nil {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}

		var input struct {
			RegisteredAt       string `json:"registered_at"`
			SpecialistName     string `json:"specialist_name"`
			SpecialistPosition string `json:"specialist_position"`
			Notes              string `json:"notes"`
			// Идентификаторы питомца
			ChipNumber     string `json:"chip_number,omitempty"`
			TagNumber      string `json:"tag_number,omitempty"`
			BrandNumber    string `json:"brand_number,omitempty"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"success": false, "error": "Invalid input"})
			return
		}
		if input.RegisteredAt == "" {
			c.JSON(400, gin.H{"success": false, "error": "registered_at is required"})
			return
		}

		tx, err := db.Begin()
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Transaction error"})
			return
		}
		defer tx.Rollback()

		var orgName string
		db.QueryRow(`SELECT name FROM organizations WHERE id = $1`, orgId).Scan(&orgName)

		// Идентификаторы и маркировку записываем (если переданы) в основную таблицу питомца
		// Учитываем, что эта регистрация теперь является "актом маркирования"
		_, err = tx.Exec(`
			UPDATE pets 
			SET 
				chip_number = CASE WHEN $1 != '' THEN $1 ELSE chip_number END,
				tag_number = CASE WHEN $2 != '' THEN $2 ELSE tag_number END,
				brand_number = CASE WHEN $3 != '' THEN $3 ELSE brand_number END,
				marking_date = CASE WHEN $4 != '' AND (marking_date IS NULL OR marking_date::text = '') THEN $4::date ELSE marking_date END,
				marking_specialist = CASE WHEN $5 != '' AND (marking_specialist IS NULL OR marking_specialist = '') THEN $5 ELSE marking_specialist END,
				marking_org = CASE WHEN $6 != '' AND (marking_org IS NULL OR marking_org = '') THEN $6 ELSE marking_org END
			WHERE id = $7
		`, input.ChipNumber, input.TagNumber, input.BrandNumber, input.RegisteredAt, input.SpecialistName, orgName, petId)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Database error while updating pet"})
			return
		}

		var newID int
		err = tx.QueryRow(`
			INSERT INTO pet_registrations (pet_id, org_id, registered_at, specialist_name, specialist_position, notes, created_by, chip_number, tag_number, brand_number)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING id
		`, petId, orgId, input.RegisteredAt, input.SpecialistName, input.SpecialistPosition, input.Notes, intUserID, input.ChipNumber, input.TagNumber, input.BrandNumber).Scan(&newID)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}

		if err := tx.Commit(); err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Commit error"})
			return
		}

		c.JSON(200, gin.H{"success": true, "id": newID})
	})

	// GET /:orgId/registrations/pet-info/:petId — глобальный поиск питомца
	r.GET("/:orgId/registrations/pet-info/:petId", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")

		var role string
		if err := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&role); err != nil {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}

		petId := c.Param("petId")

		var pet struct {
			ID                int     `json:"id"`
			Name              string  `json:"name"`
			PhotoURL          *string `json:"photo_url,omitempty"`
			SpeciesName       *string `json:"species_name,omitempty"`
			BreedName         *string `json:"breed_name,omitempty"`
			BirthDate         *string `json:"birth_date,omitempty"`
			AgeType           *string `json:"age_type,omitempty"`
			ApproximateYears  *int    `json:"approximate_years,omitempty"`
			ApproximateMonths *int    `json:"approximate_months,omitempty"`
			ChipNumber        *string `json:"chip_number,omitempty"`
			TagNumber         *string `json:"tag_number,omitempty"`
			BrandNumber       *string `json:"brand_number,omitempty"`
			OwnerID           *int    `json:"owner_id,omitempty"`
			OwnerName         *string `json:"owner_name,omitempty"`
			OwnerAvatar       *string `json:"owner_avatar,omitempty"`
			CuratorID         *int    `json:"curator_id,omitempty"`
			CuratorName       *string `json:"curator_name,omitempty"`
			CuratorAvatar     *string `json:"curator_avatar,omitempty"`
			OrgID             *int    `json:"org_id,omitempty"`
			OrgName           *string `json:"org_name,omitempty"`
			OrgLogo           *string `json:"org_logo,omitempty"`
		}
		var petPhoto string
		var mediaUrlsJSON string

		err := db.QueryRow(`
			SELECT p.id, COALESCE(p.name, ''), COALESCE(p.photo_url, ''), COALESCE(p.media_urls::text, '[]'),
			       COALESCE(s.name, ''), COALESCE(b.name, p.breed, ''), COALESCE(p.brand_number, ''), 
			       COALESCE(p.tag_number, ''), COALESCE(p.chip_number, ''),
			       COALESCE(p.birth_date::text, ''), COALESCE(p.age_type, 'exact'),
			       COALESCE(p.approximate_years, 0), COALESCE(p.approximate_months, 0),
			       CASE WHEN p.relationship = 'owner' THEN COALESCE(p.user_id, 0) ELSE 0 END AS owner_id,
			       CASE WHEN p.relationship = 'owner' THEN COALESCE(u.name, '') || CASE WHEN u.last_name IS NOT NULL AND u.last_name != '' THEN ' ' || u.last_name ELSE '' END ELSE '' END AS owner_name,
			       CASE WHEN p.relationship = 'owner' THEN COALESCE(u.avatar, '') ELSE '' END AS owner_avatar,
			       CASE WHEN p.relationship = 'curator' THEN COALESCE(p.user_id, 0) ELSE 0 END AS curator_id,
			       CASE WHEN p.relationship = 'curator' THEN COALESCE(u.name, '') || CASE WHEN u.last_name IS NOT NULL AND u.last_name != '' THEN ' ' || u.last_name ELSE '' END ELSE '' END AS curator_name,
			       CASE WHEN p.relationship = 'curator' THEN COALESCE(u.avatar, '') ELSE '' END AS curator_avatar,
			       COALESCE(p.org_id, 0), COALESCE(org.name, ''), COALESCE(org.logo, '')
			FROM pets p
			LEFT JOIN species s ON p.species_id = s.id
			LEFT JOIN breeds b ON p.breed_id = b.id
			LEFT JOIN users u ON p.user_id = u.id
			LEFT JOIN organizations org ON p.org_id = org.id
			WHERE p.id = $1
		`, petId).Scan(
			&pet.ID, &pet.Name, &petPhoto, &mediaUrlsJSON, &pet.SpeciesName, &pet.BreedName,
			&pet.BrandNumber, &pet.TagNumber, &pet.ChipNumber,
			&pet.BirthDate, &pet.AgeType, &pet.ApproximateYears, &pet.ApproximateMonths,
			&pet.OwnerID, &pet.OwnerName, &pet.OwnerAvatar,
			&pet.CuratorID, &pet.CuratorName, &pet.CuratorAvatar,
			&pet.OrgID, &pet.OrgName, &pet.OrgLogo,
		)
		if err == sql.ErrNoRows {
			c.JSON(404, gin.H{"success": false, "error": "Питомец не найден"})
			return
		} else if err != nil {
			fmt.Printf("❌ GET pet-info error: %v\n", err)
			c.JSON(500, gin.H{"success": false, "error": "Ошибка базы данных: " + err.Error()})
			return
		}

		// Выбор фото
		if petPhoto != "" {
			pet.PhotoURL = &petPhoto
		} else if mediaUrlsJSON != "" && mediaUrlsJSON != "[]" {
			var media []string
			if err := json.Unmarshal([]byte(mediaUrlsJSON), &media); err == nil && len(media) > 0 {
				pet.PhotoURL = &media[0]
			}
		}

		c.JSON(200, gin.H{"success": true, "pet": pet})
	})

	// GET /:orgId/registrations — список всех регистраций
	r.GET("/:orgId/registrations", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")

		var role string
		if err := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&role); err != nil {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}

		rows, err := db.Query(`
			SELECT r.id, r.pet_id, p.name, COALESCE(p.photo_url, ''), COALESCE(s.name, ''),
			       r.registered_at, COALESCE(r.specialist_name,''), COALESCE(r.specialist_position,''),
			       COALESCE(r.notes,''), COALESCE(u.name,'') 
			FROM pet_registrations r
			JOIN pets p ON r.pet_id = p.id
			LEFT JOIN species s ON p.species_id = s.id
			LEFT JOIN users u ON r.created_by = u.id
			WHERE r.org_id = $1
			ORDER BY r.registered_at DESC
		`, orgId)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}
		defer rows.Close()

		var regs []map[string]interface{}
		for rows.Next() {
			var id, pet_id int
			var p_name, photo, species, reg_at, spec_name, spec_pos, notes, created_by string
			if err := rows.Scan(&id, &pet_id, &p_name, &photo, &species, &reg_at, &spec_name, &spec_pos, &notes, &created_by); err == nil {
				regs = append(regs, map[string]interface{}{
					"id": id, "pet_id": pet_id, "pet_name": p_name, "pet_photo_url": photo, "species_name": species,
					"registered_at": reg_at, "specialist_name": spec_name, "specialist_position": spec_pos,
					"notes": notes, "created_by_name": created_by,
				})
			}
		}
		if regs == nil {
			regs = []map[string]interface{}{}
		}
		c.JSON(200, gin.H{"success": true, "registrations": regs})
	})

	// DELETE /:orgId/registrations/:regId — удаление регистрации
	r.DELETE("/:orgId/registrations/:regId", func(c *gin.Context) {
		intUserID, ok := getUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
			return
		}
		orgId := c.Param("orgId")
		regId := c.Param("regId")

		var role string
		if err := db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgId, intUserID).Scan(&role); err != nil {
			c.JSON(403, gin.H{"success": false, "error": "Not a member of this organization"})
			return
		}

		if role != "owner" && role != "admin" {
			c.JSON(403, gin.H{"success": false, "error": "Только администратор или владелец может удалять записи"})
			return
		}

		res, err := db.Exec(`DELETE FROM pet_registrations WHERE id = $1 AND org_id = $2`, regId, orgId)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}
		rowsAffected, _ := res.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{"success": false, "error": "Запись не найдена"})
			return
		}

		c.JSON(200, gin.H{"success": true})
	})
}
