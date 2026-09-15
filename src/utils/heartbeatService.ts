import { CameraSlot, CameraHeartbeatInfo, SecurityEvent } from '../types';
import { globalStreamChannel } from './streamChannel';
import { playOfflineWarningTone, speakSeniorVoice } from './soundAlerts';

export const HEARTBEAT_OFFLINE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes threshold
export const HEARTBEAT_WARNING_TIMEOUT_MS = 60 * 1000; // 1 minute warning threshold
export const HEARTBEAT_CHECK_INTERVAL_MS = 2500; // Check every 2.5 seconds

export interface HeartbeatOfflineAlert {
  id: string;
  cameraId: CameraSlot;
  cameraName: string;
  offlineSince: number;
  minutesSilent: number;
  message: string;
  acknowledged: boolean;
}

const DEFAULT_CAMERA_NAMES: Record<CameraSlot, string> = {
  cam1: 'Living Room Camera',
  cam2: 'Master Bedroom Camera',
  cam3: 'Front Entrance Camera',
  cam4: 'Kitchen / Dining Camera',
  cam5: 'Hallway / Stairs Camera',
  cam6: 'Backyard / Patio Camera',
};

class HeartbeatService {
  private cameraHeartbeats: Map<CameraSlot, {
    cameraId: CameraSlot;
    cameraName: string;
    lastSeen: number;
    status: 'online' | 'warning' | 'offline';
    isOfflineEventLogged: boolean;
    offlineSince: number | null;
    isRegistered: boolean;
  }> = new Map();

  private checkTimer: number | null = null;
  private onHeartbeatUpdateCallbacks: ((states: Record<CameraSlot, CameraHeartbeatInfo>) => void)[] = [];
  private onOfflineEventCallbacks: ((event: SecurityEvent) => void)[] = [];
  private onOfflineAlertToastCallbacks: ((alert: HeartbeatOfflineAlert) => void)[] = [];
  private customTimeoutMs: number | null = null;
  private voiceAnnouncementsEnabled: boolean = true;
  private isInitialized: boolean = false;

  constructor() {
    this.initDefaultSlots();
    if (typeof window !== 'undefined') {
      this.initStreamListeners();
      this.startChecker();
    }
  }

  private initDefaultSlots() {
    (Object.keys(DEFAULT_CAMERA_NAMES) as CameraSlot[]).forEach((slot) => {
      // By default cam1 is active or whatever camera slot was used on this device
      const isSavedCam = typeof localStorage !== 'undefined' && localStorage.getItem('HGUARD_CAM_SLOT') === slot;
      const initialLastSeen = isSavedCam ? Date.now() : Date.now() - 30000; // slightly offset for demo
      this.cameraHeartbeats.set(slot, {
        cameraId: slot,
        cameraName: DEFAULT_CAMERA_NAMES[slot],
        lastSeen: initialLastSeen,
        status: 'online',
        isOfflineEventLogged: false,
        offlineSince: null,
        isRegistered: slot === 'cam1' || isSavedCam,
      });
    });
  }

  private initStreamListeners() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Listen to camera broadcasts from stream channel
    globalStreamChannel.onCameraStatus((status) => {
      if (status && status.cameraId) {
        this.recordCameraActivity(status.cameraId, status.cameraName, status.timestamp || Date.now());
      }
    });

