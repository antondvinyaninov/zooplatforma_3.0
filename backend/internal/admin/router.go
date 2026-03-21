package admin

import (
	"database/sql"

	"github.com/gin-gonic/gin"
	"github.com/zooplatforma/backend/internal/admin/activity"
	"github.com/zooplatforma/backend/internal/admin/moderation"
	"github.com/zooplatforma/backend/internal/admin/monitoring"
	"github.com/zooplatforma/backend/internal/admin/support"
	"github.com/zooplatforma/backend/internal/shared/auth"
	"github.com/zooplatforma/backend/internal/shared/config"
)

func SetupRoutes(r *gin.RouterGroup, db *sql.DB, cfg *config.Config) {
	authHandler := auth.NewHandler(db, cfg)
	moderationHandler := moderation.NewHandler(db)
	monitoringHandler := monitoring.NewHandler(db)
	activityHandler := activity.NewHandler(db)
	supportHandler := support.NewHandler(db, cfg)

	// Auth routes
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/login", authHandler.Login)
		authGroup.GET("/me", authHandler.Me)
	}

	// Activity routes
	activityGroup := r.Group("/activity")
	{
		activityGroup.GET("/stats", activityHandler.GetActivityStats)
	}

	// User activity logs routes
	userActivityGroup := r.Group("/user-activity")
	{
		userActivityGroup.GET("", activityHandler.GetUserActivityLogs)
		userActivityGroup.GET("/stats", activityHandler.GetUserActivityStats)
		userActivityGroup.GET("/user/:id", activityHandler.GetUserActivityByUserID)
	}

	// Admin logs routes
	logs := r.Group("/logs")
	{
		logs.GET("", activityHandler.GetAdminLogs)
		logs.GET("/stats", activityHandler.GetAdminLogsStats)
	}

	// Moderation routes
	moderationGroup := r.Group("/moderation")
	{
		moderationGroup.GET("/reports", moderationHandler.GetReports)
		moderationGroup.PUT("/reports/:id", moderationHandler.ReviewReport)
		moderationGroup.GET("/stats", moderationHandler.GetStats)
	}

	// Monitoring routes
	monitoringGroup := r.Group("/monitoring")
	{
		monitoringGroup.GET("/errors", monitoringHandler.GetErrorLogs)
		monitoringGroup.GET("/metrics", monitoringHandler.GetMetrics)
		monitoringGroup.GET("/error-stats", monitoringHandler.GetErrorStats)
	}

	// Support messages routes
	supportGroup := r.Group("/support")
	{
		supportGroup.GET("", supportHandler.GetMessages)
		supportGroup.GET("/:id", supportHandler.GetMessageByID)
		supportGroup.PUT("/:id/status", supportHandler.UpdateMessageStatus)
		supportGroup.PUT("/:id/notes", supportHandler.UpdateMessageNotes)
		supportGroup.POST("/:id/comments", supportHandler.AddMessageComment)
	}
}
