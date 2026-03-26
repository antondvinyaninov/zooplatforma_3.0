package pets

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Обработчики Vaccinations

func (h *Handler) GetVaccinations(c *gin.Context) {
	petID := c.Param("id")

	// Проверяем принадлежность питомца (это делается в роутере или здесь)
	// Допустим, мы вынесем проверку прав в отдельную миддлварь или будем верить роутеру для GET

	rows, err := h.db.Query(`
		SELECT id, date, vaccine_name, vaccine_type, next_date, veterinarian, clinic, notes
		FROM pet_vaccinations
		WHERE pet_id = $1
		ORDER BY date DESC
	`, petID)

	if err != nil {
		fmt.Printf("Error fetching vaccinations: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}
	defer rows.Close()

	var vaccinations []map[string]interface{}
	for rows.Next() {
		var (
			id                                                         int
			date                                                       string
			vaccineName, vaccineType                                   string
			nextDate, veterinarian, clinic, notes                      sql.NullString
		)

		if err := rows.Scan(&id, &date, &vaccineName, &vaccineType, &nextDate, &veterinarian, &clinic, &notes); err != nil {
			fmt.Printf("Scan error: %v\n", err)
			continue
		}

		vacc := map[string]interface{}{
			"id":           id,
			"date":         date[:10], // Обрезаем время
			"vaccine_name": vaccineName,
			"vaccine_type": vaccineType,
		}
		if nextDate.Valid {
			vacc["next_date"] = nextDate.String[:10]
		}
		if veterinarian.Valid {
			vacc["veterinarian"] = veterinarian.String
		}
		if clinic.Valid {
			vacc["clinic"] = clinic.String
		}
		if notes.Valid {
			vacc["notes"] = notes.String
		}

		vaccinations = append(vaccinations, vacc)
	}

	// Если слайс пуст, возвращаем [] вместо nil для JSON
	if vaccinations == nil {
		vaccinations = []map[string]interface{}{}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "vaccinations": vaccinations})
}

func (h *Handler) CreateVaccination(c *gin.Context) {
	petID := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	// Проверяем права на питомца
	var ownerID int
	err := h.db.QueryRow("SELECT user_id FROM pets WHERE id = $1", petID).Scan(&ownerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Pet not found"})
		return
	}
	if ownerID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "Forbidden"})
		return
	}

	var input struct {
		Date         string `json:"date" binding:"required"`
		VaccineName  string `json:"vaccine_name" binding:"required"`
		VaccineType  string `json:"vaccine_type" binding:"required"`
		NextDate     string `json:"next_date"`
		Veterinarian string `json:"veterinarian"`
		Clinic       string `json:"clinic"`
		Notes        string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid input"})
		return
	}

	var id int
	var nextDate interface{} = nil
	if input.NextDate != "" {
		nextDate = input.NextDate
	}
	
	err = h.db.QueryRow(`
		INSERT INTO pet_vaccinations 
		(pet_id, date, vaccine_name, vaccine_type, next_date, veterinarian, clinic, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`, petID, input.Date, input.VaccineName, input.VaccineType, nextDate, input.Veterinarian, input.Clinic, input.Notes).Scan(&id)

	if err != nil {
		fmt.Printf("Error creating vaccination: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "id": id})
}

func (h *Handler) UpdateVaccination(c *gin.Context) {
	id := c.Param("id")
	// Так как в маршрутах /vaccinations/:id у нас нет ID питомца в URI,
	// мы должны сделать join с таблицей pets, чтобы проверить владельца.
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	var ownerID int
	err := h.db.QueryRow(`
		SELECT p.user_id 
		FROM pet_vaccinations v
		JOIN pets p ON v.pet_id = p.id
		WHERE v.id = $1
	`, id).Scan(&ownerID)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Vaccination not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}

	if ownerID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "Forbidden"})
		return
	}

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid input"})
		return
	}

	if len(input) == 0 {
		c.JSON(http.StatusOK, gin.H{"success": true})
		return
	}

	query := "UPDATE pet_vaccinations SET "
	args := []interface{}{}
	argCount := 1

	for key, value := range input {
		if argCount > 1 {
			query += ", "
		}
		// Заменяем пустые строки на nil для дат
		if (key == "next_date") && value == "" {
			query += key + " = NULL"
		} else {
			query += key + " = $" + fmt.Sprint(argCount)
			args = append(args, value)
			argCount++
		}
	}

	query += " WHERE id = $" + fmt.Sprint(argCount)
	args = append(args, id)

	_, err = h.db.Exec(query, args...)
	if err != nil {
		fmt.Printf("Error updating vaccination: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *Handler) DeleteVaccination(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	var ownerID int
	err := h.db.QueryRow(`
		SELECT p.user_id 
		FROM pet_vaccinations v
		JOIN pets p ON v.pet_id = p.id
		WHERE v.id = $1
	`, id).Scan(&ownerID)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Vaccination not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}

	if ownerID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "Forbidden"})
		return
	}

	_, err = h.db.Exec("DELETE FROM pet_vaccinations WHERE id = $1", id)
	if err != nil {
		fmt.Printf("Error deleting vaccination: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// Обработчики Treatments

func (h *Handler) GetTreatments(c *gin.Context) {
	petID := c.Param("id")

	rows, err := h.db.Query(`
		SELECT id, date, treatment_type, product_name, next_date, dosage, notes
		FROM pet_treatments
		WHERE pet_id = $1
		ORDER BY date DESC
	`, petID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}
	defer rows.Close()

	var treatments []map[string]interface{}
	for rows.Next() {
		var (
			id                                       int
			date                                     string
			treatmentType, productName               string
			nextDate, dosage, notes                  sql.NullString
		)

		if err := rows.Scan(&id, &date, &treatmentType, &productName, &nextDate, &dosage, &notes); err != nil {
			continue
		}

		treat := map[string]interface{}{
			"id":             id,
			"date":           date[:10],
			"treatment_type": treatmentType,
			"product_name":   productName,
		}
		if nextDate.Valid {
			treat["next_date"] = nextDate.String[:10]
		}
		if dosage.Valid {
			treat["dosage"] = dosage.String
		}
		if notes.Valid {
			treat["notes"] = notes.String
		}

		treatments = append(treatments, treat)
	}

	if treatments == nil {
		treatments = []map[string]interface{}{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "treatments": treatments})
}

func (h *Handler) CreateTreatment(c *gin.Context) {
	petID := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	var ownerID int
	err := h.db.QueryRow("SELECT user_id FROM pets WHERE id = $1", petID).Scan(&ownerID)
	if err != nil || ownerID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "Forbidden"})
		return
	}

	var input struct {
		Date          string `json:"date" binding:"required"`
		TreatmentType string `json:"treatment_type" binding:"required"`
		ProductName   string `json:"product_name" binding:"required"`
		NextDate      string `json:"next_date"`
		Dosage        string `json:"dosage"`
		Notes         string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid input"})
		return
	}

	var id int
	var nextDate interface{} = nil
	if input.NextDate != "" {
		nextDate = input.NextDate
	}
	
	err = h.db.QueryRow(`
		INSERT INTO pet_treatments 
		(pet_id, date, treatment_type, product_name, next_date, dosage, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, petID, input.Date, input.TreatmentType, input.ProductName, nextDate, input.Dosage, input.Notes).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "id": id})
}

func (h *Handler) UpdateTreatment(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	var ownerID int
	err := h.db.QueryRow(`
		SELECT p.user_id 
		FROM pet_treatments t
		JOIN pets p ON t.pet_id = p.id
		WHERE t.id = $1
	`, id).Scan(&ownerID)

	if err != nil || ownerID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "Forbidden"})
		return
	}

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid input"})
		return
	}

	if len(input) == 0 {
		c.JSON(http.StatusOK, gin.H{"success": true})
		return
	}

	query := "UPDATE pet_treatments SET "
	args := []interface{}{}
	argCount := 1

	for key, value := range input {
		if argCount > 1 {
			query += ", "
		}
		if (key == "next_date") && value == "" {
			query += key + " = NULL"
		} else {
			query += key + " = $" + fmt.Sprint(argCount)
			args = append(args, value)
			argCount++
		}
	}

	query += " WHERE id = $" + fmt.Sprint(argCount)
	args = append(args, id)

	_, err = h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *Handler) DeleteTreatment(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	var ownerID int
	err := h.db.QueryRow(`
		SELECT p.user_id 
		FROM pet_treatments t
		JOIN pets p ON t.pet_id = p.id
		WHERE t.id = $1
	`, id).Scan(&ownerID)

	if err != nil || ownerID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "Forbidden"})
		return
	}

	_, err = h.db.Exec("DELETE FROM pet_treatments WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// Обработчики Medical Records

func (h *Handler) GetMedicalRecords(c *gin.Context) {
	petID := c.Param("id")

	rows, err := h.db.Query(`
		SELECT id, date, record_type, title, description, veterinarian, clinic, diagnosis, treatment, medications, cost
		FROM pet_medical_records
		WHERE pet_id = $1
		ORDER BY date DESC
	`, petID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}
	defer rows.Close()

	var records []map[string]interface{}
	for rows.Next() {
		var (
			id                                                                             int
			date                                                                           string
			recordType, title                                                              string
			description, veterinarian, clinic, diagnosis, treatment, medications   sql.NullString
			cost                                                                           sql.NullFloat64
		)

		if err := rows.Scan(&id, &date, &recordType, &title, &description, &veterinarian, &clinic, &diagnosis, &treatment, &medications, &cost); err != nil {
			continue
		}

		record := map[string]interface{}{
			"id":          id,
			"date":        date[:10],
			"record_type": recordType,
			"title":       title,
		}
		if description.Valid {
			record["description"] = description.String
		}
		if veterinarian.Valid {
			record["veterinarian"] = veterinarian.String
		}
		if clinic.Valid {
			record["clinic"] = clinic.String
		}
		if diagnosis.Valid {
			record["diagnosis"] = diagnosis.String
		}
		if treatment.Valid {
			record["treatment"] = treatment.String
		}
		if medications.Valid {
			record["medications"] = medications.String
		}
		if cost.Valid {
			record["cost"] = cost.Float64
		}

		records = append(records, record)
	}

	if records == nil {
		records = []map[string]interface{}{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "medical_records": records})
}

func (h *Handler) CreateMedicalRecord(c *gin.Context) {
	petID := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	var ownerID int
	err := h.db.QueryRow("SELECT user_id FROM pets WHERE id = $1", petID).Scan(&ownerID)
	if err != nil || ownerID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "Forbidden"})
		return
	}

	var input struct {
		Date         string  `json:"date" binding:"required"`
		RecordType   string  `json:"record_type" binding:"required"`
		Title        string  `json:"title" binding:"required"`
		Description  string  `json:"description"`
		Veterinarian string  `json:"veterinarian"`
		Clinic       string  `json:"clinic"`
		Diagnosis    string  `json:"diagnosis"`
		Treatment    string  `json:"treatment"`
		Medications  string  `json:"medications"`
		Cost         float64 `json:"cost"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid input"})
		return
	}

	var id int
	err = h.db.QueryRow(`
		INSERT INTO pet_medical_records 
		(pet_id, date, record_type, title, description, veterinarian, clinic, diagnosis, treatment, medications, cost)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id
	`, petID, input.Date, input.RecordType, input.Title, input.Description, input.Veterinarian, input.Clinic, input.Diagnosis, input.Treatment, input.Medications, input.Cost).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "id": id})
}

