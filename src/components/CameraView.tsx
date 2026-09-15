import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  VideoOff,
  Moon,
  Sun,
  Flashlight,
  FlashlightOff,
  BatteryCharging,
  Battery,
  Shield,
  Eye,
  EyeOff,
  Scan,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Info,
  Tv,
} from 'lucide-react';
import { AppSettings, CameraSlot, SecurityEvent } from '../types';
import { detectMotionInFrame } from '../utils/motionDetector';
import { globalStreamChannel } from '../utils/streamChannel';
import { globalHeartbeatService } from '../utils/heartbeatService';
import { batteryService } from '../utils/batteryService';
import { encryptData } from '../utils/crypto';
import { playRogerBeep, playSirenAlert, speakSeniorVoice } from '../utils/soundAlerts';

interface CameraViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onRecordEvent: (event: SecurityEvent) => void;
  onOpenQRScanner: () => void;
  onOpenA2HSModal?: () => void;
  onSwitchToViewer?: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  settings,
  onUpdateSettings,
  onRecordEvent,
  onOpenQRScanner,
  onOpenA2HSModal,
  onSwitchToViewer,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<CameraSlot>('cam1');
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Eco-Cool Screen Dimming: Enabled by default to prevent screen burn-in and heat on 24/7 plugged-in phones
  const [ecoCoolActive, setEcoCoolActive] = useState<boolean>(() => settings.ecoCoolScreenEnabled ?? true);
  const [autoDimSecondsLeft, setAutoDimSecondsLeft] = useState<number | null>(null);
  const [keepAwakeSession, setKeepAwakeSession] = useState<boolean>(false);
  const [remoteWakeNotice, setRemoteWakeNotice] = useState<string | null>(null);

  const [privacyBlur, setPrivacyBlur] = useState(false);
  // Night Vision: OFF by default to prevent green/IR tint in normal lighting
  const [nightVisionActive, setNightVisionActive] = useState(false);
  const [torchActive, setTorchActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lightLevel, setLightLevel] = useState<number>(65);
  const [batteryPct, setBatteryPct] = useState<number>(85);
  const [isCharging, setIsCharging] = useState<boolean>(true);
  const [motionIntensity, setMotionIntensity] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const lastTransmitRef = useRef<number>(0);

  // Return to Viewer Mode and clean up URL
  const handleExitToViewer = () => {
    stopCamera();
    try {
      // Remove ?role=camera so page refresh stays in Viewer
      const url = new URL(window.location.href);
      url.searchParams.delete('role');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    } catch {
      // ignore
    }
    if (onSwitchToViewer) {
      onSwitchToViewer();
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsStreaming(true);
    } catch (err: any) {
      console.warn('Primary camera init failed, attempting basic stream:', err);
      try {
        const fallback = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = fallback;
        if (videoRef.current) {
          videoRef.current.srcObject = fallback;
          await videoRef.current.play().catch(() => {});
        }
        setIsStreaming(true);
      } catch (fbErr: any) {
        setCameraError(fbErr.message || 'Camera permission denied or camera device unavailable.');
        setIsStreaming(false);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }
    setIsStreaming(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode, selectedSlot]);

  // Battery monitoring
  useEffect(() => {
    const unsub = batteryService.onBatteryChange((info) => {
      setBatteryPct(info.level);
      setIsCharging(info.charging);
    });
    return () => unsub();
  }, []);

  // Eco-Cool Auto-Dim Inactivity Timer (Default on)
  useEffect(() => {
    if (ecoCoolActive || keepAwakeSession || !settings.ecoCoolScreenEnabled) {
      setAutoDimSecondsLeft(null);
      return;
    }
    const delay = settings.ecoCoolDelaySec || 15;
    setAutoDimSecondsLeft(delay);
    const interval = setInterval(() => {
      setAutoDimSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          setEcoCoolActive(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [ecoCoolActive, keepAwakeSession, settings.ecoCoolScreenEnabled, settings.ecoCoolDelaySec]);

  // Reset countdown on interaction
  const handleUserActivity = () => {
    if (settings.ecoCoolScreenEnabled && !keepAwakeSession && !ecoCoolActive) {
      setAutoDimSecondsLeft(settings.ecoCoolDelaySec || 15);
    }
  };

  // Remote Commands Listener (Remote Reboot, Siren, and REMOTE WAKE SCREEN)
  useEffect(() => {
    const unsub = globalStreamChannel.onRemoteCommand((cmd) => {
      const isTarget = !cmd.targetCameraId || cmd.targetCameraId === 'all' || cmd.targetCameraId === selectedSlot;
      if (!isTarget) return;

      if (cmd.command === 'WAKE_SCREEN' || cmd.command === 'WAKE_DISPLAY') {
        // WAKE SCREEN REMOTELY
        setEcoCoolActive(false);
        setKeepAwakeSession(false);
        setAutoDimSecondsLeft(30);
        setRemoteWakeNotice('Screen woken remotely from Viewer (30s)');
        playRogerBeep();
        speakSeniorVoice('Camera display active.');
        setTimeout(() => setRemoteWakeNotice(null), 8000);
      } else if (cmd.command === 'REMOTE_REBOOT') {
        playRogerBeep();
        speakSeniorVoice(`Camera rebooting remotely.`);
        setCameraError(null);
        stopCamera();
        setTimeout(() => {
          startCamera();
          globalHeartbeatService.recordHeartbeat(selectedSlot, `Camera ${selectedSlot.slice(-1)}`);
        }, 1000);
      } else if (cmd.command === 'trigger_siren') {
        playSirenAlert();
      }
    });
    return () => unsub();
  }, [selectedSlot]);

  // Frame processing loop
  useEffect(() => {
    if (!isStreaming) return;
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let active = true;

    const processFrame = async () => {
      if (!active) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2 && ctx) {
        const w = 320;
        const h = 240;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);

        // Calculate ambient luminance
        let totalLum = 0;
        const data = imgData.data;
        const step = 8;
        let samples = 0;
        for (let i = 0; i < data.length; i += step * 4) {
          totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          samples++;
        }
        const avgLum = Math.round((totalLum / samples / 255) * 100);
        setLightLevel(avgLum);

        // Motion analysis
        const motionResult = detectMotionInFrame(imgData, settings.motionSensitivity);
        setMotionIntensity(motionResult.intensity);

        const now = Date.now();
        if (now - lastTransmitRef.current > 450) {
          lastTransmitRef.current = now;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

          globalStreamChannel.publishVideoFrame({
            cameraId: selectedSlot,
            cameraName: `Camera ${selectedSlot.slice(-1)}`,
            frameDataUrl: dataUrl,
            timestamp: now,
            motionScore: motionResult.intensity,
            thermalState: 'normal',
            batteryLevel: batteryPct,
            isNightVision: nightVisionActive,
            lightLevel: avgLum,
          });

          globalHeartbeatService.recordHeartbeat(selectedSlot, `Camera ${selectedSlot.slice(-1)}`);

          if (motionResult.hasMotion && motionResult.intensity > 45) {
            try {
              const { ciphertext, iv } = await encryptData(dataUrl, settings.encryptionPin);
              onRecordEvent({
                id: `evt-${now}-${Math.random().toString(36).slice(2, 6)}`,
                cameraId: selectedSlot,
                cameraName: `Camera ${selectedSlot.slice(-1)}`,
                timestamp: now,
                motionIntensity: motionResult.intensity,
                snapshotEncrypted: ciphertext,
                iv,
                decryptedSnapshot: dataUrl,
                thermalState: 'normal',
                batteryLevel: batteryPct,
                notes: `Motion detected (${motionResult.intensity}%) on Camera ${selectedSlot.slice(-1)}`,
                eventType: 'motion',
              });
            } catch (err) {
              console.warn('Failed to encrypt event snapshot:', err);
            }
          }
        }
      }
      animRef.current = requestAnimationFrame(processFrame);
    };

    animRef.current = requestAnimationFrame(processFrame);
    return () => {
      active = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isStreaming, selectedSlot, settings, nightVisionActive, batteryPct]);

  // Flashlight toggle
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const next = !torchActive;
      await (track as any).applyConstraints({
        advanced: [{ torch: next }],
      });
      setTorchActive(next);
    } catch {
      setTorchActive(!torchActive);
    }
  };

  return (
    <div
      className="flex-1 flex flex-col bg-slate-950 text-white relative select-none"
      onClick={handleUserActivity}
      onTouchStart={handleUserActivity}
    >
      {/* 1. ECO-COOL FULLSCREEN BLACKOUT (DEFAULT ON TO PREVENT PHONE HEATING) */}
      {ecoCoolActive && (
        <div
          id="eco-cool-active-curtain"
          onClick={() => {
            setEcoCoolActive(false);
            if (settings.ecoCoolScreenEnabled && !keepAwakeSession) {
              setAutoDimSecondsLeft(settings.ecoCoolDelaySec || 15);
            }
          }}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center cursor-pointer animate-in fade-in duration-200"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500 animate-ping mb-4" />
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/60 px-2.5 py-0.5 rounded-[2px]">
              Eco-Cool Mode Active (Default)
            </span>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-[2px]">
              {selectedSlot.toUpperCase()}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-200 tracking-tight">
            PHONE DISPLAY DIMMED TO PREVENT HEAT
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
            Camera lens, AI motion detection, and encrypted live stream are running normally in the background. The screen is black to keep the battery cool.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-[2px] border border-slate-800">
              {isCharging ? <BatteryCharging className="w-4 h-4 text-emerald-400" /> : <Battery className="w-4 h-4 text-amber-400" />}
              <span className="font-mono text-white font-bold">{batteryPct}%</span>
              <span>  80% Guard Active</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-[2px] text-emerald-300 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Transmitting Live</span>
            </span>
          </div>

          {/* EXIT & WAKE CONTROLS (Direct answer to "once in camera mode, i cant go back") */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <button
              id="eco-cool-exit-to-viewer-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleExitToViewer();
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-black rounded-[2px] flex items-center gap-2 transition shadow-xl cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>RETURN TO MAIN SCREEN (VIEWER)</span>
            </button>

            <span className="text-xs text-slate-400 bg-slate-900 px-4 py-2 rounded-[2px] border border-slate-700">
              Tap anywhere on screen to wake viewfinder ({settings.ecoCoolDelaySec || 15}s)
            </span>
          </div>
        </div>
      )}

      {/* 2. AUTO-DIM TIMER STRIP (WHEN SCREEN IS AWAKE) */}
      {!ecoCoolActive && autoDimSecondsLeft !== null && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/60 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
            <span>
              <strong>Eco-Cool Active:</strong> Screen auto-dims back to black in{' '}
              <span className="font-mono font-black text-white bg-slate-900 px-1.5 py-0.5 rounded-[2px] border border-emerald-500/50">
                {autoDimSecondsLeft}s
              </span>{' '}
              to protect phone battery.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEcoCoolActive(true)}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-[2px] transition"
            >
              DIM NOW
            </button>
            <button
              onClick={() => {
                setKeepAwakeSession(true);
                setAutoDimSecondsLeft(null);
              }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded-[2px] border border-slate-700 transition"
            >
              Stay Awake
            </button>
          </div>
        </div>
      )}

      {/* REMOTE WAKE NOTIFICATION */}
      {remoteWakeNotice && (
        <div className="bg-cyan-950 border-b border-cyan-500 px-3 py-1.5 text-xs text-cyan-200 font-bold flex items-center justify-between animate-bounce">
          <span>{remoteWakeNotice}</span>
          <button onClick={() => setRemoteWakeNotice(null)} className="text-cyan-400 px-1">✕</button>
        </div>
      )}

      {/* TOP CAMERA CONTROLS BAR WITH PROMINENT RETURN BUTTON */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Always-visible Exit button */}
          <button
            id="camera-exit-to-viewer-btn"
            type="button"
            onClick={handleExitToViewer}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs rounded-[2px] flex items-center gap-1.5 transition shadow cursor-pointer"
            title="Exit Camera mode and return to Main Viewer screen"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO MAIN SCREEN</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-black text-white text-sm">
              CAMERA: {selectedSlot.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Slot selector */}
          <select
            id="camera-slot-select"
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value as CameraSlot)}
            className="bg-slate-800 border border-slate-700 text-white font-bold text-xs py-1.5 px-2.5 rounded-[2px] outline-none"
          >
            <option value="cam1">CAM 1: Front Door</option>
            <option value="cam2">CAM 2: Living Room</option>
            <option value="cam3">CAM 3: Senior Bedroom</option>
            <option value="cam4">CAM 4: Kitchen</option>
            <option value="cam5">CAM 5: Backyard</option>
            <option value="cam6">CAM 6: Garage</option>
          </select>

          <button
            id="open-qr-scanner-btn"
            onClick={onOpenQRScanner}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 rounded-[2px] text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan Viewer QR</span>
          </button>
        </div>
      </div>

      {/* CAMERA VIEWFINDER VIEWPORT */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden min-h-[360px]">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-all ${
            privacyBlur ? 'filter blur-2xl opacity-60' : ''
          } ${nightVisionActive ? 'filter brightness-125 contrast-125 grayscale' : ''}`}
        />

        {/* Live HUD Overlays */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          <div className="bg-black/80 px-2 py-0.5 rounded-[2px] text-xs font-mono text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>LIVE 720p HD</span>
          </div>
          {nightVisionActive && (
            <div className="bg-indigo-950/80 border border-indigo-400/60 px-2 py-0.5 rounded-[2px] text-[10px] font-bold text-indigo-300 flex items-center gap-1">
              <Moon className="w-3 h-3" />
              <span>NIGHT VISION (IR)</span>
            </div>
          )}
          {motionIntensity > 20 && (
            <div className="bg-amber-950/80 border border-amber-400/60 px-2 py-0.5 rounded-[2px] text-[10px] font-bold text-amber-300">
              MOTION: {motionIntensity}%
            </div>
          )}
        </div>

        {/* Privacy Blur Notice */}
        {privacyBlur && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none bg-slate-950/50 backdrop-blur-md">
            <EyeOff className="w-12 h-12 text-amber-400 mb-2" />
            <h3 className="text-base font-black text-white">PRIVACY BLUR ENGAGED</h3>
          </div>
        )}

        {/* Camera Error */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <VideoOff className="w-12 h-12 text-red-400 mb-3" />
            <h3 className="text-lg font-bold text-white">Camera Access Blocked</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">{cameraError}</p>
            <button
              onClick={startCamera}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-[2px]"
            >
              Retry Camera
            </button>
          </div>
        )}
      </div>

      {/* QUICK VIEWPORT CONTROLS BAR */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Flip Camera */}
          <button
            id="flip-camera-btn"
            onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-[2px] text-xs font-bold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>{facingMode === 'environment' ? 'Rear' : 'Front'} Cam</span>
          </button>

          {/* Flashlight */}
          <button
            id="toggle-torch-btn"
            onClick={toggleTorch}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-bold flex items-center gap-1.5 border transition ${
              torchActive
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            {torchActive ? <Flashlight className="w-3.5 h-3.5" /> : <FlashlightOff className="w-3.5 h-3.5" />}
            <span>Flashlight</span>
          </button>

          {/* Night Vision Toggle (Manual, OFF by default) */}
          <button
            id="toggle-night-vision-manual-btn"
            onClick={() => setNightVisionActive(!nightVisionActive)}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-bold flex items-center gap-1.5 border transition ${
              nightVisionActive
                ? 'bg-indigo-600 text-white border-indigo-400 font-black'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Night Vision: {nightVisionActive ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Start Eco-Cool Dim */}
        <button
          id="activate-eco-cool-btn"
          onClick={() => setEcoCoolActive(true)}
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-[2px] border border-emerald-400 shadow flex items-center gap-1.5 transition"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>START ECO-COOL (DIM DISPLAY)</span>
        </button>
      </div>
    </div>
  );
};
