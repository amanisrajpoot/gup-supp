# TeleClone Server - Quick Start Guide

Get the TeleClone backend running in 5 minutes.

## Prerequisites

- Docker & Docker Compose installed
- `curl` for testing (or Postman/Insomnia)

## Step 1: Start Services

```bash
cd server
docker-compose up -d
```

Wait ~10 seconds for services to start. Check status:

```bash
docker-compose ps
```

All services should show "Up" status.

## Step 2: Verify Health

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{"status":"ok"}
```

## Step 3: Register a Test User

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "username": "alice",
    "name": "Alice Smith"
  }'
```

Response includes OTP (for dev only):
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "otp": "123456",
  "message": "OTP sent to phone"
}
```

## Step 4: Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "otp": "123456"
  }'
```

Save the `token` from the response - you'll need it for authenticated requests.

## Step 5: Get Your Chats

```bash
curl http://localhost:8080/api/chats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Initially returns empty array `[]` - you need to create chats first.

## Step 6: Create a Group Chat

```bash
curl -X POST http://localhost:8080/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Group",
    "participants": []
  }'
```

Save the `id` from the response - this is your chat ID.

## Step 7: Send a Message

```bash
curl -X POST http://localhost:8080/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "chat_id": "CHAT_ID_FROM_STEP_6",
    "content": "Hello, TeleClone!",
    "type": "text"
  }'
```

## Step 8: Get Messages

```bash
curl "http://localhost:8080/api/messages/CHAT_ID?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 9: Test WebSocket (Optional)

Install `wscat`:
```bash
npm install -g wscat
```

Connect:
```bash
wscat -c "ws://localhost:8080/ws?token=YOUR_TOKEN_HERE"
```

Send:
```json
{"type": "join_chat", "chat_id": "YOUR_CHAT_ID"}
```

## Common Commands

### View Logs
```bash
docker-compose logs -f server
```

### Stop Services
```bash
docker-compose down
```

### Reset Database
```bash
docker-compose down -v
docker-compose up -d
```

### Access PostgreSQL
```bash
docker exec -it teleclone-postgres psql -U teleclone -d teleclone
```

### Access Redis
```bash
docker exec -it teleclone-redis redis-cli
```

## Next Steps

1. **Integrate with React Native client** - See `INTEGRATION_GUIDE.md`
2. **Add more users** - Register multiple users to test messaging
3. **Test group features** - Add participants, send group messages
4. **Explore Bot API** - Test bot endpoints at `/bot/api/`

## Troubleshooting

**Port already in use?**
- Change ports in `docker-compose.yml`
- Or stop conflicting services

**Database connection errors?**
- Wait longer for PostgreSQL to start
- Check: `docker-compose logs postgres`

**WebSocket not connecting?**
- Verify token is valid
- Check server logs: `docker-compose logs server`

## Development Mode

For local Go development (without Docker for server):

```bash
# Start only DB and Redis
docker-compose up -d postgres redis

# Run server locally
cd server
go mod tidy
go run .
```

This allows hot-reload and easier debugging.
