package websocket

import (
	"database/sql"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/zooplatforma/backend/internal/shared/auth"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // В продакшене нужно проверять origin
	},
}

type Client struct {
	conn   *websocket.Conn
	userID int
	send   chan []byte
}

type UserPayload struct {
	UserID  int
	Message []byte
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	sendToUser chan UserPayload
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		sendToUser: make(chan UserPayload),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("WebSocket: клиент подключен (всего: %d)", len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()
			log.Printf("WebSocket: клиент отключен (всего: %d)", len(h.clients))

		case message := <-h.broadcast:
			h.mu.Lock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.Unlock()

		case payload := <-h.sendToUser:
			h.mu.Lock()
			for client := range h.clients {
				if client.userID == payload.UserID {
					select {
					case client.send <- payload.Message:
					default:
						close(client.send)
						delete(h.clients, client)
					}
				}
			}
			h.mu.Unlock()
		}
	}
}

type Handler struct {
	hub *Hub
	db  *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	hub := NewHub()
	go hub.Run()
	return &Handler{
		hub: hub,
		db:  db,
	}
}

func (h *Handler) GetHub() *Hub {
	return h.hub
}

func (h *Hub) SendToUser(userID int, message []byte) {
	h.sendToUser <- UserPayload{UserID: userID, Message: message}
}

func (h *Handler) HandleWebSocket(c *gin.Context) {
	// Получаем токен из query параметра
	token := c.Query("token")
	if token == "" {
		c.JSON(401, gin.H{"error": "No token provided"})
		return
	}

	// Валидируем токен
	claims, err := auth.ValidateToken(token)
	if err != nil {
		c.JSON(401, gin.H{"error": "Invalid or expired token"})
		return
	}
	userID := claims.UserID

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		conn:   conn,
		userID: userID,
		send:   make(chan []byte, 256),
	}

	h.hub.register <- client

	// Запускаем горутины для чтения и записи
	go h.writePump(client)
	go h.readPump(client)
}

func (h *Handler) readPump(client *Client) {
	defer func() {
		h.hub.unregister <- client
		client.conn.Close()
	}()

	for {
		_, message, err := client.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}
		log.Printf("WebSocket message received: %s", message)
		// Здесь можно обрабатывать входящие сообщения
	}
}

func (h *Handler) writePump(client *Client) {
	defer func() {
		client.conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.send:
			if !ok {
				client.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			err := client.conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				return
			}
		}
	}
}
