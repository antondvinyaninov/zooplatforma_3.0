package auth

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"net/smtp"

	"github.com/zooplatforma/backend/internal/shared/config"
)

type Mailer struct {
	config *config.Config
}

func NewMailer(cfg *config.Config) *Mailer {
	return &Mailer{config: cfg}
}

// SendPasswordResetEmail отправляет HTML письмо со ссылкой на сброс
func (m *Mailer) SendPasswordResetEmail(toEmail, firstName, token string) error {
	if m.config.SMTP.Host == "" || m.config.SMTP.User == "" {
		return fmt.Errorf("SMTP configuration is missing, emails are disabled")
	}

	// Ссылка на восстановление пароля:
	// TODO: возможно нужно заменить zooplatforma.ru на localhost если это dev
	resetLink := "https://zooplatforma.ru/reset-password?token=" + token

	subject := "Восстановление пароля - ЗооПлатформа"
	
	htmlBody := `
	<!DOCTYPE html>
	<html>
	<body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
		<div style="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm text-center">
			<h2 style="color: #111827; margin-bottom: 20px;">Здравствуйте, ` + firstName + `!</h2>
			<p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
				Мы получили запрос на сброс пароля для вашей учетной записи на ЗооПлатформе.<br>
				Нажмите на кнопку ниже, чтобы установить новый пароль:
			</p>
			<a href="` + resetLink + `" style="display: inline-block; background-color: #1B76FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
				Восстановить пароль
			</a>
			<p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
				Если это были не вы, просто проигнорируйте это письмо.<br>
				Ссылка действительна в течение 1 часа.
			</p>
		</div>
	</body>
	</html>
	`

	return m.sendHTMLMail(toEmail, subject, htmlBody)
}

func (m *Mailer) sendHTMLMail(to, subject, htmlBody string) error {
	// Для Яндекса SSL/TLS подключение на порт 465
	tlsconfig := &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         m.config.SMTP.Host,
	}

	conn, err := tls.Dial("tcp", fmt.Sprintf("%s:%d", m.config.SMTP.Host, m.config.SMTP.Port), tlsconfig)
	if err != nil {
		return fmt.Errorf("TLS dial failed: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, m.config.SMTP.Host)
	if err != nil {
		return fmt.Errorf("SMTP client failed: %w", err)
	}
	defer client.Quit()

	auth := smtp.PlainAuth("", m.config.SMTP.User, m.config.SMTP.Pass, m.config.SMTP.Host)
	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP auth failed: %w", err)
	}

	if err = client.Mail(m.config.SMTP.From); err != nil {
		return fmt.Errorf("SMTP mail from failed: %w", err)
	}

	if err = client.Rcpt(to); err != nil {
		return fmt.Errorf("SMTP rcpt to failed: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("SMTP data check failed: %w", err)
	}

	// Формируем MIME заголовки
	msg := &bytes.Buffer{}
	msg.WriteString(fmt.Sprintf("From: %s\r\n", m.config.SMTP.From))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", to))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	msg.WriteString("MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\r\n\r\n")
	msg.WriteString(htmlBody)

	_, err = w.Write(msg.Bytes())
	if err != nil {
		return err
	}
	
	err = w.Close()
	return err
}