func (h *Handler) UpdateMedicalRecord(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	var ownerID int
	err := h.db.QueryRow(`
		SELECT p.user_id 
		FROM pet_medical_records m
		JOIN pets p ON m.pet_id = p.id
		WHERE m.id = $1
	`, id).Scan(&ownerID)

	if err != nil || ownerID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "Forbidden"})
		return
	}

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid input"})
		return
	}

	if len(input) == 0 {
		c.JSON(http.StatusOK, gin.H{"success": true})
		return
	}

	query := "UPDATE pet_medical_records SET "
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
	args = append(args, id)

	_, err = h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *Handler) DeleteMedicalRecord(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	var ownerID int
	err := h.db.QueryRow(`
		SELECT p.user_id 
		FROM pet_medical_records m
		JOIN pets p ON m.pet_id = p.id
		WHERE m.id = $1
	`, id).Scan(&ownerID)

	if err != nil || ownerID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "Forbidden"})
		return
	}

	_, err = h.db.Exec("DELETE FROM pet_medical_records WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// GetTimeline агрегирует события здоровья питомца
func (h *Handler) GetTimeline(c *gin.Context) {
	petID := c.Param("id")

	query := `
		SELECT 
			'vac_' || id AS id,
			'medical' AS type,
			'Прививка: ' || vaccine_name AS title,
			'Тип: ' || vaccine_type || COALESCE('. Клиника: ' || clinic, '') AS description,
			date,
			'💉' AS icon,
			'blue' AS color
		FROM pet_vaccinations
		WHERE pet_id = $1

		UNION ALL

		SELECT 
			'treat_' || id AS id,
			'medical' AS type,
			'Обработка: ' || treatment_type AS title,
			'Препарат: ' || product_name || COALESCE('. ' || notes, '') AS description,
			date,
			'💊' AS icon,
			'blue' AS color
		FROM pet_treatments
		WHERE pet_id = $1

		UNION ALL

		SELECT 
			'med_' || id AS id,
			'medical' AS type,
			'Запись: ' || title AS title,
			'Диагноз: ' || COALESCE(diagnosis, 'Не указан') AS description,
			date,
			'🏥' AS icon,
			'blue' AS color
		FROM pet_medical_records
		WHERE pet_id = $1

		UNION ALL

		SELECT 
			'reg_' || pr.id AS id,
			'registration' AS type,
			CASE WHEN ROW_NUMBER() OVER (PARTITION BY pr.pet_id ORDER BY pr.registered_at ASC, pr.id ASC) = 1 THEN 'Официальная регистрация' ELSE 'Дополнение данных' END AS title,
			'Дата: ' || TO_CHAR(pr.registered_at, 'DD.MM.YYYY') || 
			'. Специалист: ' || COALESCE(pr.specialist_name, 'Не указан') || 
			COALESCE(' (' || NULLIF(pr.specialist_position, '') || ')', '') || 
			COALESCE('. Организация: ' || (SELECT name FROM organizations WHERE id = pr.org_id), '') || 
			COALESCE('. Заметка: ' || NULLIF(pr.notes, ''), '') ||
			COALESCE('. Чип: ' || NULLIF(pr.chip_number, ''), '') ||
			COALESCE('. Бирка: ' || NULLIF(pr.tag_number, ''), '') ||
			COALESCE('. Клеймо: ' || NULLIF(pr.brand_number, ''), '') AS description,
			pr.registered_at AS date,
			'📝' AS icon,
			'blue' AS color
		FROM pet_registrations pr
		WHERE pr.pet_id = $1

		UNION ALL

		SELECT 
			'org_' || id AS id,
			event_type AS type,
			title,
			description,
			created_at AS date,
			icon,
			color
		FROM org_pet_events
		WHERE pet_id = $1 AND event_type != 'medical' AND event_type != 'registration'

		ORDER BY date DESC
	`

	rows, err := h.db.Query(query, petID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
		return
	}
	defer rows.Close()

	var events []map[string]interface{}
	for rows.Next() {
		var id, eventType, title, date, icon, color string
		var description sql.NullString

		if err := rows.Scan(&id, &eventType, &title, &description, &date, &icon, &color); err != nil {
			continue
		}

		event := map[string]interface{}{
			"id":    id,
			"type":  eventType,
			"title": title,
			"date":  date[:10],
			"icon":  icon,
			"color": color,
		}
		if description.Valid {
			event["description"] = description.String
		}

		events = append(events, event)
	}

	if events == nil {
		events = []map[string]interface{}{}
	}

	var petName, createdAt string
	err = h.db.QueryRow(`SELECT COALESCE(name, 'Без имени'), created_at::text FROM pets WHERE id = $1`, petID).Scan(&petName, &createdAt)
	if err == nil {
		events = append(events, map[string]interface{}{
			"id":          "reg_0",
			"type":        "registration",
			"title":       "Регистрация профиля",
			"description": "Профиль питомца «" + petName + "» создан",
			"date":        createdAt[:10],
			"icon":        "🐾",
			"color":       "blue",
		})
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "events": events})
}
