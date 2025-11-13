package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

var (
	db          *sql.DB
	redisClient *redis.Client
	upgrader    = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins in dev
		},
	}
	clients     = make(map[string]*Client)
	clientsMu   sync.RWMutex
	jwtSecret   = []byte("dev-secret-key-change-in-production")
	otpStore    = make(map[string]OTPData) // phone -> OTP data
	otpStoreMu  sync.RWMutex
)

type Client struct {
	conn     *websocket.Conn
	userID   string
	send     chan []byte
	hub      *Hub
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
}

type OTPData struct {
	Code      string
	ExpiresAt time.Time
}

type User struct {
	ID        string    `json:"id"`
	Phone     string    `json:"phone"`
	Username  string    `json:"username"`
	Name      string    `json:"name"`
	Avatar    string    `json:"avatar"`
	CreatedAt time.Time `json:"createdAt"`
}

type Message struct {
	ID          string    `json:"id"`
	ChatID     string    `json:"chatId"`
	SenderID   string    `json:"senderId"`
	Content    string    `json:"content"`
	Type       string    `json:"type"`
	CreatedAt  time.Time `json:"createdAt"`
	EditedAt   *time.Time `json:"editedAt,omitempty"`
	DeletedAt  *time.Time `json:"deletedAt,omitempty"`
	Status     string    `json:"status"`
}

type Chat struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"` // "individual" or "group"
	Name        string    `json:"name,omitempty"`
	Participants []string `json:"participants"`
	LastMessage *Message `json:"lastMessage,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}

type AuthRequest struct {
	Phone    string `json:"phone"`
	Password string `json:"password,omitempty"`
	OTP      string `json:"otp,omitempty"`
}

type AuthResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refreshToken"`
	User         User   `json:"user"`
}

type SendMessageRequest struct {
	ChatID  string `json:"chatId"`
	Content string `json:"content"`
	Type    string `json:"type"`
}

type WebSocketMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

func initDB() error {
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
	)

	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		return err
	}

	if err = db.Ping(); err != nil {
		return err
	}

	// Create tables
	if err = createTables(); err != nil {
		return err
	}

	log.Println("Database connected successfully")
	return nil
}

func createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			phone VARCHAR(20) UNIQUE NOT NULL,
			username VARCHAR(50) UNIQUE,
			name VARCHAR(100) NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			avatar TEXT,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS chats (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			type VARCHAR(20) NOT NULL,
			name VARCHAR(100),
			participants UUID[] NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS messages (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
			sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			type VARCHAR(20) NOT NULL DEFAULT 'text',
			status VARCHAR(20) NOT NULL DEFAULT 'sent',
			created_at TIMESTAMP DEFAULT NOW(),
			edited_at TIMESTAMP,
			deleted_at TIMESTAMP
		)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats USING GIN(participants)`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return fmt.Errorf("error creating table: %w", err)
		}
	}

	log.Println("Database tables created/verified")
	return nil
}

func initRedis() error {
	redisClient = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PORT")),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})

	ctx := context.Background()
	if err := redisClient.Ping(ctx).Err(); err != nil {
		return err
	}

	log.Println("Redis connected successfully")
	return nil
}

func generateOTP() string {
	// Simple 6-digit OTP for dev
	return fmt.Sprintf("%06d", time.Now().Unix()%1000000)
}

func sendOTP(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PhoneNumber string `json:"phoneNumber"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	otp := generateOTP()
	otpStoreMu.Lock()
	otpStore[req.PhoneNumber] = OTPData{
		Code:      otp,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}
	otpStoreMu.Unlock()

	// In production, send SMS here. For dev, log it.
	log.Printf("OTP for %s: %s", req.PhoneNumber, otp)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "OTP sent successfully",
		"otp":     otp, // Remove in production
	})
}

func register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PhoneNumber string `json:"phoneNumber"`
		OTP         string `json:"otp"`
		Name        string `json:"name"`
		Username    string `json:"username,omitempty"`
		Password    string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Verify OTP
	otpStoreMu.RLock()
	otpData, exists := otpStore[req.PhoneNumber]
	otpStoreMu.RUnlock()

	if !exists || otpData.Code != req.OTP || time.Now().After(otpData.ExpiresAt) {
		http.Error(w, "Invalid or expired OTP", http.StatusBadRequest)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	// Create user
	var userID string
	err = db.QueryRow(
		"INSERT INTO users (phone, username, name, password_hash) VALUES ($1, $2, $3, $4) RETURNING id",
		req.PhoneNumber, req.Username, req.Name, string(hashedPassword),
	).Scan(&userID)

	if err != nil {
		if strings.Contains(err.Error(), "duplicate") {
			http.Error(w, "Phone number already registered", http.StatusConflict)
			return
		}
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	// Generate tokens
	token, refreshToken, err := generateTokens(userID)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	user := User{
		ID:       userID,
		Phone:    req.PhoneNumber,
		Username: req.Username,
		Name:     req.Name,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	})
}

