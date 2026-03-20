package posts

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	h := &Handler{db: db}
	h.ensurePostsReplyColumns()
	return h
}

func (h *Handler) ensurePostsReplyColumns() {
	queries := []string{
		`ALTER TABLE posts ADD COLUMN IF NOT EXISTS reply_setting VARCHAR(20) DEFAULT 'anyone'`,
		`ALTER TABLE posts ADD COLUMN IF NOT EXISTS verify_replies BOOLEAN DEFAULT false`,
		`UPDATE posts SET reply_setting = 'anyone' WHERE reply_setting IS NULL`,
		`UPDATE posts SET verify_replies = false WHERE verify_replies IS NULL`,
	}

	for _, q := range queries {
		if _, err := h.db.Exec(q); err != nil {
			fmt.Printf("warning: failed to ensure posts reply columns: %v\n", err)
		}
	}
}

// GetPosts - получить список постов с пагинацией
func (h *Handler) GetPosts(c *gin.Context) {
	// Получаем текущего пользователя (если авторизован)
	userIDInterface, hasUser := c.Get("user_id")
	var currentUserID int
	if hasUser {
		currentUserID = userIDInterface.(int)
	} else {
		currentUserID = 0 // Гость
	}

	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil {
			offset = parsed
		}
	}

	query := `
		SELECT 
			p.id, p.author_id, p.content, p.created_at, p.updated_at,
			COALESCE(p.likes_count, 0), COALESCE(p.comments_count, 0), 0 as shares_count,
			u.name, u.last_name, u.avatar, u.verified,
			o.name as org_name, o.logo as org_logo, o.is_verified as org_verified,
			COALESCE(p.media_urls, '[]') as media,
			COALESCE(p.tags, '[]') as tags,
			COALESCE(p.attachments, '[]') as attachments,
			p.author_type,
			p.reply_setting, p.verify_replies,
			COALESCE(
				(
					SELECT json_agg(
						json_build_object(
							'id', pet.id,
							'name', pet.name,
							'species', pet.species,
							'breed', pet.breed,
							'gender', pet.gender,
							'photo', pet.photo_url,
							'color', pet.color,
							'size', pet.size
						)
					)
					FROM pets pet
					WHERE pet.id = ANY(
						CASE 
							WHEN p.attached_pets IS NULL OR p.attached_pets = '' OR p.attached_pets = '[]' THEN ARRAY[]::integer[]
							WHEN jsonb_typeof(p.attached_pets::jsonb) = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(p.attached_pets::jsonb)::integer)
							ELSE ARRAY[]::integer[]
						END
					)
				),
				'[]'
			) as pets_data,
			EXISTS(SELECT 1 FROM polls WHERE post_id = p.id) as has_poll
		FROM posts p
		LEFT JOIN users u ON p.author_type = 'user' AND p.author_id = u.id
		LEFT JOIN organizations o ON p.author_type = 'organization' AND p.author_id = o.id
		WHERE p.is_deleted = false
		ORDER BY p.created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := h.db.Query(query, limit, offset)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	posts := []map[string]interface{}{}

	for rows.Next() {
		var (
			id                                            int
			userID                                        int
			likesCount, commentsCount, sharesCount        sql.NullInt64
			content, createdAt, updatedAt                 sql.NullString
			firstName                                     sql.NullString
			lastName                                      sql.NullString
			avatarURL                                     sql.NullString
			isVerified                                    sql.NullBool
			orgName                                       sql.NullString
			orgLogo                                       sql.NullString
			orgVerified                                   sql.NullBool
			mediaJSON, tagsJSON, attachmentsJSON, petsJSON sql.NullString
			authorType                                    string
			replySetting                                  string
			verifyReplies                                 bool
			hasPoll                                       bool
		)

		err := rows.Scan(
			&id, &userID, &content, &createdAt, &updatedAt,
			&likesCount, &commentsCount, &sharesCount,
			&firstName, &lastName, &avatarURL, &isVerified,
			&orgName, &orgLogo, &orgVerified,
			&mediaJSON, &tagsJSON, &attachmentsJSON,
			&authorType, &replySetting, &verifyReplies, &petsJSON, &hasPoll,
		)
		if err != nil {
			continue
		}

		// Парсим JSON строки в массивы
		var media, tags, attachments, pets interface{}
		json.Unmarshal([]byte(mediaJSON.String), &media)
		json.Unmarshal([]byte(tagsJSON.String), &tags)
		json.Unmarshal([]byte(attachmentsJSON.String), &attachments)
		json.Unmarshal([]byte(petsJSON.String), &pets)

		// Убеждаемся что массивы не nil
		if media == nil {
			media = []interface{}{}
		}
		if tags == nil {
			tags = []interface{}{}
		}
		if attachments == nil {
			attachments = []interface{}{}
		}
		if pets == nil {
			pets = []interface{}{}
		}

		// Проверяем может ли текущий пользователь редактировать пост
		canEdit := (authorType == "user" && userID == currentUserID)

		post := map[string]interface{}{
			"id":             id,
			"user_id":        userID,
			"author_id":      userID,
			"author_type":    authorType,
			"content":        content.String,
			"created_at":     createdAt.String,
			"updated_at":     updatedAt.String,
			"likes_count":    int(likesCount.Int64),
			"comments_count": int(commentsCount.Int64),
			"shares_count":   int(sharesCount.Int64),
			"reply_setting":  replySetting,
			"verify_replies": verifyReplies,
			"can_edit":       canEdit,
			"has_poll":       hasPoll,
		}

		if authorType == "organization" {
			post["organization"] = map[string]interface{}{
				"id":       userID,
				"name":     orgName.String,
				"logo":     orgLogo.String,
				"verified": orgVerified.Bool,
			}
		} else {
			post["user"] = map[string]interface{}{
				"id":          userID,
				"first_name":  firstName.String,
				"last_name":   lastName.String,
				"avatar_url":  avatarURL.String,
				"is_verified": isVerified.Bool,
			}
		}

		post["media"] = media
		post["tags"] = tags
		post["attachments"] = attachments
		post["pets"] = pets

		posts = append(posts, post)
	}

	// Проверяем лайки текущего пользователя для всех постов
	if currentUserID > 0 && len(posts) > 0 {
		postIDs := make([]int, len(posts))
		for i, p := range posts {
			postIDs[i] = p["id"].(int)
		}

		// Получаем все лайки текущего пользователя для этих постов
		likeQuery := `SELECT post_id, reaction_type FROM likes WHERE user_id = $1 AND post_id = ANY($2)`
		likeRows, err := h.db.Query(likeQuery, currentUserID, pq.Array(postIDs))
		if err == nil {
			defer likeRows.Close()
			likedPostReactions := make(map[int]string)
			for likeRows.Next() {
				var postID int
				var reactionType sql.NullString
				if err := likeRows.Scan(&postID, &reactionType); err == nil {
					likedPostReactions[postID] = reactionType.String
				}
			}

			// Добавляем поле liked и reaction_type к каждому посту
			for i := range posts {
				postID := posts[i]["id"].(int)
				if reaction, ok := likedPostReactions[postID]; ok {
					posts[i]["liked"] = true
					posts[i]["user_reaction"] = reaction
				} else {
					posts[i]["liked"] = false
				}
			}
		}
	}

	fmt.Println("--- DEBUG GETPOSTS --- Found rows:", len(posts))
	c.JSON(200, gin.H{"success": true, "data": posts})
}

// GetPostByID - получить один пост по ID
func (h *Handler) GetPostByID(c *gin.Context) {
	postID := c.Param("id")

	// Получаем текущего пользователя (если авторизован)
	currentUserID := 0
	if uid, exists := c.Get("user_id"); exists {
		if id, ok := uid.(int); ok {
			currentUserID = id
		}
	}

	query := `
		SELECT 
			p.id, p.author_id, p.content, p.created_at, p.updated_at,
			COALESCE(p.likes_count, 0), COALESCE(p.comments_count, 0), 0 as shares_count,
			u.name, u.last_name, u.avatar, u.verified,
			o.name as org_name, o.logo as org_logo, o.is_verified as org_verified,
			COALESCE(p.media_urls, '[]') as media,
			COALESCE(p.tags, '[]') as tags,
			COALESCE(p.attachments, '[]') as attachments,
			p.author_type,
			p.reply_setting, p.verify_replies,
			COALESCE(
				(
					SELECT json_agg(
						json_build_object(
							'id', pet.id,
							'name', pet.name,
							'species', pet.species,
							'breed', pet.breed,
							'gender', pet.gender,
							'photo', pet.photo_url,
							'color', pet.color,
							'size', pet.size
						)
					)
					FROM pets pet
					WHERE pet.id = ANY(
						CASE 
							WHEN p.attached_pets IS NULL OR p.attached_pets = '' OR p.attached_pets = '[]' THEN ARRAY[]::integer[]
							WHEN jsonb_typeof(p.attached_pets::jsonb) = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(p.attached_pets::jsonb)::integer)
							ELSE ARRAY[]::integer[]
						END
					)
				),
				'[]'
			) as pets_data,
			EXISTS(SELECT 1 FROM polls WHERE post_id = p.id) as has_poll
		FROM posts p
		LEFT JOIN users u ON p.author_type = 'user' AND p.author_id = u.id
		LEFT JOIN organizations o ON p.author_type = 'organization' AND p.author_id = o.id
		WHERE p.id = $1 AND p.is_deleted = false
	`

	var (
		id                                            int
		userID                                        int
		likesCount, commentsCount, sharesCount        sql.NullInt64
		content, createdAt, updatedAt                 sql.NullString
		firstName                                     sql.NullString
		lastName                                      sql.NullString
		avatarURL                                     sql.NullString
		isVerified                                    sql.NullBool
		orgName                                       sql.NullString
		orgLogo                                       sql.NullString
		orgVerified                                   sql.NullBool
		mediaJSON, tagsJSON, attachmentsJSON, petsJSON sql.NullString
		authorType                                    string
		replySetting                                  string
		verifyReplies                                 bool
		hasPoll                                       bool
	)

	err := h.db.QueryRow(query, postID).Scan(
		&id, &userID, &content, &createdAt, &updatedAt,
		&likesCount, &commentsCount, &sharesCount,
		&firstName, &lastName, &avatarURL, &isVerified,
		&orgName, &orgLogo, &orgVerified,
		&mediaJSON, &tagsJSON, &attachmentsJSON,
		&authorType, &replySetting, &verifyReplies, &petsJSON, &hasPoll,
	)

	if err == sql.ErrNoRows {
		c.JSON(404, gin.H{"success": false, "error": "Post not found"})
		return
	}

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Парсим JSON строки в массивы
	var media, tags, attachments, pets interface{}
	json.Unmarshal([]byte(mediaJSON.String), &media)
	json.Unmarshal([]byte(tagsJSON.String), &tags)
	json.Unmarshal([]byte(attachmentsJSON.String), &attachments)
	json.Unmarshal([]byte(petsJSON.String), &pets)

	// Убеждаемся что массивы не nil
	if media == nil {
		media = []interface{}{}
	}
	if tags == nil {
		tags = []interface{}{}
	}
	if attachments == nil {
		attachments = []interface{}{}
	}
	if pets == nil {
		pets = []interface{}{}
	}

	// Проверяем может ли текущий пользователь редактировать пост
	canEdit := (authorType == "user" && userID == currentUserID)

	// Проверяем лайкнул ли текущий пользователь этот пост
	liked := false
	var userReaction string
	if currentUserID > 0 {
		var likeID int
		var reactionType sql.NullString
		likeQuery := `SELECT id, reaction_type FROM likes WHERE post_id = $1 AND user_id = $2`
		err := h.db.QueryRow(likeQuery, id, currentUserID).Scan(&likeID, &reactionType)
		if err == nil {
			liked = true
			userReaction = reactionType.String
		}
	}

	post := map[string]interface{}{
		"id":             id,
		"user_id":        userID,
		"author_id":      userID,
		"author_type":    authorType,
		"content":        content.String,
		"created_at":     createdAt.String,
		"updated_at":     updatedAt.String,
		"likes_count":    int(likesCount.Int64),
		"liked":          liked,
		"user_reaction":  userReaction,
		"comments_count": int(commentsCount.Int64),
		"shares_count":   int(sharesCount.Int64),
		"reply_setting":  replySetting,
		"verify_replies": verifyReplies,
		"can_edit":       canEdit,
		"has_poll":       hasPoll,
	}

	if authorType == "organization" {
		post["organization"] = map[string]interface{}{
			"id":       userID,
			"name":     orgName.String,
			"logo":     orgLogo.String,
			"verified": orgVerified.Bool,
		}
	} else {
		post["user"] = map[string]interface{}{
			"id":          userID,
			"first_name":  firstName.String,
			"last_name":   lastName.String,
			"avatar_url":  avatarURL.String,
			"is_verified": isVerified.Bool,
		}
	}

	post["media"] = media
	post["tags"] = tags
	post["attachments"] = attachments
	post["pets"] = pets

	c.JSON(200, gin.H{"success": true, "data": post})
}

// GetUserPosts - получить посты конкретного пользователя
func (h *Handler) GetUserPosts(c *gin.Context) {
	userID := c.Param("id")

	// Получаем текущего пользователя (если авторизован)
	currentUserID := 0
	if uid, exists := c.Get("user_id"); exists {
		if id, ok := uid.(int); ok {
			currentUserID = id
		}
	}

	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil {
			offset = parsed
		}
	}

	query := `
		SELECT 
			p.id, p.author_id, p.content, p.created_at, p.updated_at,
			COALESCE(p.likes_count, 0), COALESCE(p.comments_count, 0), 0 as shares_count,
			u.name, u.last_name, u.avatar, u.verified,
			COALESCE(p.media_urls, '[]') as media,
			COALESCE(p.tags, '[]') as tags,
			COALESCE(p.attachments, '[]') as attachments,
			COALESCE(
				(
					SELECT json_agg(
						json_build_object(
							'id', pet.id,
							'name', pet.name,
							'species', pet.species,
							'breed', pet.breed,
							'gender', pet.gender,
							'photo', pet.photo_url,
							'color', pet.color,
							'size', pet.size
						)
					)
					FROM pets pet
					WHERE pet.id = ANY(
						CASE 
							WHEN p.attached_pets IS NULL OR p.attached_pets = '' OR p.attached_pets = '[]' THEN ARRAY[]::integer[]
							WHEN jsonb_typeof(p.attached_pets::jsonb) = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(p.attached_pets::jsonb)::integer)
							ELSE ARRAY[]::integer[]
						END
					)
				),
				'[]'
			) as pets_data,
			p.author_type,
			p.reply_setting, p.verify_replies,
			EXISTS(SELECT 1 FROM polls WHERE post_id = p.id) as has_poll
		FROM posts p
		JOIN users u ON p.author_id = u.id
		WHERE p.author_id = $1 AND p.is_deleted = false AND p.author_type = 'user'
		ORDER BY p.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := h.db.Query(query, userID, limit, offset)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	posts := []map[string]interface{}{}

	for rows.Next() {
		var (
			id, userIDInt, likesCount, commentsCount, sharesCount int
			content, createdAt, updatedAt                         string
			firstName, lastName                                   string
			avatarURL                                             sql.NullString
			isVerified                                            bool
			mediaJSON, tagsJSON, attachmentsJSON, petsJSON        string
			authorType                                            string
			replySetting                                          string
			verifyReplies                                         bool
			hasPoll                                               bool
		)

		err := rows.Scan(
			&id, &userIDInt, &content, &createdAt, &updatedAt,
			&likesCount, &commentsCount, &sharesCount,
			&firstName, &lastName, &avatarURL, &isVerified,
			&mediaJSON, &tagsJSON, &attachmentsJSON, &petsJSON,
			&authorType, &replySetting, &verifyReplies, &hasPoll,
		)
		if err != nil {
			continue
		}

		// Парсим JSON строки в массивы
		var media, tags, attachments, pets interface{}
		json.Unmarshal([]byte(mediaJSON), &media)
		json.Unmarshal([]byte(tagsJSON), &tags)
		json.Unmarshal([]byte(attachmentsJSON), &attachments)
		json.Unmarshal([]byte(petsJSON), &pets)

		// Проверяем может ли текущий пользователь редактировать пост
		canEdit := (authorType == "user" && userIDInt == currentUserID)

		post := map[string]interface{}{
			"id":             id,
			"user_id":        userIDInt,
			"author_id":      userIDInt,
			"author_type":    authorType,
			"content":        content,
			"created_at":     createdAt,
			"updated_at":     updatedAt,
			"likes_count":    likesCount,
			"comments_count": commentsCount,
			"shares_count":   sharesCount,
			"reply_setting":  replySetting,
			"verify_replies": verifyReplies,
			"can_edit":       canEdit,
			"has_poll":       hasPoll,
			"user": map[string]interface{}{
				"id":          userIDInt,
				"first_name":  firstName,
				"last_name":   lastName,
				"avatar_url":  avatarURL.String,
				"is_verified": isVerified,
			},
			"media":       media,
			"tags":        tags,
			"attachments": attachments,
			"pets":        pets,
		}

		posts = append(posts, post)
	}

	// Проверяем лайки текущего пользователя для всех постов
	if currentUserID > 0 && len(posts) > 0 {
		postIDs := make([]int, len(posts))
		for i, p := range posts {
			postIDs[i] = p["id"].(int)
		}

		// Получаем все лайки текущего пользователя для этих постов
		likeQuery := `SELECT post_id, reaction_type FROM likes WHERE user_id = $1 AND post_id = ANY($2)`
		likeRows, err := h.db.Query(likeQuery, currentUserID, pq.Array(postIDs))
		if err == nil {
			defer likeRows.Close()
			likedPostReactions := make(map[int]string)
			for likeRows.Next() {
				var postID int
				var reactionType sql.NullString
				if err := likeRows.Scan(&postID, &reactionType); err == nil {
					likedPostReactions[postID] = reactionType.String
				}
			}

			// Добавляем поле liked и reaction_type к каждому посту
			for i := range posts {
				postID := posts[i]["id"].(int)
				if reaction, ok := likedPostReactions[postID]; ok {
					posts[i]["liked"] = true
					posts[i]["user_reaction"] = reaction
				} else {
					posts[i]["liked"] = false
				}
			}
		}
	}

	c.JSON(200, gin.H{"success": true, "data": posts})
}

