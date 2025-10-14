import { API_BASE_URL } from '../../constants';
import { Call } from '../../types/api';

class CallService {
  private baseUrl = `${API_BASE_URL}/calls`;

  async initiateCall(chatId: string, type: 'voice' | 'video', token: string): Promise<Call> {
    try {
      const response = await fetch(`${this.baseUrl}/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId,
          type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initiate call');
      }

      const data: Call = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while initiating call');
    }
  }

  async answerCall(callId: string, token: string): Promise<Call> {
    try {
      const response = await fetch(`${this.baseUrl}/${callId}/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to answer call');
      }

      const data: Call = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while answering call');
    }
  }

  async endCall(callId: string, token: string): Promise<Call> {
    try {
      const response = await fetch(`${this.baseUrl}/${callId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to end call');
      }

      const data: Call = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while ending call');
    }
  }

  async rejectCall(callId: string, token: string): Promise<Call> {
    try {
      const response = await fetch(`${this.baseUrl}/${callId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject call');
      }

      const data: Call = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while rejecting call');
    }
  }

  async muteCall(callId: string, token: string): Promise<Call> {
    try {
      const response = await fetch(`${this.baseUrl}/${callId}/mute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mute call');
      }

      const data: Call = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while muting call');
    }
  }

  async unmuteCall(callId: string, token: string): Promise<Call> {
    try {
      const response = await fetch(`${this.baseUrl}/${callId}/unmute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unmute call');
      }

      const data: Call = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while unmuting call');
    }
  }

  async switchCamera(callId: string, token: string): Promise<Call> {
    try {
      const response = await fetch(`${this.baseUrl}/${callId}/switch-camera`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to switch camera');
      }

      const data: Call = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while switching camera');
    }
  }

  async getCallHistory(token: string, page = 1, limit = 50): Promise<Call[]> {
    try {
      const response = await fetch(`${this.baseUrl}/history?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load call history');
      }

      const data: Call[] = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while loading call history');
    }
  }

  async getCallDetails(callId: string, token: string): Promise<Call> {
    try {
      const response = await fetch(`${this.baseUrl}/${callId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load call details');
      }

      const data: Call = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while loading call details');
    }
  }
}

export const callService = new CallService();
