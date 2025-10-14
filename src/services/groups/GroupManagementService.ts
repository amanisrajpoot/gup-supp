import { API_BASE_URL } from '../../constants';
import { Group, User } from '../../types/api';
import { notificationService } from '../notifications/NotificationService';

export interface GroupSettings {
  name: string;
  description?: string;
  avatar?: string;
  isPublic: boolean;
  allowInvite: boolean;
  allowMemberAdd: boolean;
  allowMemberRemove: boolean;
  allowAdminChange: boolean;
  muteNotifications: boolean;
  archiveGroup: boolean;
}

export interface GroupMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  addedBy?: string;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  isUsed: boolean;
}

class GroupManagementService {
  private static instance: GroupManagementService;
  private baseUrl = `${API_BASE_URL}/groups`;

  static getInstance(): GroupManagementService {
    if (!GroupManagementService.instance) {
      GroupManagementService.instance = new GroupManagementService();
    }
    return GroupManagementService.instance;
  }

  /**
   * Create a new group
   */
  async createGroup(
    name: string,
    description: string,
    memberIds: string[],
    settings: Partial<GroupSettings> = {}
  ): Promise<Group> {
    try {
      const groupData = {
        name,
        description,
        memberIds,
        settings: {
          isPublic: false,
          allowInvite: true,
          allowMemberAdd: true,
          allowMemberRemove: true,
          allowAdminChange: true,
          muteNotifications: false,
          archiveGroup: false,
          ...settings,
        },
      };

      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create group');
      }

      const group: Group = await response.json();
      
      // Send notification to members
      this.notifyGroupMembers(group.id, 'Group created', `${group.name} has been created`);

      return group;
    } catch (error: any) {
      console.error('Failed to create group:', error);
      throw new Error(error.message || 'Failed to create group');
    }
  }

  /**
   * Update group settings
   */
  async updateGroupSettings(groupId: string, settings: Partial<GroupSettings>): Promise<Group> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update group settings');
      }

      const group: Group = await response.json();
      
      // Notify members about settings change
      this.notifyGroupMembers(groupId, 'Group settings updated', 'Group settings have been changed');

      return group;
    } catch (error: any) {
      console.error('Failed to update group settings:', error);
      throw new Error(error.message || 'Failed to update group settings');
    }
  }

  /**
   * Add members to group
   */
  async addMembers(groupId: string, memberIds: string[]): Promise<GroupMember[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add members');
      }

      const members: GroupMember[] = await response.json();
      
      // Notify group about new members
      this.notifyGroupMembers(groupId, 'New members added', `${members.length} new members joined the group`);

      return members;
    } catch (error: any) {
      console.error('Failed to add members:', error);
      throw new Error(error.message || 'Failed to add members');
    }
  }

  /**
   * Remove members from group
   */
  async removeMembers(groupId: string, memberIds: string[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove members');
      }

      // Notify group about removed members
      this.notifyGroupMembers(groupId, 'Members removed', `${memberIds.length} members were removed from the group`);
    } catch (error: any) {
      console.error('Failed to remove members:', error);
      throw new Error(error.message || 'Failed to remove members');
    }
  }

  /**
   * Leave group
   */
  async leaveGroup(groupId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to leave group');
      }

      // Notify group about leaving
      this.notifyGroupMembers(groupId, 'Member left', 'A member left the group');
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      throw new Error(error.message || 'Failed to leave group');
    }
  }

  /**
   * Promote member to admin
   */
  async promoteToAdmin(groupId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, action: 'promote' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to promote member');
      }

      // Notify group about admin promotion
      this.notifyGroupMembers(groupId, 'Admin promoted', 'A member has been promoted to admin');
    } catch (error: any) {
      console.error('Failed to promote member:', error);
      throw new Error(error.message || 'Failed to promote member');
    }
  }

  /**
   * Demote admin to member
   */
  async demoteFromAdmin(groupId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, action: 'demote' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to demote admin');
      }

      // Notify group about admin demotion
      this.notifyGroupMembers(groupId, 'Admin demoted', 'An admin has been demoted to member');
    } catch (error: any) {
      console.error('Failed to demote admin:', error);
      throw new Error(error.message || 'Failed to demote admin');
    }
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/members`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get group members');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Failed to get group members:', error);
      throw new Error(error.message || 'Failed to get group members');
    }
  }

  /**
   * Get group info
   */
  async getGroupInfo(groupId: string): Promise<Group> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get group info');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Failed to get group info:', error);
      throw new Error(error.message || 'Failed to get group info');
    }
  }

  /**
   * Update group avatar
   */
  async updateGroupAvatar(groupId: string, avatarUrl: string): Promise<Group> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/avatar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatarUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update group avatar');
      }

      const group: Group = await response.json();
      
      // Notify group about avatar change
      this.notifyGroupMembers(groupId, 'Group avatar updated', 'The group avatar has been changed');

      return group;
    } catch (error: any) {
      console.error('Failed to update group avatar:', error);
      throw new Error(error.message || 'Failed to update group avatar');
    }
  }

  /**
   * Mute group notifications
   */
  async muteGroup(groupId: string, duration: number = 0): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/mute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mute group');
      }
    } catch (error: any) {
      console.error('Failed to mute group:', error);
      throw new Error(error.message || 'Failed to mute group');
    }
  }

  /**
   * Unmute group notifications
   */
  async unmuteGroup(groupId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/unmute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unmute group');
      }
    } catch (error: any) {
      console.error('Failed to unmute group:', error);
      throw new Error(error.message || 'Failed to unmute group');
    }
  }

  /**
   * Archive group
   */
  async archiveGroup(groupId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to archive group');
      }
    } catch (error: any) {
      console.error('Failed to archive group:', error);
      throw new Error(error.message || 'Failed to archive group');
    }
  }

  /**
   * Unarchive group
   */
  async unarchiveGroup(groupId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/unarchive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unarchive group');
      }
    } catch (error: any) {
      console.error('Failed to unarchive group:', error);
      throw new Error(error.message || 'Failed to unarchive group');
    }
  }

  /**
   * Delete group
   */
  async deleteGroup(groupId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete group');
      }

      // Notify group about deletion
      this.notifyGroupMembers(groupId, 'Group deleted', 'This group has been deleted');
    } catch (error: any) {
      console.error('Failed to delete group:', error);
      throw new Error(error.message || 'Failed to delete group');
    }
  }

  /**
   * Create group invite
   */
  async createGroupInvite(groupId: string, expiresInHours: number = 24): Promise<GroupInvite> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresInHours }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create group invite');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Failed to create group invite:', error);
      throw new Error(error.message || 'Failed to create group invite');
    }
  }

  /**
   * Join group with invite
   */
  async joinGroupWithInvite(inviteId: string): Promise<Group> {
    try {
      const response = await fetch(`${this.baseUrl}/join/${inviteId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join group');
      }

      const group: Group = await response.json();
      
      // Notify group about new member
      this.notifyGroupMembers(group.id, 'New member joined', 'A new member joined the group via invite');

      return group;
    } catch (error: any) {
      console.error('Failed to join group:', error);
      throw new Error(error.message || 'Failed to join group');
    }
  }

  /**
   * Notify group members
   */
  private notifyGroupMembers(groupId: string, title: string, message: string): void {
    notificationService.sendGroupNotification(groupId, message, 'System');
  }
}

export const groupManagementService = GroupManagementService.getInstance();
