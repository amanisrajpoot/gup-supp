package redis

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

func InitRedis() *redis.Client {
	addr := getEnv("REDIS_HOST", "localhost") + ":" + getEnv("REDIS_PORT", "6379")
	password := getEnv("REDIS_PASSWORD", "")

	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	log.Println("✅ Redis connected successfully")
	return rdb
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
