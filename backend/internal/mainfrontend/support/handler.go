package support

import (
	"bytes"
	"database/sql"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/zooplatforma/backend/internal/shared/s3"
)

type Handler struct {
	db       *sql.DB
	s3Client *s3.Client
}

func NewHandler(db *sql.DB, s3Client *s3.Client) *Handler {
	return &Handler{
		db:       db,
		s3Client: s3Client,
	}
}

// CreateSupportMessage - создать обращение в поддержку
func (h *Handler) CreateSupportMessage(c *gin.Context) {
	// Парсим multipart форму
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 10MB limit
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid form data"})
		return
	}

	name := c.PostForm("name")
	email := c.PostForm("email")
	topic := c.PostForm("topic")
	message := c.PostForm("message")

	// Базовая валидация
	if name == "" || email == "" || message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Name, email and message are required"})
		return
	}

	var attachmentURL *string

	// Проверяем, есть ли прикрепленный файл
	file, err := c.FormFile("attachment")
	if err == nil {
		// Открываем загруженный файл
		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to read attachment"})
			return
		}
		defer src.Close()

		// Читаем в буфер
		buf := new(bytes.Buffer)
		if _, err := io.Copy(buf, src); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to copy attachment"})
			return
		}

		// Генерируем уникальное имя файла для S3 
		// (например: support/12345678_MyScreenshot.png)
		fileKey := fmt.Sprintf("support/%d_%s", time.Now().Unix(), file.Filename)

		// Загружаем в S3 (используем наш внутренний клиент)
		url, uploadErr := h.s3Client.UploadFile(fileKey, bytes.NewReader(buf.Bytes()), file.Header.Get("Content-Type"))
		if uploadErr != nil {
			// Если произошла ошибка с файлом, логируем, но продолжаем отправку
			fmt.Printf("Error uploading support attachment to S3: %v\n", uploadErr)
		} else {
			attachmentURL = &url
		}
	}

	// Создаем обращение
	var messageID int
	err = h.db.QueryRow(`
		INSERT INTO support_messages (name, email, topic, message, attachment_url, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, 'new', NOW(), NOW())
		RETURNING id
	`, name, email, topic, message, attachmentURL).Scan(&messageID)

	if err != nil {
		fmt.Printf("Database error while inserting support message: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to create support message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Support message created successfully",
		"data":    gin.H{"id": messageID},
	})
}
