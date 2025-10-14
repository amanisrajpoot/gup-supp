// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// User Types
export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  avatar?: string;
  status?: string;
  lastSeen?: Date;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Chat Types
export interface Chat {
  id: string;
  type: 'individual' | 'group';
  name?: string;
  avatar?: string;
  participants: string[]; // User IDs
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Message Types
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
  mediaUrl?: string;
  mediaSize?: number;
  mediaDuration?: number; // for audio/video
  replyTo?: string; // Message ID
  isEdited: boolean;
  isDeleted: boolean;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  encryptionKey?: string;
}

// Group Types
export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  adminIds: string[];
  participantIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Contact Types
export interface Contact {
  id: string;
  phoneNumber: string;
  name: string;
  avatar?: string;
  isRegistered: boolean;
  lastSeen?: Date;
  isOnline: boolean;
  isBlocked: boolean;
}

// Authentication Types
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface RegisterRequest {
  phoneNumber: string;
  name: string;
  password: string;
}

export interface VerifyOTPRequest {
  phoneNumber: string;
  otp: string;
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read_receipt' | 'user_status' | 'call';
  data: any;
  timestamp: Date;
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

export interface ReadReceipt {
  messageId: string;
  userId: string;
  timestamp: Date;
}

// Call Types
export interface Call {
  id: string;
  chatId: string;
  callerId: string;
  type: 'voice' | 'video';
  status: 'initiating' | 'ringing' | 'connected' | 'ended' | 'missed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
}
