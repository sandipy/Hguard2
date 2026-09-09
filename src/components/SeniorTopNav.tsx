import React, { useState } from 'react';
import {
  Shield,
  Battery,
  BatteryCharging,
  Flame,
  Settings,
  FileText,
  Moon,
  Cloud,
  Sparkles,
  User,
  Crown,
  Activity,
  ListOrdered,
  PlugZap,
  AlertTriangle,
  Share2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { AppMode, BatteryState, ThermalStatus, UserProfile } from '../types';
import { BatteryService } from '../utils/batteryService';

export interface UnpluggedAlertInfo {
  isUnpluggedLong: boolean;
  minutes: number;
  cameraName?: string;
}

interface SeniorTopNavProps {
  mode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  battery: BatteryState;
  thermal: ThermalStatus;
  unreadAlertsCount: number;
  user: UserProfile;
  onOpenEvents: () => void;
  onOpenSettings: () => void;
  onOpenCloudStorage: () => void;
  onOpenAIExplainer: () => void;
  onOpenAccount: () => void;
  onOpenAnimationDemo?: () => void;
  onOpenSetupGuide?: () => void;
  onOpenShare?: () => void;
  onToggleEcoCool?: () => void;
  isEcoCoolActive?: boolean;
  unpluggedWarning?: UnpluggedAlertInfo | null;
}

export const SeniorTopNav: React.FC<SeniorTopNavProps> = ({
  mode,
  onSelectMode,
  battery,
  thermal,
  unreadAlertsCount,
  user,
  onOpenEvents,
  onOpenSettings,
  onOpenCloudStorage,
  onOpenAIExplainer,
  onOpenAccount,
  onOpenAnimationDemo,
  onOpenSetupGuide,
  onOpenShare,
  onToggleEcoCool,
  isEcoCoolActive,
  unpluggedWarning,
}) => {
  const [showPowerHelpModal, setShowPowerHelpModal] = useState(false);

  const isBattery80Warning = battery.charging && battery.level >= 80;

  // Check if camera device is unplugged for more than 15 minutes
  const isLocalUnpluggedOver15m = !battery.charging && (battery.unpluggedMinutes ?? 0) >= 15;
  const isUnpluggedWarning = unpluggedWarning?.isUnpluggedLong || isLocalUnpluggedOver15m;
  const effectiveMinutes = unpluggedWarning?.minutes ?? battery.unpluggedMinutes ?? 0;
  const unpluggedLabel = unpluggedWarning?.cameraName || (mode === 'camera' ? 'Camera Device' : 'Camera');

  return (
    <header className="bg-slate-900 border-b-4 border-slate-700 text-white select-none px-3 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <button
            id="nav-brand-btn"
            onClick={() => onSelectMode('select')}
            className="flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-[2px] transition text-left focus:ring-2 focus:ring-amber-400 border border-slate-700"
          >
            <div className="p-2 bg-emerald-600 rounded-[2px] text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black tracking-wide text-amber-400 flex items-center gap-1.5">
                HGUARD
                <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-[2px] font-black uppercase tracking-wider">
                  Premium+
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium">Up to 6 Cameras • 3 Viewers</div>
            </div>
          </button>
        </div>

        {/* Center Hardware Health & AI Auto-Upgrade Status */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Autonomous AI Auto-Upgrade Indicator */}
          <div
            id="nav-ai-upgrade-indicator"
            className="hidden md:flex items-center gap-1.5 bg-slate-800/90 border border-emerald-500/60 px-2.5 py-1.5 rounded-[2px] text-xs font-bold text-emerald-300"
            title="AI automatically upgrades in the background when new vision models arrive. No senior action needed."
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>AI: Auto-Upgrading</span>
          </div>

          {/* VISUAL INDICATOR: UNPLUGGED FOR MORE THAN 15 MINUTES */}
          {isUnpluggedWarning && (
            <button
              id="nav-unplugged-warning-badge"
              onClick={() => setShowPowerHelpModal(true)}
              className="flex items-center gap-1.5 bg-red-950 hover:bg-red-900 border-2 border-red-500 px-3 py-1.5 rounded-[2px] text-xs sm:text-sm font-black text-red-200 shadow-lg animate-pulse transition cursor-pointer"
              title="Camera device has been unplugged for more than 15 minutes! Click to check power source."
              aria-label="Warning: Camera device unplugged for more than 15 minutes. Check power source."
            >
              <PlugZap className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
              <span className="text-white font-black tracking-tight">
                ⚠️ {unpluggedLabel} Unplugged ({effectiveMinutes}m)
              </span>
              <span className="hidden sm:inline-block text-[11px] bg-red-800 text-amber-300 px-1.5 py-0.5 rounded-[2px] border border-amber-400/60 font-bold uppercase tracking-wide">
                Check Power Source
              </span>
            </button>
          )}

          {/* VISUAL INDICATOR: PLUGGED IN FOR MORE THAN 72 HOURS (DEEP DISCHARGE DUE) */}
          {battery.deepDischargeReminderDue && (
            <button
              id="nav-deep-discharge-badge"
              onClick={() => setShowPowerHelpModal(true)}
              className="flex items-center gap-1.5 bg-amber-950 hover:bg-amber-900 border-2 border-amber-500 px-3 py-1.5 rounded-[2px] text-xs sm:text-sm font-black text-amber-200 shadow-lg animate-pulse transition cursor-pointer"
              title="Phone plugged in >72 hours! Deep discharge cycle recommended for battery health. Click for instructions."
              aria-label="Warning: Phone plugged in for over 72 hours. Deep discharge cycle recommended."
            >
              <BatteryCharging className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="text-white font-black tracking-tight">
                🔋 72h Discharge Due ({battery.pluggedHours || 72}h)
              </span>
              <span className="hidden sm:inline-block text-[11px] bg-amber-800 text-amber-200 px-1.5 py-0.5 rounded-[2px] border border-amber-400 font-bold uppercase tracking-wide">
                Unplug to 20%
              </span>
            </button>
          )}

          {/* Battery Status Badge */}
          <div
            id="nav-battery-badge"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] font-bold text-xs sm:text-sm border-2 ${
              isBattery80Warning
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                : isUnpluggedWarning
                ? 'bg-red-950/70 border-red-500 text-red-300'
                : !battery.charging
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                : battery.level <= 20
                ? 'bg-red-900/40 border-red-500 text-red-300'
                : 'bg-slate-800 border-slate-600 text-emerald-400'
            }`}
            title={
              !battery.charging
                ? `Running on battery (Unplugged: ${battery.unpluggedMinutes || 0}m)`
                : 'Battery Health Guard: Stop charging at 80%'
            }
          >
            {battery.charging ? (
              <BatteryCharging className={`w-4 h-4 sm:w-5 sm:h-5 ${isBattery80Warning ? 'text-amber-300' : 'text-emerald-400'}`} />
            ) : (
              <Battery className={`w-4 h-4 sm:w-5 sm:h-5 ${isUnpluggedWarning ? 'text-red-400' : 'text-amber-400'}`} />
            )}
            <span>{battery.level}%</span>
            {isBattery80Warning && (
              <span className="hidden lg:inline-block text-[10px] bg-amber-400 text-black px-1.5 py-0.5 rounded-[2px] font-black">
                UNPLUG (80%)
              </span>
            )}
            {!battery.charging && (
              <span className="hidden xl:inline-block text-[10px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded-[2px] font-mono">
                {battery.unpluggedMinutes || 0}m unplugged
              </span>
            )}
          </div>

          {/* Thermal Health Badge */}
          <div
            id="nav-thermal-badge"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] font-bold text-xs sm:text-sm border-2 ${
              thermal === 'hot'
                ? 'bg-red-900/40 border-red-500 text-red-300 animate-bounce'
                : thermal === 'warm'
                ? 'bg-amber-900/40 border-amber-500 text-amber-300'
                : 'bg-slate-800 border-slate-600 text-cyan-300'
            }`}
            title="Overheat Protection for Old Phones"
          >
            <Flame className="w-4 h-4" />
            <span className="capitalize">{thermal === 'normal' ? 'Cool' : thermal}</span>
          </div>

          {/* Eco Screen Cool Mode (If in camera mode) */}
          {mode === 'camera' && onToggleEcoCool && (
            <button
              id="nav-eco-cool-toggle"
              onClick={onToggleEcoCool}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] font-bold text-xs sm:text-sm border-2 transition ${
                isEcoCoolActive
                  ? 'bg-cyan-600 border-cyan-300 text-white'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
              }`}
              title="Blackout screen to prevent old phone from heating up"
            >
              <Moon className="w-4 h-4" />
              <span className="hidden sm:inline">Eco-Cool</span>
            </button>
          )}
        </div>

        {/* Action Controls: Rectangle with 2px corners */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Share Link with Friends or Relatives */}
          {onOpenShare && (
            <button
              id="nav-share-btn"
              onClick={onOpenShare}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 sm:px-3 py-1.5 rounded-[2px] font-black text-xs sm:text-sm shadow transition"
              title="Share live viewer link or camera link with friends and relatives"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          )}

          {/* Visual Animation Demo */}
          {onOpenAnimationDemo && (
            <button
              id="nav-animation-demo-btn"
              onClick={onOpenAnimationDemo}
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-3 py-1.5 rounded-[2px] font-bold text-xs sm:text-sm transition"
              title="Watch visual animated demonstration of 6 cameras and 3 viewers"
            >
              <Activity className="w-4 h-4" />
              <span>Demo</span>
            </button>
          )}

          {/* Step-by-Step Guide */}
          {onOpenSetupGuide && (
            <button
              id="nav-step-guide-btn"
              onClick={onOpenSetupGuide}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500 px-2.5 sm:px-3 py-1.5 rounded-[2px] font-bold text-xs sm:text-sm transition"
              title="Step-by-step instructions to set up old phones"
            >
              <ListOrdered className="w-4 h-4" />
              <span>Guide</span>
            </button>
          )}

          {/* 30-Day Cloud Storage / Google Drive Vault */}
          <button
            id="nav-cloud-storage-btn"
            onClick={onOpenCloudStorage}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 px-2.5 sm:px-3 py-1.5 rounded-[2px] font-bold text-xs sm:text-sm text-sky-300 transition"
            title="Google Drive Vault & Cloud Storage"
          >
            <Cloud className="w-4 h-4 text-sky-400" />
            <span className="hidden lg:inline">Drive Vault</span>
          </button>

          {/* Encrypted Event Logs */}
          <button
            id="nav-events-btn"
            onClick={onOpenEvents}
            className="relative flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 px-2.5 sm:px-3 py-1.5 rounded-[2px] font-bold text-xs sm:text-sm text-white transition"
            aria-label="View Encrypted Security Events"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Events</span>
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-[2px] ring-1 ring-slate-900 animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Account Profile & Gmail */}
          <button
            id="nav-account-btn"
            onClick={onOpenAccount}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border-2 border-amber-500/40 px-2.5 sm:px-3 py-1.5 rounded-[2px] font-bold text-xs sm:text-sm text-amber-300 transition"
            title="User Account & Gmail Login"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline truncate max-w-[90px]">{user.name.split(' ')[0]}</span>
          </button>

          {/* Settings */}
          <button
            id="nav-settings-btn"
            onClick={onOpenSettings}
            className="p-2 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 rounded-[2px] text-slate-300 transition"
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* POWER SOURCE WARNING DETAILS MODAL */}
      {showPowerHelpModal && (
        <div
          id="unplugged-warning-modal-overlay"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none"
        >
          <div className="bg-slate-900 border-2 border-red-500 max-w-lg w-full rounded-[2px] shadow-2xl p-5 sm:p-6 text-white flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-950 text-amber-300 rounded-[2px] border border-red-500">
                  <PlugZap className="w-7 h-7 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-red-300">
                    POWER SOURCE WARNING
                  </h3>
                  <div className="text-xs text-slate-400">
                    {unpluggedLabel} has been unplugged for {effectiveMinutes} minutes
                  </div>
                </div>
              </div>
              <button
                id="close-power-modal-btn"
                onClick={() => setShowPowerHelpModal(false)}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded-[2px] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-950/40 border border-red-500/60 p-3.5 rounded-[2px] text-sm text-red-100 flex flex-col gap-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Camera Device Running on Battery (&gt;15 min)</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Security cameras stream continuous video and execute live AI motion processing. Running on internal battery without an AC power source will deplete the phone battery and disconnect your security feed.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-[2px] flex flex-col gap-2 text-xs">
              <div className="font-bold text-amber-300 uppercase tracking-wide">
                Recommended Power Checks:
              </div>
              <ul className="list-disc list-inside text-slate-300 flex flex-col gap-1">
                <li>Check if the charging cable is loose or disconnected from the phone.</li>
                <li>Inspect wall adapter or verify power strip is turned ON.</li>
                <li>Ensure the phone displays the charging bolt icon on screen.</li>
              </ul>
            </div>

            {/* 72-Hour Continuous Charging / Deep Discharge Section */}
            <div className={`border p-3.5 rounded-[2px] text-xs flex flex-col gap-2 ${
              battery.deepDischargeReminderDue
                ? 'bg-amber-950/60 border-amber-500 text-amber-100'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <div className="font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-300 font-black text-sm">
                  <BatteryCharging className="w-4 h-4 text-amber-400" />
                  72-Hour Deep Discharge Cycle Reminder (Li-ion Health)
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-[2px] bg-slate-800 text-amber-300 border border-slate-700">
                  Plugged: {battery.pluggedHours || 0}h / 72h
                </span>
              </div>
              <p className="leading-relaxed text-slate-200">
                Lithium-ion batteries kept continuously at 100% float charge for extended periods suffer cathode stress, electrolyte oxidation, and pouch swelling. Medical and hardware engineering standards recommend a &quot;deep discharge&quot; cycle every 72 hours: unplug the phone charger and allow the battery to drain down to 20–30% before plugging back in.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  id="simulate-72h-discharge-btn"
                  onClick={() => {
                    BatteryService.getInstance().setSimulatedPluggedHours(73);
                  }}
                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-[2px] transition"
                  title="Simulate 73 hours plugged in to test the deep discharge event log reminder"
                >
                  ⚡ Test 72h Cycle Alert
                </button>
                <button
                  id="reset-discharge-timer-btn"
                  onClick={() => {
                    BatteryService.getInstance().resetDeepDischargeTimer();
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-[2px] transition"
                  title="Reset the 72-hour plugged timer"
                >
                  ↺ Reset 72h Timer
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
              <button
                id="power-mark-plugged-btn"
                onClick={() => {
                  BatteryService.getInstance().setPluggedIn();
                  setShowPowerHelpModal(false);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-[2px] flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>CHARGER CONNECTED (PLUGGED IN)</span>
              </button>

              <button
                id="power-test-simulate-btn"
                onClick={() => {
                  BatteryService.getInstance().setSimulatedUnplugged(20);
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs rounded-[2px]"
                title="Test simulated 20-minute power warning"
              >
                Test 20m Alert
              </button>

              <button
                id="power-modal-dismiss-btn"
                onClick={() => setShowPowerHelpModal(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm rounded-[2px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
