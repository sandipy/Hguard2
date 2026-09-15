import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { CameraSlot, CameraHeartbeatInfo } from '../types';
import { globalHeartbeatService } from '../utils/heartbeatService';
import { globalStreamChannel } from '../utils/streamChannel';

interface HeartbeatStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEventLog?: () => void;
}

const CAMERA_SLOTS: { id: CameraSlot; defaultName: string; location: string }[] = [
  { id: 'cam1', defaultName: 'Camera 1', location: 'Front Entrance' },
  { id: 'cam2', defaultName: 'Camera 2', location: 'Master Bedroom' },
  { id: 'cam3', defaultName: 'Camera 3', location: 'Living Room' },
  { id: 'cam4', defaultName: 'Camera 4', location: 'Kitchen / Stove' },
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
    setTestSimMessage(`Simulated >5-min silence on ${name}. 'Offline' event logged!`);
    setTimeout(() => setTestSimMessage(null), 6000);
  };

  const handleSimulateRecovery = (slot: CameraSlot, name: string) => {
    globalStreamChannel.sendCameraCommand({
      command: 'REMOTE_REBOOT',
      targetCameraId: slot,
      timestamp: Date.now(),
    });
    globalHeartbeatService.simulateRecovery(slot);
    setTestSimMessage(`Restart command sent to ${name}. Camera recovered.`);
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-slate-700 w-full max-w-xl rounded-[4px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950/80 border border-cyan-500/50 rounded-[2px] text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Network Heartbeat Watcher</h2>
                <span className="px-1.5 py-0.2 rounded-[2px] text-[10px] font-black bg-emerald-500/20 text-emerald-300 uppercase">
                  5-Min Rule Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detects disconnected cameras after 5 minutes of silence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 rounded-[2px] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {testSimMessage && (
          <div className="p-2.5 bg-amber-500/20 border-b border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{testSimMessage}</span>
          </div>
        )}

        {/* Status Strip */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-2 bg-slate-900 border border-slate-800 rounded-[2px]">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Live Transmitting</span>
            <strong className="text-emerald-400 text-base font-black">
              {onlineList.length} / {CAMERA_SLOTS.length} Cameras
            </strong>
          </div>
          <div className="p-2 bg-slate-900 border border-slate-800 rounded-[2px]">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Silent &gt;5 Minutes</span>
            <strong className={`text-base font-black ${offlineList.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {offlineList.length} Offline
            </strong>
          </div>
        </div>

        {/* Camera List */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-2">
          {CAMERA_SLOTS.map((slot) => {
            const info = heartbeats[slot.id];
            const isOffline = info?.status === 'offline';
            const name = info?.cameraName || slot.defaultName;
            const elapsedSec = info?.secondsSinceLastSeen || 0;

            return (
              <div
                key={slot.id}
                className={`p-3 rounded-[2px] border flex items-center justify-between gap-3 text-xs ${
                  isOffline ? 'bg-red-950/30 border-red-500/60' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isOffline ? (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  ) : (
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  )}
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({slot.id.toUpperCase()})</span>
                      {isOffline && (
                        <span className="text-[9px] bg-red-600 text-white font-bold px-1 rounded-[2px]">
                          OFFLINE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {slot.location}   Last seen: <span className="font-mono text-slate-300">{formatElapsed(elapsedSec)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isOffline ? (
                    <button
                      onClick={() => handleSimulateRecovery(slot.id, name)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-[2px] flex items-center gap-1 transition"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reboot</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSimulateTimeout(slot.id, name)}
                      className="px-2 py-1 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 rounded-[2px] text-[11px] border border-slate-700 transition"
                    >
                      Test Timeout
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-[2px] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
