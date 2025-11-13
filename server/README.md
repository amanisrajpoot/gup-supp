# TeleClone Server

A minimal, high-performance messaging server for TeleClone MVP.

## Features

- ✅ Phone-based authentication with OTP (dev mode: accepts "123456")
- ✅ WebSocket-based real-time messaging
- ✅ PostgreSQL for message persistence
- ✅ Redis support (ready for presence/queues)
- ✅ Message delivery with ACKs
- ✅ Docker Compose setup

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Go 1.21+ (for local development)

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

### Local Development

1. **Start PostgreSQL and Redis:**
   ```bash
   docker-compose up -d postgres redis
   ```

2. **Set up environment:**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env if needed
   ```

3. **Install dependencies:**
   ```bash
   go mod download
   ```

4. **Run the server:**
   ```bash
   go run main.go database.go
   ```

## Testing

### Using the Test Client

1. **Install WebSocket client:**
   ```bash
   npm install ws
   ```

2. **Run test client:**
   ```bash
   node test-client.js +1234567890
   ```

3. **In another terminal, connect a second client:**
   ```bash
   node test-client.js +9876543210
   ```

4. **Send a message (replace user_id with actual ID from auth response):**
   ```json
   {"type":"message","payload":{"to":"user_+1234567890_123","text":"Hello!"}}
   ```

### Using curl

**Health check:**
```bash
curl http://localhost:8080/health
```

**WebSocket connection (using wscat):**
```bash
npm install -g wscat
wscat -c ws://localhost:8080/ws
```

Then send:
```json
{"type":"auth","payload":{"phone_number":"+1234567890","otp":"123456"}}
```

## API Protocol

### WebSocket Messages

All messages are JSON with this structure:
```json
{
  "type": "auth|message|ping",
  "payload": { ... }
}
```

### Authentication

**Request:**
```json
{
  "type": "auth",
  "payload": {
    "phone_number": "+1234567890",
    "otp": "123456"
  }
}
```

**Response:**
```json
{
  "type": "authenticated",
  "data": {
    "user_id": "user_+1234567890_1234567890"
  }
}
```

### Send Message

**Request:**
```json
{
  "type": "message",
  "payload": {
    "to": "user_+9876543210_1234567890",
    "text": "Hello, world!",
    "type": "text"
  }
}
```

**Response:**
```json
{
  "type": "message_sent",
  "data": {
    "id": "1234567890",
    "from": "user_+1234567890_1234567890",
    "to": "user_+9876543210_1234567890",
    "text": "Hello, world!",
    "ts": "2024-01-01T12:00:00Z",
    "type": "text"
  }
}
```

### Receive Message

When a message is received:
```json
{
  "type": "message",
  "payload": {
    "id": "1234567890",
    "from": "user_+1234567890_1234567890",
    "to": "user_+9876543210_1234567890",
    "text": "Hello, world!",
    "ts": "2024-01-01T12:00:00Z",
    "type": "text"
  }
}
```

## Database Schema

- **users**: User accounts (id, phone_number, username)
- **messages**: Chat messages (id, from_user, to_user, chat_id, content, type, timestamps)
- **chats**: Chat metadata (id, type, name)
- **chat_participants**: Group chat members
- **otp_codes**: OTP verification codes

## Architecture

```
Client (WebSocket)
    ↓
Server (Go)
    ↓
PostgreSQL (Messages, Users)
Redis (Presence, Queues - ready)
```

## Next Steps

- [ ] Implement proper OTP service (Twilio/SMS gateway)
- [ ] Add JWT token-based auth after OTP
- [ ] Implement message editing/deletion
- [ ] Add group chat support
- [ ] Add file/media upload endpoints
- [ ] Implement presence (online/offline) via Redis
- [ ] Add message search
- [ ] Implement Bot API compatibility layer

## Performance Targets

- < 300ms median message delivery (same region)
- Support 100MB file uploads
- Handle 2000-member group chats

## Security Notes

- **Dev mode**: OTP "123456" is accepted for any phone number
- **Production**: Implement proper OTP generation/verification
- WebSocket connections use ping/pong for keepalive
- All messages are currently unencrypted (cloud storage)
- E2E encryption is planned for v2
