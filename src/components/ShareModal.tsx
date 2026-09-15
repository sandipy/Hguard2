import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  Smartphone,
  Users,
  Send,
  Shield,
  X,
  QrCode,
  Link,
  Key,
  Info,
} from 'lucide-react';
import { CameraSlot, ViewerStation } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  encryptionPin: string;
  userEmail: string;
  onOpenPairingQR: (slot?: CameraSlot) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  encryptionPin,
  userEmail,
  onOpenPairingQR,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [selectedStation] = useState<ViewerStation>('viewer2');
  const [selectedCam, setSelectedCam] = useState<CameraSlot>('cam1');
  const [activeMethod, setActiveMethod] = useState<'link' | 'qr' | 'pin'>('link');

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const baseUrl = window.location.origin + window.location.pathname;
  const userParam = userEmail ? `&user=${encodeURIComponent(userEmail)}` : '';

  // Direct 1-Tap Links
  const viewerShareUrl = `${baseUrl}?role=viewer&station=${selectedStation}${userParam}&pin=${encodeURIComponent(encryptionPin || '8888')}`;
  const cameraShareUrl = `${baseUrl}?role=camera&cam=${selectedCam}&autostart=1${userParam}&pin=${encodeURIComponent(encryptionPin || '8888')}`;

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
          text: 'Open HGuard Home Monitor directly:',
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      copyToClipboard(url, 'viewer');
    }
  };

  return (
    <div
      id="share-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        id="share-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-slate-700 max-w-xl w-full rounded-[4px] shadow-2xl p-5 sm:p-6 text-white flex flex-col gap-4 relative my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header with High-Contrast Close Button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-[2px] border border-emerald-500/40">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Connect &amp; Share Devices
              </h3>
              <p className="text-xs text-slate-400">
                Setup new cameras or invite family viewers (3 simple methods)
              </p>
            </div>
          </div>
          {/* Touch-Friendly Large Close Button */}
          <button
            id="close-share-modal-btn"
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-[2px] text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            aria-label="Close Share Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Methods Selector (Answers: "is qr code only method? if so is it easy for people to setup") */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-[2px] border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveMethod('link')}
            className={`py-2 px-2 rounded-[2px] flex items-center justify-center gap-1.5 transition ${
              activeMethod === 'link'
                ? 'bg-emerald-600 text-white font-black shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>1. Direct Link</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMethod('qr')}
            className={`py-2 px-2 rounded-[2px] flex items-center justify-center gap-1.5 transition ${
              activeMethod === 'qr'
                ? 'bg-emerald-600 text-white font-black shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>2. QR Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMethod('pin')}
            className={`py-2 px-2 rounded-[2px] flex items-center justify-center gap-1.5 transition ${
              activeMethod === 'pin'
                ? 'bg-emerald-600 text-white font-black shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>3. 4-Digit PIN</span>
          </button>
        </div>

        {/* METHOD 1: DIRECT 1-TAP LINK (EASIEST OVER SMS / WHATSAPP) */}
        {activeMethod === 'link' && (
          <div className="flex flex-col gap-3">
            <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-[2px] text-xs text-emerald-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Easiest for Remote Setup:</strong> Send this link via SMS or WhatsApp to the other phone. When tapped, it opens directly into Camera or Viewer mode with zero typing required!
              </span>
            </div>

            {/* Camera Setup Link */}
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-[2px] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Link for Old Phone (Camera Mode)</span>
                </span>
                <span className="text-[10px] text-slate-400">Pre-configured</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={cameraShareUrl}
                  className="flex-1 bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 font-mono rounded-[2px] select-all outline-none"
                />
                <button
                  type="button"
                  id="copy-camera-link-btn"
                  onClick={() => copyToClipboard(cameraShareUrl, 'cam')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-[2px] flex items-center gap-1 shrink-0 transition"
                >
                  {copiedType === 'cam' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'cam' ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Viewer Setup Link */}
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-[2px] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Link for Family Member (Viewer Mode)</span>
                </span>
                <span className="text-[10px] text-slate-400">Tablet / Phone / PC</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={viewerShareUrl}
                  className="flex-1 bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 font-mono rounded-[2px] select-all outline-none"
                />
                <button
                  type="button"
                  id="copy-viewer-link-btn"
                  onClick={() => copyToClipboard(viewerShareUrl, 'view')}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-[2px] flex items-center gap-1 shrink-0 transition"
                >
                  {copiedType === 'view' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'view' ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => shareNative('HGuard Viewer Link', viewerShareUrl)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-[2px] border border-slate-700 shrink-0 transition"
                  title="Share via native sheet"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* METHOD 2: QR CODE */}
        {activeMethod === 'qr' && (
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-[2px] flex flex-col items-center text-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-[2px] text-emerald-300 text-xs">
              <strong>Best when both phones are in the same room:</strong> Point the camera of the old phone at the pairing QR code. It opens the web app pre-paired immediately.
            </div>
            <button
              type="button"
              id="open-qr-display-btn"
              onClick={() => {
                onClose();
                onOpenPairingQR(selectedCam);
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs rounded-[2px] flex items-center gap-2 transition shadow-lg"
            >
              <QrCode className="w-4 h-4" />
              <span>SHOW FULLSCREEN PAIRING QR CODE</span>
            </button>
          </div>
        )}

        {/* METHOD 3: 4-DIGIT SECURITY PIN */}
        {activeMethod === 'pin' && (
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-[2px] flex flex-col gap-3">
            <div className="text-xs text-slate-300">
              Anyone on your home network can simply open the website and enter your 4-digit Security PIN:
            </div>
            <div className="bg-slate-900 border-2 border-amber-500/50 p-3 rounded-[2px] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Your Household PIN</span>
                <span className="text-2xl font-black text-amber-300 font-mono tracking-widest">
                  {encryptionPin || '8888'}
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-[2px] border border-emerald-500/30">
                AES-256 Encrypted
              </span>
            </div>
          </div>
        )}

        {/* Security Guarantee */}
        <div className="bg-slate-950 p-2.5 rounded-[2px] border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Peer-to-peer encrypted transmission. Zero third-party video storage.</span>
        </div>

        {/* Bottom Close Button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            id="done-share-modal-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-[2px] border border-slate-700 transition"
          >
            CLOSE WINDOW
          </button>
        </div>
      </div>
    </div>
  );
};
