package pets

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// GetUserPets - получить питомцев пользователя
func (h *Handler) GetUserPets(c *gin.Context) {
	userID := c.Param("id")

	query := `
		SELECT 
			id, name, species, breed, gender, birth_date,
			color, size, photo_url, relationship, user_id, curator_id
		FROM pets
		WHERE user_id = $1 OR curator_id = $1
		ORDER BY created_at DESC
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	pets := []map[string]interface{}{}

	for rows.Next() {
		var (
			id, userIDInt                                      int
			name, species                                      string
			breed, gender, color, size, photoURL, relationship sql.NullString
			birthDate                                          sql.NullString
			curatorID                                          sql.NullInt64
		)

		err := rows.Scan(
			&id, &name, &species, &breed, &gender, &birthDate,
			&color, &size, &photoURL, &relationship, &userIDInt, &curatorID,
		)
		if err != nil {
			continue
		}

		pet := map[string]interface{}{
			"id":           id,
			"name":         name,
			"species":      species,
			"breed":        breed.String,
			"gender":       gender.String,
			"birth_date":   birthDate.String,
			"color":        color.String,
			"size":         size.String,
			"photo":        photoURL.String,
			"relationship": relationship.String,
			"user_id":      userIDInt,
		}

		if curatorID.Valid {
			pet["curator_id"] = curatorID.Int64
		}

		pets = append(pets, pet)
	}

	c.JSON(200, gin.H{"success": true, "data": pets})
}

// GetCatalog - получить всех питомцев для каталога (только питомцы под опекой, не владельческие)
func (h *Handler) GetCatalog(c *gin.Context) {
	query := `
		SELECT 
			p.id, p.name, p.species, p.breed, p.gender, p.birth_date,
			p.color, p.size, p.photo_url, p.user_id, p.description,
			u.name as owner_name, u.location, u.phone, p.location_type
		FROM pets p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.relationship = 'curator'
		ORDER BY p.created_at DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	pets := []map[string]interface{}{}

	for rows.Next() {
		var (
			id, userID                                        int
			name, species                                     string
			breed, gender, color, size, photoURL, description sql.NullString
			birthDate                                         sql.NullString
			ownerName, location, phone, locationType          sql.NullString
		)

		err := rows.Scan(
			&id, &name, &species, &breed, &gender, &birthDate,
			&color, &size, &photoURL, &userID, &description,
			&ownerName, &location, &phone, &locationType,
		)
		if err != nil {
			continue
		}

		// Определяем статус на основе location_type
		status := "looking_for_home"
		if locationType.Valid {
			switch locationType.String {
			case "shelter":
				status = "looking_for_home"
			case "foster":
				status = "looking_for_home"
			case "clinic":
				status = "needs_help"
			}
		}

		pet := map[string]interface{}{
			"id":          id,
			"name":        name,
			"species":     species,
			"breed":       breed.String,
			"gender":      gender.String,
			"birth_date":  birthDate.String,
			"color":       color.String,
			"size":        size.String,
			"photo":       photoURL.String,
			"user_id":     userID,
			"description": description.String,
			"owner_name":  ownerName.String,
			"city":        location.String,
			"phone":       phone.String,
			"status":      status,
		}

		pets = append(pets, pet)
	}

	c.JSON(200, gin.H{"success": true, "data": pets})
}

// GetByID - получить питомца по ID
func (h *Handler) GetByID(c *gin.Context) {
	petID := c.Param("id")

	query := `
		SELECT 
			p.id, p.name, p.species, p.breed, p.gender, p.birth_date,
			p.color, p.size, p.photo_url, p.user_id, p.description,
			p.relationship, p.location_type, p.microchip, p.sterilization_date,
			u.name as owner_name, u.last_name, u.avatar, u.location, u.phone, u.email as owner_email,
			p.created_at::text as created_at
		FROM pets p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.id = $1
	`

	var (
		id, userID                                        int
		name, species                                     string
		breed, gender, color, size, photoURL, description sql.NullString
		birthDate, sterilizationDate                      sql.NullString
		relationship, locationType, microchip             sql.NullString
		ownerName, ownerLastName, ownerAvatar             sql.NullString
		location, phone, createdAt, ownerEmail            sql.NullString
	)

	err := h.db.QueryRow(query, petID).Scan(
		&id, &name, &species, &breed, &gender, &birthDate,
		&color, &size, &photoURL, &userID, &description,
		&relationship, &locationType, &microchip, &sterilizationDate,
		&ownerName, &ownerLastName, &ownerAvatar, &location, &phone, &ownerEmail, &createdAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(404, gin.H{"success": false, "error": "Pet not found"})
		return
	}

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Формируем объект владельца
	user := map[string]interface{}{
		"id":        userID,
		"name":      ownerName.String,
		"last_name": ownerLastName.String,
		"avatar":    ownerAvatar.String,
		"location":  location.String,
		"email":     ownerEmail.String,
	}

	pet := map[string]interface{}{
		"id":                 id,
		"name":               name,
		"species":            species,
		"breed":              breed.String,
		"gender":             gender.String,
		"birth_date":         birthDate.String,
		"color":              color.String,
		"size":               size.String,
		"photo":              photoURL.String,
		"photo_url":          photoURL.String,
		"user_id":            userID,
		"user":               user,
		"description":        description.String,
		"relationship":       relationship.String,
		"location_type":      locationType.String,
		"microchip":          microchip.String,
		"sterilization_date": sterilizationDate.String,
		"owner_name":         ownerName.String,
		"owner_email":        ownerEmail.String,
		"city":               location.String,
		"phone":              phone.String,
		"is_vaccinated":      false, // TODO: получить из медицинских записей
		"is_sterilized":      sterilizationDate.Valid && sterilizationDate.String != "",
		"chip_number":        microchip.String,
		"created_at":         createdAt.String,
	}

	c.JSON(200, gin.H{"success": true, "data": pet})
}