// GetLikeStatus - получить статус лайка для поста
func (h *Handler) GetLikeStatus(c *gin.Context) {
	postID := c.Param("id")

	// TODO: получить user_id из токена авторизации
	// Пока возвращаем что не лайкнуто

	// Получаем количество лайков
	var likesCount int
	query := `SELECT COALESCE(likes_count, 0) FROM posts WHERE id = $1 AND is_deleted = false`
	err := h.db.QueryRow(query, postID).Scan(&likesCount)
	if err != nil {
		c.JSON(404, gin.H{"success": false, "error": "Post not found"})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"liked":       false,
			"likes_count": likesCount,
		},
	})
}

// GetPetPosts - получить посты с конкретным питомцем
func (h *Handler) GetPetPosts(c *gin.Context) {
	petID := c.Param("id")

	// Получаем текущего пользователя (если авторизован)
	currentUserID := 0
	if uid, exists := c.Get("user_id"); exists {
		if id, ok := uid.(int); ok {
			currentUserID = id
		}
	}

	query := `
		SELECT 
			p.id, p.author_id, p.content, p.created_at, p.updated_at,
			COALESCE(p.likes_count, 0), COALESCE(p.comments_count, 0), 0 as shares_count,
			u.name, u.last_name, u.avatar, u.verified,
			o.name as org_name, o.logo as org_logo, o.is_verified as org_verified,
			COALESCE(p.media_urls, '[]') as media,
			COALESCE(p.tags, '[]') as tags,
			COALESCE(p.attachments, '[]') as attachments,
			p.author_type,
			COALESCE(
				(
					SELECT json_agg(
						json_build_object(
							'id', pet.id,
							'name', pet.name,
							'species', pet.species,
							'breed', pet.breed,
							'gender', pet.gender,
							'photo', pet.photo_url,
							'color', pet.color,
							'size', pet.size
						)
					)
					FROM pets pet
					WHERE pet.id = ANY(
						CASE 
							WHEN p.attached_pets IS NULL OR p.attached_pets = '' OR p.attached_pets = '[]' THEN ARRAY[]::integer[]
							WHEN jsonb_typeof(p.attached_pets::jsonb) = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(p.attached_pets::jsonb)::integer)
							ELSE ARRAY[]::integer[]
						END
					)
				),
				'[]'
			) as pets_data,
			p.reply_setting, p.verify_replies,
			EXISTS(SELECT 1 FROM polls WHERE post_id = p.id) as has_poll
		FROM posts p
		LEFT JOIN users u ON p.author_type = 'user' AND p.author_id = u.id
		LEFT JOIN organizations o ON p.author_type = 'organization' AND p.author_id = o.id
		WHERE p.is_deleted = false 
			AND p.attached_pets::jsonb @> $1::jsonb
		ORDER BY p.created_at DESC
	`

	// Создаем JSON массив с ID питомца для поиска
	petIDJSON := "[" + petID + "]"

	rows, err := h.db.Query(query, petIDJSON)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	posts := []map[string]interface{}{}

	for rows.Next() {
		var (
			id, userIDInt, likesCount, commentsCount, sharesCount int
			content, createdAt, updatedAt                         string
			firstName                                             sql.NullString
			lastName                                              sql.NullString
			avatarURL                                             sql.NullString
			isVerified                                            sql.NullBool
			orgName                                               sql.NullString
			orgLogo                                               sql.NullString
			orgVerified                                           sql.NullBool
			mediaJSON, tagsJSON, attachmentsJSON, petsJSON        string
			authorType                                            string
			replySetting                                          string
			verifyReplies                                         bool
			hasPoll                                               bool
		)

		err := rows.Scan(
			&id, &userIDInt, &content, &createdAt, &updatedAt,
			&likesCount, &commentsCount, &sharesCount,
			&firstName, &lastName, &avatarURL, &isVerified,
			&orgName, &orgLogo, &orgVerified,
			&mediaJSON, &tagsJSON, &attachmentsJSON,
			&authorType, &petsJSON, &replySetting, &verifyReplies, &hasPoll,
		)
		if err != nil {
			continue
		}

		// Парсим JSON строки в массивы
		var media, tags, attachments, pets interface{}
		json.Unmarshal([]byte(mediaJSON), &media)
		json.Unmarshal([]byte(tagsJSON), &tags)
		json.Unmarshal([]byte(attachmentsJSON), &attachments)
		json.Unmarshal([]byte(petsJSON), &pets)

		// Проверяем может ли текущий пользователь редактировать пост
		canEdit := (authorType == "user" && userIDInt == currentUserID)

		post := map[string]interface{}{
			"id":             id,
			"user_id":        userIDInt,
			"author_id":      userIDInt,
			"author_type":    authorType,
			"content":        content,
			"created_at":     createdAt,
			"updated_at":     updatedAt,
			"likes_count":    likesCount,
			"comments_count": commentsCount,
			"shares_count":   sharesCount,
			"reply_setting":  replySetting,
			"verify_replies": verifyReplies,
			"can_edit":       canEdit,
			"has_poll":       hasPoll,
		}

		if authorType == "organization" {
			post["organization"] = map[string]interface{}{
				"id":       userIDInt,
				"name":     orgName.String,
				"logo":     orgLogo.String,
				"verified": orgVerified.Bool,
			}
		} else {
			post["user"] = map[string]interface{}{
				"id":          userIDInt,
				"first_name":  firstName.String,
				"last_name":   lastName.String,
				"avatar_url":  avatarURL.String,
				"is_verified": isVerified.Bool,
			}
		}

		post["media"] = media
		post["tags"] = tags
		post["attachments"] = attachments
		post["pets"] = pets

		posts = append(posts, post)
	}

	// Проверяем лайки текущего пользователя для всех постов
	if currentUserID > 0 && len(posts) > 0 {
		postIDs := make([]int, len(posts))
		for i, p := range posts {
			postIDs[i] = p["id"].(int)
		}

		// Получаем все лайки текущего пользователя для этих постов
		likeQuery := `SELECT post_id, reaction_type FROM likes WHERE user_id = $1 AND post_id = ANY($2)`
		likeRows, err := h.db.Query(likeQuery, currentUserID, pq.Array(postIDs))
		if err == nil {
			defer likeRows.Close()
			likedPostReactions := make(map[int]string)
			for likeRows.Next() {
				var postID int
				var reactionType sql.NullString
				if err := likeRows.Scan(&postID, &reactionType); err == nil {
					likedPostReactions[postID] = reactionType.String
				}
			}

			// Добавляем поле liked и reaction_type к каждому посту
			for i := range posts {
				postID := posts[i]["id"].(int)
				if reaction, ok := likedPostReactions[postID]; ok {
					posts[i]["liked"] = true
					posts[i]["user_reaction"] = reaction
				} else {
					posts[i]["liked"] = false
				}
			}
		}
	}

	c.JSON(200, gin.H{"success": true, "data": posts})
}

