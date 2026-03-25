package pets

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
)

// UpdatePetCore выполняет обновление полей питомца и записывает события в хронологию.
// Метод является общим для всех кабинетов (org, owner, pethelper).
func (h *Handler) UpdatePetCore(petIDStr string, input map[string]interface{}) error {
	petID, err := strconv.Atoi(petIDStr)
	if err != nil {
		return fmt.Errorf("invalid pet ID")
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
		"sterilization_specialist": "sterilization_specialist",
		"sterilization_org":  "sterilization_org",
		"sterilization_type": "sterilization_type",
		"is_sterilized":      "is_sterilized",
		"photo_url":          "photo_url",
		"face_photo_url":     "face_photo_url",
		"body_photo_url":     "body_photo_url",
		"chip_number":        "microchip", // frontend - chip_number, db - microchip
		"media_urls":         "media_urls",
		"age_type":           "age_type",
		"approximate_years":  "approximate_years",
		"approximate_months": "approximate_months",
		"catalog_status":     "catalog_status",
		"catalog_data":       "catalog_data",

		"fur":              "fur",
		"ears":             "ears",
		"tail":             "tail",
		"special_marks":    "special_marks",
		"marking_date":     "marking_date",
		"tag_number":       "tag_number",
		"brand_number":     "brand_number",
		"location_address": "location_address",
		"location_cage":    "location_cage",
		"location_contact": "location_contact",
		"location_phone":   "location_phone",
		"location_notes":   "location_notes",
		"weight":           "weight",
		"health_notes":     "health_notes",
	}

	// Fetch old state for history tracking
	var oldWeight float64
	var oldCatalogStatus string
	err = h.db.QueryRow(`SELECT COALESCE(weight, 0), COALESCE(catalog_status, 'draft') FROM pets WHERE id=$1`, petID).Scan(&oldWeight, &oldCatalogStatus)
	if err != nil {
		return fmt.Errorf("failed to fetch check data: %v", err)
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
		
		if dbCol == "media_urls" || dbCol == "catalog_data" {
			jsonBytes, jsonErr := json.Marshal(value)
			if jsonErr != nil {
				return fmt.Errorf("failed to serialize %s: %v", dbCol, jsonErr)
			}
			args = append(args, jsonBytes)
		} else if valueStr, isStr := value.(string); isStr && valueStr == "" && (dbCol == "birth_date" || dbCol == "sterilization_date" || dbCol == "marking_date") {
			// Handle empty dates by setting them to NULL
			args = append(args, nil)
		} else {
			args = append(args, value)
		}
		argCount++
	}

	if argCount == 1 {
		return nil // nothing to update
	}

	query += " WHERE id = $" + fmt.Sprint(argCount)
	args = append(args, petID)

	_, err = h.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("failed to update db: %v", err)
	}

	// Logging changes
	var orgID sql.NullInt64
	h.db.QueryRow("SELECT org_id FROM pets WHERE id = $1", petID).Scan(&orgID)

	var orgIDVal int64 = 0
	if orgID.Valid {
		orgIDVal = orgID.Int64
	}

	// Weight logging
	if weightIf, ok := input["weight"]; ok && weightIf != nil {
		var newWeight float64
		switch v := weightIf.(type) {
		case float64:
			newWeight = v
		case int:
			newWeight = float64(v)
		case string:
			newWeight, _ = strconv.ParseFloat(v, 64)
		}
		
		if newWeight > 0 && newWeight != oldWeight {
			desc := fmt.Sprintf("Зафиксирован новый вес: %.2f кг", newWeight)
			err := h.db.QueryRow(`INSERT INTO org_pet_events (org_id, pet_id, event_type, title, description, icon, color) VALUES ($1, $2, 'weight', 'Изменен вес', $3, '⚖️', 'purple') RETURNING id`, orgIDVal, petID, desc).Scan(new(int))
			if err != nil {
				fmt.Printf("❌ Failed to log weight event: %v\n", err)
			}
		}
	}

	// Catalog Status logging
	if newStatusIf, ok := input["catalog_status"]; ok && newStatusIf != nil {
		if newStatusStr, isStr := newStatusIf.(string); isStr && newStatusStr != oldCatalogStatus {
			statusLabels := map[string]string{ "draft": "Не в каталоге", "looking_for_home": "Ищет дом", "needs_help": "Сбор средств", "lost": "Потерян", "found": "Найден" }
			newLabel, found := statusLabels[newStatusStr]
			if !found { newLabel = newStatusStr }
			desc := "Статус изменен на: " + newLabel

			err := h.db.QueryRow(`INSERT INTO org_pet_events (org_id, pet_id, event_type, title, description, icon, color) VALUES ($1, $2, 'catalog', 'Изменение в каталоге', $3, '📋', 'blue') RETURNING id`, orgIDVal, petID, desc).Scan(new(int))
			if err != nil {
				fmt.Printf("❌ Failed to log catalog event: %v\n", err)
			}
		}
	}

	return nil
}
