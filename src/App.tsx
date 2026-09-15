/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Camera,
  Eye,
  Shield,
  BatteryCharging,
  Flame,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Cloud,
  User,
  Crown,
  Lock,
  Video,
  Check,
  Play,
  LogOut,
  Mail,
  Scan,
  QrCode,
  Mic,
  MicOff,
  AlertOctagon,
  Volume2,
  HelpCircle,
} from 'lucide-react';
import { AppMode, AppSettings, BatteryState, CameraSlot, SecurityEvent, ThermalStatus, UserProfile } from './types';
import { SeniorTopNav } from './components/SeniorTopNav';
import { CameraView } from './components/CameraView';
import { MonitorView } from './components/MonitorView';
import { EventLogModal } from './components/EventLogModal';
import { SettingsModal } from './components/SettingsModal';
import { AccountModal } from './components/AccountModal';
import { CloudStorageModal } from './components/CloudStorageModal';
import { AIExplainerModal } from './components/AIExplainerModal';
import { VisualAnimationDemoModal } from './components/VisualAnimationDemoModal';
import { StepByStepGuideModal } from './components/StepByStepGuideModal';
import { SystemInfoModal } from './components/SystemInfoModal';
import { ShareModal } from './components/ShareModal';
import { PairingQRModal } from './components/PairingQRModal';
import { PairingQRScannerModal } from './components/PairingQRScannerModal';
import { SeniorQuickGuideModal } from './components/SeniorQuickGuideModal';
import { HeartbeatStatusModal } from './components/HeartbeatStatusModal';
import { BatteryService } from './utils/batteryService';
import { encryptData } from './utils/crypto';
import { speakSeniorVoice, playEmergencyAlarmSiren } from './utils/soundAlerts';
import { globalStreamChannel } from './utils/streamChannel';
import { globalHeartbeatService } from './utils/heartbeatService';

const DEFAULT_SETTINGS: AppSettings = {
  motionSensitivity: 'medium',
  detectionZone: 'full',
  motionCooldownSec: 5,
  aiDetectionEnabled: true,
  aiPersonDetection: true,
  aiPetDetection: true,
  aiVehicleDetection: true,
  aiLingeringDetection: true,
  aiBabyCryDetection: true,
  aiFrameBoxesVisible: true,
  continuousRecording: false,
  recordingClipDuration: 30,
  cloudStorageEnabled: true,
  showWatermark: true,
  showTimestamp: true,
  resolutionMode: '720p',
  bandwidthMode: 'low',
  batteryHealthCap: 80,
  batteryAlarmEnabled: true,
  smartPlugWebhookUrl: '',
  ecoCoolScreenEnabled: true,
  ecoCoolDelaySec: 25,
  thermalThrottleFps: true,
  seniorVoiceAlerts: true,
  highContrast: true,
  largeFonts: true,
  alarmSoundEnabled: true,
  seniorCareMode: true,
  fallDetectionEnabled: true,
  voiceHelpKeywordEnabled: true,
  autoAnswerIntercomEnabled: true,
  bathroomPrivacyShield: false,
  nightWanderingAlertEnabled: true,
  autoNightVisionOnLowLight: true,
  autoTorchOnPitchDark: true,
  lowLightThreshold: 35,
  pitchDarkThreshold: 15,
  encryptionPin: '8888',
};

