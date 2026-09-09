import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Copy,
  Check,
  HardDrive,
  Shield,
  Eye,
  Camera,
  Moon,
  BatteryCharging,
  Sparkles,
  ExternalLink,
  Flame,
  Volume2,
  Wifi,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { CameraSlot, ViewerStation } from '../types';

interface StepByStepGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  encryptionPin?: string;
  onSelectMode?: (mode: 'camera' | 'viewer') => void;
}

interface StepItem {
  id: number;
  title: string;
  shortDesc: string;
  badge: string;
  icon: any;
  content: React.ReactNode;
}

export const StepByStepGuideModal: React.FC<StepByStepGuideModalProps> = ({
  isOpen,
  onClose,
  userEmail = '',
  encryptionPin = '8888',
  onSelectMode,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleStepCompleted = (stepNum: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNum) ? prev.filter((s) => s !== stepNum) : [...prev, stepNum]
    );
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hguard.app';

  const steps: StepItem[] = [
    {
      id: 1,
      title: 'Step 1: Gather Your Old Phones (Up to 6 Devices)',
      shortDesc: 'Find any old Android phone or iPhone that still turns on',
      badge: 'Hardware Prep',
      icon: Smartphone,
      content: (
        <div className="flex flex-col gap-4 text-slate-200">
          <p className="text-sm leading-relaxed">
            HGuard turns virtually any decommissioned smartphone into a high-security home surveillance camera. You can connect <strong>up to 6 cameras</strong> simultaneously!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-xs font-bold text-emerald-400 uppercase">Device Requirements</div>
              <ul className="text-xs text-slate-300 mt-2 space-y-1.5 list-disc list-inside">
                <li>Android 5.0+ or iPhone 6 / iOS 11+</li>
                <li>Working rear or front camera</li>
                <li>Connected to your home Wi-Fi</li>
                <li>Plugged into regular wall charger</li>
              </ul>
            </div>
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-xs font-bold text-amber-400 uppercase">Preparation Checklist</div>
              <ul className="text-xs text-slate-300 mt-2 space-y-1.5 list-disc list-inside">
                <li>No SIM card required (Wi-Fi only is 100% fine)</li>
                <li>Set screen brightness to low or auto</li>
                <li>Place on a simple phone stand or windowsill</li>
                <li>Ensure charging cable has slight slack</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
            <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Why old phones are superior to cheap webcams:</strong> Smartphones already have high-definition lenses, hardware video encoders, battery backup in case of power cuts, and Wi-Fi antennas!
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Step 2: One-Tap Gmail & Master PIN (Zero-Crash Mode)',
      shortDesc: 'Link your Gmail without fragile OAuth popups that expire',
      badge: 'Zero-Crash Auth',
      icon: Shield,
      content: (
        <div className="flex flex-col gap-4 text-slate-200">
          <p className="text-sm leading-relaxed">
            Old mobile browsers (Chrome 60+, Safari 11) frequently crash or forget sessions when forced through heavy Google popup redirects. HGuard solves this with our <strong>Zero-Crash Permanent Link</strong>:
          </p>

          <div className="p-4 bg-slate-900 border-2 border-emerald-500/40 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Linked Google Account:</span>
              <span className="font-mono text-amber-300 font-bold text-sm">{userEmail || 'Any Gmail Account'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Surveillance Master PIN:</span>
              <span className="font-mono text-emerald-400 font-black text-sm bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                {encryptionPin}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              * Any phone pointing to this URL with your PIN connects seamlessly to your private surveillance mesh.
            </div>
          </div>

          <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 text-xs">
            <div className="font-bold text-white mb-1 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              Google Drive Vault Integration
            </div>
            <p className="text-slate-300">
              All detection clips, intruder photos, and sensor events will automatically back up to your personal Google Drive in folder: <span className="text-amber-300 font-mono">/HGuard_Surveillance/</span>.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Step 3: Assign Camera Slots (Cam 1 to Cam 6)',
      shortDesc: 'Place cameras in key spots and launch with 1-click bookmarks',
      badge: 'Up to 6 Cameras',
      icon: Camera,
      content: (
        <div className="flex flex-col gap-4 text-slate-200">
          <p className="text-sm leading-relaxed">
            Open the browser on each old phone and navigate directly to its dedicated slot link below, or select the camera number inside the app:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { slot: 'cam1', name: 'Camera 1', loc: 'Front Door / Porch' },
              { slot: 'cam2', name: 'Camera 2', loc: 'Living Room' },
              { slot: 'cam3', name: 'Camera 3', loc: 'Backyard / Garden' },
              { slot: 'cam4', name: 'Camera 4', loc: 'Garage / Driveway' },
              { slot: 'cam5', name: 'Camera 5', loc: 'Kitchen / Hallway' },
              { slot: 'cam6', name: 'Camera 6', loc: 'Bedroom / Nursery' },
            ].map((cam) => {
              const url = `${originUrl}?role=camera&cam=${cam.slot}&pin=${encryptionPin}`;
              const isCopied = copiedLink === cam.slot;
              return (
                <div
                  key={cam.slot}
                  className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      {cam.name}
                    </div>
                    <div className="text-[11px] text-slate-400">{cam.loc}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => copyText(url, cam.slot)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 font-bold transition"
                      title="Copy 1-tap URL for old phone"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300">
            💡 <strong>Senior Pro-Tip:</strong> Tap "Add to Home screen" in Safari or Chrome on each old phone. It will act like a native full-screen app!
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Step 4: Enable Eco-Blackout Mode & 80% Battery Guard',
      shortDesc: 'Keep your old phones completely cool and prevent battery swelling',
      badge: 'Hardware Safety',
      icon: Moon,
      content: (
        <div className="flex flex-col gap-4 text-slate-200">
          <p className="text-sm leading-relaxed">
            Running a camera 24/7 on an old phone can make the device hot if the screen is kept lit. HGuard includes two revolutionary safety features:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-slate-900 border-2 border-cyan-500/40 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-cyan-300 font-black text-sm">
                <Moon className="w-5 h-5" />
                <span>1. Eco-Blackout Screen</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                After 25 seconds of starting surveillance, the screen turns 100% pitch black. The camera and AI continue streaming silently in the background while the phone temperature stays under 30°C!
              </p>
              <div className="text-[11px] font-mono text-cyan-300 mt-1">
                👉 Double-tap the dark screen anytime to wake it up.
              </div>
            </div>

            <div className="p-4 bg-slate-900 border-2 border-emerald-500/40 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-300 font-black text-sm">
                <BatteryCharging className="w-5 h-5" />
                <span>2. 80% Battery Longevity</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Keeping lithium batteries continuously charged at 100% causes chemical swelling over months. HGuard alerts you or cuts charging via smart plug webhook when the battery hits 80%.
              </p>
              <div className="text-[11px] font-mono text-emerald-300 mt-1">
                👉 Zero risk of pillowing or thermal runaway.
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: 'Step 5: Setup Up to 3 Master Viewers (iPad, Phone, TV)',
      shortDesc: 'Watch all 6 cameras simultaneously on your daily devices',
      badge: '3 Viewers Concurrently',
      icon: Eye,
      content: (
        <div className="flex flex-col gap-4 text-slate-200">
          <p className="text-sm leading-relaxed">
            You and your family can watch from <strong>up to 3 screens at the exact same time</strong> without kicking anyone offline:
          </p>

          <div className="flex flex-col gap-2.5">
            {[
              { id: 'v1', name: 'Viewer 1: Primary Tablet / iPad', desc: 'Place on kitchen counter or beside armchair for continuous 6-camera monitoring', station: 'viewer1' },
              { id: 'v2', name: 'Viewer 2: Family Smartphone', desc: 'Check in from anywhere when away from home, inspect 4x zoom', station: 'viewer2' },
              { id: 'v3', name: 'Viewer 3: Smart TV / PC Screen', desc: 'Full-screen wall dashboard in living room or bedroom', station: 'viewer3' },
            ].map((v) => {
              const url = `${originUrl}?role=viewer&station=${v.station}&pin=${encryptionPin}`;
              const isCopied = copiedLink === v.id;
              return (
                <div
                  key={v.id}
                  className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      {v.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{v.desc}</div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => copyText(url, v.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 font-bold transition"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied Link' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs text-cyan-200">
            ✓ Features available on all 3 viewers: <strong>6-Camera Split Grid</strong>, <strong>4x Digital Zoom</strong>, <strong>Emergency Siren</strong>, and <strong>Two-Way Talk</strong>!
          </div>
        </div>
      ),
    },
    {
      id: 6,
      title: 'Step 6: Test AI Motion & Google Drive Vault Backup',
      shortDesc: 'Walk in front of any camera and verify notifications and cloud sync',
      badge: 'Verification',
      icon: Sparkles,
      content: (
        <div className="flex flex-col gap-4 text-slate-200">
          <p className="text-sm leading-relaxed">
            Your high-security home surveillance system is completely configured! Let's do a quick functional test:
          </p>

          <div className="p-4 bg-slate-900 border-2 border-amber-500/40 rounded-2xl flex flex-col gap-3">
            <div className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
              <span>30-Second Verification Checklist:</span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <label className="flex items-center gap-2.5 p-2 bg-slate-950 rounded-xl cursor-pointer hover:bg-slate-800 transition">
                <input type="checkbox" className="w-4 h-4 accent-amber-400 rounded cursor-pointer" />
                <span>Wave your hand in front of Camera 1. Ensure green motion boxes appear.</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 bg-slate-950 rounded-xl cursor-pointer hover:bg-slate-800 transition">
                <input type="checkbox" className="w-4 h-4 accent-amber-400 rounded cursor-pointer" />
                <span>Hear senior voice speak: <em>"Alert! Person detected at Camera 1."</em></span>
              </label>
              <label className="flex items-center gap-2.5 p-2 bg-slate-950 rounded-xl cursor-pointer hover:bg-slate-800 transition">
                <input type="checkbox" className="w-4 h-4 accent-amber-400 rounded cursor-pointer" />
                <span>Open "Cloud (30D)" in top nav and verify the captured snapshot is saved.</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 bg-slate-950 rounded-xl cursor-pointer hover:bg-slate-800 transition">
                <input type="checkbox" className="w-4 h-4 accent-amber-400 rounded cursor-pointer" />
                <span>Click "Backup to Google Drive" to sync event bundle into Google Drive vault.</span>
              </label>
            </div>
          </div>

          <div className="text-center py-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onSelectMode) onSelectMode('viewer');
              }}
              className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl transition transform active:scale-95 inline-flex items-center gap-2 border-2 border-emerald-400"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Launch Master Viewer Monitor Now</span>
            </button>
          </div>
        </div>
      ),
    },
  ];

  const activeStepObj = steps.find((s) => s.id === currentStep) || steps[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-slate-950 border-3 border-amber-500/80 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b-2 border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow">
              <activeStepObj.icon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  STEP-BY-STEP SETUP GUIDE
                </h3>
                <span className="text-[11px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Step {currentStep} of {steps.length}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Turn up to 6 old smartphones into a zero-crash home surveillance system
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            aria-label="Close guide"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2 overflow-x-auto">
          {steps.map((s) => {
            const isCurrent = s.id === currentStep;
            const isDone = completedSteps.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition border ${
                  isCurrent
                    ? 'bg-amber-500 text-black border-amber-400 shadow'
                    : isDone
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>{isDone ? '✓' : s.id}.</span>
                <span>{s.badge}</span>
              </button>
            );
          })}
        </div>

        {/* STEP CONTENT BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h4 className="text-lg sm:text-xl font-black text-white">{activeStepObj.title}</h4>
              <p className="text-xs sm:text-sm text-amber-300 font-medium">{activeStepObj.shortDesc}</p>
            </div>
            <button
              type="button"
              onClick={() => toggleStepCompleted(currentStep)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                completedSteps.includes(currentStep)
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{completedSteps.includes(currentStep) ? 'Completed ✓' : 'Mark as Done'}</span>
            </button>
          </div>

          <div className="py-2">{activeStepObj.content}</div>
        </div>

        {/* MODAL FOOTER STEP NAVIGATION */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 border border-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          <div className="text-xs text-slate-400 font-mono hidden sm:inline">
            Step {currentStep} of {steps.length}
          </div>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={() => {
                if (!completedSteps.includes(currentStep)) {
                  setCompletedSteps((p) => [...p, currentStep]);
                }
                setCurrentStep((s) => Math.min(steps.length, s + 1));
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finished Setup!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
