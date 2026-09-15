import React from 'react';
import {
  Shield,
  Camera,
  Tv,
  Radio,
  Settings,
  Share2,
  AlertOctagon,
  Megaphone,
} from 'lucide-react';
import { AppMode } from '../types';

interface SeniorTopNavProps {
  appMode: AppMode;
  onSetAppMode: (mode: AppMode) => void;
  onOpenShareModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAnnouncementModal: () => void;
  onOpenHeartbeatModal: () => void;
  onTriggerSOS: () => void;
  eventCount: number;
}

export const SeniorTopNav: React.FC<SeniorTopNavProps> = ({
  appMode,
  onSetAppMode,
  onOpenShareModal,
  onOpenSettingsModal,
  onOpenAnnouncementModal,
  onOpenHeartbeatModal,
  onTriggerSOS,
  eventCount,
}) => {
  return (
    <header className="bg-slate-950 border-b-2 border-slate-800 px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-white sticky top-0 z-40">
      {/* Brand & Primary Mode Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-600 rounded-[2px] text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5 leading-none">
              <span>HGUARD</span>
              <span className="text-[10px] bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded-[2px] border border-slate-700 font-mono">
                MONITOR
              </span>
            </h1>
            <span className="text-[10px] text-slate-400 font-medium">Home Surveillance Sentinel</span>
          </div>
        </div>

        {/* Big Mode Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-700 p-0.5 rounded-[2px] text-xs font-black ml-1">
          <button
            id="nav-switch-to-viewer-btn"
            onClick={() => onSetAppMode('viewer')}
            className={`px-3 py-1.5 rounded-[2px] flex items-center gap-1.5 transition cursor-pointer ${
              appMode === 'viewer'
                ? 'bg-cyan-600 text-slate-950 shadow font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>VIEWER</span>
          </button>
          <button
            id="nav-switch-to-camera-btn"
            onClick={() => onSetAppMode('camera')}
            className={`px-3 py-1.5 rounded-[2px] flex items-center gap-1.5 transition cursor-pointer ${
              appMode === 'camera'
                ? 'bg-amber-500 text-slate-950 shadow font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>CAMERA</span>
          </button>
        </div>
      </div>

      {/* Streamlined Primary Actions Bar (Clutter Removed) */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Network Health Indicator Chip */}
        <button
          id="nav-heartbeat-status-btn"
          onClick={onOpenHeartbeatModal}
          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-[2px] text-xs font-bold flex items-center gap-1.5 transition"
          title="Network Heartbeat & Connection Health"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">Network Status</span>
        </button>

        {/* Intercom Announcement */}
        <button
          id="nav-intercom-btn"
          onClick={onOpenAnnouncementModal}
          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 rounded-[2px] text-xs font-bold flex items-center gap-1.5 transition"
          title="Broadcast Loud Speaker Message"
        >
          <Megaphone className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Broadcast</span>
        </button>

        {/* Share & Connect Devices Button */}
        <button
          id="nav-share-btn"
          onClick={onOpenShareModal}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-[2px] text-xs flex items-center gap-1.5 transition shadow"
          title="Connect Devices via Link, QR, or PIN"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Connect / Share</span>
        </button>

        {/* Settings Hub (Houses Logs, Storage, AI, Guides, Accounts) */}
        <button
          id="nav-settings-btn"
          onClick={onOpenSettingsModal}
          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-[2px] text-xs font-bold flex items-center gap-1.5 transition relative"
          title="Settings, Event Logs & Guides"
          aria-label="Open Settings"
        >
          <Settings className="w-4 h-4 text-slate-300" />
          <span className="hidden sm:inline">Settings</span>
          {eventCount > 0 && (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 rounded-full">
              {eventCount}
            </span>
          )}
        </button>

        {/* Emergency SOS */}
        <button
          id="nav-sos-btn"
          onClick={onTriggerSOS}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-[2px] flex items-center gap-1 transition animate-pulse shadow"
          title="Trigger Emergency Deterrent Siren"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>SOS</span>
        </button>
      </div>
    </header>
  );
};
