package websocket

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period (must be less than pongWait)
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer
	maxMessageSize = 512 * 1024 // 512KB
)

// Client represents a WebSocket connection
type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	UserID string
	send   chan []byte
}

// NewClient creates a new Client instance
func NewClient(hub *Hub, conn *websocket.Conn, userID string) *Client {
	return &Client{
		hub:    hub,
		conn:   conn,
		UserID: userID,
		send:   make(chan []byte, 256),
	}
}

// ReadPump pumps messages from the WebSocket connection to the hub
func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetReadLimit(maxMessageSize)
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

		// Parse message and handle different message types
		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Failed to parse message: %v", err)
			continue
		}

		// Handle message based on type
		c.handleMessage(msg)
	}
}

// WritePump pumps messages from the hub to the WebSocket connection
func (c *Client) WritePump() {
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

			// Add queued messages to the current websocket message
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

// handleMessage processes incoming messages from the client
func (c *Client) handleMessage(msg map[string]interface{}) {
	msgType, ok := msg["type"].(string)
	if !ok {
		return
	}

	switch msgType {
	case "typing":
		// Handle typing indicator
		c.hub.broadcast <- c.createResponse("typing", map[string]interface{}{
			"userId":  c.UserID,
			"chatId":  msg["chatId"],
			"typing":  msg["typing"],
			"timestamp": time.Now().Unix(),
		})

	case "read_receipt":
		// Handle read receipt
		c.hub.broadcast <- c.createResponse("read_receipt", map[string]interface{}{
			"userId":    c.UserID,
			"messageId": msg["messageId"],
			"chatId":    msg["chatId"],
			"timestamp": time.Now().Unix(),
		})

	case "ping":
		// Respond to ping
		c.send <- c.createResponse("pong", map[string]interface{}{
			"timestamp": time.Now().Unix(),
		})
	}
}

// createResponse creates a JSON response message
func (c *Client) createResponse(msgType string, data map[string]interface{}) []byte {
	response := map[string]interface{}{
		"type": msgType,
		"data": data,
	}
	jsonData, _ := json.Marshal(response)
	return jsonData
}