func login(w http.ResponseWriter, r *http.Request) {
	var req AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	var userID, passwordHash, name, username, avatar string
	err := db.QueryRow(
		"SELECT id, password_hash, name, username, avatar FROM users WHERE phone = $1",
		req.Phone,
	).Scan(&userID, &passwordHash, &name, &username, &avatar)

	if err == sql.ErrNoRows {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, refreshToken, err := generateTokens(userID)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	user := User{
		ID:       userID,
		Phone:    req.Phone,
		Username: username,
		Name:     name,
		Avatar:   avatar,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	})
}

func verifyOTP(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PhoneNumber string `json:"phoneNumber"`
		OTP         string `json:"otp"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	otpStoreMu.RLock()
	otpData, exists := otpStore[req.PhoneNumber]
	otpStoreMu.RUnlock()

	if !exists || otpData.Code != req.OTP || time.Now().After(otpData.ExpiresAt) {
		http.Error(w, "Invalid or expired OTP", http.StatusBadRequest)
		return
	}

	// Clean up OTP
	otpStoreMu.Lock()
	delete(otpStore, req.PhoneNumber)
	otpStoreMu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "OTP verified"})
}

func generateTokens(userID string) (string, string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}

	refreshClaims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}

	return tokenString, refreshTokenString, nil
}

func verifyToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return jwtSecret, nil
	})

	if err != nil {
		return "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, ok := claims["user_id"].(string)
		if !ok {
			return "", fmt.Errorf("invalid token claims")
		}
		return userID, nil
	}

	return "", fmt.Errorf("invalid token")
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing authorization header", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		userID, err := verifyToken(tokenString)
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		r.Header.Set("X-User-ID", userID)
		next(w, r)
	}
}

func getChats(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")

	rows, err := db.Query(`
		SELECT c.id, c.type, c.name, c.participants, c.created_at,
		       m.id, m.sender_id, m.content, m.type, m.created_at, m.status
		FROM chats c
		LEFT JOIN LATERAL (
			SELECT id, sender_id, content, type, created_at, status
			FROM messages
			WHERE chat_id = c.id AND deleted_at IS NULL
			ORDER BY created_at DESC
			LIMIT 1
		) m ON true
		WHERE $1 = ANY(c.participants)
		ORDER BY COALESCE(m.created_at, c.created_at) DESC
	`, userID)

	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var chats []Chat
	for rows.Next() {
		var chat Chat
		var participants pq.StringArray
		var lastMsgID, lastMsgSenderID, lastMsgContent, lastMsgType, lastMsgStatus sql.NullString
		var lastMsgCreatedAt sql.NullTime

		err := rows.Scan(
			&chat.ID, &chat.Type, &chat.Name, &participants, &chat.CreatedAt,
			&lastMsgID, &lastMsgSenderID, &lastMsgContent, &lastMsgType, &lastMsgCreatedAt, &lastMsgStatus,
		)
		if err != nil {
			continue
		}

		chat.Participants = []string(participants)
		if lastMsgID.Valid {
			chat.LastMessage = &Message{
				ID:        lastMsgID.String,
				SenderID:  lastMsgSenderID.String,
				Content:   lastMsgContent.String,
				Type:      lastMsgType.String,
				CreatedAt: lastMsgCreatedAt.Time,
				Status:    lastMsgStatus.String,
			}
		}

		chats = append(chats, chat)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(chats)
}

func getMessages(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	chatID := r.URL.Query().Get("chatId")
	if chatID == "" {
		chatID = strings.TrimPrefix(r.URL.Path, "/api/chat/messages/")
	}

	// Verify user is participant
	var count int
	err := db.QueryRow(
		"SELECT COUNT(*) FROM chats WHERE id = $1 AND $2 = ANY(participants)",
		chatID, userID,
	).Scan(&count)

	if err != nil || count == 0 {
		http.Error(w, "Chat not found", http.StatusNotFound)
		return
	}

	rows, err := db.Query(`
		SELECT id, sender_id, content, type, created_at, edited_at, deleted_at, status
		FROM messages
		WHERE chat_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT 50
	`, chatID)

	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var msg Message
		var editedAt, deletedAt sql.NullTime

		err := rows.Scan(
			&msg.ID, &msg.SenderID, &msg.Content, &msg.Type,
			&msg.CreatedAt, &editedAt, &deletedAt, &msg.Status,
		)
		if err != nil {
			continue
		}

		msg.ChatID = chatID
		if editedAt.Valid {
			msg.EditedAt = &editedAt.Time
		}

		messages = append(messages, msg)
	}

	// Reverse to get chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

func sendMessage(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")

	var req SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Verify user is participant
	var count int
	err := db.QueryRow(
		"SELECT COUNT(*) FROM chats WHERE id = $1 AND $2 = ANY(participants)",
		req.ChatID, userID,
	).Scan(&count)

	if err != nil || count == 0 {
		http.Error(w, "Chat not found", http.StatusNotFound)
		return
	}

	// Insert message
	var msgID string
	err = db.QueryRow(
		`INSERT INTO messages (chat_id, sender_id, content, type, status)
		 VALUES ($1, $2, $3, $4, 'sent')
		 RETURNING id, created_at`,
		req.ChatID, userID, req.Content, req.Type,
	).Scan(&msgID, &msg.CreatedAt)

	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	msg := Message{
		ID:        msgID,
		ChatID:    req.ChatID,
		SenderID:  userID,
		Content:   req.Content,
		Type:      req.Type,
		Status:    "sent",
		CreatedAt: msg.CreatedAt,
	}

	// Broadcast to WebSocket clients
	broadcastMessage(msg)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(msg)
}

func createChat(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")

	var req struct {
		Type         string   `json:"type"`
		Name         string   `json:"name,omitempty"`
		Participants []string `json:"participants"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Add current user to participants
	participants := append(req.Participants, userID)

	var chatID string
	var createdAt time.Time
	err := db.QueryRow(
		`INSERT INTO chats (type, name, participants)
		 VALUES ($1, $2, $3)
		 RETURNING id, created_at`,
		req.Type, req.Name, pq.Array(participants),
	).Scan(&chatID, &createdAt)

	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	chat := Chat{
		ID:           chatID,
		Type:         req.Type,
		Name:         req.Name,
		Participants: participants,
		CreatedAt:    createdAt,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(chat)
}

func broadcastMessage(msg Message) {
	wsMsg := WebSocketMessage{
		Type:    "message",
		Payload: msg,
	}

	data, _ := json.Marshal(wsMsg)
	hub.broadcast <- data
}

func newHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

var hub = newHub()

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}

		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	tokenString := r.URL.Query().Get("token")
	if tokenString == "" {
		authHeader := r.Header.Get("Authorization")
		tokenString = strings.TrimPrefix(authHeader, "Bearer ")
	}

	userID, err := verifyToken(tokenString)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}

	client := &Client{
		conn:   conn,
		userID: userID,
		send:   make(chan []byte, 256),
		hub:    hub,
	}

	hub.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func main() {
	// Set defaults
	if os.Getenv("DB_HOST") == "" {
		os.Setenv("DB_HOST", "localhost")
	}
	if os.Getenv("DB_PORT") == "" {
		os.Setenv("DB_PORT", "5432")
	}
	if os.Getenv("DB_USER") == "" {
		os.Setenv("DB_USER", "postgres")
	}
	if os.Getenv("DB_PASSWORD") == "" {
		os.Setenv("DB_PASSWORD", "postgres")
	}
	if os.Getenv("DB_NAME") == "" {
		os.Setenv("DB_NAME", "teleclone")
	}
	if os.Getenv("REDIS_HOST") == "" {
		os.Setenv("REDIS_HOST", "localhost")
	}
	if os.Getenv("REDIS_PORT") == "" {
		os.Setenv("REDIS_PORT", "6379")
	}

	if err := initDB(); err != nil {
		log.Fatal("Database initialization failed:", err)
	}

	if err := initRedis(); err != nil {
		log.Fatal("Redis initialization failed:", err)
	}

	go hub.run()

	// Auth routes
	http.HandleFunc("/api/auth/send-otp", sendOTP)
	http.HandleFunc("/api/auth/register", register)
	http.HandleFunc("/api/auth/login", login)
	http.HandleFunc("/api/auth/verify-otp", verifyOTP)

	// Chat routes
	http.HandleFunc("/api/chat/chats", authMiddleware(getChats))
	http.HandleFunc("/api/chat/messages", authMiddleware(getMessages))
	http.HandleFunc("/api/chat/messages/", authMiddleware(getMessages))
	http.HandleFunc("/api/chat/send", authMiddleware(sendMessage))
	http.HandleFunc("/api/chat/create", authMiddleware(createChat))

	// WebSocket
	http.HandleFunc("/ws", handleWebSocket)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
