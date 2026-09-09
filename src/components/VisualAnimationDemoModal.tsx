import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Camera,
  Eye,
  Shield,
  HardDrive,
  Sparkles,
  Zap,
  BatteryCharging,
  Moon,
  Flame,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Activity,
  ArrowRight,
  Radio,
  Smartphone,
  Tv,
  Tablet,
} from 'lucide-react';
import { CameraSlot, ViewerStation } from '../types';

interface VisualAnimationDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchCamera?: (slot: CameraSlot) => void;
  onLaunchViewer?: (station: ViewerStation) => void;
}

interface CameraNode {
  id: CameraSlot;
  name: string;
  room: string;
  battery: number;
  temp: number;
  isBlackout: boolean;
  hasAlert: boolean;
  alertType?: string;
  fps: number;
}

interface ViewerNode {
  id: ViewerStation;
  name: string;
  deviceType: 'tablet' | 'phone' | 'tv';
  activeCam: CameraSlot;
  isReceiving: boolean;
}

export const VisualAnimationDemoModal: React.FC<VisualAnimationDemoModalProps> = ({
  isOpen,
  onClose,
  onLaunchCamera,
  onLaunchViewer,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [selectedCamForAlert, setSelectedCamForAlert] = useState<CameraSlot>('cam1');
  const [ecoModeGlobal, setEcoModeGlobal] = useState(true);
  const [batteryProtectionGlobal, setBatteryProtectionGlobal] = useState(true);
  const [activeTab, setActiveTab] = useState<'architecture' | 'packet_flow' | 'power_safety'>('architecture');

  // Node states for the 6 cameras
  const [cameras, setCameras] = useState<CameraNode[]>([
    { id: 'cam1', name: 'Cam 1', room: 'Front Door', battery: 79, temp: 28, isBlackout: true, hasAlert: false, fps: 15 },
    { id: 'cam2', name: 'Cam 2', room: 'Living Room', battery: 80, temp: 29, isBlackout: true, hasAlert: false, fps: 15 },
    { id: 'cam3', name: 'Cam 3', room: 'Backyard', battery: 78, temp: 31, isBlackout: true, hasAlert: false, fps: 12 },
    { id: 'cam4', name: 'Cam 4', room: 'Garage', battery: 80, temp: 30, isBlackout: true, hasAlert: false, fps: 15 },
    { id: 'cam5', name: 'Cam 5', room: 'Kitchen', battery: 79, temp: 29, isBlackout: true, hasAlert: false, fps: 15 },
    { id: 'cam6', name: 'Cam 6', room: 'Nursery', battery: 80, temp: 27, isBlackout: true, hasAlert: false, fps: 15 },
  ]);

  // Node states for the 3 viewers
  const [viewers, setViewers] = useState<ViewerNode[]>([
    { id: 'viewer1', name: 'Viewer 1: Living Room iPad', deviceType: 'tablet', activeCam: 'cam1', isReceiving: true },
    { id: 'viewer2', name: 'Viewer 2: Family Phone', deviceType: 'phone', activeCam: 'cam2', isReceiving: true },
    { id: 'viewer3', name: 'Viewer 3: Caregiver TV Screen', deviceType: 'tv', activeCam: 'cam1', isReceiving: true },
  ]);

  const [activeAlertMsg, setActiveAlertMsg] = useState<string | null>(null);
  const [packetsSentCount, setPacketsSentCount] = useState(1482);
  const [driveBackupsCount, setDriveBackupsCount] = useState(38);
  const [pulseTick, setPulseTick] = useState(0);

  // Animated pulse ticker
  useEffect(() => {
    if (!isOpen || !isPlaying) return;
    const interval = setInterval(() => {
      setPulseTick((t) => (t + 1) % 100);
      setPacketsSentCount((p) => p + 6);
    }, 1200 / simSpeed);
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, simSpeed]);

  if (!isOpen) return null;

  // Trigger simulated motion event on a camera
  const handleTriggerMotion = (slot: CameraSlot, eventType: string = 'Person Detected') => {
    setCameras((prev) =>
      prev.map((c) =>
        c.id === slot
          ? { ...c, hasAlert: true, alertType: eventType }
          : c
      )
    );

    const targetCam = cameras.find((c) => c.id === slot);
    setActiveAlertMsg(`⚡ SIMULATED EVENT: ${eventType.toUpperCase()} on ${targetCam?.name} (${targetCam?.room})! Dispatched to all 3 Viewers & saved to Google Drive!`);
    setDriveBackupsCount((d) => d + 1);

    // Auto-clear alert after 5s
    setTimeout(() => {
      setCameras((prev) =>
        prev.map((c) => (c.id === slot ? { ...c, hasAlert: false, alertType: undefined } : c))
      );
      setActiveAlertMsg(null);
    }, 5000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-slate-950 border-3 border-amber-500/80 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b-2 border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow">
              <Activity className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  HGUARD LIVE ARCHITECTURE DEMO
                </h3>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  6 Cameras • 3 Viewers
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Visual demonstration of multi-camera streaming, Google Drive archiving & multi-screen viewer distribution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            aria-label="Close demo"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* DEMO TOOLBAR & TABS */}
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl flex items-center gap-1.5 transition"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause Demo' : 'Play Demo'}</span>
            </button>
            <button
              onClick={() => {
                setPulseTick(0);
                setPacketsSentCount(100);
              }}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              title="Reset metrics"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1.5 text-slate-300 font-bold ml-2">
              <span>Speed:</span>
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  className={`px-2 py-1 rounded-lg font-mono ${
                    simSpeed === spd ? 'bg-slate-700 text-amber-300 font-black' : 'text-slate-400'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEcoModeGlobal(!ecoModeGlobal)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition ${
                ecoModeGlobal
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Eco-Blackout: {ecoModeGlobal ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={() => setBatteryProtectionGlobal(!batteryProtectionGlobal)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition ${
                batteryProtectionGlobal
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>80% Guard: {batteryProtectionGlobal ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* ACTIVE EVENT TOAST NOTIFICATION */}
        {activeAlertMsg && (
          <div className="mx-4 mt-3 bg-red-600/90 border-2 border-red-400 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 text-sm font-bold shadow-lg animate-bounce">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
              <span>{activeAlertMsg}</span>
            </div>
            <span className="text-xs bg-black/40 px-2 py-1 rounded-lg">Real-time Stream</span>
          </div>
        )}

        {/* MAIN VISUAL ANIMATION CANVAS */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* 3-COLUMN TOPOLOGY MAP: 6 CAMERAS -> CLOUD & GOOGLE DRIVE -> 3 VIEWERS */}
          <div className="bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-5 sm:p-6 shadow-inner relative overflow-hidden">
            {/* Background grid dots */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* LEFT COLUMN (COL 1-4): 6 OLD PHONE CAMERA UNITS */}
              <div className="lg:col-span-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                      Up to 6 Old Phones (Transmitters)
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                    6 Online
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {cameras.map((cam) => {
                    const isAlerting = cam.hasAlert;
                    return (
                      <div
                        key={cam.id}
                        className={`p-2.5 rounded-2xl border-2 transition relative flex flex-col justify-between ${
                          isAlerting
                            ? 'bg-red-950/80 border-red-500 shadow-lg shadow-red-500/30 ring-2 ring-red-400'
                            : ecoModeGlobal
                            ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-white flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5 text-amber-400" />
                            {cam.name}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isAlerting ? 'bg-red-400 animate-ping' : 'bg-emerald-400'
                            }`}
                          />
                        </div>

                        <div className="text-[11px] text-slate-300 font-medium truncate mb-1">
                          {cam.room}
                        </div>

                        {/* Display simulation */}
                        <div
                          className={`h-7 rounded-lg flex items-center justify-center text-[10px] font-mono mb-2 border ${
                            ecoModeGlobal
                              ? 'bg-black text-slate-500 border-slate-900'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {ecoModeGlobal ? '🌙 Eco-Blackout' : 'Live Screen'}
                        </div>

                        {/* Hardware gauges */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <BatteryCharging className="w-3 h-3" />
                            {cam.battery}%
                          </span>
                          <span className="flex items-center gap-0.5 text-cyan-300 font-mono">
                            <Flame className="w-3 h-3" />
                            {cam.temp}°C
                          </span>
                          <span className="font-mono text-amber-300">{cam.fps}fps</span>
                        </div>

                        {/* Interactive Trigger Button */}
                        <button
                          type="button"
                          onClick={() => handleTriggerMotion(cam.id, 'Person Motion')}
                          className="mt-2 py-1 bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-black text-[10px] font-bold rounded-lg border border-slate-700 transition flex items-center justify-center gap-1"
                        >
                          <Zap className="w-2.5 h-2.5" />
                          <span>Simulate Motion</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CENTER COLUMN (COL 5-8): HGUARD ZERO-CRASH CLOUD & GOOGLE DRIVE VAULT */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center text-center gap-4 py-2">
                {/* Connecting animated data waves */}
                <div className="w-full flex items-center justify-center gap-1 text-amber-400 text-xs font-mono">
                  <span className="animate-pulse">◀ AES-256 GCM Frames ▶</span>
                </div>

                <div className="w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-3 border-amber-500/50 rounded-3xl p-5 shadow-2xl relative">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400 mb-3 shadow-lg">
                    <Shield className="w-9 h-9 animate-spin-slow" />
                  </div>

                  <h4 className="text-base sm:text-lg font-black text-white">
                    HGuard Core Hub
                  </h4>
                  <p className="text-xs text-amber-300 font-bold mt-0.5">
                    Zero-Crash 24/7 Session Engine
                  </p>

                  <div className="my-3 border-t border-slate-800 pt-3 flex flex-col gap-2 text-left">
                    <div className="flex items-center justify-between text-xs bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                        Google Drive Folder:
                      </span>
                      <span className="font-mono text-emerald-300 font-bold">
                        HGuard_Surveillance/
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Gemini Vision AI:
                      </span>
                      <span className="font-mono text-amber-300 font-bold">
                        Edge + Cloud Multimodal
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-cyan-400" />
                        Broadcast Channel:
                      </span>
                      <span className="font-mono text-cyan-300 font-bold">
                        Sub-100ms WebRTC
                      </span>
                    </div>
                  </div>

                  {/* Flowing animated metrics */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">Packets Routed</span>
                      <span className="font-mono text-amber-400 font-bold text-sm">
                        {packetsSentCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block">Drive Vault Clips</span>
                      <span className="font-mono text-emerald-400 font-bold text-sm">
                        {driveBackupsCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full flex items-center justify-center gap-1 text-cyan-400 text-xs font-mono">
                  <span className="animate-pulse">▶ Multi-Viewer Feed ▶</span>
                </div>
              </div>

              {/* RIGHT COLUMN (COL 9-12): 3 CONCURRENT VIEWER STATIONS */}
              <div className="lg:col-span-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                      3 Concurrent Viewers
                    </span>
                  </div>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-500/30">
                    3 Active
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {viewers.map((viewer, idx) => (
                    <div
                      key={viewer.id}
                      className="p-3 bg-slate-950 border-2 border-slate-800 rounded-2xl flex flex-col gap-2 hover:border-cyan-500/60 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg">
                            {viewer.deviceType === 'tablet' ? (
                              <Tablet className="w-4 h-4" />
                            ) : viewer.deviceType === 'phone' ? (
                              <Smartphone className="w-4 h-4" />
                            ) : (
                              <Tv className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-black text-white">{viewer.name}</div>
                            <div className="text-[10px] text-slate-400">
                              Connected via PIN • Zero Latency
                            </div>
                          </div>
                        </div>

                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      </div>

                      {/* Mini simulated screen display with 6-grid thumbnail preview */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center justify-between">
                        <span className="text-[11px] text-slate-300 font-medium">
                          Active Stream: <strong className="text-amber-400">6-Cam Grid</strong>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                          Decrypted AES
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE CONTROLS FOR TESTING SCENARIOS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Scenario 1: Trigger Motion on Front Door */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Test 1: Motion & AI Trigger</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Simulate someone approaching Camera 1 (Front Door). Watches all 3 viewers receive instant warning and audio alert.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTriggerMotion('cam1', 'Front Door Person Detected')}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow transition"
              >
                Fire Cam 1 Alert
              </button>
            </div>

            {/* Scenario 2: Test Nursery / Cry Detection on Cam 6 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <Volume2 className="w-4 h-4" />
                  <span>Test 2: Nursery Cry / Audio Alert</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Simulate high-frequency baby cry detection on Camera 6. Bypasses silent mode on all 3 viewer stations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTriggerMotion('cam6', 'Nursery Audio Anomaly (Baby Cry)')}
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow transition"
              >
                Fire Cam 6 Cry Alert
              </button>
            </div>

            {/* Scenario 3: Hardware Battery Protection Test */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <BatteryCharging className="w-4 h-4" />
                  <span>Test 3: 80% Battery Smart Cutoff</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Ensures all 6 phones stay at or below 80% charge. Prevents lithium battery swelling during 24/7 continuous duty.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCameras((prev) =>
                    prev.map((c) => ({ ...c, battery: 80, temp: 28 }))
                  );
                  setActiveAlertMsg('✓ Battery Guard engaged across all 6 phones: Swelling risk neutralized at 80%.');
                  setTimeout(() => setActiveAlertMsg(null), 4000);
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow transition"
              >
                Simulate 80% Cutoff
              </button>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER WITH CALL TO ACTIONS */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Powered by HGuard Senior Surveillance • Dual-Mode Architecture • 100% Free Forever
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm rounded-xl transition shadow"
            >
              Close Animation Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
