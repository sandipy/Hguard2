import React, { useState } from 'react';
import {
  X,
  Sliders,
  BatteryCharging,
  Moon,
  Sparkles,
  Cloud,
  Video,
  Lock,
  Volume2,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { AppSettings, MotionSensitivity, ResolutionMode } from '../types';
import { speakSeniorVoice } from '../utils/soundAlerts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenSystemInfo?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenSystemInfo,
}) => {
  const [pin, setPin] = useState(settings.encryptionPin);
  const [webhook, setWebhook] = useState(settings.smartPlugWebhookUrl);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings({
      encryptionPin: pin,
      smartPlugWebhookUrl: webhook,
    });
    speakSeniorVoice('Settings saved successfully.');
    onClose();
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-[2px] w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">SETTINGS</h2>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-[2px] font-bold border border-amber-500/40">
                Up to 6 Cameras • 3 Viewers
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Quick adjustments for video quality, storage, and security PIN
            </p>
          </div>
          <button
            id="close-settings-modal-btn"
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-[2px] transition border border-slate-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simplified Form Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4 text-sm">
          {/* SECTION 1: RESOLUTION (720p DEFAULT) */}
          <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Video Quality</h3>
              </div>
              <span className="text-xs text-slate-400">Default: 720p HD</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['720p', '1080p', '360p', '240p'] as ResolutionMode[]).map((res) => (
                <button
                  key={res}
                  id={`settings-res-${res}`}
                  onClick={() => onUpdateSettings({ resolutionMode: res })}
                  className={`py-2 px-1 rounded-[2px] font-bold text-xs uppercase border transition ${
                    settings.resolutionMode === res
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {res} {res === '720p' && '(HD)'}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: AI RECOGNITION */}
          <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Smart AI Detection</h3>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                id="toggle-ai-detection-checkbox"
                type="checkbox"
                checked={settings.aiDetectionEnabled}
                onChange={(e) => onUpdateSettings({ aiDetectionEnabled: e.target.checked })}
                className="w-4 h-4 rounded-[2px] accent-amber-500 cursor-pointer"
              />
              <span className="text-slate-200">Detect people, pets, and vehicles</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                id="toggle-ai-frame-boxes-checkbox"
                type="checkbox"
                checked={settings.aiFrameBoxesVisible}
                onChange={(e) => onUpdateSettings({ aiFrameBoxesVisible: e.target.checked })}
                className="w-4 h-4 rounded-[2px] accent-amber-500 cursor-pointer"
              />
              <span className="text-slate-200">Show AI outline boxes on screen</span>
            </label>
          </div>

          {/* SECTION 3: CLOUD STORAGE */}
          <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Google Drive Cloud Storage</h3>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                id="toggle-cloud-storage-checkbox"
                type="checkbox"
                checked={settings.cloudStorageEnabled}
                onChange={(e) => onUpdateSettings({ cloudStorageEnabled: e.target.checked })}
                className="w-4 h-4 rounded-[2px] accent-sky-500 cursor-pointer"
              />
              <span className="text-slate-200">Auto-save motion clips to Google Drive</span>
            </label>
            <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded-[2px] border border-slate-800/80">
              <span className="text-amber-300 font-bold">12 GB Managed Storage:</span> Starts deleting old footage (100 MB blocks) from oldest recorded to make space.
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-400">Clip Length:</span>
              <div className="flex gap-1.5">
                {[30, 120].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => onUpdateSettings({ recordingClipDuration: dur as 30 | 120 })}
                    className={`px-2 py-1 rounded-[2px] text-xs font-bold border transition ${
                      settings.recordingClipDuration === dur
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: BATTERY 80% GUARD (BUILT-IN - NO REDUNDANT TOGGLE) */}
          <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">80% Battery Health Guard</h3>
                <p className="text-xs text-slate-400">Automatically prevents battery swelling in old phones</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-[2px] border border-emerald-500/30 shrink-0">
              ✓ ALWAYS ON
            </span>
          </div>

          {/* SECTION 5: HEAT PROTECTION & VOICE */}
          <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Hardware & Voice</h3>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                id="toggle-eco-cool-checkbox"
                type="checkbox"
                checked={settings.ecoCoolScreenEnabled}
                onChange={(e) => onUpdateSettings({ ecoCoolScreenEnabled: e.target.checked })}
                className="w-4 h-4 rounded-[2px] accent-emerald-500 cursor-pointer"
              />
              <span className="text-slate-200">Eco-Cool screen (dim display to prevent phone heat)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                id="toggle-senior-voice-checkbox"
                type="checkbox"
                checked={settings.seniorVoiceAlerts}
                onChange={(e) => onUpdateSettings({ seniorVoiceAlerts: e.target.checked })}
                className="w-4 h-4 rounded-[2px] accent-purple-500 cursor-pointer"
              />
              <span className="text-slate-200">Spoken voice announcements for motion alerts</span>
            </label>
          </div>

          {/* SECTION 6: PIN */}
          <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-sm font-bold text-white">Security PIN</div>
                <div className="text-xs text-slate-400">Private code for viewer authorization</div>
              </div>
            </div>
            <input
              id="settings-pin-input"
              type="password"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-24 bg-slate-900 border border-slate-700 text-white font-bold text-center text-lg py-1.5 px-2 rounded-[2px] focus:border-amber-400 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          {onOpenSystemInfo && (
            <button
              type="button"
              id="open-system-specs-from-settings-btn"
              onClick={() => {
                onClose();
                onOpenSystemInfo();
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs rounded-[2px] transition border border-slate-700 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>System Specs (AI, AES, Battery)</span>
            </button>
          )}
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              id="cancel-settings-btn"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-[2px] transition border border-slate-700"
            >
              CANCEL
            </button>
            <button
              id="save-settings-btn"
              onClick={handleSave}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-[2px] shadow border border-emerald-400 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>SAVE SETTINGS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
