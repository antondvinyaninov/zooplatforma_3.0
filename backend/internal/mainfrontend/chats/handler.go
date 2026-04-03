package chats

import (
	"bytes"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"path/filepath"
	"strings"
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
			c.id, c.type, c.name as group_name, c.avatar_url as group_avatar,
			c.last_message_at,
			cp.last_read_message_id,
			COALESCE(um.unread_count, 0) as unread_count,
			(SELECT COUNT(*) FROM chat_participants WHERE chat_id = c.id) as participants_count,
			u.id as other_user_id,
			u.name as other_user_name,
			u.last_name as other_user_last_name,
			u.avatar as other_user_avatar,
			u.verified as other_user_verified,
			u.last_seen as other_user_last_seen
		FROM chat_participants cp
		JOIN chats c ON cp.chat_id = c.id
		LEFT JOIN chat_participants cp_other ON cp_other.chat_id = c.id AND cp_other.user_id != cp.user_id AND c.type = 'direct'
		LEFT JOIN users u ON cp_other.user_id = u.id
		LEFT JOIN (
			SELECT m.chat_id, cp_inner.user_id, COUNT(*) as unread_count 
			FROM messages m
			JOIN chat_participants cp_inner ON m.chat_id = cp_inner.chat_id
			WHERE m.id > cp_inner.last_read_message_id
			GROUP BY m.chat_id, cp_inner.user_id
		) um ON um.chat_id = c.id AND um.user_id = cp.user_id
		WHERE cp.user_id = $1 AND (
			(c.last_message_id IS NULL AND COALESCE(cp.hidden_until_msg_id, 0) = 0) OR
			(c.last_message_id > COALESCE(cp.hidden_until_msg_id, 0))
		)
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
			chatID, lastReadMessageID, unreadCount, participantsCount int
			chatType                                                  string
			groupName, groupAvatar                                    sql.NullString
			otherUserID                                               sql.NullInt64
			otherUserName                                             sql.NullString
			otherUserLastName                                         sql.NullString
			otherUserAvatar, otherUserLastSeen                        sql.NullString
			otherUserVerified                                         sql.NullBool
			lastMessageAt                                             sql.NullString
		)

		err := rows.Scan(
			&chatID, &chatType, &groupName, &groupAvatar,
			&lastMessageAt, &lastReadMessageID, &unreadCount, &participantsCount,
			&otherUserID, &otherUserName, &otherUserLastName,
			&otherUserAvatar, &otherUserVerified, &otherUserLastSeen,
		)
		if err != nil {
			fmt.Printf("GetChats Scan error for user %d: %v\n", userID, err)
			continue
		}

		chat := map[string]interface{}{
			"id":                 chatID,
			"type":               chatType,
			"name":               groupName.String,
			"avatar_url":         groupAvatar.String,
			"last_message_at":    lastMessageAt.String,
			"unread_count":       unreadCount,
			"participants_count": participantsCount,
		}

		if chatType == "direct" && otherUserID.Valid {
			chat["other_user"] = map[string]interface{}{
				"id":         otherUserID.Int64,
				"name":       otherUserName.String,
				"last_name":  otherUserLastName.String,
				"avatar":     otherUserAvatar.String,
				"avatar_url": otherUserAvatar.String,
				"verified":   otherUserVerified.Bool,
				"last_seen":  otherUserLastSeen.String,
			}
		}

		chats = append(chats, chat)
	}

	c.JSON(200, gin.H{"success": true, "data": chats})
}

