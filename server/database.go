package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

type Database struct {
	db *sql.DB
}

func NewDatabase() (*Database, error) {
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "teleclone"),
		getEnv("DB_PASSWORD", "teleclone"),
		getEnv("DB_NAME", "teleclone"),
	)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return &Database{db: db}, nil
}

func (d *Database) Close() error {
	return d.db.Close()
}

func (d *Database) Migrate() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id VARCHAR(255) PRIMARY KEY,
			phone_number VARCHAR(20) UNIQUE NOT NULL,
			username VARCHAR(100),
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS otp_codes (
			phone_number VARCHAR(20) PRIMARY KEY,
			code VARCHAR(6) NOT NULL,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS messages (
			id VARCHAR(255) PRIMARY KEY,
			from_user VARCHAR(255) NOT NULL,
			to_user VARCHAR(255) NOT NULL,
			chat_id VARCHAR(255) NOT NULL,
			content TEXT NOT NULL,
			message_type VARCHAR(50) DEFAULT 'text',
			created_at TIMESTAMP DEFAULT NOW(),
			edited_at TIMESTAMP,
			deleted_at TIMESTAMP,
			FOREIGN KEY (from_user) REFERENCES users(id),
			FOREIGN KEY (to_user) REFERENCES users(id)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`,
		`CREATE TABLE IF NOT EXISTS chats (
			id VARCHAR(255) PRIMARY KEY,
			type VARCHAR(20) NOT NULL, -- 'direct', 'group'
			name VARCHAR(255),
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS chat_participants (
			chat_id VARCHAR(255) NOT NULL,
			user_id VARCHAR(255) NOT NULL,
			joined_at TIMESTAMP DEFAULT NOW(),
			PRIMARY KEY (chat_id, user_id),
			FOREIGN KEY (chat_id) REFERENCES chats(id),
			FOREIGN KEY (user_id) REFERENCES users(id)
		)`,
	}

	for _, query := range queries {
		if _, err := d.db.Exec(query); err != nil {
			return fmt.Errorf("migration failed: %v\nQuery: %s", err, query)
		}
	}

	log.Println("Database migrations completed successfully")
	return nil
}

func (d *Database) authenticate(phoneNumber, otp, token string) (string, error) {
	// For MVP: Simple OTP verification (in production, use proper OTP service)
	// For dev: accept "123456" as valid OTP for any phone
	if otp == "123456" || otp == "" {
		// Get or create user
		var userID string
		err := d.db.QueryRow(
			"SELECT id FROM users WHERE phone_number = $1",
			phoneNumber,
		).Scan(&userID)

		if err == sql.ErrNoRows {
			// Create new user
			userID = generateUserID(phoneNumber)
			_, err = d.db.Exec(
				"INSERT INTO users (id, phone_number) VALUES ($1, $2)",
				userID, phoneNumber,
			)
			if err != nil {
				return "", err
			}
		} else if err != nil {
			return "", err
		}

		return userID, nil
	}

	// Verify OTP from database
	var expiresAt time.Time
	var code string
	err := d.db.QueryRow(
		"SELECT code, expires_at FROM otp_codes WHERE phone_number = $1",
		phoneNumber,
	).Scan(&code, &expiresAt)

	if err == sql.ErrNoRows {
		return "", fmt.Errorf("OTP not found")
	}
	if err != nil {
		return "", err
	}

	if time.Now().After(expiresAt) {
		return "", fmt.Errorf("OTP expired")
	}

	if code != otp {
		return "", fmt.Errorf("Invalid OTP")
	}

	// Get user
	var userID string
	err = d.db.QueryRow(
		"SELECT id FROM users WHERE phone_number = $1",
		phoneNumber,
	).Scan(&userID)

	if err == sql.ErrNoRows {
		userID = generateUserID(phoneNumber)
		_, err = d.db.Exec(
			"INSERT INTO users (id, phone_number) VALUES ($1, $2)",
			userID, phoneNumber,
		)
		if err != nil {
			return "", err
		}
	} else if err != nil {
		return "", err
	}

	// Delete used OTP
	d.db.Exec("DELETE FROM otp_codes WHERE phone_number = $1", phoneNumber)

	return userID, nil
}

func (d *Database) saveMessage(msg *Message) error {
	// Generate chat_id (for direct messages: sort user IDs)
	chatID := generateChatID(msg.From, msg.To)

	_, err := d.db.Exec(
		`INSERT INTO messages (id, from_user, to_user, chat_id, content, message_type, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		msg.ID, msg.From, msg.To, chatID, msg.Text, msg.Type, msg.Timestamp,
	)
	return err
}

func (d *Database) getMessages(chatID string, limit int) ([]Message, error) {
	rows, err := d.db.Query(
		`SELECT id, from_user, to_user, content, message_type, created_at
		 FROM messages
		 WHERE chat_id = $1 AND deleted_at IS NULL
		 ORDER BY created_at DESC
		 LIMIT $2`,
		chatID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var msg Message
		err := rows.Scan(&msg.ID, &msg.From, &msg.To, &msg.Text, &msg.Type, &msg.Timestamp)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	// Reverse to get chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

func generateUserID(phoneNumber string) string {
	// Remove + and special chars for ID generation
	cleanPhone := ""
	for _, r := range phoneNumber {
		if r >= '0' && r <= '9' {
			cleanPhone += string(r)
		}
	}
	return fmt.Sprintf("user_%s_%d", cleanPhone, time.Now().UnixNano())
}

func generateChatID(user1, user2 string) string {
	if user1 < user2 {
		return fmt.Sprintf("chat_%s_%s", user1, user2)
	}
	return fmt.Sprintf("chat_%s_%s", user2, user1)
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
