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
				p.created_at
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

		res, err := db.Exec(`DELETE FROM pets WHERE id = $1 AND org_id = $2`, petId, orgId)
		if err != nil {
			fmt.Printf("❌ Delete pet error: %v\n", err)
			c.JSON(500, gin.H{"success": false, "error": "Database error"})
			return
		}
		
		rowsAffected, _ := res.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{"success": false, "error": "Pet not found"})
			return
		}

		c.JSON(200, gin.H{"success": true, "message": "Pet deleted successfully"})
	})

	// Подключаем эндпоинты здоровья (Вакцинации, Обработки, Медкарты)
	SetupHealthRoutes(r, db)
}
