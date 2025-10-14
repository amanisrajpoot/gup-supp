// Redux Store Types
import { User, Chat, Message, Contact, Group, Call } from '../api';

// Auth State
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Chat State
export interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: { [chatId: string]: Message[] };
  typingUsers: { [chatId: string]: string[] };
  isLoading: boolean;
  error: string | null;
}

// Contact State
export interface ContactState {
  contacts: Contact[];
  blockedContacts: string[];
  isLoading: boolean;
  error: string | null;
}

// Group State
export interface GroupState {
  groups: Group[];
  isLoading: boolean;
  error: string | null;
}

// Call State
export interface CallState {
  activeCall: Call | null;
  callHistory: Call[];
  isLoading: boolean;
  error: string | null;
}

// Settings State
export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    showPreview: boolean;
  };
  privacy: {
    lastSeen: 'everyone' | 'contacts' | 'nobody';
    readReceipts: boolean;
    profilePhoto: 'everyone' | 'contacts' | 'nobody';
    status: 'everyone' | 'contacts' | 'nobody';
  };
  chat: {
    fontSize: 'small' | 'medium' | 'large';
    enterToSend: boolean;
    mediaDownload: 'wifi' | 'wifi_cellular' | 'never';
  };
  storage: {
    autoDownload: boolean;
    clearCache: boolean;
    backupEnabled: boolean;
  };
}

// App State
export interface AppState {
  isOnline: boolean;
  isBackground: boolean;
  currentRoute: string;
  loading: {
    global: boolean;
    screens: { [key: string]: boolean };
  };
  error: {
    global: string | null;
    screens: { [key: string]: string | null };
  };
}

// Root State
export interface RootState {
  auth: AuthState;
  chat: ChatState;
  contacts: ContactState;
  groups: GroupState;
  calls: CallState;
  settings: SettingsState;
  app: AppState;
}

// Action Types
export interface BaseAction {
  type: string;
  payload?: any;
}

// Auth Actions
export interface AuthActions {
  login: (credentials: { phoneNumber: string; password: string }) => void;
  register: (userData: { phoneNumber: string; name: string; password: string }) => void;
  logout: () => void;
  verifyOTP: (phoneNumber: string, otp: string) => void;
  refreshToken: () => void;
  updateProfile: (userData: Partial<User>) => void;
}

// Chat Actions
export interface ChatActions {
  loadChats: () => void;
  loadMessages: (chatId: string) => void;
  sendMessage: (chatId: string, content: string, type: string) => void;
  markAsRead: (chatId: string) => void;
  deleteMessage: (messageId: string) => void;
  editMessage: (messageId: string, content: string) => void;
  setTyping: (chatId: string, isTyping: boolean) => void;
  createGroup: (groupData: { name: string; participants: string[] }) => void;
  addToGroup: (groupId: string, userIds: string[]) => void;
  removeFromGroup: (groupId: string, userId: string) => void;
  leaveGroup: (groupId: string) => void;
}

// Contact Actions
export interface ContactActions {
  loadContacts: () => void;
  syncContacts: () => void;
  blockContact: (contactId: string) => void;
  unblockContact: (contactId: string) => void;
  searchContacts: (query: string) => void;
}

// Call Actions
export interface CallActions {
  initiateCall: (chatId: string, type: 'voice' | 'video') => void;
  answerCall: (callId: string) => void;
  endCall: (callId: string) => void;
  rejectCall: (callId: string) => void;
  muteCall: (callId: string) => void;
  unmuteCall: (callId: string) => void;
  switchCamera: (callId: string) => void;
}

// Settings Actions
export interface SettingsActions {
  updateTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateLanguage: (language: string) => void;
  updateNotifications: (settings: Partial<SettingsState['notifications']>) => void;
  updatePrivacy: (settings: Partial<SettingsState['privacy']>) => void;
  updateChatSettings: (settings: Partial<SettingsState['chat']>) => void;
  updateStorageSettings: (settings: Partial<SettingsState['storage']>) => void;
  clearCache: () => void;
  exportData: () => void;
  importData: (data: any) => void;
}

// Re-export API types for convenience
export type { User, Chat, Message, Contact, Group, Call } from '../api';
