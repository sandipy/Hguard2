import React from 'react';
import {
  Sparkles,
  Cpu,
  Eye,
  ShieldCheck,
  Zap,
  Activity,
  UserCheck,
  Clock,
  X,
} from 'lucide-react';

interface AIExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIExplainerModal: React.FC<AIExplainerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="ai-explainer-modal-overlay"
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
            <div className="w-10 h-10 rounded-[2px] bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black">AI Detection Architecture</h2>
              <p className="text-xs text-slate-400">
                Lightweight edge optical filter + cloud semantic vision
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

        {/* Core Description */}
        <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2 text-xs leading-relaxed text-slate-300">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Battery-Safe Two-Stage Hybrid Design:</span>
          </div>
          <p>
            Running full neural models on older phones leads to excessive thermal throttling and battery swelling. HGuard runs a sub-sampled differential optical filter on the camera phone (&lt;2% CPU, zero heat). When motion occurs, keyframes are classified for humans, pets, vehicles, or loitering.
          </p>
        </div>

        {/* 4 Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="bg-slate-950 p-3 rounded-[2px] border border-slate-800 flex flex-col gap-1">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>1. Zero-Heat Edge Filter</span>
            </span>
            <p className="text-slate-400">
              Lightweight pixel difference sampling consumes minimal power.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-[2px] border border-slate-800 flex flex-col gap-1">
            <span className="font-bold text-blue-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>2. Person &amp; Pet Classifier</span>
            </span>
            <p className="text-slate-400">
              Distinguishes human visitors and vehicles from wind and leaves.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-[2px] border border-slate-800 flex flex-col gap-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>3. AI Frame Bounding Boxes</span>
            </span>
            <p className="text-slate-400">
              Projects real-time spatial bounding boxes around detected subjects.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-[2px] border border-slate-800 flex flex-col gap-1">
            <span className="font-bold text-purple-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>4. Lingering Loiter Alert</span>
            </span>
            <p className="text-slate-400">
              Flags subjects standing stationary in front of the door for &gt;10s.
            </p>
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-[2px] border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Snapshots are stored encrypted with your Master PIN.</span>
        </div>

        <div className="flex justify-end pt-1">
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
