import React, { useState, useEffect, useCallback } from 'react';
import { AppMode, AppSettings, SecurityEvent, UserProfile, CameraSlot } from './types';
import { SeniorTopNav } from './components/SeniorTopNav';
import { CameraView } from './components/CameraView';
import { MonitorView } from './components/MonitorView';
import { AccountModal } from './components/AccountModal';
import { CloudStorageModal } from './components/CloudStorageModal';
import { EventLogModal } from './components/EventLogModal';
import { HeartbeatStatusModal } from './components/HeartbeatStatusModal';
import { AIExplainerModal } from './components/AIExplainerModal';
import { StepByStepGuideModal } from './components/StepByStepGuideModal';
import { ShareModal } from './components/ShareModal';
import { SettingsModal } from './components/SettingsModal';
import { AnnouncementModal } from './components/AnnouncementModal';
import { SystemInfoModal } from './components/SystemInfoModal';
import { PairingQRModal } from './components/PairingQRModal';
import { PairingQRScannerModal } from './components/PairingQRScannerModal';
import { globalStreamChannel } from './utils/streamChannel';
import { globalHeartbeatService } from './utils/heartbeatService';
import { playSirenAlert, playRogerBeep, speakSeniorVoice } from './utils/soundAlerts';

const DEFAULT_SETTINGS: AppSettings = {
  motionSensitivity: 'medium',
  detectionZone: 'full',
  motionCooldownSec: 10,
  aiDetectionEnabled: true,
  aiPersonDetection: true,
  aiPetDetection: false,
  aiVehicleDetection: false,
  aiLingeringDetection: true,
  aiBabyCryDetection: false,
  aiFrameBoxesVisible: true,
  continuousRecording: false,
  recordingClipDuration: 30,
  cloudStorageEnabled: true,
  showWatermark: true,
  showTimestamp: true,
  resolutionMode: '720p',
  bandwidthMode: 'balanced',
  batteryHealthCap: 80,
  batteryAlarmEnabled: true,
  smartPlugWebhookUrl: '',
  ecoCoolScreenEnabled: true, // ON BY DEFAULT: Dims phone screen to black after 15s to eliminate heat
  ecoCoolDelaySec: 15,
  thermalThrottleFps: true,
  seniorVoiceAlerts: true,
  highContrast: false,
  largeFonts: false,
  alarmSoundEnabled: true,
  seniorCareMode: true,
  fallDetectionEnabled: true,
  voiceHelpKeywordEnabled: true,
  autoAnswerIntercomEnabled: true,
  bathroomPrivacyShield: false,
  nightWanderingAlertEnabled: true,
  // NIGHT VISION OFF BY DEFAULT: Prevents unwanted green/IR tint in normal daytime/room light
  autoNightVisionOnLowLight: false,
  autoTorchOnPitchDark: false,
  lowLightThreshold: 20,
  pitchDarkThreshold: 10,
  encryptionPin: '8888',
};