// GetMessages - получить сообщения чата
func (h *Handler) GetMessages(c *gin.Context) {
	chatID := c.Param("id")
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	query := `
		SELECT 
			m.id, m.chat_id, m.sender_id,
			m.content, m.created_at,
			u.name as sender_name,
			u.last_name as sender_last_name,
			u.avatar as sender_avatar
		FROM messages m
		JOIN users u ON m.sender_id = u.id
		WHERE m.chat_id = $1 AND m.id > COALESCE((SELECT hidden_until_msg_id FROM chat_participants WHERE chat_id = $1 AND user_id = $2), 0)
		ORDER BY m.created_at ASC
	`

	rows, err := h.db.Query(query, chatID, userID)
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
			id, chatIDInt, senderID       int
			content, createdAt            string
			senderName                    string
			senderLastName, senderAvatar  sql.NullString
		)

		err := rows.Scan(
			&id, &chatIDInt, &senderID,
			&content, &createdAt,
			&senderName, &senderLastName, &senderAvatar,
		)
		if err != nil {
			fmt.Printf("GetMessages Scan error for chat %s: %v\n", chatID, err)
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
			"content":     content,
			"created_at":  createdAt,
			"attachments": attachments,
			"sender": map[string]interface{}{
				"id":         senderID,
				"name":       senderName,
				"last_name":  senderLastName.String,
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
		ReceiverID int    `json:"receiver_id"`
		ChatID     int    `json:"chat_id"`
		Content    string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": err.Error()})
		return
	}

	var chatID = req.ChatID

	if chatID == 0 && req.ReceiverID > 0 {
		// Поиск P2P чата
		checkChatQuery := `
			SELECT c.id FROM chats c
			JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = $1
			JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = $2
			WHERE c.type = 'direct'
			LIMIT 1
		`
		err := h.db.QueryRow(checkChatQuery, userID, req.ReceiverID).Scan(&chatID)
		if err == sql.ErrNoRows {
			// Создаем новый P2P чат
			err = h.db.QueryRow(`INSERT INTO chats (type, created_at) VALUES ('direct', NOW()) RETURNING id`).Scan(&chatID)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Failed to create chat"})
				return
			}
			h.db.Exec(`INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)`, chatID, userID, req.ReceiverID)
		} else if err != nil {
			c.JSON(500, gin.H{"success": false, "error": err.Error()})
			return
		}
	} else if chatID == 0 {
		c.JSON(400, gin.H{"success": false, "error": "Either chat_id or receiver_id is required"})
		return
	}

	// Создаем сообщение
	var messageID int
	insertMessageQuery := `
		INSERT INTO messages (chat_id, sender_id, content, created_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING id
	`
	err := h.db.QueryRow(insertMessageQuery, chatID, userID, req.Content).Scan(&messageID)
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
		var senderName string
		var senderLastName, senderAvatar sql.NullString
		h.db.QueryRow(senderQuery, userID).Scan(&senderName, &senderLastName, &senderAvatar)

		msgPayload := map[string]interface{}{
			"type": "new_message",
			"data": map[string]interface{}{
				"id":          messageID,
				"chat_id":     chatID,
				"sender_id":   userID,
				"content":     req.Content,
				"created_at":  time.Now().Format(time.RFC3339),
				"attachments": []map[string]interface{}{},
				"sender": map[string]interface{}{
					"id":         userID,
					"name":       senderName,
					"last_name":  senderLastName.String,
					"avatar":     senderAvatar.String,
					"avatar_url": senderAvatar.String,
				},
			},
		}
		msgBytes, _ := json.Marshal(msgPayload)

		// Получаем всех участников чата
		rows, _ := h.db.Query(`SELECT user_id FROM chat_participants WHERE chat_id = $1`, chatID)
		defer rows.Close()
		var pIDs []int
		for rows.Next() {
			var pID int
			if rows.Scan(&pID) == nil {
				pIDs = append(pIDs, pID)
			}
		}
		h.hub.BroadcastToUsers(pIDs, msgBytes)

		// Отправляем счетчик непрочитанных всем КРОМЕ отправителя (грубая оценка)
		for _, pID := range pIDs {
			if pID != userID {
				var unreadCount int
				h.db.QueryRow(`
					SELECT COUNT(*) FROM messages m
					JOIN chat_participants cp ON m.chat_id = cp.chat_id AND cp.user_id = $1
					WHERE m.id > cp.last_read_message_id
				`, pID).Scan(&unreadCount)
				unreadPayload := map[string]interface{}{
					"type": "unread_count",
					"data": map[string]interface{}{"count": unreadCount},
				}
				unreadBytes, _ := json.Marshal(unreadPayload)
				h.hub.SendToUser(pID, unreadBytes)
			}
		}
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
		UPDATE chat_participants 
		SET last_read_message_id = COALESCE((SELECT MAX(id) FROM messages WHERE chat_id = $1), 0)
		WHERE chat_id = $1 AND user_id = $2
	`

	_, err := h.db.Exec(query, chatID, userID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	if h.hub != nil {
		var unreadCount int
		h.db.QueryRow(`
			SELECT COUNT(*) FROM messages m
			JOIN chat_participants cp ON m.chat_id = cp.chat_id AND cp.user_id = $1
			WHERE m.id > cp.last_read_message_id
		`, userID).Scan(&unreadCount)
		
		unreadPayload := map[string]interface{}{
			"type": "unread_count",
			"data": map[string]interface{}{"count": unreadCount},
		}
		unreadBytes, _ := json.Marshal(unreadPayload)
		h.hub.SendToUser(userID, unreadBytes)
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
		SELECT COUNT(*) FROM messages m
		JOIN chat_participants cp ON m.chat_id = cp.chat_id AND cp.user_id = $1
		WHERE m.id > cp.last_read_message_id
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
	chatIDStr := c.PostForm("chat_id")
	content := c.PostForm("content")

	var receiverID int
	var chatID int

	if receiverIDStr != "" {
		fmt.Sscanf(receiverIDStr, "%d", &receiverID)
	}
	if chatIDStr != "" {
		fmt.Sscanf(chatIDStr, "%d", &chatID)
	}

	if chatID == 0 && receiverID == 0 {
		c.JSON(400, gin.H{"success": false, "error": "Either chat_id or receiver_id is required"})
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

	if chatID == 0 && receiverID > 0 {
		// Поиск P2P чата
		checkChatQuery := `
			SELECT c.id FROM chats c
			JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = $1
			JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = $2
			WHERE c.type = 'direct'
			LIMIT 1
		`
		err := h.db.QueryRow(checkChatQuery, userID, receiverID).Scan(&chatID)
		if err == sql.ErrNoRows {
			// Создаем новый P2P чат
			err = h.db.QueryRow(`INSERT INTO chats (type, created_at) VALUES ('direct', NOW()) RETURNING id`).Scan(&chatID)
			if err != nil {
				c.JSON(500, gin.H{"success": false, "error": "Failed to create chat"})
				return
			}
			h.db.Exec(`INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)`, chatID, userID, receiverID)
		} else if err != nil {
			c.JSON(500, gin.H{"success": false, "error": err.Error()})
			return
		}
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
		INSERT INTO messages (chat_id, sender_id, content, created_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING id
	`
	err = h.db.QueryRow(insertMessageQuery, chatID, userID, content).Scan(&messageID)
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
		var senderName string
		var senderLastName, senderAvatar sql.NullString
		h.db.QueryRow(senderQuery, userID).Scan(&senderName, &senderLastName, &senderAvatar)

		msgPayload := map[string]interface{}{
			"type": "new_message",
			"data": map[string]interface{}{
				"id":          messageID,
				"chat_id":     chatID,
				"sender_id":   userID,
				"content":     content,
				"created_at":  time.Now().Format(time.RFC3339),
				"attachments": uploadedFiles,
				"sender": map[string]interface{}{
					"id":         userID,
					"name":       senderName,
					"last_name":  senderLastName.String,
					"avatar":     senderAvatar.String,
					"avatar_url": senderAvatar.String,
				},
			},
		}
		msgBytes, _ := json.Marshal(msgPayload)

		// Получаем всех участников чата
		rows, _ := h.db.Query(`SELECT user_id FROM chat_participants WHERE chat_id = $1`, chatID)
		defer rows.Close()
		var pIDs []int
		for rows.Next() {
			var pID int
			if rows.Scan(&pID) == nil {
				pIDs = append(pIDs, pID)
			}
		}
		h.hub.BroadcastToUsers(pIDs, msgBytes)

		// Отправляем счетчик непрочитанных всем КРОМЕ отправителя (грубая оценка)
		for _, pID := range pIDs {
			if pID != userID {
				var unreadCount int
				h.db.QueryRow(`
					SELECT COUNT(*) FROM messages m
					JOIN chat_participants cp ON m.chat_id = cp.chat_id AND cp.user_id = $1
					WHERE m.id > cp.last_read_message_id
				`, pID).Scan(&unreadCount)
				unreadPayload := map[string]interface{}{
					"type": "unread_count",
					"data": map[string]interface{}{"count": unreadCount},
				}
				unreadBytes, _ := json.Marshal(unreadPayload)
				h.hub.SendToUser(pID, unreadBytes)
			}
		}
	}
}

