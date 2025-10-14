import { webRTCService, CallState, CallOptions } from './WebRTCService';
import { notificationService } from '../notifications/NotificationService';
import { API_BASE_URL } from '../../constants';
import { Call } from '../../types/api';

export interface CallSession {
  call: Call;
  callState: CallState;
  isIncoming: boolean;
  isOutgoing: boolean;
}

class CallManagementService {
  private static instance: CallManagementService;
  private activeSessions: Map<string, CallSession> = new Map();
  private callHistory: Call[] = [];
  private baseUrl = `${API_BASE_URL}/calls`;

  static getInstance(): CallManagementService {
    if (!CallManagementService.instance) {
      CallManagementService.instance = new CallManagementService();
    }
    return CallManagementService.instance;
  }

  /**
   * Initialize call management service
   */
  async initialize(): Promise<void> {
    try {
      await webRTCService.initialize();
      this.setupEventHandlers();
      console.log('Call management service initialized');
    } catch (error) {
      console.error('Failed to initialize call management service:', error);
      throw error;
    }
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    webRTCService.onCallConnected = (callId: string) => {
      this.handleCallConnected(callId);
    };

    webRTCService.onCallEnded = (callId: string) => {
      this.handleCallEnded(callId);
    };

    webRTCService.onRemoteStream = (callId: string, stream: MediaStream) => {
      this.handleRemoteStream(callId, stream);
    };
  }

  /**
   * Initiate a call
   */
  async initiateCall(
    chatId: string,
    type: 'voice' | 'video',
    recipientId: string,
    options: CallOptions = { audio: true, video: type === 'video' }
  ): Promise<CallSession> {
    try {
      const callId = this.generateCallId();
      
      // Create call record
      const call: Call = {
        id: callId,
        chatId,
        callerId: '', // Will be set by server
        type,
        status: 'initiating',
        startTime: new Date(),
      };

      // Start WebRTC call
      const callState = await webRTCService.startCall(callId, type, options);

      // Create call session
      const session: CallSession = {
        call,
        callState,
        isIncoming: false,
        isOutgoing: true,
      };

      this.activeSessions.set(callId, session);

      // Send call initiation to server
      await this.sendCallInitiation(call);

      return session;
    } catch (error) {
      console.error('Failed to initiate call:', error);
      throw error;
    }
  }

  /**
   * Answer an incoming call
   */
  async answerCall(callId: string, options: CallOptions = { audio: true, video: false }): Promise<CallSession> {
    try {
      const session = this.activeSessions.get(callId);
      if (!session) {
        throw new Error('Call session not found');
      }

      // Answer WebRTC call
      const callState = await webRTCService.answerCall(callId, options);
      session.callState = callState;
      session.isIncoming = true;

      // Update call status
      session.call.status = 'connected';

      // Send answer to server
      await this.sendCallAnswer(callId);

      return session;
    } catch (error) {
      console.error('Failed to answer call:', error);
      throw error;
    }
  }

