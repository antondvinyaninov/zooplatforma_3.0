package org

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// checkOrgMembership проверяет, состоит ли пользователь в организации
func checkOrgMembership(c *gin.Context, db *sql.DB, orgID string) bool {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return false
	}

	var intUserID int
	switch v := userID.(type) {
	case float64:
		intUserID = int(v)
	case int:
		intUserID = v
	default:
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Invalid user ID format"})
		return false
	}

	var role string
	err := db.QueryRow("SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2", orgID, intUserID).Scan(&role)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "Not a member of this organization"})
		return false
	}
	return true
}

func SetupHealthRoutes(r *gin.RouterGroup, db *sql.DB) {
	// ======================
	// VACCINATIONS
	// ======================
	r.GET("/:orgId/pets/:petId/vaccinations", func(c *gin.Context) {
		orgID := c.Param("orgId")
		petID := c.Param("petId")
		if !checkOrgMembership(c, db, orgID) {
			return
		}

		rows, err := db.Query(`
			SELECT id, date, vaccine_name, vaccine_type, next_date, veterinarian, clinic, notes
			FROM pet_vaccinations
			WHERE pet_id = $1
			ORDER BY date DESC
		`, petID)

		if err != nil {
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
				continue
			}

			vacc := map[string]interface{}{
				"id":           id,
				"date":         date[:10],
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

		if vaccinations == nil {
			vaccinations = []map[string]interface{}{}
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "vaccinations": vaccinations})
	})

	r.POST("/:orgId/pets/:petId/vaccinations", func(c *gin.Context) {
		orgID := c.Param("orgId")
		petID := c.Param("petId")
		if !checkOrgMembership(c, db, orgID) {
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
		
		err := db.QueryRow(`
			INSERT INTO pet_vaccinations 
			(pet_id, date, vaccine_name, vaccine_type, next_date, veterinarian, clinic, notes)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING id
		`, petID, input.Date, input.VaccineName, input.VaccineType, nextDate, input.Veterinarian, input.Clinic, input.Notes).Scan(&id)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
			return
		}

		// Логируем вакцинацию
		desc := input.VaccineName + " (" + input.VaccineType + ")"
		if input.NextDate != "" {
			desc += ". Следующая: " + input.NextDate[:10]
		}
		db.Exec(`
			INSERT INTO org_pet_events (org_id, pet_id, event_type, title, description, icon, color)
			VALUES ($1, $2, 'medical', 'Добавлена вакцинация', $3, '💉', 'green')
		`, orgID, petID, desc)

		c.JSON(http.StatusOK, gin.H{"success": true, "id": id})
	})

	r.PUT("/:orgId/vaccinations/:id", func(c *gin.Context) {
		orgID := c.Param("orgId")
		id := c.Param("id")
		if !checkOrgMembership(c, db, orgID) {
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

		_, err := db.Exec(query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true})
	})

	r.DELETE("/:orgId/vaccinations/:id", func(c *gin.Context) {
		orgID := c.Param("orgId")
		id := c.Param("id")
		if !checkOrgMembership(c, db, orgID) {
			return
		}

		_, err := db.Exec("DELETE FROM pet_vaccinations WHERE id = $1", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true})
	})


	// ======================
	// TREATMENTS
	// ======================
	r.GET("/:orgId/pets/:petId/treatments", func(c *gin.Context) {
		orgID := c.Param("orgId")
		petID := c.Param("petId")
		if !checkOrgMembership(c, db, orgID) {
			return
		}

		rows, err := db.Query(`
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
	})

	r.POST("/:orgId/pets/:petId/treatments", func(c *gin.Context) {
		orgID := c.Param("orgId")
		petID := c.Param("petId")
		if !checkOrgMembership(c, db, orgID) {
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
		
		err := db.QueryRow(`
			INSERT INTO pet_treatments 
			(pet_id, date, treatment_type, product_name, next_date, dosage, notes)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id
		`, petID, input.Date, input.TreatmentType, input.ProductName, nextDate, input.Dosage, input.Notes).Scan(&id)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
			return
		}

		// Логируем обработку
		desc := input.TreatmentType
		if input.ProductName != "" {
			desc += " (" + input.ProductName + ")"
		}
		db.Exec(`
			INSERT INTO org_pet_events (org_id, pet_id, event_type, title, description, icon, color)
			VALUES ($1, $2, 'medical', 'Добавлена обработка от паразитов', $3, '💊', 'green')
		`, orgID, petID, desc)

		c.JSON(http.StatusOK, gin.H{"success": true, "id": id})
	})

	r.PUT("/:orgId/treatments/:id", func(c *gin.Context) {
		orgID := c.Param("orgId")
		id := c.Param("id")
		if !checkOrgMembership(c, db, orgID) {
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

		_, err := db.Exec(query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true})
	})

	r.DELETE("/:orgId/treatments/:id", func(c *gin.Context) {
		orgID := c.Param("orgId")
		id := c.Param("id")
		if !checkOrgMembership(c, db, orgID) {
			return
		}

		_, err := db.Exec("DELETE FROM pet_treatments WHERE id = $1", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true})
	})


	// ======================
	// MEDICAL RECORDS
	// ======================
	r.GET("/:orgId/pets/:petId/medical-records", func(c *gin.Context) {
		orgID := c.Param("orgId")
		petID := c.Param("petId")
		if !checkOrgMembership(c, db, orgID) {
			return
		}

		rows, err := db.Query(`
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
	})

	r.POST("/:orgId/pets/:petId/medical-records", func(c *gin.Context) {
		orgID := c.Param("orgId")
		petID := c.Param("petId")
		if !checkOrgMembership(c, db, orgID) {
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
		err := db.QueryRow(`
			INSERT INTO pet_medical_records 
			(pet_id, date, record_type, title, description, veterinarian, clinic, diagnosis, treatment, medications, cost)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			RETURNING id
		`, petID, input.Date, input.RecordType, input.Title, input.Description, input.Veterinarian, input.Clinic, input.Diagnosis, input.Treatment, input.Medications, input.Cost).Scan(&id)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
			return
		}

		// Логируем мед. запись
		desc := input.RecordType
		if input.Clinic != "" {
			desc += " в " + input.Clinic
		}
		db.Exec(`
			INSERT INTO org_pet_events (org_id, pet_id, event_type, title, description, icon, color)
			VALUES ($1, $2, 'medical', 'Медицинская запись', $3, '🏥', 'red')
		`, orgID, petID, desc)

		c.JSON(http.StatusOK, gin.H{"success": true, "id": id})
	})

	r.PUT("/:orgId/medical-records/:id", func(c *gin.Context) {
		orgID := c.Param("orgId")
		id := c.Param("id")
		if !checkOrgMembership(c, db, orgID) {
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

		_, err := db.Exec(query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true})
	})

	r.DELETE("/:orgId/medical-records/:id", func(c *gin.Context) {
		orgID := c.Param("orgId")
		id := c.Param("id")
		if !checkOrgMembership(c, db, orgID) {
			return
		}

		_, err := db.Exec("DELETE FROM pet_medical_records WHERE id = $1", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Database error"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true})
	})
}
