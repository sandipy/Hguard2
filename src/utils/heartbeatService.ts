import { CameraSlot, CameraHeartbeatInfo, SecurityEvent } from '../types';
import { globalStreamChannel } from './streamChannel';
import { playOfflineWarningTone, speakSeniorVoice } from './soundAlerts';

export const HEARTBEAT_OFFLINE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes threshold
export const HEARTBEAT_WARNING_TIMEOUT_MS = 60 * 1000; // 1 minute warning threshold
export const HEARTBEAT_CHECK_INTERVAL_MS = 2500;

const DEFAULT_CAMERA_NAMES: Record<CameraSlot, string> = {
  cam1: 'Front Door',
  cam2: 'Living Room',
  cam3: 'Senior Bedroom',
  cam4: 'Kitchen',
  cam5: 'Backyard',
  cam6: 'Garage',
};

class HeartbeatService {
  private cameraHeartbeats: Map<CameraSlot, {
    cameraId: CameraSlot;
    cameraName: string;
    lastSeen: number;
    status: 'online' | 'warning' | 'offline';
    isOfflineEventLogged: boolean;
    offlineSince: number | null;
  }> = new Map();
  private checkTimer: number | null = null;
  private onHeartbeatUpdateCallbacks: ((states: Record<CameraSlot, CameraHeartbeatInfo>) => void)[] = [];

  constructor() {
    this.initDefaultSlots();
    if (typeof window !== 'undefined') {
      this.initStreamListeners();
      this.startChecker();
    }
  }

  private initDefaultSlots() {
    (Object.keys(DEFAULT_CAMERA_NAMES) as CameraSlot[]).forEach((slot) => {
      this.cameraHeartbeats.set(slot, {
        cameraId: slot,
        cameraName: DEFAULT_CAMERA_NAMES[slot],
        lastSeen: slot === 'cam1' ? Date.now() : Date.now() - 25000,
        status: 'online',
        isOfflineEventLogged: false,
        offlineSince: null,
      });
    });
  }

  private initStreamListeners() {
    globalStreamChannel.onCameraStatus((status) => {
      if (status && status.cameraId) {
        this.recordCameraActivity(status.cameraId, status.cameraName, status.timestamp || Date.now());
      }
    });
  }

  public recordHeartbeat(cameraId: CameraSlot, cameraName?: string, timestamp: number = Date.now()) {
    return this.recordCameraActivity(cameraId, cameraName, timestamp);
  }

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
      };
      this.cameraHeartbeats.set(cameraId, entry);
    } else {
      entry.lastSeen = timestamp;
      entry.cameraName = resolvedName;
      entry.status = 'online';
      entry.isOfflineEventLogged = false;
      entry.offlineSince = null;
    }
    this.notifyHeartbeatUpdates();
  }

  public checkHeartbeats() {
    const now = Date.now();
    this.cameraHeartbeats.forEach((entry) => {
      const elapsedMs = now - entry.lastSeen;
      if (elapsedMs >= HEARTBEAT_OFFLINE_TIMEOUT_MS) {
        if (!entry.isOfflineEventLogged) {
          entry.status = 'offline';
          entry.isOfflineEventLogged = true;
          entry.offlineSince = entry.offlineSince || (entry.lastSeen + HEARTBEAT_OFFLINE_TIMEOUT_MS);
          playOfflineWarningTone();
          speakSeniorVoice(`Attention: Camera ${entry.cameraName} is offline. No data received for more than 5 minutes.`);
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

  public onHeartbeatUpdate(cb: (states: Record<CameraSlot, CameraHeartbeatInfo>) => void): () => void {
    this.onHeartbeatUpdateCallbacks.push(cb);
    cb(this.getAllHeartbeatInfos());
    return () => {
      this.onHeartbeatUpdateCallbacks = this.onHeartbeatUpdateCallbacks.filter((c) => c !== cb);
    };
  }

  public simulateTimeout(cameraId: CameraSlot) {
    const entry = this.cameraHeartbeats.get(cameraId);
    if (entry) {
      entry.isOfflineEventLogged = false;
      entry.lastSeen = Date.now() - (5 * 60 * 1000 + 15000);
      this.checkHeartbeats();
    }
  }

  public simulateRecovery(cameraId: CameraSlot) {
    this.recordCameraActivity(cameraId, undefined, Date.now());
  }
}

export const globalHeartbeatService = new HeartbeatService();