  /**
   * End a call
   */
  async endCall(callId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(callId);
      if (!session) return;

      // End WebRTC call
      await webRTCService.endCall(callId);

      // Update call record
      session.call.status = 'ended';
      session.call.endTime = new Date();
      if (session.call.startTime) {
        session.call.duration = session.call.endTime.getTime() - session.call.startTime.getTime();
      }

      // Add to call history
      this.callHistory.unshift(session.call);

      // Send call end to server
      await this.sendCallEnd(callId);

      // Remove from active sessions
      this.activeSessions.delete(callId);
    } catch (error) {
      console.error('Failed to end call:', error);
      throw error;
    }
  }

  /**
   * Reject a call
   */
  async rejectCall(callId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(callId);
      if (!session) return;

      // Reject WebRTC call
      await webRTCService.rejectCall(callId);

      // Update call record
      session.call.status = 'missed';
      session.call.endTime = new Date();

      // Add to call history
      this.callHistory.unshift(session.call);

      // Send call rejection to server
      await this.sendCallRejection(callId);

      // Remove from active sessions
      this.activeSessions.delete(callId);
    } catch (error) {
      console.error('Failed to reject call:', error);
      throw error;
    }
  }

  /**
   * Mute/unmute audio
   */
  async toggleAudio(callId: string, muted: boolean): Promise<void> {
    try {
      await webRTCService.toggleAudio(callId, muted);
    } catch (error) {
      console.error('Failed to toggle audio:', error);
      throw error;
    }
  }

  /**
   * Mute/unmute video
   */
  async toggleVideo(callId: string, muted: boolean): Promise<void> {
    try {
      await webRTCService.toggleVideo(callId, muted);
    } catch (error) {
      console.error('Failed to toggle video:', error);
      throw error;
    }
  }

  /**
   * Switch camera
   */
  async switchCamera(callId: string): Promise<void> {
    try {
      await webRTCService.switchCamera(callId);
    } catch (error) {
      console.error('Failed to switch camera:', error);
      throw error;
    }
  }

  /**
   * Handle incoming call
   */
  async handleIncomingCall(callData: any): Promise<void> {
    try {
      const callId = callData.id;
      
      // Create call record
      const call: Call = {
        id: callId,
        chatId: callData.chatId,
        callerId: callData.callerId,
        type: callData.type,
        status: 'ringing',
        startTime: new Date(),
      };

      // Create call session
      const session: CallSession = {
        call,
        callState: {
          id: callId,
          type: callData.type,
          status: 'ringing',
        },
        isIncoming: true,
        isOutgoing: false,
      };

      this.activeSessions.set(callId, session);

      // Show incoming call notification
      notificationService.sendCallNotification({
        id: callId,
        callerName: callData.callerName,
        type: callData.type,
      });

      // Notify UI about incoming call
      this.onIncomingCall?.(session);
    } catch (error) {
      console.error('Failed to handle incoming call:', error);
      throw error;
    }
  }

  /**
   * Handle call connected
   */
  private handleCallConnected(callId: string): void {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.call.status = 'connected';
      this.onCallConnected?.(session);
    }
  }

  /**
   * Handle call ended
   */
  private handleCallEnded(callId: string): void {
    const session = this.activeSessions.get(callId);
    if (session) {
      this.onCallEnded?.(session);
    }
  }

  /**
   * Handle remote stream
   */
  private handleRemoteStream(callId: string, stream: MediaStream): void {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.callState.remoteStream = stream;
      this.onRemoteStream?.(session, stream);
    }
  }

  /**
   * Send call initiation to server
   */
  private async sendCallInitiation(call: Call): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(call),
      });

      if (!response.ok) {
        throw new Error('Failed to send call initiation');
      }
    } catch (error) {
      console.error('Failed to send call initiation:', error);
      throw error;
    }
  }

  /**
   * Send call answer to server
   */
  private async sendCallAnswer(callId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send call answer');
      }
    } catch (error) {
      console.error('Failed to send call answer:', error);
      throw error;
    }
  }

  /**
   * Send call end to server
   */
  private async sendCallEnd(callId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send call end');
      }
    } catch (error) {
      console.error('Failed to send call end:', error);
      throw error;
    }
  }

  /**
   * Send call rejection to server
   */
  private async sendCallRejection(callId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send call rejection');
      }
    } catch (error) {
      console.error('Failed to send call rejection:', error);
      throw error;
    }
  }

  /**
   * Generate unique call ID
   */
  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get active call session
   */
  getCallSession(callId: string): CallSession | undefined {
    return this.activeSessions.get(callId);
  }

  /**
   * Get all active call sessions
   */
  getActiveSessions(): CallSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get call history
   */
  getCallHistory(): Call[] {
    return [...this.callHistory];
  }

  /**
   * Clear call history
   */
  clearCallHistory(): void {
    this.callHistory = [];
  }

  // Event callbacks
  onIncomingCall?: (session: CallSession) => void;
  onCallConnected?: (session: CallSession) => void;
  onCallEnded?: (session: CallSession) => void;
  onRemoteStream?: (session: CallSession, stream: MediaStream) => void;
}

export const callManagementService = CallManagementService.getInstance();
