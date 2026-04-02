package organizations

import (
	"database/sql"
	"fmt"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

func getUserID(c *gin.Context) (int, bool) {
	userIdVar, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}
	switch v := userIdVar.(type) {
	case float64:
		return int(v), true
	case int:
		return v, true
	default:
		return 0, false
	}
}

// GetByID - получить организацию по ID
func (h *Handler) GetByID(c *gin.Context) {
	id := c.Param("id")

	query := `
		SELECT 
			id, name, short_name, legal_form, type, inn, ogrn, kpp, registration_date,
			email, phone, website,
			vk_link, telegram_link, whatsapp_link, max_link, youtube_link, ok_link, rutube_link, telegram_channel_link, max_channel_link,
			address_full, address_postal_code, address_region, address_city,
			address_street, address_house, address_office,
			geo_lat, geo_lon,
			description, bio, logo, cover_photo,
			director_name, director_position,
			owner_user_id, profile_visibility, show_phone, show_email, allow_messages,
			is_verified, is_active, status, created_at, updated_at
		FROM organizations
		WHERE id = $1 AND is_active = true
	`

	var (
		orgID                                                      int
		ownerUserID                                                sql.NullInt64
		name, orgType                                              string
		shortName, legalForm, inn, ogrn, kpp, registrationDate     sql.NullString
		email, phone, website                                      sql.NullString
		vkLink, telegramLink, whatsappLink, maxLink                sql.NullString
		youtubeLink, okLink, rutubeLink                            sql.NullString
		telegramChannelLink, maxChannelLink                        sql.NullString
		addressFull, addressPostalCode, addressRegion, addressCity sql.NullString
		addressStreet, addressHouse, addressOffice                 sql.NullString
		geoLat, geoLon                                             sql.NullFloat64
		description, bio, logo, coverPhoto                         sql.NullString
		directorName, directorPosition                             sql.NullString
		profileVisibility, showPhone, showEmail, allowMessages     sql.NullString
		isVerified, isActive                                       bool
		status, createdAt, updatedAt                               string
	)

	err := h.db.QueryRow(query, id).Scan(
		&orgID, &name, &shortName, &legalForm, &orgType, &inn, &ogrn, &kpp, &registrationDate,
		&email, &phone, &website,
		&vkLink, &telegramLink, &whatsappLink, &maxLink, &youtubeLink, &okLink, &rutubeLink, &telegramChannelLink, &maxChannelLink,
		&addressFull, &addressPostalCode, &addressRegion, &addressCity,
		&addressStreet, &addressHouse, &addressOffice,
		&geoLat, &geoLon,
		&description, &bio, &logo, &coverPhoto,
		&directorName, &directorPosition,
		&ownerUserID, &profileVisibility, &showPhone, &showEmail, &allowMessages,
		&isVerified, &isActive, &status, &createdAt, &updatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(404, gin.H{"success": false, "error": "Organization not found"})
		return
	}

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	org := map[string]interface{}{
		"id":                  orgID,
		"name":                name,
		"short_name":          shortName.String,
		"legal_form":          legalForm.String,
		"type":                orgType,
		"inn":                 inn.String,
		"ogrn":                ogrn.String,
		"kpp":                 kpp.String,
		"registration_date":   registrationDate.String,
		"email":               email.String,
		"phone":               phone.String,
		"website":             website.String,
		"vk_link":             vkLink.String,
		"telegram_link":       telegramLink.String,
		"whatsapp_link":       whatsappLink.String,
		"max_link":            maxLink.String,
		"youtube_link":        youtubeLink.String,
		"ok_link":             okLink.String,
		"rutube_link":         rutubeLink.String,
		"telegram_channel_link": telegramChannelLink.String,
		"max_channel_link":    maxChannelLink.String,
		"address_full":        addressFull.String,
		"address_postal_code": addressPostalCode.String,
		"address_region":      addressRegion.String,
		"address_city":        addressCity.String,
		"address_street":      addressStreet.String,
		"address_house":       addressHouse.String,
		"address_office":      addressOffice.String,
		"geo_lat":             geoLat.Float64,
		"geo_lon":             geoLon.Float64,
		"description":         description.String,
		"bio":                 bio.String,
		"logo":                logo.String,
		"cover_photo":         coverPhoto.String,
		"director_name":       directorName.String,
		"director_position":   directorPosition.String,
		"owner_user_id":       int(ownerUserID.Int64),
		"profile_visibility":  profileVisibility.String,
		"show_phone":          showPhone.String,
		"show_email":          showEmail.String,
		"allow_messages":      allowMessages.String,
		"is_verified":         isVerified,
		"is_active":           isActive,
		"status":              status,
		"created_at":          createdAt,
		"updated_at":          updatedAt,
	}

	c.JSON(200, gin.H{"success": true, "data": org})
}

