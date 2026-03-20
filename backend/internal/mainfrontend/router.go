package mainfrontend

import (
	"database/sql"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/zooplatforma/backend/internal/mainfrontend/chats"
	"github.com/zooplatforma/backend/internal/mainfrontend/comments"
	"github.com/zooplatforma/backend/internal/mainfrontend/followers"
	"github.com/zooplatforma/backend/internal/mainfrontend/friends"
	"github.com/zooplatforma/backend/internal/mainfrontend/media"
	"github.com/zooplatforma/backend/internal/mainfrontend/notifications"
	"github.com/zooplatforma/backend/internal/mainfrontend/organizations"
	"github.com/zooplatforma/backend/internal/mainfrontend/pets"
	"github.com/zooplatforma/backend/internal/mainfrontend/polls"
	"github.com/zooplatforma/backend/internal/mainfrontend/posts"
	"github.com/zooplatforma/backend/internal/mainfrontend/reports"
	"github.com/zooplatforma/backend/internal/mainfrontend/search"
	"github.com/zooplatforma/backend/internal/mainfrontend/sitemap"
	"github.com/zooplatforma/backend/internal/mainfrontend/support"
	"github.com/zooplatforma/backend/internal/mainfrontend/users"
	"github.com/zooplatforma/backend/internal/shared/auth"
	"github.com/zooplatforma/backend/internal/shared/config"
	"github.com/zooplatforma/backend/internal/shared/s3"
	"github.com/zooplatforma/backend/internal/shared/websocket"
)

