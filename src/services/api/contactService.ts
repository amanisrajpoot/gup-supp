import { API_BASE_URL } from '../../constants';
import { Contact } from '../../types/api';

class ContactService {
  private baseUrl = `${API_BASE_URL}/contacts`;

  async getContacts(token: string): Promise<Contact[]> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load contacts');
      }

      const data: Contact[] = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while loading contacts');
    }
  }

  async syncContacts(phoneNumbers: string[], token: string): Promise<Contact[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumbers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sync contacts');
      }

      const data: Contact[] = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while syncing contacts');
    }
  }

  async blockContact(contactId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${contactId}/block`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to block contact');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while blocking contact');
    }
  }

  async unblockContact(contactId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${contactId}/unblock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unblock contact');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while unblocking contact');
    }
  }

  async searchContacts(query: string, token: string): Promise<Contact[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search contacts');
      }

      const data: Contact[] = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while searching contacts');
    }
  }

  async addContact(phoneNumber: string, name: string, token: string): Promise<Contact> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber,
          name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add contact');
      }

      const data: Contact = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while adding contact');
    }
  }

  async updateContact(contactId: string, updates: Partial<Contact>, token: string): Promise<Contact> {
    try {
      const response = await fetch(`${this.baseUrl}/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update contact');
      }

      const data: Contact = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while updating contact');
    }
  }

  async deleteContact(contactId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete contact');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while deleting contact');
    }
  }

  async getBlockedContacts(token: string): Promise<Contact[]> {
    try {
      const response = await fetch(`${this.baseUrl}/blocked`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load blocked contacts');
      }

      const data: Contact[] = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while loading blocked contacts');
    }
  }
}

export const contactService = new ContactService();
