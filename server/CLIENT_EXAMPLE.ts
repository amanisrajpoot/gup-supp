/**
 * TeleClone API Client Example
 * 
 * This file shows how to integrate the TeleClone backend with your React Native client.
 * Copy relevant parts into your existing service files.
 */

import { Platform } from 'react-native';

// Configuration
const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:8080/api'  // Android emulator
    : 'http://localhost:8080/api'  // iOS simulator
  : 'https://your-production-api.com/api';

const WS_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'ws://10.0.2.2:8080/ws'
    : 'ws://localhost:8080/ws'
  : 'wss://your-production-api.com/ws';

// Types
interface RegisterRequest {
  phone: string;
  username: string;
  name: string;
}

interface LoginRequest {
  phone: string;
  otp: string;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: string;
  edited: boolean;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface Chat {
  id: string;
  type: 'individual' | 'group';
  name: string | null;
  avatar: string | null;
  participants: string[];
  last_message: Message | null;
  created_at: string;
}

// Auth Service
export class TeleCloneAuthService {
  static async register(data: RegisterRequest) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return await response.json();
    // Returns: { user_id, otp, message }
  }

  static async login(data: LoginRequest) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const result = await response.json();
    // Returns: { token, user }
    return result;
  }
}

// Chat Service
export class TeleCloneChatService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
  }

  async getChats(): Promise<Chat[]> {
    const response = await fetch(`${API_BASE_URL}/chats`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chats');
    }

    return await response.json();
  }

  async getChat(chatId: string): Promise<Chat> {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat');
    }

    return await response.json();
  }

  async getMessages(chatId: string, page = 1, limit = 50): Promise<Message[]> {
    const response = await fetch(
      `${API_BASE_URL}/messages/${chatId}?page=${page}&limit=${limit}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return await response.json();
  }

  async sendMessage(
    chatId: string,
    content: string,
    type: string = 'text'
  ): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        chat_id: chatId,
        content,
        type,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return await response.json();
  }

  async editMessage(messageId: string, content: string): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/messages/edit/${messageId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('Failed to edit message');
    }

    return await response.json();
  }

  async deleteMessage(messageId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/messages/delete/${messageId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete message');
    }
  }

  async createGroup(name: string, participants: string[]): Promise<Chat> {
    const response = await fetch(`${API_BASE_URL}/groups`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, participants }),
    });

    if (!response.ok) {
      throw new Error('Failed to create group');
    }

    return await response.json();
  }

  async searchMessages(query: string, chatId?: string): Promise<Message[]> {
    const url = chatId
      ? `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&chat_id=${chatId}`
      : `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    return await response.json();
  }
}

// WebSocket Service
export class TeleCloneWebSocketService {
  private ws: WebSocket | null = null;
  private token: string;
  private listeners: Map<string, Function[]> = new Map();

  constructor(token: string) {
    this.token = token;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${WS_BASE_URL}?token=${this.token}`);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.ws = null;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  joinChat(chatId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'join_chat',
        chat_id: chatId,
      }));
    }
  }

  sendTyping(chatId: string, isTyping: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing',
        chat_id: chatId,
        is_typing: isTyping,
      }));
    }
  }

  sendReadReceipt(messageId: string, chatId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'read_receipt',
        message_id: messageId,
        chat_id: chatId,
      }));
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private handleMessage(data: any) {
    const eventType = data.type;
    const callbacks = this.listeners.get(eventType) || [];
    callbacks.forEach(callback => callback(data));
  }
}

// Usage Example
export async function exampleUsage() {
  try {
    // 1. Register user
    const registerResult = await TeleCloneAuthService.register({
      phone: '+1234567890',
      username: 'testuser',
      name: 'Test User',
    });
    console.log('Registered:', registerResult);
    // In dev, OTP is returned: registerResult.otp

    // 2. Login
    const loginResult = await TeleCloneAuthService.login({
      phone: '+1234567890',
      otp: registerResult.otp, // Use OTP from registration
    });
    const token = loginResult.token;
    console.log('Logged in, token:', token);

    // 3. Initialize services
    const chatService = new TeleCloneChatService(token);
    const wsService = new TeleCloneWebSocketService(token);

    // 4. Connect WebSocket
    await wsService.connect();

    // 5. Set up WebSocket listeners
    wsService.on('message', (data: any) => {
      console.log('New message:', data.message);
    });

    wsService.on('message_edited', (data: any) => {
      console.log('Message edited:', data.message);
    });

    wsService.on('message_deleted', (data: any) => {
      console.log('Message deleted:', data.message_id);
    });

    // 6. Get chats
    const chats = await chatService.getChats();
    console.log('Chats:', chats);

    // 7. Create group
    const group = await chatService.createGroup('My Group', []);
    console.log('Created group:', group);

    // 8. Join chat via WebSocket
    wsService.joinChat(group.id);

    // 9. Send message
    const message = await chatService.sendMessage(
      group.id,
      'Hello, TeleClone!',
      'text'
    );
    console.log('Sent message:', message);

    // 10. Get messages
    const messages = await chatService.getMessages(group.id);
    console.log('Messages:', messages);

    // 11. Edit message
    const editedMessage = await chatService.editMessage(
      message.id,
      'Hello, TeleClone! (edited)'
    );
    console.log('Edited message:', editedMessage);

    // 12. Search
    const searchResults = await chatService.searchMessages('Hello', group.id);
    console.log('Search results:', searchResults);

  } catch (error) {
    console.error('Error:', error);
  }
}
