package telegram

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

type Notifier struct {
	Token  string
	ChatID string
}

func NewNotifier(token, chatID string) *Notifier {
	return &Notifier{
		Token:  token,
		ChatID: chatID,
	}
}

type telegramMessage struct {
	ChatID    string `json:"chat_id"`
	Text      string `json:"text"`
	ParseMode string `json:"parse_mode,omitempty"`
}

// SendMessage отправляет произвольное сообщение в Telegram
func (n *Notifier) SendMessage(message string) error {
	if n.Token == "" || n.ChatID == "" {
		return fmt.Errorf("попытка отправить сообщение без Telegram Token или ChatID")
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", n.Token)

	msg := telegramMessage{
		ChatID:    n.ChatID,
		Text:      message,
		ParseMode: "HTML",
	}

	body, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("ошибка сериализации сообщения Telegram: %v", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("ошибка создания запроса Telegram: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("ошибка отправки запроса в Telegram: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("ошибка от Telegram API, статус: %d", resp.StatusCode)
	}

	return nil
}

// NotifyNewUser отправляет красивое уведомление о новом пользователе в систему
func (n *Notifier) NotifyNewUser(name, email string, userID int) {
	message := fmt.Sprintf(
		"🆕 <b>Новая регистрация!</b>\n\n"+
			"👤 <b>Имя:</b> %s\n"+
			"📧 <b>Email:</b> %s\n"+
			"💼 <b>ID:</b> %d",
		name, email, userID,
	)

	// Выполняем асинхронно, логируя возможную ошибку
	go func() {
		err := n.SendMessage(message)
		if err != nil {
			log.Printf("[Telegram] Ошибка отправки уведомления: %v", err)
		}
	}()
}
