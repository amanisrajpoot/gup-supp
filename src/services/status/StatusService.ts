import { API_BASE_URL } from '../../constants';
import { notificationService } from '../notifications/NotificationService';

export interface Status {
  id: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  thumbnailUrl?: string;
  duration?: number; // for video
  views: number;
  viewers: string[];
  createdAt: Date;
  expiresAt: Date;
  isViewed: boolean;
  privacy: 'everyone' | 'contacts' | 'close_friends';
}

export interface StatusView {
  statusId: string;
  userId: string;
  viewedAt: Date;
}

export interface CloseFriend {
  userId: string;
  addedAt: Date;
}

class StatusService {
  private static instance: StatusService;
  private baseUrl = `${API_BASE_URL}/status`;
  private closeFriends: Map<string, CloseFriend> = new Map();

  static getInstance(): StatusService {
    if (!StatusService.instance) {
      StatusService.instance = new StatusService();
    }
    return StatusService.instance;
  }

  /**
   * Create a new status
   */
  async createStatus(
    content: string,
    type: 'text' | 'image' | 'video',
    mediaUrl?: string,
    thumbnailUrl?: string,
    duration?: number,
    privacy: 'everyone' | 'contacts' | 'close_friends' = 'everyone'
  ): Promise<Status> {
    try {
      const statusData = {
        content,
        type,
        mediaUrl,
        thumbnailUrl,
        duration,
        privacy,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create status');
      }

      const status: Status = await response.json();
      return status;
    } catch (error: any) {
      console.error('Failed to create status:', error);
      throw new Error(error.message || 'Failed to create status');
    }
  }

  /**
   * Get status feed
   */
  async getStatusFeed(): Promise<Status[]> {
    try {
      const response = await fetch(`${this.baseUrl}/feed`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get status feed');
      }

      const statuses: Status[] = await response.json();
      return statuses;
    } catch (error: any) {
      console.error('Failed to get status feed:', error);
      throw new Error(error.message || 'Failed to get status feed');
    }
  }

  /**
   * Get user's own statuses
   */
  async getMyStatuses(): Promise<Status[]> {
    try {
      const response = await fetch(`${this.baseUrl}/my`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get my statuses');
      }

      const statuses: Status[] = await response.json();
      return statuses;
    } catch (error: any) {
      console.error('Failed to get my statuses:', error);
      throw new Error(error.message || 'Failed to get my statuses');
    }
  }

  /**
   * View a status
   */
  async viewStatus(statusId: string): Promise<StatusView> {
    try {
      const response = await fetch(`${this.baseUrl}/${statusId}/view`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to view status');
      }

      const view: StatusView = await response.json();
      return view;
    } catch (error: any) {
      console.error('Failed to view status:', error);
      throw new Error(error.message || 'Failed to view status');
    }
  }

  /**
   * Get status viewers
   */
  async getStatusViewers(statusId: string): Promise<StatusView[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${statusId}/viewers`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get status viewers');
      }

      const viewers: StatusView[] = await response.json();
      return viewers;
    } catch (error: any) {
      console.error('Failed to get status viewers:', error);
      throw new Error(error.message || 'Failed to get status viewers');
    }
  }

  /**
   * Delete a status
   */
  async deleteStatus(statusId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${statusId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete status');
      }
    } catch (error: any) {
      console.error('Failed to delete status:', error);
      throw new Error(error.message || 'Failed to delete status');
    }
  }

  /**
   * Add close friend
   */
  async addCloseFriend(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/close-friends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add close friend');
      }

      const closeFriend: CloseFriend = {
        userId,
        addedAt: new Date(),
      };

      this.closeFriends.set(userId, closeFriend);
    } catch (error: any) {
      console.error('Failed to add close friend:', error);
      throw new Error(error.message || 'Failed to add close friend');
    }
  }

  /**
   * Remove close friend
   */
  async removeCloseFriend(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/close-friends/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove close friend');
      }

      this.closeFriends.delete(userId);
    } catch (error: any) {
      console.error('Failed to remove close friend:', error);
      throw new Error(error.message || 'Failed to remove close friend');
    }
  }

  /**
   * Get close friends list
   */
  async getCloseFriends(): Promise<CloseFriend[]> {
    try {
      const response = await fetch(`${this.baseUrl}/close-friends`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get close friends');
      }

      const friends: CloseFriend[] = await response.json();
      this.closeFriends.clear();
      friends.forEach(friend => {
        this.closeFriends.set(friend.userId, friend);
      });

      return friends;
    } catch (error: any) {
      console.error('Failed to get close friends:', error);
      throw new Error(error.message || 'Failed to get close friends');
    }
  }

  /**
   * Check if user is close friend
   */
  isCloseFriend(userId: string): boolean {
    return this.closeFriends.has(userId);
  }

  /**
   * Get status privacy settings
   */
  async getStatusPrivacySettings(): Promise<{
    whoCanSeeMyStatus: 'everyone' | 'contacts' | 'close_friends';
    whoCanSeeMyReadReceipts: 'everyone' | 'contacts' | 'close_friends';
    whoCanSeeMyOnlineStatus: 'everyone' | 'contacts' | 'close_friends';
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/privacy`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get status privacy settings');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Failed to get status privacy settings:', error);
      throw new Error(error.message || 'Failed to get status privacy settings');
    }
  }

  /**
   * Update status privacy settings
   */
  async updateStatusPrivacySettings(settings: {
    whoCanSeeMyStatus?: 'everyone' | 'contacts' | 'close_friends';
    whoCanSeeMyReadReceipts?: 'everyone' | 'contacts' | 'close_friends';
    whoCanSeeMyOnlineStatus?: 'everyone' | 'contacts' | 'close_friends';
  }): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status privacy settings');
      }
    } catch (error: any) {
      console.error('Failed to update status privacy settings:', error);
      throw new Error(error.message || 'Failed to update status privacy settings');
    }
  }

  /**
   * Get status analytics
   */
  async getStatusAnalytics(statusId: string): Promise<{
    views: number;
    viewers: StatusView[];
    engagement: {
      likes: number;
      comments: number;
      shares: number;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${statusId}/analytics`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get status analytics');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Failed to get status analytics:', error);
      throw new Error(error.message || 'Failed to get status analytics');
    }
  }

  /**
   * Clean up expired statuses
   */
  async cleanupExpiredStatuses(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/cleanup`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cleanup expired statuses');
      }
    } catch (error: any) {
      console.error('Failed to cleanup expired statuses:', error);
      throw new Error(error.message || 'Failed to cleanup expired statuses');
    }
  }

  /**
   * Report status
   */
  async reportStatus(statusId: string, reason: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${statusId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to report status');
      }
    } catch (error: any) {
      console.error('Failed to report status:', error);
      throw new Error(error.message || 'Failed to report status');
    }
  }

  /**
   * Block user from seeing status
   */
  async blockUserFromStatus(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to block user from status');
      }
    } catch (error: any) {
      console.error('Failed to block user from status:', error);
      throw new Error(error.message || 'Failed to block user from status');
    }
  }
}

export const statusService = StatusService.getInstance();
