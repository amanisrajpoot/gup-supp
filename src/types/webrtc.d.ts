// WebRTC type declarations for React Native
declare global {
  interface RTCIceServer {
    urls: string | string[];
    username?: string;
    credential?: string;
  }

  type RTCBundlePolicy = 'balanced' | 'max-bundle' | 'max-compat';
  type RTCRtcpMuxPolicy = 'require' | 'negotiate';

  interface MediaStreamConstraints {
    audio?: boolean | MediaTrackConstraints;
    video?: boolean | MediaTrackConstraints;
  }

  interface MediaTrackConstraints {
    width?: number | ConstrainULongRange;
    height?: number | ConstrainULongRange;
    facingMode?: string | ConstrainDOMString;
  }

  interface ConstrainULongRange {
    min?: number;
    max?: number;
    ideal?: number;
  }

  interface ConstrainDOMString {
    exact?: string | string[];
    ideal?: string | string[];
  }

  interface MediaStream {
    getTracks(): MediaStreamTrack[];
    getAudioTracks(): MediaStreamTrack[];
    getVideoTracks(): MediaStreamTrack[];
    addTrack(track: MediaStreamTrack): void;
    removeTrack(track: MediaStreamTrack): void;
  }

  interface MediaStreamTrack {
    enabled: boolean;
    kind: string;
    label: string;
    getSettings(): MediaTrackSettings;
    stop(): void;
  }

  interface MediaTrackSettings {
    facingMode?: string;
    width?: number;
    height?: number;
  }

  interface RTCPeerConnection {
    addTrack(track: MediaStreamTrack, stream: MediaStream): RTCRtpSender;
    removeTrack(sender: RTCRtpSender): void;
    getSenders(): RTCRtpSender[];
    addIceCandidate(candidate: RTCIceCandidate): Promise<void>;
    createOffer(): Promise<RTCSessionDescriptionInit>;
    createAnswer(): Promise<RTCSessionDescriptionInit>;
    setLocalDescription(description: RTCSessionDescriptionInit): Promise<void>;
    setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
    close(): void;
    connectionState: string;
    onicecandidate: ((event: RTCIceCandidateEvent) => void) | null;
    ontrack: ((event: RTCTrackEvent) => void) | null;
    onconnectionstatechange: (() => void) | null;
  }

  interface RTCIceCandidate {
    candidate: string;
    sdpMLineIndex: number | null;
    sdpMid: string | null;
  }

  interface RTCIceCandidateEvent {
    candidate: RTCIceCandidate | null;
  }

  interface RTCTrackEvent {
    streams: MediaStream[];
  }

  interface RTCSessionDescriptionInit {
    type: 'offer' | 'answer' | 'pranswer' | 'rollback';
    sdp?: string;
  }

  interface RTCRtpSender {
    track: MediaStreamTrack | null;
    replaceTrack(track: MediaStreamTrack | null): Promise<void>;
  }

  interface Navigator {
    mediaDevices: MediaDevices;
  }

  interface MediaDevices {
    getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
  }

  var navigator: Navigator;
  var RTCPeerConnection: {
    new(configuration?: RTCConfiguration): RTCPeerConnection;
  };

  interface RTCConfiguration {
    iceServers?: RTCIceServer[];
    iceCandidatePoolSize?: number;
    bundlePolicy?: RTCBundlePolicy;
    rtcpMuxPolicy?: RTCRtcpMuxPolicy;
  }
}

export {};
