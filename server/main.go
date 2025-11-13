package main

import (
	"log"
	"net/http"
	"os"

	"teleclone-server/internal/api"
	"teleclone-server/internal/database"
	"teleclone-server/internal/redis"
	"teleclone-server/internal/websocket"
)

func main() {
	// Initialize database
	db, err := database.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Initialize Redis
	rdb := redis.InitRedis()
	defer rdb.Close()

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Initialize API routes
	router := api.NewRouter(db, rdb, hub)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 TeleClone server starting on port %s", port)
	log.Printf("📡 WebSocket endpoint: ws://localhost:%s/ws", port)
	log.Printf("🤖 Bot API endpoint: http://localhost:%s/bot", port)

	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
