package search

import (
	"database/sql"
	"encoding/json"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// Search - глобальный поиск по пользователям, питомцам и постам
func (h *Handler) Search(c *gin.Context) {
	query := c.Query("q")
	query = strings.TrimSpace(query)

	if query == "" {
		c.JSON(400, gin.H{"success": false, "error": "Query parameter 'q' is required"})
		return
	}

	searchPattern := "%" + query + "%"

	// 1. Поиск пользователей
	users := []map[string]interface{}{}
	usersQuery := `
		SELECT id, name, last_name, avatar, verified
		FROM users
		WHERE name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1
		LIMIT 10
	`
	userRows, err := h.db.Query(usersQuery, searchPattern)
	if err == nil {
		defer userRows.Close()
		for userRows.Next() {
			var id int
			var name, lastName, avatar sql.NullString
			var verified bool

			if err := userRows.Scan(&id, &name, &lastName, &avatar, &verified); err == nil {
				user := map[string]interface{}{
					"id":          id,
					"first_name":  name.String,
					"last_name":   lastName.String,
					"avatar_url":  avatar.String,
					"is_verified": verified,
				}
				users = append(users, user)
			}
		}
	}

	// 2. Поиск питомцев
	pets := []map[string]interface{}{}
	petsQuery := `
		SELECT 
			p.id, p.name, p.species, p.breed, p.gender, p.photo_url, 
			p.color, p.size, u.name as owner_name, u.last_name as owner_last_name
		FROM pets p
		LEFT JOIN users u ON p.owner_id = u.id
		WHERE p.name ILIKE $1 OR p.breed ILIKE $1 OR p.species ILIKE $1
		LIMIT 10
	`
	petRows, err := h.db.Query(petsQuery, searchPattern)
	if err == nil {
		defer petRows.Close()
		for petRows.Next() {
			var id int
			var name, species, breed, gender, photoURL, color, size sql.NullString
			var ownerName, ownerLastName sql.NullString

			if err := petRows.Scan(&id, &name, &species, &breed, &gender, &photoURL, &color, &size, &ownerName, &ownerLastName); err == nil {
				pet := map[string]interface{}{
					"id":        id,
					"name":      name.String,
					"species":   species.String,
					"breed":     breed.String,
					"gender":    gender.String,
					"photo_url": photoURL.String,
					"color":     color.String,
					"size":      size.String,
					"owner": map[string]interface{}{
						"first_name": ownerName.String,
						"last_name":  ownerLastName.String,
					},
				}
				pets = append(pets, pet)
			}
		}
	}

	// 3. Поиск постов 
	// (взято с учетом текущего формата постов)
	posts := []map[string]interface{}{}
	postsQuery := `
		SELECT 
			p.id, p.author_id, p.content, p.created_at, p.updated_at,
			COALESCE(p.likes_count, 0), COALESCE(p.comments_count, 0),
			u.name, u.last_name, u.avatar, u.verified,
			COALESCE(p.media_urls, '[]') as media,
			COALESCE(p.tags, '[]') as tags,
			p.author_type
		FROM posts p
		JOIN users u ON p.author_id = u.id
		WHERE p.is_deleted = false AND p.content ILIKE $1
		ORDER BY p.created_at DESC
		LIMIT 15
	`
	postRows, err := h.db.Query(postsQuery, searchPattern)
	if err == nil {
		defer postRows.Close()
		for postRows.Next() {
			var (
				id, userIDInt, likesCount, commentsCount int
				content, createdAt, updatedAt string
				firstName string
				lastName, avatarURL sql.NullString
				isVerified bool
				mediaJSON, tagsJSON string
				authorType string
			)

			if err := postRows.Scan(&id, &userIDInt, &content, &createdAt, &updatedAt, &likesCount, &commentsCount, &firstName, &lastName, &avatarURL, &isVerified, &mediaJSON, &tagsJSON, &authorType); err == nil {
				var media, tags interface{}
				json.Unmarshal([]byte(mediaJSON), &media)
				json.Unmarshal([]byte(tagsJSON), &tags)

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
					"user": map[string]interface{}{
						"id":          userIDInt,
						"first_name":  firstName,
						"last_name":   lastName.String,
						"avatar_url":  avatarURL.String,
						"is_verified": isVerified,
					},
					"media": media,
					"tags":  tags,
				}
				posts = append(posts, post)
			}
		}
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"users": users,
			"pets":  pets,
			"posts": posts,
		},
	})
}
