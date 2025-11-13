# TeleClone Server - MVP Backend

A minimal, production-ready messaging server implementing Telegram's core features with Bot API compatibility.

## Features

- ✅ User authentication (phone + OTP)
- ✅ Cloud chats (1-on-1 and groups)
- ✅ Message send/edit/delete
- ✅ Real-time WebSocket messaging
- ✅ Message search
- ✅ Group management (up to 2000 members)
- ✅ Bot API compatibility layer
- ✅ PostgreSQL for persistence
- ✅ Redis for presence/OTP storage

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Go 1.21+ (for local development)

### Run with Docker Compose

```bash
cd server
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- HTTP API server on port 8080
- WebSocket server on port 8081

### Local Development

1. **Start dependencies:**
   ```bash
   docker-compose up -d postgres redis
   ```

2. **Run migrations and start server:**
   ```bash
   go mod tidy
   go run .
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user (phone + username)
- `POST /api/auth/login` - Login with phone + OTP
- `POST /api/auth/verify-otp` - Verify OTP

### Chats

- `GET /api/chats` - Get user's chats (requires auth)
- `GET /api/chats/{chatId}` - Get specific chat

### Messages

- `POST /api/messages` - Send message
- `GET /api/messages/{chatId}?page=1&limit=50` - Get messages
- `PUT /api/messages/edit/{messageId}` - Edit message
- `DELETE /api/messages/delete/{messageId}` - Delete message

### Groups

- `POST /api/groups` - Create group
- `GET /api/groups/{groupId}` - Get group info
- `POST /api/groups/{groupId}/add` - Add members
- `POST /api/groups/{groupId}/remove` - Remove member

### Search

- `GET /api/search?q=query&chat_id=optional` - Search messages

### Bot API

- `POST /bot/api/sendMessage` - Bot send message (Telegram Bot API compatible)

## WebSocket Events

Connect to `/ws?token=YOUR_JWT_TOKEN`

### Client → Server

```json
{
  "type": "join_chat",
  "chat_id": "uuid"
}

{
  "type": "typing",
  "chat_id": "uuid",
  "is_typing": true
}

{
  "type": "read_receipt",
  "message_id": "uuid",
  "chat_id": "uuid"
}
```

### Server → Client

```json
{
  "type": "message",
  "message": {
    "id": "uuid",
    "chat_id": "uuid",
    "sender_id": "uuid",
    "content": "Hello",
    "type": "text",
    "created_at": "2024-01-01T00:00:00Z"
  }
}

{
  "type": "message_edited",
  "message": { ... }
}

{
  "type": "message_deleted",
  "message_id": "uuid"
}
```

## Database Schema

### Users
- `id` (UUID)
- `phone` (VARCHAR, unique)
- `username` (VARCHAR, unique, nullable)
- `name` (VARCHAR)
- `avatar` (TEXT, nullable)
- `password_hash` (TEXT)
- `created_at` (TIMESTAMP)

### Chats
- `id` (UUID)
- `type` (VARCHAR: 'individual' | 'group')
- `name` (VARCHAR, nullable)
- `avatar` (TEXT, nullable)
- `created_by` (UUID, FK)
- `created_at` (TIMESTAMP)

### Messages (Append-only)
- `id` (UUID)
- `chat_id` (UUID, FK)
- `sender_id` (UUID, FK)
- `content` (TEXT)
- `type` (VARCHAR: 'text' | 'image' | 'video' | ...)
- `edited` (BOOLEAN)
- `deleted` (BOOLEAN)
- `reply_to` (UUID, FK, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Message Edits (History)
- `id` (UUID)
- `message_id` (UUID, FK)
- `content` (TEXT)
- `edited_at` (TIMESTAMP)

## Testing

### Register a user:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "username": "testuser", "name": "Test User"}'
```

### Login (get OTP):
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "otp": "123456"}'
```

### Send message:
```bash
curl -X POST http://localhost:8080/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"chat_id": "uuid", "content": "Hello!", "type": "text"}'
```

## Architecture Notes

- **Stateless API servers** - Can scale horizontally behind load balancer
- **WebSocket Hub** - Manages real-time connections and chat rooms
- **Append-only messages** - Edits create history entries, deletes are soft
- **Redis** - Used for OTP storage, presence, and ephemeral state
- **PostgreSQL** - Authoritative data store with proper indexes

## Next Steps

1. Add file/media upload endpoints
2. Implement CDN integration for media
3. Add scheduled messages
4. Enhance Bot API compatibility
5. Add rate limiting and security hardening
6. Implement message delivery ACKs
7. Add presence/online status tracking

## Security Notes

⚠️ **Development Mode**: 
- JWT secret is hardcoded (change in production!)
- OTP is returned in response (remove in production!)
- CORS allows all origins (restrict in production!)

For production:
- Use environment variables for secrets
- Implement proper SMS OTP service
- Add rate limiting
- Enable HTTPS/TLS
- Restrict CORS origins
- Add input validation and sanitization
