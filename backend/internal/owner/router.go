package owner

import (
	"database/sql"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/zooplatforma/backend/internal/mainfrontend/organizations"
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

	authHandler := auth.NewHandler(db)
	petsHandler := pets.NewHandler(db)
	organizationsHandler := organizations.NewHandler(db)

	// Auth routes
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/login", authHandler.Login)
		authGroup.POST("/logout", authHandler.Logout)
		authGroup.GET("/me", authHandler.Me)
	}

	// Breeds routes
	breeds := r.Group("/breeds")
	{
		breeds.GET("", func(c *gin.Context) {
			// Получаем все породы из БД
			rows, err := db.Query(`
				SELECT b.id, b.name, b.species_id, s.name as species_name, b.description, b.created_at
				FROM breeds b
				LEFT JOIN species s ON b.species_id = s.id
				ORDER BY b.id ASC
			`)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Database error"})
				return
			}
			defer rows.Close()

			type Breed struct {
				ID          int     `json:"id"`
				Name        string  `json:"name"`
				SpeciesID   int     `json:"species_id"`
				SpeciesName string  `json:"species_name"`
				Description *string `json:"description"`
				CreatedAt   string  `json:"created_at"`
			}

			var breeds []Breed
			for rows.Next() {
				var breed Breed
				if err := rows.Scan(&breed.ID, &breed.Name, &breed.SpeciesID, &breed.SpeciesName, &breed.Description, &breed.CreatedAt); err != nil {
					continue
				}
				breeds = append(breeds, breed)
			}

			c.JSON(200, gin.H{"success": true, "breeds": breeds})
		})

		breeds.POST("", func(c *gin.Context) {
			var input struct {
				Name        string  `json:"name"`
				SpeciesID   int     `json:"species_id"`
				Description *string `json:"description"`
			}

			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(400, gin.H{"success": false, "error": "Invalid input"})
				return
			}

			var id int
			err := db.QueryRow(`
				INSERT INTO breeds (name, species_id, description)
				VALUES ($1, $2, $3)
				RETURNING id
			`, input.Name, input.SpeciesID, input.Description).Scan(&id)

			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Database error"})
				return
			}

			c.JSON(200, gin.H{"success": true, "id": id})
		})

		breeds.PUT("/:id", func(c *gin.Context) {
			id := c.Param("id")
			var input struct {
				Name        string  `json:"name"`
				SpeciesID   int     `json:"species_id"`
				Description *string `json:"description"`
			}

			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(400, gin.H{"success": false, "error": "Invalid input"})
				return
			}

			_, err := db.Exec(`
				UPDATE breeds 
				SET name = $1, species_id = $2, description = $3
				WHERE id = $4
			`, input.Name, input.SpeciesID, input.Description, id)

			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Database error"})
				return
			}

			c.JSON(200, gin.H{"success": true})
		})

		breeds.DELETE("/:id", func(c *gin.Context) {
			id := c.Param("id")

			_, err := db.Exec("DELETE FROM breeds WHERE id = $1", id)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Database error"})
				return
			}

			c.JSON(200, gin.H{"success": true})
		})
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

			// Получаем только тех питомцев, где пользователь является владельцем
			rows, err := db.Query(`
				SELECT 
					p.id, p.name, p.species_id, COALESCE(s.name, '') as species_name,
					p.breed_id, COALESCE(b.name, '') as breed_name,
					p.user_id, COALESCE(u.name, '') as owner_name,
					COALESCE(p.birth_date::text, ''), COALESCE(p.gender, ''), 
					p.description, COALESCE(p.relationship, 'owner'),
					p.photo_url, p.created_at
				FROM pets p
				LEFT JOIN species s ON p.species_id = s.id
				LEFT JOIN breeds b ON p.breed_id = b.id
				LEFT JOIN users u ON p.user_id = u.id
				WHERE p.user_id = $1 AND p.relationship = 'owner'
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
				CreatedAt    string  `json:"created_at"`
			}

			var pets []Pet
			for rows.Next() {
				var pet Pet
				if err := rows.Scan(
					&pet.ID, &pet.Name, &pet.SpeciesID, &pet.SpeciesName,
					&pet.BreedID, &pet.BreedName, &pet.OwnerID, &pet.OwnerName,
					&pet.BirthDate, &pet.Gender, &pet.Description, &pet.Relationship,
					&pet.PhotoURL, &pet.CreatedAt,
				); err != nil {
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

			var id int

			// Получаем название вида из таблицы species
			var speciesName string
			err := db.QueryRow("SELECT name FROM species WHERE id = $1", input.SpeciesID).Scan(&speciesName)
			if err != nil {
				fmt.Printf("❌ Error fetching species name: %v\n", err)
				c.JSON(500, gin.H{"success": false, "error": "Invalid species_id"})
				return
			}

			// Обработка пустой даты
			var birthDate *string
			if input.BirthDate != "" {
				birthDate = &input.BirthDate
			}

			err = db.QueryRow(`
				INSERT INTO pets (name, species, species_id, breed_id, user_id, birth_date, gender, description, relationship)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'owner')
				RETURNING id
			`, input.Name, speciesName, input.SpeciesID, input.BreedID, userID, birthDate, input.Gender, input.Description).Scan(&id)

			if err != nil {
				fmt.Printf("❌ Error creating pet: %v\n", err)
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

			petID := c.Param("id")

			// Проверяем, что питомец принадлежит текущему пользователю
			var ownerID int
			err := db.QueryRow("SELECT user_id FROM pets WHERE id = $1", petID).Scan(&ownerID)
			if err != nil {
				c.JSON(404, gin.H{"success": false, "error": "Pet not found"})
				return
			}

			if ownerID != userID.(int) {
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

		petsGroup.PUT("/:id", func(c *gin.Context) {
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

			if ownerID != userID.(int) {
				c.JSON(403, gin.H{"success": false, "error": "Forbidden"})
				return
			}

			var input map[string]interface{}
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(400, gin.H{"success": false, "error": "Invalid input"})
				return
			}

			// Обновляем только переданные поля
			query := "UPDATE pets SET "
			args := []interface{}{}
			argCount := 1

			for key, value := range input {
				if argCount > 1 {
					query += ", "
				}
				query += key + " = $" + fmt.Sprint(argCount)
				args = append(args, value)
				argCount++
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
	organizationsGroup := r.Group("/organizations")
	{
		organizationsGroup.GET("", organizationsHandler.GetAll)
		organizationsGroup.GET("/:id", organizationsHandler.GetByID)
	}

	// Health routes
	health := r.Group("/health")
	{
		health.GET("", func(c *gin.Context) {
			c.JSON(200, gin.H{"success": true, "data": []interface{}{}})
		})
	}
}
