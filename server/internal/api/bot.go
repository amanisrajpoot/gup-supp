package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"teleclone-server/internal/websocket"
)

type BotHandler struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewBotHandler(db *sql.DB, hub *websocket.Hub) *BotHandler {
	return &BotHandler{db: db, hub: hub}
}

// Telegram Bot API compatible endpoints

type BotSendMessageRequest struct {
	ChatID                string `json:"chat_id"`
	Text                  string `json:"text"`
	ParseMode             string `json:"parse_mode,omitempty"`
	DisableWebPagePreview bool   `json:"disable_web_page_preview,omitempty"`
}

type BotResponse struct {
	OK     bool        `json:"ok"`
	Result interface{} `json:"result,omitempty"`
	Error  string      `json:"error,omitempty"`
}

func (h *BotHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	token := vars["token"]

	// Verify bot token
	var botID string
	err := h.db.QueryRow("SELECT id FROM bots WHERE token = $1 AND is_active = true", token).Scan(&botID)
	if err != nil {
		json.NewEncoder(w).Encode(BotResponse{
			OK:    false,
			Error: "Unauthorized",
		})
		return
	}

	var req BotSendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(BotResponse{
			OK:    false,
			Error: "Invalid request",
		})
		return
	}

	// Create message as bot
	messageID := uuid.New().String()
	now := time.Now()

	_, err = h.db.Exec(
		"INSERT INTO messages (id, chat_id, sender_id, content, message_type, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
		messageID, req.ChatID, botID, req.Text, "text", now,
	)
	if err != nil {
		json.NewEncoder(w).Encode(BotResponse{
			OK:    false,
			Error: "Failed to send message",
		})
		return
	}

	// Broadcast message
	memberIDs := h.getChatMembers(req.ChatID)
	messageJSON, _ := json.Marshal(map[string]interface{}{
		"type": "message",
		"data": map[string]interface{}{
			"id":        messageID,
			"chatId":    req.ChatID,
			"senderId":  botID,
			"content":   req.Text,
			"type":      "text",
			"createdAt": now,
		},
	})
	h.hub.SendToChat(memberIDs, messageJSON)

	json.NewEncoder(w).Encode(BotResponse{
		OK: true,
		Result: map[string]interface{}{
			"message_id": messageID,
			"date":       now.Unix(),
			"text":       req.Text,
		},
	})
}

func (h *BotHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	token := vars["token"]

	var bot struct {
		ID        string `json:"id"`
		Username  string `json:"username"`
		FirstName string `json:"first_name"`
		IsBot     bool   `json:"is_bot"`
	}

	err := h.db.QueryRow(
		"SELECT id, username, first_name FROM bots WHERE token = $1 AND is_active = true",
		token,
	).Scan(&bot.ID, &bot.Username, &bot.FirstName)
	if err != nil {
		json.NewEncoder(w).Encode(BotResponse{
			OK:    false,
			Error: "Unauthorized",
		})
		return
	}

	bot.IsBot = true

	json.NewEncoder(w).Encode(BotResponse{
		OK:     true,
		Result: bot,
	})
}

func (h *BotHandler) GetUpdates(w http.ResponseWriter, r *http.Request) {
	// Long polling for bot updates (simplified)
	json.NewEncoder(w).Encode(BotResponse{
		OK:     true,
		Result: []interface{}{},
	})
}

func (h *BotHandler) SetWebhook(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	token := vars["token"]

	var req struct {
		URL string `json:"url"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	// Update webhook URL
	_, err := h.db.Exec(
		"UPDATE bots SET webhook_url = $1 WHERE token = $2",
		req.URL, token,
	)
	if err != nil {
		json.NewEncoder(w).Encode(BotResponse{
			OK:    false,
			Error: "Failed to set webhook",
		})
		return
	}

	json.NewEncoder(w).Encode(BotResponse{
		OK:     true,
		Result: true,
	})
}

func (h *BotHandler) getChatMembers(chatID string) []string {
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
