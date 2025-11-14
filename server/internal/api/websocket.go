package api

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"teleclone-server/internal/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in development
	},
}

type WebSocketHandler struct {
	hub *websocket.Hub
	db  *sql.DB
}

func NewWebSocketHandler(hub *websocket.Hub, db *sql.DB) *WebSocketHandler {
	return &WebSocketHandler{hub: hub, db: db}
}

func (h *WebSocketHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Get user ID from token (simplified for PoC)
	userID := getUserIDFromToken(r)
	if userID == "" {
		// Try to get from query param for testing
		userID = r.URL.Query().Get("userId")
		if userID == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := websocket.NewClient(h.hub, conn, userID)
	h.hub.Register(client)

	go client.WritePump()
	go client.ReadPump()
}
