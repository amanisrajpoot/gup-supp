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

type ChatHandler struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewChatHandler(db *sql.DB, hub *websocket.Hub) *ChatHandler {
	return &ChatHandler{db: db, hub: hub}
}

type Chat struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"`
	Name        *string   `json:"name"`
	Description *string   `json:"description"`
	AvatarURL   *string   `json:"avatarUrl"`
	CreatedBy   *string   `json:"createdBy"`
	CreatedAt   time.Time `json:"createdAt"`
}

func (h *ChatHandler) GetChats(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromToken(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get all chats user is member of
	rows, err := h.db.Query(`
		SELECT DISTINCT c.id, c.type, c.name, c.description, c.avatar_url, c.created_by, c.created_at
		FROM chats c
		LEFT JOIN group_members gm ON c.id = gm.chat_id
		WHERE c.created_by = $1 OR gm.user_id = $1
		ORDER BY c.updated_at DESC
	`, userID)
	if err != nil {
		http.Error(w, "Failed to fetch chats", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var chats []Chat
	for rows.Next() {
		var chat Chat
		rows.Scan(&chat.ID, &chat.Type, &chat.Name, &chat.Description, &chat.AvatarURL, &chat.CreatedBy, &chat.CreatedAt)
		chats = append(chats, chat)
	}

	json.NewEncoder(w).Encode(chats)
}

func (h *ChatHandler) GetChat(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromToken(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	chatID := vars["chatId"]

	var chat Chat
	err := h.db.QueryRow(
		"SELECT id, type, name, description, avatar_url, created_by, created_at FROM chats WHERE id = $1",
		chatID,
	).Scan(&chat.ID, &chat.Type, &chat.Name, &chat.Description, &chat.AvatarURL, &chat.CreatedBy, &chat.CreatedAt)

	if err != nil {
		http.Error(w, "Chat not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(chat)
}

func (h *ChatHandler) CreateChat(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromToken(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		ParticipantID string `json:"participantId"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	chatID := uuid.New().String()
	now := time.Now()

	// Create private chat
	_, err := h.db.Exec(
		"INSERT INTO chats (id, type, created_by, created_at) VALUES ($1, $2, $3, $4)",
		chatID, "private", userID, now,
	)
	if err != nil {
		http.Error(w, "Failed to create chat", http.StatusInternalServerError)
		return
	}

	// Add members
	h.db.Exec("INSERT INTO group_members (id, chat_id, user_id) VALUES ($1, $2, $3)", uuid.New(), chatID, userID)
	h.db.Exec("INSERT INTO group_members (id, chat_id, user_id) VALUES ($1, $2, $3)", uuid.New(), chatID, req.ParticipantID)

	var chat Chat
	h.db.QueryRow(
		"SELECT id, type, name, description, avatar_url, created_by, created_at FROM chats WHERE id = $1",
		chatID,
	).Scan(&chat.ID, &chat.Type, &chat.Name, &chat.Description, &chat.AvatarURL, &chat.CreatedBy, &chat.CreatedAt)

	json.NewEncoder(w).Encode(chat)
}

func (h *ChatHandler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromToken(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Name         string   `json:"name"`
		Participants []string `json:"participants"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	chatID := uuid.New().String()
	now := time.Now()

	// Create group chat
	_, err := h.db.Exec(
		"INSERT INTO chats (id, type, name, created_by, created_at) VALUES ($1, $2, $3, $4, $5)",
		chatID, "group", req.Name, userID, now,
	)
	if err != nil {
		http.Error(w, "Failed to create group", http.StatusInternalServerError)
		return
	}

	// Add creator as admin
	h.db.Exec("INSERT INTO group_members (id, chat_id, user_id, role) VALUES ($1, $2, $3, $4)", uuid.New(), chatID, userID, "admin")

	// Add participants
	for _, participantID := range req.Participants {
		h.db.Exec("INSERT INTO group_members (id, chat_id, user_id) VALUES ($1, $2, $3)", uuid.New(), chatID, participantID)
	}

	var chat Chat
	h.db.QueryRow(
		"SELECT id, type, name, description, avatar_url, created_by, created_at FROM chats WHERE id = $1",
		chatID,
	).Scan(&chat.ID, &chat.Type, &chat.Name, &chat.Description, &chat.AvatarURL, &chat.CreatedBy, &chat.CreatedAt)

	json.NewEncoder(w).Encode(chat)
}

func (h *ChatHandler) AddToGroup(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromToken(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	groupId := vars["groupId"]

	var req struct {
		UserIDs []string `json:"userIds"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	for _, uid := range req.UserIDs {
		h.db.Exec("INSERT INTO group_members (id, chat_id, user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", uuid.New(), groupId, uid)
	}

	w.WriteHeader(http.StatusOK)
}

func (h *ChatHandler) RemoveFromGroup(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromToken(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	groupId := vars["groupId"]

	var req struct {
		UserID string `json:"userId"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	h.db.Exec("DELETE FROM group_members WHERE chat_id = $1 AND user_id = $2", groupId, req.UserID)

	w.WriteHeader(http.StatusOK)
}

func (h *ChatHandler) SetTyping(w http.ResponseWriter, r *http.Request) {
	userID := getUserIDFromToken(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		ChatID  string `json:"chatId"`
		Typing  bool   `json:"typing"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	// Broadcast typing indicator
	memberIDs := h.getChatMembers(req.ChatID)
	typingJSON, _ := json.Marshal(map[string]interface{}{
		"type": "typing",
		"data": map[string]interface{}{
			"userId":  userID,
			"chatId":  req.ChatID,
			"typing":  req.Typing,
			"timestamp": time.Now().Unix(),
		},
	})
	h.hub.SendToChat(memberIDs, typingJSON)

	w.WriteHeader(http.StatusOK)
}

func (h *ChatHandler) getChatMembers(chatID string) []string {
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
