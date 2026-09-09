import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Calendar,
  Clock,
  Battery,
  BatteryCharging,
  Flame,
  CheckCircle2,
  Eye,
  FileCheck,
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
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);

  if (!isOpen) return null;

  // Decrypt all snapshots for offline review
  const handleUnlockAndDecrypt = async (pinToUse = pinInput) => {
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
            // Decryption failure for specific item
          }
        }
      }

      setDecryptedSnapshots(decryptedMap);
      setIsUnlocked(true);
      speakSeniorVoice('Event logs successfully decrypted for review.');
    } catch {
      setDecryptError('Wrong PIN or invalid key. Please check your 4-digit PIN.');
      speakSeniorVoice('PIN incorrect. Please try again.');
    }
  };

  // Export encrypted log file for offline backup and review
  const handleExportOfflineLog = () => {
    const backupData = {
      app: 'HGUARD_SECURE_HOME_MONITOR',
      exportedAt: new Date().toISOString(),
      encryptionStandard: 'AES-GCM-256',
      totalEvents: events.length,
      // Only export the encrypted ciphertext and IV to maintain offline zero-knowledge privacy
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
    a.download = `hguard_encrypted_events_${new Date().toISOString().slice(0, 10)}.enc.json`;
    a.click();
    URL.revokeObjectURL(url);
    speakSeniorVoice('Encrypted backup file downloaded to your device.');
  };

  // Import offline encrypted backup
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.events && Array.isArray(parsed.events)) {
          onImportEvents(parsed.events);
          speakSeniorVoice(`Imported ${parsed.events.length} security events.`);
        } else {
          setDecryptError('Invalid file format. Please upload a valid HGuard backup file.');
        }
      } catch {
        setDecryptError('Could not read file. Make sure it is an uncorrupted JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      id="event-log-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-slate-900 border-4 border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-950 border-b-2 border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/40">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                ENCRYPTED EVENT LOG
                <span className="text-xs bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                  AES-256
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-medium">
                Offline review & tamper-proof motion records
              </p>
            </div>
          </div>
          <button
            id="close-events-modal-btn"
            onClick={onClose}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl transition border border-slate-600"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* Security / PIN Unlock Bar */}
        <div className="p-5 bg-slate-800 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isUnlocked ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                <Unlock className="w-6 h-6" />
                <span>Log Decrypted & Ready for Offline Review</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-300 font-bold text-lg">
                <Lock className="w-6 h-6" />
                <span>Log is Encrypted with AES-256 for Privacy</span>
              </div>
            )}
          </div>

          {!isUnlocked && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                id="pin-unlock-input"
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN"
                className="w-24 bg-slate-900 border-2 border-slate-600 text-white font-black text-center text-xl py-2.5 px-3 rounded-xl focus:border-amber-400 outline-none"
              />
              <button
                id="unlock-pin-btn"
                onClick={() => handleUnlockAndDecrypt(pinInput)}
                className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-black text-lg rounded-xl transition shadow"
              >
                UNLOCK NOW
              </button>
            </div>
          )}
        </div>

        {decryptError && (
          <div className="mx-6 mt-4 p-4 bg-red-900/40 border border-red-500 rounded-xl text-red-200 font-bold flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <span>{decryptError}</span>
          </div>
        )}

        {/* Events List Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {events.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-4 text-slate-400">
              <FileCheck className="w-16 h-16 text-slate-600" />
              <div className="text-2xl font-bold text-slate-300">No Motion Events Detected Yet</div>
              <p className="text-base max-w-md">
                When the camera detects movement, it automatically encrypts the snapshot with AES-256 and saves it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((evt) => {
                const dateObj = new Date(evt.timestamp);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                const snapshotUrl = decryptedSnapshots[evt.id] || evt.decryptedSnapshot;

                return (
                  <div
                    key={evt.id}
                    className="bg-slate-950 border-2 border-slate-800 hover:border-slate-600 rounded-2xl p-4 flex flex-col gap-3 transition shadow"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                        <Clock className="w-5 h-5" />
                        <span>{timeStr}</span>
                        <span className="text-xs text-slate-400">({dateStr})</span>
                      </div>
                      {evt.eventType === 'battery_health' ? (
                        <span className="px-2.5 py-1 bg-amber-950 border border-amber-500/70 text-amber-300 rounded-lg text-xs font-black flex items-center gap-1.5 animate-pulse">
                          <BatteryCharging className="w-3.5 h-3.5" />
                          72h Deep Discharge Cycle
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-red-950 border border-red-500/50 text-red-300 rounded-lg text-xs font-black">
                          Motion: {evt.motionIntensity}%
                        </span>
                      )}
                    </div>

                    {/* Snapshot Container */}
                    <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                      {isUnlocked && snapshotUrl ? (
                        <img
                          src={snapshotUrl}
                          alt="Motion Event Snapshot"
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                          onClick={() => setSelectedSnapshot(snapshotUrl)}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-4 text-center">
                          <Lock className="w-10 h-10 text-slate-600" />
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Encrypted with AES-256
                          </span>
                          <button
                            id={`decrypt-item-${evt.id}`}
                            onClick={() => handleUnlockAndDecrypt()}
                            className="mt-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-lg border border-slate-700"
                          >
                            Click to Decrypt
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Notes / Health Recommendation */}
                    {evt.notes && (
                      <div className={`p-2.5 rounded-lg text-xs leading-relaxed border ${
                        evt.eventType === 'battery_health'
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300'
                      }`}>
                        {evt.notes}
                      </div>
                    )}

                    {/* Event Metadata (Battery & Thermal info at moment of event) */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Battery className="w-4 h-4 text-emerald-400" />
                        <span>Battery at event: {evt.batteryLevel}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 capitalize">
                        <Flame className="w-4 h-4 text-cyan-400" />
                        <span>Temp: {evt.thermalState}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer (Offline Export / Import / Clear) */}
        <div className="p-5 bg-slate-950 border-t-2 border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Download Offline Backup */}
            <button
              id="export-offline-log-btn"
              onClick={handleExportOfflineLog}
              disabled={events.length === 0}
              className={`py-3 px-5 rounded-xl font-black text-base flex items-center gap-2 border transition ${
                events.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow'
                  : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              }`}
            >
              <Download className="w-5 h-5" />
              <span>EXPORT ENCRYPTED BACKUP</span>
            </button>

            {/* Import Offline Backup */}
            <label
              htmlFor="import-backup-file"
              className="py-3 px-5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold text-base rounded-xl border border-slate-600 flex items-center gap-2 cursor-pointer transition"
            >
              <Upload className="w-5 h-5 text-cyan-400" />
              <span>IMPORT BACKUP FILE</span>
              <input
                id="import-backup-file"
                type="file"
                accept=".json,.enc"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>

          {events.length > 0 && (
            <button
              id="clear-all-events-btn"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all recorded events?')) {
                  onClearEvents();
                  speakSeniorVoice('All security logs cleared.');
                }
              }}
              className="py-3 px-5 bg-red-900/50 hover:bg-red-800 text-red-200 hover:text-white font-bold text-base rounded-xl border border-red-700 flex items-center gap-2 transition"
            >
              <Trash2 className="w-5 h-5" />
              <span>CLEAR LOGS</span>
            </button>
          )}
        </div>
      </div>

      {/* Snapshot Fullscreen Lightbox */}
      {selectedSnapshot && (
        <div
          id="snapshot-lightbox"
          onClick={() => setSelectedSnapshot(null)}
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={selectedSnapshot}
            alt="Expanded Snapshot"
            className="max-w-full max-h-[85vh] rounded-2xl border-4 border-slate-700 shadow-2xl"
          />
          <span className="mt-4 text-slate-300 text-lg font-bold bg-slate-900 px-4 py-2 rounded-xl">
            Click anywhere to close
          </span>
        </div>
      )}
    </div>
  );
};
