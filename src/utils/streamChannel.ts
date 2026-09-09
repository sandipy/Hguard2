import { CameraSlot, CameraStatusBroadcast, SecurityEvent } from '../types';

export class StreamChannel {
  private static channelName = 'HGUARD_SURVEILLANCE_CHANNEL_V2';
  private channel: BroadcastChannel | null = null;
  private onStatusCallbacks: ((status: CameraStatusBroadcast) => void)[] = [];
  private onAllCamerasCallbacks: ((cameraMap: Record<CameraSlot, CameraStatusBroadcast>) => void)[] = [];
  private onEventCallbacks: ((event: SecurityEvent) => void)[] = [];
  private onCommandCallbacks: ((cmd: { command: string; targetCameraId?: CameraSlot | 'all'; payload?: unknown }) => void)[] = [];

  private camerasState: Partial<Record<CameraSlot, CameraStatusBroadcast>> = {};

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(StreamChannel.channelName);
      this.channel.onmessage = (msg) => {
        this.handleMessage(msg.data);
      };
    }

    // Also listen to storage events as a fallback across browser tabs
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('HGUARD_STATUS_') && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          this.handleMessage({ type: 'CAMERA_STATUS', payload: data });
        } catch {
          // ignore
        }
      }
    });
  }

  private handleMessage(data: { type: string; payload: unknown }) {
    if (!data || !data.type) return;

    if (data.type === 'CAMERA_STATUS') {
      const status = data.payload as CameraStatusBroadcast;
      this.camerasState[status.cameraId] = status;
      this.onStatusCallbacks.forEach((cb) => cb(status));
      this.onAllCamerasCallbacks.forEach((cb) => cb(this.camerasState as Record<CameraSlot, CameraStatusBroadcast>));
    } else if (data.type === 'NEW_EVENT') {
      this.onEventCallbacks.forEach((cb) => cb(data.payload as SecurityEvent));
    } else if (data.type === 'REMOTE_COMMAND') {
      this.onCommandCallbacks.forEach((cb) => cb(data.payload as { command: string; targetCameraId?: CameraSlot | 'all'; payload?: unknown }));
    }
  }

  public broadcastCameraStatus(status: CameraStatusBroadcast) {
    this.camerasState[status.cameraId] = status;
    const payload = { type: 'CAMERA_STATUS', payload: status };
    if (this.channel) {
      this.channel.postMessage(payload);
    }
    this.onStatusCallbacks.forEach((cb) => cb(status));
    this.onAllCamerasCallbacks.forEach((cb) => cb(this.camerasState as Record<CameraSlot, CameraStatusBroadcast>));

    try {
      const summary = { ...status, currentFrame: status.currentFrame ? 'frame_avail' : undefined };
      localStorage.setItem(`HGUARD_STATUS_${status.cameraId}`, JSON.stringify(summary));
    } catch {
      // quota safeguard
    }
  }

  public broadcastSecurityEvent(event: SecurityEvent) {
    const payload = { type: 'NEW_EVENT', payload: event };
    if (this.channel) {
      this.channel.postMessage(payload);
    }
  }

  public sendRemoteCommand(command: string, targetCameraId: CameraSlot | 'all' = 'all', payloadData?: unknown) {
    const payload = { type: 'REMOTE_COMMAND', payload: { command, targetCameraId, payload: payloadData } };
    if (this.channel) {
      this.channel.postMessage(payload);
    }
  }

  public onCameraStatus(cb: (status: CameraStatusBroadcast) => void): () => void {
    this.onStatusCallbacks.push(cb);
    return () => {
      this.onStatusCallbacks = this.onStatusCallbacks.filter((c) => c !== cb);
    };
  }

  public onAllCameras(cb: (cameraMap: Record<CameraSlot, CameraStatusBroadcast>) => void): () => void {
    this.onAllCamerasCallbacks.push(cb);
    // immediately call with current known states
    cb(this.camerasState as Record<CameraSlot, CameraStatusBroadcast>);
    return () => {
      this.onAllCamerasCallbacks = this.onAllCamerasCallbacks.filter((c) => c !== cb);
    };
  }

  public onSecurityEvent(cb: (event: SecurityEvent) => void): () => void {
    this.onEventCallbacks.push(cb);
    return () => {
      this.onEventCallbacks = this.onEventCallbacks.filter((c) => c !== cb);
    };
  }

  public onRemoteCommand(cb: (cmd: { command: string; targetCameraId?: CameraSlot | 'all'; payload?: unknown }) => void): () => void {
    this.onCommandCallbacks.push(cb);
    return () => {
      this.onCommandCallbacks = this.onCommandCallbacks.filter((c) => c !== cb);
    };
  }
}

export const globalStreamChannel = new StreamChannel();

