import { BatteryState } from '../types';

interface BatteryManagerPolyfill extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((this: BatteryManagerPolyfill, ev: Event) => void) | null;
  onlevelchange: ((this: BatteryManagerPolyfill, ev: Event) => void) | null;
}

export class BatteryService {
  private static instance: BatteryService;
  private batteryManager: BatteryManagerPolyfill | null = null;
  private state: BatteryState = {
    level: 75,
    charging: true,
    supported: false,
    unpluggedSince: null,
    unpluggedMinutes: 0,
    pluggedSince: null,
    pluggedHours: 0,
    deepDischargeReminderDue: false,
    lastDeepDischargeLoggedAt: null,
  };
  private listeners: ((state: BatteryState) => void)[] = [];
  private deepDischargeListeners: ((reminder: {
    hours: number;
    message: string;
    recommendation: string;
    timestamp: number;
  }) => void)[] = [];
  private lastAlerted80At: number = 0;
  private unpluggedSince: number | null = null;
  private pluggedSince: number | null = null;
  private lastDeepDischargeLoggedAt: number | null = null;
  private tickerInterval: NodeJS.Timeout | null = null;

  private constructor() {
    try {
      const storedUnplugged = localStorage.getItem('HGUARD_UNPLUGGED_SINCE');
      if (storedUnplugged) {
        this.unpluggedSince = parseInt(storedUnplugged, 10);
      }
      const storedPlugged = localStorage.getItem('HGUARD_PLUGGED_SINCE');
      if (storedPlugged) {
        this.pluggedSince = parseInt(storedPlugged, 10);
      }
      const storedLastLogged = localStorage.getItem('HGUARD_LAST_DEEP_DISCHARGE_LOGGED');
      if (storedLastLogged) {
        this.lastDeepDischargeLoggedAt = parseInt(storedLastLogged, 10);
      }
    } catch {
      // ignore
    }

    this.init();

    // Regular interval to update unplugged & plugged ticker
    this.tickerInterval = setInterval(() => {
      this.recalculateTimers();
    }, 10000);
  }

  public static getInstance(): BatteryService {
    if (!BatteryService.instance) {
      BatteryService.instance = new BatteryService();
    }
    return BatteryService.instance;
  }

  private recalculateTimers() {
    let stateChanged = false;

    // 1. Recalculate unplugged duration
    if (!this.state.charging && this.unpluggedSince) {
      const mins = Math.max(0, Math.floor((Date.now() - this.unpluggedSince) / 60000));
      if (mins !== this.state.unpluggedMinutes) {
        this.state.unpluggedMinutes = mins;
        this.state.unpluggedSince = this.unpluggedSince;
        stateChanged = true;
      }
    } else if (this.state.charging && this.state.unpluggedMinutes !== 0) {
      this.state.unpluggedMinutes = 0;
      this.state.unpluggedSince = null;
      stateChanged = true;
    }

    // 2. Recalculate plugged duration (72 hours deep discharge health check)
    if (this.state.charging) {
      if (!this.pluggedSince) {
        this.pluggedSince = Date.now();
        try {
          localStorage.setItem('HGUARD_PLUGGED_SINCE', String(this.pluggedSince));
        } catch {}
      }
      const hours = Math.max(0, Math.floor((Date.now() - this.pluggedSince) / 3600000));
      const isDue = hours >= 72;

      if (hours !== this.state.pluggedHours || isDue !== this.state.deepDischargeReminderDue) {
        this.state.pluggedSince = this.pluggedSince;
        this.state.pluggedHours = hours;
        this.state.deepDischargeReminderDue = isDue;
        stateChanged = true;
      }

      // Check if deep discharge reminder should be triggered to event log
      if (isDue) {
        const now = Date.now();
        if (!this.lastDeepDischargeLoggedAt || (now - this.lastDeepDischargeLoggedAt >= 24 * 3600 * 1000)) {
          this.lastDeepDischargeLoggedAt = now;
          try {
            localStorage.setItem('HGUARD_LAST_DEEP_DISCHARGE_LOGGED', String(now));
          } catch {}
          this.state.lastDeepDischargeLoggedAt = now;
          stateChanged = true;
          this.triggerDeepDischarge(hours);
        }
      }
    } else {
      if (this.state.pluggedHours !== 0 || this.state.deepDischargeReminderDue) {
        this.pluggedSince = null;
        try {
          localStorage.removeItem('HGUARD_PLUGGED_SINCE');
        } catch {}
        this.state.pluggedSince = null;
        this.state.pluggedHours = 0;
        this.state.deepDischargeReminderDue = false;
        stateChanged = true;
      }
    }

    if (stateChanged) {
      this.notify();
    }
  }

  private triggerDeepDischarge(hours: number) {
    const reminder = {
      hours,
      message: `Phone has been plugged in continuously for ${hours} hours (>72 hours).`,
      recommendation: 'Lithium-ion battery health recommendation: Perform a deep discharge cycle. Unplug the charger and allow the battery to drain down to 20–30% before recharging. This reduces cell oxidation, prevents pouch swelling, and recalibrates the battery gauge.',
      timestamp: Date.now(),
    };
    this.deepDischargeListeners.forEach((cb) => {
      try {
        cb(reminder);
      } catch (e) {
        console.error('Deep discharge listener error:', e);
      }
    });
  }

