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
  QrCode,
  Scan,
  HelpCircle,
  ChevronDown,
  Smartphone,
  Eye,
  LogOut,
  WifiOff,
  Radio,
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
  onOpenSeniorGuide?: () => void;
  onOpenShare?: () => void;
  onOpenPairingQR?: () => void;
  onOpenPairingScanner?: () => void;
  onToggleEcoCool?: () => void;
  isEcoCoolActive?: boolean;
  unpluggedWarning?: UnpluggedAlertInfo | null;
  offlineCamerasCount?: number;
  onOpenHeartbeatChecker?: () => void;
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
  onOpenSeniorGuide,
  onOpenShare,
  onOpenPairingQR,
  onOpenPairingScanner,
  onToggleEcoCool,
  isEcoCoolActive,
  unpluggedWarning,
  offlineCamerasCount = 0,
  onOpenHeartbeatChecker,
}) => {
  const [showPowerHelpModal, setShowPowerHelpModal] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);

  const isBattery80Warning = battery.charging && battery.level >= 80;

  // Check if camera device is unplugged for more than 15 minutes
  const isLocalUnpluggedOver15m = !battery.charging && (battery.unpluggedMinutes ?? 0) >= 15;
  const isUnpluggedWarning = unpluggedWarning?.isUnpluggedLong || isLocalUnpluggedOver15m;
  const effectiveMinutes = unpluggedWarning?.minutes ?? battery.unpluggedMinutes ?? 0;
  const unpluggedLabel = unpluggedWarning?.cameraName || (mode === 'camera' ? 'Camera' : 'Camera');

  return (
    <header className="bg-slate-900 border-b-2 border-slate-700 text-white select-none px-2.5 py-1.5 sm:px-4 sm:py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand / Mode Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="nav-brand-btn"
            onClick={() => onSelectMode('select')}
            className="flex items-center gap-1.5 sm:gap-2 bg-slate-800 hover:bg-slate-700 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-[2px] transition text-left focus:ring-2 focus:ring-amber-400 border border-slate-700 shrink-0"
            title="Switch Mode or Return to Home"
          >
            <div className="p-1 sm:p-1.5 bg-emerald-600 rounded-[2px] text-white shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-sm sm:text-base md:text-lg font-black tracking-wide text-amber-400 flex items-center gap-1 leading-none">
                HGUARD
                <span className="text-[8px] sm:text-[9px] bg-amber-500 text-slate-950 px-1 py-0.2 rounded-[2px] font-black uppercase tracking-wider">
                  {mode === 'camera' ? 'CAM' : mode === 'viewer' ? 'VIEWER' : 'HOME'}
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono mt-0.5 hidden xs:block">
                {mode === 'camera' ? 'Sentinel' : mode === 'viewer' ? 'Monitor' : 'Setup & Connect'}
              </div>
            </div>
          </button>
        </div>

        {/* Center Hardware & Vital Badges: Unified, compact, responsive pills */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 shrink min-w-0">
          {/* CAMERA OFFLINE WARNING (>5m SILENT) */}
          {offlineCamerasCount > 0 && onOpenHeartbeatChecker && (
            <button
              id="nav-offline-cameras-badge"
              onClick={onOpenHeartbeatChecker}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-500 border-2 border-red-300 px-2 sm:px-2.5 py-1 rounded-[2px] text-xs font-black text-white shadow-lg animate-pulse transition cursor-pointer shrink-0"
              title={`${offlineCamerasCount} camera(s) silent for >5 minutes. Click to inspect heartbeat.`}
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden md:inline">OFFLINE:</span>
              <span>{offlineCamerasCount} CAM{offlineCamerasCount > 1 ? 'S' : ''}</span>
            </button>
          )}

          {/* UNPLUGGED WARNING (High priority only when triggered) */}
          {isUnpluggedWarning && (
            <button
              id="nav-unplugged-warning-badge"
              onClick={() => setShowPowerHelpModal(true)}
              className="flex items-center gap-1 bg-red-950 hover:bg-red-900 border-2 border-red-500 px-2 py-1 rounded-[2px] text-xs font-black text-red-200 shadow-lg animate-pulse transition cursor-pointer shrink-0"
              title="Camera device has been unplugged for >15 min. Click to inspect."
            >
              <PlugZap className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
              <span className="hidden md:inline">Unplugged </span>
              <span>({effectiveMinutes}m)</span>
            </button>
          )}

          {/* Deep Discharge Due (Only when triggered) */}
          {battery.deepDischargeReminderDue && (
            <button
              id="nav-deep-discharge-badge"
              onClick={() => setShowPowerHelpModal(true)}
              className="hidden lg:flex items-center gap-1 bg-amber-950 hover:bg-amber-900 border border-amber-500 px-2 py-1 rounded-[2px] text-xs font-black text-amber-200 animate-pulse transition shrink-0"
              title="Deep discharge due for battery health"
            >
              <BatteryCharging className="w-3.5 h-3.5 text-amber-300" />
              <span>Discharge Due</span>
            </button>
          )}

          {/* Clean Unified Battery Pill */}
          <div
            id="nav-battery-badge"
            className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-[2px] font-bold text-xs border shrink-0 ${
              isBattery80Warning
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                : isUnpluggedWarning
                ? 'bg-red-950 border-red-500 text-red-300'
                : !battery.charging
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-emerald-400'
            }`}
            title={battery.charging ? 'Charging (Safe at 80%)' : `Battery: ${battery.level}%`}
          >
            {battery.charging ? (
              <BatteryCharging className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            ) : (
              <Battery className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            )}
            <span className="font-mono font-black">{battery.level}%</span>
            {isBattery80Warning && (
              <span className="hidden xl:inline text-[9px] bg-amber-400 text-black px-1 rounded-[2px] font-black">
                80% SAFE
              </span>
            )}
          </div>

          {/* Thermal Pill */}
          <div
            id="nav-thermal-badge"
            className={`hidden lg:flex items-center gap-1 px-2 py-1 rounded-[2px] font-bold text-xs border shrink-0 ${
              thermal === 'hot'
                ? 'bg-red-900/40 border-red-500 text-red-300 animate-bounce'
                : thermal === 'warm'
                ? 'bg-amber-900/40 border-amber-500 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-cyan-300'
            }`}
            title="Overheat Guardian"
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="capitalize">{thermal === 'normal' ? 'Cool' : thermal}</span>
          </div>

          {/* Eco Screen Cool (Camera Mode Only) */}
          {mode === 'camera' && onToggleEcoCool && (
            <button
              id="nav-eco-cool-toggle"
              onClick={onToggleEcoCool}
              className={`flex items-center gap-1 px-2 py-1 rounded-[2px] font-bold text-xs border transition shrink-0 ${
                isEcoCoolActive
                  ? 'bg-cyan-600 border-cyan-300 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Blackout screen to stay cool"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Eco-Cool</span>
            </button>
          )}
        </div>

        {/* ROLE-SPECIFIC ACTION CONTROLS: Completely responsive, no overflow */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          {/* ================= MODE 1: CAMERA (SENIOR OLD PHONE) ================= */}
          {mode === 'camera' && (
            <>
              {/* Camera has ONLY 2 clean actions: Pair Scanner & Exit to Home */}
              {onOpenPairingScanner && (
                <button
                  id="nav-cam-scan-qr-btn"
                  onClick={onOpenPairingScanner}
                  className="flex items-center gap-1 sm:gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-2 sm:px-3 py-1.5 rounded-[2px] font-black text-xs shadow transition border border-emerald-400 shrink-0"
                  title="Scan Viewer QR Code to pair automatically"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Scan QR</span>
                </button>
              )}
              <button
                id="nav-cam-exit-btn"
                onClick={() => onSelectMode('select')}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 sm:px-2.5 py-1.5 rounded-[2px] font-bold text-xs border border-slate-700 transition shrink-0"
                title="Exit Camera Mode"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </>
          )}

          {/* ================= MODE 2: VIEWER (FAMILY MONITOR) ================= */}
          {mode === 'viewer' && (
            <>
              {/* Primary 1-Click Action: Add Camera QR */}
              {onOpenPairingQR && (
                <button
                  id="nav-viewer-add-camera-btn"
                  onClick={onOpenPairingQR}
                  className="flex items-center gap-1 sm:gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-2 sm:px-2.5 md:px-3 py-1.5 rounded-[2px] font-black text-xs shadow transition border border-emerald-400 shrink-0"
                  title="Display QR code for old phones to pair in 1 click"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">+ Add Camera</span>
                  <span className="hidden xs:inline md:hidden">+ Cam</span>
                </button>
              )}

              {/* Network Heartbeat Checker Button */}
              {onOpenHeartbeatChecker && (
                <button
                  id="nav-heartbeat-btn"
                  onClick={onOpenHeartbeatChecker}
                  className={`hidden sm:flex items-center gap-1 border px-2 sm:px-2.5 py-1.5 rounded-[2px] font-bold text-xs transition shrink-0 ${
                    offlineCamerasCount > 0
                      ? 'bg-red-600 text-white border-red-400 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300'
                  }`}
                  title="Network Heartbeat Checker: 5-minute timeout tracking"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Heartbeat</span>
                  {offlineCamerasCount > 0 && (
                    <span className="bg-red-950 text-red-200 px-1 py-0.2 rounded-[2px] text-[10px] font-black">
                      {offlineCamerasCount}
                    </span>
                  )}
                </button>
              )}

              {/* Event Logs with unread count */}
              <button
                id="nav-events-btn"
                onClick={onOpenEvents}
                className="relative flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 sm:px-2.5 py-1.5 rounded-[2px] font-bold text-xs text-white transition shrink-0"
                title="Security Alert Logs"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Logs</span>
                {unreadAlertsCount > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-[2px] animate-pulse">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>

              {/* Share Viewer Link */}
              {onOpenShare && (
                <button
                  id="nav-share-btn"
                  onClick={onOpenShare}
                  className="hidden lg:flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-2.5 py-1.5 rounded-[2px] font-bold text-xs transition shrink-0"
                  title="Share link with family members"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              )}

              {/* Account / Settings */}
              <button
                id="nav-settings-btn"
                onClick={onOpenSettings}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-[2px] text-slate-300 transition shrink-0"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}

          {/* ================= MODE 3: SELECT / HOME ================= */}
          {mode === 'select' && (
            <>
              {/* 1-Click QR Setup */}
              {onOpenPairingQR && (
                <button
                  id="nav-home-pair-qr-btn"
                  onClick={onOpenPairingQR}
                  className="flex items-center gap-1 sm:gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-2 sm:px-2.5 md:px-3 py-1.5 rounded-[2px] font-black text-xs shadow transition border border-emerald-400 shrink-0"
                  title="Instant 1-Click Camera Pairing QR"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">1-Click Pair</span>
                  <span className="hidden xs:inline md:hidden">Pair</span>
                </button>
              )}

              {/* Clean Consolidated "Guides & Demo" Dropdown */}
              <div className="relative shrink-0">
                <button
                  id="nav-help-menu-toggle-btn"
                  type="button"
                  onClick={() => setShowHelpMenu(!showHelpMenu)}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2 sm:px-2.5 py-1.5 rounded-[2px] font-bold text-xs transition"
                  title="Open Guides and Animated Demos"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline">Guides &amp; Demo</span>
                  <span className="hidden sm:inline lg:hidden">Guides</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showHelpMenu && (
                  <div
                    id="nav-help-dropdown-menu"
                    className="absolute right-0 mt-1 w-56 max-w-[calc(100vw-1.5rem)] bg-slate-900 border-2 border-slate-700 rounded-[2px] shadow-2xl py-1 z-50 text-xs"
                    onClick={() => setShowHelpMenu(false)}
                  >
                    {onOpenAnimationDemo && (
                      <button
                        onClick={onOpenAnimationDemo}
                        className="w-full text-left px-3 py-2 hover:bg-slate-800 text-amber-300 font-bold flex items-center gap-2 border-b border-slate-800"
                      >
                        <Activity className="w-4 h-4 text-amber-400" />
                        <div>
                          <div>Animated Network Demo</div>
                          <div className="text-[10px] text-slate-400 font-normal">Visual 6-camera simulation</div>
                        </div>
                      </button>
                    )}
                    {onOpenSeniorGuide && (
                      <button
                        onClick={onOpenSeniorGuide}
                        className="w-full text-left px-3 py-2 hover:bg-slate-800 text-emerald-300 font-bold flex items-center gap-2 border-b border-slate-800"
                      >
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div>Senior Quick Guide</div>
                          <div className="text-[10px] text-slate-400 font-normal">Hands-free voice &amp; safety</div>
                        </div>
                      </button>
                    )}
                    {onOpenSetupGuide && (
                      <button
                        onClick={onOpenSetupGuide}
                        className="w-full text-left px-3 py-2 hover:bg-slate-800 text-white font-bold flex items-center gap-2 border-b border-slate-800"
                      >
                        <ListOrdered className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div>Step-by-Step Setup Guide</div>
                          <div className="text-[10px] text-slate-400 font-normal">Zero-reading instructions</div>
                        </div>
                      </button>
                    )}
                    <button
                      onClick={onOpenCloudStorage}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 text-sky-300 font-bold flex items-center gap-2"
                    >
                      <Cloud className="w-4 h-4 text-sky-400" />
                      <div>
                        <div>Drive Vault &amp; Cloud</div>
                        <div className="text-[10px] text-slate-400 font-normal">Google Drive recordings</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Account / User */}
              <button
                id="nav-account-btn"
                onClick={onOpenAccount}
                className="flex items-center gap-1 sm:gap-1.5 bg-slate-800 hover:bg-slate-700 border border-amber-500/40 px-2 sm:px-2.5 py-1.5 rounded-[2px] font-bold text-xs text-amber-300 transition shrink-0"
                title="Account & Gmail"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline truncate max-w-[65px]">
                  {user.name ? user.name.split('@')[0].split(' ')[0] : 'User'}
                </span>
              </button>

              <button
                id="nav-settings-btn"
                onClick={onOpenSettings}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-[2px] text-slate-300 transition shrink-0"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}
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
