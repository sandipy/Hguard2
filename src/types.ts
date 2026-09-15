export type AppMode = 'select' | 'camera' | 'viewer';
export type CameraSlot = 'cam1' | 'cam2' | 'cam3' | 'cam4' | 'cam5' | 'cam6';
export type ViewerStation = 'viewer1' | 'viewer2' | 'viewer3';
export type MotionSensitivity = 'low' | 'medium' | 'high';
export type BandwidthMode = 'low' | 'balanced' | 'high';
export type ResolutionMode = '720p' | '1080p' | '360p' | '240p';
export type ThermalStatus = 'normal' | 'warm' | 'hot';

export type AIObjectType =
  | 'person'
  | 'pet'
  | 'vehicle'
  | 'baby_cry'
  | 'lingering'
  | 'motion'
  | 'package'
  | 'manual'
  | 'battery_health'
  | 'fall_detected'
  | 'voice_help'
  | 'sound_surge'
  | 'alert_cleared'
  | 'wandering'
  | 'inactivity'
  | 'offline'
  | 'camera_offline';

export interface AIFrameBox {
  label: string;
  confidence: number;
  box_2d: [number, number, number, number];
  lingeringDetected?: boolean;
}

export interface AIDetectionResult {
  detected: boolean;
  primaryType: AIObjectType;
  threatLevel: 'none' | 'low' | 'medium' | 'high';
  summary: string;
  confidence?: number;
  audioAnomalyDetected?: boolean;
  lingeringDetected?: boolean;
  objects: AIFrameBox[];
}

export interface BatteryState {
  level: number;
  charging: boolean;
  chargingTime?: number;
  dischargingTime?: number;
  supported: boolean;
  unpluggedSince?: number | null;
  unpluggedMinutes?: number;
  pluggedSince?: number | null;
  pluggedHours?: number;
  deepDischargeReminderDue?: boolean;
  lastDeepDischargeLoggedAt?: number | null;
}

export interface SecurityEvent {
  id: string;
  cameraId: CameraSlot;
  cameraName: string;
  timestamp: number;
  motionIntensity: number;
  eventType: AIObjectType;
  snapshotEncrypted: string;
  iv: string;
  thermalState: ThermalStatus;
  batteryLevel: number;
  notes?: string;
  durationSec?: number;
  isCloudSynced?: boolean;
  aiResult?: AIDetectionResult;
  aiSummary?: string;
  aiConfidence?: number;
  aiDetectedObjects?: AIFrameBox[];
  decryptedSnapshot?: string;
}

export interface UserProfile {
  email: string;
  name: string;
  plan: 'Free' | 'Premium Standard' | 'Premium Plus';
  activeCamerasAllowed: number;
  concurrentViewersAllowed: number;
  cloudRetentionDays: number;
  loggedIn: boolean;
  passPin: string;
  cloudSyncEnabled: boolean;
  googleDriveEnabled?: boolean;
  googleDriveFolder?: string;
  googleDriveWebhookUrl?: string;
  googleDriveAutoBackup?: boolean;
  authProvider?: 'google' | 'pin';
  isAuthed?: boolean;
  privacyMode?: boolean;
  authMethod?: 'local' | 'pin' | 'google' | 'guest';
}

export interface VideoFramePacket {
  cameraId: CameraSlot;
  cameraName: string;
  frameDataUrl: string;
  timestamp: number;
  motionScore: number;
  thermalState: ThermalStatus;
  batteryLevel: number;
  isNightVision?: boolean;
  lightLevel?: number;
}

export interface AppSettings {
  // Motion & Detection Settings
  motionSensitivity: MotionSensitivity;
  detectionZone: 'full' | 'center';
  motionCooldownSec: number;

  // AI Features
  aiDetectionEnabled: boolean;
  aiPersonDetection: boolean;
  aiPetDetection: boolean;
  aiVehicleDetection: boolean;
  aiLingeringDetection: boolean;
  aiBabyCryDetection: boolean;
  aiFrameBoxesVisible: boolean;

  // Recording & Storage
  continuousRecording: boolean;
  recordingClipDuration: 30 | 120;
  cloudStorageEnabled: boolean;
  showWatermark: boolean;
  showTimestamp: boolean;

  // Video resolution (720p HD default for optimal thermal & network efficiency)
  resolutionMode: ResolutionMode;
  bandwidthMode: BandwidthMode;

  // Hardware & Battery protection (Default On)
  batteryHealthCap: number;
  batteryAlarmEnabled: boolean;
  smartPlugWebhookUrl: string;
  ecoCoolScreenEnabled: boolean; // Dims screen black on camera phone to prevent heat
  ecoCoolDelaySec: number;
  thermalThrottleFps: boolean;

  // Accessibility & Alerts
  seniorVoiceAlerts: boolean;
  highContrast: boolean;
  largeFonts: boolean;
  alarmSoundEnabled: boolean;

  // Dedicated Senior Protection (Default On)
  seniorCareMode: boolean;
  fallDetectionEnabled: boolean;
  voiceHelpKeywordEnabled: boolean;
  autoAnswerIntercomEnabled: boolean;
  bathroomPrivacyShield: boolean;
  nightWanderingAlertEnabled: boolean;

  // Night Vision: OFF by default to eliminate green tint in normal daylight/room light
  autoNightVisionOnLowLight: boolean;
  autoTorchOnPitchDark: boolean;
  lowLightThreshold: number;
  pitchDarkThreshold: number;

  // Encryption
  encryptionPin: string;
}

export interface CameraStatusBroadcast {
  cameraId: CameraSlot;
  cameraName: string;
  timestamp: number;
  isOnline: boolean;
  battery: BatteryState;
  batteryLevel?: number;
  thermal: ThermalStatus;
  thermalState?: ThermalStatus;
  isNightVision?: boolean;
  fps: number;
  currentFrame?: string;
  bandwidthMode: BandwidthMode;
  resolutionMode: ResolutionMode;
  motionDetected: boolean;
  motionScore: number;
  aiResult?: AIDetectionResult;
  isRecording?: boolean;
  fallDetected?: boolean;
  voiceHelpActive?: boolean;
  seniorSpeechTranscript?: string;
  privacyShieldActive?: boolean;
  torchOn?: boolean;
  nightMode?: boolean;
  ambientLuminance?: number;
  isLowLight?: boolean;
  isPitchDark?: boolean;
  autoNightVisionTriggered?: boolean;
  autoTorchTriggered?: boolean;
  lastHeartbeat?: number;
  isHeartbeatActive?: boolean;
  heartbeatStatus?: 'online' | 'warning' | 'offline';
  secondsSinceLastHeartbeat?: number;
}

export interface CameraHeartbeatInfo {
  cameraId: CameraSlot;
  cameraName: string;
  lastSeen: number;
  secondsSinceLastSeen: number;
  status: 'online' | 'warning' | 'offline';
  isOfflineEventLogged: boolean;
  offlineSince?: number | null;
}

export interface StreamConnectionState {
  connected: boolean;
  broker: string;
  roomKey: string;
  devicesOnline: number;
  lastSyncTimestamp: number;
}
