package api

import (
	"database/sql"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/redis/go-redis/v9"
	"teleclone-server/internal/websocket"
)

// NewRouter creates and configures the HTTP router
func NewRouter(db *sql.DB, rdb *redis.Client, hub *websocket.Hub) http.Handler {
	router := mux.NewRouter()

	// Initialize handlers
	authHandler := NewAuthHandler(db)
	chatHandler := NewChatHandler(db, hub)
	messageHandler := NewMessageHandler(db, hub)
	botHandler := NewBotHandler(db, hub)
	wsHandler := NewWebSocketHandler(hub, db)

	// API routes
	api := router.PathPrefix("/api").Subrouter()

	// Auth routes
	api.HandleFunc("/auth/send-otp", authHandler.SendOTP).Methods("POST")
	api.HandleFunc("/auth/verify-otp", authHandler.VerifyOTP).Methods("POST")
	api.HandleFunc("/auth/register", authHandler.Register).Methods("POST")
	api.HandleFunc("/auth/login", authHandler.Login).Methods("POST")
	api.HandleFunc("/auth/refresh-token", authHandler.RefreshToken).Methods("POST")
	api.HandleFunc("/auth/profile", authHandler.GetProfile).Methods("GET")
	api.HandleFunc("/auth/profile", authHandler.UpdateProfile).Methods("PUT")

	// Chat routes
	api.HandleFunc("/chat/chats", chatHandler.GetChats).Methods("GET")
	api.HandleFunc("/chat/chats", chatHandler.CreateChat).Methods("POST")
	api.HandleFunc("/chat/chats/{chatId}", chatHandler.GetChat).Methods("GET")
	api.HandleFunc("/chat/groups", chatHandler.CreateGroup).Methods("POST")
	api.HandleFunc("/chat/groups/{groupId}/add", chatHandler.AddToGroup).Methods("POST")
	api.HandleFunc("/chat/groups/{groupId}/remove", chatHandler.RemoveFromGroup).Methods("POST")
	api.HandleFunc("/chat/typing", chatHandler.SetTyping).Methods("POST")

	// Message routes
	api.HandleFunc("/chat/messages", messageHandler.SendMessage).Methods("POST")
	api.HandleFunc("/chat/messages/{chatId}", messageHandler.GetMessages).Methods("GET")
	api.HandleFunc("/chat/messages/{messageId}", messageHandler.EditMessage).Methods("PUT")
	api.HandleFunc("/chat/messages/{messageId}", messageHandler.DeleteMessage).Methods("DELETE")
	api.HandleFunc("/chat/mark-read/{chatId}", messageHandler.MarkAsRead).Methods("POST")

	// Bot API routes (Telegram Bot API compatible)
	botAPI := router.PathPrefix("/bot").Subrouter()
	botAPI.HandleFunc("/{token}/sendMessage", botHandler.SendMessage).Methods("POST")
	botAPI.HandleFunc("/{token}/getMe", botHandler.GetMe).Methods("GET")
	botAPI.HandleFunc("/{token}/getUpdates", botHandler.GetUpdates).Methods("GET")
	botAPI.HandleFunc("/{token}/setWebhook", botHandler.SetWebhook).Methods("POST")

	// WebSocket endpoint
	router.HandleFunc("/ws", wsHandler.HandleWebSocket)

	// Health check
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}).Methods("GET")

	return router
}
