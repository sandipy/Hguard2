import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Shield,
  Smartphone,
  Info,
  Radio,
  RefreshCw,
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
  const [isSlotOnline, setIsSlotOnline] = useState(false);
  const [justPaired, setJustPaired] = useState(false);
  const checkIntervalRef = useRef<number | null>(null);

  // Sync initial slot when opened
  useEffect(() => {
    if (isOpen && initialCameraSlot) {
      setSelectedSlot(initialCameraSlot);
      setJustPaired(false);
    }
  }, [isOpen, initialCameraSlot]);

  // Generate pairing URL and QR code whenever slot or credentials change
  useEffect(() => {
    if (!isOpen) return;

    const origin = window.location.origin;
    const pathname = window.location.pathname.replace(/\/$/, '');
    const cleanBase = `${origin}${pathname}/`;

    // Direct autonomous launch URL:
    // role=camera, pair=1, senior=1, autostart=1, cam=<slot>, user=<email>, pin=<pin>
    const url = `${cleanBase}?role=camera&pair=1&senior=1&autostart=1&cam=${selectedSlot}&user=${encodeURIComponent(
      userEmail || 'drshahenyashpal@gmail.com'
    )}&pin=${encodeURIComponent(encryptionPin || '8888')}&t=${Date.now()}`;

    setPairingUrl(url);

    QRCode.toDataURL(url, {
      width: 420,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#020617', // slate-950
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

  // Monitor if the target camera comes online while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const unsub = globalStreamChannel.onCameraStatus((status) => {
      if (status && status.cameraId === selectedSlot && status.isOnline) {
        setIsSlotOnline(true);
        setJustPaired(true);
        if (onCameraPairedSuccess) {
          onCameraPairedSuccess(selectedSlot);
        }
      }
    });

    return () => {
      unsub();
    };
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
          title: `Pair ${CAMERA_SLOTS.find((s) => s.id === selectedSlot)?.name || 'Camera'}`,
          text: `Scan or tap to instantly pair this phone as HGuard Security Camera:`,
          url: pairingUrl,
        });
      } catch {
        // user cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const currentSlotMeta = CAMERA_SLOTS.find((s) => s.id === selectedSlot);

  return (
    <div
      id="pairing-qr-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto"
    >
      <div className="bg-slate-900 border-2 border-emerald-500 max-w-xl w-full rounded-[2px] shadow-2xl p-5 sm:p-6 text-white flex flex-col gap-5 my-6">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-[2px] border border-emerald-500/30">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black tracking-wide text-white">
                  INSTANT CAMERA PAIRING QR
                </h3>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-[2px]">
                  Zero-Setup
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan with any old smartphone to auto-pair without typing email or passwords
              </p>
            </div>
          </div>
          <button
            id="close-pairing-qr-modal-btn"
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-[2px] text-slate-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* JUST PAIRED REAL-TIME CELEBRATION */}
        {justPaired && (
          <div className="bg-emerald-950/80 border-2 border-emerald-400 p-3.5 rounded-[2px] flex items-center justify-between gap-3 animate-bounce">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-sm font-black text-emerald-200 block">
                  {currentSlotMeta?.name} PAIRED &amp; ONLINE!
                </strong>
                <span className="text-xs text-emerald-300">
                  Live video feed and senior guardian sentinel are active.
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-[2px] uppercase shrink-0"
            >
              VIEW FEED
            </button>
          </div>
        )}

        {/* SLOT SELECTOR */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-300 font-bold flex items-center justify-between">
            <span>Select Target Camera Location:</span>
            <span className="text-[11px] font-mono text-emerald-400">Slot: {selectedSlot.toUpperCase()}</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CAMERA_SLOTS.map((slot) => {
              const isSelected = selectedSlot === slot.id;
              return (
                <button
                  key={slot.id}
                  id={`qr-slot-select-${slot.id}`}
                  onClick={() => {
                    setSelectedSlot(slot.id);
                    setJustPaired(false);
                  }}
                  className={`p-2 rounded-[2px] text-left border transition flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-emerald-950 border-emerald-400 text-white shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black truncate">{slot.name.split(':')[0]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate">{slot.name.split(':')[1]?.trim()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* QR CODE CONTAINER */}
        <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-950 p-4 sm:p-5 rounded-[2px] border border-slate-800">
          <div className="relative p-2 bg-white rounded-[2px] shadow-2xl shrink-0">
            {qrDataUrl ? (
              <img
                id="camera-pairing-qr-image"
                src={qrDataUrl}
                alt="Camera Pairing QR Code"
                className="w-48 h-48 sm:w-56 sm:h-56 block"
              />
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 bg-slate-200 flex items-center justify-center text-slate-800 text-xs font-bold animate-pulse">
                Generating QR...
              </div>
            )}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-900 border border-emerald-400 text-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-[2px] whitespace-nowrap shadow flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Ready to Scan</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-left">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400 shrink-0" />
              <strong className="text-sm font-black text-white">How to Pair in 5 Seconds:</strong>
            </div>

            <ol className="text-xs text-slate-300 space-y-2.5 pl-4 list-decimal leading-relaxed">
              <li>
                <strong>From Camera Phone:</strong> Open the built-in iOS or Android camera and point it at this QR code.
              </li>
              <li>
                <strong>Tap the Notification Link:</strong> It opens HGuard already logged in as{' '}
                <span className="text-emerald-400 font-bold">{currentSlotMeta?.name}</span>.
              </li>
              <li>
                <strong>Zero Setup:</strong> Hands-free voice listening, fall sensor, and IR night vision arm automatically!
              </li>
            </ol>

            <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2 text-xs text-slate-400 font-mono">
              <span className="bg-slate-900 px-2 py-1 rounded-[2px] border border-slate-700">
                Email: {userEmail || 'drshahenyashpal@gmail.com'}
              </span>
              <span className="bg-slate-900 px-2 py-1 rounded-[2px] border border-slate-700">
                PIN: {encryptionPin || '8888'}
              </span>
            </div>
          </div>
        </div>

        {/* ACTIONS & URL COPY */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={pairingUrl}
              className="flex-1 bg-slate-950 border border-slate-700 text-slate-400 text-xs px-3 py-2 rounded-[2px] font-mono select-all focus:outline-none"
            />
            <button
              id="copy-pairing-url-btn"
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold text-xs rounded-[2px] border border-slate-600 flex items-center gap-1.5 transition shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED' : 'COPY'}</span>
            </button>
            <button
              id="share-pairing-url-btn"
              onClick={handleShare}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 font-black text-xs rounded-[2px] border border-emerald-400 flex items-center gap-1.5 transition shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>SHARE</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            You can also copy this URL and send it via text/email to open directly in the old phone&apos;s browser.
          </p>
        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted with AES-256 GCM</span>
          </span>
          <button
            id="close-pairing-modal-footer-btn"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-[2px] transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
