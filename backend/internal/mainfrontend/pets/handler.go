package pets

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// petViewsCache используется для предотвращения накрутки просмотров (хранит "<ip>_<pet_id>": timestamp)
var petViewsCache sync.Map

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
				COALESCE(NULLIF(o.short_name, ''), o.name, u.name) as owner_name, 
				CASE WHEN p.org_id IS NOT NULL THEN NULL ELSE u.last_name END as owner_last_name, 
				COALESCE(NULLIF(p.city, ''), CASE WHEN p.org_id IS NOT NULL THEN COALESCE(NULLIF(o.city, ''), NULLIF(o.address_city, ''), NULLIF(o.address, '')) ELSE NULLIF(u.location, '') END) as location, 
				CASE WHEN p.org_id IS NOT NULL THEN NULLIF(o.phone, '') ELSE NULLIF(u.phone, '') END as phone, 
				p.location_type, 
				CASE WHEN p.org_id IS NOT NULL THEN NULLIF(o.logo, '') ELSE NULLIF(u.avatar, '') END as owner_avatar,
				b.name as breed_name, p.catalog_status, p.catalog_data, s.name as species_name,
				p.org_id, p.views_count
			FROM pets p
			LEFT JOIN users u ON p.user_id = u.id
			LEFT JOIN organizations o ON p.org_id = o.id
			LEFT JOIN breeds b ON p.breed_id = b.id
			LEFT JOIN species s ON p.species_id = s.id
			WHERE (p.relationship = 'curator' OR p.org_id IS NOT NULL)
			  AND (p.catalog_status != 'draft' OR p.catalog_status IS NULL)
			  AND (
			      (p.photo IS NOT NULL AND p.photo != '') 
			      OR 
			      (p.photo_url IS NOT NULL AND p.photo_url != '')
			      OR
			      (p.media_urls IS NOT NULL AND p.media_urls::text != '[]' AND p.media_urls::text != 'null')
			  )
			  AND p.name IS NOT NULL AND p.name != ''
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
			ownerName, ownerLastName, location, phone, locationType, ownerAvatar, breedName sql.NullString
			catalogStatus                                     sql.NullString
			catalogDataRaw                                    []byte
			speciesName                                       sql.NullString
			orgID                                             sql.NullInt64
			viewsCount                                        sql.NullInt64
		)

		err := rows.Scan(
			&id, &name, &species, &breed, &gender, &birthDate,
			&color, &size, &photoURL, &userID, &description,
			&ownerName, &ownerLastName, &location, &phone, &locationType, &ownerAvatar, &breedName,
			&catalogStatus, &catalogDataRaw, &speciesName, &orgID, &viewsCount,
		)
		if err != nil {
			continue
		}

		// Определяем статус
		status := catalogStatus.String
		if status == "" || status == "draft" {
			status = "looking_for_home"
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
		}

		ownerFullName := ownerName.String
		if ownerLastName.Valid && ownerLastName.String != "" {
			ownerFullName = ownerFullName + " " + ownerLastName.String
		}

		resolvedBreed := breed.String
		if breedName.Valid && breedName.String != "" {
			resolvedBreed = breedName.String
		}

		resolvedSpecies := species
		if speciesName.Valid && speciesName.String != "" {
			resolvedSpecies = speciesName.String
		}

		var parsedCatalogData map[string]interface{}
		if len(catalogDataRaw) > 0 {
			_ = json.Unmarshal(catalogDataRaw, &parsedCatalogData)
		}

		pet := map[string]interface{}{
			"id":          id,
			"name":        name,
			"species":     resolvedSpecies,
			"breed":       resolvedBreed,
			"gender":      gender.String,
			"birth_date":  birthDate.String,
			"color":       color.String,
			"size":        size.String,
			"photo":       photoURL.String,
			"user_id":     userID,
			"description": description.String,
			"owner_name":  ownerFullName,
			"owner_avatar": ownerAvatar.String,
			"city":        location.String,
			"phone":       phone.String,
			"status":      status,
			"catalog_status": catalogStatus.String,
			"catalog_data":   parsedCatalogData,
			"views_count":    viewsCount.Int64,
		}

		pets = append(pets, pet)
	}

	c.JSON(200, gin.H{"success": true, "data": pets})
}

