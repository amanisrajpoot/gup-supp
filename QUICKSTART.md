# TeleClone Quick Start Guide

Get the TeleClone server running in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for test client)

## Step 1: Start the Server Stack

```bash
# Start PostgreSQL, Redis, and Go server
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f server
```

The server will be available at:
- **HTTP**: http://localhost:8080
- **WebSocket**: ws://localhost:8080/ws

## Step 2: Verify Server is Running

```bash
# Health check
curl http://localhost:8080/health

# Should return: {"status":"ok"}
```

## Step 3: Test with WebSocket Client

### Option A: Using the Test Client Script

```bash
# Install dependencies
npm install ws

# Run test client (Terminal 1)
node server/test-client.js +1234567890

# You should see:
# ✅ Connected to server
# 🔐 Authenticating...
# ✅ Authenticated! User ID: user_+1234567890_...
```

### Option B: Using wscat

```bash
# Install wscat globally
npm install -g wscat

# Connect
wscat -c ws://localhost:8080/ws

# Authenticate (dev mode accepts "123456" for any phone)
{"type":"auth","payload":{"phone_number":"+1234567890","otp":"123456"}}

# You should receive:
# {"type":"authenticated","data":{"user_id":"user_+1234567890_..."}}
```

## Step 4: Send a Message Between Two Clients

**Terminal 1** (Client A):
```bash
node server/test-client.js +1111111111
# Note the user_id from authentication response
```

**Terminal 2** (Client B):
```bash
node server/test-client.js +2222222222
# Note the user_id from authentication response
```

**From Client A, send message to Client B:**
```json
{"type":"message","payload":{"to":"<user_id_from_client_b>","text":"Hello from Client A!","type":"text"}}
```

Client B should receive the message automatically!

## Step 5: Connect React Native Client

Update your React Native app to connect to the WebSocket server:

```typescript
// In your WebSocket hook or service
const ws = new WebSocket('ws://localhost:8080/ws');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  payload: {
    phone_number: '+1234567890',
    otp: '123456' // Dev mode
  }
}));

// Listen for messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

**Note**: For Android emulator, use `ws://10.0.2.2:8080/ws` instead of `localhost`.

## Troubleshooting

### Server won't start
```bash
# Check logs
docker-compose logs server

# Common issues:
# - Port 8080 already in use: Change PORT in docker-compose.yml
# - Database connection failed: Wait for postgres to be healthy
```

### Can't connect from React Native
- **iOS Simulator**: Use `ws://localhost:8080/ws`
- **Android Emulator**: Use `ws://10.0.2.2:8080/ws`
- **Physical Device**: Use your computer's IP: `ws://192.168.1.X:8080/ws`

### Database errors
```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

## Next Steps

1. ✅ Server is running
2. ✅ WebSocket connection works
3. ⏳ Integrate with React Native client
4. ⏳ Implement message editing/deletion
5. ⏳ Add group chat support

## Development Commands

```bash
# View all logs
docker-compose logs -f

# Restart server only
docker-compose restart server

# Stop everything
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

## Architecture Overview

```
┌─────────────┐
│   Client    │ (React Native / WebSocket)
└──────┬──────┘
       │ WebSocket
       │
┌──────▼──────┐
│   Server    │ (Go - Port 8080)
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌──▼──┐
│Postgres│ │Redis │
│ :5432  │ │:6379 │
└───────┘ └──────┘
```

## API Reference

See `server/README.md` for detailed API documentation.

---

**Ready to build!** 🚀