  public onDeepDischargeReminder(cb: (reminder: {
    hours: number;
    message: string;
    recommendation: string;
    timestamp: number;
  }) => void): () => void {
    this.deepDischargeListeners.push(cb);
    return () => {
      this.deepDischargeListeners = this.deepDischargeListeners.filter((l) => l !== cb);
    };
  }

  private async init() {
    try {
      const nav = navigator as unknown as { getBattery?: () => Promise<BatteryManagerPolyfill> };
      if (nav.getBattery) {
        this.batteryManager = await nav.getBattery();
        this.updateFromManager();
        this.state.supported = true;

        this.batteryManager.addEventListener('chargingchange', () => {
          this.updateFromManager();
        });
        this.batteryManager.addEventListener('levelchange', () => {
          this.updateFromManager();
        });
      } else {
        // Fallback simulation mode (assumes plugged in initially)
        this.state.supported = false;
        this.state.level = 78;
        this.state.charging = true;
        this.state.unpluggedSince = null;
        this.state.unpluggedMinutes = 0;
      }
    } catch {
      this.state.supported = false;
    }
    this.notify();
  }

  private updateFromManager() {
    if (!this.batteryManager) return;
    const isCharging = this.batteryManager.charging;

    if (!isCharging) {
      this.pluggedSince = null;
      try {
        localStorage.removeItem('HGUARD_PLUGGED_SINCE');
      } catch {}
      if (!this.unpluggedSince) {
        try {
          const stored = localStorage.getItem('HGUARD_UNPLUGGED_SINCE');
          this.unpluggedSince = stored ? parseInt(stored, 10) : Date.now();
          localStorage.setItem('HGUARD_UNPLUGGED_SINCE', String(this.unpluggedSince));
        } catch {
          this.unpluggedSince = Date.now();
        }
      }
    } else {
      this.unpluggedSince = null;
      try {
        localStorage.removeItem('HGUARD_UNPLUGGED_SINCE');
      } catch {}
      if (!this.pluggedSince) {
        try {
          const stored = localStorage.getItem('HGUARD_PLUGGED_SINCE');
          this.pluggedSince = stored ? parseInt(stored, 10) : Date.now();
          localStorage.setItem('HGUARD_PLUGGED_SINCE', String(this.pluggedSince));
        } catch {
          this.pluggedSince = Date.now();
        }
      }
    }

    const mins = !isCharging && this.unpluggedSince
      ? Math.max(0, Math.floor((Date.now() - this.unpluggedSince) / 60000))
      : 0;

    const hours = isCharging && this.pluggedSince
      ? Math.max(0, Math.floor((Date.now() - this.pluggedSince) / 3600000))
      : 0;

    const isDue = isCharging && hours >= 72;

    this.state = {
      level: Math.round(this.batteryManager.level * 100),
      charging: isCharging,
      chargingTime: this.batteryManager.chargingTime,
      dischargingTime: this.batteryManager.dischargingTime,
      supported: true,
      unpluggedSince: this.unpluggedSince,
      unpluggedMinutes: mins,
      pluggedSince: this.pluggedSince,
      pluggedHours: hours,
      deepDischargeReminderDue: isDue,
      lastDeepDischargeLoggedAt: this.lastDeepDischargeLoggedAt,
    };
    this.notify();

    if (isDue) {
      const now = Date.now();
      if (!this.lastDeepDischargeLoggedAt || (now - this.lastDeepDischargeLoggedAt >= 24 * 3600 * 1000)) {
        this.lastDeepDischargeLoggedAt = now;
        try {
          localStorage.setItem('HGUARD_LAST_DEEP_DISCHARGE_LOGGED', String(now));
        } catch {}
        this.triggerDeepDischarge(hours);
      }
    }
  }

