package support

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/zooplatforma/backend/internal/shared/auth"
	"github.com/zooplatforma/backend/internal/shared/config"
)

type Handler struct {
	db     *sql.DB
	mailer *auth.Mailer
}

func NewHandler(db *sql.DB, cfg *config.Config) *Handler {
	return &Handler{
		db:     db,
		mailer: auth.NewMailer(cfg),
	}
}

type SupportMessage struct {
	ID            int        `json:"id"`
	Name          string     `json:"name"`
	Email         string     `json:"email"`
	Topic         string     `json:"topic"`
	Message       string     `json:"message"`
	AttachmentURL *string    `json:"attachment_url"`
	AdminNotes    *string    `json:"admin_notes"`
	Status        string                   `json:"status"`
	CreatedAt     time.Time                `json:"created_at"`
	UpdatedAt     time.Time                `json:"updated_at"`
	Comments      []SupportMessageComment  `json:"comments,omitempty"`
}

type SupportMessageComment struct {
	ID         int       `json:"id"`
	MessageID  int       `json:"message_id"`
	Comment    string    `json:"comment"`
	AdminEmail string    `json:"admin_email"`
	IsPublic   bool      `json:"is_public"`
	CreatedAt  time.Time `json:"created_at"`
}

// GetMessages - получить все обращения для админов
func (h *Handler) GetMessages(c *gin.Context) {
	query := `
		SELECT id, name, email, topic, message, attachment_url, admin_notes, status, created_at, updated_at 
		FROM support_messages 
		ORDER BY created_at DESC
	`
	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch messages"})
		return
	}
	defer rows.Close()

	var messages []SupportMessage
	for rows.Next() {
		var msg SupportMessage
		if err := rows.Scan(
			&msg.ID, &msg.Name, &msg.Email, &msg.Topic, &msg.Message, 
			&msg.AttachmentURL, &msg.AdminNotes, &msg.Status, &msg.CreatedAt, &msg.UpdatedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Error scanning message row"})
			return
		}
		messages = append(messages, msg)
	}

	if messages == nil {
		messages = []SupportMessage{}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": messages})
}

// GetMessageByID - получить детали обращения
func (h *Handler) GetMessageByID(c *gin.Context) {
	id := c.Param("id")

	var msg SupportMessage
	err := h.db.QueryRow(`
		SELECT id, name, email, topic, message, attachment_url, admin_notes, status, created_at, updated_at 
		FROM support_messages 
		WHERE id = $1
	`, id).Scan(
		&msg.ID, &msg.Name, &msg.Email, &msg.Topic, &msg.Message, 
		&msg.AttachmentURL, &msg.AdminNotes, &msg.Status, &msg.CreatedAt, &msg.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Message not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch message details"})
		return
	}

	// Получаем комментарии к этому сообщению
	rows, err := h.db.Query(`
		SELECT id, message_id, comment, admin_email, is_public, created_at
		FROM support_message_comments
		WHERE message_id = $1
		ORDER BY created_at ASC
	`, id)
	
	if err == nil {
		defer rows.Close()
		msg.Comments = []SupportMessageComment{}
		for rows.Next() {
			var comment SupportMessageComment
			if err := rows.Scan(
				&comment.ID, &comment.MessageID, &comment.Comment, 
				&comment.AdminEmail, &comment.IsPublic, &comment.CreatedAt,
			); err == nil {
				msg.Comments = append(msg.Comments, comment)
			}
		}
	} else {
		// Даже если не смогли получить комментарии, отдаем сообщение
		msg.Comments = []SupportMessageComment{}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": msg})
}

// UpdateMessageStatus - обновить статус обращения
func (h *Handler) UpdateMessageStatus(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	// Валидация статусов
	validStatuses := map[string]bool{
		"new":         true,
		"in_progress": true,
		"resolved":    true,
		"closed":      true,
	}

	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid status"})
		return
	}

	res, err := h.db.Exec(`
		UPDATE support_messages 
		SET status = $1, updated_at = NOW() 
		WHERE id = $2
	`, req.Status, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to update status"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Message not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Status updated successfully"})
}

