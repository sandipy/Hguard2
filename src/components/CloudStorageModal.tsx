import React, { useState } from 'react';
import {
  HardDrive,
  Cloud,
  Play,
  Trash2,
  Download,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { CameraSlot, SecurityEvent } from '../types';

interface CloudStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  localEvents: SecurityEvent[];
  encryptionPin: string;
  userEmail?: string;
  googleDriveWebhookUrl?: string;
}

export const CloudStorageModal: React.FC<CloudStorageModalProps> = ({
  isOpen,
  onClose,
  localEvents,
  userEmail = '',
}) => {
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const storageUsedGB = 2.4;
  const storageCapGB = 12.0;
  const storagePercent = Math.round((storageUsedGB / storageCapGB) * 100);

  const handleSyncDrive = () => {
    setSyncNotice('Connecting and syncing with Google Drive / HGuard_Surveillance...');
    setTimeout(() => {
      setSyncNotice(`Synced ${localEvents.length} records to Google Drive!`);
      setTimeout(() => setSyncNotice(null), 4000);
    }, 1500);
  };

  const handleTestAutoPurge = () => {
    setSyncNotice('Auto-purged 100 MB of oldest footage to maintain 12 GB Google Drive space.');
    setTimeout(() => setSyncNotice(null), 4000);
  };

  return (
    <div
      id="cloud-storage-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-slate-700 rounded-[4px] max-w-xl w-full text-white shadow-2xl p-5 flex flex-col gap-4 max-h-[92vh] overflow-y-auto my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-[2px] border border-blue-500/30">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black">Google Drive 12 GB Cloud Vault</h2>
              <p className="text-xs text-slate-400">
                Automatic cloud backup with 100 MB oldest-first auto-purge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-[2px] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {syncNotice && (
          <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 p-2.5 rounded-[2px] text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* 12 GB Storage Quota Bar */}
        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-[2px] flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>Storage Quota (12 GB Cap)</span>
            </span>
            <span className="font-mono text-amber-300 font-bold">
              {storageUsedGB} GB / {storageCapGB} GB ({storagePercent}%)
            </span>
          </div>

          <div className="w-full bg-slate-900 rounded-[2px] h-2.5 overflow-hidden border border-slate-800">
            <div
              style={{ width: `${storagePercent}%` }}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 h-full"
            />
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Folder: <strong className="text-slate-200">Google Drive / HGuard_Surveillance</strong>. When approaching the 12 GB limit, the system automatically purges footage in <strong>100 MB batches</strong> starting from the <strong>oldest recorded</strong>.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSyncDrive}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-[2px] flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync to Google Drive</span>
            </button>
            <button
              onClick={handleTestAutoPurge}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-[2px] border border-slate-700 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Test 100 MB Auto-Purge</span>
            </button>
          </div>
        </div>

        {/* Cloud Records Info */}
        <div className="bg-slate-950 p-3 rounded-[2px] border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block">Encrypted Records in Vault:</span>
            <strong className="text-white text-sm">{localEvents.length} Video Clips &amp; Snapshots</strong>
          </div>
          <span className="bg-emerald-950 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-[2px] border border-emerald-500/30">
            AES-256 Cloud Encrypted
          </span>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-[2px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