// ToggleLike - поставить/убрать лайк на пост
func (h *Handler) ToggleLike(c *gin.Context) {
	postID := c.Param("id")

	var req struct {
		ReactionType string `json:"reaction_type"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		req.ReactionType = "like" // default fallback
	}
	if req.ReactionType == "" {
		req.ReactionType = "like"
	}

	// Получаем текущего пользователя из контекста (установлено middleware)
	userIDInterface, hasUser := c.Get("user_id")
	if !hasUser {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	// Начинаем транзакцию
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Проверяем существует ли лайк и какая у него реакция
	var existingLikeID int
	var existingReactionType string
	checkQuery := `SELECT id, reaction_type FROM likes WHERE post_id = $1 AND user_id = $2 FOR UPDATE`
	err = tx.QueryRow(checkQuery, postID, userID).Scan(&existingLikeID, &existingReactionType)

	var liked bool
	var likesCount int
	var currentReaction string

	var isNewLike bool

	if err == sql.ErrNoRows {
		// Лайка нет - создаем
		insertQuery := `INSERT INTO likes (post_id, user_id, reaction_type) VALUES ($1, $2, $3)`
		_, err = tx.Exec(insertQuery, postID, userID, req.ReactionType)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Failed to create like"})
			return
		}

		// Увеличиваем счетчик лайков
		updateQuery := `UPDATE posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = $1 RETURNING likes_count`
		err = tx.QueryRow(updateQuery, postID).Scan(&likesCount)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Failed to update likes count"})
			return
		}

		liked = true
		currentReaction = req.ReactionType
		isNewLike = true
	} else if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Database error"})
		return
	} else {
		// Лайк есть. Проверяем совпадает ли реакция
		if existingReactionType == req.ReactionType {
			// Реакция такая же - удаляем (снимаем лайк)
			deleteQuery := `DELETE FROM likes WHERE id = $1`
			_, err = tx.Exec(deleteQuery, existingLikeID)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Failed to delete like"})
				return
			}

			// Уменьшаем счетчик лайков
			updateQuery := `UPDATE posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = $1 RETURNING likes_count`
			err = tx.QueryRow(updateQuery, postID).Scan(&likesCount)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Failed to update likes count"})
				return
			}

			liked = false
			currentReaction = ""
		} else {
			// Реакция другая - обновляем тип реакции без изменения счетчика
			updateReactionQuery := `UPDATE likes SET reaction_type = $1 WHERE id = $2`
			_, err = tx.Exec(updateReactionQuery, req.ReactionType, existingLikeID)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Failed to update reaction type"})
				return
			}

			// Получаем текущий счетчик
			err = tx.QueryRow(`SELECT likes_count FROM posts WHERE id = $1`, postID).Scan(&likesCount)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Failed to get likes count"})
				return
			}

			liked = true
			currentReaction = req.ReactionType
		}
	}

	// Коммитим транзакцию
	if err := tx.Commit(); err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to commit transaction"})
		return
	}

	// Отправляем уведомление автору поста
	if isNewLike {
		var postAuthorID int
		err := h.db.QueryRow(`SELECT author_id FROM posts WHERE id = $1 AND author_type = 'user'`, postID).Scan(&postAuthorID)
		if err == nil && postAuthorID != userID {
			_, _ = h.db.Exec(`
				INSERT INTO notifications (user_id, actor_id, type, message, is_read, created_at, updated_at)
				VALUES ($1, $2, 'like', 'оценил(а) вашу запись', false, NOW(), NOW())
			`, postAuthorID, userID)
		}
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"liked":         liked,
			"likes_count":   likesCount,
			"reaction_type": currentReaction,
		},
	})
}

// GetLikers - получить список пользователей, лайкнувших пост
func (h *Handler) GetLikers(c *gin.Context) {
	postID := c.Param("id")

	query := `
		SELECT 
			u.id, u.name, u.last_name, u.avatar, l.reaction_type
		FROM likes l
		JOIN users u ON l.user_id = u.id
		WHERE l.post_id = $1
		ORDER BY l.created_at DESC
	`

	rows, err := h.db.Query(query, postID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to get likers"})
		return
	}
	defer rows.Close()

	likers := []map[string]interface{}{}
	for rows.Next() {
		var (
			id           int
			firstName    string
			lastName     sql.NullString
			avatarURL    sql.NullString
			reactionType sql.NullString
		)

		err := rows.Scan(&id, &firstName, &lastName, &avatarURL, &reactionType)
		if err != nil {
			continue
		}

		liker := map[string]interface{}{
			"id":            id,
			"first_name":    firstName,
			"last_name":     lastName.String,
			"avatar_url":    avatarURL.String,
			"reaction_type": reactionType.String,
		}

		likers = append(likers, liker)
	}

	c.JSON(200, gin.H{"success": true, "data": likers})
}

// CreatePost - создать новый пост
func (h *Handler) CreatePost(c *gin.Context) {
	userIDInterface, hasUser := c.Get("user_id")
	if !hasUser {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	var req struct {
		Content        string                   `json:"content"`
		AttachedPets   []int                    `json:"attached_pets"`
		Attachments    []map[string]interface{} `json:"attachments"`
		Tags           []string                 `json:"tags"`
		LocationLat    *float64                 `json:"location_lat"`
		LocationLon    *float64                 `json:"location_lon"`
		LocationName   *string                  `json:"location_name"`
		AuthorType     string                   `json:"author_type"`
		OrganizationID *int                     `json:"organization_id"`
		Status         string                   `json:"status"`
		ScheduledAt    *string                  `json:"scheduled_at"`
		ReplySetting   string                   `json:"reply_setting"`
		VerifyReplies  bool                     `json:"verify_replies"`
		Poll           *map[string]interface{}  `json:"poll"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	// Устанавливаем значения по умолчанию
	if req.AuthorType == "" {
		req.AuthorType = "user"
	}
	if req.Status == "" {
		req.Status = "published"
	}
	if req.ReplySetting == "" {
		req.ReplySetting = "anyone"
	}

	// Конвертируем массивы в JSON
	attachedPetsJSON, _ := json.Marshal(req.AttachedPets)
	attachmentsJSON, _ := json.Marshal(req.Attachments)
	tagsJSON, _ := json.Marshal(req.Tags)

	// Определяем author_id в зависимости от author_type
	authorID := userID
	if req.AuthorType == "organization" && req.OrganizationID != nil {
		authorID = *req.OrganizationID
	}

	query := `
		INSERT INTO posts (
			author_id, author_type, content, 
			attached_pets, attachments, tags,
			location_lat, location_lon, location_name,
			status, scheduled_at, reply_setting, verify_replies,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, 
			$4, $5, $6,
			$7, $8, $9,
			$10, $11, $12, $13,
			NOW(), NOW()
		) RETURNING id, created_at, updated_at
	`

	var postID int
	var createdAt, updatedAt string
	err := h.db.QueryRow(
		query,
		authorID, req.AuthorType, req.Content,
		attachedPetsJSON, attachmentsJSON, tagsJSON,
		req.LocationLat, req.LocationLon, req.LocationName,
		req.Status, req.ScheduledAt, req.ReplySetting, req.VerifyReplies,
	).Scan(&postID, &createdAt, &updatedAt)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to create post: " + err.Error()})
		return
	}

	// Если есть опрос, создаем его
	if req.Poll != nil {
		question := (*req.Poll)["question"].(string)
		options := (*req.Poll)["options"].([]interface{})
		multipleChoice := false
		if mc, ok := (*req.Poll)["multiple_choice"].(bool); ok {
			multipleChoice = mc
		}
		allowVoteChanges := true
		if avc, ok := (*req.Poll)["allow_vote_changes"].(bool); ok {
			allowVoteChanges = avc
		}
		isAnonymous := false
		if ia, ok := (*req.Poll)["is_anonymous"].(bool); ok {
			isAnonymous = ia
		}

		// Создаем опрос
		var pollID int
		pollQuery := `
			INSERT INTO polls (post_id, question, multiple_choice, allow_vote_changes, is_anonymous, created_at)
			VALUES ($1, $2, $3, $4, $5, NOW())
			RETURNING id
		`
		err = h.db.QueryRow(pollQuery, postID, question, multipleChoice, allowVoteChanges, isAnonymous).Scan(&pollID)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Failed to create poll: " + err.Error()})
			return
		}

		// Создаем варианты ответов
		for i, opt := range options {
			optText := opt.(string)
			_, err = h.db.Exec(`
				INSERT INTO poll_options (poll_id, option_text, option_order)
				VALUES ($1, $2, $3)
			`, pollID, optText, i)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Failed to create poll option: " + err.Error()})
				return
			}
		}
	}

	c.JSON(201, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"id":         postID,
			"created_at": createdAt,
			"updated_at": updatedAt,
		},
	})
}

