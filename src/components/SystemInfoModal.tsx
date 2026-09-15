import React from 'react';
import {
  X,
  ShieldCheck,
  BatteryCharging,
  Moon,
  Sparkles,
  Lock,
  Cloud,
  Tv,
} from 'lucide-react';

interface SystemInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  encryptionPin: string;
}

export const SystemInfoModal: React.FC<SystemInfoModalProps> = ({
  isOpen,
  onClose,
  encryptionPin,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="system-info-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-slate-700 rounded-[4px] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-[2px] text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Technical Specifications</h2>
              <p className="text-xs text-slate-400">Security standards and hardware safety</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-[2px] transition border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-950 p-3 rounded-[2px] border border-slate-800 flex flex-col gap-1">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <BatteryCharging className="w-4 h-4" />
              <span>Battery 80% Protection &amp; Eco-Cool</span>
            </span>
            <p className="text-slate-400">
              Phones kept plugged in 24/7 can suffer battery bulge. HGuard enforces an 80% battery cap alarm and auto-dims the screen to black (Eco-Cool mode) to prevent heat buildup.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-[2px] border border-slate-800 flex flex-col gap-1">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              <span>Zero-Knowledge AES-256 GCM</span>
            </span>
            <p className="text-slate-400">
              All stored motion snapshots and local logs are encrypted with AES-256 GCM using your Household PIN ({encryptionPin || '8888'}).
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-[2px] border border-slate-800 flex flex-col gap-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Tv className="w-4 h-4" />
              <span>Capacity: 6 Cameras &amp; 3 Viewers</span>
            </span>
            <p className="text-slate-400">
              Connect up to 6 camera transmitters (Front Door, Bedroom, Living Room, Kitchen, Backyard, Garage) and view simultaneously from 3 viewer screens with two-way intercom.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-[2px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
