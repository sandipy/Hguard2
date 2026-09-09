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
  | 'inactivity';

export interface AIFrameBox {
  label: string;
  confidence: number;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 scale
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
  level: number; // 0 to 100
  charging: boolean;
  chargingTime?: number;
  dischargingTime?: number;
  supported: boolean;
  unpluggedSince?: number | null; // Timestamp (epoch ms) when disconnected from AC power
  unpluggedMinutes?: number; // Total minutes running on battery without AC power
  pluggedSince?: number | null; // Timestamp (epoch ms) when connected to continuous AC power
  pluggedHours?: number; // Total hours running plugged into AC power continuously
  deepDischargeReminderDue?: boolean; // True when continuous plugged in duration exceeds 72 hours
  lastDeepDischargeLoggedAt?: number | null; // Timestamp of last deep discharge reminder event
}

export interface SecurityEvent {
  id: string;
  cameraId: CameraSlot;
  cameraName: string;
  timestamp: number;
  motionIntensity: number; // 0 - 100
  eventType: AIObjectType;
  snapshotEncrypted: string; // Base64 encrypted string (AES-GCM)
  iv: string; // Initialization vector for AES-GCM
  thermalState: ThermalStatus;
  batteryLevel: number;
  notes?: string;
  durationSec?: number;
  isCloudSynced?: boolean;
  aiResult?: AIDetectionResult;
  aiSummary?: string;
  aiConfidence?: number;
  aiDetectedObjects?: AIFrameBox[];
  // Non-encrypted preview cached in session if unlocked
  decryptedSnapshot?: string;
}

export interface UserProfile {
  email: string;
  name: string;
  plan: 'Free' | 'Premium Standard' | 'Premium Plus';
  activeCamerasAllowed: number; // 6 cameras
  concurrentViewersAllowed: number; // 3 concurrent viewers
  cloudRetentionDays: number; // 30 days in Premium Plus
  loggedIn: boolean;
  passPin: string;
  cloudSyncEnabled: boolean;
  // Google Drive & Gmail settings optimized for very old phones
  googleDriveEnabled?: boolean;
  googleDriveFolder?: string;
  googleDriveWebhookUrl?: string;
  googleDriveAutoBackup?: boolean;
  authProvider?: 'google' | 'pin';
}

export interface AppSettings {
  // Motion & Detection Settings
  motionSensitivity: MotionSensitivity;
  detectionZone: 'full' | 'center';
  motionCooldownSec: number;
  
  // Premium Plus AI Features
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

  // Video resolution & Zoom
  resolutionMode: ResolutionMode;
  bandwidthMode: BandwidthMode;
  
  // Hardware & Battery protection for old phones
  batteryHealthCap: number; // default 80
  batteryAlarmEnabled: boolean;
  smartPlugWebhookUrl: string; // Optional URL to auto-cut power at 80%
  ecoCoolScreenEnabled: boolean; // Turn screen black during surveillance to prevent heating
  ecoCoolDelaySec: number; // Seconds of inactivity before screen turns black
  thermalThrottleFps: boolean;
  
  // Accessibility & Alerts
  seniorVoiceAlerts: boolean;
  highContrast: boolean;
  largeFonts: boolean;
  alarmSoundEnabled: boolean;
  
  // Dedicated Senior & Halo Alert Monitoring
  seniorCareMode: boolean; // Master preset for senior fall, voice help, and auto-answer
  fallDetectionEnabled: boolean; // Rapid downward descent + floor immobility tracker (5+ ft)
  voiceHelpKeywordEnabled: boolean; // Hands-free voice trigger ("Help!", "Help me!", "I fell!")
  autoAnswerIntercomEnabled: boolean; // Automatically opens camera mic when family talks (zero-touch)
  bathroomPrivacyShield: boolean; // Blurs/masks video stream while keeping fall detection active
  nightWanderingAlertEnabled: boolean; // Alerts if door movement detected between 10 PM and 6 AM
  
  // Encryption
  encryptionPin: string;
}

export interface CameraStatusBroadcast {
  cameraId: CameraSlot;
  cameraName: string;
  timestamp: number;
  isOnline: boolean;
  battery: BatteryState;
  thermal: ThermalStatus;
  fps: number;
  currentFrame?: string; // compressed data URL for live preview
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
}