    // Listen to remote commands or heartbeat pings
    globalStreamChannel.onRemoteCommand((cmd) => {
      if (cmd.command === 'HEARTBEAT_PING' && cmd.targetCameraId && cmd.targetCameraId !== 'all') {
        const payload = cmd.payload as { cameraName?: string; timestamp?: number } | undefined;
        this.recordCameraActivity(
          cmd.targetCameraId as CameraSlot,
          payload?.cameraName,
          payload?.timestamp || Date.now()
        );
      }
    });
  }

  public setVoiceAnnouncementsEnabled(enabled: boolean) {
    this.voiceAnnouncementsEnabled = enabled;
  }

  /**
   * Set custom timeout in milliseconds for testing/demo (null to revert to standard 5 min)
   */
  public setCustomTimeoutMs(ms: number | null) {
    this.customTimeoutMs = ms;
    this.checkHeartbeats();
  }

  public getEffectiveTimeoutMs(): number {
    return this.customTimeoutMs || HEARTBEAT_OFFLINE_TIMEOUT_MS;
  }

  /**
   * Records active data transmission from a camera device
   */
  public recordCameraActivity(cameraId: CameraSlot, cameraName?: string, timestamp: number = Date.now()) {
    let entry = this.cameraHeartbeats.get(cameraId);
    const resolvedName = cameraName || entry?.cameraName || DEFAULT_CAMERA_NAMES[cameraId];

    if (!entry) {
      entry = {
        cameraId,
        cameraName: resolvedName,
        lastSeen: timestamp,
        status: 'online',
        isOfflineEventLogged: false,
        offlineSince: null,
        isRegistered: true,
      };
      this.cameraHeartbeats.set(cameraId, entry);
    } else {
      const wasOffline = entry.status === 'offline' || entry.isOfflineEventLogged;
      entry.lastSeen = timestamp;
      entry.cameraName = resolvedName;
      entry.status = 'online';
      entry.isRegistered = true;

      // If camera was offline, mark recovered and notify
      if (wasOffline) {
        entry.isOfflineEventLogged = false;
        entry.offlineSince = null;

        const recoveryEvt: SecurityEvent = {
          id: `evt_online_${cameraId}_${Date.now()}`,
          cameraId,
          cameraName: resolvedName,
          timestamp: Date.now(),
          motionIntensity: 0,
          eventType: 'alert_cleared',
          snapshotEncrypted: '',
          iv: '',
          thermalState: 'normal',
          batteryLevel: 80,
          notes: `HEARTBEAT RESTORED: Camera ${resolvedName} (${cameraId.toUpperCase()}) resumed data transmission. Device is online and streaming.`,
          aiSummary: `Camera Online: ${resolvedName} reconnected.`,
        };

        this.notifyOfflineEvent(recoveryEvt);
        if (this.voiceAnnouncementsEnabled) {
          speakSeniorVoice(`Camera ${resolvedName} is back online.`);
        }
      }
    }

    this.notifyHeartbeatUpdates();
  }

  /**
   * Run the periodic heartbeat evaluation loop
   */
  public checkHeartbeats() {
    const now = Date.now();
    const timeoutMs = this.getEffectiveTimeoutMs();

    this.cameraHeartbeats.forEach((entry) => {
      // Only monitor registered cameras or cameras that have communicated
      if (!entry.isRegistered) return;

      const elapsedMs = now - entry.lastSeen;

      if (elapsedMs >= timeoutMs) {
        // Camera has failed to transmit data for more than 5 minutes!
        if (!entry.isOfflineEventLogged) {
          entry.status = 'offline';
          entry.isOfflineEventLogged = true;
          entry.offlineSince = entry.offlineSince || (entry.lastSeen + timeoutMs);

          const minutesSilent = Math.max(5, Math.floor(elapsedMs / 60000));
          const lastContactStr = new Date(entry.lastSeen).toLocaleTimeString();

          // Create the official Offline Security Event
          const offlineEvent: SecurityEvent = {
            id: `evt_offline_${entry.cameraId}_${Date.now()}`,
            cameraId: entry.cameraId,
            cameraName: entry.cameraName,
            timestamp: now,
            motionIntensity: 100, // High priority indicator
            eventType: 'offline',
            snapshotEncrypted: '',
            iv: '',
            thermalState: 'warm',
            batteryLevel: 0,
            notes: `NETWORK HEARTBEAT TIMEOUT: Camera device failed to transmit any data for ${minutesSilent} minutes (silent since ${lastContactStr}). The camera may be missing, disconnected from Wi-Fi, out of battery, or powered off.`,
            aiSummary: `OFFLINE ALERT: ${entry.cameraName} silent for >5 minutes.`,
          };

          // 1. Dispatch security event to all local logs & viewers
          this.notifyOfflineEvent(offlineEvent);
          globalStreamChannel.broadcastSecurityEvent(offlineEvent);

          // 2. Play audible warning tone
          playOfflineWarningTone();

          // 3. Spoken voice announcement
          if (this.voiceAnnouncementsEnabled) {
            speakSeniorVoice(
              `Attention! ${entry.cameraName} is offline. No data received for more than 5 minutes. Please check the camera device.`
            );
          }

          // 4. Trigger banner / toast notification for UI
          const toastAlert: HeartbeatOfflineAlert = {
            id: offlineEvent.id,
            cameraId: entry.cameraId,
            cameraName: entry.cameraName,
            offlineSince: entry.offlineSince,
            minutesSilent,
            message: `Camera "${entry.cameraName}" has gone missing! No heartbeat received for >5 min.`,
            acknowledged: false,
          };
          this.notifyOfflineAlertToast(toastAlert);
        }
      } else if (elapsedMs >= HEARTBEAT_WARNING_TIMEOUT_MS) {
        entry.status = 'warning';
      } else {
        entry.status = 'online';
      }
    });

    this.notifyHeartbeatUpdates();
  }

  private startChecker() {
    if (this.checkTimer !== null) return;
    this.checkTimer = window.setInterval(() => {
      this.checkHeartbeats();
    }, HEARTBEAT_CHECK_INTERVAL_MS);
  }

  public stopChecker() {
    if (this.checkTimer !== null) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  private notifyHeartbeatUpdates() {
    const states = this.getAllHeartbeatInfos();
    this.onHeartbeatUpdateCallbacks.forEach((cb) => {
      try {
        cb(states);
      } catch (e) {
        console.error('Heartbeat update callback error:', e);
      }
    });
  }

  private notifyOfflineEvent(event: SecurityEvent) {
    this.onOfflineEventCallbacks.forEach((cb) => {
      try {
        cb(event);
      } catch (e) {
        console.error('Offline event callback error:', e);
      }
    });
  }

  private notifyOfflineAlertToast(alert: HeartbeatOfflineAlert) {
    this.onOfflineAlertToastCallbacks.forEach((cb) => {
      try {
        cb(alert);
      } catch (e) {
        console.error('Offline toast callback error:', e);
      }
    });
  }

  public getAllHeartbeatInfos(): Record<CameraSlot, CameraHeartbeatInfo> {
    const now = Date.now();
    const result: Partial<Record<CameraSlot, CameraHeartbeatInfo>> = {};

    this.cameraHeartbeats.forEach((entry, slot) => {
      const elapsed = Math.max(0, Math.floor((now - entry.lastSeen) / 1000));
      result[slot] = {
        cameraId: slot,
        cameraName: entry.cameraName,
        lastSeen: entry.lastSeen,
        secondsSinceLastSeen: elapsed,
        status: entry.status,
        isOfflineEventLogged: entry.isOfflineEventLogged,
        offlineSince: entry.offlineSince,
      };
    });

    return result as Record<CameraSlot, CameraHeartbeatInfo>;
  }

  public getHeartbeatInfo(slot: CameraSlot): CameraHeartbeatInfo {
    const all = this.getAllHeartbeatInfos();
    return all[slot] || {
      cameraId: slot,
      cameraName: DEFAULT_CAMERA_NAMES[slot],
      lastSeen: Date.now(),
      secondsSinceLastSeen: 0,
      status: 'online',
      isOfflineEventLogged: false,
    };
  }

  /**
   * Subscribe to real-time heartbeat states
   */
  public onHeartbeatUpdate(cb: (states: Record<CameraSlot, CameraHeartbeatInfo>) => void): () => void {
    this.onHeartbeatUpdateCallbacks.push(cb);
    cb(this.getAllHeartbeatInfos());
    return () => {
      this.onHeartbeatUpdateCallbacks = this.onHeartbeatUpdateCallbacks.filter((c) => c !== cb);
    };
  }

  /**
   * Subscribe to logged offline/recovery security events
   */
  public onOfflineEvent(cb: (event: SecurityEvent) => void): () => void {
    this.onOfflineEventCallbacks.push(cb);
    return () => {
      this.onOfflineEventCallbacks = this.onOfflineEventCallbacks.filter((c) => c !== cb);
    };
  }

  /**
   * Subscribe to high-visibility toast alerts
   */
  public onOfflineAlertToast(cb: (alert: HeartbeatOfflineAlert) => void): () => void {
    this.onOfflineAlertToastCallbacks.push(cb);
    return () => {
      this.onOfflineAlertToastCallbacks = this.onOfflineAlertToastCallbacks.filter((c) => c !== cb);
    };
  }

  /**
   * Instant simulation for user / tester:
   * Sets lastSeen to 5 minutes 15 seconds ago and triggers check immediately
   */
  public simulateTimeout(cameraId: CameraSlot) {
    const entry = this.cameraHeartbeats.get(cameraId);
    if (entry) {
      entry.isRegistered = true;
      entry.isOfflineEventLogged = false; // Reset so event fires freshly
      entry.lastSeen = Date.now() - (5 * 60 * 1000 + 15000); // 5m 15s ago
      this.checkHeartbeats();
    }
  }

  /**
   * Simulate camera recovering and transmitting fresh data
   */
  public simulateRecovery(cameraId: CameraSlot) {
    this.recordCameraActivity(cameraId, undefined, Date.now());
  }
}

export const globalHeartbeatService = new HeartbeatService();
