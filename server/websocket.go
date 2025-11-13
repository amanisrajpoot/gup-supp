package main

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024 // 512KB
)

type MessageEvent struct {
	Type      string   `json:"type"`
	Message   *Message `json:"message,omitempty"`
	MessageID string   `json:"message_id,omitempty"`
	ChatID    string   `json:"chat_id,omitempty"`
	Data      interface{} `json:"data,omitempty"`
}

type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	userID string
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	chatRooms  map[string]map[*Client]bool // chatID -> clients
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		chatRooms:  make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			log.Printf("Client connected: %s", client.userID)

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				// Remove from all chat rooms
				for chatID, room := range h.chatRooms {
					delete(room, client)
					if len(room) == 0 {
						delete(h.chatRooms, chatID)
					}
				}
				log.Printf("Client disconnected: %s", client.userID)
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

func (h *Hub) BroadcastToChat(chatID string, event MessageEvent) {
	data, err := json.Marshal(event)
	if err != nil {
		log.Printf("Error marshaling event: %v", err)
		return
	}

	// Get or create chat room
	room, exists := h.chatRooms[chatID]
	if !exists {
		room = make(map[*Client]bool)
		h.chatRooms[chatID] = room
	}

	// Broadcast to all clients in the chat room
	for client := range room {
		select {
		case client.send <- data:
		default:
			close(client.send)
			delete(h.clients, client)
			delete(room, client)
		}
	}

	// Also add clients to chat room when they connect
	// This is simplified - in production, clients should join rooms explicitly
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Handle incoming messages (typing indicators, read receipts, etc.)
		var event MessageEvent
		if err := json.Unmarshal(message, &event); err == nil {
			c.handleEvent(event)
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleEvent(event MessageEvent) {
	switch event.Type {
	case "join_chat":
		// Add client to chat room
		chatID := event.ChatID
		if chatID != "" {
			room, exists := c.hub.chatRooms[chatID]
			if !exists {
				room = make(map[*Client]bool)
				c.hub.chatRooms[chatID] = room
			}
			room[c] = true
		}

	case "typing":
		// Broadcast typing indicator
		c.hub.BroadcastToChat(event.ChatID, event)

	case "read_receipt":
		// Broadcast read receipt
		c.hub.BroadcastToChat(event.ChatID, event)
	}
}
