package api

import (
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

func getUserIDFromToken(r *http.Request) string {
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
