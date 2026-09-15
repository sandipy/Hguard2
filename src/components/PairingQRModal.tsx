import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Check,
  Copy,
  Share2,
  X,
  Camera,
  CheckCircle2,
  Sparkles,
  Shield,
} from 'lucide-react';
import { CameraSlot } from '../types';
import { globalStreamChannel } from '../utils/streamChannel';

interface PairingQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  encryptionPin: string;
  initialCameraSlot?: CameraSlot;
  onCameraPairedSuccess?: (slot: CameraSlot) => void;
}

const CAMERA_SLOTS: { id: CameraSlot; name: string; desc: string }[] = [
  { id: 'cam1', name: 'Camera 1: Front Door', desc: 'Main entryway surveillance' },
  { id: 'cam2', name: 'Camera 2: Living Room', desc: 'Central common area' },
  { id: 'cam3', name: 'Camera 3: Senior Bedroom', desc: 'Bedrest & night wandering' },
  { id: 'cam4', name: 'Camera 4: Kitchen', desc: 'Cooking & stove safety' },
  { id: 'cam5', name: 'Camera 5: Backyard / Patio', desc: 'Outdoor perimeter' },
  { id: 'cam6', name: 'Camera 6: Driveway / Garage', desc: 'Vehicle & gate entry' },
];

export const PairingQRModal: React.FC<PairingQRModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  encryptionPin,
  initialCameraSlot = 'cam1',
  onCameraPairedSuccess,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<CameraSlot>(initialCameraSlot);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [pairingUrl, setPairingUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [justPaired, setJustPaired] = useState(false);

  useEffect(() => {
    if (isOpen && initialCameraSlot) {
      setSelectedSlot(initialCameraSlot);
      setJustPaired(false);
    }
  }, [isOpen, initialCameraSlot]);

  useEffect(() => {
    if (!isOpen) return;
    const origin = window.location.origin;
    const pathname = window.location.pathname.replace(/\/$/, '');
    const cleanBase = `${origin}${pathname}/`;
    const emailQuery = userEmail ? `&user=${encodeURIComponent(userEmail)}` : '';
    const url = `${cleanBase}?role=camera&autostart=1&cam=${selectedSlot}${emailQuery}&pin=${encodeURIComponent(encryptionPin || '8888')}&t=${Date.now()}`;
    setPairingUrl(url);

    QRCode.toDataURL(url, {
      width: 380,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error('Failed to generate pairing QR:', err);
      });
  }, [isOpen, selectedSlot, userEmail, encryptionPin]);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = globalStreamChannel.onCameraStatus((status) => {
      if (status && status.cameraId === selectedSlot && status.isOnline) {
        setJustPaired(true);
        if (onCameraPairedSuccess) {
          onCameraPairedSuccess(selectedSlot);
        }
      }
    });
    return () => unsub();
  }, [isOpen, selectedSlot, onCameraPairedSuccess]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!pairingUrl) return;
    navigator.clipboard.writeText(pairingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShare = async () => {
    if (!pairingUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pair Camera: ${selectedSlot.toUpperCase()}`,
          text: `Scan or tap to pair this phone as an HGuard Security Camera:`,
          url: pairingUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      id="pairing-qr-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-emerald-500 max-w-xl w-full rounded-[4px] shadow-2xl p-5 text-white flex flex-col gap-4 relative my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-[2px] border border-emerald-500/30">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Camera Pairing QR Code
                </h3>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-[2px]">
                  Zero-Setup
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan with any old smartphone camera to connect instantly
              </p>
            </div>
          </div>
          <button
            id="close-pairing-qr-modal-btn"
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-[2px] text-slate-300 hover:text-white border border-slate-700 transition"
            aria-label="Close Pairing Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pairing Success Alert */}
        {justPaired && (
          <div className="bg-emerald-950/80 border-2 border-emerald-400 p-3 rounded-[2px] flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-emerald-200">
                Camera paired &amp; transmitting live!
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs rounded-[2px]"
            >
              Done
            </button>
          </div>
        )}

        {/* Room Slot Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-300 font-bold flex items-center justify-between">
            <span>Target Camera Slot:</span>
            <span className="text-emerald-400 font-mono text-xs">{selectedSlot.toUpperCase()}</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {CAMERA_SLOTS.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlot(slot.id)}
                className={`p-2 rounded-[2px] text-left border text-xs transition ${
                  selectedSlot === slot.id
                    ? 'bg-emerald-950 border-emerald-400 text-white font-bold shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold truncate">{slot.name.split(':')[0]}</div>
                <div className="text-[10px] text-slate-400 truncate">{slot.name.split(':')[1]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* QR Code Center Box */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950 p-4 rounded-[2px] border border-slate-800">
          <div className="p-2 bg-white rounded-[2px] shadow-xl shrink-0">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Camera Pairing QR Code"
                className="w-44 h-44 sm:w-48 sm:h-48 block"
              />
            ) : (
              <div className="w-44 h-44 sm:w-48 sm:h-48 bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold">
                Generating QR...
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 text-xs text-slate-300">
            <strong className="text-white font-bold flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>How it pairs in 3 seconds:</span>
            </strong>
            <p className="leading-relaxed">
              1. Open the camera app on the old phone.
              <br />
              2. Point it at this QR code.
              <br />
              3. Tap the link banner that appears.
            </p>
            <p className="text-slate-400 text-[11px]">
              No app store install needed. Runs autonomously in the phone&apos;s browser.
            </p>
          </div>
        </div>

        {/* Link / URL Alternative */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={pairingUrl}
            className="flex-1 bg-slate-950 border border-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-[2px] font-mono select-all outline-none"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-[2px] border border-slate-600 flex items-center gap-1 shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-[2px] flex items-center gap-1 shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted with PIN: {encryptionPin || '8888'}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-[2px] border border-slate-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
