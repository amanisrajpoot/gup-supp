package websocket

import (
	"log"
	"sync"
)

// Hub maintains the set of active clients and broadcasts messages to clients
type Hub struct {
	// Registered clients mapped by user ID
	clients map[string]*Client

	// Inbound messages from clients
	broadcast chan []byte

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Mutex for thread-safe access
	mu sync.RWMutex
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Register registers a new client with the hub
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.UserID] = client
			h.mu.Unlock()
			log.Printf("Client registered: %s (Total: %d)", client.UserID, len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.UserID]; ok {
				delete(h.clients, client.UserID)
				close(client.send)
			}
			h.mu.Unlock()
			log.Printf("Client unregistered: %s (Total: %d)", client.UserID, len(h.clients))

		case message := <-h.broadcast:
			h.mu.RLock()
			for _, client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client.UserID)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// SendToUser sends a message to a specific user
func (h *Hub) SendToUser(userID string, message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if client, ok := h.clients[userID]; ok {
		select {
		case client.send <- message:
		default:
			log.Printf("Failed to send message to user %s: channel full", userID)
		}
	}
}

// SendToChat sends a message to all members of a chat
func (h *Hub) SendToChat(memberIDs []string, message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, userID := range memberIDs {
		if client, ok := h.clients[userID]; ok {
			select {
			case client.send <- message:
			default:
				log.Printf("Failed to send message to user %s: channel full", userID)
			}
		}
	}
}

// GetClientCount returns the number of connected clients
func (h *Hub) GetClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
