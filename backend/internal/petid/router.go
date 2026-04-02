package petid

import (
	"database/sql"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/zooplatforma/backend/internal/mainfrontend/pets"
	"github.com/zooplatforma/backend/internal/shared/auth"
	"github.com/zooplatforma/backend/internal/shared/config"
	"github.com/zooplatforma/backend/internal/shared/s3"
)

func SetupRoutes(r *gin.RouterGroup, db *sql.DB, cfg *config.Config) {
	// Инициализируем S3 Client
	s3Client, err := s3.NewClient(cfg)
	if err != nil {
		panic(fmt.Sprintf("Failed to initialize S3 client: %v", err))
	}

	authHandler := auth.NewHandler(db, cfg)
	petsHandler := pets.NewHandler(db)

	// Auth routes
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/login", authHandler.Login)
		authGroup.GET("/me", authHandler.Me)
	}

	// Breeds routes
	breeds := r.Group("/breeds")
	{
		breeds.GET("", func(c *gin.Context) {
			c.JSON(200, gin.H{"success": true, "data": []interface{}{}})
		})
	}

	// Pets routes
	pets := r.Group("/pets")
	{
		pets.GET("", func(c *gin.Context) {
			_, exists := c.Get("user_id")
			if !exists {
				c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
				return
			}
			
			// Получаем всех питомцев системы
			rows, err := db.Query(`
				SELECT 
					p.id, p.name, p.species_id, COALESCE(s.name, '') as species_name,
					p.breed_id, COALESCE(b.name, '') as breed_name, p.user_id, COALESCE(u.name, '') as owner_name,
					COALESCE(p.birth_date::text, ''), COALESCE(p.gender, ''),
					COALESCE(p.description, ''), COALESCE(p.relationship, ''),
					COALESCE(p.photo_url, ''), COALESCE(p.color, ''), COALESCE(p.size, ''),
					COALESCE(p.created_at::text, '')
				FROM pets p
				LEFT JOIN users u ON p.user_id = u.id
				LEFT JOIN species s ON p.species_id = s.id
				LEFT JOIN breeds b ON p.breed_id = b.id
				ORDER BY p.id DESC
			`)

			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Database error"})
				return
			}
			defer rows.Close()

			type Pet struct {
				ID           int     `json:"id"`
				Name         string  `json:"name"`
				SpeciesID    *int    `json:"species_id"`
				SpeciesName  string  `json:"species_name"`
				BreedID      *int    `json:"breed_id"`
				BreedName    string  `json:"breed_name"`
				OwnerID      int     `json:"owner_id"`
				OwnerName    string  `json:"owner_name"`
				BirthDate    string  `json:"birth_date"`
				Gender       string  `json:"gender"`
				Description  string  `json:"description"`
				Relationship string  `json:"relationship"`
				PhotoURL     string  `json:"photo_url"`
				Color        string  `json:"color"`
				Size         string  `json:"size"`
				CreatedAt    string  `json:"created_at"`
			}

			var petList []Pet
			for rows.Next() {
				var pet Pet
				if err := rows.Scan(
					&pet.ID, &pet.Name, &pet.SpeciesID, &pet.SpeciesName,
					&pet.BreedID, &pet.BreedName, &pet.OwnerID, &pet.OwnerName,
					&pet.BirthDate, &pet.Gender, &pet.Description, &pet.Relationship,
					&pet.PhotoURL, &pet.Color, &pet.Size, &pet.CreatedAt,
				); err != nil {
					fmt.Printf("Scan error petid/pets: %v\n", err)
					continue
				}
				petList = append(petList, pet)
			}
			if petList == nil {
				petList = []Pet{}
			}

			c.JSON(200, gin.H{"success": true, "pets": petList, "data": petList})
		})
		pets.GET("/:id", petsHandler.GetByID)

		pets.PUT("/:id", func(c *gin.Context) {
			userID, exists := c.Get("user_id")
			if !exists {
				c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
				return
			}
			var intUserID int
			switch v := userID.(type) {
			case float64:
				intUserID = int(v)
			case int:
				intUserID = v
			}
			petID := c.Param("id")
			var ownerID int
			err := db.QueryRow("SELECT user_id FROM pets WHERE id = $1", petID).Scan(&ownerID)
			if err != nil {
				c.JSON(404, gin.H{"success": false, "error": "Pet not found"})
				return
			}
			if ownerID != intUserID {
				c.JSON(403, gin.H{"success": false, "error": "Forbidden"})
				return
			}
			var input map[string]interface{}
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(400, gin.H{"success": false, "error": "Invalid input"})
				return
			}
			allowedFields := map[string]string{
				"name":               "name",
				"species_id":         "species_id",
				"breed_id":           "breed_id",
				"birth_date":         "birth_date",
				"gender":             "gender",
				"description":        "description",
				"relationship":       "relationship",
				"color":              "color",
				"size":               "size",
				"location_type":      "location_type",
				"sterilization_date": "sterilization_date",
				"photo_url":          "photo_url",
				"chip_number":        "microchip",
				"fur":                "fur",
				"ears":               "ears",
				"tail":               "tail",
				"special_marks":      "special_marks",
				"marking_date":       "marking_date",
				"tag_number":         "tag_number",
				"brand_number":       "brand_number",
				"location_address":   "location_address",
				"location_cage":      "location_cage",
				"location_contact":   "location_contact",
				"location_phone":     "location_phone",
				"location_notes":     "location_notes",
				"weight":             "weight",
				"health_notes":       "health_notes",
			}
			query := "UPDATE pets SET "
			args := []interface{}{}
			argCount := 1
			for jsonKey, value := range input {
				dbCol, ok := allowedFields[jsonKey]
				if !ok {
					continue
				}
				if argCount > 1 {
					query += ", "
				}
				query += dbCol + " = $" + fmt.Sprint(argCount)
				args = append(args, value)
				argCount++
			}
			if argCount == 1 {
				c.JSON(200, gin.H{"success": true})
				return
			}
			query += " WHERE id = $" + fmt.Sprint(argCount)
			args = append(args, petID)
			_, err = db.Exec(query, args...)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Database error"})
				return
			}
			c.JSON(200, gin.H{"success": true})
		})

		pets.DELETE("/:id", func(c *gin.Context) {
			userID, exists := c.Get("user_id")
			if !exists {
				c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
				return
			}
			petID := c.Param("id")
			_, err := db.Exec("DELETE FROM pets WHERE id = $1 AND user_id = $2", petID, userID)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Database error"})
				return
			}
			c.JSON(200, gin.H{"success": true})
		})

		// Vaccinations, Treatments, Medical Records (via petsHandler)
		pets.GET("/:id/vaccinations", petsHandler.GetVaccinations)
		pets.POST("/:id/vaccinations", petsHandler.CreateVaccination)
		pets.GET("/:id/treatments", petsHandler.GetTreatments)
		pets.POST("/:id/treatments", petsHandler.CreateTreatment)
		pets.GET("/:id/medical-records", petsHandler.GetMedicalRecords)
		pets.POST("/:id/medical-records", petsHandler.CreateMedicalRecord)
		pets.GET("/:id/timeline", petsHandler.GetTimeline)

		pets.POST("/:id/photo", func(c *gin.Context) {
			userID, exists := c.Get("user_id")
			if !exists {
				c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
				return
			}

			petID := c.Param("id")

			// Проверяем, что питомец принадлежит текущему пользователю
			var ownerID int
			err := db.QueryRow("SELECT user_id FROM pets WHERE id = $1", petID).Scan(&ownerID)
			if err != nil {
				c.JSON(404, gin.H{"success": false, "error": "Pet not found"})
				return
			}

			var intUserID int
			switch v := userID.(type) {
			case float64:
				intUserID = int(v)
			case int:
				intUserID = v
			}

			if ownerID != intUserID {
				c.JSON(403, gin.H{"success": false, "error": "Forbidden"})
				return
			}

			// Обрабатываем загрузку фото
			file, err := c.FormFile("photo")
			if err != nil {
				c.JSON(400, gin.H{"success": false, "error": "No photo file provided"})
				return
			}

			// Проверяем размер файла (макс 15MB)
			if file.Size > 15*1024*1024 {
				c.JSON(400, gin.H{"success": false, "error": "File too large (max 15MB)"})
				return
			}

			// Открываем файл
			src, err := file.Open()
			if err != nil {
				fmt.Printf("❌ Error opening file: %v\n", err)
				c.JSON(500, gin.H{"success": false, "error": "Failed to open file"})
				return
			}
			defer src.Close()

			// Генерируем ключ для S3
			fileKey := s3.GenerateKey(userID.(int), "pets", file.Filename)

			// Загружаем в S3
			photoURL, err := s3Client.UploadFile(fileKey, src, file.Header.Get("Content-Type"))
			if err != nil {
				fmt.Printf("❌ Error uploading photo: %v\n", err)
				c.JSON(500, gin.H{"success": false, "error": "Failed to upload photo"})
				return
			}

			// Обновляем photo_url в базе
			_, err = db.Exec("UPDATE pets SET photo_url = $1 WHERE id = $2", photoURL, petID)
			if err != nil {
				fmt.Printf("❌ Error updating pet photo: %v\n", err)
				c.JSON(500, gin.H{"success": false, "error": "Database error"})
				return
			}

			fmt.Printf("✅ Photo uploaded successfully: %s\n", photoURL)
			c.JSON(200, gin.H{"success": true, "photo_url": photoURL})
		})
	}

	// Vaccinations routes
	vaccinations := r.Group("/vaccinations")
	{
		vaccinations.PUT("/:id", petsHandler.UpdateVaccination)
		vaccinations.DELETE("/:id", petsHandler.DeleteVaccination)
	}

	// Treatments routes
	treatmentsGroup := r.Group("/treatments")
	{
		treatmentsGroup.PUT("/:id", petsHandler.UpdateTreatment)
		treatmentsGroup.DELETE("/:id", petsHandler.DeleteTreatment)
	}

	// Medical Records routes
	medicalRecords := r.Group("/medical-records")
	{
		medicalRecords.PUT("/:id", petsHandler.UpdateMedicalRecord)
		medicalRecords.DELETE("/:id", petsHandler.DeleteMedicalRecord)
	}

	// Organizations routes
	organizations := r.Group("/organizations")
	{
		organizations.GET("", func(c *gin.Context) {
			c.JSON(200, gin.H{"success": true, "data": []interface{}{}})
		})
	}

	// Health routes
	health := r.Group("/health")
	{
		health.GET("", func(c *gin.Context) {
			c.JSON(200, gin.H{"success": true, "data": []interface{}{}})
		})
	}
}

// This will just break the file syntax. Better to use sed or manual file rewrite to insert.  
