package petid

import (
	"database/sql"
	"fmt"

	"github.com/gin-gonic/gin"
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
			// Return empty if filtered by organization, as this relationship is deprecated
			if c.Query("organization_id") != "" {
				c.JSON(200, gin.H{"success": true, "pets": []interface{}{}, "data": []interface{}{}})
				return
			}

			// Получаем всех питомцев
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
				ORDER BY p.id DESC
			`)

			if err != nil {
				fmt.Printf("Error fetching all pets: %v\n", err)
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

			var petList []Pet
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
				petList = append(petList, pet)
			}
			if petList == nil {
				petList = []Pet{}
			}

			c.JSON(200, gin.H{"success": true, "pets": petList, "data": petList})
		})
		pets.GET("/:id", func(c *gin.Context) {
			c.JSON(200, gin.H{"success": true, "data": gin.H{"id": c.Param("id")}})
		})

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
