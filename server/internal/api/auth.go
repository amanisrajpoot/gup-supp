package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db *sql.DB
}

func NewAuthHandler(db *sql.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

type SendOTPRequest struct {
	PhoneNumber string `json:"phoneNumber"`
}

type VerifyOTPRequest struct {
	PhoneNumber string `json:"phoneNumber"`
	OTP         string `json:"otp"`
}

type RegisterRequest struct {
	PhoneNumber string `json:"phoneNumber"`
	Username    string `json:"username"`
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
}

type LoginRequest struct {
	PhoneNumber string `json:"phoneNumber"`
	Password    string `json:"password"`
}

type AuthResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refreshToken"`
	User         User   `json:"user"`
}

type User struct {
	ID        string    `json:"id"`
	Phone     string    `json:"phone"`
	Username  *string   `json:"username"`
	FirstName *string   `json:"firstName"`
	LastName  *string   `json:"lastName"`
	AvatarURL *string   `json:"avatarUrl"`
	CreatedAt time.Time `json:"createdAt"`
}

// In-memory OTP storage (use Redis in production)
var otpStore = make(map[string]string)

func (h *AuthHandler) SendOTP(w http.ResponseWriter, r *http.Request) {
	var req SendOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Generate OTP (in production, use SMS service)
	otp := "123456" // For development only
	otpStore[req.PhoneNumber] = otp

	// In production, send OTP via SMS
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "OTP sent (dev: " + otp + ")",
	})
}

func (h *AuthHandler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var req VerifyOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Verify OTP
	storedOTP, ok := otpStore[req.PhoneNumber]
	if !ok || storedOTP != req.OTP {
		http.Error(w, "Invalid OTP", http.StatusUnauthorized)
		return
	}

	delete(otpStore, req.PhoneNumber)

	// Check if user exists
	var userID string
	err := h.db.QueryRow("SELECT id FROM users WHERE phone = $1", req.PhoneNumber).Scan(&userID)
	if err == sql.ErrNoRows {
		// User doesn't exist, create new user
		userID = uuid.New().String()
		_, err = h.db.Exec(
			"INSERT INTO users (id, phone, created_at) VALUES ($1, $2, $3)",
			userID, req.PhoneNumber, time.Now(),
		)
		if err != nil {
			http.Error(w, "Failed to create user", http.StatusInternalServerError)
			return
		}
	}

	// Generate tokens
	token, refreshToken := h.generateTokens(userID)

	// Get user
	user := h.getUser(userID)

	json.NewEncoder(w).Encode(AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	})
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	userID := uuid.New().String()
	_, err := h.db.Exec(
		"INSERT INTO users (id, phone, username, first_name, last_name, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
		userID, req.PhoneNumber, req.Username, req.FirstName, req.LastName, time.Now(),
	)
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	token, refreshToken := h.generateTokens(userID)
	user := h.getUser(userID)

	json.NewEncoder(w).Encode(AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	var userID string
	err := h.db.QueryRow("SELECT id FROM users WHERE phone = $1", req.PhoneNumber).Scan(&userID)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, refreshToken := h.generateTokens(userID)
	user := h.getUser(userID)

	json.NewEncoder(w).Encode(AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	})
}

func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Verify refresh token and generate new access token
	// Simplified for PoC
	token, refreshToken := h.generateTokens("user-id") // Extract from token in production

	json.NewEncoder(w).Encode(map[string]string{
		"token":        token,
		"refreshToken": refreshToken,
	})
}

func (h *AuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := h.getUserIDFromToken(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	user := h.getUser(userID)
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := h.getUserIDFromToken(r)
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var updates map[string]interface{}
	json.NewDecoder(r.Body).Decode(&updates)

	// Update user in database
	// Simplified for PoC

	user := h.getUser(userID)
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) generateTokens(userID string) (string, string) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte("secret-key")) // Use env var in production

	refreshClaims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, _ := refreshToken.SignedString([]byte("refresh-secret-key"))

	return tokenString, refreshTokenString
}

func (h *AuthHandler) getUser(userID string) User {
	var user User
	h.db.QueryRow(
		"SELECT id, phone, username, first_name, last_name, avatar_url, created_at FROM users WHERE id = $1",
		userID,
	).Scan(&user.ID, &user.Phone, &user.Username, &user.FirstName, &user.LastName, &user.AvatarURL, &user.CreatedAt)
	return user
}

func (h *AuthHandler) getUserIDFromToken(r *http.Request) string {
	tokenString := r.Header.Get("Authorization")
	if len(tokenString) < 7 {
		return ""
	}
	tokenString = tokenString[7:] // Remove "Bearer "

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte("secret-key"), nil
	})
	if err != nil || !token.Valid {
		return ""
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return ""
	}

	userID, ok := claims["user_id"].(string)
	if !ok {
		return ""
	}

	return userID
}
