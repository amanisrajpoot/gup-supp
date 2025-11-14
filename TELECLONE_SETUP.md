# TeleClone - Setup & Quick Start Guide

This document provides step-by-step instructions to get TeleClone running locally.

## 🎯 What You're Getting

- **Go Backend Server** - High-performance messaging server with WebSocket support
- **PostgreSQL Database** - Persistent storage for users, chats, and messages
- **Redis** - Presence and caching layer
- **Bot API Compatibility** - Telegram Bot API compatible endpoints
- **Web Client PoC** - Simple HTML/JS client for testing
- **React Native Client** - Mobile app (existing, needs backend connection)

## 🚀 Quick Start (Docker Compose)

### Prerequisites
- Docker and Docker Compose installed
- Ports 8080, 5432, 6379 available

### Steps

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **Check services are running**
   ```bash
   docker-compose ps
   ```

3. **View server logs**
   ```bash
   docker-compose logs -f server
   ```

4. **Test the API**
   ```bash
   curl http://localhost:8080/health
   # Should return: OK
   ```

5. **Open Web Client**
   - Open `web-client/index.html` in your browser
   - Or serve it: `cd web-client && python3 -m http.server 3000`
   - Navigate to `http://localhost:3000`

## 📱 Testing the API

### 1. Send OTP
```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

### 2. Verify OTP (dev: use "123456")
```bash
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "otp": "123456"}'
```

Save the `token` from the response.

### 3. Get Chats
```bash
curl http://localhost:8080/api/chat/chats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Send Message
```bash
curl -X POST http://localhost:8080/api/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "chatId": "CHAT_ID_HERE",
    "content": "Hello, TeleClone!",
    "type": "text"
  }'
```

## 🔌 WebSocket Testing

Connect to WebSocket endpoint:
```javascript
const ws = new WebSocket('ws://localhost:8080/ws?userId=YOUR_USER_ID');
ws.onmessage = (event) => console.log('Received:', JSON.parse(event.data));
```

## 🤖 Bot API Testing

### Create a Bot (via database)
```sql
INSERT INTO bots (id, token, username, first_name, owner_id, is_active)
VALUES (
  gen_random_uuid(),
  'your-bot-token-here',
  'test_bot',
  'Test Bot',
  'YOUR_USER_ID',
  true
);
```

### Send Message as Bot
```bash
curl -X POST http://localhost:8080/bot/your-bot-token-here/sendMessage \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "CHAT_ID_HERE",
    "text": "Hello from bot!"
  }'
```

## 📱 Connecting React Native Client

Update `src/constants/index.ts`:
```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_LOCAL_IP:8080/api'  // Use your machine's IP, not localhost
  : 'https://your-production-api.com/api';

export const WS_BASE_URL = __DEV__
  ? 'ws://YOUR_LOCAL_IP:8080/ws'
  : 'wss://your-production-api.com/ws';
```

**Note**: For Android emulator, use `10.0.2.2` instead of localhost. For iOS simulator, use `localhost`.

## 🛠️ Manual Development Setup

### Backend (Go)

1. **Install Go 1.21+**
   ```bash
   # Check version
   go version
   ```

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

4. **Start PostgreSQL and Redis**
   ```bash
   # Using Docker
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=teleclone -e POSTGRES_DB=teleclone postgres:15-alpine
   docker run -d -p 6379:6379 redis:7-alpine
   ```

5. **Run Server**
   ```bash
   cd server
   go run main.go
   ```

### Database Schema

The database schema is automatically created on first run. Tables include:
- `users` - User accounts
- `chats` - Chat rooms (private, group, channel)
- `messages` - Messages
- `group_members` - Group membership
- `bots` - Bot accounts

## 🧪 Testing Checklist

- [ ] Server starts without errors
- [ ] Health endpoint returns OK
- [ ] Can send OTP
- [ ] Can verify OTP and get token
- [ ] Can create/get chats
- [ ] Can send messages
- [ ] WebSocket connects and receives messages
- [ ] Bot API endpoints work
- [ ] Web client can authenticate and send messages

## 🐛 Troubleshooting

### Server won't start
- Check PostgreSQL and Redis are running
- Verify ports 8080, 5432, 6379 are available
- Check logs: `docker-compose logs server`

### Database connection errors
- Ensure PostgreSQL is running: `docker ps`
- Check credentials match docker-compose.yml
- Try connecting manually: `psql -h localhost -U teleclone -d teleclone`

### WebSocket connection fails
- Verify server is running
- Check CORS settings (currently allows all origins)
- Use `userId` query parameter: `ws://localhost:8080/ws?userId=YOUR_ID`

### React Native can't connect
- Use your machine's IP address, not `localhost`
- For Android emulator: use `10.0.2.2`
- Check firewall settings
- Verify server is accessible from device/emulator

## 📚 Next Steps

1. **Implement Media Upload** - Add file/image/video support
2. **Add Scheduled Messages** - Implement message scheduling
3. **Enhance Bot API** - Add more Telegram Bot API endpoints
4. **Add Search** - Implement message and chat search
5. **Add Voice Calls** - Implement WebRTC for calls
6. **Production Hardening** - Add proper secrets, rate limiting, monitoring

## 🔐 Security Notes

**⚠️ This is a PoC - NOT production ready!**

- OTP is hardcoded to "123456" for development
- JWT secret is hardcoded - use environment variable in production
- CORS allows all origins - restrict in production
- No rate limiting implemented
- No input validation/sanitization
- Cloud chats are server-side (not E2E encrypted)

## 📖 API Documentation

See `server/README.md` for complete API documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT
