package users

import (
	"database/sql"
	"fmt"
	"github.com/gin-gonic/gin"
)

type OnboardingTask struct {
	ID          string `json:"id"`
	Category    string `json:"category"`
	Title       string `json:"title"`
	Description string `json:"description"`
	IsCompleted bool   `json:"is_completed"`
}

type MiniPet struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	PhotoURL string `json:"photo_url"`
	Species  string `json:"species"`
}

type OnboardingProgress struct {
	Tasks            []OnboardingTask `json:"tasks"`
	ProgressPercent  int              `json:"progress_percent"`
	PetsCount        int              `json:"pets_count"`
	CuratedPetsCount int              `json:"curated_pets_count"`
	OwnerPets        []MiniPet        `json:"owner_pets"`
	CuratedPets      []MiniPet        `json:"curated_pets"`
	HasReviewed      bool             `json:"has_reviewed"`
}

type ReviewRequest struct {
	Rating           int    `json:"rating" binding:"required,min=1,max=10"`
	LikedText        string `json:"liked_text"`
	DislikedText     string `json:"disliked_text"`
	ImprovementsText string `json:"improvements_text"`
}

func (h *Handler) GetOnboardingProgress(c *gin.Context) {
	// Получаем ID пользователя
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	// Запросы
	// 0. Проверка отзыва
	var hasReviewed bool
	h.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM platform_reviews WHERE user_id = $1)`, userID).Scan(&hasReviewed)

	// 1. Извлекаем детали пользователя (аватар, био, телефон, фамилия, соцсети)
	var avatar, bio, phone, lastName, vkID, okID, mailruID sql.NullString
	err := h.db.QueryRow(`
		SELECT avatar, bio, phone, last_name, vk_id::text, ok_id, mailru_id
		FROM users WHERE id = $1
	`, userID).Scan(&avatar, &bio, &phone, &lastName, &vkID, &okID, &mailruID)
	
	hasAvatar := err == nil && avatar.Valid && avatar.String != ""
	hasBio := err == nil && bio.Valid && bio.String != ""
	hasPhone := err == nil && phone.Valid && phone.String != ""
	hasLastName := err == nil && lastName.Valid && lastName.String != ""
	hasSocial := err == nil && ((vkID.Valid && vkID.String != "") || (okID.Valid && okID.String != "") || (mailruID.Valid && mailruID.String != ""))

	// 2. Проверка наличия питомца (свои)
	var petsCount int
	err = h.db.QueryRow(`SELECT count(*) FROM pets WHERE user_id = $1 AND relationship = 'owner'`, userID).Scan(&petsCount)
	if err != nil {
		petsCount = 0
	}
	var ownerPets []MiniPet
	if petsCount > 0 {
		rowsOwner, _ := h.db.Query(`SELECT id, name, COALESCE(photo_url, ''), species FROM pets WHERE user_id = $1 AND relationship = 'owner' LIMIT 5`, userID)
		for rowsOwner.Next() {
			var p MiniPet
			if err := rowsOwner.Scan(&p.ID, &p.Name, &p.PhotoURL, &p.Species); err == nil {
				ownerPets = append(ownerPets, p)
			}
		}
		rowsOwner.Close()
	}

	// 2.1 Проверка кураторства (подопечные)
	var curatedPetsCount int
	err = h.db.QueryRow(`SELECT count(*) FROM pets WHERE (user_id = $1 AND relationship = 'curator') OR curator_id = $1`, userID).Scan(&curatedPetsCount)
	if err != nil {
		curatedPetsCount = 0
	}
	var curatedPets []MiniPet
	if curatedPetsCount > 0 {
		rowsCurator, _ := h.db.Query(`SELECT id, name, COALESCE(photo_url, ''), species FROM pets WHERE (user_id = $1 AND relationship = 'curator') OR curator_id = $1 LIMIT 5`, userID)
		for rowsCurator.Next() {
			var p MiniPet
			if err := rowsCurator.Scan(&p.ID, &p.Name, &p.PhotoURL, &p.Species); err == nil {
				curatedPets = append(curatedPets, p)
			}
		}
		rowsCurator.Close()
	}

	// 3. Проверка написания поста
	var postsCount int
	err = h.db.QueryRow(`SELECT count(*) FROM posts WHERE author_id = $1 AND author_type = 'user' AND is_deleted = false`, userID).Scan(&postsCount)
	if err != nil {
		postsCount = 0
	}

	// 4. Проверка лайков
	var likesCount int
	err = h.db.QueryRow(`SELECT count(*) FROM likes WHERE user_id = $1`, userID).Scan(&likesCount)
	if err != nil {
		likesCount = 0
	}

	// 5. Проверка комментариев
	var commentsCount int
	err = h.db.QueryRow(`SELECT count(*) FROM comments WHERE user_id = $1`, userID).Scan(&commentsCount)
	if err != nil {
		commentsCount = 0
	}

	// ----------------------------------------------------
	// ХАК напрямую для ТЕСТИРОВАНИЯ (ID 58) 
	// ----------------------------------------------------
	var isShareCompleted = false
	if userID_str, _ := c.Get("user_id"); userID_str == 58 || userID_str == "58" || userID_str == float64(58) || fmt.Sprint(userID_str) == "58" {
		hasAvatar = true
		hasBio = true
		hasPhone = true
		hasLastName = true
		hasSocial = true
		postsCount = 1
		likesCount = 1
		commentsCount = 1
		isShareCompleted = true
	}
	// ----------------------------------------------------

	// Формируем список заданий
	tasks := []OnboardingTask{
		{
			ID:          "avatar",
			Category:    "Профиль",
			Title:       "Добавить фото профиля",
			Description: "Загрузите аватарку, чтобы вас узнавали",
			IsCompleted: hasAvatar,
		},
		{
			ID:          "last_name",
			Category:    "Профиль",
			Title:       "Указать фамилию",
			Description: "Поможет друзьям быстрее найти вас",
			IsCompleted: hasLastName,
		},
		{
			ID:          "phone",
			Category:    "Профиль",
			Title:       "Добавить телефон",
			Description: "Необходим для связи при откликах",
			IsCompleted: hasPhone,
		},
		{
			ID:          "bio",
			Category:    "Профиль",
			Title:       "Рассказать о себе",
			Description: "Напишите пару слов о вашем опыте с животными",
			IsCompleted: hasBio,
		},
		{
			ID:          "social",
			Category:    "Профиль",
			Title:       "Привязать соцсеть",
			Description: "Свяжите аккаунт с VK, OK или Mail.ru",
			IsCompleted: hasSocial,
		},
		{
			ID:          "post",
			Category:    "Активность",
			Title:       "Написать пост",
			Description: "Поделитесь историей в общей ленте",
			IsCompleted: postsCount > 0,
		},
		{
			ID:          "like",
			Category:    "Активность",
			Title:       "Оценить запись",
			Description: "Поставьте лайк понравившемуся посту",
			IsCompleted: likesCount > 0,
		},
		{
			ID:          "comment",
			Category:    "Активность",
			Title:       "Написать комментарий",
			Description: "Оставьте свое мнение под любым постом",
			IsCompleted: commentsCount > 0,
		},
		{
			ID:          "share",
			Category:    "Активность",
			Title:       "Поделиться постом",
			Description: "Сделайте репост на свою страницу или друзьям",
			IsCompleted: isShareCompleted, // Репосты отслеживаем локально на фронтенде
		},
	}

	// Считаем прогресс
	completedCount := 0
	for _, t := range tasks {
		if t.IsCompleted {
			completedCount++
		}
	}
	progressPercent := 0
	if len(tasks) > 0 {
		progressPercent = (completedCount * 100) / len(tasks)
	}

	result := OnboardingProgress{
		Tasks:            tasks,
		ProgressPercent:  progressPercent,
		PetsCount:        petsCount,
		CuratedPetsCount: curatedPetsCount,
		OwnerPets:        ownerPets,
		CuratedPets:      curatedPets,
		HasReviewed:      hasReviewed,
	}

	c.JSON(200, gin.H{"success": true, "data": result})
}

func (h *Handler) SubmitOnboardingReview(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}

	var req ReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": err.Error()})
		return
	}

	_, err := h.db.Exec(`
		INSERT INTO platform_reviews (user_id, rating, liked_text, disliked_text, improvements_text)
		VALUES ($1, $2, $3, $4, $5)
	`, userID, req.Rating, req.LikedText, req.DislikedText, req.ImprovementsText)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to save review"})
		return
	}

	c.JSON(200, gin.H{"success": true})
}

type AdminReviewResponse struct {
	ID               int       `json:"id"`
	UserID           int       `json:"user_id"`
	UserFirstName    string    `json:"user_first_name"`
	UserLastName     string    `json:"user_last_name"`
	UserAvatar       string    `json:"user_avatar"`
	Rating           int       `json:"rating"`
	LikedText        string    `json:"liked_text"`
	DislikedText     string    `json:"disliked_text"`
	ImprovementsText string    `json:"improvements_text"`
	CreatedAt        string    `json:"created_at"`
}

type AdminReviewStats struct {
	TotalReviews  int                   `json:"total_reviews"`
	AverageRating float64               `json:"average_rating"`
	Reviews       []AdminReviewResponse `json:"reviews"`
}

func (h *Handler) GetReviewsAdmin(c *gin.Context) {
	var stats AdminReviewStats
	stats.Reviews = []AdminReviewResponse{} // Initialize to empty array instead of null

	// Считаем агрегированные данные
	err := h.db.QueryRow(`
		SELECT COUNT(*), COALESCE(AVG(rating), 0.0) 
		FROM platform_reviews
	`).Scan(&stats.TotalReviews, &stats.AverageRating)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Database error while fetching review stats"})
		return
	}

	// Извлекаем все отзывы
	rows, err := h.db.Query(`
		SELECT 
			r.id, r.user_id, COALESCE(u.first_name, ''), COALESCE(u.last_name, ''), COALESCE(u.avatar, ''),
			r.rating, COALESCE(r.liked_text, ''), COALESCE(r.disliked_text, ''), COALESCE(r.improvements_text, ''), 
			r.created_at
		FROM platform_reviews r
		LEFT JOIN users u ON u.id = r.user_id
		ORDER BY r.created_at DESC
	`)
	
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var rResp AdminReviewResponse
			var cTime sql.NullTime
			if err := rows.Scan(&rResp.ID, &rResp.UserID, &rResp.UserFirstName, &rResp.UserLastName, &rResp.UserAvatar,
				&rResp.Rating, &rResp.LikedText, &rResp.DislikedText, &rResp.ImprovementsText, &cTime); err == nil {
				if cTime.Valid {
					rResp.CreatedAt = cTime.Time.Format("2006-01-02T15:04:05Z07:00")
				}
				stats.Reviews = append(stats.Reviews, rResp)
			}
		}
	}

	c.JSON(200, gin.H{"success": true, "data": stats})
}
