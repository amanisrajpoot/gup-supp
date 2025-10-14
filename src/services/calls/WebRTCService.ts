import { Platform } from 'react-native';

export interface CallConfig {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize: number;
  bundlePolicy: RTCBundlePolicy;
  rtcpMuxPolicy: RTCRtcpMuxPolicy;
}

export interface CallState {
  id: string;
  type: 'voice' | 'video';
  status: 'initiating' | 'ringing' | 'connected' | 'ended' | 'missed';
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  peerConnection?: RTCPeerConnection;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export interface CallOptions {
  audio: boolean;
  video: boolean;
  audioConstraints?: MediaStreamConstraints['audio'];
  videoConstraints?: MediaStreamConstraints['video'];
}

class WebRTCService {
  private static instance: WebRTCService;
  private activeCalls: Map<string, CallState> = new Map();
  private defaultConfig: CallConfig;

  constructor() {
    this.defaultConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };
  }

  static getInstance(): WebRTCService {
    if (!WebRTCService.instance) {
      WebRTCService.instance = new WebRTCService();
    }
    return WebRTCService.instance;
  }

  /**
   * Initialize WebRTC service
   */
  async initialize(): Promise<void> {
    try {
      // Initialize any required WebRTC setup
      console.log('WebRTC service initialized');
    } catch (error) {
      console.error('Failed to initialize WebRTC service:', error);
      throw error;
    }
  }

  /**
   * Start a new call
   */
  async startCall(
    callId: string,
    type: 'voice' | 'video',
    options: CallOptions = { audio: true, video: false }
  ): Promise<CallState> {
    try {
      const callState: CallState = {
        id: callId,
        type,
        status: 'initiating',
        startTime: new Date(),
      };

      // Create peer connection
      const peerConnection = new RTCPeerConnection(this.defaultConfig);
      callState.peerConnection = peerConnection;

      // Get user media
      const stream = await this.getUserMedia(options);
      callState.localStream = stream;

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Set up event handlers
      this.setupPeerConnectionHandlers(peerConnection, callId);

      this.activeCalls.set(callId, callState);
      return callState;
    } catch (error) {
      console.error('Failed to start call:', error);
      throw error;
    }
  }

  /**
   * Answer an incoming call
   */
  async answerCall(callId: string, options: CallOptions = { audio: true, video: false }): Promise<CallState> {
    try {
      const callState = this.activeCalls.get(callId);
      if (!callState) {
        throw new Error('Call not found');
      }

      // Get user media
      const stream = await this.getUserMedia(options);
      callState.localStream = stream;

      // Add tracks to peer connection
      if (callState.peerConnection) {
        stream.getTracks().forEach(track => {
          callState.peerConnection!.addTrack(track, stream);
        });
      }

      callState.status = 'connected';
      return callState;
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
      const callState = this.activeCalls.get(callId);
      if (!callState) return;

      // Stop local stream
      if (callState.localStream) {
        callState.localStream.getTracks().forEach(track => track.stop());
      }

      // Close peer connection
      if (callState.peerConnection) {
        callState.peerConnection.close();
      }

      // Update call state
      callState.status = 'ended';
      callState.endTime = new Date();
      if (callState.startTime) {
        callState.duration = callState.endTime.getTime() - callState.startTime.getTime();
      }

      this.activeCalls.delete(callId);
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
      const callState = this.activeCalls.get(callId);
      if (!callState) return;

      callState.status = 'missed';
      callState.endTime = new Date();

      this.activeCalls.delete(callId);
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
      const callState = this.activeCalls.get(callId);
      if (!callState || !callState.localStream) return;

      const audioTracks = callState.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !muted;
      });
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
      const callState = this.activeCalls.get(callId);
      if (!callState || !callState.localStream) return;

