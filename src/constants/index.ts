// API Constants
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8080/api' 
  : 'https://api.teleclone.com/api';

export const WS_BASE_URL = __DEV__
  ? 'ws://localhost:8080/ws'
  : 'wss://ws.teleclone.com/ws';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  SETTINGS: 'settings',
  CHAT_DATA: 'chat_data',
  CONTACTS_DATA: 'contacts_data',
  ENCRYPTION_KEYS: 'encryption_keys',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  LOCATION: 'location',
} as const;

// Chat Types
export const CHAT_TYPES = {
  INDIVIDUAL: 'individual',
  GROUP: 'group',
} as const;

// Message Status
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const;

// Call Types
export const CALL_TYPES = {
  VOICE: 'voice',
  VIDEO: 'video',
} as const;

// Call Status
export const CALL_STATUS = {
  INITIATING: 'initiating',
  RINGING: 'ringing',
  CONNECTED: 'connected',
  ENDED: 'ended',
  MISSED: 'missed',
} as const;

// Privacy Settings (moved to bottom)

// Theme
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Font Sizes
export const FONT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const;

// Media Download Settings
export const MEDIA_DOWNLOAD = {
  WIFI: 'wifi',
  WIFI_CELLULAR: 'wifi_cellular',
  NEVER: 'never',
} as const;

// Screen Names
export const SCREEN_NAMES = {
  // Auth Stack
  LOGIN: 'Login',
  REGISTER: 'Register',
  VERIFY_OTP: 'VerifyOTP',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Main Stack
  MAIN: 'Main',
  CHAT: 'Chat',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  GROUP_INFO: 'GroupInfo',
  MEDIA_VIEWER: 'MediaViewer',
  
  // Tab Names
  CHATS_TAB: 'Chats',
  STATUS_TAB: 'Status',
  CALLS_TAB: 'Calls',
  SETTINGS_TAB: 'Settings',
} as const;

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Pagination
export const PAGINATION = {
  MESSAGES_PER_PAGE: 50,
  CHATS_PER_PAGE: 20,
  CONTACTS_PER_PAGE: 50,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_DOCUMENT_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
} as const;

// Encryption
export const ENCRYPTION = {
  ALGORITHM: 'AES-256-GCM',
  KEY_LENGTH: 32,
  IV_LENGTH: 12,
  TAG_LENGTH: 16,
} as const;

// Validation
export const VALIDATION = {
  PHONE_NUMBER_REGEX: /^\+?[1-9]\d{1,14}$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  MESSAGE_MAX_LENGTH: 4096,
  GROUP_NAME_MAX_LENGTH: 25,
  STATUS_MAX_LENGTH: 139,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  INVALID_CREDENTIALS: 'Invalid phone number or password.',
  USER_NOT_FOUND: 'User not found.',
  PHONE_NUMBER_EXISTS: 'Phone number already registered.',
  INVALID_OTP: 'Invalid OTP. Please try again.',
  OTP_EXPIRED: 'OTP has expired. Please request a new one.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size is too large.',
  UNSUPPORTED_FILE_TYPE: 'File type is not supported.',
  ENCRYPTION_ERROR: 'Failed to encrypt message.',
  DECRYPTION_ERROR: 'Failed to decrypt message.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in.',
  REGISTER_SUCCESS: 'Account created successfully.',
  OTP_SENT: 'OTP sent to your phone number.',
  OTP_VERIFIED: 'Phone number verified successfully.',
  MESSAGE_SENT: 'Message sent successfully.',
  MESSAGE_DELETED: 'Message deleted successfully.',
  CONTACT_ADDED: 'Contact added successfully.',
  CONTACT_BLOCKED: 'Contact blocked successfully.',
  CONTACT_UNBLOCKED: 'Contact unblocked successfully.',
  GROUP_CREATED: 'Group created successfully.',
  GROUP_UPDATED: 'Group updated successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  SETTINGS_UPDATED: 'Settings updated successfully.',
} as const;

// Default Values
export const DEFAULT_VALUES = {
  AVATAR: 'https://via.placeholder.com/150x150/007AFF/FFFFFF?text=U',
  GROUP_AVATAR: 'https://via.placeholder.com/150x150/34C759/FFFFFF?text=G',
  STATUS: 'Hey there! I am using WhatsApp Clone',
  THEME: 'system',
  LANGUAGE: 'en',
  FONT_SIZE: 'medium',
  MEDIA_DOWNLOAD: 'wifi_cellular',
} as const;

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  TYPING: 'typing',
  READ_RECEIPT: 'read_receipt',
  USER_STATUS: 'user_status',
  CALL: 'call',
  CALL_ANSWER: 'call_answer',
  CALL_END: 'call_end',
  CALL_REJECT: 'call_reject',
  KEY_EXCHANGE: 'key_exchange',
  ENCRYPTED_MESSAGE: 'encrypted_message',
} as const;

// Encryption Events
export const ENCRYPTION_EVENTS = {
  KEY_GENERATED: 'key_generated',
  KEY_EXCHANGED: 'key_exchanged',
  MESSAGE_ENCRYPTED: 'message_encrypted',
  MESSAGE_DECRYPTED: 'message_decrypted',
  KEY_ROTATED: 'key_rotated',
} as const;

// Privacy Levels
export const PRIVACY_LEVELS = {
  EVERYONE: 'everyone',
  CONTACTS: 'contacts',
  NOBODY: 'nobody',
} as const;

// Notification Categories
export const NOTIFICATION_CATEGORIES = {
  MESSAGE: 'MESSAGE',
  CALL: 'CALL',
  GROUP: 'GROUP',
  SYSTEM: 'SYSTEM',
} as const;

// Notification Actions
export const NOTIFICATION_ACTIONS = {
  REPLY: 'REPLY',
  MARK_READ: 'MARK_READ',
  ANSWER_CALL: 'ANSWER_CALL',
  REJECT_CALL: 'REJECT_CALL',
  VIEW_MESSAGE: 'VIEW_MESSAGE',
} as const;