func SetupRoutes(r *gin.RouterGroup, db *sql.DB, cfg *config.Config, hub *websocket.Hub) {
	// Инициализируем S3 Client
	s3Client, err := s3.NewClient(cfg)
	if err != nil {
		panic(fmt.Sprintf("Failed to initialize S3 client: %v", err))
	}

	authHandler := auth.NewHandler(db, cfg)
	postsHandler := posts.NewHandler(db)
	usersHandler := users.NewHandler(db, s3Client)
	petsHandler := pets.NewHandler(db)
	mediaHandler := media.NewHandler(db, s3Client)
	chatsHandler := chats.NewHandler(db, s3Client, hub)
	organizationsHandler := organizations.NewHandler(db)
	commentsHandler := comments.NewHandler(db, s3Client)
	pollsHandler := polls.NewHandler(db)
	friendsHandler := friends.NewHandler(db)
	followersHandler := followers.NewHandler(db)
	notificationsHandler := notifications.NewHandler(db)
	sitemapHandler := sitemap.NewHandler(db)
	// announcementsHandler := announcements.NewHandler(db) // Таблица не существует
	reportsHandler := reports.NewHandler(db)
	supportHandler := support.NewHandler(db, s3Client)
	searchHandler := search.NewHandler(db)

	// Auth routes
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/register", authHandler.Register)
		authGroup.POST("/login", authHandler.Login)
		authGroup.POST("/logout", authHandler.Logout)
		authGroup.POST("/forgot-password", authHandler.ForgotPassword)
		authGroup.POST("/reset-password", authHandler.ResetPassword)
		authGroup.POST("/change-password", authHandler.ChangePassword)
		authGroup.POST("/admin/users/:id/temp-password", authHandler.AdminGenerateTempPassword)
		authGroup.POST("/update-email", authHandler.UpdateEmail)
		authGroup.POST("/impersonate/:id", authHandler.ImpersonateUser)
		authGroup.GET("/me", authHandler.Me)
	}

	// Users routes
	usersGroup := r.Group("/users")
	{
		usersGroup.GET("", usersHandler.GetAll)
		usersGroup.GET("/stats", usersHandler.GetStats)
		usersGroup.GET("/:id", usersHandler.GetByID)
		usersGroup.GET("/logs/:id", usersHandler.GetLogs)
		usersGroup.GET("/storage/:id", usersHandler.GetStorage)

		// Подписчики
		usersGroup.GET("/:id/followers", followersHandler.GetFollowers)
		usersGroup.GET("/:id/following", followersHandler.GetFollowing)
		usersGroup.GET("/:id/follow_status", followersHandler.GetStatus)
		usersGroup.POST("/:id/follow", followersHandler.Follow)
		usersGroup.POST("/:id/unfollow", followersHandler.Unfollow)
	}

	// Profile routes
	profile := r.Group("/profile")
	{
		profile.PUT("", usersHandler.UpdateProfile)
		profile.POST("/avatar", usersHandler.UploadAvatar)
		profile.DELETE("/avatar/delete", usersHandler.DeleteAvatar)
		profile.POST("/cover", usersHandler.UploadCover)
		profile.DELETE("/cover/delete", usersHandler.DeleteCover)
		profile.GET("/social-links", usersHandler.GetSocialLinks)
		profile.POST("/social-links/vk/link", usersHandler.LinkVKToCurrentUser)
		profile.DELETE("/social-links/vk", usersHandler.UnlinkVKFromCurrentUser)
		profile.POST("/social-links/ok/link", usersHandler.LinkOKToCurrentUser)
		profile.DELETE("/social-links/ok", usersHandler.UnlinkOKFromCurrentUser)
		profile.POST("/social-links/mailru/link", usersHandler.LinkMailruToCurrentUser)
		profile.DELETE("/social-links/mailru", usersHandler.UnlinkMailruFromCurrentUser)
	}

	// Posts routes
	postsGroup := r.Group("/posts")
	{
		postsGroup.POST("", postsHandler.CreatePost)
		postsGroup.GET("", postsHandler.GetPosts)
		postsGroup.GET("/:id", postsHandler.GetPostByID)
		postsGroup.GET("/user/:id", postsHandler.GetUserPosts)
		postsGroup.GET("/pet/:id", postsHandler.GetPetPosts)
		postsGroup.GET("/organization/:id", postsHandler.GetOrganizationPosts)
		postsGroup.PUT("/:id", postsHandler.UpdatePost)
		postsGroup.DELETE("/:id", postsHandler.DeletePost)
		postsGroup.GET("/:id/like", postsHandler.GetLikeStatus)
		postsGroup.POST("/:id/like", postsHandler.ToggleLike)
		postsGroup.GET("/:id/likers", postsHandler.GetLikers)
	}

	// Pets routes
	petsGroup := r.Group("/pets")
	{
		petsGroup.GET("/user/:id", petsHandler.GetUserPets)
		petsGroup.GET("/catalog", petsHandler.GetCatalog)
		petsGroup.GET("/:id", petsHandler.GetByID)
	}

	// Sitemap routes (SEO)
	sitemapGroup := r.Group("/sitemap")
	{
		sitemapGroup.GET("/posts", sitemapHandler.GetSitemapPosts)
		sitemapGroup.GET("/users", sitemapHandler.GetSitemapUsers)
		sitemapGroup.GET("/pets", sitemapHandler.GetSitemapPets)
		sitemapGroup.GET("/organizations", sitemapHandler.GetSitemapOrganizations)
	}

	// Friends routes
	friendsGroup := r.Group("/friends")
	{
		friendsGroup.GET("", friendsHandler.GetFriends)
		friendsGroup.GET("/requests", friendsHandler.GetRequests)
		friendsGroup.GET("/status/:id", friendsHandler.GetStatus)
		friendsGroup.GET("/user/:id", friendsHandler.GetUserFriends)
		friendsGroup.POST("/request", friendsHandler.SendRequest)
		friendsGroup.POST("/accept", friendsHandler.AcceptRequest)
		friendsGroup.POST("/reject", friendsHandler.RejectRequest)
		friendsGroup.DELETE("/remove", friendsHandler.RemoveFriend)
	}

	// Notifications routes
	notificationsGroup := r.Group("/notifications")
	{
		notificationsGroup.GET("", notificationsHandler.GetNotifications)
		notificationsGroup.GET("/unread", notificationsHandler.GetUnreadCount)
		notificationsGroup.PUT("/:id/read", notificationsHandler.MarkAsRead)
		notificationsGroup.POST("/mark-all-read", notificationsHandler.MarkAllAsRead)
	}

	// Organizations routes
	organizationsGroup := r.Group("/organizations")
	{
		organizationsGroup.GET("/all", organizationsHandler.GetAll)
		organizationsGroup.GET("/my", organizationsHandler.GetMy)
		organizationsGroup.GET("/check-inn/:inn", organizationsHandler.CheckByInn)
		organizationsGroup.GET("/:id", organizationsHandler.GetByID)
		organizationsGroup.GET("/members/:id", organizationsHandler.GetMembers)
		organizationsGroup.POST("", organizationsHandler.Create)
		organizationsGroup.POST("/claim-ownership/:id", organizationsHandler.ClaimOwnership)
	}

	// Messages routes
	messages := r.Group("/messages")
	{
		messages.GET("/unread", chatsHandler.GetUnreadCount)
		messages.POST("/send", chatsHandler.SendMessage)
		messages.POST("/send-media", chatsHandler.SendMessageWithMedia)
	}

	// Media routes
	mediaGroup := r.Group("/media")
	{
		mediaGroup.GET("/stats", mediaHandler.GetStats)
		mediaGroup.GET("/user/:id", mediaHandler.GetUserMedia)
		mediaGroup.POST("/upload", mediaHandler.Upload) // Простая загрузка для файлов <5MB
		mediaGroup.POST("/chunked/initiate", mediaHandler.InitiateChunkedUpload)
		mediaGroup.POST("/chunked/upload", mediaHandler.UploadChunk)
		mediaGroup.POST("/chunked/complete", mediaHandler.CompleteChunkedUpload)
	}

	// Chats routes
	chatsGroup := r.Group("/chats")
	{
		chatsGroup.GET("", chatsHandler.GetChats)
		chatsGroup.GET("/:id/messages", chatsHandler.GetMessages)
		chatsGroup.POST("/:id/mark-read", chatsHandler.MarkAsRead)
	}

	// Comments routes
	commentsGroup := r.Group("/comments")
	{
		commentsGroup.GET("/post/:id", commentsHandler.GetPostComments)
		commentsGroup.POST("/post/:id", commentsHandler.CreateComment)
		commentsGroup.DELETE("/:id", commentsHandler.DeleteComment)
		commentsGroup.POST("/:id/approve", commentsHandler.ApproveComment)
		commentsGroup.POST("/:id/reject", commentsHandler.RejectComment)
	}

	// Polls routes
	pollsGroup := r.Group("/polls")
	{
		pollsGroup.GET("/post/:post_id", pollsHandler.GetPollByPostID)
		pollsGroup.POST("/:id/vote", pollsHandler.VotePoll)
		pollsGroup.DELETE("/:id/vote", pollsHandler.DeleteVote)
	}

	// Announcements routes (таблица не существует в БД)
	// announcementsGroup := r.Group("/announcements")
	// {
	// 	announcementsGroup.GET("", announcementsHandler.GetAnnouncements)
	// 	announcementsGroup.GET("/:id", announcementsHandler.GetAnnouncementByID)
	// 	announcementsGroup.POST("", announcementsHandler.CreateAnnouncement)
	// 	announcementsGroup.PUT("/:id", announcementsHandler.UpdateAnnouncement)
	// 	announcementsGroup.DELETE("/:id", announcementsHandler.DeleteAnnouncement)
	// }

	// Reports routes
	reportsGroup := r.Group("/reports")
	{
		reportsGroup.POST("", reportsHandler.CreateReport)
	}

	// Support routes
	supportGroup := r.Group("/support")
	{
		supportGroup.POST("", supportHandler.CreateSupportMessage)
	}

	// Search route
	r.GET("/search", searchHandler.Search)
}