const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Primary Household',
  email: '',
  plan: 'Premium Plus',
  activeCamerasAllowed: 6,
  concurrentViewersAllowed: 3,
  cloudRetentionDays: 30,
  loggedIn: false,
  passPin: '8888',
  cloudSyncEnabled: true,
  isAuthed: false,
  authMethod: 'local',
  privacyMode: true,
};

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    return role === 'camera' ? 'camera' : 'viewer';
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('hguard_user_profile');
      if (saved) {
        return { ...DEFAULT_USER_PROFILE, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_USER_PROFILE;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('hguard_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [events, setEvents] = useState<SecurityEvent[]>(() => {
    try {
      const saved = localStorage.getItem('hguard_events');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Modals state
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isCloudStorageOpen, setIsCloudStorageOpen] = useState(false);
  const [isEventLogOpen, setIsEventLogOpen] = useState(false);
  const [isHeartbeatOpen, setIsHeartbeatOpen] = useState(false);
  const [isAIExplainerOpen, setIsAIExplainerOpen] = useState(false);
  const [isStepGuideOpen, setIsStepGuideOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isSystemInfoOpen, setIsSystemInfoOpen] = useState(false);
  const [isPairingQROpen, setIsPairingQROpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [targetPairingSlot, setTargetPairingSlot] = useState<CameraSlot>('cam1');

  // URL query parameter parsing on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pinParam = params.get('pin');
    const userParam = params.get('user');
    const camParam = params.get('cam');
    if (pinParam) {
      setSettings((prev) => ({ ...prev, encryptionPin: pinParam }));
    }
    if (userParam && !userProfile.email) {
      setUserProfile((prev) => ({
        ...prev,
        email: decodeURIComponent(userParam),
        isAuthed: true,
      }));
    }
    if (camParam && ['cam1', 'cam2', 'cam3', 'cam4', 'cam5', 'cam6'].includes(camParam)) {
      setTargetPairingSlot(camParam as CameraSlot);
    }
  }, []);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('hguard_settings', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleUpdateUserProfile = (newProfile: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const updated = { ...prev, ...newProfile };
      try {
        localStorage.setItem('hguard_user_profile', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleRecordEvent = useCallback((event: SecurityEvent) => {
    setEvents((prev) => {
      const updated = [event, ...prev.slice(0, 99)];
      try {
        localStorage.setItem('hguard_events', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const handleTriggerSOS = () => {
    playSirenAlert();
    speakSeniorVoice('Emergency alert activated. Calling family guardian now.');
    globalStreamChannel.sendCameraCommand({
      command: 'trigger_siren',
      timestamp: Date.now(),
    });
    handleRecordEvent({
      id: `sos-${Date.now()}`,
      cameraId: 'cam1',
      cameraName: 'Emergency SOS',
      timestamp: Date.now(),
      motionIntensity: 100,
      thermalState: 'normal',
      batteryLevel: 100,
      notes: 'MANUAL EMERGENCY SOS ACTIVATED BY USER',
      eventType: 'motion',
      snapshotEncrypted: '',
      iv: '',
    });
  };

  const handleOpenPairingQR = (slot?: CameraSlot) => {
    if (slot) setTargetPairingSlot(slot);
    setIsPairingQROpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* STREAMLINED TOP NAVIGATION (CLUTTER REMOVED) */}
      <SeniorTopNav
        appMode={appMode}
        onSetAppMode={(mode) => setAppMode(mode)}
        onOpenShareModal={() => setIsShareOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onOpenAnnouncementModal={() => setIsAnnouncementOpen(true)}
        onOpenHeartbeatModal={() => setIsHeartbeatOpen(true)}
        onTriggerSOS={handleTriggerSOS}
        eventCount={events.length}
      />

      {/* MAIN VIEW AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {appMode === 'camera' ? (
          <CameraView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onRecordEvent={handleRecordEvent}
            onOpenQRScanner={() => setIsQRScannerOpen(true)}
            onSwitchToViewer={() => setAppMode('viewer')}
          />
        ) : (
          <MonitorView
            settings={settings}
            onOpenPairingQR={handleOpenPairingQR}
            onOpenHeartbeatModal={() => setIsHeartbeatOpen(true)}
            onOpenEventLogModal={() => setIsEventLogOpen(true)}
          />
        )}
      </main>

      {/* MODALS (ORGANIZED & ACCESSIBLE FROM SETTINGS OR PRIMARY ACTIONS) */}
      {/* 1. Share & Pairing Modal (Fixes "cant close share window", provides 3 simple methods) */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        encryptionPin={settings.encryptionPin}
        userEmail={userProfile?.email || ''}
        onOpenPairingQR={handleOpenPairingQR}
      />

      {/* 2. Fullscreen QR Display Modal */}
      <PairingQRModal
        isOpen={isPairingQROpen}
        onClose={() => setIsPairingQROpen(false)}
        userEmail={userProfile?.email || ''}
        encryptionPin={settings.encryptionPin}
        initialCameraSlot={targetPairingSlot}
      />

      {/* 3. Camera QR Scanner Modal */}
      <PairingQRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onPairSuccess={(payload) => {
          if (payload.pin) {
            handleUpdateSettings({ encryptionPin: payload.pin });
          }
          if (payload.email) {
            handleUpdateUserProfile({ email: payload.email, isAuthed: true });
          }
          setIsQRScannerOpen(false);
          speakSeniorVoice(`Paired with Viewer as ${payload.slot.toUpperCase()}`);
        }}
      />

      {/* 4. Settings & Tools Modal (De-clutter Hub) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenEventLogModal={() => setIsEventLogOpen(true)}
        onOpenCloudStorageModal={() => setIsCloudStorageOpen(true)}
        onOpenHeartbeatModal={() => setIsHeartbeatOpen(true)}
        onOpenAIExplainer={() => setIsAIExplainerOpen(true)}
        onOpenStepGuideModal={() => setIsStepGuideOpen(true)}
        onOpenSystemInfo={() => setIsSystemInfoOpen(true)}
        onOpenAccountModal={() => setIsAccountOpen(true)}
        eventCount={events.length}
      />

      {/* 5. Event Log Modal */}
      <EventLogModal
        isOpen={isEventLogOpen}
        onClose={() => setIsEventLogOpen(false)}
        events={events}
        onClearEvents={() => {
          setEvents([]);
          localStorage.removeItem('hguard_events');
        }}
        onImportEvents={(imported) => {
          setEvents((prev) => [...imported, ...prev]);
        }}
        currentPin={settings.encryptionPin}
      />

      {/* 6. Cloud Storage Modal */}
      <CloudStorageModal
        isOpen={isCloudStorageOpen}
        onClose={() => setIsCloudStorageOpen(false)}
        localEvents={events}
        encryptionPin={settings.encryptionPin}
        userEmail={userProfile?.email || ''}
      />

      {/* 7. Heartbeat Status Modal */}
      <HeartbeatStatusModal
        isOpen={isHeartbeatOpen}
        onClose={() => setIsHeartbeatOpen(false)}
        onOpenEventLog={() => setIsEventLogOpen(true)}
      />

      {/* 8. AI Explainer Modal */}
      <AIExplainerModal
        isOpen={isAIExplainerOpen}
        onClose={() => setIsAIExplainerOpen(false)}
      />

      {/* 9. Step-by-Step Guide Modal */}
      <StepByStepGuideModal
        isOpen={isStepGuideOpen}
        onClose={() => setIsStepGuideOpen(false)}
        onOpenShareModal={() => setIsShareOpen(true)}
      />

      {/* 10. System Specs Modal */}
      <SystemInfoModal
        isOpen={isSystemInfoOpen}
        onClose={() => setIsSystemInfoOpen(false)}
        encryptionPin={settings.encryptionPin}
      />

      {/* 11. Account Modal */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        user={userProfile}
        onUpdateUser={handleUpdateUserProfile}
      />

      {/* 12. Loud Intercom Announcement Modal */}
      <AnnouncementModal
        isOpen={isAnnouncementOpen}
        onClose={() => setIsAnnouncementOpen(false)}
        onSend={(text, target) => {
          globalStreamChannel.sendCameraCommand({
            command: 'WALKIE_TALKIE_VOICE',
            targetCameraId: target,
            payload: { text },
            timestamp: Date.now(),
          });
          playRogerBeep();
          speakSeniorVoice(`Broadcast sent: ${text}`);
        }}
      />
    </div>
  );
}