// CreateGroupChat - создать групповой чат
func (h *Handler) CreateGroupChat(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	var req struct {
		Name         string `json:"name" binding:"required"`
		Participants []int  `json:"participants" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Добавляем создателя в список участников, если его там нет
	hasCreator := false
	for _, p := range req.Participants {
		if p == userID {
			hasCreator = true
			break
		}
	}
	if !hasCreator {
		req.Participants = append(req.Participants, userID)
	}

	// Начинаем транзакцию? Можно и без нее для упрощения
	var chatID int
	err := h.db.QueryRow(`
		INSERT INTO chats (type, name, creator_id, created_at)
		VALUES ('group', $1, $2, NOW())
		RETURNING id
	`, req.Name, userID).Scan(&chatID)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to create group chat"})
		return
	}

	for _, pID := range req.Participants {
		role := "member"
		if pID == userID {
			role = "admin"
		}
		h.db.Exec(`INSERT INTO chat_participants (chat_id, user_id, role) VALUES ($1, $2, $3)`, chatID, pID, role)
	}

	c.JSON(200, gin.H{"success": true, "data": map[string]interface{}{"id": chatID}})
}

// GetParticipants returns all participants in a specific chat
func (h *Handler) GetParticipants(c *gin.Context) {
	chatID := c.Param("id")

	query := `
		SELECT 
			u.id, u.name, u.last_name, u.avatar, u.verified, u.last_seen,
			cp.role, cp.joined_at,
			CASE WHEN ua.last_seen > NOW() - INTERVAL '5 minutes' THEN true ELSE false END as is_online
		FROM chat_participants cp
		JOIN users u ON cp.user_id = u.id
		LEFT JOIN user_activity ua ON u.id = ua.user_id
		WHERE cp.chat_id = $1
		ORDER BY cp.joined_at ASC
	`
	rows, err := h.db.Query(query, chatID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	var participants []map[string]interface{}
	for rows.Next() {
		var id int
		var name, role string
		var lastName, avatar sql.NullString
		var verified sql.NullBool
		var lastSeen sql.NullTime
		var joinedAt sql.NullTime
		var isOnline bool

		if err := rows.Scan(&id, &name, &lastName, &avatar, &verified, &lastSeen, &role, &joinedAt, &isOnline); err != nil {
			continue
		}

		lastSeenStr := ""
		if lastSeen.Valid {
			lastSeenStr = lastSeen.Time.Format(time.RFC3339)
		}

		participants = append(participants, map[string]interface{}{
			"id":        id,
			"name":      name,
			"last_name": lastName.String,
			"avatar":    avatar.String,
			"verified":  verified.Bool,
			"last_seen": lastSeenStr,
			"is_online": isOnline,
			"role":      role,
			"joined_at": joinedAt.Time,
		})
	}

	c.JSON(200, gin.H{"success": true, "data": participants})
}

// AddParticipant adds a user to a group chat
func (h *Handler) AddParticipant(c *gin.Context) {
	chatID := c.Param("id")
	var req struct {
		UserID int `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	_, err := h.db.Exec(`INSERT INTO chat_participants (chat_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`, chatID, req.UserID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to add participant"})
		return
	}
	c.JSON(200, gin.H{"success": true})
}

// RemoveParticipant removes a user from a group chat (or self leave)
func (h *Handler) RemoveParticipant(c *gin.Context) {
	chatID := c.Param("id")
	userID := c.Param("user_id")

	_, err := h.db.Exec(`DELETE FROM chat_participants WHERE chat_id = $1 AND user_id = $2`, chatID, userID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to remove participant"})
		return
	}
	c.JSON(200, gin.H{"success": true})
}

// UpdateChat updates group chat details like name
func (h *Handler) UpdateChat(c *gin.Context) {
	chatID := c.Param("id")
	var req struct {
		Name      string `json:"name"`
		AvatarUrl string `json:"avatar_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	query := "UPDATE chats SET "
	args := []interface{}{}
	argIdx := 1
	updates := []string{}

	if req.Name != "" {
		updates = append(updates, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, req.Name)
		argIdx++
	}
	if req.AvatarUrl != "" {
		updates = append(updates, fmt.Sprintf("avatar_url = $%d", argIdx))
		args = append(args, req.AvatarUrl)
		argIdx++
	}

	if len(updates) == 0 {
		c.JSON(200, gin.H{"success": true})
		return
	}

	query += strings.Join(updates, ", ") + fmt.Sprintf(" WHERE id = $%d", argIdx)
	args = append(args, chatID)

	_, err := h.db.Exec(query, args...)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to update chat details"})
		return
	}
	// We might need to broadcast a chat update event later?
	c.JSON(200, gin.H{"success": true})
}

func (h *Handler) GetInviteLink(c *gin.Context) {
	chatID := c.Param("id")

	var inviteToken sql.NullString
	err := h.db.QueryRow(`SELECT invite_token FROM chats WHERE id = $1`, chatID).Scan(&inviteToken)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Chat not found"})
		return
	}

	token := inviteToken.String
	if token == "" {
		b := make([]byte, 16)
		rand.Read(b)
		token = hex.EncodeToString(b)
		_, err = h.db.Exec(`UPDATE chats SET invite_token = $1 WHERE id = $2`, token, chatID)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Failed to generate token"})
			return
		}
	}

	c.JSON(200, gin.H{"success": true, "data": map[string]string{"token": token}})
}

func (h *Handler) PreviewInvite(c *gin.Context) {
	token := c.Param("token")
	var id int
	var name sql.NullString
	var avatarUrl sql.NullString
	var count int

	query := `
		SELECT c.id, c.name, c.avatar_url, (SELECT COUNT(*) FROM chat_participants WHERE chat_id = c.id) 
		FROM chats c WHERE invite_token = $1
	`
	err := h.db.QueryRow(query, token).Scan(&id, &name, &avatarUrl, &count)
	if err != nil {
		c.JSON(404, gin.H{"success": false, "error": "Invite not found"})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"id":                 id,
			"name":               name.String,
			"avatar_url":         avatarUrl.String,
			"participants_count": count,
		},
	})
}

func (h *Handler) JoinByInvite(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)
	token := c.Param("token")

	var chatID int
	err := h.db.QueryRow(`SELECT id FROM chats WHERE invite_token = $1`, token).Scan(&chatID)
	if err != nil {
		c.JSON(404, gin.H{"success": false, "error": "Invite not found"})
		return
	}

	_, err = h.db.Exec(`INSERT INTO chat_participants (chat_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`, chatID, userID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to join chat"})
		return
	}
	c.JSON(200, gin.H{"success": true, "data": map[string]int{"chat_id": chatID}})
}

func (h *Handler) GetOrCreateDirectChat(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)

	var req struct {
		UserID int `json:"user_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": err.Error()})
		return
	}

	if userID == req.UserID {
		c.JSON(400, gin.H{"success": false, "error": "Cannot chat with yourself"})
		return
	}

	var chatID int
	checkChatQuery := `
		SELECT c.id FROM chats c
		JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = $1
		JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = $2
		WHERE c.type = 'direct'
		LIMIT 1
	`
	err := h.db.QueryRow(checkChatQuery, userID, req.UserID).Scan(&chatID)
	if err == sql.ErrNoRows {
		// Создаем новый P2P чат
		err = h.db.QueryRow(`INSERT INTO chats (type, created_at, last_message_at) VALUES ('direct', NOW(), NOW()) RETURNING id`).Scan(&chatID)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Failed to create chat"})
			return
		}
		// Добавляем участников
		_, err = h.db.Exec(`INSERT INTO chat_participants (chat_id, user_id, role) VALUES ($1, $2, 'member'), ($1, $3, 'member')`, chatID, userID, req.UserID)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Failed to add participants"})
			return
		}
	} else if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "data": map[string]int{"chat_id": chatID}})
}

