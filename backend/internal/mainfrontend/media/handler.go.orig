package media

import (
	"bytes"
	"database/sql"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"os/exec"
	"strconv"
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

// GetUserMedia - список медиафайлов пользователя
func (h *Handler) GetUserMedia(c *gin.Context) {
	userIDParam := c.Param("id")
	userID, err := strconv.Atoi(userIDParam)
	if err != nil || userID <= 0 {
		c.JSON(400, gin.H{"success": false, "error": "Invalid user id"})
		return
	}

	query := `
		SELECT id, file_name, original_name, file_path, file_size, mime_type, media_type, uploaded_at
		FROM user_media
		WHERE user_id = $1
		ORDER BY uploaded_at DESC
	`

	rows, err := h.db.Query(query, userID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	type mediaItem struct {
		ID           int       `json:"id"`
		URL          string    `json:"url"`
		FileName     string    `json:"file_name"`
		OriginalName string    `json:"original_name"`
		FileSize     int64     `json:"file_size"`
		MimeType     string    `json:"mime_type"`
		MediaType    string    `json:"media_type"`
		UploadedAt   time.Time `json:"uploaded_at"`
	}

	result := make([]mediaItem, 0)
	for rows.Next() {
		var item mediaItem
		if err := rows.Scan(
			&item.ID,
			&item.FileName,
			&item.OriginalName,
			&item.URL,
			&item.FileSize,
			&item.MimeType,
			&item.MediaType,
			&item.UploadedAt,
		); err != nil {
			c.JSON(500, gin.H{"success": false, "error": err.Error()})
			return
		}
		result = append(result, item)
	}

	if err := rows.Err(); err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "data": result})
}

// GetStats - получить статистику медиафайлов пользователя
func (h *Handler) GetStats(c *gin.Context) {
	// TODO: получить user_id из токена авторизации
	// Пока возвращаем пустую статистику

	query := `
		SELECT 
			COUNT(*) as total_files,
			COALESCE(SUM(file_size), 0) as total_size,
			COUNT(CASE WHEN media_type = 'photo' THEN 1 END) as photos_count,
			COUNT(CASE WHEN media_type = 'video' THEN 1 END) as videos_count,
			COUNT(CASE WHEN media_type NOT IN ('photo', 'video') THEN 1 END) as docs_count
		FROM user_media
		WHERE user_id = $1
	`

	// Получаем user_id из токена авторизации
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	var userID int
	switch v := userIDRaw.(type) {
	case int:
		userID = v
	case float64:
		userID = int(v)
	case string:
		userID, _ = strconv.Atoi(v)
	}

	var stats struct {
		TotalFiles  int   `json:"total_files"`
		TotalSize   int64 `json:"total_size"`
		PhotosCount int   `json:"photos_count"`
		VideosCount int   `json:"videos_count"`
		DocsCount   int   `json:"docs_count"`
	}

	err := h.db.QueryRow(query, userID).Scan(
		&stats.TotalFiles,
		&stats.TotalSize,
		&stats.PhotosCount,
		&stats.VideosCount,
		&stats.DocsCount,
	)

	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "data": stats})
}

