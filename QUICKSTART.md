# 🚀 TeleClone - Quick Start Guide

Get TeleClone running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- Ports 8080, 5432, 6379 available

## Step 1: Start the Backend

```bash
# Start all services (PostgreSQL, Redis, Go server)
docker-compose up -d

# Check everything is running
docker-compose ps

# View server logs
docker-compose logs -f server
```

You should see:
```
✅ Database connected successfully
✅ Database migrations completed
✅ Redis connected successfully
🚀 TeleClone server starting on port 8080
```

## Step 2: Test the API

```bash
# Health check
curl http://localhost:8080/health
# Should return: OK

# Send OTP (development OTP is always "123456")
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'

# Verify OTP and get token
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "otp": "123456"}'
```

Save the `token` from the response!

## Step 3: Try the Web Client

1. Open `web-client/index.html` in your browser
2. Enter phone number: `+1234567890`
3. Click "Send OTP"
4. Enter OTP: `123456`
5. Click "Verify & Connect"
6. Connect WebSocket
7. Create a chat and send messages!

## Step 4: Connect React Native Client

Update `src/constants/index.ts` if needed (already configured for localhost:8080).

**For Android Emulator:**
Change `localhost` to `10.0.2.2` in constants.

**For Physical Device:**
Use your machine's IP address instead of `localhost`.

Then run:
```bash
npm install
npm start
# In another terminal:
npm run android  # or npm run ios
```

## What's Included

✅ **Backend Server** (Go)
- REST API for auth, chats, messages
- WebSocket for real-time updates
- Bot API compatibility
- PostgreSQL + Redis

✅ **Web Client** (HTML/JS)
- Simple PoC client for testing
- Real-time messaging
- WebSocket support

✅ **React Native Client** (Existing)
- Mobile app ready to connect
- Already configured for new backend

## Next Steps

1. **Create a Chat:**
   ```bash
   curl -X POST http://localhost:8080/api/chat/chats \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"participantId": "OTHER_USER_ID"}'
   ```

2. **Send a Message:**
   ```bash
   curl -X POST http://localhost:8080/api/chat/messages \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "chatId": "CHAT_ID",
       "content": "Hello, TeleClone!",
       "type": "text"
     }'
   ```

3. **Test Bot API:**
   - Create a bot in database
   - Use `/bot/{token}/sendMessage` endpoint

## Troubleshooting

**Server won't start?**
- Check Docker is running: `docker ps`
- Check ports are free: `lsof -i :8080`
- View logs: `docker-compose logs server`

**Can't connect from React Native?**
- Android emulator: Use `10.0.2.2` instead of `localhost`
- iOS simulator: Use `localhost`
- Physical device: Use your machine's IP address

**Database errors?**
- Wait a few seconds for PostgreSQL to initialize
- Check: `docker-compose logs postgres`

## Architecture

```
┌─────────────┐
│   Client    │ (React Native / Web)
└──────┬──────┘
       │ HTTP/WebSocket
       ▼
┌─────────────┐
│ Go Server   │ (Port 8080)
└──────┬──────┘
       │
   ┌───┴───┐
   ▼       ▼
┌─────┐  ┌─────┐
│PostgreSQL│  │Redis│
└─────┘  └─────┘
```

## API Documentation

See `server/README.md` for complete API documentation.

## Support

Check `TELECLONE_SETUP.md` for detailed setup instructions.
