# TeleClone Server Setup Guide

This guide will help you set up and run the TeleClone messaging server with Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- Go 1.21+ (if building locally)
- PostgreSQL client (optional, for debugging)

## Quick Start

### 1. Start the Server Stack

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Redis on port 6379
- Go messaging server on port 3000

### 2. Verify Services

Check that all services are running:

```bash
docker-compose ps
```

You should see all three services with "Up" status.

### 3. View Server Logs

```bash
docker-compose logs -f server
```

## API Endpoints

### Authentication

#### Send OTP
```bash
POST /api/auth/send-otp
Content-Type: application/json

{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "otp": "123456"  // Only in dev mode
}
```

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "otp": "123456",
  "name": "John Doe",
  "username": "johndoe",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "uuid",
    "phone": "+1234567890",
    "username": "johndoe",
    "name": "John Doe",
    "avatar": "",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "phone": "+1234567890",
  "password": "securepassword"
}
```

**Response:** Same as register

#### Verify OTP
```bash
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

### Chat Operations

All chat endpoints require authentication via `Authorization: Bearer <token>` header.

#### Get Chats
```bash
GET /api/chat/chats
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "individual",
    "name": null,
    "participants": ["user_id_1", "user_id_2"],
    "lastMessage": {
      "id": "msg_id",
      "senderId": "user_id",
      "content": "Hello!",
      "type": "text",
      "createdAt": "2024-01-01T00:00:00Z",
      "status": "sent"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Get Messages
```bash
GET /api/chat/messages?chatId=<chat_id>
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "chatId": "chat_id",
    "senderId": "user_id",
    "content": "Hello!",
    "type": "text",
    "createdAt": "2024-01-01T00:00:00Z",
    "status": "sent"
  }
]
```

#### Send Message
```bash
POST /api/chat/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "chatId": "chat_id",
  "content": "Hello, world!",
  "type": "text"
}
```

**Response:**
```json
{
  "id": "uuid",
  "chatId": "chat_id",
  "senderId": "user_id",
  "content": "Hello, world!",
  "type": "text",
  "createdAt": "2024-01-01T00:00:00Z",
  "status": "sent"
}
```

#### Create Chat
```bash
POST /api/chat/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "individual",
  "participants": ["user_id_1", "user_id_2"]
}
```

For groups:
```json
{
  "type": "group",
  "name": "My Group",
  "participants": ["user_id_1", "user_id_2", "user_id_3"]
}
```

### WebSocket Connection

Connect to WebSocket endpoint:

```
ws://localhost:3000/ws?token=<jwt_token>
```

**Message Format:**
```json
{
  "type": "message",
  "payload": {
    "id": "uuid",
    "chatId": "chat_id",
    "senderId": "user_id",
    "content": "Hello!",
    "type": "text",
    "createdAt": "2024-01-01T00:00:00Z",
    "status": "sent"
  }
}
```

## Development

### Building Locally

If you want to build and run the server locally:

```bash
cd server
go mod tidy
go run main.go
```

Set environment variables:
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=teleclone
export REDIS_HOST=localhost
export REDIS_PORT=6379
export PORT=3000
```

### Database Access

Connect to PostgreSQL:
```bash
docker exec -it teleclone-postgres psql -U postgres -d teleclone
```

### Redis Access

Connect to Redis CLI:
```bash
docker exec -it teleclone-redis redis-cli
```

## Testing the API

### Using curl

1. **Send OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

2. **Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "otp": "123456",
    "name": "Test User",
    "password": "testpass123"
  }'
```

3. **Get Chats:**
```bash
curl -X GET http://localhost:3000/api/chat/chats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

Import the following collection:

1. Create a new collection "TeleClone API"
2. Add environment variables:
   - `base_url`: `http://localhost:3000`
   - `token`: (will be set after login)

3. Add requests:
   - Send OTP: `POST {{base_url}}/api/auth/send-otp`
   - Register: `POST {{base_url}}/api/auth/register`
   - Login: `POST {{base_url}}/api/auth/login`
   - Get Chats: `GET {{base_url}}/api/chat/chats` (with Authorization header)

## Troubleshooting

### Server won't start

1. Check if ports 3000, 5432, 6379 are available:
```bash
lsof -i :3000
lsof -i :5432
lsof -i :6379
```

2. Check Docker logs:
```bash
docker-compose logs
```

### Database connection errors

1. Ensure PostgreSQL is healthy:
```bash
docker-compose ps postgres
```

2. Check database logs:
```bash
docker-compose logs postgres
```

### WebSocket connection fails

1. Verify token is valid
2. Check server logs for WebSocket errors
3. Ensure WebSocket URL uses `ws://` (not `http://`) in development

## Production Considerations

Before deploying to production:

1. **Change JWT secret** in `server/main.go`:
```go
jwtSecret = []byte(os.Getenv("JWT_SECRET"))
```

2. **Remove OTP from response** in `sendOTP` function

3. **Add proper CORS** configuration

4. **Use environment variables** for all secrets

5. **Enable SSL/TLS** for WebSocket (`wss://`)

6. **Set up proper logging** and monitoring

7. **Configure database backups**

8. **Add rate limiting** for API endpoints

9. **Implement proper error handling** and validation

10. **Add API versioning** (`/api/v1/...`)

## Next Steps

- [ ] Add message editing/deletion endpoints
- [ ] Implement typing indicators
- [ ] Add read receipts
- [ ] Implement file upload endpoints
- [ ] Add user presence tracking
- [ ] Implement message search
- [ ] Add group management endpoints
- [ ] Implement scheduled messages
- [ ] Add Bot API compatibility layer

## Architecture Notes

- **Database**: PostgreSQL for persistent storage
- **Cache**: Redis for presence and ephemeral data
- **Real-time**: Native WebSocket (not Socket.io)
- **Authentication**: JWT tokens
- **Message Storage**: Append-only with edit/deletion markers

## Security Notes

- Cloud chats are **not end-to-end encrypted** (server-side storage)
- OTP is logged in development mode (remove in production)
- JWT secret is hardcoded (use environment variable in production)
- No rate limiting implemented (add before production)
- CORS allows all origins (restrict in production)
