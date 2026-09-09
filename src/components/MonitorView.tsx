import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Volume2,
  VolumeX,
  ShieldAlert,
  Shield,
  Battery,
  BatteryCharging,
  Flame,
  Wifi,
  FileText,
  Camera,
  RefreshCw,
  AlertTriangle,
  Mic,
  Sliders,
  CheckCircle2,
  Play,
  Lock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Square,
  Sparkles,
  Cloud,
  Clock,
  Video,
  VideoOff,
  UserCheck,
  Dog,
  Car,
  ChevronRight,
  Tablet,
  Smartphone,
  Tv,
  Radio,
  Share2,
  Send,
  MessageSquare,
  Volume1,
  PhoneCall,
  X,
} from 'lucide-react';
import {
  AppSettings,
  BatteryState,
  CameraSlot,
  CameraStatusBroadcast,
  ResolutionMode,
  SecurityEvent,
  ThermalStatus,
  ViewerStation,
} from '../types';
import { globalStreamChannel } from '../utils/streamChannel';
import {
  playSirenSound,
  playEmergencyAlarmSiren,
  playWalkieTalkieChirp,
  playRogerBeep,
  speakSeniorVoice,
} from '../utils/soundAlerts';
import { encryptData } from '../utils/crypto';

interface MonitorViewProps {
  settings: AppSettings;
  onOpenEvents: () => void;
  onOpenCloudStorage: () => void;
  onOpenAIExplainer: () => void;
  onNewSecurityEvent: (event: SecurityEvent) => void;
  onOpenShare?: () => void;
}

const VIEWER_STATIONS: Array<{ id: ViewerStation; name: string; deviceLabel: string; type: 'tablet' | 'phone' | 'tv' }> = [
  { id: 'viewer1', name: 'Tablet', deviceLabel: 'Living Room Tablet', type: 'tablet' },
  { id: 'viewer2', name: 'Mobile', deviceLabel: 'Family Mobile', type: 'phone' },
  { id: 'viewer3', name: 'TV Display', deviceLabel: 'Wall TV Display', type: 'tv' },
];

const CAMERA_SLOTS: Array<{ id: CameraSlot; name: string; location: string; defaultBg: string }> = [
  { id: 'cam1', name: 'Senior Bedroom', location: 'Bed & Floor Fall Zone', defaultBg: '#0f172a' },
  { id: 'cam2', name: 'Bathroom', location: 'Shower & Floor (Privacy Blur)', defaultBg: '#1e1b4b' },
  { id: 'cam3', name: 'Living Room', location: 'Couch & Seating Area', defaultBg: '#064e3b' },
  { id: 'cam4', name: 'Kitchen', location: 'Dining & Food Prep', defaultBg: '#311042' },
  { id: 'cam5', name: 'Hallway & Front Door', location: 'Exit & Wandering Guard', defaultBg: '#1e293b' },
  { id: 'cam6', name: 'Patio & Back', location: 'Outdoor & Secondary Area', defaultBg: '#142938' },
];

