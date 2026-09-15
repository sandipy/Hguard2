import mqtt, { MqttClient } from 'mqtt';
import { CameraSlot, CameraStatusBroadcast, SecurityEvent, VideoFramePacket } from '../types';

export interface StreamConnectionState {
  connected: boolean;
  broker: string;
  roomKey: string;
  devicesOnline: number;
  lastSyncTimestamp: number;
}

export class StreamChannel {
  private static channelName = 'HGUARD_SURVEILLANCE_CHANNEL_V2';
  private channel: BroadcastChannel | null = null;
  private onStatusCallbacks: ((status: CameraStatusBroadcast) => void)[] = [];
  private onAllCamerasCallbacks: ((cameraMap: Record<CameraSlot, CameraStatusBroadcast>) => void)[] = [];
  private onEventCallbacks: ((event: SecurityEvent) => void)[] = [];
  private onCommandCallbacks: ((cmd: { command: string; targetCameraId?: CameraSlot | 'all'; payload?: unknown }) => void)[] = [];
  private onConnectionCallbacks: ((state: StreamConnectionState) => void)[] = [];
  private onVideoFrameCallbacks: ((packet: VideoFramePacket) => void)[] = [];
  private camerasState: Partial<Record<CameraSlot, CameraStatusBroadcast>> = {};
  private mqttClient: MqttClient | null = null;
  private clientId: string = `hg_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  private currentEmail: string = '';
  private currentPin: string = '8888';
  private roomKey: string = 'hguard_universal_default';
  private isConnectedToMqtt: boolean = false;
  private currentBroker: string = 'wss://broker.emqx.io:8084/mqtt';
  private lastMqttPublishTime: Record<string, number> = {};
  private lastSyncTimestamp: number = Date.now();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(StreamChannel.channelName);
        this.channel.onmessage = (msg) => {
          this.handleMessage(msg.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not available:', e);
      }
    }

    if (typeof window !== 'undefined') {
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

    this.recalculateRoomKey();
    this.connectMqtt();
  }

  private recalculateRoomKey(): void {
    const raw = (this.currentEmail || 'universal').toLowerCase().trim();
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    const cleanPrefix = raw.replace(/[^a-z0-9]/g, '_').substring(0, 20);
    this.roomKey = `hg_${cleanPrefix || 'user'}_${Math.abs(hash)}`;
  }

  public setIdentity(email: string, pin: string = '8888'): void {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPin = (pin || '8888').trim();
    if (cleanEmail === this.currentEmail && cleanPin === this.currentPin) {
      return;
    }
    this.currentEmail = cleanEmail;
    this.currentPin = cleanPin;
    this.recalculateRoomKey();
    this.connectMqtt();
  }

  private connectMqtt(): void {
    if (typeof window === 'undefined') return;
    if (this.mqttClient) {
      try {
        this.mqttClient.end(true);
      } catch {
        // ignore
      }
      this.mqttClient = null;
    }

    try {
      const connectFn = (mqtt as unknown as { connect?: typeof mqtt.connect }).connect || mqtt.connect;
      const client = connectFn(this.currentBroker, {
        clientId: this.clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 3000,
        keepalive: 30,
      });
      this.mqttClient = client;

      client.on('connect', () => {
        this.isConnectedToMqtt = true;
        this.lastSyncTimestamp = Date.now();
        this.notifyConnectionChange();

        const topics = [
          `hguard/v2/${this.roomKey}/status/#`,
          `hguard/v2/${this.roomKey}/commands`,
          `hguard/v2/${this.roomKey}/events`,
          `hguard/v2/${this.roomKey}/audio`,
        ];
        client.subscribe(topics, { qos: 0 });
      });

      client.on('message', (topic: string, message: Uint8Array) => {
        try {
          const rawStr = new TextDecoder().decode(message);
          const data = JSON.parse(rawStr);
          if (data.senderId === this.clientId) {
            return;
          }
          this.lastSyncTimestamp = Date.now();
          if (topic.includes('/status/')) {
            this.handleRemoteCameraStatus(data);
          } else if (topic.endsWith('/commands')) {
            this.handleRemoteCommand(data);
          } else if (topic.endsWith('/events')) {
            this.handleRemoteEvent(data);
          } else if (topic.endsWith('/audio')) {
            this.handleRemoteAudio(data);
          }
        } catch (e) {
          console.warn('Failed to parse MQTT message:', e);
        }
      });

      client.on('error', () => {
        this.isConnectedToMqtt = false;
        this.notifyConnectionChange();
      });

      client.on('close', () => {
        this.isConnectedToMqtt = false;
        this.notifyConnectionChange();
      });
    } catch (err) {
      console.warn('Failed to initialize MQTT client:', err);
    }
  }

  private notifyConnectionChange(): void {
    const state: StreamConnectionState = {
      connected: this.isConnectedToMqtt,
      broker: this.currentBroker,
      roomKey: this.roomKey,
      devicesOnline: Object.keys(this.camerasState).length + 1,
      lastSyncTimestamp: this.lastSyncTimestamp,
    };
    this.onConnectionCallbacks.forEach((cb) => cb(state));
  }

  private handleRemoteCameraStatus(status: CameraStatusBroadcast & { senderId?: string }): void {
    if (!status || !status.cameraId) return;
    this.camerasState[status.cameraId] = status;
    this.onStatusCallbacks.forEach((cb) => cb(status));
    this.onAllCamerasCallbacks.forEach((cb) => cb(this.camerasState as Record<CameraSlot, CameraStatusBroadcast>));
  }

  private handleRemoteCommand(data: { command: string; targetCameraId?: CameraSlot | 'all'; payload?: unknown }): void {
    if (!data || !data.command) return;
    this.onCommandCallbacks.forEach((cb) => cb(data));
  }

  private handleRemoteEvent(event: SecurityEvent): void {
    if (!event || !event.id) return;
    this.onEventCallbacks.forEach((cb) => cb(event));
  }

  private handleRemoteAudio(data: { audioBase64?: string; text?: string; targetCameraId?: CameraSlot | 'all' }): void {
    if (!data) return;
    this.onCommandCallbacks.forEach((cb) => cb({
      command: 'WALKIE_TALKIE_VOICE',
      targetCameraId: data.targetCameraId || 'all',
      payload: data,
    }));
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
    } else if (data.type === 'VIDEO_FRAME') {
      this.onVideoFrameCallbacks.forEach((cb) => cb(data.payload as VideoFramePacket));
    }
  }

  public publishVideoFrame(packet: VideoFramePacket) {
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'VIDEO_FRAME', payload: packet });
      } catch {
        // ignore
      }
    }
    this.onVideoFrameCallbacks.forEach((cb) => cb(packet));

    // Also broadcast over MQTT (throttled)
    if (this.mqttClient && this.isConnectedToMqtt) {
      const now = Date.now();
      const last = this.lastMqttPublishTime[packet.cameraId] || 0;
      if (now - last > 600) {
        this.lastMqttPublishTime[packet.cameraId] = now;
        const topic = `hguard/v2/${this.roomKey}/status/${packet.cameraId}`;
        try {
          this.mqttClient.publish(
            topic,
            JSON.stringify({
              cameraId: packet.cameraId,
              cameraName: packet.cameraName,
              timestamp: packet.timestamp,
              isOnline: true,
              motionScore: packet.motionScore,
              thermalState: packet.thermalState,
              batteryLevel: packet.batteryLevel,
              isNightVision: packet.isNightVision,
              currentFrame: packet.frameDataUrl,
              senderId: this.clientId,
            }),
            { qos: 0 }
          );
        } catch {
          // ignore
        }
      }
    }
  }

  public sendCameraCommand(cmd: { command: string; targetCameraId?: CameraSlot | 'all'; timestamp?: number; payload?: unknown }) {
    const cmdPayload = {
      command: cmd.command,
      targetCameraId: cmd.targetCameraId || 'all',
      payload: cmd.payload,
      senderId: this.clientId,
      timestamp: cmd.timestamp || Date.now(),
    };
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'REMOTE_COMMAND', payload: cmdPayload });
      } catch {
        // ignore
      }
    }
    if (this.mqttClient && this.isConnectedToMqtt) {
      const topic = `hguard/v2/${this.roomKey}/commands`;
      try {
        this.mqttClient.publish(topic, JSON.stringify(cmdPayload), { qos: 0 });
      } catch {
        // ignore
      }
    }
  }

  public publishIntercomAudio(data: { senderStation: string; targetCameraId: CameraSlot | 'all'; audioText: string; timestamp: number }) {
    return this.sendCameraCommand({
      command: 'WALKIE_TALKIE_VOICE',
      targetCameraId: data.targetCameraId,
      payload: { text: data.audioText },
    });
  }

  public onVideoFrame(cb: (packet: VideoFramePacket) => void): () => void {
    this.onVideoFrameCallbacks.push(cb);
    return () => {
      this.onVideoFrameCallbacks = this.onVideoFrameCallbacks.filter((c) => c !== cb);
    };
  }

  public onRemoteCommand(cb: (cmd: { command: string; targetCameraId?: CameraSlot | 'all'; payload?: unknown }) => void): () => void {
    this.onCommandCallbacks.push(cb);
    return () => {
      this.onCommandCallbacks = this.onCommandCallbacks.filter((c) => c !== cb);
    };
  }

  public onCameraStatus(cb: (status: CameraStatusBroadcast) => void): () => void {
    this.onStatusCallbacks.push(cb);
    return () => {
      this.onStatusCallbacks = this.onStatusCallbacks.filter((c) => c !== cb);
    };
  }

  public onSecurityEvent(cb: (event: SecurityEvent) => void): () => void {
    this.onEventCallbacks.push(cb);
    return () => {
      this.onEventCallbacks = this.onEventCallbacks.filter((c) => c !== cb);
    };
  }
}

export const globalStreamChannel = new StreamChannel();
