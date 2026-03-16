package comments

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type S3Client interface {
	UploadFile(key string, data io.Reader, contentType string) (string, error)
}

type Handler struct {
	db       *sql.DB
	s3Client S3Client
}

func NewHandler(db *sql.DB, s3Client S3Client) *Handler {
	h := &Handler{db: db, s3Client: s3Client}
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
			fmt.Printf("warning: failed to ensure posts reply columns in comments handler: %v\n", err)
		}
	}
}

// GetPostComments - получить комментарии к посту
func (h *Handler) GetPostComments(c *gin.Context) {
	postID := c.Param("id")

	query := `
		SELECT 
			c.id, c.post_id, c.user_id, c.content, c.created_at, c.updated_at,
			c.parent_id, c.reply_to_user_id, c.status, COALESCE(c.attachments, '[]') as attachments,
			u.name, u.last_name, u.avatar, u.verified
		FROM comments c
		JOIN users u ON c.user_id = u.id
		JOIN posts p ON c.post_id = p.id
		WHERE c.post_id = $1 AND (c.status = 'published' OR c.user_id = $2 OR p.author_id = $2)
		ORDER BY c.created_at ASC
	`

	// Получаем текущего пользователя (если авторизован)
	currentUserID := 0
	if uid, exists := c.Get("user_id"); exists {
		if id, ok := uid.(int); ok {
			currentUserID = id
		}
	}

	rows, err := h.db.Query(query, postID, currentUserID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	comments := []map[string]interface{}{}

	for rows.Next() {
		var (
			id, postIDInt, userID         int
			content, createdAt, updatedAt string
			parentID, replyToUserID       sql.NullInt64
			status                        string
			attachmentsJSON               string
			firstName, lastName           string
			avatarURL                     sql.NullString
			isVerified                    bool
		)

		err := rows.Scan(
			&id, &postIDInt, &userID, &content, &createdAt, &updatedAt,
			&parentID, &replyToUserID, &status, &attachmentsJSON,
			&firstName, &lastName, &avatarURL, &isVerified,
		)
		if err != nil {
			continue
		}

		var attachments interface{}
		json.Unmarshal([]byte(attachmentsJSON), &attachments)
		if attachments == nil {
			attachments = []interface{}{}
		}

		comment := map[string]interface{}{
			"id":         id,
			"post_id":    postIDInt,
			"user_id":    userID,
			"content":    content,
			"status":     status,
			"attachments": attachments,
			"created_at": createdAt,
			"updated_at": updatedAt,
			"user": map[string]interface{}{
				"id":          userID,
				"first_name":  firstName,
				"last_name":   lastName,
				"avatar_url":  avatarURL.String,
				"is_verified": isVerified,
			},
		}

		if parentID.Valid {
			comment["parent_id"] = parentID.Int64
		}

		if replyToUserID.Valid {
			comment["reply_to_user_id"] = replyToUserID.Int64
		}

		comments = append(comments, comment)
	}

	c.JSON(200, gin.H{"success": true, "data": comments})
}

// CreateComment - создать комментарий
func (h *Handler) CreateComment(c *gin.Context) {
	postID := c.Param("id")

	// Получаем текущего пользователя из контекста (установлено middleware)
	userIDInterface, hasUser := c.Get("user_id")
	if !hasUser {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	// Fetch post settings
	var postAuthorID int
	var replySetting string
	var verifyReplies bool
	postQuery := `SELECT author_id, reply_setting, verify_replies FROM posts WHERE id = $1 AND is_deleted = false`
	err := h.db.QueryRow(postQuery, postID).Scan(&postAuthorID, &replySetting, &verifyReplies)
	if err == sql.ErrNoRows {
		c.JSON(404, gin.H{"success": false, "error": "Post not found"})
		return
	} else if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to fetch post details"})
		return
	}

	// Check permissions based on reply_setting
	if userID != postAuthorID {
		if replySetting == "followers" {
			var isFollower bool
			// Check if userID follows postAuthorID
			followQuery := `SELECT EXISTS(SELECT 1 FROM user_followers WHERE follower_id = $1 AND following_id = $2)`
			h.db.QueryRow(followQuery, userID, postAuthorID).Scan(&isFollower)
			if !isFollower {
				c.JSON(403, gin.H{"success": false, "error": "Only followers can reply to this post", "code": "RESTRICTED_REPLIES"})
				return
			}
		} else if replySetting == "following" {
			var isFollowing bool
			// Check if postAuthorID follows userID 
			followQuery := `SELECT EXISTS(SELECT 1 FROM user_followers WHERE follower_id = $1 AND following_id = $2)`
			h.db.QueryRow(followQuery, postAuthorID, userID).Scan(&isFollowing)
			if !isFollowing {
				c.JSON(403, gin.H{"success": false, "error": "You cannot reply to this post", "code": "RESTRICTED_REPLIES"})
				return
			}
		} else if replySetting == "mentions" {
			// Mentions check needs full post content but we'll approve it temporarily until mention parsing is robust
			// For a production app this needs mention validation logic
		}
	}

	form, err := c.MultipartForm()
	var content string
	var parentID, replyToUserID *int

	if err == nil && form != nil {
		content = c.PostForm("content")
		parentIDStr := c.PostForm("parent_id")
		replyToUserIDStr := c.PostForm("reply_to_user_id")

		if parentIDStr != "" {
			pid, _ := strconv.Atoi(parentIDStr)
			parentID = &pid
		}
		if replyToUserIDStr != "" {
			rid, _ := strconv.Atoi(replyToUserIDStr)
			replyToUserID = &rid
		}
	} else {
		var req struct {
			Content       string `json:"content"`
			ParentID      *int   `json:"parent_id"`
			ReplyToUserID *int   `json:"reply_to_user_id"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"success": false, "error": "Invalid request"})
			return
		}
		content = req.Content
		parentID = req.ParentID
		replyToUserID = req.ReplyToUserID
	}

	attachments := []map[string]interface{}{}
	if form != nil {
		files := form.File["attachments"]
		for _, fileHeader := range files {
			file, err := fileHeader.Open()
			if err != nil {
				continue
			}

			buf := new(bytes.Buffer)
			io.Copy(buf, file)
			file.Close()

			mediaType := "photo"
			contentType := fileHeader.Header.Get("Content-Type")
			if contentType != "" && len(contentType) >= 5 && contentType[:5] == "video" {
				mediaType = "video"
			}

			timestamp := time.Now().Unix()
			ext := filepath.Ext(fileHeader.Filename)
			fileKey := fmt.Sprintf("users/%d/comments/%d%s", userID, timestamp, ext)

			fileURL, err := h.s3Client.UploadFile(fileKey, bytes.NewReader(buf.Bytes()), contentType)
			if err != nil {
				continue
			}

			attachments = append(attachments, map[string]interface{}{
				"url":       fileURL,
				"type":      mediaType,
				"file_name": fileHeader.Filename,
				"size":      fileHeader.Size,
			})
		}
	}

	if content == "" && len(attachments) == 0 {
		c.JSON(400, gin.H{"success": false, "error": "Content or attachments is required"})
		return
	}

	// Начинаем транзакцию
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	attachmentsJSON, _ := json.Marshal(attachments)

	commentStatus := "published"
	if verifyReplies && userID != postAuthorID {
		commentStatus = "pending"
	}

	// Создаем комментарий
	query := `
		INSERT INTO comments (
			post_id, user_id, content, attachments, parent_id, reply_to_user_id, status, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
		) RETURNING id, created_at, updated_at
	`

	var commentID int
	var createdAt, updatedAt string
	err = tx.QueryRow(query, postID, userID, content, string(attachmentsJSON), parentID, replyToUserID, commentStatus).Scan(&commentID, &createdAt, &updatedAt)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to create comment"})
		return
	}

	// Увеличиваем счетчик комментариев в посте только если статус опубликован
	if commentStatus == "published" {
		updateQuery := `UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = $1`
		_, err = tx.Exec(updateQuery, postID)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Failed to update comments count"})
			return
		}
	}

	// Коммитим транзакцию
	if err := tx.Commit(); err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to commit transaction"})
		return
	}

	// Получаем данные пользователя для ответа
	var firstName, lastName string
	var avatarURL sql.NullString
	var isVerified bool
	userQuery := `SELECT name, last_name, avatar, verified FROM users WHERE id = $1`
	h.db.QueryRow(userQuery, userID).Scan(&firstName, &lastName, &avatarURL, &isVerified)

	// Конвертируем postID в int
	postIDInt, _ := strconv.Atoi(postID)

	c.JSON(201, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"id":               commentID,
			"post_id":          postIDInt,
			"user_id":          userID,
			"content":          content,
			"status":           commentStatus,
			"attachments":      attachments,
			"parent_id":        parentID,
			"reply_to_user_id": replyToUserID,
			"created_at":       createdAt,
			"updated_at":       updatedAt,
			"user": map[string]interface{}{
				"id":          userID,
				"first_name":  firstName,
				"last_name":   lastName,
				"avatar_url":  avatarURL.String,
				"is_verified": isVerified,
			},
		},
	})
}

// DeleteComment - удалить комментарий
func (h *Handler) DeleteComment(c *gin.Context) {
	commentID := c.Param("id")
	// TODO: получить user_id из токена и проверить права
	userID := 1

	// Начинаем транзакцию
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Проверяем что комментарий принадлежит пользователю и получаем post_id, status
	var authorID, postID int
	var commentStatus string
	checkQuery := `SELECT user_id, post_id, status FROM comments WHERE id = $1`
	err = tx.QueryRow(checkQuery, commentID).Scan(&authorID, &postID, &commentStatus)
	if err != nil {
		c.JSON(404, gin.H{"success": false, "error": "Comment not found"})
		return
	}

	if authorID != userID {
		c.JSON(403, gin.H{"success": false, "error": "Forbidden"})
		return
	}

	// Удаляем комментарий
	deleteQuery := `DELETE FROM comments WHERE id = $1`
	_, err = tx.Exec(deleteQuery, commentID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to delete comment"})
		return
	}

	// Уменьшаем счетчик комментариев в посте только если он был опубликован
	if commentStatus == "published" {
		updateQuery := `UPDATE posts SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = $1`
		_, err = tx.Exec(updateQuery, postID)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Failed to update comments count"})
			return
		}
	}

	// Коммитим транзакцию
	if err := tx.Commit(); err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to commit transaction"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Comment deleted"})
}

// ApproveComment - одобрить комментарий
func (h *Handler) ApproveComment(c *gin.Context) {
	commentID := c.Param("id")
	
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

	// Убедимся, что текущий пользователь является автором поста
	var postID int
	var postAuthorID int
	var commentStatus string
	checkQuery := `
		SELECT c.post_id, p.author_id, c.status 
		FROM comments c 
		JOIN posts p ON c.post_id = p.id 
		WHERE c.id = $1
	`
	err = tx.QueryRow(checkQuery, commentID).Scan(&postID, &postAuthorID, &commentStatus)
	if err == sql.ErrNoRows {
		c.JSON(404, gin.H{"success": false, "error": "Comment not found"})
		return
	} else if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Database error"})
		return
	}

	if userID != postAuthorID {
		c.JSON(403, gin.H{"success": false, "error": "Only the post author can approve comments"})
		return
	}

	if commentStatus == "published" {
		c.JSON(400, gin.H{"success": false, "error": "Comment is already published"})
		return
	}

	// Одобряем комментарий
	updateCommentQuery := `UPDATE comments SET status = 'published', updated_at = NOW() WHERE id = $1`
	_, err = tx.Exec(updateCommentQuery, commentID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to approve comment"})
		return
	}

	// Увеличиваем счетчик комментариев в посте
	updatePostQuery := `UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = $1`
	_, err = tx.Exec(updatePostQuery, postID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to update comments count"})
		return
	}

	// Коммитим транзакцию
	if err := tx.Commit(); err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to commit transaction"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Comment approved"})
}

// RejectComment - отклонить комментарий
func (h *Handler) RejectComment(c *gin.Context) {
	commentID := c.Param("id")
	
	// Получаем текущего пользователя из контекста (установлено middleware)
	userIDInterface, hasUser := c.Get("user_id")
	if !hasUser {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	// Убедимся, что текущий пользователь является автором поста
	var postAuthorID int
	checkQuery := `
		SELECT p.author_id 
		FROM comments c 
		JOIN posts p ON c.post_id = p.id 
		WHERE c.id = $1
	`
	err := h.db.QueryRow(checkQuery, commentID).Scan(&postAuthorID)
	if err == sql.ErrNoRows {
		c.JSON(404, gin.H{"success": false, "error": "Comment not found"})
		return
	} else if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Database error"})
		return
	}

	if userID != postAuthorID {
		c.JSON(403, gin.H{"success": false, "error": "Only the post author can reject comments"})
		return
	}

	// Отклоняем комментарий
	updateCommentQuery := `UPDATE comments SET status = 'rejected', updated_at = NOW() WHERE id = $1`
	_, err = h.db.Exec(updateCommentQuery, commentID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to reject comment"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Comment rejected"})
}
