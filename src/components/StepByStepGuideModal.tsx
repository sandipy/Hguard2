import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Smartphone,
  Tv,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface StepByStepGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShareModal?: () => void;
}

export const StepByStepGuideModal: React.FC<StepByStepGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenShareModal,
}) => {
  const [tab, setTab] = useState<'start' | 'camera' | 'viewer'>('start');

  if (!isOpen) return null;

  return (
    <div
      id="step-guide-modal-backdrop"
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
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-[2px] border border-amber-500/40">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">HGuard Setup Guide</h2>
              <p className="text-xs text-slate-400">Repurposing old phones into home cameras in 3 steps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white bg-slate-800 rounded-[2px] border border-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setTab('start')}
            className={`px-3 py-1.5 rounded-[2px] transition ${
              tab === 'start' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
            }`}
          >
            1. Overview
          </button>
          <button
            onClick={() => setTab('camera')}
            className={`px-3 py-1.5 rounded-[2px] transition ${
              tab === 'camera' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
            }`}
          >
            2. Camera Setup
          </button>
          <button
            onClick={() => setTab('viewer')}
            className={`px-3 py-1.5 rounded-[2px] transition ${
              tab === 'viewer' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
            }`}
          >
            3. Viewer Station
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-3.5 text-xs text-slate-300">
          {tab === 'start' && (
            <div className="flex flex-col gap-3">
              <p className="leading-relaxed text-slate-200">
                You need two devices on your home Wi-Fi:
              </p>
              <div className="bg-slate-950 p-3 rounded-[2px] border border-slate-800 flex flex-col gap-2">
                <strong className="text-amber-400 font-bold">Device 1 (Old phone):</strong>
                <span>Set to <strong>Camera Mode</strong>. Plug it into wall power and point at front door or living room. The screen stays black (Eco-Cool) to prevent heating.</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-[2px] border border-slate-800 flex flex-col gap-2">
                <strong className="text-cyan-400 font-bold">Device 2 (Daily phone, tablet, or PC):</strong>
                <span>Set to <strong>Viewer Mode</strong>. Watch live camera cards, speak into rooms via 2-way intercom, or wake the camera screen remotely.</span>
              </div>
            </div>
          )}

          {tab === 'camera' && (
            <div className="flex flex-col gap-3">
              <div className="bg-slate-950 p-3 rounded-[2px] border border-slate-800 flex flex-col gap-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Autonomous Operation (Zero Daily Interaction)</span>
                </span>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Eco-Cool Screen:</strong> Display automatically dims to black after 15 seconds to prevent battery swelling.</li>
                  <li><strong>Auto-Reconnection:</strong> Reconnects automatically if Wi-Fi drops.</li>
                  <li><strong>80% Battery Guard:</strong> Protects lithium battery life during 24/7 charging.</li>
                </ul>
              </div>
            </div>
          )}

          {tab === 'viewer' && (
            <div className="flex flex-col gap-3">
              <div className="bg-slate-950 p-3 rounded-[2px] border border-slate-800 flex flex-col gap-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-cyan-400" />
                  <span>Viewer Features</span>
                </span>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Remote Wake Screen:</strong> Click &quot;Wake Screen&quot; on any card to light up the camera phone screen for 30s to check camera aim or reassure a senior.</li>
                  <li><strong>Two-Way Talk:</strong> Click &quot;Talk&quot; to speak directly into that room.</li>
                  <li><strong>Siren Deterrent:</strong> Sound an emergency alarm if you see an intruder.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
          {onOpenShareModal && (
            <button
              onClick={() => {
                onClose();
                onOpenShareModal();
              }}
              className="px-3 py-1.5 bg-emerald-600 text-slate-950 font-bold rounded-[2px] flex items-center gap-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Get Pairing Link</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-[2px] border border-slate-700 ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
