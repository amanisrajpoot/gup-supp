import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL, WS_EVENTS } from '../../constants';
import { WebSocketMessage, TypingIndicator, ReadReceipt } from '../../types/api';

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(WS_BASE_URL, {
          auth: {
            token,
          },
          transports: ['websocket'],
          timeout: 20000,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.isConnected = false;
          this.handleReconnect();
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        });

        this.setupMessageHandlers();

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
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

  private setupMessageHandlers(): void {
    if (!this.socket) return;

    this.socket.on(WS_EVENTS.MESSAGE, (data: WebSocketMessage) => {
      this.emit('message', data);
    });

    this.socket.on(WS_EVENTS.TYPING, (data: TypingIndicator) => {
      this.emit('typing', data);
    });

    this.socket.on(WS_EVENTS.READ_RECEIPT, (data: ReadReceipt) => {
      this.emit('read_receipt', data);
    });

    this.socket.on(WS_EVENTS.USER_STATUS, (data: any) => {
      this.emit('user_status', data);
    });

    this.socket.on(WS_EVENTS.CALL, (data: any) => {
      this.emit('call', data);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
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
    if (this.socket && this.isConnected) {
      this.socket.emit(WS_EVENTS.MESSAGE, {
        chatId,
        message,
        timestamp: new Date(),
      });
    } else {
      console.warn('WebSocket not connected. Cannot send message.');
    }
  }

  sendTyping(chatId: string, isTyping: boolean): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(WS_EVENTS.TYPING, {
        chatId,
        isTyping,
        timestamp: new Date(),
      });
    }
  }

  sendReadReceipt(messageId: string, chatId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(WS_EVENTS.READ_RECEIPT, {
        messageId,
        chatId,
        timestamp: new Date(),
      });
    }
  }

  updateUserStatus(status: 'online' | 'offline' | 'away'): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(WS_EVENTS.USER_STATUS, {
        status,
        timestamp: new Date(),
      });
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
    return this.isConnected;
  }

  get socketId(): string | null {
    return this.socket?.id || null;
  }
}

export const webSocketService = new WebSocketService();