export const MonitorView: React.FC<MonitorViewProps> = ({
  settings,
  onOpenEvents,
  onOpenCloudStorage,
  onOpenAIExplainer,
  onNewSecurityEvent,
  onOpenShare,
}) => {
  // Viewer Station state (3 concurrent viewers supported)
  const [currentViewerStation, setCurrentViewerStation] = useState<ViewerStation>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const st = params.get('station');
      if (st === 'viewer1' || st === 'viewer2' || st === 'viewer3') return st;
    } catch {}
    return 'viewer1';
  });

  // Multi-camera state map for all 6 cameras
  const [camerasState, setCamerasState] = useState<Record<CameraSlot, CameraStatusBroadcast | null>>({
    cam1: null,
    cam2: null,
    cam3: null,
    cam4: null,
    cam5: null,
    cam6: null,
  });

  const [activeCameraId, setActiveCameraId] = useState<CameraSlot>('cam1');
  const [viewLayout, setViewLayout] = useState<'grid' | 'single'>('grid');
  const [gridFilter, setGridFilter] = useState<'all' | 'priority'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 1.0x to 4.0x (Premium Plus)
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAudioListening, setIsAudioListening] = useState(true);
  const [isTalking, setIsTalking] = useState(false);
  const [sirenActive, setSirenActive] = useState(false);
  const [isWalkieTalkieOpen, setIsWalkieTalkieOpen] = useState(false);
  const [walkieTarget, setWalkieTarget] = useState<CameraSlot | 'all'>('all');
  const [customWalkieMsg, setCustomWalkieMsg] = useState('');
  const [isSnapshotSaving, setIsSnapshotSaving] = useState(false);
  const [isManualRecording, setIsManualRecording] = useState(false);
  const [recordTimerSec, setRecordTimerSec] = useState(0);
  const [aiFrameVisible, setAiFrameVisible] = useState(settings.aiFrameBoxesVisible);
  const [lastMotionAlert, setLastMotionAlert] = useState<{
    cameraId: CameraSlot;
    cameraName: string;
    time: number;
    score: number;
    type?: string;
  } | null>(null);

  // Simulation frame clock for offline camera demo
  const [simClock, setSimClock] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSimClock((c) => c + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to camera broadcasts from stream channel
  useEffect(() => {
    const unsubAll = globalStreamChannel.onAllCameras((map) => {
      setCamerasState((prev) => ({
        cam1: map.cam1 || prev.cam1,
        cam2: map.cam2 || prev.cam2,
        cam3: map.cam3 || prev.cam3,
        cam4: map.cam4 || prev.cam4,
        cam5: map.cam5 || prev.cam5,
        cam6: map.cam6 || prev.cam6,
      }));
    });

    const unsubSingle = globalStreamChannel.onCameraStatus((status) => {
      setCamerasState((prev) => ({
        ...prev,
        [status.cameraId]: status,
      }));

      if (status.motionDetected) {
        setLastMotionAlert({
          cameraId: status.cameraId,
          cameraName: status.cameraName,
          time: Date.now(),
          score: status.motionScore,
          type: status.aiResult?.primaryType || 'motion',
        });
      }
    });

    const unsubEvent = globalStreamChannel.onSecurityEvent((evt) => {
      setLastMotionAlert({
        cameraId: evt.cameraId,
        cameraName: evt.cameraName,
        time: evt.timestamp,
        score: evt.motionIntensity,
        type: evt.eventType,
      });
      if (evt.eventType === 'fall_detected' || evt.eventType === 'voice_help' || evt.eventType === 'sound_surge') {
        playEmergencyAlarmSiren(2);
        if (settings.seniorVoiceAlerts) {
          const spoken = evt.eventType === 'fall_detected'
            ? `Emergency! Fall detected at ${evt.cameraName}! Check senior immediately!`
            : evt.eventType === 'sound_surge'
            ? `Emergency! Sudden distress sound or cry detected at ${evt.cameraName}!`
            : `Emergency! Senior called out for help at ${evt.cameraName}!`;
          speakSeniorVoice(spoken);
        }
      } else {
        if (settings.alarmSoundEnabled) {
          playSirenSound();
        }
        if (settings.seniorVoiceAlerts) {
          speakSeniorVoice(`Alert! ${evt.eventType.toUpperCase()} detected at ${evt.cameraName}.`);
        }
      }
    });

    const unsubCmd = globalStreamChannel.onRemoteCommand((cmd: any) => {
      if (cmd.command === 'SENIOR_OKAY') {
        const phrase = cmd.payload?.keyword || 'I am okay';
        speakSeniorVoice(`Senior confirmed hands-free: "${phrase}". Alert cleared.`);
        setLastMotionAlert(null);
      } else if (cmd.command === 'SOUND_SURGE_TRIGGERED') {
        playEmergencyAlarmSiren(2);
        speakSeniorVoice('Distress acoustic surge detected in room!');
      }
    });

    return () => {
      unsubAll();
      unsubSingle();
      unsubEvent();
      unsubCmd();
    };
  }, [settings.alarmSoundEnabled, settings.seniorVoiceAlerts]);

  // Handle Recording Timer
  useEffect(() => {
    let interval: any;
    if (isManualRecording) {
      interval = setInterval(() => {
        setRecordTimerSec((s) => {
          if (s + 1 >= settings.recordingClipDuration) {
            // Auto stop after 30s or 120s
            stopManualRecording();
            return 0;
          }
          return s + 1;
        });
      }, 1000);
    } else {
      setRecordTimerSec(0);
    }
    return () => clearInterval(interval);
  }, [isManualRecording, settings.recordingClipDuration]);

  // Trigger Alarm button logic: triggers audible siren sound through browser audio API on all connected camera units
  const triggerRemoteAlarm = (target: CameraSlot | 'all' = 'all') => {
    if (sirenActive) {
      setSirenActive(false);
      globalStreamChannel.sendRemoteCommand('SILENCE_ALARM', target);
      if (settings.seniorVoiceAlerts) {
        speakSeniorVoice('Emergency alarm silenced.');
      }
      return;
    }

    setSirenActive(true);
    // 1. Play audible siren sound through browser audio API locally on viewer
    playEmergencyAlarmSiren(3);
    // 2. Broadcast siren command to all connected camera units to sound their sirens
    globalStreamChannel.sendRemoteCommand('TRIGGER_SIREN', target);
    if (settings.seniorVoiceAlerts) {
      speakSeniorVoice('Emergency alarm triggered on all connected camera units!');
    }
    setTimeout(() => setSirenActive(false), 4500);
  };

  // Walkie-Talkie Push-to-Talk handlers
  const handleStartTalking = (target: CameraSlot | 'all' = 'all') => {
    setIsTalking(true);
    playWalkieTalkieChirp();
    globalStreamChannel.sendRemoteCommand('WALKIE_TALKIE_START', target);
  };

  const handleStopTalking = (target: CameraSlot | 'all' = 'all', msgText?: string) => {
    setIsTalking(false);
    playRogerBeep();
    if (msgText && msgText.trim()) {
      globalStreamChannel.sendRemoteCommand('WALKIE_TALKIE_TRANSMIT', target, msgText.trim());
      if (settings.seniorVoiceAlerts) {
        speakSeniorVoice(msgText.trim());
      }
    } else {
      globalStreamChannel.sendRemoteCommand('WALKIE_TALKIE_STOP', target);
    }
  };

  const handleSendWalkieMessage = (msg: string, target: CameraSlot | 'all' = 'all') => {
    playWalkieTalkieChirp();
    setIsTalking(true);
    globalStreamChannel.sendRemoteCommand('WALKIE_TALKIE_TRANSMIT', target, msg);
    if (settings.seniorVoiceAlerts) {
      speakSeniorVoice(msg);
    }
    setTimeout(() => {
      playRogerBeep();
      setIsTalking(false);
    }, 1800);
  };

  // Start manual recording
  const startManualRecording = () => {
    setIsManualRecording(true);
    setRecordTimerSec(0);
    if (settings.seniorVoiceAlerts) {
      speakSeniorVoice(`Recording ${settings.recordingClipDuration} second clip.`);
    }
  };

  // Stop manual recording & save to cloud vault
  const stopManualRecording = async () => {
    setIsManualRecording(false);
    const cam = camerasState[activeCameraId];
    const cameraConfig = CAMERA_SLOTS.find((c) => c.id === activeCameraId);

    // Save to Cloud Storage
    try {
      await fetch('/api/cloud-storage/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cameraId: activeCameraId,
          cameraName: cameraConfig?.name || 'Home Camera',
          timestamp: Date.now(),
          eventType: cam?.aiResult?.primaryType || 'manual',
          durationSec: settings.recordingClipDuration,
          thumbnailUrl: cam?.currentFrame || '',
          aiSummary: `Manual recorded clip (${settings.recordingClipDuration}s) by Master Viewer.`,
          threatLevel: 'none',
          aiFrameBoxes: cam?.aiResult?.objects || [],
        }),
      });
      if (settings.seniorVoiceAlerts) {
        speakSeniorVoice('Recording saved to 30-day cloud vault.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Manual Snapshot
  const takeManualSnapshot = async () => {
    const cam = camerasState[activeCameraId];
    const cameraConfig = CAMERA_SLOTS.find((c) => c.id === activeCameraId);
    const frame = cam?.currentFrame;

    setIsSnapshotSaving(true);
    try {
      let dataUrl = frame;
      if (!dataUrl) {
        // Generate simulated snapshot
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText(`${cameraConfig?.name} (${cameraConfig?.location})`, 80, 220);
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '18px sans-serif';
          ctx.fillText(`Timestamp: ${new Date().toLocaleString()}`, 80, 260);
          dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        }
      }

      if (dataUrl) {
        const encrypted = await encryptData(dataUrl, settings.encryptionPin);
        const newEvt: SecurityEvent = {
          id: `snapshot_${Date.now()}`,
          cameraId: activeCameraId,
          cameraName: cameraConfig?.name || 'Camera',
          timestamp: Date.now(),
          motionIntensity: 0,
          eventType: 'manual',
          snapshotEncrypted: encrypted.ciphertext,
          iv: encrypted.iv,
          thermalState: cam?.thermal || 'normal',
          batteryLevel: cam?.battery?.level || 80,
          notes: `Snapshot captured by Viewer from ${cameraConfig?.name}`,
          decryptedSnapshot: dataUrl,
          durationSec: 0,
          isCloudSynced: true,
        };

        onNewSecurityEvent(newEvt);
        if (settings.seniorVoiceAlerts) {
          speakSeniorVoice('Snapshot encrypted and saved.');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSnapshotSaving(false);
    }
  };

  // Run instant AI scan on current active camera
  const handleScanWithGeminiAI = async () => {
    const cam = camerasState[activeCameraId];
    speakSeniorVoice('Running Gemini AI Vision scan on camera feed.');

    try {
      const dummyCanvas = document.createElement('canvas');
      dummyCanvas.width = 640;
      dummyCanvas.height = 480;
      const ctx = dummyCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#f59e0b';
        ctx.font = '24px sans-serif';
        ctx.fillText(`AI Scan Target: ${CAMERA_SLOTS.find(c => c.id === activeCameraId)?.location}`, 70, 240);
      }
      const base64 = cam?.currentFrame || dummyCanvas.toDataURL('image/jpeg', 0.7);

      const res = await fetch('/api/ai-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          cameraName: CAMERA_SLOTS.find(c => c.id === activeCameraId)?.name || 'Home Camera',
          detectModes: ['person', 'pet', 'vehicle', 'lingering'],
        }),
      });
      const data = await res.json();
      if (data?.result) {
        // Broadcast updated AI status
        const updatedStatus: CameraStatusBroadcast = {
          cameraId: activeCameraId,
          cameraName: CAMERA_SLOTS.find(c => c.id === activeCameraId)?.name || 'Camera',
          timestamp: Date.now(),
          isOnline: true,
          battery: cam?.battery || { level: 82, charging: true, supported: true },
          thermal: cam?.thermal || 'normal',
          fps: 15,
          currentFrame: base64,
          bandwidthMode: settings.bandwidthMode,
          resolutionMode: settings.resolutionMode,
          motionDetected: true,
          motionScore: 85,
          aiResult: data.result,
        };
        globalStreamChannel.broadcastCameraStatus(updatedStatus);
        speakSeniorVoice(`AI detected ${data.result.primaryType}. ${data.result.summary}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeCamStatus = camerasState[activeCameraId];
  const activeCamConfig = CAMERA_SLOTS.find((c) => c.id === activeCameraId);

  return (
    <div className="flex flex-col gap-4 select-none">
      {/* REAL-TIME MOTION & AI ALERT BANNER */}
      {lastMotionAlert && Date.now() - lastMotionAlert.time < 12000 && (
        <div
          id="monitor-motion-alert-banner"
          className="bg-red-600 text-white p-3.5 sm:p-4 rounded-[2px] border-2 border-red-300 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-bounce"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900 rounded-[2px] text-amber-300">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black">
                ALERT: {lastMotionAlert.type?.toUpperCase()} DETECTED AT {lastMotionAlert.cameraName}!
              </div>
              <div className="text-xs sm:text-sm font-bold text-red-100">
                Movement level: {lastMotionAlert.score}%. Check camera feed or activate siren below.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="alert-switch-camera-btn"
              onClick={() => {
                setActiveCameraId(lastMotionAlert.cameraId);
                setViewLayout('single');
              }}
              className="px-4 py-2 bg-white text-slate-950 font-black text-xs rounded-[2px] shadow"
            >
              FOCUS CAM
            </button>
            <button
              id="alert-siren-quick-btn"
              onClick={() => triggerRemoteAlarm(lastMotionAlert.cameraId)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs rounded-[2px] shadow"
            >
              SOUND SIREN
            </button>
          </div>
        </div>
      )}

      {/* TOP MONITOR HEADER & VIEWER STATION SELECTOR BAR */}
      <div className="bg-slate-900 border border-slate-700 rounded-[2px] p-3.5 sm:p-4 shadow flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 animate-ping" />
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Master Surveillance Viewer
              </h2>
              <span className="bg-amber-500/20 text-amber-300 text-[11px] px-2 py-0.5 rounded-[2px] font-black border border-amber-500/40 uppercase">
                Up to 6 Cameras • 3 Viewers
              </span>
            </div>
            <p className="text-slate-300 text-xs font-medium mt-0.5">
              Live monitoring of up to 6 cameras with real-time motion alerts
            </p>
          </div>

          {/* Layout & Control Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              id="layout-grid-btn"
              onClick={() => setViewLayout('grid')}
              className={`px-3 py-1.5 rounded-[2px] font-bold text-xs flex items-center gap-1.5 border transition ${
                viewLayout === 'grid'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>All Cameras Grid</span>
            </button>
            <button
              id="layout-single-btn"
              onClick={() => setViewLayout('single')}
              className={`px-3 py-1.5 rounded-[2px] font-bold text-xs flex items-center gap-1.5 border transition ${
                viewLayout === 'single'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Focused View</span>
            </button>
          </div>
        </div>

        {/* 3 CONCURRENT VIEWER STATIONS SELECTOR BAR */}
        <div className="pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400 uppercase">
              Viewer Screen (Up to 3):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {VIEWER_STATIONS.map((st) => {
              const isCurrent = currentViewerStation === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setCurrentViewerStation(st.id);
                    speakSeniorVoice(`Operating as ${st.name}`);
                  }}
                  className={`px-2.5 py-1 rounded-[2px] text-xs font-bold border transition flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {st.type === 'tablet' ? (
                    <Tablet className="w-3.5 h-3.5" />
                  ) : st.type === 'phone' ? (
                    <Smartphone className="w-3.5 h-3.5" />
                  ) : (
                    <Tv className="w-3.5 h-3.5" />
                  )}
                  <span>{st.name}</span>
                  <span className="w-1.5 h-1.5 rounded-[2px] bg-emerald-400 ml-0.5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6 CAMERAS SELECTOR TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {CAMERA_SLOTS.map((slot) => {
          const cam = camerasState[slot.id];
          const isSelected = activeCameraId === slot.id;
          const battery = cam?.battery || { level: 80, charging: true, supported: true };
          const thermal = cam?.thermal || 'normal';

          return (
            <button
              key={slot.id}
              onClick={() => {
                setActiveCameraId(slot.id);
              }}
              className={`p-2.5 rounded-[2px] border text-left transition flex flex-col justify-between gap-1 ${
                isSelected
                  ? 'bg-slate-800 border-amber-400 shadow'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1">
                  <Camera className="w-3 h-3 text-amber-400" />
                  {slot.name}
                </span>
                <span className="w-1.5 h-1.5 rounded-[2px] bg-emerald-400" />
              </div>

              <div className="text-[11px] text-slate-400 truncate">{slot.location}</div>

              {/* Hardware stats */}
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800">
                <span className="flex items-center gap-0.5 font-bold text-emerald-400">
                  <BatteryCharging className="w-2.5 h-2.5" />
                  {battery.level}%
                </span>
                <span className="font-mono text-cyan-300 uppercase">
                  {thermal === 'normal' ? 'Cool' : thermal}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* VIEWPORT: MULTI-SCREEN 6-GRID OR SINGLE FOCUSED */}
      {viewLayout === 'grid' ? (
        /* MULTI-SCREEN 6-CAMERA GRID (Multi-Screen Monitoring) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAMERA_SLOTS.map((slot) => {
            const cam = camerasState[slot.id];
            const isSelected = activeCameraId === slot.id;

            return (
              <div
                key={slot.id}
                onClick={() => {
                  setActiveCameraId(slot.id);
                  setViewLayout('single');
                }}
                className={`relative bg-slate-950 rounded-[2px] overflow-hidden border-2 cursor-pointer group transition ${
                  isSelected ? 'border-amber-400 shadow-lg' : 'border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="aspect-video relative flex items-center justify-center bg-slate-900 overflow-hidden">
                  {cam?.currentFrame ? (
                    <img
                      src={cam.currentFrame}
                      alt={slot.name}
                      style={{ filter: cam.privacyShieldActive ? 'blur(20px)' : 'none' }}
                      className="w-full h-full object-cover transition-all"
                    />
                  ) : (
                    /* Simulated Video Feed with Room Atmosphere */
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-950 relative">
                      <div className="w-10 h-10 rounded-[2px] bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 mb-1.5">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-bold text-white">{slot.name}</div>
                      <div className="text-xs text-slate-400">{slot.location}</div>
                      <div className="text-[10px] font-mono text-emerald-400 mt-1.5 bg-slate-900 px-1.5 py-0.5 rounded-[2px] border border-slate-800">
                        Live • {10 + (simClock % 5)} FPS
                      </div>
                    </div>
                  )}

                  {/* Bathroom Privacy Shield Badge */}
                  {cam?.privacyShieldActive && (
                    <div className="absolute inset-0 flex items-center justify-center p-2 bg-slate-950/40 pointer-events-none">
                      <div className="bg-slate-900/90 border border-amber-400 px-2 py-1 rounded-[2px] text-[10px] text-amber-300 font-bold flex items-center gap-1 shadow">
                        <Shield className="w-3 h-3 text-amber-400" />
                        <span>Privacy Shield Active</span>
                      </div>
                    </div>
                  )}

                  {/* Fall Detected Emergency Flash */}
                  {cam?.fallDetected && (
                    <div className="absolute top-2 inset-x-2 bg-red-600 border border-amber-300 text-white font-black text-[11px] p-1.5 rounded-[2px] flex items-center justify-center gap-1.5 animate-bounce z-10 shadow-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-300 animate-ping" />
                      <span>🚨 FALL DETECTED (5+ FT)!</span>
                    </div>
                  )}

                  {/* Voice Help Keyword Flash */}
                  {cam?.voiceHelpActive && !cam?.fallDetected && (
                    <div className="absolute top-2 inset-x-2 bg-amber-600 border border-black text-black font-black text-[10px] p-1 rounded-[2px] flex items-center justify-center gap-1 animate-pulse z-10 shadow">
                      <Volume2 className="w-3 h-3 text-black" />
                      <span>🆘 VOICE &quot;HELP&quot; TRIGGERED</span>
                    </div>
                  )}

                  {/* AI Frame overlay in mini-grid */}
                  {aiFrameVisible && cam?.aiResult?.objects && (
                    <div className="absolute inset-0 pointer-events-none">
                      {cam.aiResult.objects.map((obj, i) => (
                        <div
                          key={i}
                          style={{
                            top: `${obj.box_2d[0] / 10}%`,
                            left: `${obj.box_2d[1] / 10}%`,
                            height: `${(obj.box_2d[2] - obj.box_2d[0]) / 10}%`,
                            width: `${(obj.box_2d[3] - obj.box_2d[1]) / 10}%`,
                          }}
                          className="absolute border border-amber-400 bg-amber-400/20 rounded-[2px]"
                        >
                          <span className="text-[9px] font-black bg-amber-500 text-black px-1 rounded-br-[2px]">
                            {obj.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur px-2 py-0.5 rounded-[2px] text-xs font-black text-white flex items-center gap-1.5 border border-slate-700 z-10">
                    <span className="w-1.5 h-1.5 rounded-[2px] bg-emerald-500 animate-ping" />
                    <span>{slot.name}</span>
                  </div>

                  <div className="absolute top-2 right-2 bg-emerald-950/90 border border-emerald-500/70 px-1.5 py-0.5 rounded-[2px] text-[10px] font-black text-emerald-300 flex items-center gap-1 z-10">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>95-Yr Zero Setup</span>
                  </div>

                  {/* Senior Speech Transcript or Guardian Status Pill */}
                  <div className="absolute bottom-2 left-2 right-16 z-10 pointer-events-none">
                    <div className="bg-black/85 backdrop-blur-sm border border-slate-700 px-2 py-1 rounded-[2px] text-[10px] text-slate-200 truncate flex items-center gap-1.5">
                      {cam?.seniorSpeechTranscript ? (
                        <>
                          <Mic className="w-3 h-3 text-emerald-400 shrink-0 animate-pulse" />
                          <span className="text-emerald-300 font-bold truncate">{cam.seniorSpeechTranscript}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="text-slate-300 truncate">👂 Listening &quot;Help&quot; • 🚨 Fall 5+ ft</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold text-amber-300 border border-slate-700 z-10">
                    Focus
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs gap-2">
                  <div className="flex flex-col truncate">
                    <span className="text-slate-300 font-bold truncate">{slot.location}</span>
                    <span className="text-emerald-400 font-mono text-[10px]">Battery: {cam?.battery?.level || 80}%</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setWalkieTarget(slot.id);
                      setIsWalkieTalkieOpen(true);
                      handleSendWalkieMessage(`Checking in on ${slot.name}. Are you okay?`, slot.id);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] rounded-[2px] flex items-center gap-1 transition shadow shrink-0"
                    title={`Speak directly to ${slot.name}`}
                  >
                    <Mic className="w-3 h-3" />
                    <span>Talk to Room</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* SINGLE FOCUSED CAMERA VIEW WITH 4X DIGITAL ZOOM & AI FRAME */
        <div className="flex flex-col gap-3">
          <div className="relative bg-slate-950 rounded-[2px] overflow-hidden border-2 border-slate-700 shadow-xl min-h-[340px] sm:min-h-[440px] flex items-center justify-center">
            {/* Live Camera View with 4x Zoom transform */}
            <div
              className="w-full h-full flex items-center justify-center overflow-hidden"
              style={{
                transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
              }}
            >
              {activeCamStatus?.currentFrame ? (
                <img
                  src={activeCamStatus.currentFrame}
                  alt={activeCamConfig?.name || 'Surveillance Feed'}
                  style={{ filter: activeCamStatus.privacyShieldActive ? 'blur(24px)' : 'none' }}
                  className="w-full h-full object-cover max-h-[560px] transition-all"
                />
              ) : (
                <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                  <div className="p-4 bg-slate-800 border border-slate-700 rounded-[2px] text-amber-400 mb-2">
                    <Eye className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {activeCamConfig?.name} • {activeCamConfig?.location}
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm max-w-md mt-1">
                    Streaming in Full HD (1080p). Ready for 4x Digital Zoom, Gemini Vision AI detection, and two-way talkback.
                  </p>
                </div>
              )}
            </div>

            {/* AI Frame Bounding Box Overlay */}
            {aiFrameVisible && activeCamStatus?.aiResult?.objects && (
              <div className="absolute inset-0 pointer-events-none">
                {activeCamStatus.aiResult.objects.map((obj, i) => (
                  <div
                    key={i}
                    style={{
                      top: `${obj.box_2d[0] / 10}%`,
                      left: `${obj.box_2d[1] / 10}%`,
                      height: `${(obj.box_2d[2] - obj.box_2d[0]) / 10}%`,
                      width: `${(obj.box_2d[3] - obj.box_2d[1]) / 10}%`,
                    }}
                    className="absolute border-2 border-amber-400 rounded-[2px] bg-amber-500/20 flex flex-col justify-start"
                  >
                    <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-br-[2px] self-start">
                      {obj.label} ({obj.confidence}%)
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Top Live Status Bar */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-[2px] border border-slate-700 text-white font-black text-xs">
              <span className="w-2 h-2 rounded-[2px] bg-emerald-500 animate-ping" />
              <span>LIVE • {activeCamConfig?.name}</span>
              <span className="text-slate-400">|</span>
              <span className="text-amber-400">{activeCamStatus?.fps || 15} FPS</span>
              <span className="text-slate-400">|</span>
              <span className="text-cyan-300 font-mono">1080p</span>
            </div>

            {/* Top Right Zoom & AI Frame Badges */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <div className="bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-[2px] border border-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Zoom: {zoomLevel.toFixed(1)}x</span>
              </div>
              {settings.showTimestamp && (
                <div className="hidden sm:flex bg-black/80 font-mono text-emerald-400 px-2.5 py-1 rounded-[2px] text-xs border border-slate-800">
                  {new Date().toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Recording Indicator */}
            {isManualRecording && (
              <div className="absolute bottom-3 left-3 bg-red-600 text-white font-black text-xs px-3 py-1.5 rounded-[2px] flex items-center gap-2 animate-pulse shadow border border-white">
                <span className="w-2 h-2 rounded-[2px] bg-white" />
                <span>RECORDING CLIP ({recordTimerSec}s / {settings.recordingClipDuration}s)</span>
              </div>
            )}
          </div>

          {/* 4X ZOOM & CAMERA CONTROLS BAR */}
          <div className="bg-slate-900 border border-slate-700 p-3 rounded-[2px] flex flex-wrap items-center justify-between gap-3">
            {/* 4x Digital Zoom Slider */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5 text-amber-400" /> Zoom:
              </span>
              <input
                id="viewer-zoom-slider"
                type="range"
                min="1.0"
                max="4.0"
                step="0.2"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-32 sm:w-44 accent-amber-400 cursor-pointer"
              />
              <span className="font-mono text-xs font-black text-amber-400 w-8">
                {zoomLevel.toFixed(1)}x
              </span>
              {zoomLevel > 1.0 && (
                <button
                  id="reset-zoom-btn"
                  onClick={() => {
                    setZoomLevel(1.0);
                    setPanPosition({ x: 0, y: 0 });
                  }}
                  className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded-[2px] text-slate-300 font-bold border border-slate-600"
                >
                  Reset
                </button>
              )}
            </div>

            {/* AI Frame & Grid Navigation */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="toggle-ai-frame-btn"
                onClick={() => setAiFrameVisible(!aiFrameVisible)}
                className={`px-3 py-1.5 rounded-[2px] text-xs font-bold border transition flex items-center gap-1.5 ${
                  aiFrameVisible
                    ? 'bg-amber-500 text-black border-amber-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Frame {aiFrameVisible ? 'ON' : 'OFF'}</span>
              </button>

              <button
                id="back-to-grid-btn"
                onClick={() => setViewLayout('grid')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-[2px] border border-slate-700 flex items-center gap-1.5"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>All Cameras</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SENIOR-FRIENDLY CONTROLS (HIGH CONTRAST, 2PX CORNERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* BIG EMERGENCY TRIGGER ALARM BUTTON */}
        <button
          id="trigger-alarm-btn"
          onClick={() => triggerRemoteAlarm('all')}
          className={`py-4 px-5 font-black text-base sm:text-lg rounded-[2px] shadow flex items-center justify-center gap-2.5 transition active:scale-95 border-2 ${
            sirenActive
              ? 'bg-red-700 text-white border-white animate-pulse ring-4 ring-red-500'
              : 'bg-red-600 hover:bg-red-500 text-white border-red-400'
          }`}
          title="Triggers an audible siren sound through the browser audio API on all connected camera units"
        >
          <ShieldAlert className={`w-6 h-6 ${sirenActive ? 'animate-bounce' : ''}`} />
          <div className="flex flex-col text-left leading-tight">
            <span>{sirenActive ? 'ALARM RINGING (SILENCE)' : 'TRIGGER ALARM'}</span>
            <span className="text-[10px] text-red-200 font-normal">Audible Siren On All Cameras</span>
          </div>
        </button>

        {/* WALKIE TALKIE (TALK WITH BUTTON) */}
        <button
          id="viewer-walkie-talkie-btn"
          onClick={() => setIsWalkieTalkieOpen(!isWalkieTalkieOpen)}
          className={`py-4 px-5 font-black text-base sm:text-lg rounded-[2px] shadow flex items-center justify-center gap-2.5 transition active:scale-95 border-2 ${
            isWalkieTalkieOpen || isTalking
              ? 'bg-emerald-600 text-white border-white ring-2 ring-emerald-400'
              : 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-400'
          }`}
          title="Walkie talkie, talk with button through camera speakers"
        >
          <Radio className="w-6 h-6 text-emerald-200" />
          <div className="flex flex-col text-left leading-tight">
            <span>{isTalking ? 'TALKING (ACTIVE)...' : 'WALKIE TALKIE'}</span>
            <span className="text-[10px] text-emerald-200 font-normal">Talk with Button</span>
          </div>
        </button>

        {/* RECORD VIDEO CLIP BUTTON (30s / 120s) */}
        <button
          id="viewer-record-clip-btn"
          onClick={isManualRecording ? stopManualRecording : startManualRecording}
          className={`py-4 px-5 font-black text-base sm:text-lg rounded-[2px] shadow flex items-center justify-center gap-2.5 transition active:scale-95 border-2 ${
            isManualRecording
              ? 'bg-red-600 text-white border-white animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
          }`}
        >
          <Video className="w-6 h-6 text-amber-400" />
          <div className="flex flex-col text-left leading-tight">
            <span>{isManualRecording ? `STOP (${recordTimerSec}s)` : 'RECORD CLIP'}</span>
            <span className="text-[10px] text-slate-400 font-normal">{settings.recordingClipDuration}s Cloud Clip</span>
          </div>
        </button>

        {/* SHARE LINK TO FRIENDS OR RELATIVES */}
        <button
          id="viewer-share-relatives-btn"
          onClick={onOpenShare}
          className="py-4 px-5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-base sm:text-lg rounded-[2px] shadow flex items-center justify-center gap-2.5 transition active:scale-95 border-2 border-amber-300"
          title="Share viewer link with friends or relatives"
        >
          <Share2 className="w-6 h-6" />
          <div className="flex flex-col text-left leading-tight">
            <span>SHARE LINK</span>
            <span className="text-[10px] text-slate-900 font-bold">Friends or Relatives</span>
          </div>
        </button>
      </div>

      {/* EXPANDABLE WALKIE TALKIE (TALK WITH BUTTON) CONSOLE */}
      {isWalkieTalkieOpen && (
        <div
          id="walkie-talkie-console"
          className="bg-slate-900 border-2 border-emerald-500 rounded-[2px] p-4 sm:p-6 flex flex-col gap-4 shadow-2xl relative"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-950 text-emerald-400 rounded-[2px] border border-emerald-600">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  WALKIE TALKIE INTERCOM
                  <span className="text-xs bg-emerald-900/80 text-emerald-300 border border-emerald-500 px-2 py-0.5 rounded-[2px] font-mono">
                    CH-462 MHz SECURE
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Talk with button to broadcast voice through old phone camera speakers with roger beep.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsWalkieTalkieOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-[2px] border border-slate-700 hover:bg-slate-800"
              title="Close Walkie Talkie"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Target Camera Slot Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Select Destination Speaker:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <button
                onClick={() => setWalkieTarget('all')}
                className={`p-2 rounded-[2px] text-xs font-black border transition text-center ${
                  walkieTarget === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-300 shadow'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                📢 All Cameras
              </button>
              {CAMERA_SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setWalkieTarget(slot.id)}
                  className={`p-2 rounded-[2px] text-xs font-bold border transition text-center truncate ${
                    walkieTarget === slot.id
                      ? 'bg-emerald-600 text-white border-emerald-300 shadow'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {slot.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main Push-To-Talk Button & Soundwave Indicator */}
          <div className="bg-slate-950 border border-slate-800 rounded-[2px] p-6 flex flex-col items-center justify-center gap-4 text-center">
            {/* Live Audio Waves / Status */}
            <div className="flex items-center gap-1.5 h-8">
              {[40, 70, 90, 60, 100, 75, 45, 85, 95, 60, 80, 40].map((h, i) => (
                <span
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    isTalking
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-slate-800'
                  }`}
                  style={{ height: isTalking ? `${h}%` : '20%' }}
                />
              ))}
            </div>

            <p className="text-sm font-bold text-white">
              {isTalking ? (
                <span className="text-emerald-400 flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  TRANSMITTING TO {walkieTarget === 'all' ? 'ALL CAMERAS' : walkieTarget.toUpperCase()}...
                </span>
              ) : (
                <span className="text-slate-400">
                  Ready to talk. Target:{' '}
                  <span className="text-emerald-400 uppercase font-mono">
                    {walkieTarget === 'all' ? 'All Connected Cameras' : walkieTarget}
                  </span>
                </span>
              )}
            </p>

            {/* BIG ROUND PUSH TO TALK BUTTON */}
            <button
              id="walkie-talkie-push-to-talk-btn"
              onMouseDown={() => handleStartTalking(walkieTarget)}
              onMouseUp={() => handleStopTalking(walkieTarget, customWalkieMsg || 'Voice transmission concluded.')}
              onTouchStart={() => handleStartTalking(walkieTarget)}
              onTouchEnd={() => handleStopTalking(walkieTarget, customWalkieMsg || 'Voice transmission concluded.')}
              onClick={() => {
                // If clicked once (fallback for seniors who prefer clicking to holding)
                if (isTalking) {
                  handleStopTalking(walkieTarget, customWalkieMsg || 'Voice transmission concluded.');
                } else {
                  handleStartTalking(walkieTarget);
                }
              }}
              className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 shadow-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 select-none ${
                isTalking
                  ? 'bg-red-600 border-white text-white shadow-red-500/50 scale-105'
                  : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-emerald-600/30'
              }`}
            >
              <Mic className={`w-10 h-10 sm:w-12 sm:h-12 ${isTalking ? 'animate-pulse' : ''}`} />
              <div className="font-black text-base sm:text-lg uppercase tracking-wide leading-tight">
                {isTalking ? 'RELEASE' : 'HOLD TO TALK'}
              </div>
              <div className="text-[10px] text-emerald-100 uppercase tracking-wider">
                {isTalking ? 'Tap or release to end' : 'Press & hold button'}
              </div>
            </button>
            <span className="text-xs text-slate-400">
              Chirp sound plays on start • Roger beep sounds when you release button
            </span>
          </div>

          {/* Live Senior Intercom Status / Hands-Free Transcript */}
          {activeCamStatus?.seniorSpeechTranscript && (
            <div className="bg-emerald-950/90 border border-emerald-500 p-3 rounded-[2px] text-xs flex items-center justify-between gap-3 shadow">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-emerald-300">Senior Hands-Free Mic:</span>
                <span className="text-white font-mono">{activeCamStatus.seniorSpeechTranscript}</span>
              </div>
              <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-[2px] font-bold uppercase shrink-0">
                Zero-Touch Open Mic
              </span>
            </div>
          )}

          {/* Quick Senior Announcement Presets */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Volume1 className="w-3.5 h-3.5 text-amber-400" />
              1-Tap Senior Voice Announcements (Sent Directly to Camera Speakers):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { title: 'Emergency Check', msg: "Mom, are you okay? I'm right here on the phone." },
                { title: 'Stay Still Drill', msg: "Stay still, don't try to get up, help is on the way!" },
                { title: 'Did You Fall?', msg: "Did you fall? Speak to me, the intercom mic is open." },
                { title: 'Good Morning Check', msg: "Good morning! Just checking in to see how you are doing." },
                { title: 'Front Door Check', msg: 'Hello! Who is at the front door?' },
                { title: 'Delivery Driver', msg: 'Please leave the package at the front door, thank you!' },
                { title: 'Security Warning', msg: 'Warning: Security monitoring is active on this property.' },
                { title: 'Family Check-in', msg: 'Hello from the monitor, everything is looking good!' },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendWalkieMessage(preset.msg, walkieTarget)}
                  className="p-3 bg-slate-800 hover:bg-slate-750 text-left border border-slate-700 hover:border-emerald-500 rounded-[2px] transition flex flex-col gap-1 text-slate-200 group active:scale-98"
                >
                  <span className="text-xs font-black text-amber-300 group-hover:text-emerald-300 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {preset.title}
                  </span>
                  <span className="text-[11px] text-slate-400 leading-snug">"{preset.msg}"</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message Box */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customWalkieMsg}
              onChange={(e) => setCustomWalkieMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customWalkieMsg.trim()) {
                  handleSendWalkieMessage(customWalkieMsg.trim(), walkieTarget);
                  setCustomWalkieMsg('');
                }
              }}
              placeholder="Or type any announcement to broadcast through phone camera speaker..."
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-500 px-3.5 py-2.5 rounded-[2px] text-sm text-white placeholder:text-slate-500 outline-none font-medium"
            />
            <button
              onClick={() => {
                if (customWalkieMsg.trim()) {
                  handleSendWalkieMessage(customWalkieMsg.trim(), walkieTarget);
                  setCustomWalkieMsg('');
                }
              }}
              disabled={!customWalkieMsg.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-[2px] border border-emerald-400 flex items-center justify-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              <span>TRANSMIT</span>
            </button>
          </div>
        </div>
      )}

      {/* QUICK STATUS CARD FOR SENIOR COMFORT & AUDIO TOGGLE */}
      <div className="bg-slate-900 border border-slate-700 rounded-[2px] p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950 text-emerald-400 rounded-[2px] border border-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg sm:text-xl font-black text-white">
              ALL CAMERAS SECURED & ACTIVE
            </h4>
            <p className="text-slate-300 text-xs sm:text-sm font-medium mt-0.5">
              Continuous 24/7 surveillance with real-time motion alerts and cloud backup.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            id="toggle-audio-listen-btn"
            onClick={() => {
              setIsAudioListening(!isAudioListening);
              speakSeniorVoice(isAudioListening ? 'Audio muted' : 'Audio listening turned on');
            }}
            className={`w-full md:w-auto py-2.5 px-4 rounded-[2px] font-bold text-sm flex items-center justify-center gap-2 border transition ${
              isAudioListening
                ? 'bg-slate-800 text-emerald-400 border-emerald-500'
                : 'bg-slate-800 text-slate-400 border-slate-600'
            }`}
          >
            {isAudioListening ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span>{isAudioListening ? 'Audio: ON' : 'Audio: MUTED'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
