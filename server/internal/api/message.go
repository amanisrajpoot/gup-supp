package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"teleclone-server/internal/websocket"
)

type MessageHandler struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewMessageHandler(db *sql.DB, hub *websocket.Hub) *MessageHandler {
	return &MessageHandler{db: db, hub: hub}
}

type SendMessageRequest struct {
	ChatID  string `json:"chatId"`
	Content string `json:"content"`
	Type    string `json:"type"`
}

type Message struct {
	ID        string    `json:"id"`
	ChatID    string    `json:"chatId"`
	SenderID  string    `json:"senderId"`
	Content   string    `json:"content"`
	Type      string    `json:"type"`
	MediaURL  *string   `json:"mediaUrl,omitempty"`
	IsEdited  bool      `json:"isEdited"`
	IsDeleted bool      `json:"isDeleted"`
	CreatedAt time.Time `json:"createdAt"`
}

func (h *MessageHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromToken(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	messageID := uuid.New().String()
	now := time.Now()

	// Insert message
	_, err := h.db.Exec(
		"INSERT INTO messages (id, chat_id, sender_id, content, message_type, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
		messageID, req.ChatID, userID, req.Content, req.Type, now,
	)
	if err != nil {
		http.Error(w, "Failed to save message", http.StatusInternalServerError)
		return
	}

	// Get chat members for broadcasting
	memberIDs := h.getChatMembers(req.ChatID)

	// Create message response
	message := Message{
		ID:        messageID,
		ChatID:    req.ChatID,
		SenderID:  userID,
		Content:   req.Content,
		Type:      req.Type,
		IsEdited:  false,
		IsDeleted: false,
		CreatedAt: now,
	}

	// Broadcast to chat members via WebSocket
	messageJSON, _ := json.Marshal(map[string]interface{}{
		"type": "message",
		"data": message,
	})
	h.hub.SendToChat(memberIDs, messageJSON)

	json.NewEncoder(w).Encode(message)
}

func (h *MessageHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromToken(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	chatID := vars["chatId"]

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	rows, err := h.db.Query(
		"SELECT id, chat_id, sender_id, content, message_type, media_url, is_edited, is_deleted, created_at FROM messages WHERE chat_id = $1 AND is_deleted = false ORDER BY created_at DESC LIMIT $2 OFFSET $3",
		chatID, limit, offset,
	)
	if err != nil {
		http.Error(w, "Failed to fetch messages", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var msg Message
		rows.Scan(&msg.ID, &msg.ChatID, &msg.SenderID, &msg.Content, &msg.Type, &msg.MediaURL, &msg.IsEdited, &msg.IsDeleted, &msg.CreatedAt)
		messages = append(messages, msg)
	}

	// Reverse to get chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	json.NewEncoder(w).Encode(messages)
}

func (h *MessageHandler) EditMessage(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromToken(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	messageID := vars["messageId"]

	var req struct {
		Content string `json:"content"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	// Verify ownership
	var senderID string
	err := h.db.QueryRow("SELECT sender_id FROM messages WHERE id = $1", messageID).Scan(&senderID)
	if err != nil || senderID != userID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Update message
	_, err = h.db.Exec(
		"UPDATE messages SET content = $1, is_edited = true, updated_at = $2 WHERE id = $3",
		req.Content, time.Now(), messageID,
	)
	if err != nil {
		http.Error(w, "Failed to update message", http.StatusInternalServerError)
		return
	}

	// Get updated message
	var msg Message
	h.db.QueryRow(
		"SELECT id, chat_id, sender_id, content, message_type, media_url, is_edited, is_deleted, created_at FROM messages WHERE id = $1",
		messageID,
	).Scan(&msg.ID, &msg.ChatID, &msg.SenderID, &msg.Content, &msg.Type, &msg.MediaURL, &msg.IsEdited, &msg.IsDeleted, &msg.CreatedAt)

	// Broadcast update
	memberIDs := h.getChatMembers(msg.ChatID)
	messageJSON, _ := json.Marshal(map[string]interface{}{
		"type": "message_edited",
		"data": msg,
	})
	h.hub.SendToChat(memberIDs, messageJSON)

	json.NewEncoder(w).Encode(msg)
}

func (h *MessageHandler) DeleteMessage(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromToken(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	messageID := vars["messageId"]

	// Verify ownership
	var senderID, chatID string
	err := h.db.QueryRow("SELECT sender_id, chat_id FROM messages WHERE id = $1", messageID).Scan(&senderID, &chatID)
	if err != nil || senderID != userID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Soft delete
	_, err = h.db.Exec("UPDATE messages SET is_deleted = true, updated_at = $1 WHERE id = $2", time.Now(), messageID)
	if err != nil {
		http.Error(w, "Failed to delete message", http.StatusInternalServerError)
		return
	}

	// Broadcast deletion
	memberIDs := h.getChatMembers(chatID)
	messageJSON, _ := json.Marshal(map[string]interface{}{
		"type": "message_deleted",
		"data": map[string]string{"messageId": messageID, "chatId": chatID},
	})
	h.hub.SendToChat(memberIDs, messageJSON)

	w.WriteHeader(http.StatusOK)
}

func (h *MessageHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromToken(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	chatID := vars["chatId"]

	// In production, store read receipts in database
	// For PoC, just acknowledge
	w.WriteHeader(http.StatusOK)
}

func (h *MessageHandler) getChatMembers(chatID string) []string {
	rows, err := h.db.Query(
		"SELECT user_id FROM group_members WHERE chat_id = $1 UNION SELECT created_by FROM chats WHERE id = $1",
		chatID,
	)
	if err != nil {
		return []string{}
	}
	defer rows.Close()

	var memberIDs []string
	for rows.Next() {
		var userID string
		rows.Scan(&userID)
		memberIDs = append(memberIDs, userID)
	}
	return memberIDs
}
