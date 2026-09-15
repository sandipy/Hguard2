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
    level: 80,
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
  private lastAlerted80At: number = 0;

  private constructor() {
    this.init();
  }

  public static getInstance(): BatteryService {
    if (!BatteryService.instance) {
      BatteryService.instance = new BatteryService();
    }
    return BatteryService.instance;
  }

  private async init() {
    try {
      const nav = navigator as unknown as { getBattery?: () => Promise<BatteryManagerPolyfill> };
      if (nav.getBattery) {
        this.batteryManager = await nav.getBattery();
        this.updateFromManager();
        this.state.supported = true;
        this.batteryManager.addEventListener('chargingchange', () => this.updateFromManager());
        this.batteryManager.addEventListener('levelchange', () => this.updateFromManager());
      } else {
        this.state.supported = false;
        this.state.level = 80;
        this.state.charging = true;
      }
    } catch {
      this.state.supported = false;
    }
    this.notify();
  }

  private updateFromManager() {
    if (!this.batteryManager) return;
    this.state = {
      level: Math.round(this.batteryManager.level * 100),
      charging: this.batteryManager.charging,
      chargingTime: this.batteryManager.chargingTime,
      dischargingTime: this.batteryManager.dischargingTime,
      supported: true,
      unpluggedSince: null,
      unpluggedMinutes: 0,
      pluggedSince: null,
      pluggedHours: 0,
      deepDischargeReminderDue: false,
      lastDeepDischargeLoggedAt: null,
    };
    this.notify();
  }

  public subscribe(cb: (state: BatteryState) => void): () => void {
    this.listeners.push(cb);
    cb(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public onBatteryChange(cb: (state: BatteryState) => void): () => void {
    return this.subscribe(cb);
  }

  private notify() {
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  public getState(): BatteryState {
    return { ...this.state };
  }
}

export const batteryService = BatteryService.getInstance();
