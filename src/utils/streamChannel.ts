import mqtt, { MqttClient } from 'mqtt';
import { CameraSlot, CameraStatusBroadcast, SecurityEvent, VideoFramePacket } from '../types';

export interface StreamConnectionState {
  connected: boolean;
  broker: string;
  roomKey: string;
  devicesOnline: number;
  lastSyncTimestamp: number;
}

const BROKER_POOL = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
];

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
  private currentHouseholdRoom: string = '';
  private currentEmail: string = '';
  private currentPin: string = '8888';
  private roomKey: string = 'hg_household_default';
  private isConnectedToMqtt: boolean = false;
  private brokerIndex: number = 0;
  private lastMqttPublishTime: Record<string, number> = {};
  private lastSyncTimestamp: number = Date.now();
  private reconnectTimer: number | null = null;

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

  private get currentBroker(): string {
    return BROKER_POOL[this.brokerIndex % BROKER_POOL.length];
  }

  private recalculateRoomKey(): void {
    if (this.currentHouseholdRoom && this.currentHouseholdRoom.trim().length > 0) {
      const cleanRoom = this.currentHouseholdRoom.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 32);
      this.roomKey = `hg_room_${cleanRoom}`;
      return;
    }

    const raw = `${this.currentEmail || 'universal'}_${this.currentPin || '8888'}`.toLowerCase().trim();
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    const cleanPrefix = (this.currentEmail || 'home').replace(/[^a-z0-9]/g, '_').substring(0, 15);
    this.roomKey = `hg_${cleanPrefix}_${Math.abs(hash)}`;
  }

  public setIdentity(roomOrHousehold: string, pin: string = '8888', email: string = ''): void {
    const cleanRoom = (roomOrHousehold || '').trim();
    const cleanPin = (pin || '8888').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (
      cleanRoom === this.currentHouseholdRoom &&
      cleanPin === this.currentPin &&
      cleanEmail === this.currentEmail
    ) {
      return;
    }

    this.currentHouseholdRoom = cleanRoom;
    this.currentPin = cleanPin;
    this.currentEmail = cleanEmail;
    this.recalculateRoomKey();
    this.connectMqtt();
  }

  public getRoomKey(): string {
    return this.roomKey;
  }

  public getConnectionState(): StreamConnectionState {
    return {
      connected: this.isConnectedToMqtt,
      broker: this.currentBroker,
      roomKey: this.roomKey,
      devicesOnline: Object.keys(this.camerasState).length + 1,
      lastSyncTimestamp: this.lastSyncTimestamp,
    };
  }

  private connectMqtt(): void {
    if (typeof window === 'undefined') return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.mqttClient) {
      try {
        this.mqttClient.end(true);
      } catch {
        // ignore
      }
      this.mqttClient = null;
    }

    try {
      const brokerUrl = this.currentBroker;
      const connectFn = (mqtt as unknown as { connect?: typeof mqtt.connect }).connect || mqtt.connect;
      const client = connectFn(brokerUrl, {
        clientId: this.clientId,
        clean: true,
        connectTimeout: 6000,
        reconnectPeriod: 4000,
        keepalive: 30,
      });
      this.mqttClient = client;

      client.on('connect', () => {
        this.isConnectedToMqtt = true;
        this.lastSyncTimestamp = Date.now();
        this.notifyConnectionChange();

        const topics = [
          `hguard/v2/${this.roomKey}/status/#`,
          `hguard/v2/${this.roomKey}/video/#`,
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
          if (topic.includes('/video/')) {
            this.handleRemoteVideoFrame(data);
          } else if (topic.includes('/status/')) {
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

      client.on('error', (err) => {
        console.warn(`MQTT error on ${brokerUrl}:`, err);
        this.isConnectedToMqtt = false;
        this.notifyConnectionChange();
        this.tryNextBroker();
      });

      client.on('close', () => {
        this.isConnectedToMqtt = false;
        this.notifyConnectionChange();
      });
    } catch (err) {
      console.warn('Failed to initialize MQTT client:', err);
      this.tryNextBroker();
    }
  }

  private tryNextBroker(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.brokerIndex = (this.brokerIndex + 1) % BROKER_POOL.length;
      console.info(`Switching MQTT broker to ${this.currentBroker}`);
      this.connectMqtt();
    }, 4000);
  }

  private notifyConnectionChange(): void {
    const state: StreamConnectionState = this.getConnectionState();
    this.onConnectionCallbacks.forEach((cb) => cb(state));
  }

  private handleRemoteVideoFrame(packet: VideoFramePacket & { currentFrame?: string }): void {
    if (!packet || !packet.cameraId) return;
    const frameData = packet.frameDataUrl || packet.currentFrame;
    if (!frameData) return;

    const normalizedPacket: VideoFramePacket = {
      cameraId: packet.cameraId,
      cameraName: packet.cameraName || `Camera ${packet.cameraId.slice(-1)}`,
      frameDataUrl: frameData,
      timestamp: packet.timestamp || Date.now(),
      motionScore: packet.motionScore || 0,
      thermalState: packet.thermalState || 'normal',
      batteryLevel: packet.batteryLevel ?? 85,
      isNightVision: !!packet.isNightVision,
      lightLevel: packet.lightLevel,
    };

    // Update internal camera status
    this.camerasState[packet.cameraId] = {
      cameraId: packet.cameraId,
      cameraName: normalizedPacket.cameraName,
      timestamp: normalizedPacket.timestamp,
      isOnline: true,
      battery: {
        level: normalizedPacket.batteryLevel,
        charging: true,
        supported: true,
      },
      batteryLevel: normalizedPacket.batteryLevel,
      thermal: normalizedPacket.thermalState,
      thermalState: normalizedPacket.thermalState,
      isNightVision: normalizedPacket.isNightVision,
      fps: 5,
      currentFrame: frameData,
      bandwidthMode: 'balanced',
      resolutionMode: '720p',
      motionDetected: normalizedPacket.motionScore > 20,
      motionScore: normalizedPacket.motionScore,
    };

    // Forward to video callbacks so Viewer instantly displays the camera image
    this.onVideoFrameCallbacks.forEach((cb) => cb(normalizedPacket));
    this.onStatusCallbacks.forEach((cb) => cb(this.camerasState[packet.cameraId]!));
  }

  private handleRemoteCameraStatus(status: CameraStatusBroadcast & { senderId?: string; currentFrame?: string }): void {
    if (!status || !status.cameraId) return;
    this.camerasState[status.cameraId] = status;
    this.onStatusCallbacks.forEach((cb) => cb(status));
    this.onAllCamerasCallbacks.forEach((cb) => cb(this.camerasState as Record<CameraSlot, CameraStatusBroadcast>));

    // CRITICAL: If frame data is included in status broadcast, forward to video callbacks!
    if (status.currentFrame) {
      const packet: VideoFramePacket = {
        cameraId: status.cameraId,
        cameraName: status.cameraName || `Camera ${status.cameraId.slice(-1)}`,
        frameDataUrl: status.currentFrame,
        timestamp: status.timestamp || Date.now(),
        motionScore: status.motionScore || 0,
        thermalState: status.thermalState || 'normal',
        batteryLevel: status.batteryLevel ?? 85,
        isNightVision: !!status.isNightVision,
      };
      this.onVideoFrameCallbacks.forEach((cb) => cb(packet));
    }
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

    // Also broadcast over MQTT (optimized throttle for smooth stream across devices)
    if (this.mqttClient && this.isConnectedToMqtt) {
      const now = Date.now();
      const last = this.lastMqttPublishTime[packet.cameraId] || 0;
      if (now - last > 350) {
        this.lastMqttPublishTime[packet.cameraId] = now;
        const videoTopic = `hguard/v2/${this.roomKey}/video/${packet.cameraId}`;
        const statusTopic = `hguard/v2/${this.roomKey}/status/${packet.cameraId}`;
        const payload = JSON.stringify({
          cameraId: packet.cameraId,
          cameraName: packet.cameraName,
          timestamp: packet.timestamp,
          isOnline: true,
          motionScore: packet.motionScore,
          thermalState: packet.thermalState,
          batteryLevel: packet.batteryLevel,
          isNightVision: packet.isNightVision,
          currentFrame: packet.frameDataUrl,
          frameDataUrl: packet.frameDataUrl,
          lightLevel: packet.lightLevel,
          senderId: this.clientId,
        });

        try {
          this.mqttClient.publish(videoTopic, payload, { qos: 0 });
          // Heartbeat status once every 3 seconds to keep bandwidth low
          if (now % 3000 < 400) {
            this.mqttClient.publish(statusTopic, payload, { qos: 0 });
          }
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

  public onConnectionChange(cb: (state: StreamConnectionState) => void): () => void {
    this.onConnectionCallbacks.push(cb);
    // immediately notify current state
    cb(this.getConnectionState());
    return () => {
      this.onConnectionCallbacks = this.onConnectionCallbacks.filter((c) => c !== cb);
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