// GetAll - получить список всех организаций
func (h *Handler) GetAll(c *gin.Context) {
	query := `
		SELECT 
			id, name, short_name, type, logo, bio,
			address_city, address_region, is_verified, created_at
		FROM organizations
		WHERE is_active = true
		ORDER BY is_verified DESC, created_at DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	organizations := []map[string]interface{}{}

	for rows.Next() {
		var (
			id                         int
			name                       string
			shortName, logo, bio       sql.NullString
			addressCity, addressRegion sql.NullString
			orgType                    string
			isVerified                 bool
			createdAt                  string
		)

		err := rows.Scan(
			&id, &name, &shortName, &orgType, &logo, &bio,
			&addressCity, &addressRegion, &isVerified, &createdAt,
		)
		if err != nil {
			continue
		}

		org := map[string]interface{}{
			"id":             id,
			"name":           name,
			"short_name":     shortName.String,
			"type":           orgType,
			"logo":           logo.String,
			"bio":            bio.String,
			"address_city":   addressCity.String,
			"address_region": addressRegion.String,
			"is_verified":    isVerified,
			"created_at":     createdAt,
		}

		organizations = append(organizations, org)
	}

	c.JSON(200, gin.H{"success": true, "data": organizations})
}

// GetMy - получить организации пользователя
func (h *Handler) GetMy(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized (missing user_id)"})
		return
	}

	query := `
		SELECT 
			o.id, o.name, o.short_name, o.type, o.logo, o.bio,
			o.address_city, o.address_region, o.is_verified, o.created_at,
			om.role
		FROM organizations o
		JOIN organization_members om ON o.id = om.organization_id
		WHERE om.user_id = $1 AND o.is_active = true
		ORDER BY o.created_at DESC
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	organizations := []map[string]interface{}{}

	for rows.Next() {
		var (
			id                         int
			name                       string
			shortName, logo, bio       sql.NullString
			addressCity, addressRegion sql.NullString
			orgType                    string
			isVerified                 bool
			createdAt                  string
			role                       sql.NullString
		)

		err := rows.Scan(
			&id, &name, &shortName, &orgType, &logo, &bio,
			&addressCity, &addressRegion, &isVerified, &createdAt,
			&role,
		)
		if err != nil {
			continue
		}

		org := map[string]interface{}{
			"id":             id,
			"name":           name,
			"short_name":     shortName.String,
			"type":           orgType,
			"logo":           logo.String,
			"bio":            bio.String,
			"address_city":   addressCity.String,
			"address_region": addressRegion.String,
			"is_verified":    isVerified,
			"created_at":     createdAt,
			"role":           role.String,
		}

		organizations = append(organizations, org)
	}

	c.JSON(200, gin.H{"success": true, "data": organizations})
}

