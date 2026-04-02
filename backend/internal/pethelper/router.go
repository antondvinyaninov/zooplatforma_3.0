package pethelper

import (
	"bytes"
	"database/sql"
	"fmt"
	"io"

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
		authGroup.POST("/logout", authHandler.Logout)
		authGroup.GET("/me", authHandler.Me)
	}


	// Pets routes
	petsGroup := r.Group("/pets")
	{
		petsGroup.GET("", func(c *gin.Context) {
			userID, exists := c.Get("user_id")
			if !exists {
				c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
				return
			}

			// Получаем только тех питомцев, где пользователь является куратором
			rows, err := db.Query(`
				SELECT 
					p.id, p.name, p.species_id, COALESCE(s.name, '') as species_name,
					p.breed_id, COALESCE(b.name, '') as breed_name,
					p.user_id, COALESCE(u.name, '') as owner_name,
					COALESCE(p.birth_date::text, ''), COALESCE(p.gender, ''), 
					p.description, COALESCE(p.relationship, 'curator'),
					p.photo_url, COALESCE(p.color, ''), COALESCE(p.size, ''), COALESCE(p.created_at::text, '')
				FROM pets p
				LEFT JOIN species s ON p.species_id = s.id
				LEFT JOIN breeds b ON p.breed_id = b.id
				LEFT JOIN users u ON p.user_id = u.id
				WHERE p.user_id = $1 AND p.relationship = 'curator'
				ORDER BY p.id DESC
			`, userID)

			if err != nil {
				fmt.Printf("Error fetching pets for user %v: %v\n", userID, err)
				c.JSON(500, gin.H{"success": false, "error": "Database error: " + err.Error()})
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
				Description  *string `json:"description"`
				Relationship string  `json:"relationship"`
				PhotoURL     *string `json:"photo_url"`
				Color        string  `json:"color"`
				Size         string  `json:"size"`
				CreatedAt    string  `json:"created_at"`
			}

			var pets []Pet
			for rows.Next() {
				var pet Pet
				if err := rows.Scan(
					&pet.ID, &pet.Name, &pet.SpeciesID, &pet.SpeciesName,
					&pet.BreedID, &pet.BreedName, &pet.OwnerID, &pet.OwnerName,
					&pet.BirthDate, &pet.Gender, &pet.Description, &pet.Relationship,
					&pet.PhotoURL, &pet.Color, &pet.Size, &pet.CreatedAt,
				); err != nil {
					fmt.Printf("Scan error pethelper/pets: %v\n", err)
					continue
				}
				pets = append(pets, pet)
			}

			c.JSON(200, gin.H{"success": true, "pets": pets})
		})

		petsGroup.POST("", func(c *gin.Context) {
			userID, exists := c.Get("user_id")
			if !exists {
				c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
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
				Relationship      string  `json:"relationship"`
			}

			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(400, gin.H{"success": false, "error": "Invalid input"})
				return
			}

			// Получаем название вида
			var speciesName string
			err := db.QueryRow("SELECT name FROM species WHERE id = $1", input.SpeciesID).Scan(&speciesName)
			if err != nil {
				fmt.Printf("❌ PetHelper Error fetching species name: %v\n", err)
				c.JSON(500, gin.H{"success": false, "error": "Invalid species_id"})
				return
			}

			// Обработка пустой даты
			var birthDate *string
			if input.BirthDate != "" {
				birthDate = &input.BirthDate
			}

			var id int
			err = db.QueryRow(`
				INSERT INTO pets (name, species, species_id, breed_id, user_id, birth_date, age_type, approximate_years, approximate_months, gender, description, relationship)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'curator')
				RETURNING id
			`, input.Name, speciesName, input.SpeciesID, input.BreedID, userID, birthDate, input.AgeType, input.ApproximateYears, input.ApproximateMonths, input.Gender, input.Description).Scan(&id)

			if err != nil {
				fmt.Printf("❌ PetHelper Error creating pet: %v\n", err)
				c.JSON(500, gin.H{"success": false, "error": "Database error: " + err.Error()})
				return
			}

			c.JSON(200, gin.H{"success": true, "id": id})
		})

		petsGroup.GET("/:id", petsHandler.GetByID)

		petsGroup.POST("/:id/photo", func(c *gin.Context) {
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
			default:
				c.JSON(401, gin.H{"success": false, "error": "Invalid user ID format"})
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

			// Читаем файл в память для более надежной загрузки в S3
			fileData, err := io.ReadAll(src)
			if err != nil {
				fmt.Printf("❌ Error reading file: %v\n", err)
				c.JSON(500, gin.H{"success": false, "error": "Failed to read file"})
				return
			}

			// Генерируем ключ для S3
			fileKey := s3.GenerateKey(intUserID, "pets", file.Filename)

			// Загружаем в S3
			photoURL, err := s3Client.UploadFile(fileKey, bytes.NewReader(fileData), file.Header.Get("Content-Type"))
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

		petsGroup.PUT("/:id", func(c *gin.Context) {
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
			default:
				c.JSON(401, gin.H{"success": false, "error": "Invalid user ID format"})
				return
			}

			petID := c.Param("id")

			// Проверяем, что питомец принадлежит текущему пользователю (куратору)
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

			// Обычное обновление JSON
			var input map[string]interface{}
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(400, gin.H{"success": false, "error": "Invalid input"})
				return
			}

			// Вызов общего метода обновления питомца и логирования в хронологию
			err = petsHandler.UpdatePetCore(petID, input)
			if err != nil {
				fmt.Printf("❌ UpdatePetCore error in pethelper: %v\n", err)
				c.JSON(500, gin.H{"success": false, "error": "Database error"})
				return
			}

			c.JSON(200, gin.H{"success": true})
		})

		// Vaccinations
		petsGroup.GET("/:id/vaccinations", petsHandler.GetVaccinations)
		petsGroup.POST("/:id/vaccinations", petsHandler.CreateVaccination)

		// Treatments
		petsGroup.GET("/:id/treatments", petsHandler.GetTreatments)
		petsGroup.POST("/:id/treatments", petsHandler.CreateTreatment)

		// Medical Records
		petsGroup.GET("/:id/medical-records", petsHandler.GetMedicalRecords)
		petsGroup.POST("/:id/medical-records", petsHandler.CreateMedicalRecord)

		// Timeline
		petsGroup.GET("/:id/timeline", petsHandler.GetTimeline)

		// Удаление
		petsGroup.DELETE("/:id", func(c *gin.Context) {
			petId := c.Param("id")
			userID, exists := c.Get("user_id")
			if !exists {
				c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
				return
			}

			res, err := db.Exec(`DELETE FROM pets WHERE id = $1 AND user_id = $2 AND relationship = 'curator'`, petId, userID)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Database error"})
				return
			}
			rows, _ := res.RowsAffected()
			if rows == 0 {
				c.JSON(404, gin.H{"success": false, "error": "Pet not found or access denied"})
				return
			}

			c.JSON(200, gin.H{"success": true})
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


}
