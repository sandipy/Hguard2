import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  Scan,
  X,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { CameraSlot } from '../types';
import { playRogerBeep } from '../utils/soundAlerts';

export interface PairingPayload {
  email: string;
  pin: string;
  slot: CameraSlot;
  role: string;
  room?: string;
}

interface PairingQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPairSuccess: (payload: PairingPayload) => void;
}

export const PairingQRScannerModal: React.FC<PairingQRScannerModalProps> = ({
  isOpen,
  onClose,
  onPairSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scannedSuccess, setScannedSuccess] = useState<PairingPayload | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    async function startCamera() {
      setCameraError(null);
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (!isCancelled) {
            streamRef.current = fallbackStream;
            if (videoRef.current) {
              videoRef.current.srcObject = fallbackStream;
              videoRef.current.play().catch(() => {});
            }
          }
        } catch (e: any) {
          setCameraError(err.message || 'Unable to access camera for QR scanning');
        }
      }
    }

    startCamera();
    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, facingMode]);

  // Frame processing loop for QR detection
  useEffect(() => {
    if (!isOpen || scannedSuccess) return;
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let scanRunning = true;

    const parseQRData = (rawText: string): PairingPayload | null => {
      try {
        if (rawText.includes('?') || rawText.startsWith('http')) {
          const url = new URL(rawText.startsWith('http') ? rawText : `https://hguard.local/${rawText}`);
          const user = url.searchParams.get('user');
          const pin = url.searchParams.get('pin');
          const cam = url.searchParams.get('cam') as CameraSlot;
          const role = url.searchParams.get('role') || 'camera';
          const room = url.searchParams.get('room');
          if (user || pin || cam || room) {
            return {
              email: user ? decodeURIComponent(user) : '',
              pin: pin ? decodeURIComponent(pin) : '8888',
              slot: cam && ['cam1', 'cam2', 'cam3', 'cam4', 'cam5', 'cam6'].includes(cam) ? cam : 'cam1',
              role,
              room: room ? decodeURIComponent(room) : undefined,
            };
          }
        }
      } catch (e) {
        console.warn('QR parse error:', e);
      }
      return null;
    };

    const scanFrame = () => {
      if (!scanRunning) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2 && ctx) {
        const w = 320;
        const h = 240;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const qr = jsQR(imgData.data, w, h, { inversionAttempts: 'dontInvert' });
        if (qr && qr.data) {
          const result = parseQRData(qr.data);
          if (result) {
            scanRunning = false;
            setScannedSuccess(result);
            playRogerBeep();
            setTimeout(() => {
              onPairSuccess(result);
            }, 600);
            return;
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);
    return () => {
      scanRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, scannedSuccess, onPairSuccess]);

  if (!isOpen) return null;

  return (
    <div
      id="pairing-scanner-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-emerald-500 max-w-md w-full rounded-[4px] shadow-2xl p-5 text-white flex flex-col gap-4 my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-[2px] border border-emerald-500/30">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Scan Viewer QR Code</h3>
              <p className="text-xs text-slate-400">Point at the Viewer screen to pair</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-[2px] text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative aspect-[4/3] bg-black rounded-[2px] overflow-hidden border border-slate-800 flex items-center justify-center">
          <video ref={videoRef} playsInline muted autoPlay className="w-full h-full object-cover" />

          {/* Crosshairs */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-emerald-400/80 relative flex items-center justify-center">
              {!scannedSuccess && (
                <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              )}
              {scannedSuccess && (
                <div className="bg-emerald-950/90 border border-emerald-400 p-3 rounded-[2px] text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1 animate-bounce" />
                  <strong className="text-xs font-black text-white">PAIRING VERIFIED!</strong>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
            className="absolute bottom-2 right-2 bg-slate-900/80 px-2 py-1 rounded-[2px] border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3 text-emerald-400" />
            <span>Switch Cam</span>
          </button>
        </div>

        {cameraError && (
          <div className="bg-red-950/80 border border-red-500 p-2.5 rounded-[2px] text-xs text-red-200">
            {cameraError}. Please grant camera permissions.
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-[2px] text-xs font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