// CheckByInn - проверить существование организации по ИНН
func (h *Handler) CheckByInn(c *gin.Context) {
	inn := c.Param("inn")

	if inn == "" {
		c.JSON(400, gin.H{"success": false, "error": "INN is required"})
		return
	}

	var org struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	}

	query := `SELECT id, name FROM organizations WHERE inn = $1 AND is_active = true LIMIT 1`
	err := h.db.QueryRow(query, inn).Scan(&org.ID, &org.Name)

	if err == sql.ErrNoRows {
		// Организация не найдена - это нормально
		c.JSON(200, gin.H{"success": true, "data": nil})
		return
	}

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Организация найдена
	c.JSON(200, gin.H{"success": true, "data": org})
}

// Create - создать новую организацию
func (h *Handler) Create(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized (missing user_id)"})
		return
	}

	var req struct {
		Name              string   `json:"name" binding:"required"`
		ShortName         string   `json:"short_name"`
		LegalForm         string   `json:"legal_form"`
		Type              string   `json:"type" binding:"required"`
		INN               string   `json:"inn"`
		OGRN              string   `json:"ogrn"`
		KPP               string   `json:"kpp"`
		RegistrationDate  string   `json:"registration_date"`
		Email             string   `json:"email"`
		Phone             string   `json:"phone"`
		Website           string   `json:"website"`
		AddressFull       string   `json:"address_full"`
		AddressPostalCode string   `json:"address_postal_code"`
		AddressRegion     string   `json:"address_region"`
		AddressCity       string   `json:"address_city"`
		AddressStreet     string   `json:"address_street"`
		AddressHouse      string   `json:"address_house"`
		AddressOffice     string   `json:"address_office"`
		GeoLat            *float64 `json:"geo_lat"`
		GeoLon            *float64 `json:"geo_lon"`
		Description       string   `json:"description"`
		Bio               string   `json:"bio"`
		DirectorName      string   `json:"director_name"`
		DirectorPosition  string   `json:"director_position"`
		IsRepresentative  bool     `json:"is_representative"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Проверяем, не существует ли уже организация с таким ИНН
	if req.INN != "" {
		var existingID int
		checkQuery := `SELECT id FROM organizations WHERE inn = $1 AND is_active = true LIMIT 1`
		err := h.db.QueryRow(checkQuery, req.INN).Scan(&existingID)
		if err == nil {
			c.JSON(400, gin.H{"success": false, "error": "Organization with this INN already exists"})
			return
		}
	}

	// Создаем организацию
	var orgID int
	insertQuery := `
		INSERT INTO organizations (
			name, short_name, legal_form, type, inn, ogrn, kpp, registration_date,
			email, phone, website,
			address_full, address_postal_code, address_region, address_city,
			address_street, address_house, address_office,
			geo_lat, geo_lon,
			description, bio,
			director_name, director_position,
			owner_user_id, is_active, status,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8,
			$9, $10, $11,
			$12, $13, $14, $15,
			$16, $17, $18,
			$19, $20,
			$21, $22,
			$23, $24,
			$25, true, 'active',
			NOW(), NOW()
		) RETURNING id
	`

	var regDate interface{} = req.RegistrationDate
	if req.RegistrationDate == "" {
		regDate = nil
	}

	err := h.db.QueryRow(
		insertQuery,
		req.Name, req.ShortName, req.LegalForm, req.Type, req.INN, req.OGRN, req.KPP, regDate,
		req.Email, req.Phone, req.Website,
		req.AddressFull, req.AddressPostalCode, req.AddressRegion, req.AddressCity,
		req.AddressStreet, req.AddressHouse, req.AddressOffice,
		req.GeoLat, req.GeoLon,
		req.Description, req.Bio,
		req.DirectorName, req.DirectorPosition,
		userID,
	).Scan(&orgID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to create organization: " + err.Error()})
		return
	}

	// Добавляем создателя как владельца в organization_members
	memberQuery := `
		INSERT INTO organization_members (
			organization_id, user_id, role, position,
			can_post, joined_at
		) VALUES ($1, $2, 'owner', $3, true, NOW())
	`

	position := "Владелец"
	if req.IsRepresentative {
		position = "Представитель"
	}

	_, err = h.db.Exec(memberQuery, orgID, userID, position)
	if err != nil {
		// Не критично, продолжаем
		c.JSON(500, gin.H{"success": false, "error": "Organization created but failed to add member"})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"id": orgID,
		},
	})
}

// GetMembers - получить участников организации
func (h *Handler) GetMembers(c *gin.Context) {
	orgID := c.Param("id")

	query := `
		SELECT 
			om.id, om.organization_id, om.user_id, om.role, om.position, om.org_avatar,
			om.can_post, om.joined_at, COALESCE(om.is_public, true) as is_public,
			u.name as user_name, u.last_name as user_last_name, u.avatar as user_avatar
		FROM organization_members om
		JOIN users u ON om.user_id = u.id
		WHERE om.organization_id = $1
		ORDER BY 
			CASE om.role
				WHEN 'owner' THEN 1
				WHEN 'admin' THEN 2
				WHEN 'moderator' THEN 3
				ELSE 4
			END,
			om.joined_at ASC
	`

	rows, err := h.db.Query(query, orgID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	members := []map[string]interface{}{}

	for rows.Next() {
		var (
			id, organizationID, userID int
			role                       string
			position                   sql.NullString
			orgAvatar                  sql.NullString
			canPost                    bool
			isPublic                   bool
			joinedAt                   string
			userName, userLastName     string
			userAvatar                 sql.NullString
		)

		err := rows.Scan(
			&id, &organizationID, &userID, &role, &position, &orgAvatar,
			&canPost, &joinedAt, &isPublic,
			&userName, &userLastName, &userAvatar,
		)
		if err != nil {
			continue
		}

		member := map[string]interface{}{
			"id":              id,
			"organization_id": organizationID,
			"user_id":         userID,
			"role":            role,
			"position":        position.String,
			"org_avatar":      orgAvatar.String,
			"can_post":        canPost,
			"is_public":       isPublic,
			"joined_at":       joinedAt,
			"user_name":       userName + " " + userLastName,
			"user_avatar":     userAvatar.String,
		}

		members = append(members, member)
	}

	c.JSON(200, gin.H{"success": true, "data": members})
}

// ClaimOwnership - заявить о владении организацией
func (h *Handler) ClaimOwnership(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized (missing user_id)"})
		return
	}
	orgID := c.Param("id")

	// Проверяем, есть ли уже владелец
	var ownerExists bool
	checkQuery := `
		SELECT EXISTS(
			SELECT 1 FROM organization_members 
			WHERE organization_id = $1 AND role = 'owner'
		)
	`
	err := h.db.QueryRow(checkQuery, orgID).Scan(&ownerExists)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	if ownerExists {
		c.JSON(400, gin.H{"success": false, "error": "Organization already has an owner"})
		return
	}

	// Добавляем пользователя как владельца
	insertQuery := `
		INSERT INTO organization_members (
			organization_id, user_id, role, position,
			can_post, joined_at
		) VALUES ($1, $2, 'owner', 'Владелец', true, NOW())
	`

	_, err = h.db.Exec(insertQuery, orgID, userID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to claim ownership"})
		return
	}

	// Обновляем owner_user_id в таблице organizations
	updateQuery := `UPDATE organizations SET owner_user_id = $1 WHERE id = $2`
	_, err = h.db.Exec(updateQuery, userID, orgID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to update organization owner"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Ownership claimed successfully"})
}

// TransferOwnership - передача прав владельца организации
func (h *Handler) TransferOwnership(c *gin.Context) {
    // 1. Авторизуем пользователя
    userID, ok := getUserID(c)
    if !ok {
        c.JSON(401, gin.H{"success": false, "error": "Unauthorized (missing user_id)"})
        return
    }

    // 2. Параметры запроса
    orgID := c.Param("id")
    var req struct {
        NewOwnerID int `json:"new_owner_id"`
    }
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"success": false, "error": "Invalid payload: " + err.Error()})
        return
    }

    // 3. Проверяем, что текущий пользователь – владелец
    var curRole string
    err := h.db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, orgID, userID).Scan(&curRole)
    if err != nil || curRole != "owner" {
        c.JSON(403, gin.H{"success": false, "error": "Только владелец может передать права"})
        return
    }

    // 4. Проверяем, что новый владелец уже член организации
    var isMember bool
    err = h.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2)`, orgID, req.NewOwnerID).Scan(&isMember)
    if err != nil || !isMember {
        c.JSON(400, gin.H{"success": false, "error": "Новый владелец не является членом организации"})
        return
    }

    // 5. Транзакция: обновляем роли и owner_user_id
    tx, err := h.db.Begin()
    if err != nil {
        c.JSON(500, gin.H{"success": false, "error": "Failed to start transaction"})
        return
    }
    defer tx.Rollback()

    // 5.1 Сменить роль текущего владельца на admin
    _, err = tx.Exec(`UPDATE organization_members SET role = 'admin' WHERE organization_id = $1 AND user_id = $2`, orgID, userID)
    if err != nil {
        c.JSON(500, gin.H{"success": false, "error": "Failed to demote current owner"})
        return
    }

    // 5.2 Сменить роль нового владельца на owner
    _, err = tx.Exec(`UPDATE organization_members SET role = 'owner' WHERE organization_id = $1 AND user_id = $2`, orgID, req.NewOwnerID)
    if err != nil {
        c.JSON(500, gin.H{"success": false, "error": "Failed to promote new owner"})
        return
    }

    // 5.3 Обновить поле owner_user_id в таблице organizations
    _, err = tx.Exec(`UPDATE organizations SET owner_user_id = $1 WHERE id = $2`, req.NewOwnerID, orgID)
    if err != nil {
        c.JSON(500, gin.H{"success": false, "error": "Failed to update organization owner"})
        return
    }

    // 5.4 Записать в журнал действий (используем правильные названия колонок из таблицы admin_logs)
    _, err = tx.Exec(`INSERT INTO admin_logs (admin_id, target_type, target_id, action_type, created_at) VALUES ($1, 'organization', $2, 'transfer_ownership', NOW())`, userID, orgID)
    if err != nil {
        c.JSON(500, gin.H{"success": false, "error": "Failed to write audit log: " + err.Error()})
        return
    }

    // 6. Коммит
    if err = tx.Commit(); err != nil {
        c.JSON(500, gin.H{"success": false, "error": "Transaction commit failed"})
        return
    }

    c.JSON(200, gin.H{"success": true, "message": "Права успешно переданы"})
}

