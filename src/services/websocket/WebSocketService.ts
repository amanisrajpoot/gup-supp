import { WS_BASE_URL, WS_EVENTS } from '../../constants';
import { WebSocketMessage, TypingIndicator, ReadReceipt } from '../../types/api';

class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Function[]> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private token: string | null = null;

  constructor() {
    this.setupEventListeners();
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.token = token;
        const wsUrl = `${WS_BASE_URL}/ws?token=${encodeURIComponent(token)}`;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.socket.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          if (event.code !== 1000) { // Not a normal closure
            this.handleReconnect();
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleIncomingMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
      this.isConnected = false;
    }
  }

  private setupEventListeners(): void {
    // Setup global event listeners
    this.addEventListener('message', this.handleMessage.bind(this));
    this.addEventListener('typing', this.handleTyping.bind(this));
    this.addEventListener('read_receipt', this.handleReadReceipt.bind(this));
    this.addEventListener('user_status', this.handleUserStatus.bind(this));
    this.addEventListener('call', this.handleCall.bind(this));
  }

  private handleIncomingMessage(data: any): void {
    if (data.type === 'message') {
      this.emit('message', data.payload);
    } else if (data.type === 'typing') {
      this.emit('typing', data.payload);
    } else if (data.type === 'read_receipt') {
      this.emit('read_receipt', data.payload);
    } else if (data.type === 'user_status') {
      this.emit('user_status', data.payload);
    } else if (data.type === 'call') {
      this.emit('call', data.payload);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.token && !this.isConnected) {
        this.connect(this.token).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  // Event handling methods
  private handleMessage(data: WebSocketMessage): void {
    console.log('Received message:', data);
  }

  private handleTyping(data: TypingIndicator): void {
    console.log('Received typing indicator:', data);
  }

  private handleReadReceipt(data: ReadReceipt): void {
    console.log('Received read receipt:', data);
  }

  private handleUserStatus(data: any): void {
    console.log('Received user status:', data);
  }

  private handleCall(data: any): void {
    console.log('Received call:', data);
  }

  // Public methods for sending data
  sendMessage(chatId: string, message: any): void {
    if (this.socket && this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'message',
        payload: {
          chatId,
          message,
          timestamp: new Date().toISOString(),
        },
      };
      this.socket.send(JSON.stringify(payload));
    } else {
      console.warn('WebSocket not connected. Cannot send message.');
    }
  }

  sendTyping(chatId: string, isTyping: boolean): void {
    if (this.socket && this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'typing',
        payload: {
          chatId,
          isTyping,
          timestamp: new Date().toISOString(),
        },
      };
      this.socket.send(JSON.stringify(payload));
    }
  }

  sendReadReceipt(messageId: string, chatId: string): void {
    if (this.socket && this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'read_receipt',
        payload: {
          messageId,
          chatId,
          timestamp: new Date().toISOString(),
        },
      };
      this.socket.send(JSON.stringify(payload));
    }
  }

  updateUserStatus(status: 'online' | 'offline' | 'away'): void {
    if (this.socket && this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'user_status',
        payload: {
          status,
          timestamp: new Date().toISOString(),
        },
      };
      this.socket.send(JSON.stringify(payload));
    }
  }

  // Event listener management
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }

  get socketId(): string | null {
    return null; // Native WebSocket doesn't have socket IDs
  }
}

export const webSocketService = new WebSocketService();
