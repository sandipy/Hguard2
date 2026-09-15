import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Play,
  RotateCcw,
  ShieldAlert,
  Info,
  ExternalLink,
} from 'lucide-react';
import { CameraSlot, CameraHeartbeatInfo } from '../types';
import { globalHeartbeatService, HEARTBEAT_OFFLINE_TIMEOUT_MS } from '../utils/heartbeatService';

interface HeartbeatStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEventLog?: () => void;
}

const CAMERA_SLOTS: { id: CameraSlot; defaultName: string; location: string }[] = [
  { id: 'cam1', defaultName: 'Camera 1', location: 'Living Room' },
  { id: 'cam2', defaultName: 'Camera 2', location: 'Master Bedroom' },
  { id: 'cam3', defaultName: 'Camera 3', location: 'Front Entrance' },
  { id: 'cam4', defaultName: 'Camera 4', location: 'Kitchen / Dining' },
  { id: 'cam5', defaultName: 'Camera 5', location: 'Hallway / Stairs' },
  { id: 'cam6', defaultName: 'Camera 6', location: 'Backyard / Patio' },
];

export const HeartbeatStatusModal: React.FC<HeartbeatStatusModalProps> = ({
  isOpen,
  onClose,
  onOpenEventLog,
}) => {
  const [heartbeats, setHeartbeats] = useState<Record<CameraSlot, CameraHeartbeatInfo>>(() =>
    globalHeartbeatService.getAllHeartbeatInfos()
  );
  const [testSimMessage, setTestSimMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsub = globalHeartbeatService.onHeartbeatUpdate((states) => {
      setHeartbeats(states);
    });

    const interval = setInterval(() => {
      setHeartbeats(globalHeartbeatService.getAllHeartbeatInfos());
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const offlineList = (Object.values(heartbeats) as CameraHeartbeatInfo[]).filter((h) => h.status === 'offline');
  const onlineList = (Object.values(heartbeats) as CameraHeartbeatInfo[]).filter((h) => h.status === 'online');

  const handleSimulateTimeout = (slot: CameraSlot, name: string) => {
    globalHeartbeatService.simulateTimeout(slot);
    setTestSimMessage(`Simulated >5-min silence on ${name}. 'Offline' event logged & voice alert announced!`);
    setTimeout(() => setTestSimMessage(null), 7000);
  };

  const handleSimulateRecovery = (slot: CameraSlot, name: string) => {
    globalHeartbeatService.simulateRecovery(slot);
    setTestSimMessage(`Restored heartbeat for ${name}. Device reconnected.`);
    setTimeout(() => setTestSimMessage(null), 5000);
  };

  const formatElapsed = (sec: number) => {
    if (sec < 60) return `${sec}s ago`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s ago`;
  };

  return (
    <div
      id="heartbeat-status-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        id="heartbeat-status-modal-card"
        className="bg-slate-900 border-2 border-slate-700 w-full max-w-2xl rounded-[2px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/50 rounded-[2px] text-cyan-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Network Heartbeat Checker
                </h2>
                <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  5-Min Rule Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Continuously monitors camera data transmission • Logs &apos;Offline&apos; event if silent &gt;5 minutes
              </p>
            </div>
          </div>
          <button
            id="close-heartbeat-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-[2px] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK BANNER */}
        {testSimMessage && (
          <div className="p-3 bg-amber-500/20 border-b border-amber-500/50 text-amber-300 text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{testSimMessage}</span>
            </div>
            {onOpenEventLog && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEventLog();
                }}
                className="px-2 py-1 bg-amber-500 text-slate-950 font-black text-[11px] rounded-[2px] hover:bg-amber-400 transition shrink-0"
              >
                View in Event Log
              </button>
            )}
          </div>
        )}

        {/* SUMMARY STATS STRIP */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-[2px]">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Timeout Threshold</div>
            <div className="text-base font-black text-amber-400">5 Minutes</div>
            <div className="text-[10px] text-slate-500 font-mono">300,000 ms</div>
          </div>
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-[2px]">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Live Cameras</div>
            <div className="text-base font-black text-emerald-400">
              {onlineList.length} / {CAMERA_SLOTS.length}
            </div>
            <div className="text-[10px] text-slate-500">Transmitting data</div>
          </div>
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-[2px]">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Missing / Offline</div>
            <div className={`text-base font-black ${offlineList.length > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
              {offlineList.length}
            </div>
            <div className="text-[10px] text-slate-500">Silent &gt;5 min</div>
          </div>
        </div>

        {/* RULE INFO ACCORDION */}
        <div className="p-3.5 bg-slate-950/40 border-b border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-white">How the Heartbeat Checker protects your home:</span> Each camera device
            periodically streams video frames, status packets, and telemetry. If a camera fails to transmit any data for
            longer than <span className="text-amber-300 font-bold">5 minutes</span>, the checker flags the device as{' '}
            <span className="text-red-400 font-bold">Offline</span>, enters a permanent &apos;Offline&apos; event into the encrypted
            log, plays an audio alert tone, and announces senior voice warnings to ensure missing cameras are never overlooked.
          </div>
        </div>

        {/* CAMERA LIST */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Camera Devices &amp; Heartbeat Status</span>
            <span className="text-[11px] text-slate-500 normal-case">Updated every second</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {CAMERA_SLOTS.map((slot) => {
              const info = heartbeats[slot.id];
              const isOffline = info?.status === 'offline';
              const isWarning = info?.status === 'warning';
              const name = info?.cameraName || slot.defaultName;
              const elapsedSec = info?.secondsSinceLastSeen || 0;

              return (
                <div
                  key={slot.id}
                  className={`p-3.5 rounded-[2px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                    isOffline
                      ? 'bg-red-950/40 border-red-500/70 shadow'
                      : isWarning
                      ? 'bg-amber-950/30 border-amber-500/50'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-[2px] ${
                        isOffline
                          ? 'bg-red-900/80 text-red-300'
                          : isWarning
                          ? 'bg-amber-900/80 text-amber-300'
                          : 'bg-emerald-950 text-emerald-400'
                      }`}
                    >
                      {isOffline ? (
                        <WifiOff className="w-5 h-5 animate-pulse" />
                      ) : (
                        <Wifi className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm sm:text-base">{name}</span>
                        <span className="text-xs text-slate-400 font-mono">({slot.id.toUpperCase()})</span>
                        {isOffline ? (
                          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-black bg-red-600 text-white border border-red-400 animate-pulse">
                            OFFLINE (&gt;5m SILENT)
                          </span>
                        ) : isWarning ? (
                          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-black bg-amber-500/30 text-amber-300 border border-amber-500/50">
                            DELAYED SIGNAL
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-[2px] bg-emerald-400 animate-ping" />
                            ONLINE
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                        <span>Location: <strong className="text-slate-300">{slot.location}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Last seen: <strong className={isOffline ? 'text-red-400 font-mono' : 'text-slate-200 font-mono'}>{formatElapsed(elapsedSec)}</strong></span>
                        </span>
                        {info?.lastSeen && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            ({new Date(info.lastSeen).toLocaleTimeString()})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Simulation Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    {isOffline ? (
                      <button
                        id={`restore-heartbeat-btn-${slot.id}`}
                        onClick={() => handleSimulateRecovery(slot.id, name)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-[2px] flex items-center gap-1.5 transition shadow"
                        title="Simulate camera reconnection and fresh heartbeat"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>RECONNECT CAM</span>
                      </button>
                    ) : (
                      <button
                        id={`test-timeout-btn-${slot.id}`}
                        onClick={() => handleSimulateTimeout(slot.id, name)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 hover:border-red-500 border border-slate-700 font-bold text-xs rounded-[2px] flex items-center gap-1.5 transition"
                        title="Simulate 5-minute timeout to verify offline event logging and notifications"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>TEST 5-MIN TIMEOUT</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Rule specification: <strong>Heartbeat timeout &gt; 300s</strong> triggers encrypted audit log event &amp; voice warning.
          </div>
          <div className="flex items-center gap-2">
            {onOpenEventLog && (
              <button
                id="modal-open-event-log-btn"
                onClick={() => {
                  onClose();
                  onOpenEventLog();
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-[2px] border border-slate-700 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Event Log</span>
              </button>
            )}
            <button
              id="heartbeat-modal-done-btn"
              onClick={onClose}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-[2px] transition"
            >
              DONE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
