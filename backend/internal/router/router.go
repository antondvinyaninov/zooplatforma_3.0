package router

import (
	"database/sql"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/zooplatforma/backend/internal/admin"
	"github.com/zooplatforma/backend/internal/mainfrontend"
	"github.com/zooplatforma/backend/internal/owner"
	"github.com/zooplatforma/backend/internal/pethelper"
	"github.com/zooplatforma/backend/internal/petid"
	"github.com/zooplatforma/backend/internal/shared/config"
	"github.com/zooplatforma/backend/internal/shared/middleware"
	"github.com/zooplatforma/backend/internal/shared/oauth"
	"github.com/zooplatforma/backend/internal/shared/websocket"
	"github.com/zooplatforma/backend/internal/zooassistant"
)

func Setup(r *gin.Engine, db *sql.DB, cfg *config.Config) {
	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "https://zooplatforma.ru"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "database": "connected"})
	})

	// WebSocket endpoint
	wsHandler := websocket.NewHandler(db)
	r.GET("/ws", wsHandler.HandleWebSocket)

	// API routes
	api := r.Group("/api")

	// Применяем AuthOptional middleware ко всем API роутам
	// Это позволит получать user_id из токена, но не блокирует публичные запросы
	api.Use(middleware.AuthOptional())

	// Middleware для обновления last_seen
	api.Use(middleware.UpdateLastSeen(db))

	// VK OAuth routes (общие для всех модулей)
	vkHandler := oauth.NewVKHandler(db, cfg)
	authGroup := api.Group("/auth")
	{
		authGroup.GET("/vk/login", vkHandler.Login)
		authGroup.GET("/vk/callback", vkHandler.Callback)
		authGroup.POST("/vk/sdk-callback", vkHandler.SDKCallback)
	}

	// Main frontend routes
	mainfrontend.SetupRoutes(api, db, cfg, wsHandler.GetHub())

	// Admin routes (под префиксом /api/admin)
	adminAPI := api.Group("/admin")
	admin.SetupRoutes(adminAPI, db, cfg)

	// Owner frontend routes (под префиксом /api/owner)
	ownerAPI := api.Group("/owner")
	owner.SetupRoutes(ownerAPI, db, cfg)

	// PetHelper frontend routes (под префиксом /api/pethelper)
	pethelperAPI := api.Group("/pethelper")
	pethelper.SetupRoutes(pethelperAPI, db, cfg)

	// PetID frontend routes (под префиксом /api/petid)
	petidAPI := api.Group("/petid")
	petid.SetupRoutes(petidAPI, db, cfg)

	// ZooAssistant frontend routes (под префиксом /api/zooassistant)
	zooassistantAPI := api.Group("/zooassistant")
	zooassistant.SetupRoutes(zooassistantAPI, db, cfg)

}