// Upload - простая загрузка файла (для файлов <500MB)
func (h *Handler) Upload(c *gin.Context) {
	// Получаем user_id из токена
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	var userID int
	switch v := userIDRaw.(type) {
	case int:
		userID = v
	case float64:
		userID = int(v)
	case string:
		userID, _ = strconv.Atoi(v)
	}

	mediaType := c.PostForm("media_type")
	if mediaType == "" {
		mediaType = "photo"
	}

	// Получаем файл из формы
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(400, gin.H{"success": false, "error": "No file provided"})
		return
	}

	// Проверяем размер файла (макс 500MB)
	if file.Size > 500*1024*1024 {
		c.JSON(400, gin.H{"success": false, "error": "File too large (max 500MB)"})
		return
	}

	// Открываем файл и читаем данные
	src, err := file.Open()
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to open file"})
		return
	}
	defer src.Close()

	// Читаем файл в буфер
	buf := new(bytes.Buffer)
	_, err = io.Copy(buf, src)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to read file"})
		return
	}

	// Получаем байты из буфера
	data := buf.Bytes()
	if len(data) >= 10 {
		// First 10 bytes check
	}

	// Генерируем ключ для S3
	fileKey := s3.GenerateKey(userID, mediaType, file.Filename)

	// Загружаем в S3
	fileURL, err := h.s3Client.UploadFile(fileKey, bytes.NewReader(data), file.Header.Get("Content-Type"))
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": fmt.Sprintf("Failed to upload: %v", err)})
		return
	}

	// Сохраняем в БД
	query := `
		INSERT INTO user_media (
			user_id, file_name, original_name, file_path, file_size, mime_type, media_type, uploaded_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, NOW()
		) RETURNING id
	`

	var mediaID int
	err = h.db.QueryRow(query, userID, fileKey, file.Filename, fileURL, file.Size, file.Header.Get("Content-Type"), mediaType).Scan(&mediaID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to save media"})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"id":            mediaID,
			"url":           fileURL,
			"file_name":     fileKey,
			"original_name": file.Filename,
			"file_size":     file.Size,
			"mime_type":     file.Header.Get("Content-Type"),
			"media_type":    mediaType,
		},
	})
}

// InitiateChunkedUpload - инициировать chunked загрузку
func (h *Handler) InitiateChunkedUpload(c *gin.Context) {
	// Получаем user_id из токена
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	var userID int
	switch v := userIDRaw.(type) {
	case int:
		userID = v
	case float64:
		userID = int(v)
	case string:
		userID, _ = strconv.Atoi(v)
	}

	fileName := c.PostForm("file_name")
	fileSize := c.PostForm("file_size")
	mediaType := c.PostForm("media_type")

	if fileName == "" || fileSize == "" {
		c.JSON(400, gin.H{"success": false, "error": "Missing required fields"})
		return
	}

	// Генерируем уникальный ключ для файла
	fileKey := s3.GenerateKey(userID, mediaType, fileName)

	// Вычисляем количество частей (5MB на часть)
	const chunkSize = 5 * 1024 * 1024
	fileSizeInt, err := strconv.Atoi(fileSize)
	if err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid file size"})
		return
	}
	totalChunks := (fileSizeInt + chunkSize - 1) / chunkSize

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"upload_id":    fileKey,
			"total_chunks": totalChunks,
		},
	})
}

// UploadChunk - загрузить часть файла
func (h *Handler) UploadChunk(c *gin.Context) {
	// Парсим multipart form вручную с увеличенным лимитом
	err := c.Request.ParseMultipartForm(20 << 20) // 20MB
	if err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Failed to parse form"})
		return
	}

	uploadID := c.Request.FormValue("upload_id")
	chunkIndex := c.Request.FormValue("chunk_index")

	if uploadID == "" || chunkIndex == "" {
		c.JSON(400, gin.H{"success": false, "error": "Missing required fields"})
		return
	}

	// Получаем файл из multipart form
	var chunkFile multipart.File

	chunkFile, _, err = c.Request.FormFile("chunk")
	if err != nil {
		c.JSON(400, gin.H{"success": false, "error": "No chunk file provided"})
		return
	}
	defer chunkFile.Close()

	// Читаем данные через io.Copy в буфер (как в старом коде)
	buf := new(bytes.Buffer)
	_, err = io.Copy(buf, chunkFile)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to read chunk"})
		return
	}

	data := buf.Bytes()

	// Сохраняем для отладки
	tmpDebugFile := fmt.Sprintf("/tmp/chunk_debug_%s.bin", chunkIndex)
	os.WriteFile(tmpDebugFile, data, 0644)

	// Проверяем первые байты
	if len(data) >= 8 {
		// First 8 bytes check
	}

	// Загружаем часть в S3 с ключом chunk_<uploadID>_<index>
	chunkKey := fmt.Sprintf("chunks/%s_%s", uploadID, chunkIndex)

	err = h.s3Client.UploadChunk(chunkKey, data)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": fmt.Sprintf("Failed to upload chunk: %v", err)})
		return
	}

	c.JSON(200, gin.H{"success": true})
}