export default function App() {
  const [mode, setMode] = useState<AppMode>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role') || params.get('mode');
      if (roleParam === 'camera' || roleParam === 'cam') return 'camera';
      if (roleParam === 'viewer' || roleParam === 'monitor') return 'viewer';
      if (params.get('senior') === '1' || params.get('senior') === 'true' || params.get('autostart') === '1') return 'camera';
      if (params.get('cam')) return 'camera';
      if (window.location.hash === '#senior' || window.location.hash === '#camera') return 'camera';
      if (window.location.hash === '#viewer' || window.location.hash === '#monitor') return 'viewer';

      const savedMode = localStorage.getItem('HGUARD_ACTIVE_MODE');
      if (savedMode === 'camera' || savedMode === 'viewer') return savedMode as AppMode;
    } catch {}
    return 'select';
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('HGUARD_SETTINGS_V2');
      if (saved) {
        return {
          ...DEFAULT_SETTINGS,
          ...JSON.parse(saved),
          // Ensure all cameras are always 95-yr-old zero setup by default
          seniorCareMode: true,
          fallDetectionEnabled: true,
          voiceHelpKeywordEnabled: true,
          autoAnswerIntercomEnabled: true,
          seniorVoiceAlerts: true,
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      // One-time sign-out reset so user can use ANY Gmail login as requested
      const hasReset = localStorage.getItem('HGUARD_LOGGED_OUT_CLEARED_V2');
      if (!hasReset) {
        localStorage.setItem('HGUARD_LOGGED_OUT_CLEARED_V2', 'true');
        const initialSignedOut: UserProfile = {
          email: '',
          name: '',
          plan: 'Premium Plus',
          activeCamerasAllowed: 6,
          concurrentViewersAllowed: 3,
          cloudRetentionDays: 30,
          loggedIn: false,
          passPin: '8888',
          cloudSyncEnabled: true,
          authProvider: 'google',
          googleDriveEnabled: false,
          googleDriveAutoBackup: false,
          googleDriveFolder: 'HGuard_Surveillance',
        };
        localStorage.setItem('HGUARD_USER_PROFILE_V1', JSON.stringify(initialSignedOut));
        return initialSignedOut;
      }

      const saved = localStorage.getItem('HGUARD_USER_PROFILE_V1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      email: '',
      name: '',
      plan: 'Premium Plus',
      activeCamerasAllowed: 6,
      concurrentViewersAllowed: 3,
      cloudRetentionDays: 30,
      loggedIn: false,
      passPin: '8888',
      cloudSyncEnabled: true,
      authProvider: 'google',
      googleDriveEnabled: false,
      googleDriveAutoBackup: false,
      googleDriveFolder: 'HGuard_Surveillance',
    };
  });

  const [loginEmailInput, setLoginEmailInput] = useState('');

  const [battery, setBattery] = useState<BatteryState>({
    level: 78,
    charging: true,
    supported: false,
  });

  const [thermal, setThermal] = useState<ThermalStatus>('normal');
  const [events, setEvents] = useState<SecurityEvent[]>(() => {
    try {
      const saved = localStorage.getItem('HGUARD_ENCRYPTED_EVENTS_V1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isCloudStorageOpen, setIsCloudStorageOpen] = useState(false);
  const [isAIExplainerOpen, setIsAIExplainerOpen] = useState(false);
  const [isAnimationDemoOpen, setIsAnimationDemoOpen] = useState(false);
  const [isStepGuideOpen, setIsStepGuideOpen] = useState(false);
  const [isSeniorGuideOpen, setIsSeniorGuideOpen] = useState(false);
  const [isSystemInfoOpen, setIsSystemInfoOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPairingQrOpen, setIsPairingQrOpen] = useState(false);
  const [selectedPairingSlot, setSelectedPairingSlot] = useState<CameraSlot>('cam1');
  const [isPairingScannerOpen, setIsPairingScannerOpen] = useState(false);
  const [isHeartbeatModalOpen, setIsHeartbeatModalOpen] = useState(false);
  const [offlineCamerasCount, setOfflineCamerasCount] = useState(0);
  const [pairingToast, setPairingToast] = useState<string | null>(null);
  const [unpluggedWarning, setUnpluggedWarning] = useState<{
    isUnpluggedLong: boolean;
    minutes: number;
    cameraName?: string;
  } | null>(null);

  // Voice SOS Web Speech API state: Continuous hands-free emergency detection
  const [voiceSosEnabled, setVoiceSosEnabled] = useState(true);
  const [voiceSosListening, setVoiceSosListening] = useState(false);
  const [voiceSosSupported, setVoiceSosSupported] = useState(true);
  const [voiceSosTranscript, setVoiceSosTranscript] = useState('');
  const [voiceSosAlertToast, setVoiceSosAlertToast] = useState<{ phrase: string; time: number } | null>(null);
  const lastVoiceSosTriggerRef = React.useRef<number>(0);

  // Monitor unplugged duration (> 15 minutes) for visual indicator in SeniorTopNav
  useEffect(() => {
    // 1. Check local battery state
    if (!battery.charging && (battery.unpluggedMinutes ?? 0) >= 15) {
      setUnpluggedWarning({
        isUnpluggedLong: true,
        minutes: battery.unpluggedMinutes || 15,
        cameraName: mode === 'camera' ? 'This Camera Device' : 'Home Station',
      });
      return;
    }

    // 2. Check remote camera statuses from stream channel
    const unsub = globalStreamChannel.onAllCameras((cameras) => {
      for (const [camId, cam] of Object.entries(cameras)) {
        if (cam && cam.battery && !cam.battery.charging && (cam.battery.unpluggedMinutes ?? 0) >= 15) {
          setUnpluggedWarning({
            isUnpluggedLong: true,
            minutes: cam.battery.unpluggedMinutes || 15,
            cameraName: cam.cameraName || camId.toUpperCase(),
          });
          return;
        }
      }
      if (battery.charging || (battery.unpluggedMinutes ?? 0) < 15) {
        setUnpluggedWarning(null);
      }
    });

    return unsub;
  }, [battery, mode]);

  // Parse URL Search Parameters for 1-Tap Old Phone Launch & Zero-Setup QR Pairing
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      const userParam = params.get('user');
      const pinParam = params.get('pin');
      const pairParam = params.get('pair');
      const camParam = params.get('cam');

      if (userParam) {
        const decodedEmail = decodeURIComponent(userParam);
        setUser((prev) => {
          const updated: UserProfile = {
            ...prev,
            email: decodedEmail,
            name: decodedEmail.split('@')[0],
            authProvider: 'google',
            loggedIn: true,
            passPin: pinParam ? decodeURIComponent(pinParam) : prev.passPin,
            cloudSyncEnabled: true,
          };
          localStorage.setItem('HGUARD_USER_PROFILE_V1', JSON.stringify(updated));
          return updated;
        });
      }

      if (pinParam) {
        const decodedPin = decodeURIComponent(pinParam);
        setSettings((prev) => {
          const updated = {
            ...prev,
            encryptionPin: decodedPin,
          };
          localStorage.setItem('HGUARD_SETTINGS_V2', JSON.stringify(updated));
          return updated;
        });
      }

      if (camParam) {
        try {
          localStorage.setItem('HGUARD_CAM_SLOT', camParam);
        } catch {}
      }

      if (pairParam === '1' || roleParam === 'camera' || roleParam === 'viewer') {
        const targetMode: AppMode = roleParam === 'viewer' ? 'viewer' : 'camera';
        setMode(targetMode);
        localStorage.setItem('HGUARD_ACTIVE_MODE', targetMode);

        if (pairParam === '1') {
          const slotLabel = camParam ? camParam.toUpperCase() : 'CAMERA';
          setPairingToast(`Zero-Setup Auto-Pair Active: Connected as ${slotLabel} (${decodeURIComponent(userParam || 'Viewer')})`);
          speakSeniorVoice('Zero-setup QR pairing confirmed. Hands-free surveillance armed.');
          setTimeout(() => setPairingToast(null), 8000);
        }
      }
    } catch (e) {
      console.warn('URL param parse error:', e);
    }
  }, []);

  // Handle instant pairing callback from QR Code Scanner
  const handlePairSuccess = useCallback((payload: { email: string; pin: string; slot: CameraSlot; role: string }) => {
    setIsPairingScannerOpen(false);

    // 1. Update user profile
    setUser((prev) => {
      const updated: UserProfile = {
        ...prev,
        email: payload.email,
        name: payload.email.split('@')[0],
        plan: 'Premium Plus',
        activeCamerasAllowed: 6,
        concurrentViewersAllowed: 3,
        cloudRetentionDays: 30,
        loggedIn: true,
        passPin: payload.pin,
        cloudSyncEnabled: true,
        authProvider: 'google',
      };
      localStorage.setItem('HGUARD_USER_PROFILE_V1', JSON.stringify(updated));
      return updated;
    });

    // 2. Update settings
    setSettings((prev) => {
      const updated = {
        ...prev,
        encryptionPin: payload.pin,
      };
      localStorage.setItem('HGUARD_SETTINGS_V2', JSON.stringify(updated));
      return updated;
    });

    // 3. Set camera slot
    try {
      localStorage.setItem('HGUARD_CAM_SLOT', payload.slot);
    } catch {}

    // 4. Update browser URL history
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('role', payload.role || 'camera');
      newUrl.searchParams.set('cam', payload.slot);
      newUrl.searchParams.set('user', payload.email);
      newUrl.searchParams.set('pin', payload.pin);
      newUrl.searchParams.set('pair', '1');
      newUrl.searchParams.set('senior', '1');
      newUrl.searchParams.set('autostart', '1');
      window.history.replaceState({}, '', newUrl.toString());
    } catch {}

    // 5. Switch to Camera Mode
    setMode('camera');
    localStorage.setItem('HGUARD_ACTIVE_MODE', 'camera');

    setPairingToast(`Instant QR Pairing Successful! Camera paired as ${payload.slot.toUpperCase()} with ${payload.email}`);
    speakSeniorVoice(`Camera unit paired successfully as ${payload.slot}. Zero setup surveillance active.`);
    setTimeout(() => setPairingToast(null), 8000);
  }, []);

  // Initialize Battery Service
  useEffect(() => {
    const batteryService = BatteryService.getInstance();
    const unsub = batteryService.subscribe((state) => {
      setBattery(state);
    });
    return unsub;
  }, []);

  // Seed an initial encrypted event if none exists
  useEffect(() => {
    if (events.length === 0) {
      const seedEvent = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 400;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 400, 300);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(50, 50, 300, 200);
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText('Camera 1 (Front Door)', 70, 130);
            ctx.fillStyle = '#10b981';
            ctx.font = '16px sans-serif';
            ctx.fillText('Gemini AI: Person Detected (96%)', 70, 165);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px sans-serif';
            ctx.fillText('AES-256 Encrypted • Cloud Synced', 70, 195);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

            const encrypted = await encryptData(dataUrl, settings.encryptionPin);
            const initialEvt: SecurityEvent = {
              id: 'initial_demo_evt',
              cameraId: 'cam1',
              cameraName: 'Camera 1 (Front Door)',
              timestamp: Date.now() - 3600000,
              motionIntensity: 85,
              eventType: 'person',
              snapshotEncrypted: encrypted.ciphertext,
              iv: encrypted.iv,
              thermalState: 'normal',
              batteryLevel: 79,
              notes: 'Person detected near doorstep with 96% confidence',
              decryptedSnapshot: dataUrl,
              aiSummary: 'Person detected near doorstep with 96% confidence',
              aiConfidence: 96,
              isCloudSynced: true,
            };
            setEvents([initialEvt]);
          }
        } catch {
          // ignore
        }
      };
      seedEvent();
    }
  }, [events.length, settings.encryptionPin]);

  // Persist settings
  const handleUpdateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('HGUARD_SETTINGS_V2', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Persist user profile
  const handleUpdateUser = useCallback((updatedUser: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedUser };
      try {
        localStorage.setItem('HGUARD_USER_PROFILE_V1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const handleSignOut = useCallback(() => {
    handleUpdateUser({
      email: '',
      name: '',
      loggedIn: false,
      googleDriveAutoBackup: false,
      googleDriveEnabled: false,
    });
    setLoginEmailInput('');
    if (settings.seniorVoiceAlerts) {
      speakSeniorVoice('Signed out.');
    }
  }, [handleUpdateUser, settings.seniorVoiceAlerts]);

  const handleCustomGmailLogin = useCallback(
    (customEmail?: string) => {
      let email = (customEmail || loginEmailInput).trim();
      if (!email) return;
      if (!email.includes('@')) {
        email = `${email}@gmail.com`;
      }
      handleUpdateUser({
        email,
        name: email.split('@')[0],
        loggedIn: true,
        authProvider: 'google',
      });
      setLoginEmailInput('');
      if (settings.seniorVoiceAlerts) {
        speakSeniorVoice(`Signed in as ${email}`);
      }
    },
    [handleUpdateUser, loginEmailInput, settings.seniorVoiceAlerts]
  );

  // Save new security event
  const handleNewSecurityEvent = useCallback((event: SecurityEvent) => {
    setEvents((prev) => {
      const updated = [event, ...prev].slice(0, 80);
      try {
        const storageSafe = updated.map(({ decryptedSnapshot, ...rest }) => rest);
        localStorage.setItem('HGUARD_ENCRYPTED_EVENTS_V1', JSON.stringify(storageSafe));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Network Heartbeat Checker: Logs 'Offline' event if camera fails to transmit for >5 minutes
  useEffect(() => {
    const unsubOffline = globalHeartbeatService.onOfflineEvent((evt) => {
      handleNewSecurityEvent(evt);
    });

    const unsubHb = globalHeartbeatService.onHeartbeatUpdate((states) => {
      const count = Object.values(states).filter((s) => s.status === 'offline').length;
      setOfflineCamerasCount(count);
    });

    return () => {
      unsubOffline();
      unsubHb();
    };
  }, [handleNewSecurityEvent]);

  // 72-Hour Continuous Charging: Automatic Deep Discharge Cycle Reminder in Event Log
  useEffect(() => {
    const batteryService = BatteryService.getInstance();
    const unsubReminder = batteryService.onDeepDischargeReminder(async (reminder) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, 400, 300);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(15, 15, 370, 270);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.strokeRect(15, 15, 370, 270);

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText('BATTERY HEALTH NOTICE', 35, 55);

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(`Plugged In: ${reminder.hours}h Continuous (>72h)`, 35, 95);

          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText('Action: Deep Discharge Cycle', 35, 135);

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '13px sans-serif';
          ctx.fillText('1. Unplug charger from phone.', 35, 175);
          ctx.fillText('2. Allow battery to drain to ~20-30%.', 35, 205);
          ctx.fillText('3. Plug charger back in to reset gauge.', 35, 235);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '11px sans-serif';
          ctx.fillText('Prevents Li-ion pouch swelling and cell decay.', 35, 265);
        }
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const encrypted = await encryptData(dataUrl, settings.encryptionPin);

        const healthEvent: SecurityEvent = {
          id: `deep_discharge_${Date.now()}`,
          cameraId: 'cam1',
          cameraName: mode === 'camera' ? 'Camera 1 (Old Phone)' : 'Home System Station',
          timestamp: Date.now(),
          motionIntensity: 100,
          eventType: 'battery_health',
          snapshotEncrypted: encrypted.ciphertext,
          iv: encrypted.iv,
          thermalState: thermal,
          batteryLevel: battery.level,
          notes: `Deep discharge cycle reminder: Device has been plugged in continuously for ${reminder.hours} hours (>72h). Per Li-ion health recommendations, unplug the charger and allow the phone to discharge down to 20-30% before recharging to avoid lithium plating and cell oxidation.`,
          decryptedSnapshot: dataUrl,
          aiSummary: `Battery Health Reminder: ${reminder.hours}h continuous charging detected. Deep discharge recommended.`,
          aiConfidence: 100,
          isCloudSynced: false,
        };

        handleNewSecurityEvent(healthEvent);
        speakSeniorVoice(`Battery health notice: The phone has been plugged in for more than 72 hours. Please unplug for a deep discharge cycle.`);
      } catch (e) {
        console.warn('Failed to record deep discharge event:', e);
      }
    });

    return unsubReminder;
  }, [settings.encryptionPin, thermal, battery.level, mode, handleNewSecurityEvent]);

  // Trigger Voice SOS Emergency event to all Viewer devices
  const triggerVoiceSOSEmergency = useCallback(
    async (detectedPhrase: string) => {
      const now = Date.now();
      // 5-second cooldown to prevent multi-triggering
      if (now - lastVoiceSosTriggerRef.current < 5000) {
        return;
      }
      lastVoiceSosTriggerRef.current = now;

      try {
        // 1. Generate encrypted snapshot frame for this emergency event
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#450a0a';
          ctx.fillRect(0, 0, 400, 300);
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(20, 20, 360, 260);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 4;
          ctx.strokeRect(20, 20, 360, 260);

          ctx.fillStyle = '#fee2e2';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText('🚨 VOICE SOS EMERGENCY', 40, 65);

          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(`Distress Phrase: "${detectedPhrase}"`, 40, 110);

          ctx.fillStyle = '#fecaca';
          ctx.font = '14px sans-serif';
          ctx.fillText('Detected via Web Speech API (Hands-Free)', 40, 145);
          ctx.fillText(`Time: ${new Date(now).toLocaleTimeString()}`, 40, 175);
          ctx.fillText('Emergency alert broadcast to all Viewers', 40, 205);

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '11px sans-serif';
          ctx.fillText('HGuard Senior Hands-Free Voice Protection', 40, 245);
        }
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        const encrypted = await encryptData(dataUrl, settings.encryptionPin);

        const targetSlot = (localStorage.getItem('HGUARD_CAM_SLOT') as CameraSlot) || 'cam1';
        const cameraName = mode === 'camera' ? `Camera (${targetSlot.toUpperCase()})` : 'Home Guardian Station';

        const sosEvent: SecurityEvent = {
          id: `voice_sos_${now}`,
          cameraId: targetSlot,
          cameraName,
          timestamp: now,
          motionIntensity: 100,
          eventType: 'voice_help',
          snapshotEncrypted: encrypted.ciphertext,
          iv: encrypted.iv,
          thermalState: thermal,
          batteryLevel: battery.level,
          notes: `Voice SOS detected phrase: "${detectedPhrase}"`,
          decryptedSnapshot: dataUrl,
          aiSummary: `🚨 EMERGENCY VOICE SOS: Spoken distress detected ("${detectedPhrase}"). Immediate emergency notification dispatched to Family Viewer devices.`,
          aiConfidence: 99,
          isCloudSynced: false,
        };

        // 2. Broadcast event to connected Viewer stations via MQTT and BroadcastChannel
        globalStreamChannel.broadcastSecurityEvent(sosEvent);

        // 3. Send remote command to immediately sound loud sirens on all Viewers
        globalStreamChannel.sendRemoteCommand('VOICE_SOS_TRIGGERED', 'all', {
          phrase: detectedPhrase,
          timestamp: now,
          cameraId: targetSlot,
          cameraName,
        });

        // 4. Save to local event history
        handleNewSecurityEvent(sosEvent);

        // 5. Sound local audible alarm and spoken feedback
        playEmergencyAlarmSiren(2);
        if (settings.seniorVoiceAlerts) {
          speakSeniorVoice('Emergency Voice SOS detected. Alerting your family viewer devices right now.');
        }

        // 6. Show active banner
        setVoiceSosAlertToast({ phrase: detectedPhrase, time: now });
        setTimeout(() => {
          setVoiceSosAlertToast((curr) => (curr?.time === now ? null : curr));
        }, 12000);
      } catch (e) {
        console.warn('Failed to trigger Voice SOS emergency event:', e);
      }
    },
    [settings.encryptionPin, settings.seniorVoiceAlerts, mode, thermal, battery.level, handleNewSecurityEvent]
  );

  // Continuous Voice SOS Web Speech API Listener: Detects 'Help', 'I fell', 'I need assistance'
  useEffect(() => {
    if (!voiceSosEnabled) {
      setVoiceSosListening(false);
      return;
    }

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSosSupported(false);
      return;
    }

    setVoiceSosSupported(true);
    let recognition: any = null;
    let isCancelled = false;
    let restartTimer: any = null;

    const startRecognition = () => {
      if (isCancelled) return;
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          if (!isCancelled) {
            setVoiceSosListening(true);
          }
        };

        recognition.onresult = (event: any) => {
          if (isCancelled) return;
          let fullTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0]?.transcript || '';
            fullTranscript += ' ' + transcript;
          }

          const cleaned = fullTranscript.toLowerCase().trim();
          if (cleaned) {
            setVoiceSosTranscript(cleaned);
          }

          // Check for distress keywords
          const distressWords = [
            'help',
            'help me',
            'i fell',
            'fallen',
            'emergency',
            'call someone',
            'hurts',
            'pain',
            'please help',
            'somebody help',
            'cannot get up',
            "can't get up",
            'doctor',
            'ambulance',
            'fell down',
            'fall',
          ];

          const isDistress = distressWords.some((word) => cleaned.includes(word.toLowerCase()));
          if (isDistress) {
            const matchedWord = distressWords.find((w) => cleaned.includes(w.toLowerCase())) || 'Help';
            triggerVoiceSOSEmergency(matchedWord);
          }

          // Check for verbal cancellation / clearing
          const cancelWords = [
            'i am okay',
            "i'm okay",
            'i am fine',
            "i'm fine",
            'false alarm',
            'cancel alert',
            "it's okay",
            'all good',
          ];

          if (cancelWords.some((word) => cleaned.includes(word.toLowerCase()))) {
            globalStreamChannel.sendRemoteCommand('SENIOR_OKAY', 'all', { keyword: 'I am okay' });
            speakSeniorVoice('Alert cleared. Family notified you are okay.');
            setVoiceSosAlertToast(null);
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'not-allowed') {
            setVoiceSosListening(false);
          }
        };

        recognition.onend = () => {
          if (!isCancelled && voiceSosEnabled) {
            restartTimer = setTimeout(() => {
              startRecognition();
            }, 800);
          } else {
            setVoiceSosListening(false);
          }
        };

        recognition.start();
      } catch (err) {
        if (!isCancelled && voiceSosEnabled) {
          restartTimer = setTimeout(() => {
            startRecognition();
          }, 1500);
        }
      }
    };

    startRecognition();

    return () => {
      isCancelled = true;
      if (restartTimer) clearTimeout(restartTimer);
      if (recognition) {
        try {
          recognition.abort();
        } catch {}
      }
      setVoiceSosListening(false);
    };
  }, [voiceSosEnabled, triggerVoiceSOSEmergency]);

  const handleClearEvents = useCallback(() => {
    setEvents([]);
    try {
      localStorage.removeItem('HGUARD_ENCRYPTED_EVENTS_V1');
    } catch {
      // ignore
    }
  }, []);

  const handleImportEvents = useCallback((imported: SecurityEvent[]) => {
    setEvents((prev) => {
      const combined = [...imported, ...prev].slice(0, 80);
      try {
        const storageSafe = combined.map(({ decryptedSnapshot, ...rest }) => rest);
        localStorage.setItem('HGUARD_ENCRYPTED_EVENTS_V1', JSON.stringify(storageSafe));
      } catch {
        // ignore
      }
      return combined;
    });
  }, []);

  const handleSelectMode = (m: AppMode) => {
    setMode(m);
    try {
      localStorage.setItem('HGUARD_ACTIVE_MODE', m);
    } catch {}
    if (settings.seniorVoiceAlerts) {
      speakSeniorVoice(
        m === 'camera'
          ? 'Senior camera active. Hands-free listening and fall detection armed.'
          : m === 'viewer'
          ? 'Master Viewer Monitor active.'
          : 'Role selector'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black">
      {/* SENIOR TOP NAVIGATION */}
      <SeniorTopNav
        mode={mode}
        onSelectMode={handleSelectMode}
        battery={battery}
        thermal={thermal}
        unreadAlertsCount={events.length}
        user={user}
        onOpenEvents={() => setIsEventsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCloudStorage={() => setIsCloudStorageOpen(true)}
        onOpenAIExplainer={() => setIsAIExplainerOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAnimationDemo={() => setIsAnimationDemoOpen(true)}
        onOpenSetupGuide={() => setIsStepGuideOpen(true)}
        onOpenSeniorGuide={() => setIsSeniorGuideOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenPairingQR={() => {
          setSelectedPairingSlot('cam1');
          setIsPairingQrOpen(true);
        }}
        onOpenPairingScanner={() => setIsPairingScannerOpen(true)}
        unpluggedWarning={unpluggedWarning}
        offlineCamerasCount={offlineCamerasCount}
        onOpenHeartbeatChecker={() => setIsHeartbeatModalOpen(true)}
      />

      {/* VOICE SOS EMERGENCY STATUS & CONTROLS STRIP */}
      <div className="bg-slate-900 border-b border-slate-800 px-2.5 py-1.5 sm:px-4 sm:py-2 select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-[2px] font-black text-[11px] sm:text-xs uppercase tracking-wide transition shadow shrink-0 ${
                voiceSosListening
                  ? 'bg-red-950 text-red-300 border-2 border-red-500 animate-pulse'
                  : voiceSosEnabled
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {voiceSosEnabled ? <Mic className="w-3.5 h-3.5 text-red-400" /> : <MicOff className="w-3.5 h-3.5" />}
              <span>
                {voiceSosListening ? (
                  <>
                    <span className="hidden md:inline">Voice SOS Ear: ACTIVE 🎙️ (Listens for &quot;Help&quot;, &quot;I fell&quot;)</span>
                    <span className="md:hidden">Voice SOS: ACTIVE 🎙️</span>
                  </>
                ) : voiceSosSupported ? (
                  <>
                    <span className="hidden sm:inline">Voice SOS: Armed (Web Speech API)</span>
                    <span className="sm:hidden">Voice SOS: Armed</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Voice SOS: Ready (Simulation)</span>
                    <span className="sm:hidden">Voice SOS: Ready</span>
                  </>
                )}
              </span>
            </div>

            {voiceSosTranscript && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded-[2px] border border-slate-800 max-w-xs truncate">
                <Volume2 className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">Heard: &quot;{voiceSosTranscript}&quot;</span>
              </span>
            )}
          </div>

          {/* Quick simulation buttons to trigger emergency event to Viewer device */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
            <button
              id="simulate-voice-sos-help-btn"
              type="button"
              onClick={() => triggerVoiceSOSEmergency('Help')}
              className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-[10px] sm:text-[11px] rounded-[2px] flex items-center gap-1 transition shadow border border-red-400 shrink-0"
              title="Test Voice SOS: Triggers emergency siren and event on Viewer device"
            >
              <AlertOctagon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">TEST SOS: &quot;HELP&quot;</span>
              <span className="xs:hidden">TEST SOS</span>
            </button>
            <button
              id="simulate-voice-sos-fell-btn"
              type="button"
              onClick={() => triggerVoiceSOSEmergency('I fell')}
              className="hidden sm:flex px-2 py-0.5 sm:py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10px] sm:text-[11px] rounded-[2px] items-center gap-1 border border-slate-700 transition shrink-0"
              title="Test Voice SOS: Triggers emergency event for 'I fell'"
            >
              <span>Test &quot;I fell&quot;</span>
            </button>
            <button
              id="simulate-voice-sos-assistance-btn"
              type="button"
              onClick={() => triggerVoiceSOSEmergency('I need assistance')}
              className="hidden lg:flex px-2 py-0.5 sm:py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-[10px] sm:text-[11px] rounded-[2px] items-center gap-1 border border-slate-700 transition shrink-0"
              title="Test Voice SOS: Triggers emergency event for 'I need assistance'"
            >
              <span>Test &quot;Assistance&quot;</span>
            </button>
            <button
              id="toggle-voice-sos-listener-btn"
              type="button"
              onClick={() => setVoiceSosEnabled(!voiceSosEnabled)}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] sm:text-[11px] font-bold rounded-[2px] border border-slate-700 transition shrink-0"
            >
              {voiceSosEnabled ? 'Mute' : 'Unmute'}
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE EMERGENCY VOICE SOS BANNER (LOUD VISUAL ALARM) */}
      {voiceSosAlertToast && (
        <div
          id="voice-sos-emergency-toast-banner"
          className="bg-red-950 border-b-4 border-red-500 px-4 py-3 text-white shadow-2xl animate-pulse"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-left">
              <div className="w-11 h-11 rounded-[2px] bg-red-600 text-white flex items-center justify-center shrink-0 border-2 border-white shadow-lg">
                <AlertOctagon className="w-7 h-7 animate-bounce" />
              </div>
              <div>
                <div className="text-xs uppercase font-black tracking-wider text-red-300 flex items-center gap-2">
                  <span>🚨 EMERGENCY VOICE SOS ACTIVE</span>
                  <span className="bg-red-800 text-white text-[10px] px-2 py-0.5 rounded-[2px] font-mono">
                    {new Date(voiceSosAlertToast.time).toLocaleTimeString()}
                  </span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-[2px] font-bold">
                    Viewer Alarmed
                  </span>
                </div>
                <div className="text-sm sm:text-base font-black text-white">
                  Senior Spoken Distress: &quot;{voiceSosAlertToast.phrase}&quot; • Emergency event &amp; sirens dispatched to all Viewers!
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="voice-sos-clear-okay-btn"
                type="button"
                onClick={() => {
                  globalStreamChannel.sendRemoteCommand('SENIOR_OKAY', 'all', { keyword: 'I am okay' });
                  speakSeniorVoice('Alert cleared. Family notified you are okay.');
                  setVoiceSosAlertToast(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs rounded-[2px] border border-emerald-300 shadow transition"
              >
                ✓ I AM OKAY (CLEAR ALERTS)
              </button>
              <button
                id="voice-sos-dismiss-banner-btn"
                type="button"
                onClick={() => setVoiceSosAlertToast(null)}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-[2px] border border-slate-700 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* MODE SELECTOR (ROLE CHOOSER) */}
        {mode === 'select' && (
          <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full py-2">
            {/* Header with Autonomous AI Status */}
            <div className="text-center flex flex-col items-center gap-2.5">
              <div className="inline-flex items-center gap-2 bg-slate-900 border border-amber-500/50 px-3.5 py-1.5 rounded-[2px] text-amber-300 font-bold text-xs tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>AI Auto-Upgrade Active • Gemini Vision Self-Updating</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                HGUARD HOME MONITOR
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-medium max-w-lg">
                Turn your old phones into security cameras. Up to 6 cameras and 3 concurrent viewers.
              </p>
            </div>

            {/* QUICK 1-STEP SENIOR SETUP & GMAIL LOGIN / DRIVE PROMPT */}
            {user.loggedIn && user.email ? (
              <div className="bg-slate-900 border border-slate-700 p-4 rounded-[2px] flex flex-col gap-3 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-[2px] bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-black border border-red-500/30">
                      G
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Signed in with Gmail:</span>
                      <span className="text-sm font-bold text-white font-mono">{user.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAccountOpen(true)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-[2px] border border-slate-600 transition"
                    >
                      Account / PIN
                    </button>
                    <button
                      type="button"
                      id="home-banner-sign-out-btn"
                      onClick={handleSignOut}
                      className="px-3 py-1 bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-bold rounded-[2px] border border-red-700/60 flex items-center gap-1.5 transition"
                      title="Sign out of current Gmail"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>

                {/* DRIVE PROMPT: Like if you sign in with Gmail, then it asks store on Google drive, yes, connect it */}
                {user.googleDriveAutoBackup ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-950/40 border border-emerald-500/40 p-2.5 rounded-[2px]">
                    <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Google Drive connected: recordings saved to /HGuard_Surveillance</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCloudStorageOpen(true)}
                      className="text-xs text-sky-300 underline hover:text-sky-200 font-bold"
                    >
                      View Vault
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-950/30 border border-amber-500/40 p-3 rounded-[2px]">
                    <div className="flex items-center gap-2.5">
                      <Cloud className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <strong className="text-sm font-black text-white block">Store recordings on Google Drive?</strong>
                        <span className="text-xs text-slate-300">Save motion clips and alerts securely in your own Google Drive.</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        id="hero-connect-drive-yes-btn"
                        onClick={() => {
                          handleUpdateUser({ googleDriveAutoBackup: true, googleDriveEnabled: true });
                          if (settings.seniorVoiceAlerts) {
                            speakSeniorVoice('Google Drive connected. Recordings will be saved automatically.');
                          }
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs rounded-[2px] border border-emerald-400 flex items-center gap-1.5 transition shadow"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>YES, CONNECT IT</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateUser({ googleDriveAutoBackup: false });
                        }}
                        className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold rounded-[2px] border border-slate-700 transition"
                      >
                        Not now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-700 p-4 rounded-[2px] flex flex-col gap-3 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-[2px] bg-red-600 text-white flex items-center justify-center text-xs font-black shadow">
                      G
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">Sign In with Gmail</h3>
                      <p className="text-xs text-slate-400">
                        Use any personal or family @gmail.com account to securely link your cameras & viewers
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-[2px] border border-slate-700">
                    Signed Out
                  </span>
                </div>

                {/* Form to sign in with ANY Gmail address */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCustomGmailLogin();
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmailInput}
                      onChange={(e) => setLoginEmailInput(e.target.value)}
                      placeholder="Enter any Gmail address (e.g. yourname@gmail.com)"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-[2px] text-white text-xs focus:border-red-500 focus:outline-none placeholder-slate-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    id="home-signin-gmail-btn"
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-xs rounded-[2px] flex items-center justify-center gap-1.5 transition shadow shrink-0"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>SIGN IN WITH GMAIL</span>
                  </button>
                </form>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span>Quick Fill:</span>
                    <button
                      type="button"
                      onClick={() => handleCustomGmailLogin('drshahenyashpal@gmail.com')}
                      className="text-amber-400 underline hover:text-amber-300 font-mono"
                    >
                      drshahenyashpal@gmail.com
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAccountOpen(true)}
                    className="text-slate-300 hover:text-white underline font-semibold"
                  >
                    PIN & Advanced Account Settings
                  </button>
                </div>
              </div>
            )}

            {/* 1-CLICK CAMERA & VIEWER SETUP: Streamlined, minimal reading, maximum clarity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* OPTION 1: CAMERA (SENIOR'S OLD PHONE) */}
              <div
                id="select-camera-card"
                className="bg-slate-900 border-2 border-emerald-500 rounded-[2px] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-2xl relative"
              >
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-emerald-600 rounded-[2px] flex items-center justify-center text-white shadow-lg">
                      <Camera className="w-7 h-7" />
                    </div>
                    <span className="bg-emerald-500 text-slate-950 text-xs font-black uppercase px-2.5 py-1 rounded-[2px] shadow">
                      Old Phone • Zero-Touch
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Setup as Camera
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-400 font-bold mt-0.5">
                      Place this old phone anywhere • 24/7 AI guardian
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-200 font-medium bg-slate-950/70 p-3 rounded-[2px] border border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Voice SOS Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Fall Detection</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Hands-Free Mic</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Battery Health 80%</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full pt-1">
                  <button
                    id="select-camera-role-btn"
                    onClick={() => {
                      setMode('camera');
                      if (settings.seniorVoiceAlerts) {
                        speakSeniorVoice('Starting all-in-one senior guardian camera.');
                      }
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 font-black text-sm sm:text-base rounded-[2px] flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Start Camera (1-Click)</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    id="camera-scan-viewer-qr-btn"
                    onClick={() => setIsPairingScannerOpen(true)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs rounded-[2px] flex items-center justify-center gap-1.5 transition border border-emerald-500/50 cursor-pointer"
                    title="Scan QR on Viewer phone to pair instantly"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Scan Viewer QR</span>
                  </button>
                </div>
              </div>

              {/* OPTION 2: VIEWER (FAMILY MEMBER MONITOR) */}
              <div
                id="select-viewer-card"
                className="bg-slate-900 border-2 border-cyan-500 rounded-[2px] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-2xl relative"
              >
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-cyan-600 rounded-[2px] flex items-center justify-center text-white shadow-lg">
                      <Eye className="w-7 h-7" />
                    </div>
                    <span className="bg-cyan-500 text-slate-950 text-xs font-black uppercase px-2.5 py-1 rounded-[2px] shadow">
                      Family Station • Any Screen
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Setup as Viewer
                    </h2>
                    <p className="text-xs sm:text-sm text-cyan-400 font-bold mt-0.5">
                      Watch live feeds on this phone, tablet, or PC
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-200 font-medium bg-slate-950/70 p-3 rounded-[2px] border border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>All Cameras Grid</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Instant Fall Siren</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>2-Way Talk Intercom</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Encrypted &amp; Private</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full pt-1">
                  <button
                    id="select-viewer-role-btn"
                    onClick={() => {
                      setMode('viewer');
                      if (settings.seniorVoiceAlerts) {
                        speakSeniorVoice('Opening family viewer monitor.');
                      }
                    }}
                    className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-slate-950 font-black text-sm sm:text-base rounded-[2px] flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Start Viewer (1-Click)</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    id="viewer-show-camera-qr-btn"
                    onClick={() => {
                      setSelectedPairingSlot('cam1');
                      setIsPairingQrOpen(true);
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-[2px] flex items-center justify-center gap-1.5 transition border border-cyan-500/50 cursor-pointer"
                    title="Display QR code for phone camera to scan"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Show Pairing QR</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SECONDARY UTILITIES: Compact, non-intrusive strip */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                id="hero-open-animation-demo-btn"
                onClick={() => setIsAnimationDemoOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-[2px] border border-amber-500/40 flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Animation Demo (6 Cams • 3 Viewers)</span>
              </button>
              <button
                id="hero-open-step-guide-btn"
                onClick={() => setIsStepGuideOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs rounded-[2px] border border-emerald-500/40 flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Step-by-Step Guide</span>
              </button>
              <button
                id="hero-open-senior-guide-btn"
                onClick={() => setIsSeniorGuideOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-200 font-bold text-xs rounded-[2px] border border-emerald-500/40 flex items-center gap-1.5 transition"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Senior Reassurance</span>
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE CAMERA VIEW (OLD PHONE) */}
        {mode === 'camera' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-[2px] bg-emerald-500 animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-black text-white">CAMERA UNIT (OLD PHONE)</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="switch-to-viewer-btn"
                  onClick={() => setMode('viewer')}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-xs rounded-[2px] border border-slate-700 transition"
                >
                  Switch to Viewer
                </button>
                <button
                  id="back-to-select-btn"
                  onClick={() => setMode('select')}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-[2px] border border-slate-700 transition"
                >
                  Roles
                </button>
              </div>
            </div>

            <CameraView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onNewSecurityEvent={handleNewSecurityEvent}
              battery={battery}
              thermal={thermal}
              setBattery={setBattery}
              setThermal={setThermal}
              user={user}
              onOpenQRScanner={() => setIsPairingScannerOpen(true)}
            />
          </div>
        )}

        {/* ACTIVE MASTER VIEWER MONITOR (6 CAMERAS & 3 VIEWERS) */}
        {mode === 'viewer' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-[2px] bg-cyan-400 animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-black text-white">MASTER VIEWER MONITOR</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="switch-to-camera-btn"
                  onClick={() => setMode('camera')}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-black text-xs rounded-[2px] border border-slate-700 transition"
                >
                  Switch to Camera
                </button>
                <button
                  id="back-to-select-viewer-btn"
                  onClick={() => setMode('select')}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-[2px] border border-slate-700 transition"
                >
                  Roles
                </button>
              </div>
            </div>

            <MonitorView
              settings={settings}
              onOpenEvents={() => setIsEventsOpen(true)}
              onOpenCloudStorage={() => setIsCloudStorageOpen(true)}
              onOpenAIExplainer={() => setIsAIExplainerOpen(true)}
              onNewSecurityEvent={handleNewSecurityEvent}
              onOpenShare={() => setIsShareOpen(true)}
              onOpenPairingQR={(slot) => {
                if (slot) setSelectedPairingSlot(slot);
                setIsPairingQrOpen(true);
              }}
              userEmail={user.email}
            />
          </div>
        )}
      </main>

      {/* SHARE LINK MODAL FOR FRIENDS & RELATIVES */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        encryptionPin={settings.encryptionPin}
        userEmail={user.email}
        onOpenPairingQR={(slot) => {
          if (slot) setSelectedPairingSlot(slot);
          setIsPairingQrOpen(true);
        }}
      />

      {/* ACCOUNT PROFILE & LOGIN MODAL */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
      />

      {/* 30-DAY CLOUD STORAGE VAULT & TIMELINE MODAL */}
      <CloudStorageModal
        isOpen={isCloudStorageOpen}
        onClose={() => setIsCloudStorageOpen(false)}
        localEvents={events}
        encryptionPin={settings.encryptionPin}
        userEmail={user.email}
        googleDriveWebhookUrl={user.googleDriveWebhookUrl}
      />

      {/* AI EXPLAINER & LIVE PLAYGROUND MODAL */}
      <AIExplainerModal
        isOpen={isAIExplainerOpen}
        onClose={() => setIsAIExplainerOpen(false)}
      />

      {/* ENCRYPTED EVENT LOG MODAL */}
      <EventLogModal
        isOpen={isEventsOpen}
        onClose={() => setIsEventsOpen(false)}
        events={events}
        onClearEvents={handleClearEvents}
        onImportEvents={handleImportEvents}
        currentPin={settings.encryptionPin}
      />

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSystemInfo={() => setIsSystemInfoOpen(true)}
      />

      {/* SYSTEM & SECURITY SPECIFICATIONS (ALL IN 1 PLACE) */}
      <SystemInfoModal
        isOpen={isSystemInfoOpen}
        onClose={() => setIsSystemInfoOpen(false)}
        encryptionPin={settings.encryptionPin}
      />

      {/* VISUAL ANIMATION DEMO MODAL */}
      <VisualAnimationDemoModal
        isOpen={isAnimationDemoOpen}
        onClose={() => setIsAnimationDemoOpen(false)}
        onLaunchCamera={(slot) => {
          setMode('camera');
          setIsAnimationDemoOpen(false);
        }}
        onLaunchViewer={(station) => {
          setMode('viewer');
          setIsAnimationDemoOpen(false);
        }}
      />

      {/* STEP-BY-STEP SETUP GUIDE MODAL */}
      <StepByStepGuideModal
        isOpen={isStepGuideOpen}
        onClose={() => setIsStepGuideOpen(false)}
        userEmail={user.email}
        encryptionPin={settings.encryptionPin}
        onSelectMode={(m) => {
          setMode(m);
          setIsStepGuideOpen(false);
        }}
      />

      {/* INSTANT PAIRING QR CODE MODAL FOR VIEWER */}
      <PairingQRModal
        isOpen={isPairingQrOpen}
        onClose={() => setIsPairingQrOpen(false)}
        userEmail={user.email}
        encryptionPin={settings.encryptionPin}
        initialSlot={selectedPairingSlot}
      />

      {/* CAMERA SCANNER MODAL FOR OLD PHONES */}
      <PairingQRScannerModal
        isOpen={isPairingScannerOpen}
        onClose={() => setIsPairingScannerOpen(false)}
        onPairSuccess={handlePairSuccess}
      />

      {/* SENIOR QUICK GUIDE MODAL */}
      <SeniorQuickGuideModal
        isOpen={isSeniorGuideOpen}
        onClose={() => setIsSeniorGuideOpen(false)}
        onTriggerSOS={() => {
          speakSeniorVoice('Help is called. Alerting your family right now.');
        }}
      />

      {/* NETWORK HEARTBEAT CHECKER MODAL */}
      <HeartbeatStatusModal
        isOpen={isHeartbeatModalOpen}
        onClose={() => setIsHeartbeatModalOpen(false)}
        onOpenEventLog={() => setIsEventsOpen(true)}
      />

      {/* PAIRING STATUS TOAST NOTIFICATION */}
      {pairingToast && (
        <div
          id="hguard-pairing-success-toast"
          className="fixed bottom-5 right-5 max-w-sm sm:max-w-md bg-emerald-950/95 border-2 border-emerald-400 p-3.5 rounded-[2px] shadow-2xl z-50 flex items-center gap-3 text-white backdrop-blur animate-bounce"
        >
          <div className="w-8 h-8 rounded-[2px] bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-black">
            ✓
          </div>
          <div className="flex-1 text-xs">
            <strong className="block font-black text-emerald-300 uppercase tracking-wide">
              Zero Setup Pairing Confirmed
            </strong>
            <span className="text-slate-200">{pairingToast}</span>
          </div>
          <button
            onClick={() => setPairingToast(null)}
            className="text-slate-400 hover:text-white text-sm font-black p-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
