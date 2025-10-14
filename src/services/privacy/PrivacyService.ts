import { PRIVACY_LEVELS } from '../../constants';

export interface PrivacySettings {
  lastSeen: 'everyone' | 'contacts' | 'nobody';
  readReceipts: boolean;
  profilePhoto: 'everyone' | 'contacts' | 'nobody';
  status: 'everyone' | 'contacts' | 'nobody';
  onlineStatus: boolean;
  typingIndicator: boolean;
  messagePreview: boolean;
  groupInvites: 'everyone' | 'contacts' | 'nobody';
  blockedUsers: string[];
  mutedChats: string[];
  archivedChats: string[];
}

export interface BlockedUser {
  userId: string;
  phoneNumber: string;
  name: string;
  blockedAt: Date;
  reason?: string;
}

export interface MutedChat {
  chatId: string;
  mutedUntil: Date;
  reason: 'notifications' | 'temporary' | 'permanent';
}

class PrivacyService {
  private static instance: PrivacyService;
  private privacySettings: PrivacySettings;
  private blockedUsers: Map<string, BlockedUser> = new Map();
  private mutedChats: Map<string, MutedChat> = new Map();

  constructor() {
    this.privacySettings = this.getDefaultPrivacySettings();
  }

  static getInstance(): PrivacyService {
    if (!PrivacyService.instance) {
      PrivacyService.instance = new PrivacyService();
    }
    return PrivacyService.instance;
  }

  /**
   * Get default privacy settings
   */
  private getDefaultPrivacySettings(): PrivacySettings {
    return {
      lastSeen: PRIVACY_LEVELS.EVERYONE,
      readReceipts: true,
      profilePhoto: PRIVACY_LEVELS.EVERYONE,
      status: PRIVACY_LEVELS.EVERYONE,
      onlineStatus: true,
      typingIndicator: true,
      messagePreview: true,
      groupInvites: PRIVACY_LEVELS.EVERYONE,
      blockedUsers: [],
      mutedChats: [],
      archivedChats: [],
    };
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<void> {
    this.privacySettings = { ...this.privacySettings, ...settings };
    await this.savePrivacySettings();
  }

  /**
   * Get current privacy settings
   */
  getPrivacySettings(): PrivacySettings {
    return { ...this.privacySettings };
  }

  /**
   * Save privacy settings to storage
   */
  private async savePrivacySettings(): Promise<void> {
    try {
      // In production, save to secure storage
      console.log('Privacy settings saved:', this.privacySettings);
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: string, phoneNumber: string, name: string, reason?: string): Promise<void> {
    const blockedUser: BlockedUser = {
      userId,
      phoneNumber,
      name,
      blockedAt: new Date(),
      reason,
    };

    this.blockedUsers.set(userId, blockedUser);
    this.privacySettings.blockedUsers.push(userId);
    
    await this.savePrivacySettings();
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<void> {
    this.blockedUsers.delete(userId);
    this.privacySettings.blockedUsers = this.privacySettings.blockedUsers.filter(id => id !== userId);
    
    await this.savePrivacySettings();
  }

  /**
   * Check if user is blocked
   */
  isUserBlocked(userId: string): boolean {
    return this.blockedUsers.has(userId);
  }

  /**
   * Get blocked users list
   */
  getBlockedUsers(): BlockedUser[] {
    return Array.from(this.blockedUsers.values());
  }

  /**
   * Mute a chat
   */
  async muteChat(chatId: string, duration: number = 0, reason: 'notifications' | 'temporary' | 'permanent' = 'notifications'): Promise<void> {
    const mutedUntil = duration > 0 ? new Date(Date.now() + duration) : new Date(0);
    
    const mutedChat: MutedChat = {
      chatId,
      mutedUntil,
      reason,
    };

    this.mutedChats.set(chatId, mutedChat);
    this.privacySettings.mutedChats.push(chatId);
    
    await this.savePrivacySettings();
  }

  /**
   * Unmute a chat
   */
  async unmuteChat(chatId: string): Promise<void> {
    this.mutedChats.delete(chatId);
    this.privacySettings.mutedChats = this.privacySettings.mutedChats.filter(id => id !== chatId);
    
    await this.savePrivacySettings();
  }

  /**
   * Check if chat is muted
   */
  isChatMuted(chatId: string): boolean {
    const mutedChat = this.mutedChats.get(chatId);
    if (!mutedChat) return false;
    
    // Check if mute has expired
    if (mutedChat.mutedUntil.getTime() > 0 && mutedChat.mutedUntil.getTime() < Date.now()) {
      this.unmuteChat(chatId);
      return false;
    }
    
    return true;
  }

  /**
   * Archive a chat
   */
  async archiveChat(chatId: string): Promise<void> {
    if (!this.privacySettings.archivedChats.includes(chatId)) {
      this.privacySettings.archivedChats.push(chatId);
      await this.savePrivacySettings();
    }
  }

  /**
   * Unarchive a chat
   */
  async unarchiveChat(chatId: string): Promise<void> {
    this.privacySettings.archivedChats = this.privacySettings.archivedChats.filter(id => id !== chatId);
    await this.savePrivacySettings();
  }

  /**
   * Check if chat is archived
   */
  isChatArchived(chatId: string): boolean {
    return this.privacySettings.archivedChats.includes(chatId);
  }

  /**
   * Check if user can see last seen
   */
  canSeeLastSeen(userId: string, isContact: boolean): boolean {
    switch (this.privacySettings.lastSeen) {
      case PRIVACY_LEVELS.EVERYONE:
        return true;
      case PRIVACY_LEVELS.CONTACTS:
        return isContact;
      case PRIVACY_LEVELS.NOBODY:
        return false;
      default:
        return false;
    }
  }

  /**
   * Check if user can see profile photo
   */
  canSeeProfilePhoto(userId: string, isContact: boolean): boolean {
    switch (this.privacySettings.profilePhoto) {
      case PRIVACY_LEVELS.EVERYONE:
        return true;
      case PRIVACY_LEVELS.CONTACTS:
        return isContact;
      case PRIVACY_LEVELS.NOBODY:
        return false;
      default:
        return false;
    }
  }

  /**
   * Check if user can see status
   */
  canSeeStatus(userId: string, isContact: boolean): boolean {
    switch (this.privacySettings.status) {
      case PRIVACY_LEVELS.EVERYONE:
        return true;
      case PRIVACY_LEVELS.CONTACTS:
        return isContact;
      case PRIVACY_LEVELS.NOBODY:
        return false;
      default:
        return false;
    }
  }

  /**
   * Check if read receipts are enabled
   */
  areReadReceiptsEnabled(): boolean {
    return this.privacySettings.readReceipts;
  }

  /**
   * Check if typing indicator is enabled
   */
  isTypingIndicatorEnabled(): boolean {
    return this.privacySettings.typingIndicator;
  }

  /**
   * Check if message preview is enabled
   */
  isMessagePreviewEnabled(): boolean {
    return this.privacySettings.messagePreview;
  }

  /**
   * Check if online status is visible
   */
  isOnlineStatusVisible(): boolean {
    return this.privacySettings.onlineStatus;
  }

  /**
   * Reset privacy settings to default
   */
  async resetPrivacySettings(): Promise<void> {
    this.privacySettings = this.getDefaultPrivacySettings();
    this.blockedUsers.clear();
    this.mutedChats.clear();
    await this.savePrivacySettings();
  }
}

export const privacyService = PrivacyService.getInstance();
