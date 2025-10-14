import { API_BASE_URL } from '../../constants';

class NotificationService {
  private baseUrl = `${API_BASE_URL}/notifications`;

  async registerDevice(deviceToken: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register device');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while registering device');
    }
  }

  async unregisterDevice(deviceToken: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/unregister`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unregister device');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while unregistering device');
    }
  }

  async updateNotificationSettings(settings: any, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update notification settings');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while updating notification settings');
    }
  }

  async sendTestNotification(token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send test notification');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while sending test notification');
    }
  }

  async getNotificationHistory(token: string, page = 1, limit = 50): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/history?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load notification history');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while loading notification history');
    }
  }

  async markNotificationAsRead(notificationId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark notification as read');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while marking notification as read');
    }
  }

  async clearAllNotifications(token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/clear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to clear notifications');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while clearing notifications');
    }
  }
}

export const notificationService = new NotificationService();
