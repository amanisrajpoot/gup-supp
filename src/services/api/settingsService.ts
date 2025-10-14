import { API_BASE_URL } from '../../constants';
import { SettingsState } from '../../types/store';

class SettingsService {
  private baseUrl = `${API_BASE_URL}/settings`;

  async getSettings(token: string): Promise<SettingsState> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load settings');
      }

      const data: SettingsState = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while loading settings');
    }
  }

  async updateSettings(settings: Partial<SettingsState>, token: string): Promise<SettingsState> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }

      const data: SettingsState = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while updating settings');
    }
  }

  async clearCache(token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/clear-cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to clear cache');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while clearing cache');
    }
  }

  async exportData(token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export data');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while exporting data');
    }
  }

  async importData(data: any, token: string): Promise<SettingsState> {
    try {
      const response = await fetch(`${this.baseUrl}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import data');
      }

      const result: SettingsState = await response.json();
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while importing data');
    }
  }

  async updateTheme(theme: 'light' | 'dark' | 'system', token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/theme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ theme }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update theme');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while updating theme');
    }
  }

  async updateLanguage(language: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/language`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ language }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update language');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while updating language');
    }
  }

  async updateNotifications(notifications: Partial<SettingsState['notifications']>, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(notifications),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update notifications');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while updating notifications');
    }
  }

  async updatePrivacy(privacy: Partial<SettingsState['privacy']>, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(privacy),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update privacy settings');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while updating privacy settings');
    }
  }
}

export const settingsService = new SettingsService();
