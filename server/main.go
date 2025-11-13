package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

var (
	// Server configuration (can be overridden by env vars)
	HTTP_PORT   = getEnv("HTTP_PORT", "8080")
	WS_PORT     = getEnv("WS_PORT", "8081")
	DB_HOST     = getEnv("DB_HOST", "localhost")
	DB_PORT     = getEnv("DB_PORT", "5432")
	DB_USER     = getEnv("DB_USER", "teleclone")
	DB_PASSWORD = getEnv("DB_PASSWORD", "teleclone")
	DB_NAME     = getEnv("DB_NAME", "teleclone")
	REDIS_ADDR  = getEnv("REDIS_ADDR", "localhost:6379")
)

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

var (
	db          *DB
	redisClient *RedisClient
	hub         *Hub
	upgrader    = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins in dev
		},
	}
)

func main() {
	// Initialize database
	var err error
	db, err = NewDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize Redis
	redisClient, err = NewRedisClient()
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	// Initialize WebSocket hub
	hub = NewHub()
	go hub.Run()

	// Run migrations
	if err := db.Migrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Setup HTTP routes
	httpMux := http.NewServeMux()
	httpMux.HandleFunc("/api/auth/register", handleRegister)
	httpMux.HandleFunc("/api/auth/login", handleLogin)
	httpMux.HandleFunc("/api/auth/verify-otp", handleVerifyOTP)
	httpMux.HandleFunc("/api/chats", authMiddleware(handleGetChats))
	httpMux.HandleFunc("/api/chats/", authMiddleware(handleGetChat))
	httpMux.HandleFunc("/api/messages", authMiddleware(handleSendMessage))
	httpMux.HandleFunc("/api/messages/", authMiddleware(handleGetMessages))
	httpMux.HandleFunc("/api/messages/edit/", authMiddleware(handleEditMessage))
	httpMux.HandleFunc("/api/messages/delete/", authMiddleware(handleDeleteMessage))
	httpMux.HandleFunc("/api/groups", authMiddleware(handleCreateGroup))
	httpMux.HandleFunc("/api/groups/", authMiddleware(handleGroupOperations))
	httpMux.HandleFunc("/api/search", authMiddleware(handleSearch))

	// Bot API routes
	httpMux.HandleFunc("/bot/api/", handleBotAPI)

	// WebSocket endpoint
	httpMux.HandleFunc("/ws", handleWebSocket)

	// Health check
	httpMux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// Start HTTP server
	httpServer := &http.Server{
		Addr:    ":" + HTTP_PORT,
		Handler: httpMux,
	}

	go func() {
		log.Printf("HTTP server starting on port %s", HTTP_PORT)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server failed: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down servers...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		log.Fatalf("HTTP server shutdown failed: %v", err)
	}

	log.Println("Servers stopped")
}

// WebSocket handler
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Extract token from query or header
	token := r.URL.Query().Get("token")
	if token == "" {
		token = r.Header.Get("Authorization")
		if len(token) > 7 && token[:7] == "Bearer " {
			token = token[7:]
		}
	}

	// Verify token and get user
	userID, err := verifyToken(token)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	client := &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		userID: userID,
	}

	client.hub.register <- client

	go client.writePump()
	go client.readPump()
}

