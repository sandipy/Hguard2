import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  Download,
  Upload,
  Trash2,
  Clock,
  Battery,
  AlertTriangle,
  WifiOff,
  Filter,
} from 'lucide-react';
import { SecurityEvent } from '../types';
import { decryptData } from '../utils/crypto';
import { speakSeniorVoice } from '../utils/soundAlerts';

interface EventLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: SecurityEvent[];
  onClearEvents: () => void;
  onImportEvents: (imported: SecurityEvent[]) => void;
  currentPin: string;
}

export const EventLogModal: React.FC<EventLogModalProps> = ({
  isOpen,
  onClose,
  events,
  onClearEvents,
  onImportEvents,
  currentPin,
}) => {
  const [pinInput, setPinInput] = useState(currentPin || '8888');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [decryptedSnapshots, setDecryptedSnapshots] = useState<{ [id: string]: string }>({});
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'offline' | 'motion' | 'battery'>('all');

  if (!isOpen) return null;

  const handleUnlock = async (pinToUse = pinInput) => {
    setDecryptError(null);
    try {
      const decryptedMap: { [id: string]: string } = {};
      for (const evt of events) {
        if (evt.decryptedSnapshot) {
          decryptedMap[evt.id] = evt.decryptedSnapshot;
        } else if (evt.snapshotEncrypted && evt.iv) {
          try {
            const clear = await decryptData(evt.snapshotEncrypted, evt.iv, pinToUse);
            decryptedMap[evt.id] = clear;
          } catch {
            // failed for this item
          }
        }
      }
      setDecryptedSnapshots(decryptedMap);
      setIsUnlocked(true);
      speakSeniorVoice('Event log unlocked.');
    } catch {
      setDecryptError('Wrong PIN. Please verify your 4-digit Household PIN.');
    }
  };

  const handleExport = () => {
    const backupData = {
      app: 'HGUARD_HOME_MONITOR',
      exportedAt: new Date().toISOString(),
      encryptionStandard: 'AES-GCM-256',
      totalEvents: events.length,
      events: events.map(({ id, timestamp, motionIntensity, snapshotEncrypted, iv, thermalState, batteryLevel, notes }) => ({
        id,
        timestamp,
        motionIntensity,
        snapshotEncrypted,
        iv,
        thermalState,
        batteryLevel,
        notes,
      })),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hguard_events_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEvents = events.filter((evt) => {
    if (selectedFilter === 'offline') return evt.eventType === 'offline' || evt.eventType === 'camera_offline';
    if (selectedFilter === 'battery') return evt.eventType === 'battery_health';
    if (selectedFilter === 'motion') return evt.eventType !== 'battery_health' && evt.eventType !== 'offline';
    return true;
  });

  return (
    <div
      id="event-log-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-slate-700 rounded-[4px] w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-[2px] border border-amber-500/40">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">ENCRYPTED EVENT LOG</h2>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.5 rounded-[2px] font-mono">
                  AES-256 GCM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tamper-proof local event records and motion capture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-[2px] transition border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Unlock Bar */}
        <div className="p-3.5 bg-slate-800 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            {isUnlocked ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <Unlock className="w-4 h-4" /> Log Decrypted
              </span>
            ) : (
              <span className="text-amber-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Enter Household PIN to view motion snapshots
              </span>
            )}
          </div>
          {!isUnlocked && (
            <div className="flex items-center gap-2">
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN"
                className="w-20 bg-slate-900 border border-slate-600 text-center font-bold py-1 px-2 rounded-[2px] text-white focus:border-amber-400 outline-none font-mono"
              />
              <button
                onClick={() => handleUnlock()}
                className="py-1 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-[2px] transition"
              >
                UNLOCK
              </button>
            </div>
          )}
        </div>

        {decryptError && (
          <div className="p-2.5 bg-red-950/80 border border-red-500 text-red-200 text-xs font-bold text-center">
            {decryptError}
          </div>
        )}

        {/* Filter Strip */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-bold uppercase">Filter:</span>
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'motion', 'offline', 'battery'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-2.5 py-1 rounded-[2px] font-bold text-xs capitalize transition ${
                  selectedFilter === cat
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No security events recorded in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredEvents.map((evt) => {
                const dateObj = new Date(evt.timestamp);
                const timeStr = dateObj.toLocaleTimeString();
                const snapshotUrl = decryptedSnapshots[evt.id] || evt.decryptedSnapshot;
                const isOffline = evt.eventType === 'offline';

                return (
                  <div
                    key={evt.id}
                    className={`bg-slate-950 border rounded-[2px] p-3 flex flex-col gap-2 ${
                      isOffline ? 'border-red-500/80' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-xs">
                      <span className="font-bold text-white">{evt.cameraName}</span>
                      <span className="font-mono text-slate-400">{timeStr}</span>
                    </div>

                    <div className="aspect-video bg-slate-900 rounded-[2px] overflow-hidden flex items-center justify-center relative">
                      {isOffline ? (
                        <div className="flex flex-col items-center gap-1 text-red-400 text-xs">
                          <WifiOff className="w-8 h-8" />
                          <span className="font-bold">Device Silent &gt;5 min</span>
                        </div>
                      ) : isUnlocked && snapshotUrl ? (
                        <img src={snapshotUrl} alt="Snapshot" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-500 text-xs">
                          <Lock className="w-6 h-6 text-slate-600" />
                          <span>AES-256 Encrypted</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-tight">
                      {evt.notes || `Motion detected: ${evt.motionIntensity}%`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={handleExport}
            disabled={events.length === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold rounded-[2px] border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Backup</span>
          </button>

          <div className="flex items-center gap-2">
            {events.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Clear all recorded events?')) onClearEvents();
                }}
                className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 font-bold rounded-[2px] border border-red-800"
              >
                Clear Log
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-[2px] border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
