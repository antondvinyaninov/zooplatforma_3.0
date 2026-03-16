package chats

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/zooplatforma/backend/internal/shared/websocket"
)

type S3Client interface {
	UploadFile(key string, data io.Reader, contentType string) (string, error)
}

type Handler struct {
	db       *sql.DB
	s3Client S3Client
	hub      *websocket.Hub
}

func NewHandler(db *sql.DB, s3Client S3Client, hub *websocket.Hub) *Handler {
	return &Handler{
		db:       db,
		s3Client: s3Client,
		hub:      hub,
	}
}

// GetChats - получить список чатов пользователя
func (h *Handler) GetChats(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	query := `
		SELECT 
			c.id,
			c.last_message_at,
			c.user1_id,
			c.user2_id,
			COALESCE(um.unread_count, 0) as unread_count,
			u.id as other_user_id,
			u.name as other_user_name,
			u.last_name as other_user_last_name,
			u.avatar as other_user_avatar,
			u.verified as other_user_verified,
			u.last_seen as other_user_last_seen
		FROM chats c
		LEFT JOIN users u ON (
			CASE 
				WHEN c.user1_id = $1 THEN c.user2_id
				ELSE c.user1_id
			END = u.id
		)
		LEFT JOIN (
			SELECT chat_id, COUNT(*) as unread_count 
			FROM messages 
			WHERE receiver_id = $1 AND is_read = false 
			GROUP BY chat_id
		) um ON um.chat_id = c.id
		WHERE c.user1_id = $1 OR c.user2_id = $1
		ORDER BY c.last_message_at DESC NULLS LAST
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	chats := []map[string]interface{}{}

	for rows.Next() {
		var (
			chatID, user1ID, user2ID, unreadCount int
			otherUserID                           int
			otherUserName, otherUserLastName      string
			otherUserAvatar, otherUserLastSeen    sql.NullString
			otherUserVerified                     bool
			lastMessageAt                         sql.NullString
		)

		err := rows.Scan(
			&chatID, &lastMessageAt, &user1ID, &user2ID, &unreadCount,
			&otherUserID, &otherUserName, &otherUserLastName,
			&otherUserAvatar, &otherUserVerified, &otherUserLastSeen,
		)
		if err != nil {
			continue
		}

		chat := map[string]interface{}{
			"id":              chatID,
			"user1_id":        user1ID,
			"user2_id":        user2ID,
			"last_message_at": lastMessageAt.String,
			"unread_count":    unreadCount,
			"other_user": map[string]interface{}{
				"id":         otherUserID,
				"name":       otherUserName,
				"last_name":  otherUserLastName,
				"avatar":     otherUserAvatar.String,
				"avatar_url": otherUserAvatar.String,
				"verified":   otherUserVerified,
				"last_seen":  otherUserLastSeen.String,
			},
		}

		chats = append(chats, chat)
	}

	c.JSON(200, gin.H{"success": true, "data": chats})
}

// GetMessages - получить сообщения чата
func (h *Handler) GetMessages(c *gin.Context) {
	chatID := c.Param("id")

	query := `
		SELECT 
			m.id, m.chat_id, m.sender_id, m.receiver_id,
			m.content, m.is_read, m.read_at, m.created_at,
			u.name as sender_name,
			u.last_name as sender_last_name,
			u.avatar as sender_avatar
		FROM messages m
		JOIN users u ON m.sender_id = u.id
		WHERE m.chat_id = $1
		ORDER BY m.created_at ASC
	`

	rows, err := h.db.Query(query, chatID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	// Получаем все вложения для сообщений этого чата одним запросом (устранение N+1)
	attachmentsQuery := `
		SELECT ma.message_id, ma.file_path, ma.file_type, ma.file_size, um.original_name
		FROM message_attachments ma
		LEFT JOIN user_media um ON ma.file_path = um.file_path
		WHERE ma.message_id IN (
			SELECT id FROM messages WHERE chat_id = $1
		)
	`
	attachmentRows, err := h.db.Query(attachmentsQuery, chatID)
	
	attachmentMap := make(map[int][]map[string]interface{})
	if err == nil {
		defer attachmentRows.Close()
		for attachmentRows.Next() {
			var msgID int
			var url, fileType string
			var fileSize int
			var originalName sql.NullString
			if err := attachmentRows.Scan(&msgID, &url, &fileType, &fileSize, &originalName); err == nil {
				fileName := originalName.String
				if fileName == "" {
					fileName = url
				}
				attachmentMap[msgID] = append(attachmentMap[msgID], map[string]interface{}{
					"url":       url,
					"type":      fileType,
					"size":      fileSize,
					"file_name": fileName,
				})
			}
		}
	}

	messages := []map[string]interface{}{}

	for rows.Next() {
		var (
			id, chatIDInt, senderID, receiverID int
			content, createdAt                  string
			isRead                              bool
			readAt                              sql.NullString
			senderName, senderLastName          string
			senderAvatar                        sql.NullString
		)

		err := rows.Scan(
			&id, &chatIDInt, &senderID, &receiverID,
			&content, &isRead, &readAt, &createdAt,
			&senderName, &senderLastName, &senderAvatar,
		)
		if err != nil {
			continue
		}

		attachments := attachmentMap[id]
		if attachments == nil {
			attachments = []map[string]interface{}{}
		}

		message := map[string]interface{}{
			"id":          id,
			"chat_id":     chatIDInt,
			"sender_id":   senderID,
			"receiver_id": receiverID,
			"content":     content,
			"is_read":     isRead,
			"read_at":     readAt.String,
			"created_at":  createdAt,
			"attachments": attachments,
			"sender": map[string]interface{}{
				"id":         senderID,
				"name":       senderName,
				"last_name":  senderLastName,
				"avatar":     senderAvatar.String,
				"avatar_url": senderAvatar.String,
			},
		}

		messages = append(messages, message)
	}

	c.JSON(200, gin.H{"success": true, "data": messages})
}

// SendMessage - отправить сообщение
func (h *Handler) SendMessage(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	var req struct {
		ReceiverID int    `json:"receiver_id" binding:"required"`
		Content    string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Проверяем, существует ли чат между пользователями
	var chatID int
	checkChatQuery := `
		SELECT id FROM chats 
		WHERE (user1_id = $1 AND user2_id = $2) 
		   OR (user1_id = $2 AND user2_id = $1)
		LIMIT 1
	`
	err := h.db.QueryRow(checkChatQuery, userID, req.ReceiverID).Scan(&chatID)

	if err == sql.ErrNoRows {
		// Создаем новый чат
		createChatQuery := `
			INSERT INTO chats (user1_id, user2_id, created_at)
			VALUES ($1, $2, NOW())
			RETURNING id
		`
		err = h.db.QueryRow(createChatQuery, userID, req.ReceiverID).Scan(&chatID)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Failed to create chat"})
			return
		}
	} else if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Создаем сообщение
	var messageID int
	insertMessageQuery := `
		INSERT INTO messages (chat_id, sender_id, receiver_id, content, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id
	`
	err = h.db.QueryRow(insertMessageQuery, chatID, userID, req.ReceiverID, req.Content).Scan(&messageID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to send message"})
		return
	}

	// Обновляем last_message_at в чате
	updateChatQuery := `UPDATE chats SET last_message_at = NOW() WHERE id = $1`
	h.db.Exec(updateChatQuery, chatID)

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"id":      messageID,
			"chat_id": chatID,
		},
	})

	if h.hub != nil {
		senderQuery := `SELECT name, last_name, avatar FROM users WHERE id = $1`
		var senderName, senderLastName string
		var senderAvatar sql.NullString
		h.db.QueryRow(senderQuery, userID).Scan(&senderName, &senderLastName, &senderAvatar)

		msgPayload := map[string]interface{}{
			"type": "new_message",
			"data": map[string]interface{}{
				"id":          messageID,
				"chat_id":     chatID,
				"sender_id":   userID,
				"receiver_id": req.ReceiverID,
				"content":     req.Content,
				"created_at":  time.Now().Format(time.RFC3339),
				"is_read":     false,
				"attachments": []map[string]interface{}{},
				"sender": map[string]interface{}{
					"id":         userID,
					"name":       senderName,
					"last_name":  senderLastName,
					"avatar":     senderAvatar.String,
					"avatar_url": senderAvatar.String,
				},
			},
		}
		msgBytes, _ := json.Marshal(msgPayload)
		h.hub.SendToUser(req.ReceiverID, msgBytes)
		h.hub.SendToUser(userID, msgBytes)

		var unreadCount int
		h.db.QueryRow(`SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = false`, req.ReceiverID).Scan(&unreadCount)
		unreadPayload := map[string]interface{}{
			"type": "unread_count",
			"data": map[string]interface{}{"count": unreadCount},
		}
		unreadBytes, _ := json.Marshal(unreadPayload)
		h.hub.SendToUser(req.ReceiverID, unreadBytes)
	}
}

// MarkAsRead - пометить сообщения как прочитанные
func (h *Handler) MarkAsRead(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)
	chatID := c.Param("id")

	query := `
		UPDATE messages 
		SET is_read = true, read_at = NOW()
		WHERE chat_id = $1 
		  AND receiver_id = $2 
		  AND is_read = false
	`

	_, err := h.db.Exec(query, chatID, userID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true})
}

// GetUnreadCount - получить количество непрочитанных сообщений
func (h *Handler) GetUnreadCount(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	var count int
	query := `
		SELECT COUNT(*) 
		FROM messages 
		WHERE receiver_id = $1 AND is_read = false
	`

	err := h.db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"count": count,
		},
	})
}

// SendMessageWithMedia - отправить сообщение с медиа вложениями
func (h *Handler) SendMessageWithMedia(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	receiverIDStr := c.PostForm("receiver_id")
	content := c.PostForm("content")

	if receiverIDStr == "" {
		c.JSON(400, gin.H{"success": false, "error": "receiver_id is required"})
		return
	}

	receiverID := 0
	_, err := fmt.Sscanf(receiverIDStr, "%d", &receiverID)
	if err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid receiver_id"})
		return
	}

	// Получаем медиа файлы
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Failed to parse form"})
		return
	}

	files := form.File["media"]
	if len(files) == 0 {
		c.JSON(400, gin.H{"success": false, "error": "No media files provided"})
		return
	}

	// Проверяем, существует ли чат между пользователями
	var chatID int
	checkChatQuery := `
		SELECT id FROM chats 
		WHERE (user1_id = $1 AND user2_id = $2) 
		   OR (user1_id = $2 AND user2_id = $1)
		LIMIT 1
	`
	err = h.db.QueryRow(checkChatQuery, userID, receiverID).Scan(&chatID)

	if err == sql.ErrNoRows {
		// Создаем новый чат
		createChatQuery := `
			INSERT INTO chats (user1_id, user2_id, created_at)
			VALUES ($1, $2, NOW())
			RETURNING id
		`
		err = h.db.QueryRow(createChatQuery, userID, receiverID).Scan(&chatID)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Failed to create chat"})
			return
		}
	} else if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Загружаем файлы в S3 и сохраняем в user_media
	uploadedFiles := []map[string]interface{}{}

	for _, fileHeader := range files {
		// Открываем файл
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}

		// Читаем файл в буфер
		buf := new(bytes.Buffer)
		_, err = io.Copy(buf, file)
		file.Close()
		if err != nil {
			continue
		}

		// Определяем тип медиа
		mediaType := "photo"
		contentType := fileHeader.Header.Get("Content-Type")
		if contentType != "" {
			if len(contentType) >= 5 && contentType[:5] == "video" {
				mediaType = "video"
			} else if len(contentType) >= 5 && contentType[:5] == "image" {
				mediaType = "photo"
			} else {
				mediaType = "file"
			}
		}

		// Генерируем ключ для S3
		timestamp := time.Now().Unix()
		ext := filepath.Ext(fileHeader.Filename)
		fileKey := fmt.Sprintf("users/%d/messages/%d%s", userID, timestamp, ext)

		// Загружаем в S3
		fileURL, err := h.s3Client.UploadFile(fileKey, bytes.NewReader(buf.Bytes()), contentType)
		if err != nil {
			continue
		}

		// Сохраняем в user_media
		var mediaID int
		insertMediaQuery := `
			INSERT INTO user_media (
				user_id, file_name, original_name, file_path, file_size, mime_type, media_type, uploaded_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, NOW()
			) RETURNING id
		`
		err = h.db.QueryRow(insertMediaQuery, userID, fileKey, fileHeader.Filename, fileURL, fileHeader.Size, contentType, mediaType).Scan(&mediaID)
		if err != nil {
			continue
		}

		uploadedFiles = append(uploadedFiles, map[string]interface{}{
			"id":        mediaID,
			"url":       fileURL,
			"type":      mediaType,
			"mime_type": contentType,
			"file_name": fileHeader.Filename,
			"size":      fileHeader.Size,
		})
	}

	// Создаем сообщение
	if content == "" && len(uploadedFiles) > 0 {
		content = "" // Пустое сообщение если есть только медиа
	}

	var messageID int
	insertMessageQuery := `
		INSERT INTO messages (chat_id, sender_id, receiver_id, content, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id
	`
	err = h.db.QueryRow(insertMessageQuery, chatID, userID, receiverID, content).Scan(&messageID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to send message"})
		return
	}

	// Сохраняем вложения в message_attachments
	for _, file := range uploadedFiles {
		insertAttachmentQuery := `
			INSERT INTO message_attachments (message_id, file_path, file_type, file_size, created_at)
			VALUES ($1, $2, $3, $4, NOW())
		`
		h.db.Exec(insertAttachmentQuery, messageID, file["url"], file["type"], file["size"])
	}

	// Обновляем last_message_at в чате
	updateChatQuery := `UPDATE chats SET last_message_at = NOW() WHERE id = $1`
	h.db.Exec(updateChatQuery, chatID)

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"id":          messageID,
			"chat_id":     chatID,
			"attachments": uploadedFiles,
		},
	})

	if h.hub != nil {
		senderQuery := `SELECT name, last_name, avatar FROM users WHERE id = $1`
		var senderName, senderLastName string
		var senderAvatar sql.NullString
		h.db.QueryRow(senderQuery, userID).Scan(&senderName, &senderLastName, &senderAvatar)

		msgPayload := map[string]interface{}{
			"type": "new_message",
			"data": map[string]interface{}{
				"id":          messageID,
				"chat_id":     chatID,
				"sender_id":   userID,
				"receiver_id": receiverID,
				"content":     content,
				"created_at":  time.Now().Format(time.RFC3339),
				"is_read":     false,
				"attachments": uploadedFiles,
				"sender": map[string]interface{}{
					"id":         userID,
					"name":       senderName,
					"last_name":  senderLastName,
					"avatar":     senderAvatar.String,
					"avatar_url": senderAvatar.String,
				},
			},
		}
		msgBytes, _ := json.Marshal(msgPayload)
		h.hub.SendToUser(receiverID, msgBytes)
		h.hub.SendToUser(userID, msgBytes)

		var unreadCount int
		h.db.QueryRow(`SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = false`, receiverID).Scan(&unreadCount)
		unreadPayload := map[string]interface{}{
			"type": "unread_count",
			"data": map[string]interface{}{"count": unreadCount},
		}
		unreadBytes, _ := json.Marshal(unreadPayload)
		h.hub.SendToUser(receiverID, unreadBytes)
	}
}
