// UI State Types
import { Contact } from '../api';
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// Navigation Types
export type RootStackParamList = {
  Test: undefined;
  Auth: undefined;
  Main: undefined;
  Chat: { chatId: string; chatName?: string };
  Profile: { userId: string };
  Settings: undefined;
  GroupInfo: { groupId: string };
  MediaViewer: { mediaUrl: string; mediaType: string };
  Contacts: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyOTP: { phoneNumber: string };
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Chats: undefined;
  Status: undefined;
  Calls: undefined;
  Settings: undefined;
};

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    body: TextStyle;
    caption: TextStyle;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

// Component Props Types
export interface BaseComponentProps {
  children?: React.ReactNode;
  style?: any;
  testID?: string;
}

export interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}

export interface InputProps extends BaseComponentProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  label?: string;
  multiline?: boolean;
  numberOfLines?: number;
}

export interface ChatBubbleProps extends BaseComponentProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export interface ContactItemProps extends BaseComponentProps {
  contact: Contact;
  onPress: () => void;
  showLastSeen?: boolean;
  showOnlineStatus?: boolean;
}

// Modal Types
export interface ModalProps extends BaseComponentProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  animationType?: 'slide' | 'fade' | 'none';
}

// List Types
export interface ListItemProps extends BaseComponentProps {
  title: string;
  subtitle?: string;
  leftIcon?: string;
  rightIcon?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  badge?: string | number;
  showChevron?: boolean;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'phone' | 'select' | 'multiline';
  required?: boolean;
  validation?: (value: string) => string | undefined;
  options?: { label: string; value: string }[];
}

export interface FormData {
  [key: string]: string;
}

// Animation Types
export interface AnimationConfig {
  duration: number;
  delay?: number;
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

// Import React Native types
import { TextStyle } from 'react-native';
import { Message } from '../api';