  public subscribe(cb: (state: BatteryState) => void): () => void {
    this.listeners.push(cb);
    cb(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  public getState(): BatteryState {
    return { ...this.state };
  }

  // Allow manual override for demonstration and old devices lacking Battery API
  public setManualState(level: number, charging: boolean) {
    if (!charging) {
      this.pluggedSince = null;
      try {
        localStorage.removeItem('HGUARD_PLUGGED_SINCE');
      } catch {}
      if (!this.unpluggedSince) {
        this.unpluggedSince = Date.now();
        try {
          localStorage.setItem('HGUARD_UNPLUGGED_SINCE', String(this.unpluggedSince));
        } catch {}
      }
    } else {
      this.unpluggedSince = null;
      try {
        localStorage.removeItem('HGUARD_UNPLUGGED_SINCE');
      } catch {}
      if (!this.pluggedSince) {
        this.pluggedSince = Date.now();
        try {
          localStorage.setItem('HGUARD_PLUGGED_SINCE', String(this.pluggedSince));
        } catch {}
      }
    }

    const mins = !charging && this.unpluggedSince
      ? Math.max(0, Math.floor((Date.now() - this.unpluggedSince) / 60000))
      : 0;

    const hours = charging && this.pluggedSince
      ? Math.max(0, Math.floor((Date.now() - this.pluggedSince) / 3600000))
      : 0;

    const isDue = charging && hours >= 72;

    this.state = {
      ...this.state,
      level: Math.max(0, Math.min(100, level)),
      charging,
      unpluggedSince: this.unpluggedSince,
      unpluggedMinutes: mins,
      pluggedSince: this.pluggedSince,
      pluggedHours: hours,
      deepDischargeReminderDue: isDue,
    };
    this.notify();

    if (isDue) {
      this.triggerDeepDischarge(hours);
    }
  }

  // Simulate unplugged duration (e.g. 16 minutes to test the >15min warning)
  public setSimulatedUnplugged(minutes: number) {
    this.pluggedSince = null;
    try {
      localStorage.removeItem('HGUARD_PLUGGED_SINCE');
    } catch {}

    this.unpluggedSince = Date.now() - minutes * 60 * 1000;
    try {
      localStorage.setItem('HGUARD_UNPLUGGED_SINCE', String(this.unpluggedSince));
    } catch {}

    this.state = {
      ...this.state,
      charging: false,
      unpluggedSince: this.unpluggedSince,
      unpluggedMinutes: minutes,
      pluggedSince: null,
      pluggedHours: 0,
      deepDischargeReminderDue: false,
      level: Math.max(15, this.state.level - Math.round(minutes * 0.4)),
    };
    this.notify();
  }

  // Simulate 72+ hours plugged in to test the deep discharge cycle reminder
  public setSimulatedPluggedHours(hours: number = 72) {
    this.unpluggedSince = null;
    try {
      localStorage.removeItem('HGUARD_UNPLUGGED_SINCE');
    } catch {}

    this.pluggedSince = Date.now() - hours * 3600 * 1000;
    try {
      localStorage.setItem('HGUARD_PLUGGED_SINCE', String(this.pluggedSince));
    } catch {}

    const isDue = hours >= 72;
    this.state = {
      ...this.state,
      charging: true,
      unpluggedSince: null,
      unpluggedMinutes: 0,
      pluggedSince: this.pluggedSince,
      pluggedHours: hours,
      deepDischargeReminderDue: isDue,
      lastDeepDischargeLoggedAt: isDue ? Date.now() : null,
    };
    this.notify();

    if (isDue) {
      this.triggerDeepDischarge(hours);
    }
  }

  // Reset the 72-hour plugged timer after performing a deep discharge cycle
  public resetDeepDischargeTimer() {
    this.pluggedSince = Date.now();
    this.lastDeepDischargeLoggedAt = null;
    try {
      localStorage.setItem('HGUARD_PLUGGED_SINCE', String(this.pluggedSince));
      localStorage.removeItem('HGUARD_LAST_DEEP_DISCHARGE_LOGGED');
    } catch {}

    this.state = {
      ...this.state,
      pluggedSince: this.pluggedSince,
      pluggedHours: 0,
      deepDischargeReminderDue: false,
      lastDeepDischargeLoggedAt: null,
    };
    this.notify();
  }

  // Restore plugged in state
  public setPluggedIn() {
    this.unpluggedSince = null;
    try {
      localStorage.removeItem('HGUARD_UNPLUGGED_SINCE');
    } catch {}

    if (!this.pluggedSince) {
      this.pluggedSince = Date.now();
      try {
        localStorage.setItem('HGUARD_PLUGGED_SINCE', String(this.pluggedSince));
      } catch {}
    }

    const hours = Math.max(0, Math.floor((Date.now() - this.pluggedSince) / 3600000));
    const isDue = hours >= 72;

    this.state = {
      ...this.state,
      charging: true,
      unpluggedSince: null,
      unpluggedMinutes: 0,
      pluggedSince: this.pluggedSince,
      pluggedHours: hours,
      deepDischargeReminderDue: isDue,
    };
    this.notify();
  }

  /**
   * Check if battery reached 80% ceiling while charging
   */
  public checkThreshold80(cap: number = 80): { triggerAlert: boolean; message: string } {
    const isOverCap = this.state.level >= cap;
    const isCharging = this.state.charging;

    if (isOverCap && isCharging) {
      const now = Date.now();
      // Cooldown 20 seconds between alerts
      if (now - this.lastAlerted80At > 20000) {
        this.lastAlerted80At = now;
        return {
          triggerAlert: true,
          message: `Battery reached ${this.state.level}%. Unplug charger now to protect battery health!`,
        };
      }
    }
    return { triggerAlert: false, message: '' };
  }

  /**
   * Trigger optional Smart Plug webhook to cut AC power at 80%
   */
  public async triggerSmartPlug(webhookUrl: string, action: 'off' | 'on'): Promise<boolean> {
    if (!webhookUrl || !webhookUrl.startsWith('http')) return false;
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ power: action, timestamp: Date.now(), reason: 'battery_80_guard' }),
        mode: 'no-cors',
      });
      return true;
    } catch (e) {
      console.warn('Smart plug webhook failed:', e);
      return false;
    }
  }
}
