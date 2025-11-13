# TeleClone Quick Start Guide

Get your Telegram-like messaging app running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for React Native client)

## Step 1: Start the Backend Server

```bash
docker-compose up -d
```

Wait for all services to start (about 30 seconds). Check status:

```bash
docker-compose ps
```

You should see:
- ✅ `teleclone-postgres` - Up
- ✅ `teleclone-redis` - Up  
- ✅ `teleclone-server` - Up

## Step 2: Test the API

### Register a User

```bash
# 1. Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'

# Check the server logs for the OTP (in dev mode, it's logged)
docker-compose logs server | grep OTP

# 2. Register with the OTP
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "otp": "123456",
    "name": "Test User",
    "username": "testuser",
    "password": "testpass123"
  }'
```

Save the `token` from the response!

### Create a Chat and Send a Message

```bash
# Replace YOUR_TOKEN with the token from registration

# 1. Create a chat (you'll need another user ID - create a second user first)
curl -X POST http://localhost:3000/api/chat/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "individual",
    "participants": ["user_id_1", "user_id_2"]
  }'

# 2. Send a message
curl -X POST http://localhost:3000/api/chat/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "CHAT_ID_FROM_STEP_1",
    "content": "Hello, World!",
    "type": "text"
  }'

# 3. Get messages
curl -X GET "http://localhost:3000/api/chat/messages?chatId=CHAT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 3: Connect React Native Client

1. Update the API base URL in your React Native app (if needed):
   - File: `src/constants/index.ts`
   - Ensure `API_BASE_URL` points to `http://localhost:3000/api` (or your machine's IP for mobile)

2. For Android emulator, use `http://10.0.2.2:3000/api`
3. For iOS simulator, use `http://localhost:3000/api`
4. For physical device, use your computer's local IP (e.g., `http://192.168.1.100:3000/api`)

## Step 4: Test WebSocket Connection

The WebSocket endpoint is at:
```
ws://localhost:3000/ws?token=YOUR_TOKEN
```

You can test it using a WebSocket client or the React Native app.

## Troubleshooting

### Port Already in Use

If port 3000, 5432, or 6379 are already in use:

1. Stop conflicting services, or
2. Modify `docker-compose.yml` to use different ports

### Database Connection Errors

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Restart services
docker-compose restart
```

### Server Won't Start

```bash
# Check server logs
docker-compose logs server

# Rebuild if needed
docker-compose up -d --build
```

## Next Steps

- Read `SERVER_SETUP.md` for detailed API documentation
- Check `DEVELOPMENT_PLAN.md` for feature roadmap
- Start building your Telegram clone features!

## Architecture Overview

```
┌─────────────┐
│ React Native│
│   Client    │
└──────┬──────┘
       │ HTTP/WebSocket
       │
┌──────▼──────────┐
│  Go Server     │
│  (Port 3000)   │
└───┬────────┬───┘
    │        │
    │        │
┌───▼───┐ ┌─▼─────┐
│Postgres│ │Redis │
│ :5432  │ │:6379 │
└────────┘ └──────┘
```

## Development Tips

1. **View logs in real-time:**
   ```bash
   docker-compose logs -f server
   ```

2. **Reset database:**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

3. **Access PostgreSQL:**
   ```bash
   docker exec -it teleclone-postgres psql -U postgres -d teleclone
   ```

4. **Access Redis:**
   ```bash
   docker exec -it teleclone-redis redis-cli
   ```

## Production Checklist

Before deploying to production:

- [ ] Change JWT secret to environment variable
- [ ] Remove OTP from API responses
- [ ] Add proper CORS configuration
- [ ] Enable SSL/TLS (wss://)
- [ ] Set up database backups
- [ ] Add rate limiting
- [ ] Configure proper logging
- [ ] Add monitoring and alerts
- [ ] Set up CI/CD pipeline
- [ ] Security audit

---

**Happy coding! 🚀**