// UpdatePost - обновить пост
func (h *Handler) UpdatePost(c *gin.Context) {
	postID := c.Param("id")
	userIDInterface, hasUser := c.Get("user_id")
	if !hasUser {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	var req struct {
		Content        *string                   `json:"content"`
		AttachedPets   *[]int                    `json:"attached_pets"`
		Attachments    *[]map[string]interface{} `json:"attachments"`
		Tags           *[]string                 `json:"tags"`
		LocationLat    *float64                  `json:"location_lat"`
		LocationLon    *float64                  `json:"location_lon"`
		LocationName   *string                   `json:"location_name"`
		AuthorType     *string                   `json:"author_type"`
		OrganizationID *int                      `json:"organization_id"`
		Status         *string                   `json:"status"`
		ScheduledAt    *string                   `json:"scheduled_at"`
		ReplySetting   *string                   `json:"reply_setting"`
		VerifyReplies  *bool                     `json:"verify_replies"`
		Poll           *map[string]interface{}   `json:"poll"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	// Проверяем что пост принадлежит пользователю
	var authorID int
	checkQuery := `SELECT author_id FROM posts WHERE id = $1 AND is_deleted = false`
	err := h.db.QueryRow(checkQuery, postID).Scan(&authorID)
	if err != nil {
		c.JSON(404, gin.H{"success": false, "error": "Post not found"})
		return
	}

	if authorID != userID {
		c.JSON(403, gin.H{"success": false, "error": "Forbidden"})
		return
	}

	// Обновляем только переданные поля
	updateQuery := `UPDATE posts SET updated_at = NOW()`
	args := []interface{}{}
	argIndex := 1

	if req.Content != nil {
		updateQuery += `, content = $` + strconv.Itoa(argIndex)
		args = append(args, *req.Content)
		argIndex++
	}

	if req.AttachedPets != nil {
		petsJSON, _ := json.Marshal(*req.AttachedPets)
		updateQuery += `, attached_pets = $` + strconv.Itoa(argIndex)
		args = append(args, petsJSON)
		argIndex++
	}

	if req.Attachments != nil {
		attachJSON, _ := json.Marshal(*req.Attachments)
		updateQuery += `, attachments = $` + strconv.Itoa(argIndex)
		args = append(args, attachJSON)
		argIndex++
	}

	if req.Tags != nil {
		tagsJSON, _ := json.Marshal(*req.Tags)
		updateQuery += `, tags = $` + strconv.Itoa(argIndex)
		args = append(args, tagsJSON)
		argIndex++
	}

	if req.LocationLat != nil {
		updateQuery += `, location_lat = $` + strconv.Itoa(argIndex)
		args = append(args, *req.LocationLat)
		argIndex++
	}

	if req.LocationLon != nil {
		updateQuery += `, location_lon = $` + strconv.Itoa(argIndex)
		args = append(args, *req.LocationLon)
		argIndex++
	}

	if req.LocationName != nil {
		updateQuery += `, location_name = $` + strconv.Itoa(argIndex)
		args = append(args, *req.LocationName)
		argIndex++
	}

	if req.Status != nil {
		updateQuery += `, status = $` + strconv.Itoa(argIndex)
		args = append(args, *req.Status)
		argIndex++
	}

	if req.ScheduledAt != nil {
		updateQuery += `, scheduled_at = $` + strconv.Itoa(argIndex)
		args = append(args, *req.ScheduledAt)
		argIndex++
	}

	if req.ReplySetting != nil {
		updateQuery += `, reply_setting = $` + strconv.Itoa(argIndex)
		args = append(args, *req.ReplySetting)
		argIndex++
	}

	if req.VerifyReplies != nil {
		updateQuery += `, verify_replies = $` + strconv.Itoa(argIndex)
		args = append(args, *req.VerifyReplies)
		argIndex++
	}

	updateQuery += ` WHERE id = $` + strconv.Itoa(argIndex) + ` RETURNING updated_at`
	args = append(args, postID)

	var updatedAt string
	err = h.db.QueryRow(updateQuery, args...).Scan(&updatedAt)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to update post: " + err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"id":         postID,
			"updated_at": updatedAt,
		},
	})
}

// DeletePost - удалить пост (мягкое удаление)
func (h *Handler) DeletePost(c *gin.Context) {
	postID := c.Param("id")
	userIDInterface, hasUser := c.Get("user_id")
	if !hasUser {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	// Проверяем что пост принадлежит пользователю
	var authorID int
	checkQuery := `SELECT author_id FROM posts WHERE id = $1 AND is_deleted = false`
	err := h.db.QueryRow(checkQuery, postID).Scan(&authorID)
	if err != nil {
		c.JSON(404, gin.H{"success": false, "error": "Post not found"})
		return
	}

	if authorID != userID {
		c.JSON(403, gin.H{"success": false, "error": "Forbidden"})
		return
	}

	// Мягкое удаление
	deleteQuery := `UPDATE posts SET is_deleted = true, updated_at = NOW() WHERE id = $1`
	_, err = h.db.Exec(deleteQuery, postID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to delete post"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Post deleted"})
}

// GetOrganizationPosts - получить посты организации
func (h *Handler) GetOrganizationPosts(c *gin.Context) {
	orgID := c.Param("id")

	// Получаем текущего пользователя (если авторизован)
	currentUserID := 0
	if uid, exists := c.Get("user_id"); exists {
		if id, ok := uid.(int); ok {
			currentUserID = id
		}
	}
	if currentUserID == 0 {
		currentUserID = 1
	}

	query := `
		SELECT 
			p.id, p.author_id, p.content, p.created_at, p.updated_at,
			COALESCE(p.likes_count, 0), COALESCE(p.comments_count, 0), 0 as shares_count,
			o.name as org_name, o.logo as org_logo, o.is_verified as org_verified,
			COALESCE(p.media_urls, '[]') as media,
			COALESCE(p.tags, '[]') as tags,
			COALESCE(p.attachments, '[]') as attachments,
			p.author_type,
			COALESCE(
				(
					SELECT json_agg(
						json_build_object(
							'id', pet.id,
							'name', pet.name,
							'species', pet.species,
							'breed', pet.breed,
							'gender', pet.gender,
							'photo', pet.photo_url,
							'color', pet.color,
							'size', pet.size
						)
					)
					FROM pets pet
					WHERE pet.id = ANY(
						CASE 
							WHEN p.attached_pets IS NULL OR p.attached_pets = '' OR p.attached_pets = '[]' THEN ARRAY[]::integer[]
							WHEN jsonb_typeof(p.attached_pets::jsonb) = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(p.attached_pets::jsonb)::integer)
							ELSE ARRAY[]::integer[]
						END
					)
				),
				'[]'
			) as pets_data,
			p.reply_setting, p.verify_replies,
			EXISTS(SELECT 1 FROM polls WHERE post_id = p.id) as has_poll
		FROM posts p
		JOIN organizations o ON p.author_id = o.id
		WHERE p.is_deleted = false 
			AND p.author_type = 'organization'
			AND p.author_id = $1
		ORDER BY p.created_at DESC
	`

	rows, err := h.db.Query(query, orgID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	posts := []map[string]interface{}{}

	for rows.Next() {
		var (
			id, orgIDInt, likesCount, commentsCount, sharesCount int
			content, createdAt, updatedAt                        string
			orgName                                              string
			orgLogo                                              sql.NullString
			orgVerified                                          bool
			mediaJSON, tagsJSON, attachmentsJSON, petsJSON       string
			authorType                                           string
			replySetting                                         string
			verifyReplies                                        bool
			hasPoll                                              bool
		)

		err := rows.Scan(
			&id, &orgIDInt, &content, &createdAt, &updatedAt,
			&likesCount, &commentsCount, &sharesCount,
			&orgName, &orgLogo, &orgVerified,
			&mediaJSON, &tagsJSON, &attachmentsJSON,
			&authorType, &petsJSON, &replySetting, &verifyReplies, &hasPoll,
		)
		if err != nil {
			continue
		}

		// Парсим JSON строки в массивы
		var media, tags, attachments, pets interface{}
		json.Unmarshal([]byte(mediaJSON), &media)
		json.Unmarshal([]byte(tagsJSON), &tags)
		json.Unmarshal([]byte(attachmentsJSON), &attachments)
		json.Unmarshal([]byte(petsJSON), &pets)

		// Проверяем лайкнул ли текущий пользователь этот пост
		var liked bool
		likeQuery := `SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2)`
		h.db.QueryRow(likeQuery, id, currentUserID).Scan(&liked)

		post := map[string]interface{}{
			"id":             id,
			"author_id":      orgIDInt,
			"author_type":    authorType,
			"content":        content,
			"created_at":     createdAt,
			"updated_at":     updatedAt,
			"likes_count":    likesCount,
			"comments_count": commentsCount,
			"shares_count":   sharesCount,
			"liked":          liked,
			"reply_setting":  replySetting,
			"verify_replies": verifyReplies,
			"can_edit":       false,
			"has_poll":       hasPoll,
			"organization": map[string]interface{}{
				"id":       orgIDInt,
				"name":     orgName,
				"logo":     orgLogo.String,
				"verified": orgVerified,
			},
			"media":       media,
			"tags":        tags,
			"attachments": attachments,
			"pets":        pets,
		}

		posts = append(posts, post)
	}

	c.JSON(200, gin.H{"success": true, "data": posts})
}
