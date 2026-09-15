import React, { useState } from 'react';
import {
  X,
  Sliders,
  BatteryCharging,
  Moon,
  Video,
  Lock,
  Check,
  ShieldCheck,
  FileText,
  Cloud,
  Sparkles,
  BookOpen,
  Radio,
  User,
  Info,
} from 'lucide-react';
import { AppSettings, ResolutionMode } from '../types';
import { speakSeniorVoice } from '../utils/soundAlerts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenEventLogModal: () => void;
  onOpenCloudStorageModal: () => void;
  onOpenHeartbeatModal: () => void;
  onOpenAIExplainer: () => void;
  onOpenStepGuideModal: () => void;
  onOpenSystemInfo: () => void;
  onOpenAccountModal: () => void;
  eventCount: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenEventLogModal,
  onOpenCloudStorageModal,
  onOpenHeartbeatModal,
  onOpenAIExplainer,
  onOpenStepGuideModal,
  onOpenSystemInfo,
  onOpenAccountModal,
  eventCount,
}) => {
  const [pin, setPin] = useState(settings.encryptionPin);
  const [activeCategory, setActiveCategory] = useState<'preferences' | 'tools' | 'about'>('preferences');

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings({
      encryptionPin: pin,
    });
    speakSeniorVoice('Settings updated.');
    onClose();
  };

  return (
    <div
      id="settings-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        id="settings-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-slate-700 rounded-[4px] w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 rounded-[2px] text-amber-400 border border-slate-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">SETTINGS &amp; TOOLS</h2>
              <p className="text-xs text-slate-400">
                Configure camera defaults, view logs, storage, and diagnostics
              </p>
            </div>
          </div>
          <button
            id="close-settings-modal-btn"
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-[2px] transition border border-slate-700"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Tab Strip */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveCategory('preferences')}
            className={`px-3 py-1.5 rounded-[2px] transition ${
              activeCategory === 'preferences'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Preferences &amp; Video
          </button>
          <button
            onClick={() => setActiveCategory('tools')}
            className={`px-3 py-1.5 rounded-[2px] flex items-center gap-1.5 transition ${
              activeCategory === 'tools'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Tools &amp; Logs</span>
            {eventCount > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 rounded-full font-black">
                {eventCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveCategory('about')}
            className={`px-3 py-1.5 rounded-[2px] transition ${
              activeCategory === 'about'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Guides &amp; About
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs sm:text-sm">
          {activeCategory === 'preferences' && (
            <div className="flex flex-col gap-4">
              {/* Video Quality (720p default) */}
              <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-amber-400" />
                    <span>Default Video Resolution</span>
                  </span>
                  <span className="text-[10px] text-slate-400">720p HD is optimal</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['720p', '1080p', '360p', '240p'] as ResolutionMode[]).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => onUpdateSettings({ resolutionMode: res })}
                      className={`py-2 px-1 rounded-[2px] font-bold text-xs uppercase border transition ${
                        settings.resolutionMode === res
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {res} {res === '720p' && '(Default)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eco-Cool Mode (Auto-dim screen to black) */}
              <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-emerald-400" />
                    <span>Eco-Cool Screen Dimming</span>
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-[2px] font-bold border border-emerald-500/40">
                    ON BY DEFAULT
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatically turns the camera phone screen black after 15 seconds of inactivity. Keeps the camera hardware cool and prevents lithium battery degradation on 24/7 charging.
                </p>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={settings.ecoCoolScreenEnabled}
                    onChange={(e) => onUpdateSettings({ ecoCoolScreenEnabled: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded-[2px]"
                  />
                  <span className="text-slate-300 font-bold">Enable Eco-Cool auto-dim</span>
                </label>
              </div>

              {/* Night Vision Settings */}
              <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>Night Vision Automation</span>
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-[2px] font-bold">
                    OFF BY DEFAULT
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  To prevent an unwanted green or grayscale tint in normal room light, night vision remains off by default. You can enable automatic infrared activation if your camera is in a completely dark room:
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoNightVisionOnLowLight}
                    onChange={(e) => onUpdateSettings({ autoNightVisionOnLowLight: e.target.checked })}
                    className="w-4 h-4 accent-indigo-500 rounded-[2px]"
                  />
                  <span className="text-slate-300 font-bold">Automatically engage IR filter in pitch darkness</span>
                </label>
              </div>

              {/* Household Security PIN */}
              <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Household Security PIN</span>
                  </span>
                  <p className="text-xs text-slate-400">Used to authorize viewer stations</p>
                </div>
                <input
                  type="password"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-24 bg-slate-900 border border-slate-700 text-white font-bold text-center text-base py-1.5 px-2 rounded-[2px] focus:border-amber-400 outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: TOOLS & LOGS (Answer to: "what else can then be moved to settings, like log, ?, ") */}
          {activeCategory === 'tools' && (
            <div className="flex flex-col gap-3">
              <div className="bg-slate-950 p-3 rounded-[2px] border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Secondary tools, diagnostic monitors, and event archives have been organized here to keep the main monitoring screen clean and focused.
                </span>
              </div>

              {/* Event Log Button */}
              <button
                type="button"
                id="settings-open-event-log-btn"
                onClick={() => {
                  onClose();
                  onOpenEventLogModal();
                }}
                className="p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-[2px] flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-[2px]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>Encrypted Event Log</span>
                      {eventCount > 0 && (
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.2 rounded-full">
                          {eventCount} Records
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      View motion alerts, snapshots, and offline events protected by AES-256
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400 group-hover:underline">Open Log →</span>
              </button>

              {/* Google Drive Cloud Storage Button */}
              <button
                type="button"
                id="settings-open-drive-vault-btn"
                onClick={() => {
                  onClose();
                  onOpenCloudStorageModal();
                }}
                className="p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/50 rounded-[2px] flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/20 text-sky-400 rounded-[2px]">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Google Drive Cloud Vault</div>
                    <p className="text-xs text-slate-400">
                      12 GB managed cloud storage with 100 MB automatic FIFO purge
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-sky-400 group-hover:underline">Open Vault →</span>
              </button>

              {/* Network Heartbeat Diagnostics Button */}
              <button
                type="button"
                id="settings-open-heartbeat-btn"
                onClick={() => {
                  onClose();
                  onOpenHeartbeatModal();
                }}
                className="p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 rounded-[2px] flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-[2px]">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Network Heartbeat Diagnostics</div>
                    <p className="text-xs text-slate-400">
                      5-minute silence timeout rule and individual camera connection test
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-cyan-400 group-hover:underline">View Status →</span>
              </button>

              {/* AI Vision Engine Button */}
              <button
                type="button"
                id="settings-open-ai-engine-btn"
                onClick={() => {
                  onClose();
                  onOpenAIExplainer();
                }}
                className="p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 rounded-[2px] flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 text-purple-400 rounded-[2px]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">AI Vision &amp; Detection Engine</div>
                    <p className="text-xs text-slate-400">
                      Person, pet, vehicle, and loitering classification architecture
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-400 group-hover:underline">View AI Specs →</span>
              </button>

              {/* User Account & Cloud Sync */}
              <button
                type="button"
                id="settings-open-account-btn"
                onClick={() => {
                  onClose();
                  onOpenAccountModal();
                }}
                className="p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-[2px] flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-[2px]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">User Account &amp; Identity</div>
                    <p className="text-xs text-slate-400">
                      Household profile, email link, and multi-viewer permissions
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 group-hover:underline">Manage Profile →</span>
              </button>
            </div>
          )}

          {/* TAB 3: GUIDES & ABOUT */}
          {activeCategory === 'about' && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStepGuideModal();
                }}
                className="p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-[2px] flex items-center justify-between text-left transition"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="font-bold text-white text-sm">Step-by-Step Setup Guide</div>
                    <p className="text-xs text-slate-400">Repurposing old smartphones into home cameras</p>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-bold">Open Guide →</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSystemInfo();
                }}
                className="p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-[2px] flex items-center justify-between text-left transition"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="font-bold text-white text-sm">Technical Specifications</div>
                    <p className="text-xs text-slate-400">AES-256 GCM encryption, battery safety, and architecture</p>
                  </div>
                </div>
                <span className="text-xs text-cyan-400 font-bold">View Specs →</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-[2px] border border-slate-700 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            id="save-settings-btn"
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-[2px] border border-emerald-400 shadow transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>SAVE PREFERENCES</span>
          </button>
        </div>
      </div>
    </div>
  );
};