// Auth handlers
func handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Phone    string `json:"phone"`
		Username string `json:"username"`
		Name     string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Generate OTP (simplified - in production use SMS service)
	otp := "123456" // For dev/testing

	// Hash password (if provided)
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("default"), bcrypt.DefaultCost)

	// Store OTP in Redis (expires in 5 minutes)
	redisClient.Set(context.Background(), fmt.Sprintf("otp:%s", req.Phone), otp, 5*time.Minute)

	// Create user (pending verification)
	userID, err := db.CreateUser(req.Phone, req.Username, req.Name, string(hashedPassword))
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			http.Error(w, "Phone number already registered", http.StatusConflict)
			return
		}
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"user_id": userID,
		"otp":     otp, // Only in dev
		"message": "OTP sent to phone",
	})
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Phone string `json:"phone"`
		OTP   string `json:"otp"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Verify OTP
	storedOTP, err := redisClient.Get(context.Background(), fmt.Sprintf("otp:%s", req.Phone)).Result()
	if err != nil || storedOTP != req.OTP {
		http.Error(w, "Invalid OTP", http.StatusUnauthorized)
		return
	}

	// Get user
	user, err := db.GetUserByPhone(req.Phone)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Generate JWT token
	token, err := generateToken(user.ID)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Delete OTP
	redisClient.Del(context.Background(), fmt.Sprintf("otp:%s", req.Phone))

	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"user":  user,
	})
}

func handleVerifyOTP(w http.ResponseWriter, r *http.Request) {
	// Similar to login, but for registration flow
	handleLogin(w, r)
}

// Chat handlers
func handleGetChats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("userID").(string)
	chats, err := db.GetUserChats(userID)
	if err != nil {
		http.Error(w, "Failed to get chats", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(chats)
}

func handleGetChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	chatID := r.URL.Path[len("/api/chats/"):]
	userID := r.Context().Value("userID").(string)

	chat, err := db.GetChat(chatID, userID)
	if err != nil {
		http.Error(w, "Chat not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(chat)
}

// Message handlers
func handleSendMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("userID").(string)

	var req struct {
		ChatID      string `json:"chat_id"`
		Content     string `json:"content"`
		Type        string `json:"type"`
		RecipientID string `json:"recipient_id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	message, err := db.CreateMessage(userID, req.ChatID, req.Content, req.Type)
	if err != nil {
		http.Error(w, "Failed to send message", http.StatusInternalServerError)
		return
	}

	// Broadcast to WebSocket clients
	hub.BroadcastToChat(req.ChatID, MessageEvent{
		Type:    "message",
		Message: message,
	})

	json.NewEncoder(w).Encode(message)
}

func handleGetMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	chatID := r.URL.Path[len("/api/messages/"):]
	page := r.URL.Query().Get("page")
	limit := r.URL.Query().Get("limit")

	messages, err := db.GetMessages(chatID, page, limit)
	if err != nil {
		http.Error(w, "Failed to get messages", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(messages)
}

func handleEditMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	messageID := r.URL.Path[len("/api/messages/edit/"):]
	userID := r.Context().Value("userID").(string)

	var req struct {
		Content string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	message, err := db.EditMessage(messageID, userID, req.Content)
	if err != nil {
		http.Error(w, "Failed to edit message", http.StatusInternalServerError)
		return
	}

	// Broadcast update
	hub.BroadcastToChat(message.ChatID, MessageEvent{
		Type:    "message_edited",
		Message: message,
	})

	json.NewEncoder(w).Encode(message)
}

func handleDeleteMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	messageID := r.URL.Path[len("/api/messages/delete/"):]
	userID := r.Context().Value("userID").(string)

	if err := db.DeleteMessage(messageID, userID); err != nil {
		http.Error(w, "Failed to delete message", http.StatusInternalServerError)
		return
	}

	// Broadcast deletion
	hub.BroadcastToChat("", MessageEvent{
		Type:      "message_deleted",
		MessageID: messageID,
	})

	w.WriteHeader(http.StatusNoContent)
}

// Group handlers
func handleCreateGroup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value("userID").(string)

	var req struct {
		Name         string   `json:"name"`
		Participants []string `json:"participants"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	group, err := db.CreateGroup(userID, req.Name, req.Participants)
	if err != nil {
		http.Error(w, "Failed to create group", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(group)
}

func handleGroupOperations(w http.ResponseWriter, r *http.Request) {
	// Handle group add/remove/update operations
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

// Search handler
func handleSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := r.URL.Query().Get("q")
	chatID := r.URL.Query().Get("chat_id")
	userID := r.Context().Value("userID").(string)

	results, err := db.SearchMessages(userID, chatID, query)
	if err != nil {
		http.Error(w, "Search failed", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(results)
}

// Bot API handler (simplified)
func handleBotAPI(w http.ResponseWriter, r *http.Request) {
	// Bot API compatibility layer
	path := r.URL.Path[len("/bot/api/"):]

	switch path {
	case "sendMessage":
		// Handle bot sendMessage
		var req struct {
			ChatID  string `json:"chat_id"`
			Text    string `json:"text"`
			BotToken string `json:"bot_token"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// Verify bot token and send message
		// Implementation would verify bot token and queue message
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":     true,
			"result": map[string]interface{}{"message_id": "123"},
		})
	default:
		http.Error(w, "Not found", http.StatusNotFound)
	}
}
