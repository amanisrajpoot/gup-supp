package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

// Message represents a chat message
type Message struct {
	ID        string    `json:"id"`
	From      string    `json:"from"`
	To        string    `json:"to"`
	Text      string    `json:"text"`
	Timestamp time.Time `json:"ts"`
	Type      string    `json:"type"` // "text", "image", "video", etc.
}

// WebSocketMessage represents messages sent over WebSocket
type WebSocketMessage struct {
	Type    string          `json:"type"` // "auth", "message", "ping", "pong"
	Payload json.RawMessage `json:"payload"`
}

// AuthPayload for authentication
type AuthPayload struct {
	PhoneNumber string `json:"phone_number"`
	OTP         string `json:"otp"`
	Token       string `json:"token"` // For token-based auth after OTP
}

// MessagePayload for sending messages
type MessagePayload struct {
	To   string `json:"to"`
	Text string `json:"text"`
	Type string `json:"type"`
}

// Client represents a connected WebSocket client
type Client struct {
	conn     *websocket.Conn
	userID   string
	send     chan []byte
	server   *Server
	mu       sync.Mutex
	lastPing time.Time
}

// Server manages WebSocket connections and message routing
type Server struct {
	clients    map[string]*Client // userID -> Client
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	db         *Database
	mu         sync.RWMutex
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in dev
	},
}

func newServer(db *Database) *Server {
	return &Server{
		clients:    make(map[string]*Client),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		db:         db,
	}
}

func (s *Server) run() {
	for {
		select {
		case client := <-s.register:
			s.mu.Lock()
			s.clients[client.userID] = client
			s.mu.Unlock()
			log.Printf("Client registered: %s (total: %d)", client.userID, len(s.clients))

		case client := <-s.unregister:
			s.mu.Lock()
			if _, ok := s.clients[client.userID]; ok {
				delete(s.clients, client.userID)
				close(client.send)
			}
			s.mu.Unlock()
			log.Printf("Client unregistered: %s (total: %d)", client.userID, len(s.clients))

		case message := <-s.broadcast:
			s.mu.RLock()
			for userID, client := range s.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(s.clients, userID)
				}
			}
			s.mu.RUnlock()
		}
	}
}

func (s *Server) sendToUser(userID string, message []byte) {
	s.mu.RLock()
	client, ok := s.clients[userID]
	s.mu.RUnlock()

	if ok {
		select {
		case client.send <- message:
		default:
			close(client.send)
			s.mu.Lock()
			delete(s.clients, userID)
			s.mu.Unlock()
		}
	}
}

func (c *Client) readPump() {
	defer func() {
		c.server.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.mu.Lock()
		c.lastPing = time.Now()
		c.mu.Unlock()
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var wsMsg WebSocketMessage
		if err := json.Unmarshal(messageBytes, &wsMsg); err != nil {
			log.Printf("Error unmarshaling message: %v", err)
			continue
		}

		c.handleMessage(&wsMsg)
	}
}

func (c *Client) handleMessage(wsMsg *WebSocketMessage) {
	switch wsMsg.Type {
	case "auth":
		var auth AuthPayload
		if err := json.Unmarshal(wsMsg.Payload, &auth); err != nil {
			c.sendError("Invalid auth payload")
			return
		}

		// Verify OTP or token
		userID, err := c.server.db.authenticate(auth.PhoneNumber, auth.OTP, auth.Token)
		if err != nil {
			c.sendError(fmt.Sprintf("Authentication failed: %v", err))
			return
		}

		c.userID = userID
		c.server.register <- c
		c.sendSuccess("authenticated", map[string]string{"user_id": userID})

	case "message":
		if c.userID == "" {
			c.sendError("Not authenticated")
			return
		}

		var msgPayload MessagePayload
		if err := json.Unmarshal(wsMsg.Payload, &msgPayload); err != nil {
			c.sendError("Invalid message payload")
			return
		}

		// Create message
		msg := Message{
			ID:        generateID(),
			From:      c.userID,
			To:        msgPayload.To,
			Text:      msgPayload.Text,
			Timestamp: time.Now(),
			Type:      msgPayload.Type,
		}

		// Save to database
		if err := c.server.db.saveMessage(&msg); err != nil {
			c.sendError(fmt.Sprintf("Failed to save message: %v", err))
			return
		}

		// Send to recipient
		msgBytes, _ := json.Marshal(WebSocketMessage{
			Type:    "message",
			Payload: mustMarshal(msg),
		})
		c.server.sendToUser(msgPayload.To, msgBytes)

		// Confirm to sender
		c.sendSuccess("message_sent", msg)

	case "ping":
		c.sendResponse("pong", nil)

	default:
		c.sendError(fmt.Sprintf("Unknown message type: %s", wsMsg.Type))
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

func (c *Client) sendError(msg string) {
	c.sendResponse("error", map[string]string{"error": msg})
}

func (c *Client) sendSuccess(event string, data interface{}) {
	c.sendResponse(event, data)
}

func (c *Client) sendResponse(event string, data interface{}) {
	response := map[string]interface{}{
		"type": event,
	}
	if data != nil {
		response["data"] = data
	}
	bytes, _ := json.Marshal(response)
	select {
	case c.send <- bytes:
	default:
		close(c.send)
	}
}

func handleWebSocket(s *Server, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		conn:   conn,
		send:   make(chan []byte, 256),
		server: s,
	}

	go client.writePump()
	go client.readPump()
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize database
	db, err := NewDatabase()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Run migrations
	if err := db.Migrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Create server
	server := newServer(db)
	go server.run()

	// HTTP routes
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWebSocket(server, w, r)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func mustMarshal(v interface{}) json.RawMessage {
	bytes, _ := json.Marshal(v)
	return json.RawMessage(bytes)
}
