import { Platform, Alert, PermissionsAndroid } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { privacyService } from '../privacy/PrivacyService';

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  sound?: string;
  badge?: number;
  category?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  showPreview: boolean;
  groupMessages: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  blockedKeywords: string[];
}

class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings;
  private isInitialized = false;

  constructor() {
    this.settings = this.getDefaultSettings();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      await this.requestPermissions();

      // Configure push notifications
      PushNotification.configure({
        onRegister: (token) => {
          console.log('FCM Token:', token);
          this.registerToken(token.token);
        },
        onNotification: (notification) => {
          this.handleNotification(notification);
        },
        onAction: (notification) => {
          this.handleNotificationAction(notification);
        },
        onRegistrationError: (error) => {
          console.error('Push notification registration error:', error);
        },
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },
        popInitialNotification: true,
        requestPermissions: true,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'This app needs notification permission to show message alerts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('Permission request error:', error);
        return false;
      }
    }
    return true; // iOS permissions handled by PushNotification.configure
  }

  /**
   * Register FCM token with server
   */
  private async registerToken(token: string): Promise<void> {
    try {
      // Send token to server
      console.log('Registering FCM token:', token);
    } catch (error) {
      console.error('Failed to register FCM token:', error);
    }
  }

  /**
   * Send local notification
   */
  sendLocalNotification(data: NotificationData): void {
    if (!this.settings.enabled) return;

    // Check quiet hours
    if (this.isQuietHours()) return;

    // Check if chat is muted
    if (data.data?.chatId && privacyService.isChatMuted(data.data.chatId)) return;

    // Check blocked keywords
    if (this.containsBlockedKeywords(data.body)) return;

    PushNotification.localNotification({
      title: data.title,
      message: data.body,
      data: data.data,
      sound: this.settings.sound ? data.sound || 'default' : undefined,
      vibrate: this.settings.vibration,
      badge: data.badge,
      category: data.category,
      priority: data.priority || 'high',
      userInfo: data.data,
    });
  }

  /**
   * Send message notification
   */
  sendMessageNotification(message: any, chatName: string, senderName: string): void {
    if (!this.settings.showPreview) {
      this.sendLocalNotification({
        title: chatName,
        body: 'New message',
        data: { chatId: message.chatId, messageId: message.id },
        category: 'MESSAGE',
      });
    } else {
      this.sendLocalNotification({
        title: chatName,
        body: `${senderName}: ${message.content}`,
        data: { chatId: message.chatId, messageId: message.id },
        category: 'MESSAGE',
      });
    }
  }

  /**
   * Send call notification
   */
  sendCallNotification(callData: any): void {
    this.sendLocalNotification({
      title: 'Incoming Call',
      body: `${callData.callerName} is calling you`,
      data: { callId: callData.id, type: 'call' },
      category: 'CALL',
      priority: 'high',
    });
  }

  /**
   * Send group notification
   */
  sendGroupNotification(groupName: string, action: string, userName: string): void {
    this.sendLocalNotification({
      title: groupName,
      body: `${userName} ${action}`,
      data: { groupId: groupName, type: 'group' },
      category: 'GROUP',
    });
  }

  /**
   * Handle incoming notification
   */
  private handleNotification(notification: any): void {
    console.log('Notification received:', notification);
    
    // Handle different notification types
    if (notification.data?.type === 'call') {
      this.handleCallNotification(notification);
    } else if (notification.data?.type === 'message') {
      this.handleMessageNotification(notification);
    }
  }

  /**
   * Handle notification action
   */
  private handleNotificationAction(notification: any): void {
    console.log('Notification action:', notification);
    
    // Handle notification actions (reply, mark as read, etc.)
    if (notification.action === 'REPLY') {
      this.handleReplyAction(notification);
    } else if (notification.action === 'MARK_READ') {
      this.handleMarkReadAction(notification);
    }
  }

  /**
   * Handle call notification
   */
  private handleCallNotification(notification: any): void {
    // Navigate to call screen or show call UI
    console.log('Handling call notification:', notification);
  }

  /**
   * Handle message notification
   */
  private handleMessageNotification(notification: any): void {
    // Navigate to chat screen
    console.log('Handling message notification:', notification);
  }

  /**
   * Handle reply action
   */
  private handleReplyAction(notification: any): void {
    // Send quick reply
    console.log('Handling reply action:', notification);
  }

  /**
   * Handle mark as read action
   */
  private handleMarkReadAction(notification: any): void {
    // Mark message as read
    console.log('Handling mark as read action:', notification);
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const startTime = this.parseTime(this.settings.quietHours.start);
    const endTime = this.parseTime(this.settings.quietHours.end);

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Parse time string (HH:MM) to minutes
   */
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Check if message contains blocked keywords
   */
  private containsBlockedKeywords(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return this.settings.blockedKeywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
  }

  /**
   * Update notification settings
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveSettings();
  }

  /**
   * Get current settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      // Save to AsyncStorage or secure storage
      console.log('Notification settings saved:', this.settings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      sound: true,
      vibration: true,
      showPreview: true,
      groupMessages: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
      blockedKeywords: [],
    };
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    PushNotification.cancelAllLocalNotifications();
  }

  /**
   * Clear notifications for specific chat
   */
  clearChatNotifications(chatId: string): void {
    PushNotification.cancelLocalNotifications({ id: chatId });
  }

  /**
   * Set badge count
   */
  setBadgeCount(count: number): void {
    PushNotification.setApplicationIconBadgeNumber(count);
  }
}

export const notificationService = NotificationService.getInstance();