// UpdateMessageNotes - обновить внутренние комментарии администратора
func (h *Handler) UpdateMessageNotes(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Notes string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	res, err := h.db.Exec(`
		UPDATE support_messages 
		SET admin_notes = $1, updated_at = NOW() 
		WHERE id = $2
	`, req.Notes, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to update notes"})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Message not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Notes updated successfully"})
}

// AddMessageComment - добавить запись в ленту комментариев заявки
func (h *Handler) AddMessageComment(c *gin.Context) {
	id := c.Param("id")

	// Предполагается, что в Admin API мы можем получить email админа из контекста (через auth middleware)
	// Пока для простоты мы ожидаем его в JSON (или можно вытащить из c.Get("user_email"))
	var req struct {
		Comment    string `json:"comment"`
		AdminEmail string `json:"admin_email"`
		IsPublic   bool   `json:"is_public"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid request"})
		return
	}

	if req.Comment == "" || req.AdminEmail == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Comment and admin_email are required"})
		return
	}

	var commentID int
	err := h.db.QueryRow(`
		INSERT INTO support_message_comments (message_id, comment, admin_email, is_public, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id
	`, id, req.Comment, req.AdminEmail, req.IsPublic).Scan(&commentID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to app comment"})
		return
	}

	// Если комментарий публичный, отправляем email пользователю
	if req.IsPublic {
		var userEmail, userName, topic string
		var ticketID int
		err := h.db.QueryRow(`
			SELECT id, email, name, topic 
			FROM support_messages 
			WHERE id = $1
		`, id).Scan(&ticketID, &userEmail, &userName, &topic)
		
		if err == nil {
			// Отправляем письмо синхронно, чтобы админ увидел ошибку, если почта не работает
			errMail := h.mailer.SendSupportReplyEmail(userEmail, userName, topic, req.Comment, ticketID)
			if errMail != nil {
				// Если письмо не ушло, удаляем комментарий, чтобы не было путаницы
				h.db.Exec("DELETE FROM support_message_comments WHERE id = $1", commentID)
				c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Ошибка при отправке email пользователю: " + errMail.Error()})
				return
			}

			// Также попробуем отправить во внутренний мессенджер
			go func() {
				var adminID, targetUserID int
				errAdmin := h.db.QueryRow("SELECT id FROM users WHERE email = $1", req.AdminEmail).Scan(&adminID)
				errUser := h.db.QueryRow("SELECT id FROM users WHERE email = $1", userEmail).Scan(&targetUserID)

				if errAdmin == nil && errUser == nil && adminID != targetUserID {
					// Ищем чат
					var chatID int
					errChat := h.db.QueryRow(`
						SELECT id FROM chats 
						WHERE (user1_id = $1 AND user2_id = $2) 
						   OR (user1_id = $2 AND user2_id = $1)
						LIMIT 1
					`, adminID, targetUserID).Scan(&chatID)

					if errChat == sql.ErrNoRows {
						h.db.QueryRow(`
							INSERT INTO chats (user1_id, user2_id, created_at)
							VALUES ($1, $2, NOW()) RETURNING id
						`, adminID, targetUserID).Scan(&chatID)
					}

					if chatID > 0 {
						chatMsg := fmt.Sprintf("Официальный ответ поддержки на обращение #%d («%s»):\n\n%s", ticketID, topic, req.Comment)
						h.db.Exec(`
							INSERT INTO messages (chat_id, sender_id, receiver_id, content, created_at)
							VALUES ($1, $2, $3, $4, NOW())
						`, chatID, adminID, targetUserID, chatMsg)

						h.db.Exec("UPDATE chats SET last_message_at = NOW() WHERE id = $1", chatID)
					}
				}
			}()
		}
	}

	// Для удобства возвращаем созданный объект обратно на фронт, если нужно
	var newComment SupportMessageComment
	_ = h.db.QueryRow(`
		SELECT id, message_id, comment, admin_email, is_public, created_at 
		FROM support_message_comments 
		WHERE id = $1
	`, commentID).Scan(
		&newComment.ID, &newComment.MessageID, &newComment.Comment, 
		&newComment.AdminEmail, &newComment.IsPublic, &newComment.CreatedAt,
	)

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Comment added successfully", "data": newComment})
}

