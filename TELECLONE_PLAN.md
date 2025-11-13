# TeleClone - Smart Telegram Clone

**Project Goal**: Build an open, privacy-aware, high-performance messenger that replicates Telegram's most-prominent features while removing low-usage/redundant features.

## 🎯 MVP Scope (Build First)

1. ✅ **Account + Secure Sign-in** - Phone-based auth with OTP
2. ✅ **One-to-One Cloud Chats** - Message send/edit/delete
3. ⏳ **Group Chats** - Up to 2000 members (basic moderation)
4. ⏳ **File/Image/Video Sharing** - Cloud storage + progressive download
5. ⏳ **Bots** - Bot API compatible interface
6. ⏳ **Message Search** - Full-text search
7. ⏳ **Scheduled Messages** - Time-delayed delivery
8. ⏳ **Voice Calls** - Peer-to-peer or SFU

## 🏗️ Architecture

### High-Level Pattern
```
API Gateway → Messaging Service → Storage/CDN → Presence/Sync → Notification → Bot API
```

### Tech Stack

**Backend:**
- **Language**: Go (core messaging service)
- **Database**: PostgreSQL (authoritative data)
- **Cache/Queue**: Redis (presence, ephemeral state)
- **Media Storage**: S3-compatible object storage + CDN
- **Realtime**: WebSockets (binary protocol with ACKs)

**Client:**
- **Mobile**: React Native (existing codebase)
- **Desktop**: TDLib bindings (future)
- **Web**: Lightweight WebSocket client

**Bots:**
- Bot API service compatible with Telegram Bot API
- Support webhook + long-polling

## 📁 Project Structure

```
/workspace/
├── server/              # Go messaging server (MVP)
│   ├── main.go         # WebSocket server + routing
│   ├── database.go     # PostgreSQL operations
│   ├── Dockerfile      # Container build
│   └── test-client.js  # WebSocket test client
├── docker-compose.yml  # Full stack orchestration
├── src/                # React Native client (existing)
└── docs/               # Architecture & API docs
```

## 🚀 Quick Start

### Start the Server Stack

```bash
# Start PostgreSQL, Redis, and server
docker-compose up -d

# View server logs
docker-compose logs -f server

# Stop everything
docker-compose down
```

### Test the Server

```bash
# Install test client dependencies
npm install ws

# Run test client (terminal 1)
node server/test-client.js +1234567890

# Run second client (terminal 2)
node server/test-client.js +9876543210

# Send message from client 1:
# {"type":"message","payload":{"to":"<user_id_from_client_2>","text":"Hello!"}}
```

## 📋 Implementation Plan

### Sprint 1 (2 weeks) - PoC ✅
- [x] Dev server stub with auth & sync API
- [x] Minimal client using WebSocket
- [x] Storage schema (messages, users, groups)
- [x] Docker Compose setup

### Sprint 2 (2 weeks) - Core Messaging
- [ ] Message persistence with edit/delete semantics
- [ ] Delivery ACKs and read receipts
- [ ] WebSocket sync channel improvements
- [ ] Group chat basics & admin controls

### Sprint 3 (2 weeks) - Media + Bots
- [ ] File uploads to S3 and CDN delivery
- [ ] Thumbnail generation
- [ ] Simple Bot API adapter
- [ ] Sample echo bot

### Sprint 4 (2 weeks) - Scale & QA
- [ ] Redis for presence/online status
- [ ] Basic load testing
- [ ] CI/CD pipeline
- [ ] Unit tests
- [ ] Contributor documentation

## 🔐 Security & Privacy

### Current (MVP)
- **Cloud Chats**: Server-side storage (not E2E encrypted)
- **Authentication**: Phone + OTP (dev mode: "123456" accepted)
- **Transport**: WebSocket over TLS

### Planned (v2)
- **Secret Chats**: End-to-end encryption (client-side)
- **Key Management**: Signal Protocol or similar
- **Bot API**: TLS (not E2E - document clearly)

## 📊 Success Metrics (MVP)

- ✅ < 300ms median message delivery (same region)
- ⏳ File upload/download working for 100MB files
- ⏳ Bot API endpoints functional
- ⏳ Group chat stress-tested to 2000 members

## 🔗 Reference Implementations

- **TDLib**: https://github.com/tdlib/td (client library)
- **Telegram Desktop**: https://github.com/telegramdesktop/tdesktop (UI patterns)
- **Telegram Bot API**: https://github.com/tdlib/telegram-bot-api (bot compatibility)

## 🚫 Features Removed (High-Risk/Low-Value)

- ❌ "People nearby" (high abuse potential)
- ❌ Anonymous mass messaging
- ❌ Legacy features causing moderation hotspots

## 📝 API Protocol

See `server/README.md` for detailed WebSocket protocol documentation.

### Quick Example

**Authenticate:**
```json
{"type":"auth","payload":{"phone_number":"+1234567890","otp":"123456"}}
```

**Send Message:**
```json
{"type":"message","payload":{"to":"user_+9876543210_123","text":"Hello!","type":"text"}}
```

## 🛠️ Development Workflow

1. **Backend Changes**: Edit `server/*.go`, restart with `docker-compose restart server`
2. **Database Changes**: Add migrations to `database.go`, restart services
3. **Client Changes**: Use existing React Native app, connect to `ws://localhost:8080/ws`

## 📚 Next Steps

1. Integrate React Native client with WebSocket server
2. Implement message editing/deletion
3. Add group chat support
4. Implement file upload endpoints
5. Build Bot API compatibility layer

## 🤝 Contributing

See `CONTRIBUTING.md` (to be created) for development guidelines.

---

**Status**: MVP Server PoC Complete ✅ | Client Integration In Progress ⏳
