import { API_BASE_URL } from '../../constants';
import { Chat, Message } from '../../types/api';
import { encryptionService } from '../encryption/EncryptionService';
import { keyManagementService } from '../encryption/KeyManagementService';

class ChatService {
  private baseUrl = `${API_BASE_URL}/chat`;

  async getChats(token: string): Promise<Chat[]> {
    try {
      const response = await fetch(`${this.baseUrl}/chats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load chats');
      }

      const data: Chat[] = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while loading chats');
    }
  }

  async getMessages(chatId: string, token: string, page = 1, limit = 50): Promise<Message[]> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/${chatId}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load messages');
      }

      const data: Message[] = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while loading messages');
    }
  }

  async sendMessage(chatId: string, content: string, type: string, token: string, recipientId?: string): Promise<Message> {
    try {
      let encryptedContent = content;
      let encryptionKey = null;

      // Encrypt message if recipient is specified
      if (recipientId) {
        const keyBundle = await keyManagementService.fetchKeyBundle(recipientId);
        if (keyBundle) {
          const keyPair = await keyManagementService.getKeyBundle(recipientId);
          if (keyPair) {
            const encryptedMessage = encryptionService.encryptMessage(
              content,
              keyBundle.identityKey.publicKey,
              keyPair.identityKey.privateKey
            );
            encryptedContent = JSON.stringify(encryptedMessage);
            encryptionKey = encryptedMessage.keyId;
          }
        }
      }
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId,
          content: encryptedContent,
          type,
          encryptionKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      const data: Message = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while sending message');
    }
  }

  async markAsRead(chatId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/mark-read/${chatId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark as read');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while marking as read');
    }
  }

  async deleteMessage(messageId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete message');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while deleting message');
    }
  }

  async editMessage(messageId: string, content: string, token: string): Promise<Message> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to edit message');
      }

      const data: Message = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while editing message');
    }
  }

  async createGroup(name: string, participants: string[], token: string): Promise<Chat> {
    try {
      const response = await fetch(`${this.baseUrl}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          participants,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create group');
      }

      const data: Chat = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while creating group');
    }
  }

  async addToGroup(groupId: string, userIds: string[], token: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add members to group');
      }

      const data: string[] = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while adding to group');
    }
  }

  async removeFromGroup(groupId: string, userId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove member from group');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while removing from group');
    }
  }

  async leaveGroup(groupId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to leave group');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while leaving group');
    }
  }

  async updateGroup(groupId: string, updates: Partial<Chat>, token: string): Promise<Chat> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update group');
      }

      const data: Chat = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while updating group');
    }
  }

  async deleteGroup(groupId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete group');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while deleting group');
    }
  }

  async setTyping(chatId: string, isTyping: boolean, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId,
          isTyping,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set typing status');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while setting typing status');
    }
  }

  /**
   * Decrypt a message
   */
  async decryptMessage(message: Message, senderId: string): Promise<string> {
    try {
      if (!message.encryptionKey) {
        return message.content; // Message is not encrypted
      }

      const keyBundle = await keyManagementService.getKeyBundle(senderId);
      if (!keyBundle) {
        throw new Error('Sender key bundle not found');
      }

      const encryptedMessage = JSON.parse(message.content);
      const decryptedContent = encryptionService.decryptMessage(
        encryptedMessage,
        keyBundle.identityKey.publicKey,
        keyBundle.identityKey.privateKey
      );

      return decryptedContent;
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      return message.content; // Return original content if decryption fails
    }
  }

  /**
   * Decrypt multiple messages
   */
  async decryptMessages(messages: Message[], senderId: string): Promise<Message[]> {
    const decryptedMessages = await Promise.all(
      messages.map(async (message) => {
        try {
          const decryptedContent = await this.decryptMessage(message, senderId);
          return { ...message, content: decryptedContent };
        } catch (error) {
          console.error('Failed to decrypt message:', message.id, error);
          return message; // Return original message if decryption fails
        }
      })
    );

    return decryptedMessages;
  }
}

export const chatService = new ChatService();