// DeleteChat - мягкое удаление чата для юзера, либо жесткое удаление для админа группы
func (h *Handler) DeleteChat(c *gin.Context) {
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	userID := userIDInterface.(int)
	chatID := c.Param("id")

	// Проверяем тип чата и права
	var chatType string
	var creatorID sql.NullInt64
	var lastMessageID sql.NullInt64
	err := h.db.QueryRow(`SELECT type, creator_id, last_message_id FROM chats WHERE id = $1`, chatID).Scan(&chatType, &creatorID, &lastMessageID)
	if err == sql.ErrNoRows {
		c.JSON(404, gin.H{"success": false, "error": "Chat not found"})
		return
	} else if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	if chatType == "group" && creatorID.Valid && int(creatorID.Int64) == userID {
		// Админ удаляет групповой чат целиком
		_, err := h.db.Exec(`DELETE FROM chats WHERE id = $1`, chatID)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Failed to delete group chat"})
			return
		}
	} else {
		// Участник удаляет личный чат или группу у себя (Soft delete)
		hiddenMsgID := 0
		if lastMessageID.Valid {
			hiddenMsgID = int(lastMessageID.Int64)
		} else {
			// Чат пустой. Прячем полностью
			hiddenMsgID = 2147483647
		}

		forAll := c.Query("for_all") == "true"

		if forAll && chatType == "direct" {
			// Удаляем у обоих (soft delete for all)
			_, err = h.db.Exec(`UPDATE chat_participants SET hidden_until_msg_id = $1, last_read_message_id = $1 WHERE chat_id = $2`, hiddenMsgID, chatID)
		} else {
			// Удаляем только у себя
			_, err = h.db.Exec(`UPDATE chat_participants SET hidden_until_msg_id = $1, last_read_message_id = $1 WHERE chat_id = $2 AND user_id = $3`, hiddenMsgID, chatID, userID)
		}
		
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Failed to hide chat"})
			return
		}
	}

	c.JSON(200, gin.H{"success": true})
}
