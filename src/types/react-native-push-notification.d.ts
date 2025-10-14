declare module 'react-native-push-notification' {
  interface PushNotificationOptions {
    onRegister?: (token: { token: string }) => void;
    onNotification?: (notification: any) => void;
    onAction?: (notification: any) => void;
    onRegistrationError?: (error: any) => void;
    permissions?: {
      alert?: boolean;
      badge?: boolean;
      sound?: boolean;
    };
    popInitialNotification?: boolean;
    requestPermissions?: boolean;
  }

  interface LocalNotificationOptions {
    title?: string;
    message?: string;
    data?: any;
    sound?: string;
    vibrate?: boolean;
    badge?: number;
    category?: string;
    priority?: 'high' | 'normal' | 'low';
    userInfo?: any;
  }

  interface PushNotification {
    configure(options: PushNotificationOptions): void;
    localNotification(options: LocalNotificationOptions): void;
    cancelAllLocalNotifications(): void;
    cancelLocalNotifications(options: { id: string }): void;
    setApplicationIconBadgeNumber(number: number): void;
  }

  const PushNotification: PushNotification;
  export default PushNotification;
}