      const videoTracks = callState.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !muted;
      });
    } catch (error) {
      console.error('Failed to toggle video:', error);
      throw error;
    }
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(callId: string): Promise<void> {
    try {
      const callState = this.activeCalls.get(callId);
      if (!callState || !callState.localStream) return;

      const videoTrack = callState.localStream.getVideoTracks()[0];
      if (videoTrack && videoTrack.getSettings().facingMode) {
        const newFacingMode = videoTrack.getSettings().facingMode === 'user' ? 'environment' : 'user';
        
        // Replace video track with new facing mode
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacingMode },
          audio: true,
        });

        const newVideoTrack = newStream.getVideoTracks()[0];
        const sender = callState.peerConnection?.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );

        if (sender && newVideoTrack) {
          await sender.replaceTrack(newVideoTrack);
          
          // Replace local stream
          callState.localStream.removeTrack(videoTrack);
          callState.localStream.addTrack(newVideoTrack);
        }
      }
    } catch (error) {
      console.error('Failed to switch camera:', error);
      throw error;
    }
  }

  /**
   * Get user media
   */
  private async getUserMedia(options: CallOptions): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: options.audio ? options.audioConstraints || true : false,
        video: options.video ? options.videoConstraints || {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
      };

      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw error;
    }
  }

  /**
   * Set up peer connection event handlers
   */
  private setupPeerConnectionHandlers(peerConnection: RTCPeerConnection, callId: string): void {
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer
        this.sendIceCandidate(callId, event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      const callState = this.activeCalls.get(callId);
      if (callState) {
        callState.remoteStream = event.streams[0];
        // Notify UI about remote stream
        this.onRemoteStream?.(callId, event.streams[0]);
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const callState = this.activeCalls.get(callId);
      if (callState) {
        console.log('Connection state changed:', peerConnection.connectionState);
        
        if (peerConnection.connectionState === 'connected') {
          callState.status = 'connected';
          this.onCallConnected?.(callId);
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
          this.endCall(callId);
          this.onCallEnded?.(callId);
        }
      }
    };
  }

  /**
   * Send ICE candidate to remote peer
   */
  private async sendIceCandidate(callId: string, candidate: RTCIceCandidate): Promise<void> {
    try {
      // In a real implementation, send this via WebSocket to remote peer
      console.log('Sending ICE candidate:', candidate);
    } catch (error) {
      console.error('Failed to send ICE candidate:', error);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(callId: string, candidate: RTCIceCandidate): Promise<void> {
    try {
      const callState = this.activeCalls.get(callId);
      if (callState?.peerConnection) {
        await callState.peerConnection.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
    }
  }

  /**
   * Create offer for call
   */
  async createOffer(callId: string): Promise<RTCSessionDescriptionInit> {
    try {
      const callState = this.activeCalls.get(callId);
      if (!callState?.peerConnection) {
        throw new Error('Call not found or peer connection not initialized');
      }

      const offer = await callState.peerConnection.createOffer();
      await callState.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  /**
   * Create answer for call
   */
  async createAnswer(callId: string): Promise<RTCSessionDescriptionInit> {
    try {
      const callState = this.activeCalls.get(callId);
      if (!callState?.peerConnection) {
        throw new Error('Call not found or peer connection not initialized');
      }

      const answer = await callState.peerConnection.createAnswer();
      await callState.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Failed to create answer:', error);
      throw error;
    }
  }

  /**
   * Handle remote offer
   */
  async handleOffer(callId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const callState = this.activeCalls.get(callId);
      if (!callState?.peerConnection) {
        throw new Error('Call not found or peer connection not initialized');
      }

      await callState.peerConnection.setRemoteDescription(offer);
    } catch (error) {
      console.error('Failed to handle offer:', error);
      throw error;
    }
  }

  /**
   * Handle remote answer
   */
  async handleAnswer(callId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const callState = this.activeCalls.get(callId);
      if (!callState?.peerConnection) {
        throw new Error('Call not found or peer connection not initialized');
      }

      await callState.peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('Failed to handle answer:', error);
      throw error;
    }
  }

  /**
   * Get active call
   */
  getCall(callId: string): CallState | undefined {
    return this.activeCalls.get(callId);
  }

  /**
   * Get all active calls
   */
  getActiveCalls(): CallState[] {
    return Array.from(this.activeCalls.values());
  }

  // Event callbacks
  onRemoteStream?: (callId: string, stream: MediaStream) => void;
  onCallConnected?: (callId: string) => void;
  onCallEnded?: (callId: string) => void;
}

export const webRTCService = WebRTCService.getInstance();
