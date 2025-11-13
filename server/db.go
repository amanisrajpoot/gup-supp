package main

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

type DB struct {
	*sql.DB
}

type User struct {
	ID        string    `json:"id"`
	Phone     string    `json:"phone"`
	Username  string    `json:"username"`
	Name      string    `json:"name"`
	Avatar    string    `json:"avatar"`
	CreatedAt time.Time `json:"created_at"`
}

type Chat struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"` // "individual" or "group"
	Name        string    `json:"name"`
	Avatar      string    `json:"avatar"`
	Participants []string  `json:"participants"`
	LastMessage *Message  `json:"last_message,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type Message struct {
	ID        string    `json:"id"`
	ChatID    string    `json:"chat_id"`
	SenderID  string    `json:"sender_id"`
	Content   string    `json:"content"`
	Type      string    `json:"type"` // "text", "image", "video", etc.
	Edited    bool      `json:"edited"`
	Deleted   bool      `json:"deleted"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func NewDB() (*DB, error) {
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return &DB{db}, nil
}

func (db *DB) Migrate() error {
	queries := []string{
		// Users table
		`CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			phone VARCHAR(20) UNIQUE NOT NULL,
			username VARCHAR(50) UNIQUE,
			name VARCHAR(100) NOT NULL,
			avatar TEXT,
			password_hash TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Chats table
		`CREATE TABLE IF NOT EXISTS chats (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			type VARCHAR(20) NOT NULL CHECK (type IN ('individual', 'group')),
			name VARCHAR(100),
			avatar TEXT,
			created_by UUID REFERENCES users(id),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Chat participants (many-to-many)
		`CREATE TABLE IF NOT EXISTS chat_participants (
			chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
			user_id UUID REFERENCES users(id) ON DELETE CASCADE,
			joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (chat_id, user_id)
		)`,

		// Messages table (append-only with edits tracked)
		`CREATE TABLE IF NOT EXISTS messages (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
			sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			type VARCHAR(20) NOT NULL DEFAULT 'text',
			edited BOOLEAN DEFAULT FALSE,
			deleted BOOLEAN DEFAULT FALSE,
			reply_to UUID REFERENCES messages(id),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Message edits (for history)
		`CREATE TABLE IF NOT EXISTS message_edits (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Indexes for performance
		`CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`,
		`CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`,
		`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return fmt.Errorf("migration failed: %v", err)
		}
	}

	return nil
}

func (db *DB) CreateUser(phone, username, name, passwordHash string) (string, error) {
	id := uuid.New().String()
	query := `INSERT INTO users (id, phone, username, name, password_hash) 
			  VALUES ($1, $2, $3, $4, $5) RETURNING id`
	err := db.QueryRow(query, id, phone, username, name, passwordHash).Scan(&id)
	return id, err
}

func (db *DB) GetUserByPhone(phone string) (*User, error) {
	user := &User{}
	query := `SELECT id, phone, username, name, avatar, created_at FROM users WHERE phone = $1`
	err := db.QueryRow(query, phone).Scan(
		&user.ID, &user.Phone, &user.Username, &user.Name, &user.Avatar, &user.CreatedAt,
	)
	return user, err
}

func (db *DB) GetUserChats(userID string) ([]*Chat, error) {
	query := `
		SELECT c.id, c.type, c.name, c.avatar, c.created_at
		FROM chats c
		INNER JOIN chat_participants cp ON c.id = cp.chat_id
		WHERE cp.user_id = $1
		ORDER BY c.created_at DESC
	`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var chats []*Chat
	for rows.Next() {
		chat := &Chat{}
		if err := rows.Scan(&chat.ID, &chat.Type, &chat.Name, &chat.Avatar, &chat.CreatedAt); err != nil {
			return nil, err
		}

		// Get participants
		participants, _ := db.GetChatParticipants(chat.ID)
		chat.Participants = participants

		// Get last message
		lastMsg, _ := db.GetLastMessage(chat.ID)
		chat.LastMessage = lastMsg

		chats = append(chats, chat)
	}

	return chats, nil
}

func (db *DB) GetChat(chatID, userID string) (*Chat, error) {
	// Verify user is participant
	var exists bool
	err := db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2)`,
		chatID, userID,
	).Scan(&exists)
	if err != nil || !exists {
		return nil, fmt.Errorf("chat not found or access denied")
	}

	chat := &Chat{}
	query := `SELECT id, type, name, avatar, created_at FROM chats WHERE id = $1`
	err = db.QueryRow(query, chatID).Scan(&chat.ID, &chat.Type, &chat.Name, &chat.Avatar, &chat.CreatedAt)
	if err != nil {
		return nil, err
	}

	chat.Participants, _ = db.GetChatParticipants(chatID)
	chat.LastMessage, _ = db.GetLastMessage(chatID)

	return chat, nil
}

func (db *DB) GetChatParticipants(chatID string) ([]string, error) {
	query := `SELECT user_id FROM chat_participants WHERE chat_id = $1`
	rows, err := db.Query(query, chatID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var participants []string
	for rows.Next() {
		var userID string
		if err := rows.Scan(&userID); err != nil {
			return nil, err
		}
		participants = append(participants, userID)
	}

	return participants, nil
}

func (db *DB) GetLastMessage(chatID string) (*Message, error) {
	msg := &Message{}
	query := `SELECT id, chat_id, sender_id, content, type, edited, deleted, created_at, updated_at
			  FROM messages WHERE chat_id = $1 AND deleted = FALSE
			  ORDER BY created_at DESC LIMIT 1`
	err := db.QueryRow(query, chatID).Scan(
		&msg.ID, &msg.ChatID, &msg.SenderID, &msg.Content, &msg.Type,
		&msg.Edited, &msg.Deleted, &msg.CreatedAt, &msg.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return msg, err
}

func (db *DB) CreateMessage(senderID, chatID, content, msgType string) (*Message, error) {
	msg := &Message{
		ID:       uuid.New().String(),
		ChatID:   chatID,
		SenderID: senderID,
		Content:  content,
		Type:     msgType,
	}

	query := `INSERT INTO messages (id, chat_id, sender_id, content, type)
			  VALUES ($1, $2, $3, $4, $5)
			  RETURNING created_at, updated_at`
	err := db.QueryRow(query, msg.ID, msg.ChatID, msg.SenderID, msg.Content, msg.Type).
		Scan(&msg.CreatedAt, &msg.UpdatedAt)

	return msg, err
}

func (db *DB) GetMessages(chatID, page, limit string) ([]*Message, error) {
	// Default pagination
	if limit == "" {
		limit = "50"
	}
	if page == "" {
		page = "1"
	}

	query := `SELECT id, chat_id, sender_id, content, type, edited, deleted, created_at, updated_at
			  FROM messages WHERE chat_id = $1 AND deleted = FALSE
			  ORDER BY created_at DESC LIMIT $2 OFFSET $3`

	rows, err := db.Query(query, chatID, limit, (page+"0")[0:len(limit)])
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*Message
	for rows.Next() {
		msg := &Message{}
		if err := rows.Scan(
			&msg.ID, &msg.ChatID, &msg.SenderID, &msg.Content, &msg.Type,
			&msg.Edited, &msg.Deleted, &msg.CreatedAt, &msg.UpdatedAt,
		); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	return messages, nil
}

func (db *DB) EditMessage(messageID, userID, newContent string) (*Message, error) {
	// Verify ownership
	var msg Message
	err := db.QueryRow(
		`SELECT id, chat_id, sender_id, content, type, edited, deleted, created_at, updated_at
		 FROM messages WHERE id = $1 AND sender_id = $2`,
		messageID, userID,
	).Scan(&msg.ID, &msg.ChatID, &msg.SenderID, &msg.Content, &msg.Type,
		&msg.Edited, &msg.Deleted, &msg.CreatedAt, &msg.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Store edit history
	db.Exec(`INSERT INTO message_edits (message_id, content) VALUES ($1, $2)`, messageID, msg.Content)

	// Update message
	query := `UPDATE messages SET content = $1, edited = TRUE, updated_at = CURRENT_TIMESTAMP
			  WHERE id = $2 RETURNING id, chat_id, sender_id, content, type, edited, deleted, created_at, updated_at`
	err = db.QueryRow(query, newContent, messageID).Scan(
		&msg.ID, &msg.ChatID, &msg.SenderID, &msg.Content, &msg.Type,
		&msg.Edited, &msg.Deleted, &msg.CreatedAt, &msg.UpdatedAt,
	)

	return &msg, err
}

func (db *DB) DeleteMessage(messageID, userID string) error {
	// Verify ownership
	var exists bool
	err := db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM messages WHERE id = $1 AND sender_id = $2)`,
		messageID, userID,
	).Scan(&exists)
	if err != nil || !exists {
		return fmt.Errorf("message not found or access denied")
	}

	_, err = db.Exec(`UPDATE messages SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, messageID)
	return err
}

func (db *DB) CreateGroup(creatorID, name string, participantIDs []string) (*Chat, error) {
	chat := &Chat{
		ID:   uuid.New().String(),
		Type: "group",
		Name: name,
	}

	// Create chat
	query := `INSERT INTO chats (id, type, name, created_by) VALUES ($1, $2, $3, $4) RETURNING created_at`
	err := db.QueryRow(query, chat.ID, chat.Type, chat.Name, creatorID).Scan(&chat.CreatedAt)
	if err != nil {
		return nil, err
	}

	// Add creator as participant
	participantIDs = append([]string{creatorID}, participantIDs...)

	// Add all participants
	for _, userID := range participantIDs {
		db.Exec(`INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2)`, chat.ID, userID)
	}

	chat.Participants = participantIDs
	return chat, nil
}

func (db *DB) SearchMessages(userID, chatID, query string) ([]*Message, error) {
	var rows *sql.Rows
	var err error

	if chatID != "" {
		// Search within specific chat
		searchQuery := `SELECT id, chat_id, sender_id, content, type, edited, deleted, created_at, updated_at
						FROM messages WHERE chat_id = $1 AND content ILIKE $2 AND deleted = FALSE
						ORDER BY created_at DESC LIMIT 50`
		rows, err = db.Query(searchQuery, chatID, "%"+query+"%")
	} else {
		// Search across user's chats
		searchQuery := `SELECT m.id, m.chat_id, m.sender_id, m.content, m.type, m.edited, m.deleted, m.created_at, m.updated_at
						FROM messages m
						INNER JOIN chat_participants cp ON m.chat_id = cp.chat_id
						WHERE cp.user_id = $1 AND m.content ILIKE $2 AND m.deleted = FALSE
						ORDER BY m.created_at DESC LIMIT 50`
		rows, err = db.Query(searchQuery, userID, "%"+query+"%")
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*Message
	for rows.Next() {
		msg := &Message{}
		if err := rows.Scan(
			&msg.ID, &msg.ChatID, &msg.SenderID, &msg.Content, &msg.Type,
			&msg.Edited, &msg.Deleted, &msg.CreatedAt, &msg.UpdatedAt,
		); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	return messages, nil
}
