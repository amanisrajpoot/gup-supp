import { API_BASE_URL } from '../../constants';
import { Group } from '../../types/api';

class GroupService {
  private baseUrl = `${API_BASE_URL}/groups`;

  async getGroups(token: string): Promise<Group[]> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load groups');
      }

      const data: Group[] = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while loading groups');
    }
  }

  async createGroup(name: string, description: string | undefined, participants: string[], token: string): Promise<Group> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          participants,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create group');
      }

      const data: Group = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while creating group');
    }
  }

  async updateGroup(groupId: string, updates: Partial<Group>, token: string): Promise<Group> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}`, {
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

      const data: Group = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while updating group');
    }
  }

  async addToGroup(groupId: string, userIds: string[], token: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/add`, {
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
      const response = await fetch(`${this.baseUrl}/${groupId}/remove`, {
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
      const response = await fetch(`${this.baseUrl}/${groupId}/leave`, {
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

  async deleteGroup(groupId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}`, {
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

  async getGroupDetails(groupId: string, token: string): Promise<Group> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load group details');
      }

      const data: Group = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while loading group details');
    }
  }

  async updateGroupAdmin(groupId: string, userId: string, isAdmin: boolean, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, isAdmin }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update group admin');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while updating group admin');
    }
  }
}

export const groupService = new GroupService();