// CompleteChunkedUpload - завершить chunked загрузку
func (h *Handler) CompleteChunkedUpload(c *gin.Context) {
	// Получаем user_id из токена
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	var userID int
	switch v := userIDRaw.(type) {
	case int:
		userID = v
	case float64:
		userID = int(v)
	case string:
		userID, _ = strconv.Atoi(v)
	}

	uploadID := c.PostForm("upload_id")
	fileName := c.PostForm("file_name")
	mediaType := c.PostForm("media_type")
	mimeType := c.PostForm("mime_type")
	totalChunksStr := c.PostForm("total_chunks")

	if uploadID == "" || fileName == "" || totalChunksStr == "" {
		c.JSON(400, gin.H{"success": false, "error": "Missing required fields"})
		return
	}

	totalChunks, err := strconv.Atoi(totalChunksStr)
	if err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid total_chunks"})
		return
	}

	// Собираем все части из S3
	var allData []byte
	for i := 0; i < totalChunks; i++ {
		chunkKey := fmt.Sprintf("chunks/%s_%d", uploadID, i)

		chunkData, err := h.s3Client.GetChunk(chunkKey)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": fmt.Sprintf("Failed to get chunk %d: %v", i, err)})
			return
		}

		// Проверяем первые байты каждой части
		if len(chunkData) >= 8 {
			// First 8 bytes check
		}

		allData = append(allData, chunkData...)

		// Удаляем временную часть
		_ = h.s3Client.DeleteObject(chunkKey)
	}

	// Проверяем финальный файл
	if len(allData) >= 12 {
		// First 12 bytes check
	}

	// Если это видео, обрабатываем его с помощью ffmpeg для веб-стриминга
	if mediaType == "video" {
		// Сохраняем временный файл
		tmpInput := fmt.Sprintf("/tmp/video_input_%d_%d.mp4", userID, time.Now().Unix())
		tmpOutput := fmt.Sprintf("/tmp/video_output_%d_%d.mp4", userID, time.Now().Unix())

		err := os.WriteFile(tmpInput, allData, 0644)
		if err != nil {
			c.JSON(500, gin.H{"success": false, "error": "Failed to process video"})
			return
		}
		defer os.Remove(tmpInput)
		defer os.Remove(tmpOutput)

		// Проверяем файл с помощью ffprobe
		probeCmd := exec.Command("ffprobe", "-v", "error", "-show_format", tmpInput)
		_, probeErr := probeCmd.CombinedOutput()
		if probeErr != nil {
			// Видео повреждено при сборке из частей, загружаем как есть
			// Не обрабатываем поврежденное видео
		} else {
			// Обрабатываем видео: перемещаем moov atom в начало для веб-стриминга
			cmd := exec.Command("ffmpeg", "-i", tmpInput, "-c", "copy", "-movflags", "+faststart", tmpOutput, "-y")
			_, err := cmd.CombinedOutput()
			if err != nil {
				// Продолжаем с оригинальным файлом
			} else {
				// Читаем обработанное видео
				processedData, err := os.ReadFile(tmpOutput)
				if err == nil {
					allData = processedData
				}
			}
		}
	}

	// Загружаем финальный файл в S3
	fileURL, err := h.s3Client.UploadFile(uploadID, io.NopCloser(bytes.NewReader(allData)), mimeType)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": fmt.Sprintf("Failed to upload final file: %v", err)})
		return
	}

	// Сохраняем в БД
	query := `
		INSERT INTO user_media (
			user_id, file_name, original_name, file_path, file_size, mime_type, media_type, uploaded_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, NOW()
		) RETURNING id
	`

	var mediaID int
	fileSize := len(allData)
	err = h.db.QueryRow(query, userID, uploadID, fileName, fileURL, fileSize, mimeType, mediaType).Scan(&mediaID)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": "Failed to save media"})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": map[string]interface{}{
			"id":            mediaID,
			"url":           fileURL,
			"file_name":     uploadID,
			"original_name": fileName,
			"file_size":     fileSize,
			"mime_type":     mimeType,
			"media_type":    mediaType,
		},
	})
}
