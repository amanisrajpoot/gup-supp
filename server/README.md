# TeleClone Server

A high-performance messaging server built with Go, implementing Telegram-like features with Bot API compatibility.

## Features

- ✅ Phone-based authentication with OTP
- ✅ Real-time messaging via WebSocket
- ✅ Cloud chats (private and group)
- ✅ Message editing and deletion
- ✅ Bot API compatibility (Telegram Bot API compatible endpoints)
- ✅ PostgreSQL for persistent storage
- ✅ Redis for presence and caching

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f server

# Stop services
docker-compose down
```

The server will be available at `http://localhost:8080`

### Manual Setup

1. **Prerequisites**
   - Go 1.21+
   - PostgreSQL 15+
   - Redis 7+

2. **Install Dependencies**
   ```bash
   cd server
   go mod download
   ```

3. **Set Environment Variables**
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_USER=teleclone
   export DB_PASSWORD=teleclone
   export DB_NAME=teleclone
   export REDIS_HOST=localhost
   export REDIS_PORT=6379
   export PORT=8080
   ```

4. **Run Database Migrations**
   Migrations run automatically on server start.

5. **Start Server**
   ```bash
   go run main.go
   ```

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and get token
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with phone/password
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Chats
- `GET /api/chat/chats` - Get all user chats
- `POST /api/chat/chats` - Create private chat
- `GET /api/chat/chats/{chatId}` - Get chat details
- `POST /api/chat/groups` - Create group chat
- `POST /api/chat/groups/{groupId}/add` - Add members to group
- `POST /api/chat/groups/{groupId}/remove` - Remove member from group

### Messages
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages/{chatId}` - Get messages (paginated)
- `PUT /api/chat/messages/{messageId}` - Edit message
- `DELETE /api/chat/messages/{messageId}` - Delete message
- `POST /api/chat/mark-read/{chatId}` - Mark chat as read

### WebSocket
- `WS /ws?userId={userId}` - WebSocket connection for real-time updates

### Bot API (Telegram Compatible)
- `POST /bot/{token}/sendMessage` - Send message as bot
- `GET /bot/{token}/getMe` - Get bot info
- `GET /bot/{token}/getUpdates` - Get bot updates (long polling)
- `POST /bot/{token}/setWebhook` - Set webhook URL

## Development

### Project Structure
```
server/
├── main.go                 # Application entry point
├── internal/
│   ├── api/               # HTTP handlers
│   │   ├── auth.go        # Authentication handlers
│   │   ├── chat.go        # Chat handlers
│   │   ├── message.go     # Message handlers
│   │   ├── bot.go         # Bot API handlers
│   │   ├── websocket.go   # WebSocket handler
│   │   └── router.go      # Route configuration
│   ├── database/          # Database connection and migrations
│   ├── redis/            # Redis client
│   └── websocket/        # WebSocket hub and client
└── Dockerfile            # Docker build configuration
```

### Testing

```bash
# Run tests
go test ./...

# Run with coverage
go test -cover ./...
```

## Security Notes

- **Development Mode**: OTP is hardcoded to "123456" for testing
- **JWT Secret**: Uses hardcoded secret - use environment variable in production
- **CORS**: Currently allows all origins - restrict in production
- **Encryption**: Cloud chats are server-side encrypted (not E2E) - document clearly for users

## Production Considerations

1. Use environment variables for secrets
2. Implement proper SMS service for OTP
3. Add rate limiting
4. Enable HTTPS/TLS
5. Configure proper CORS
6. Add monitoring and logging
7. Implement proper error handling
8. Add database connection pooling
9. Implement message queuing (Kafka/RabbitMQ) for scale
10. Add CDN for media files

## License

MIT