// GetByID - получить питомца по ID
func (h *Handler) GetByID(c *gin.Context) {
	petID := c.Param("id")

	// Получаем IP клиента
	clientIP := c.ClientIP()
	cacheKey := fmt.Sprintf("%s_%s", clientIP, petID)

	// Проверяем, смотрел ли этот IP карточку недавно (кэш в памяти)
	shouldIncrement := true
	if lastViewedObj, exists := petViewsCache.Load(cacheKey); exists {
		lastViewed := lastViewedObj.(time.Time)
		// Если с последнего просмотра прошло меньше 24 часов, счетчик не крутим
		if time.Since(lastViewed) < 24*time.Hour {
			shouldIncrement = false
		}
	}

	if shouldIncrement {
		// Увеличиваем счетчик просмотров
		_, updateErr := h.db.Exec("UPDATE pets SET views_count = COALESCE(views_count, 0) + 1 WHERE id = $1", petID)
		if updateErr != nil {
			println("Error updating views_count for pet", petID, ":", updateErr.Error())
		} else {
			// Запоминаем время просмотра
			petViewsCache.Store(cacheKey, time.Now())
		}
	}

	query := `
		SELECT 
			p.id, p.name, p.species, p.breed, p.gender, p.birth_date,
			p.color, p.size, p.photo_url, p.user_id, p.description,
			p.relationship, p.location_type, p.microchip, p.sterilization_date,

			p.fur, p.ears, p.tail, p.special_marks,
			p.marking_date, p.tag_number, p.brand_number,
			p.location_address, p.city, p.location_cage, p.location_contact, p.location_phone, p.location_notes,
			p.weight, p.health_notes, p.views_count,
			p.age_type, p.approximate_years, p.approximate_months, p.is_sterilized, p.media_urls,
			p.catalog_status, p.catalog_data,

			COALESCE(NULLIF(o.short_name, ''), o.name, u.name) as owner_name,
			CASE WHEN p.org_id IS NOT NULL THEN NULL ELSE u.last_name END as last_name, 
			CASE WHEN p.org_id IS NOT NULL THEN NULLIF(o.logo, '') ELSE NULLIF(u.avatar, '') END as avatar, 
			COALESCE(NULLIF(p.city, ''), CASE WHEN p.org_id IS NOT NULL THEN COALESCE(NULLIF(o.city, ''), NULLIF(o.address_city, ''), NULLIF(o.address, '')) ELSE NULLIF(u.location, '') END) as location, 
			CASE WHEN p.org_id IS NOT NULL THEN NULLIF(o.phone, '') ELSE NULLIF(u.phone, '') END as phone, 
			CASE WHEN p.org_id IS NOT NULL THEN NULLIF(o.email, '') ELSE NULLIF(u.email, '') END as owner_email,
			p.created_at::text as created_at,
			
			p.species_id, s.name as species_name,
			p.breed_id, b.name as breed_name,
			p.org_id, o.name as org_name
		FROM pets p
		LEFT JOIN users u ON p.user_id = u.id
		LEFT JOIN species s ON p.species_id = s.id
		LEFT JOIN breeds b ON p.breed_id = b.id
		LEFT JOIN organizations o ON p.org_id = o.id
		WHERE p.id = $1
	`

	var (
		id, userID                                        int
		name, species                                     string
		breed, gender, color, size, photoURL, description sql.NullString
		birthDate, sterilizationDate                      sql.NullString
		relationship, locationType, microchip             sql.NullString

		fur, ears, tail, specialMarks                     sql.NullString
		markingDate, tagNumber, brandNumber               sql.NullString
		locationAddress, petCity, locationCage            sql.NullString
		locationContact, locationPhone, locationNotes     sql.NullString
		weight, healthNotes                               sql.NullString
		viewsCount                                        sql.NullInt64
		ageType                                           sql.NullString
		approxYears, approxMonths                         sql.NullInt64
		isSterilizedActual                                sql.NullBool
		mediaUrlsRaw                                      []byte
		catalogStatus                                     sql.NullString
		catalogDataRaw                                    []byte

		ownerName, ownerLastName, ownerAvatar             sql.NullString
		location, phone, createdAt, ownerEmail            sql.NullString

		speciesID, breedID, orgID                         sql.NullInt64
		speciesNameStr, breedNameStr, orgNameStr          sql.NullString
	)

	err := h.db.QueryRow(query, petID).Scan(
		&id, &name, &species, &breed, &gender, &birthDate,
		&color, &size, &photoURL, &userID, &description,
		&relationship, &locationType, &microchip, &sterilizationDate,

		&fur, &ears, &tail, &specialMarks,
		&markingDate, &tagNumber, &brandNumber,
		&locationAddress, &petCity, &locationCage, &locationContact, &locationPhone, &locationNotes,
		&weight, &healthNotes, &viewsCount,
		&ageType, &approxYears, &approxMonths, &isSterilizedActual, &mediaUrlsRaw,
		&catalogStatus, &catalogDataRaw,

		&ownerName, &ownerLastName, &ownerAvatar, &location, &phone, &ownerEmail, &createdAt,
		&speciesID, &speciesNameStr, &breedID, &breedNameStr, &orgID, &orgNameStr,
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

	var parsedMediaUrls []string
	if len(mediaUrlsRaw) > 0 {
		_ = json.Unmarshal(mediaUrlsRaw, &parsedMediaUrls)
	}

	var parsedCatalogData map[string]interface{}
	if len(catalogDataRaw) > 0 {
		_ = json.Unmarshal(catalogDataRaw, &parsedCatalogData)
	}

	ownerFullName := ownerName.String
	if ownerLastName.Valid && ownerLastName.String != "" {
		ownerFullName = ownerFullName + " " + ownerLastName.String
	}

	pet := map[string]interface{}{
		"id":                 id,
		"name":               name,
		"species":            species,
		"breed":              breedNameStr.String,
		"breed_id":           breedID.Int64,
		"gender":             gender.String,
		"birth_date":         birthDate.String,
		"age_type":           ageType.String,
		"approximate_years":  approxYears.Int64,
		"approximate_months": approxMonths.Int64,
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

		"fur":                fur.String,
		"ears":               ears.String,
		"tail":               tail.String,
		"special_marks":      specialMarks.String,
		"marking_date":       markingDate.String,
		"tag_number":         tagNumber.String,
		"brand_number":       brandNumber.String,
		"actual_city":        petCity.String,
		"location_address":   locationAddress.String,
		"location_cage":      locationCage.String,
		"location_contact":   locationContact.String,
		"location_phone":     locationPhone.String,
		"location_notes":     locationNotes.String,
		"weight":             weight.String,
		"health_notes":       healthNotes.String,
		"views_count":        viewsCount.Int64,

		"owner_name":         ownerFullName,
		"owner_email":        ownerEmail.String,
		"city":               location.String,
		"phone":              phone.String,
		"is_vaccinated":      false, // TODO: получить из медицинских записей
		"is_sterilized":      isSterilizedActual.Bool || (sterilizationDate.Valid && sterilizationDate.String != ""),
		"chip_number":        microchip.String,
		"created_at":         createdAt.String,
		"media_urls":         parsedMediaUrls,
		"catalog_status":     catalogStatus.String,
		"catalog_data":       parsedCatalogData,
		"org_id":             orgID.Int64,
		"org_name":           orgNameStr.String,
	}

	if speciesID.Valid {
		pet["species_id"] = speciesID.Int64
	}
	if speciesNameStr.Valid && speciesNameStr.String != "" {
		pet["species_name"] = speciesNameStr.String
	} else if species != "" {
		// Fallback to legacy string
		pet["species_name"] = species
	}

	if breedID.Valid {
		pet["breed_id"] = breedID.Int64
	}
	if breedNameStr.Valid && breedNameStr.String != "" {
		pet["breed_name"] = breedNameStr.String
	} else if breed.Valid && breed.String != "" {
		// Fallback to legacy string
		pet["breed_name"] = breed.String
	}

	c.JSON(200, gin.H{"success": true, "data": pet})
}

// GetOrganizationPets - получить всех питомцев принадлежащих организации
func (h *Handler) GetOrganizationPets(c *gin.Context) {
	orgIDParam := c.Param("id")

	query := `
		SELECT 
			p.id, p.name, p.species, p.breed, p.gender, p.birth_date,
			p.color, p.size, p.photo_url, p.user_id, p.description,
			COALESCE(NULLIF(o.short_name, ''), o.name, u.name) as owner_name, 
			CASE WHEN p.org_id IS NOT NULL THEN NULL ELSE u.last_name END as owner_last_name, 
			COALESCE(NULLIF(p.city, ''), CASE WHEN p.org_id IS NOT NULL THEN COALESCE(NULLIF(o.city, ''), NULLIF(o.address_city, ''), NULLIF(o.address, '')) ELSE NULLIF(u.location, '') END) as location, 
			CASE WHEN p.org_id IS NOT NULL THEN NULLIF(o.phone, '') ELSE NULLIF(u.phone, '') END as phone, 
			p.location_type, 
			CASE WHEN p.org_id IS NOT NULL THEN NULLIF(o.logo, '') ELSE NULLIF(u.avatar, '') END as owner_avatar,
			b.name as breed_name, p.catalog_status, p.catalog_data, s.name as species_name,
			p.org_id, p.views_count
		FROM pets p
		LEFT JOIN users u ON p.user_id = u.id
		LEFT JOIN organizations o ON p.org_id = o.id
		LEFT JOIN breeds b ON p.breed_id = b.id
		LEFT JOIN species s ON p.species_id = s.id
		WHERE p.org_id = $1
		  AND (p.catalog_status != 'draft' OR p.catalog_status IS NULL)
		  AND (
		      (p.photo IS NOT NULL AND p.photo != '') 
		      OR 
		      (p.photo_url IS NOT NULL AND p.photo_url != '')
		      OR
		      (p.media_urls IS NOT NULL AND p.media_urls::text != '[]' AND p.media_urls::text != 'null')
		  )
		  AND p.name IS NOT NULL AND p.name != ''
		ORDER BY p.created_at DESC
	`

	rows, err := h.db.Query(query, orgIDParam)
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
			ownerName, ownerLastName, location, phone, locationType, ownerAvatar, breedName sql.NullString
			catalogStatus                                     sql.NullString
			catalogDataRaw                                    []byte
			speciesName                                       sql.NullString
			orgID                                             sql.NullInt64
			viewsCount                                        sql.NullInt64
		)

		err := rows.Scan(
			&id, &name, &species, &breed, &gender, &birthDate,
			&color, &size, &photoURL, &userID, &description,
			&ownerName, &ownerLastName, &location, &phone, &locationType, &ownerAvatar, &breedName,
			&catalogStatus, &catalogDataRaw, &speciesName, &orgID, &viewsCount,
		)
		if err != nil {
			continue
		}

		status := catalogStatus.String
		if status == "" || status == "draft" {
			status = "looking_for_home"
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
		}

		ownerFullName := ownerName.String
		if ownerLastName.Valid && ownerLastName.String != "" {
			ownerFullName = ownerFullName + " " + ownerLastName.String
		}

		resolvedBreed := breed.String
		if breedName.Valid && breedName.String != "" {
			resolvedBreed = breedName.String
		}

		resolvedSpecies := species
		if speciesName.Valid && speciesName.String != "" {
			resolvedSpecies = speciesName.String
		}

		var parsedCatalogData map[string]interface{}
		if len(catalogDataRaw) > 0 {
			_ = json.Unmarshal(catalogDataRaw, &parsedCatalogData)
		}

		pet := map[string]interface{}{
			"id":             id,
			"name":           name,
			"species":        resolvedSpecies,
			"breed":          resolvedBreed,
			"gender":         gender.String,
			"birth_date":     birthDate.String,
			"color":          color.String,
			"size":           size.String,
			"photo":          photoURL.String,
			"user_id":        userID,
			"description":    description.String,
			"owner_name":     ownerFullName,
			"owner_avatar":   ownerAvatar.String,
			"city":           location.String,
			"phone":          phone.String,
			"status":         status,
			"catalog_status": catalogStatus.String,
			"catalog_data":   parsedCatalogData,
			"views_count":    viewsCount.Int64,
		}

		pets = append(pets, pet)
	}

	c.JSON(200, gin.H{"success": true, "data": pets})
}
