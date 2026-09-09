import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Smartphone,
  Tablet,
  Users,
  Send,
  Mail,
  Shield,
  X,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { CameraSlot, ViewerStation } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  encryptionPin: string;
  userEmail: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  encryptionPin,
  userEmail,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<ViewerStation>('viewer2');
  const [selectedCam, setSelectedCam] = useState<CameraSlot>('cam1');

  if (!isOpen) return null;

  const baseUrl = window.location.origin + window.location.pathname;

  // Viewer link for relatives/friends
  const viewerShareUrl = `${baseUrl}?role=viewer&station=${selectedStation}&user=${encodeURIComponent(
    userEmail
  )}&pin=${encodeURIComponent(encryptionPin)}`;

  // Camera link for setting up old phones (All 6 Cameras: Hands-Free Always, Zero Setup)
  const cameraShareUrl = `${baseUrl}?role=camera&senior=1&autostart=1&cam=${selectedCam}${
    selectedCam === 'cam2' ? '&privacy=1' : ''
  }&user=${encodeURIComponent(userEmail)}&pin=${encodeURIComponent(encryptionPin)}`;

  const copyToClipboard = (text: string, typeKey: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(typeKey);
      setTimeout(() => setCopiedType(null), 2500);
    });
  };

  const shareNative = async (title: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: 'Access our secure HGuard home surveillance monitor:',
          url,
        });
      } catch {
        // ignore cancellation
      }
    } else {
      copyToClipboard(url, 'viewer');
    }
  };

  return (
    <div
      id="share-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto"
    >
      <div className="bg-slate-900 border-2 border-slate-700 max-w-xl w-full rounded-[2px] shadow-2xl p-5 sm:p-6 text-white flex flex-col gap-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-[2px] border border-amber-500/30">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-wide text-white">
                Share with Friends & Relatives
              </h3>
              <p className="text-xs text-slate-400">
                Allow trusted family members to view live home cameras on their phones or tablets
              </p>
            </div>
          </div>
          <button
            id="close-share-modal-btn"
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-[2px] text-slate-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option 1: Family Viewer Setup Link */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-[2px] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-black text-white">1. VIEWER LINK (For Family &amp; Caregivers)</span>
            </div>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-[2px] border border-cyan-500/40 uppercase">
              Family Station
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Open on your phone, tablet, or laptop to monitor live camera feeds, talk into any room with 2-way intercom, and receive loud fall/emergency sirens.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <input
              type="text"
              readOnly
              value={viewerShareUrl}
              className="flex-1 bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-300 font-mono rounded-[2px] select-all outline-none"
            />
            <div className="flex gap-2">
              <button
                id="copy-viewer-share-link-btn"
                onClick={() => copyToClipboard(viewerShareUrl, 'viewer')}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-[2px] flex items-center justify-center gap-1.5 transition shadow"
              >
                {copiedType === 'viewer' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedType === 'viewer' ? 'COPIED!' : 'COPY VIEWER LINK'}</span>
              </button>

              <button
                id="native-share-viewer-btn"
                onClick={() => shareNative('HGuard Family Viewer Link', viewerShareUrl)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs rounded-[2px] border border-slate-600 flex items-center justify-center gap-1.5 transition"
                title="Share via messaging or email"
              >
                <Send className="w-4 h-4" />
                <span>SHARE</span>
              </button>
            </div>
          </div>
        </div>

        {/* Option 2: Old Phone Camera Setup Link */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-[2px] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-black text-white">2. CAMERA LINK (For Old Phone in Senior&apos;s Room)</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-[2px] border border-emerald-500/40 uppercase">
              100% Hands-Free Autonomous
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Open on any old phone to turn it into an autonomous room sentinel. <strong>The senior never has to touch the phone or press any buttons.</strong> All features run permanently in the background: 24/7 Voice distress listener (&quot;Help&quot;), 5+ ft optical fall detection, and auto-answer intercom.
          </p>

          {/* Optional Room Tag */}
          <div className="flex flex-col gap-1.5 text-xs">
            <span className="text-slate-400 font-bold">Room Placement (Optional):</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {(['cam1', 'cam2', 'cam3', 'cam4', 'cam5', 'cam6'] as CameraSlot[]).map((c) => {
                const labels: Record<CameraSlot, string> = {
                  cam1: 'Senior Bedroom',
                  cam2: 'Bathroom (Privacy Blur)',
                  cam3: 'Living Room',
                  cam4: 'Kitchen',
                  cam5: 'Hallway & Front Door',
                  cam6: 'Patio & Back',
                };
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedCam(c)}
                    className={`px-2 py-1.5 rounded-[2px] font-bold text-xs transition text-left truncate flex items-center gap-1.5 border ${
                      selectedCam === c
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">{labels[c]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <input
              type="text"
              readOnly
              value={cameraShareUrl}
              className="flex-1 bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-300 font-mono rounded-[2px] select-all outline-none"
            />
            <button
              id="copy-camera-share-link-btn"
              onClick={() => copyToClipboard(cameraShareUrl, 'camera')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-[2px] flex items-center justify-center gap-1.5 transition shadow"
            >
              {copiedType === 'camera' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedType === 'camera' ? 'COPIED!' : 'COPY CAMERA LINK'}</span>
            </button>
          </div>
        </div>

        {/* Security & End-to-End Privacy Note */}
        <div className="bg-slate-950/60 p-3 rounded-[2px] border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            AES-256 encrypted security. Only people you send this link or share your PIN with can view your live feeds.
          </span>
        </div>

        <button
          id="done-share-modal-btn"
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-[2px] border border-slate-700 transition"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
