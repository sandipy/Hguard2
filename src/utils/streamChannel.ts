import mqtt, { MqttClient } from 'mqtt';
import { CameraSlot, CameraStatusBroadcast, SecurityEvent } from '../types';

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
    // 1. Setup local browser BroadcastChannel for same-device instant tabs
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

    // 2. Fallback to localStorage events across local tabs
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

      // Restore saved user identity if present
      try {
        const savedUser = localStorage.getItem('HGUARD_USER_PROFILE_V2');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.email) {
            this.currentEmail = parsed.email;
          }
        }
      } catch {
        // ignore
      }
    }

    // 3. Connect to MQTT cloud broker
    this.recalculateRoomKey();
    this.connectMqtt();
  }

  private recalculateRoomKey(): void {
    const raw = (this.currentEmail || 'universal').toLowerCase().trim();
    // Simple fast safe alphanumeric room slug
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

    // Re-connect to new scoped room
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

    const brokers = [
      'wss://broker.emqx.io:8084/mqtt',
      'wss://broker.hivemq.com:8884/mqtt',
    ];
    let brokerIndex = 0;

    const tryConnect = (url: string) => {
      this.currentBroker = url;
      try {
        const connectFn = (mqtt as unknown as { connect?: typeof mqtt.connect }).connect || mqtt.connect;
        const client = connectFn(url, {
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

          // Subscribe to all topics for this user's email room
          const topics = [
            `hguard/v2/${this.roomKey}/status/#`,
            `hguard/v2/${this.roomKey}/commands`,
            `hguard/v2/${this.roomKey}/events`,
            `hguard/v2/${this.roomKey}/audio`,
          ];

          client.subscribe(topics, { qos: 0 }, (err) => {
            if (err) {
              console.warn('MQTT subscription notice:', err);
            }
          });
        });

        client.on('message', (topic: string, message: Uint8Array) => {
          try {
            const rawStr = new TextDecoder().decode(message);
            const data = JSON.parse(rawStr);

            // Filter out self-published echoes
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

        client.on('error', (err: Error) => {
          console.warn('MQTT Connection notice:', err.message);
          this.isConnectedToMqtt = false;
          this.notifyConnectionChange();
          // Fallback to secondary broker if primary fails
          if (brokerIndex === 0) {
            brokerIndex = 1;
            setTimeout(() => tryConnect(brokers[1]), 1000);
          }
        });

        client.on('close', () => {
          this.isConnectedToMqtt = false;
          this.notifyConnectionChange();
        });

        client.on('reconnect', () => {
          this.notifyConnectionChange();
        });
      } catch (err) {
        console.warn('Failed to initialize MQTT client:', err);
        if (brokerIndex === 0) {
          brokerIndex = 1;
          setTimeout(() => tryConnect(brokers[1]), 1000);
        }
      }
    };

    tryConnect(brokers[0]);
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
    }
  }

  public broadcastCameraStatus(status: CameraStatusBroadcast) {
    this.camerasState[status.cameraId] = status;
    const localPayload = { type: 'CAMERA_STATUS', payload: status };

    // 1. Post to local same-browser tabs
    if (this.channel) {
      try {
        this.channel.postMessage(localPayload);
      } catch {
        // ignore
      }
    }
    this.onStatusCallbacks.forEach((cb) => cb(status));
    this.onAllCamerasCallbacks.forEach((cb) => cb(this.camerasState as Record<CameraSlot, CameraStatusBroadcast>));

    // 2. Publish to internet MQTT topic for viewer phones on same email
    if (this.mqttClient && this.isConnectedToMqtt) {
      const now = Date.now();
      const lastTime = this.lastMqttPublishTime[status.cameraId] || 0;
      // Throttle MQTT frames to ~700ms to preserve network bandwidth while keeping responsive live video
      if (now - lastTime >= 700) {
        this.lastMqttPublishTime[status.cameraId] = now;
        const topic = `hguard/v2/${this.roomKey}/status/${status.cameraId}`;
        const mqttPayload = JSON.stringify({
          ...status,
          senderId: this.clientId,
          publishedAt: now,
        });
        try {
          this.mqttClient.publish(topic, mqttPayload, { qos: 0 });
        } catch (e) {
          console.warn('MQTT publish error:', e);
        }
      }
    }

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
      try {
        this.channel.postMessage(payload);
      } catch {
        // ignore
      }
    }

    if (this.mqttClient && this.isConnectedToMqtt) {
      const topic = `hguard/v2/${this.roomKey}/events`;
      try {
        this.mqttClient.publish(topic, JSON.stringify({ ...event, senderId: this.clientId }), { qos: 0 });
      } catch (e) {
        console.warn('MQTT event publish error:', e);
      }
    }
  }

  public sendRemoteCommand(command: string, targetCameraId: CameraSlot | 'all' = 'all', payloadData?: unknown) {
    const cmdPayload = { command, targetCameraId, payload: payloadData, senderId: this.clientId, timestamp: Date.now() };
    const localPayload = { type: 'REMOTE_COMMAND', payload: cmdPayload };

    if (this.channel) {
      try {
        this.channel.postMessage(localPayload);
      } catch {
        // ignore
      }
    }

    if (this.mqttClient && this.isConnectedToMqtt) {
      const topic = `hguard/v2/${this.roomKey}/commands`;
      try {
        this.mqttClient.publish(topic, JSON.stringify(cmdPayload), { qos: 0 });
      } catch (e) {
        console.warn('MQTT command publish error:', e);
      }
    }
  }

  public sendVoiceAudio(audioBase64: string, targetCameraId: CameraSlot | 'all' = 'all', text?: string) {
    const audioPayload = { audioBase64, text, targetCameraId, senderId: this.clientId, timestamp: Date.now() };
    if (this.mqttClient && this.isConnectedToMqtt) {
      const topic = `hguard/v2/${this.roomKey}/audio`;
      try {
        this.mqttClient.publish(topic, JSON.stringify(audioPayload), { qos: 0 });
      } catch (e) {
        console.warn('MQTT audio publish error:', e);
      }
    }
    // Also trigger locally
    this.sendRemoteCommand('WALKIE_TALKIE_VOICE', targetCameraId, audioPayload);
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

  public onConnectionChange(cb: (state: StreamConnectionState) => void): () => void {
    this.onConnectionCallbacks.push(cb);
    // immediately call with current state
    cb({
      connected: this.isConnectedToMqtt,
      broker: this.currentBroker,
      roomKey: this.roomKey,
      devicesOnline: Object.keys(this.camerasState).length + 1,
      lastSyncTimestamp: this.lastSyncTimestamp,
    });
    return () => {
      this.onConnectionCallbacks = this.onConnectionCallbacks.filter((c) => c !== cb);
    };
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

  public getRoomKey(): string {
    return this.roomKey;
  }
}

export const globalStreamChannel = new StreamChannel();
