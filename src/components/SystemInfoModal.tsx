import React from 'react';
import {
  X,
  ShieldCheck,
  BatteryCharging,
  Moon,
  Sparkles,
  Lock,
  Cloud,
  Video,
  CheckCircle2,
  Tv,
  Github,
  Download,
  ExternalLink,
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-[2px] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-[2px] text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">SYSTEM & SECURITY INFO</h2>
              <p className="text-xs text-slate-400">
                Technical specifications, battery safety, and encryption details in one place
              </p>
            </div>
          </div>
          <button
            id="close-system-info-btn"
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-[2px] transition border border-slate-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3.5 text-xs sm:text-sm text-slate-300">
          {/* Item 1: Battery 80% Guard & Overheat Shield */}
          <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <BatteryCharging className="w-4 h-4 shrink-0" />
              <h3 className="text-sm text-white font-black">Battery 80% Guard & 72h Deep Discharge Cycle</h3>
            </div>
            <p className="leading-relaxed">
              Old phones left on chargers 24/7 suffer lithium-ion degradation and swollen batteries. HGuard includes a built-in safety alert at 80% battery capacity, dimming to black (&quot;Eco-Cool&quot;) during active surveillance to prevent heat buildup.
            </p>
            <p className="leading-relaxed text-amber-200/90 bg-amber-950/30 p-2.5 rounded-[2px] border border-amber-500/40">
              <strong className="text-amber-300">72-Hour Deep Discharge Cycle:</strong> When a phone remains plugged in continuously for more than 72 hours, the system automatically records a high-priority battery maintenance reminder in the event log. As recommended for lithium-ion cell health, seniors can unplug the charger and allow the phone to discharge to ~20–30% before reconnecting.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Permanently active in BatteryService for hardware longevity.</span>
            </div>
          </div>

          {/* Item 2: End-to-End Encryption (AES-256 GCM) */}
          <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Lock className="w-4 h-4 shrink-0" />
              <h3 className="text-sm text-white font-black">Zero-Knowledge AES-256 GCM Encryption</h3>
            </div>
            <p className="leading-relaxed">
              All video frames and security alerts are encrypted right on your device using military-grade AES-256 GCM cryptography. Only your designated devices with your security PIN ({encryptionPin}) can decrypt and view recordings. No raw video is ever accessible by third parties.
            </p>
          </div>

          {/* Item 3: Autonomous AI Detection */}
          <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold">
              <Sparkles className="w-4 h-4 shrink-0" />
              <h3 className="text-sm text-white font-black">Autonomous AI Vision Engine</h3>
            </div>
            <p className="leading-relaxed">
              Smart detection identifies people, pets, vehicles, package drops, and lingering activity. The AI engine runs autonomously in the background and self-updates to the latest vision models without requiring manual maintenance.
            </p>
          </div>

          {/* Item 4: Up to 6 Cameras & 3 Viewers */}
          <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Tv className="w-4 h-4 shrink-0" />
              <h3 className="text-sm text-white font-black">Multi-Camera & Viewer Capacity</h3>
            </div>
            <p className="leading-relaxed">
              Connect up to 6 camera transmitters (Front Door, Living Room, Backyard, Garage, Hallway, Bedroom) simultaneously. Up to 3 viewers (e.g. tablet on the counter, mobile phone, and wall display) can watch live streams at the same time with two-way intercom and emergency sirens.
            </p>
          </div>

          {/* Item 5: Default 720p Resolution */}
          <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <Video className="w-4 h-4 shrink-0" />
              <h3 className="text-sm text-white font-black">Optimized 720p HD Streaming</h3>
            </div>
            <p className="leading-relaxed">
              The default resolution is set to 720p HD. This strikes the perfect balance for older smartphone processors: high visual clarity, low thermal output, and smooth transmission over standard home Wi-Fi.
            </p>
          </div>

          {/* Item 6: Google Drive Cloud Vault (12 GB Managed Storage & 100 MB Oldest Auto-Clean) */}
          <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <Cloud className="w-4 h-4 shrink-0" />
                <h3 className="text-sm text-white font-black">Google Drive 12 GB Managed Storage</h3>
              </div>
              <span className="text-[11px] bg-blue-500/10 text-blue-300 font-mono font-bold px-2 py-0.5 rounded-[2px] border border-blue-500/30">
                12 GB Cap • FIFO Loop
              </span>
            </div>
            <p className="leading-relaxed">
              Motion-triggered video clips and forensic snapshots back up directly to your personal Google Drive account in the <code className="text-amber-300">/HGuard_Surveillance</code> folder with a 12 GB storage allocation.
            </p>
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-[2px] flex flex-col gap-1.5 text-xs">
              <div className="text-amber-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Auto-Purge to Make Space (Oldest Footage First):</span>
              </div>
              <p className="text-slate-300 leading-relaxed pl-5">
                When approaching the 12 GB limit, HGuard automatically starts deleting old footage in <strong>100 MB batches</strong>, starting from the <strong>oldest recorded footage</strong>. This continuous FIFO loop ensures space is always available for critical new events without requiring manual file management.
              </p>
            </div>
          </div>

          {/* Item 7: GitHub Live Web URL & Standalone Offline Package */}
          <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Github className="w-4 h-4 shrink-0" />
                <h3 className="text-sm text-white font-black">GitHub Repository & Web URL</h3>
              </div>
              <a
                id="system-download-offline-zip-btn"
                href="/hguard-offline.zip"
                download="hguard-offline.zip"
                className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-[2px] flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Offline ZIP</span>
              </a>
            </div>
            <p className="leading-relaxed">
              Hosted and synchronized on GitHub. You can access the live web application on any device via GitHub Pages or download the offline standalone package to run without an active internet connection:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href="https://sandipy.github.io/Hguard2/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-[2px] flex items-center justify-between text-xs text-emerald-400 font-bold transition"
              >
                <span className="truncate">Web: sandipy.github.io/Hguard2</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1" />
              </a>
              <a
                href="https://github.com/sandipy/Hguard2"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-[2px] flex items-center justify-between text-xs text-purple-300 font-bold transition"
              >
                <span className="truncate">Repo: github.com/sandipy/Hguard2</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            id="dismiss-system-info-btn"
            onClick={onClose}
            className="py-2 px-5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-[2px] border border-slate-700 transition"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