// Update - обновить профиль организации

// Update - обновить профиль организации
func (h *Handler) Update(c *gin.Context) {
	id := c.Param("id")

	userID, ok := getUserID(c)
	if !ok {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized (missing user_id)"})
		return
	}

	var role string
	err := h.db.QueryRow(`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`, id, userID).Scan(&role)
	if err != nil || (role != "owner" && role != "admin") {
		c.JSON(403, gin.H{"success": false, "error": "Только владельцы или администраторы могут редактировать профиль организации"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid request payload: " + err.Error()})
		return
	}

	// Формируем динамический запрос
	query := "UPDATE organizations SET "
	var args []interface{}
	argID := 1

	for key, value := range req {
		// Защита от изменения служебных полей
		if key == "id" || key == "created_at" || key == "updated_at" || key == "owner_user_id" {
			continue
		}

		if key == "registration_date" && value == "" {
			value = nil
		}

		if argID > 1 {
			query += ", "
		}
		query += key + fmt.Sprintf(" = $%d", argID)
		args = append(args, value)
		argID++
	}

	if len(args) == 0 {
		c.JSON(200, gin.H{"success": true, "message": "Nothing to update"})
		return
	}

	query += fmt.Sprintf(", updated_at = NOW() WHERE id = $%d", argID)
	args = append(args, id)

	_, err = h.db.Exec(query, args...)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Database error: " + err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Организация успешно обновлена"})
}
