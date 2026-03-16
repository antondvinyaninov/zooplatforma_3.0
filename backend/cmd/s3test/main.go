package main

import (
	"bytes"
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	_ "github.com/joho/godotenv/autoload"
	"github.com/zooplatforma/backend/internal/shared/config"
)

func main() {
	cfg := config.Load()

	endpoint := fmt.Sprintf("https://%s", cfg.S3.Endpoint)
	fmt.Println("Endpoint:", endpoint)
	fmt.Println("Region:", cfg.S3.Region)
	fmt.Println("Bucket:", cfg.S3.BucketName)
	fmt.Println("AccessKey:", cfg.S3.AccessKeyID)

	sess, err := session.NewSession(&aws.Config{
		Endpoint:                      aws.String(endpoint),
		Region:                        aws.String(cfg.S3.Region),
		Credentials:                   credentials.NewStaticCredentials(cfg.S3.AccessKeyID, cfg.S3.SecretAccessKey, ""),
		S3ForcePathStyle:              aws.Bool(true),
		DisableSSL:                    aws.Bool(false),
		S3DisableContentMD5Validation: aws.Bool(true),
	})
	if err != nil {
		log.Fatal(err)
	}

	client := s3.New(sess)
	data := []byte("hello world")

	_, err = client.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(cfg.S3.BucketName),
		Key:         aws.String("test/hello.txt"),
		Body:        bytes.NewReader(data),
		ContentType: aws.String("text/plain"),
		ACL:         aws.String("public-read"),
	})

	if err != nil {
		log.Fatalf("❌ PutObject error: %v", err)
	}

	fmt.Println("✅ Success!")
}
