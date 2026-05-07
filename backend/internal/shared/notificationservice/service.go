package notificationservice

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/zooplatforma/backend/internal/shared/websocket"
)

// Service отвечает за создание уведомлений в БД и пуш в WebSockets.
type Service struct {
	db  *sql.DB
	hub *websocket.Hub
}

// New создает новый экземпляр сервиса.
func New(db *sql.DB, hub *websocket.Hub) *Service {
	return &Service{
		db:  db,
		hub: hub,
	}
}

// WSNotificationEvent - структура события отправляемого по сокету
type WSNotificationEvent struct {
	Type           string `json:"type"`            // "new_notification"
	NotificationID int    `json:"notification_id"` // ID созданного уведомления
}

// Notify отправляет базовое уведомление пользователю
func (s *Service) Notify(ctx context.Context, userID int, notifType string, actorID *int, entityType string, entityID *int, message string) error {
	// Не отправляем уведомления самому себе (например, когда пользователь лайкает свой пост)
	if actorID != nil && *actorID == userID {
		return nil
	}

	var nID int
	// Записываем уведомление в базу
	err := s.db.QueryRowContext(ctx, `
		INSERT INTO notifications (user_id, type, actor_id, entity_type, entity_id, message, is_read, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
		RETURNING id
	`, userID, notifType, actorID, entityType, entityID, message).Scan(&nID)

	if err != nil {
		return fmt.Errorf("failed to insert notification: %w", err)
	}

	// Отправляем real-time event по WebSocket, если клиент онлайн
	if s.hub != nil {
		event := WSNotificationEvent{
			Type:           "new_notification",
			NotificationID: nID,
		}
		if eventBytes, err := json.Marshal(event); err == nil {
			s.hub.SendToUser(userID, eventBytes)
		}
	}

	return nil
}

// Хелперы для типичных уведомлений:

func (s *Service) NotifyNewFollower(ctx context.Context, targetUserID int, followerID int, followerName string) error {
	msg := fmt.Sprintf("%s подписался на ваши обновления", followerName)
	return s.Notify(ctx, targetUserID, "new_follower", &followerID, "user", &followerID, msg)
}

func (s *Service) NotifyNewLike(ctx context.Context, targetUserID int, likerID int, likerName string, entityType string, entityID int) error {
	var suffix string
	switch entityType {
	case "post":
		suffix = "вашу запись"
	case "comment":
		suffix = "ваш комментарий"
	case "pet":
		suffix = "вашего питомца" // если есть лайки питомцев
	default:
		suffix = "вашу публикацию"
	}
	msg := fmt.Sprintf("%s оценил %s", likerName, suffix)
	return s.Notify(ctx, targetUserID, "like", &likerID, entityType, &entityID, msg)
}

func (s *Service) NotifyNewComment(ctx context.Context, targetUserID int, commenterID int, commenterName string, entityType string, entityID int) error {
	msg := fmt.Sprintf("%s прокомментировал вашу запись", commenterName)
	return s.Notify(ctx, targetUserID, "comment", &commenterID, entityType, &entityID, msg)
}

func (s *Service) NotifyRadarSOS(ctx context.Context, targetUserIDs []int, sosID int, title string) error {
	for _, targetUserID := range targetUserIDs {
		// Радар SOS - анонимный или без конкретного actorID (система)
		// Для простоты не используем goroutine для каждого, но в проде можно вынести в bulk insert.
		s.Notify(ctx, targetUserID, "radar_sos", nil, "radar", &sosID, title)
	}
	return nil
}
