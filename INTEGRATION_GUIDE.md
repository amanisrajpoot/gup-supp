# TeleClone Integration Guide

This guide explains how to integrate the React Native client with the TeleClone backend server.

## Backend Setup

1. **Start the backend server:**
   ```bash
   cd server
   docker-compose up -d
   ```

2. **Verify it's running:**
   ```bash
   curl http://localhost:8080/health
   ```

## Client Configuration

Update your client constants to point to the backend:

### Update `src/constants/index.ts`

```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8080/api'  // Change from 3000 to 8080
  : 'https://your-production-api.com/api';

export const WS_BASE_URL = __DEV__
  ? 'ws://localhost:8080/ws'  // WebSocket on same port
  : 'wss://your-production-api.com/ws';
```

### For Android Emulator

If testing on Android emulator, use `10.0.2.2` instead of `localhost`:

```typescript
export const API_BASE_URL = __DEV__ 
  ? Platform.OS === 'android' 
    ? 'http://10.0.2.2:8080/api'
    : 'http://localhost:8080/api'
  : 'https://your-production-api.com/api';
```

## Authentication Flow

### 1. Register User

```typescript
// In your authService.ts
async register(phone: string, username: string, name: string) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, username, name }),
  });
  
  const data = await response.json();
  // In dev, OTP is returned: data.otp
  return data;
}
```

### 2. Login with OTP

```typescript
async login(phone: string, otp: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  });
  
  const data = await response.json();
  // Store token: data.token
  return data;
}
```

## WebSocket Integration

Update your `WebSocketService.ts` to work with the new backend:

```typescript
connect(token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Use native WebSocket instead of socket.io-client
    this.socket = new WebSocket(`${WS_BASE_URL}?token=${token}`);
    
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      resolve();
    };
    
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      reject(error);
    };
    
    this.socket.onclose = () => {
      this.isConnected = false;
      this.handleReconnect();
    };
  });
}

sendMessage(chatId: string, content: string, type: string = 'text') {
  if (this.socket && this.isConnected) {
    const message = {
      type: 'message',
      chat_id: chatId,
      content,
      message_type: type,
    };
    this.socket.send(JSON.stringify(message));
  }
}
```

## API Service Updates

### Update `chatService.ts`

The backend expects slightly different request formats. Update your service methods:

```typescript
async sendMessage(chatId: string, content: string, type: string, token: string) {
  const response = await fetch(`${this.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      chat_id: chatId,  // snake_case instead of camelCase
      content,
      type,
    }),
  });
  
  return await response.json();
}

async getMessages(chatId: string, token: string, page = 1, limit = 50) {
  const response = await fetch(
    `${this.baseUrl}/messages/${chatId}?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  return await response.json();
}
```

## Testing the Integration

### 1. Test Registration

```bash
# Register a test user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "username": "testuser",
    "name": "Test User"
  }'
```

Response:
```json
{
  "user_id": "uuid",
  "otp": "123456",
  "message": "OTP sent to phone"
}
```

### 2. Test Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "otp": "123456"
  }'
```

Response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "phone": "+1234567890",
    "username": "testuser",
    "name": "Test User"
  }
}
```

### 3. Test Sending Message

```bash
curl -X POST http://localhost:8080/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "chat_id": "chat_uuid",
    "content": "Hello, World!",
    "type": "text"
  }'
```

## WebSocket Testing

You can test WebSocket connections using `wscat`:

```bash
npm install -g wscat
wscat -c "ws://localhost:8080/ws?token=YOUR_TOKEN"
```

Then send:
```json
{"type": "join_chat", "chat_id": "chat_uuid"}
```

## Next Steps

1. **Create Chat**: Implement chat creation logic
2. **Handle WebSocket Events**: Process incoming message events
3. **Update UI**: Connect Redux store to real API responses
4. **Error Handling**: Add proper error handling and retry logic
5. **Offline Support**: Cache messages locally for offline viewing

## Troubleshooting

### Connection Issues

- **Android Emulator**: Use `10.0.2.2` instead of `localhost`
- **iOS Simulator**: Use `localhost` or your Mac's IP address
- **CORS Errors**: Backend allows all origins in dev mode

### WebSocket Issues

- Ensure token is valid JWT
- Check WebSocket URL format: `ws://host:port/ws?token=...`
- Verify server is running on correct port

### Database Issues

- Check PostgreSQL is running: `docker ps`
- Verify connection: `docker exec -it teleclone-postgres psql -U teleclone -d teleclone`

## Production Considerations

1. **HTTPS/WSS**: Use secure connections in production
2. **Token Refresh**: Implement token refresh mechanism
3. **Rate Limiting**: Backend should add rate limiting
4. **Error Monitoring**: Add error tracking (Sentry, etc.)
5. **Analytics**: Track API usage and performance
