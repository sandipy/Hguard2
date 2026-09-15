import React, { useState, useEffect } from 'react';
import {
  Tv,
  Camera,
  Radio,
  Wifi,
  WifiOff,
  Battery,
  Volume2,
  Megaphone,
  AlertTriangle,
  QrCode,
  Sparkles,
  RefreshCw,
  Sun,
  Smartphone,
  HelpCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { AppSettings, CameraSlot, VideoFramePacket } from '../types';
import { globalStreamChannel } from '../utils/streamChannel';
import { globalHeartbeatService } from '../utils/heartbeatService';
import { playRogerBeep, playSirenAlert, speakSeniorVoice } from '../utils/soundAlerts';

interface MonitorViewProps {
  settings: AppSettings;
  onOpenPairingQR: (slot?: CameraSlot) => void;
  onOpenHeartbeatModal: () => void;
  onOpenEventLogModal: () => void;
  onOpenA2HSModal?: () => void;
}

interface CameraCardInfo {
  id: CameraSlot;
  name: string;
  location: string;
  frameUrl: string | null;
  lastUpdated: number;
  isOnline: boolean;
  batteryLevel: number;
  motionScore: number;
  isNightVision: boolean;
  thermalState: string;
}

const DEFAULT_SLOTS: { id: CameraSlot; name: string; location: string }[] = [
  { id: 'cam1', name: 'Camera 1', location: 'Front Entrance' },
  { id: 'cam2', name: 'Camera 2', location: 'Master Bedroom' },
  { id: 'cam3', name: 'Camera 3', location: 'Living Room' },
  { id: 'cam4', name: 'Camera 4', location: 'Kitchen / Stove' },
  { id: 'cam5', name: 'Camera 5', location: 'Hallway / Stairs' },
  { id: 'cam6', name: 'Camera 6', location: 'Backyard / Patio' },
];

export const MonitorView: React.FC<MonitorViewProps> = ({
  settings,
  onOpenPairingQR,
  onOpenHeartbeatModal,
  onOpenEventLogModal,
  onOpenA2HSModal,
}) => {
  const [cameras, setCameras] = useState<Record<CameraSlot, CameraCardInfo>>(() => {
    const initial: Partial<Record<CameraSlot, CameraCardInfo>> = {};
    DEFAULT_SLOTS.forEach((slot) => {
      initial[slot.id] = {
        id: slot.id,
        name: slot.name,
        location: slot.location,
        frameUrl: null,
        lastUpdated: 0,
        isOnline: false,
        batteryLevel: 85,
        motionScore: 0,
        isNightVision: false,
        thermalState: 'normal',
      };
    });
    return initial as Record<CameraSlot, CameraCardInfo>;
  });

  const [activeIntercomSlot, setActiveIntercomSlot] = useState<CameraSlot | null>(null);
  const [rebootingSlots, setRebootingSlots] = useState<CameraSlot[]>([]);
  const [wakeFeedback, setWakeFeedback] = useState<string | null>(null);
  const [showWakeBenefits, setShowWakeBenefits] = useState<boolean>(false);

  // Video Frame Packet subscription
  useEffect(() => {
    const unsub = globalStreamChannel.onVideoFrame((packet: VideoFramePacket) => {
      if (!packet.cameraId) return;
      setCameras((prev) => ({
        ...prev,
        [packet.cameraId]: {
          ...prev[packet.cameraId],
          frameUrl: packet.frameDataUrl,
          lastUpdated: packet.timestamp,
          isOnline: true,
          batteryLevel: packet.batteryLevel,
          motionScore: packet.motionScore,
          isNightVision: !!packet.isNightVision,
          thermalState: packet.thermalState,
        },
      }));
    });
    return () => unsub();
  }, []);

  // Heartbeat online status
  useEffect(() => {
    const interval = setInterval(() => {
      const heartbeats = globalHeartbeatService.getAllHeartbeatInfos();
      setCameras((prev) => {
        const next = { ...prev };
        (Object.keys(next) as CameraSlot[]).forEach((slot) => {
          const hb = heartbeats[slot];
          if (hb) {
            next[slot].isOnline = hb.status === 'online';
          }
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // REMOTE WAKE SCREEN HANDLER
  const handleRemoteWakeScreen = (slot: CameraSlot) => {
    const cam = cameras[slot];
    const camName = cam?.name || slot.toUpperCase();
    playRogerBeep();
    globalStreamChannel.sendCameraCommand({
      command: 'WAKE_SCREEN',
      targetCameraId: slot,
      timestamp: Date.now(),
    });
    setWakeFeedback(`Signal sent: Waking display on ${camName} for 30 seconds.`);
    speakSeniorVoice(`Waking screen on ${camName}.`);
    setTimeout(() => setWakeFeedback(null), 6000);
  };

  // Remote Reboot Handler
  const handleRemoteReboot = (slot: CameraSlot) => {
    const camName = cameras[slot]?.name || slot.toUpperCase();
    playRogerBeep();
    setRebootingSlots((prev) => [...prev.filter((s) => s !== slot), slot]);
    globalStreamChannel.sendCameraCommand({
      command: 'REMOTE_REBOOT',
      targetCameraId: slot,
      timestamp: Date.now(),
    });
    globalHeartbeatService.simulateRecovery(slot);
    setWakeFeedback(`Remote restart signal transmitted to ${camName}.`);
    setTimeout(() => {
      setRebootingSlots((prev) => prev.filter((s) => s !== slot));
      setWakeFeedback(null);
    }, 4000);
  };

  // Intercom Push-to-Talk
  const handleToggleIntercom = (slot: CameraSlot) => {
    if (activeIntercomSlot === slot) {
      setActiveIntercomSlot(null);
      playRogerBeep();
      globalStreamChannel.publishIntercomAudio({
        senderStation: 'viewer1',
        targetCameraId: slot,
        audioText: 'Standby',
        timestamp: Date.now(),
      });
    } else {
      setActiveIntercomSlot(slot);
      playRogerBeep();
      speakSeniorVoice(`Connecting voice to ${cameras[slot].name}. Speak now.`);
      globalStreamChannel.publishIntercomAudio({
        senderStation: 'viewer1',
        targetCameraId: slot,
        audioText: 'Family Talking',
        timestamp: Date.now(),
      });
    }
  };

  // Deterrent Siren
  const handleTriggerCameraSiren = (slot: CameraSlot) => {
    playSirenAlert();
    globalStreamChannel.sendCameraCommand({
      targetCameraId: slot,
      command: 'trigger_siren',
      timestamp: Date.now(),
    });
    speakSeniorVoice(`Emergency deterrent siren sounding on ${cameras[slot].name}.`);
  };

  const onlineCount = (Object.values(cameras) as CameraCardInfo[]).filter((c) => c.isOnline).length;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white p-3 sm:p-5 gap-4 overflow-y-auto">
      {/* STATUS & ACTION STRIP */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-[2px] flex flex-wrap items-center justify-between gap-3 shadow">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/40 rounded-[2px] text-cyan-400">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">FAMILY VIEWER DASHBOARD</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-[2px] border border-emerald-500/30">
                AES-256
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live feeds, 2-way talk, remote screen wake, and battery protection
            </p>
          </div>
        </div>

        {/* Live Status and Pair Actions */}
        <div className="flex items-center gap-2">
          <button
            id="monitor-heartbeat-status-badge"
            onClick={onOpenHeartbeatModal}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-[2px] text-xs font-bold flex items-center gap-2 transition"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-300">
              Online: <strong className="text-emerald-400">{onlineCount}</strong> / {DEFAULT_SLOTS.length}
            </span>
          </button>

          <button
            id="monitor-pair-camera-btn"
            onClick={() => onOpenPairingQR()}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-[2px] flex items-center gap-1.5 transition shadow"
          >
            <QrCode className="w-4 h-4" />
            <span>PAIR NEW CAM</span>
          </button>
        </div>
      </div>

      {/* REMOTE WAKE BENEFIT BANNER */}
      {wakeFeedback && (
        <div className="bg-cyan-950/80 border border-cyan-500 text-cyan-200 px-4 py-2.5 rounded-[2px] text-xs font-bold flex items-center justify-between shadow animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>{wakeFeedback}</span>
          </div>
          <button
            onClick={() => setShowWakeBenefits(!showWakeBenefits)}
            className="text-cyan-300 hover:text-white underline text-xs ml-2 cursor-pointer"
          >
            {showWakeBenefits ? 'Hide explanation' : 'Why wake screen remotely?'}
          </button>
        </div>
      )}

      {/* EXPLANATION OF REMOTE WAKE BENEFITS (Answers user question in-app) */}
      {showWakeBenefits && (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-[2px] text-xs text-slate-300 flex flex-col gap-2">
          <div className="flex items-center justify-between font-bold text-white text-sm">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>What are the benefits of waking the screen remotely?</span>
            </span>
            <button
              onClick={() => setShowWakeBenefits(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-300 leading-relaxed">
            <li><strong>Inspect Camera Angle Without Touching:</strong> When repositioning the phone or asking someone in the room to point it, you can wake the screen to let them see the viewfinder without touching the phone.</li>
            <li><strong>Reassure Seniors:</strong> If an elderly family member wonders if the device is active, waking the display shows a clear &quot;HGuard Active &amp; Watching Out For You&quot; greeting.</li>
            <li><strong>Preserve Phone Battery 99% of the Day:</strong> Keeping the screen completely black (&quot;Eco-Cool&quot;) eliminates heat and prevents battery swelling, while remote wake gives you on-demand visibility anytime.</li>
          </ul>
        </div>
      )}

      {/* 6-CAMERA GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DEFAULT_SLOTS.map((slot) => {
          const cam = cameras[slot.id];
          const isIntercom = activeIntercomSlot === slot.id;
          const isRebooting = rebootingSlots.includes(slot.id);

          return (
            <div
              key={slot.id}
              className={`bg-slate-900 border-2 rounded-[2px] overflow-hidden flex flex-col shadow transition ${
                cam.isOnline ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/60 opacity-90'
              }`}
            >
              {/* Card Top Bar */}
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cam.isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                  <strong className="text-sm font-black text-white">{cam.name}</strong>
                  <span className="text-xs text-slate-400 font-mono">({slot.location})</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {cam.isOnline ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-[2px] border border-emerald-500/20">
                      <Wifi className="w-3 h-3" />
                      <span>ONLINE</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-[2px]">
                      <WifiOff className="w-3 h-3" />
                      <span>STANDBY</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Live Video Viewport */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {cam.isOnline && cam.frameUrl ? (
                  <img
                    src={cam.frameUrl}
                    alt={`${cam.name} live frame`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2">
                    <Camera className="w-12 h-12 text-slate-700" />
                    <span className="text-xs font-bold text-slate-400">Waiting for Camera Feed...</span>
                    <button
                      onClick={() => onOpenPairingQR(slot.id)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-[2px] border border-slate-700 flex items-center gap-1 transition"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan or Share to Pair</span>
                    </button>
                  </div>
                )}

                {/* Overlays */}
                {cam.isOnline && (
                  <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
                    <span className="px-2 py-0.5 bg-black/70 backdrop-blur rounded-[2px] text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                      720p HD
                    </span>
                    {cam.motionScore > 15 && (
                      <span className="px-2 py-0.5 bg-amber-950/80 rounded-[2px] text-[10px] font-bold text-amber-300 border border-amber-500/40">
                        Motion: {cam.motionScore}%
                      </span>
                    )}
                  </div>
                )}

                {isIntercom && (
                  <div className="absolute inset-0 bg-cyan-950/40 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none text-center">
                    <Volume2 className="w-12 h-12 text-cyan-400 animate-bounce mb-1" />
                    <span className="text-xs font-black text-cyan-200 bg-slate-950 px-3 py-1 rounded-[2px] border border-cyan-400">
                      TWO-WAY TALK ACTIVE
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{cam.batteryLevel}%</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* REMOTE WAKE SCREEN BUTTON */}
                  <button
                    id={`wake-screen-btn-${slot.id}`}
                    onClick={() => handleRemoteWakeScreen(slot.id)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-400/50 rounded-[2px] text-xs font-bold flex items-center gap-1 transition"
                    title="Wake the camera phone's screen from black Eco-Cool mode for 30 seconds"
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Wake Screen</span>
                  </button>

                  {/* Push to talk Intercom */}
                  <button
                    id={`intercom-btn-${slot.id}`}
                    onClick={() => handleToggleIntercom(slot.id)}
                    className={`px-3 py-1.5 rounded-[2px] text-xs font-bold flex items-center gap-1 transition ${
                      isIntercom
                        ? 'bg-cyan-500 text-slate-950 font-black animate-pulse shadow'
                        : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                    }`}
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>{isIntercom ? 'End' : 'Talk'}</span>
                  </button>

                  {/* Remote Reboot */}
                  <button
                    id={`reboot-btn-${slot.id}`}
                    onClick={() => handleRemoteReboot(slot.id)}
                    disabled={isRebooting}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-[2px] text-xs transition"
                    title="Remote Reboot"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRebooting ? 'animate-spin text-amber-400' : ''}`} />
                  </button>

                  {/* Siren Deterrent */}
                  <button
                    id={`siren-btn-${slot.id}`}
                    onClick={() => handleTriggerCameraSiren(slot.id)}
                    className="p-1.5 bg-slate-800 hover:bg-red-950 text-red-400 border border-slate-700 rounded-[2px] text-xs transition"
                    title="Sound Alarm Siren"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
