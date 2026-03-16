package s3

import (
	"bytes"
	"fmt"
	"io"
	"path/filepath"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/zooplatforma/backend/internal/shared/config"
)

type Client struct {
	s3Client   *s3.S3
	bucketName string
	endpoint   string
}

func NewClient(cfg *config.Config) (*Client, error) {
	// FirstVDS использует path-style: https://s3.firstvds.ru/bucket/key
	endpoint := fmt.Sprintf("https://%s", cfg.S3.Endpoint)

	sess, err := session.NewSession(&aws.Config{
		Endpoint:                      aws.String(endpoint),
		Region:                        aws.String(cfg.S3.Region),
		Credentials:                   credentials.NewStaticCredentials(cfg.S3.AccessKeyID, cfg.S3.SecretAccessKey, ""),
		S3ForcePathStyle:              aws.Bool(true), // Path-style для FirstVDS
		DisableSSL:                    aws.Bool(false),
		S3DisableContentMD5Validation: aws.Bool(true),
	})
	if err != nil {
		return nil, err
	}

	return &Client{
		s3Client:   s3.New(sess),
		bucketName: cfg.S3.BucketName,
		endpoint:   cfg.S3.Endpoint,
	}, nil
}

// UploadFile загружает файл в S3
func (c *Client) UploadFile(key string, data io.Reader, contentType string) (string, error) {
	// Преобразуем io.Reader в io.ReadSeeker
	var body io.ReadSeeker
	if rs, ok := data.(io.ReadSeeker); ok {
		body = rs
	} else {
		// Читаем все данные в память
		buf, err := io.ReadAll(data)
		if err != nil {
			return "", err
		}
		body = bytes.NewReader(buf)
	}

	result, err := c.s3Client.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(c.bucketName),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
		ACL:         aws.String("public-read"),
	})
	if err != nil {
		return "", err
	}

	_ = result

	// Возвращаем публичный URL
	url := fmt.Sprintf("https://%s.%s/%s", c.bucketName, c.endpoint, key)
	return url, nil
}

// UploadChunk загружает часть файла
func (c *Client) UploadChunk(key string, data []byte) error {
	input := &s3.PutObjectInput{
		Bucket: aws.String(c.bucketName),
		Key:    aws.String(key),
		Body:   bytes.NewReader(data),
		ACL:    aws.String("public-read"),
	}

	result, err := c.s3Client.PutObject(input)
	if err != nil {
		return err
	}

	_ = result
	return nil
}

// GetChunk получает часть файла
func (c *Client) GetChunk(key string) ([]byte, error) {
	result, err := c.s3Client.GetObject(&s3.GetObjectInput{
		Bucket: aws.String(c.bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}
	defer result.Body.Close()

	return io.ReadAll(result.Body)
}

// DeleteObject удаляет объект из S3
func (c *Client) DeleteObject(key string) error {
	_, err := c.s3Client.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(c.bucketName),
		Key:    aws.String(key),
	})
	return err
}

// GenerateKey генерирует уникальный ключ для файла
func GenerateKey(userID int, mediaType, fileName string) string {
	timestamp := time.Now().Unix()
	ext := filepath.Ext(fileName)
	return fmt.Sprintf("users/%d/%s/%d%s", userID, mediaType, timestamp, ext)
}
