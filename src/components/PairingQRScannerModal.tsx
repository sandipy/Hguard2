import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  Scan,
  Camera,
  X,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Shield,
  Smartphone,
  Info,
} from 'lucide-react';
import { CameraSlot } from '../types';
import { playRogerBeep, playBatteryLimitChime } from '../utils/soundAlerts';

interface PairingPayload {
  email: string;
  pin: string;
  slot: CameraSlot;
  role: string;
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
  const [isScanning, setIsScanning] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState<PairingPayload | null>(null);

  // Initialize camera stream
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;

    async function startCamera() {
      setCameraError(null);
      setIsScanning(true);

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
        console.warn('QR scanner camera error:', err);
        // Fallback to any camera without constraints
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
          setIsScanning(false);
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

    let barcodeDetector: any = null;
    if ('BarcodeDetector' in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch (e) {
        barcodeDetector = null;
      }
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let scanRunning = true;

    const parseQRData = (rawText: string): PairingPayload | null => {
      try {
        // Option 1: URL with query parameters
        if (rawText.includes('?') || rawText.startsWith('http')) {
          const url = new URL(rawText.startsWith('http') ? rawText : `https://hguard.local/${rawText}`);
          const user = url.searchParams.get('user');
          const pin = url.searchParams.get('pin');
          const cam = url.searchParams.get('cam') as CameraSlot;
          const role = url.searchParams.get('role') || 'camera';

          if (user || pin || cam) {
            return {
              email: user ? decodeURIComponent(user) : 'drshahenyashpal@gmail.com',
              pin: pin ? decodeURIComponent(pin) : '8888',
              slot: cam && ['cam1', 'cam2', 'cam3', 'cam4', 'cam5', 'cam6'].includes(cam) ? cam : 'cam1',
              role,
            };
          }
        }

        // Option 2: JSON string payload
        if (rawText.trim().startsWith('{')) {
          const parsed = JSON.parse(rawText);
          if (parsed.email || parsed.user || parsed.pin) {
            return {
              email: parsed.email || parsed.user || 'drshahenyashpal@gmail.com',
              pin: parsed.pin || '8888',
              slot: parsed.slot || parsed.cam || 'cam1',
              role: parsed.role || 'camera',
            };
          }
        }
      } catch (e) {
        console.warn('QR parse failed:', e);
      }
      return null;
    };

    const scanFrame = async () => {
      if (!scanRunning) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        // Try native BarcodeDetector if available
        if (barcodeDetector) {
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0) {
              const result = parseQRData(barcodes[0].rawValue);
              if (result) {
                handleDetectionSuccess(result);
                return;
              }
            }
          } catch {
            // BarcodeDetector error, fallback to jsQR
          }
        }

        // Fallback to jsQR
        if (ctx) {
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
              handleDetectionSuccess(result);
              return;
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    const handleDetectionSuccess = (payload: PairingPayload) => {
      scanRunning = false;
      setScannedSuccess(payload);
      playRogerBeep();

      // Trigger pair success after short celebration animation
      setTimeout(() => {
        onPairSuccess(payload);
      }, 750);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      scanRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, scannedSuccess, onPairSuccess]);

  if (!isOpen) return null;

  return (
    <div
      id="pairing-scanner-modal-overlay"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto"
    >
      <div className="bg-slate-900 border-2 border-emerald-500 max-w-lg w-full rounded-[2px] shadow-2xl p-5 sm:p-6 text-white flex flex-col gap-4 my-6">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-[2px] border border-emerald-500/30">
              <Scan className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black tracking-wide text-white">
                  SCAN VIEWER QR CODE
                </h3>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-[2px]">
                  Zero Setup
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Point this camera at the QR code displayed on your Viewer phone or tablet
              </p>
            </div>
          </div>
          <button
            id="close-qr-scanner-btn"
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-[2px] text-slate-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCANNER VIEWFINDER */}
        <div className="relative aspect-[4/3] bg-black rounded-[2px] overflow-hidden border-2 border-slate-800 flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />

          {/* VIEW FINDER OVERLAY TARGET */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Dark vignette corners */}
            <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-emerald-400/80 rounded-[2px] relative shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400" />

              {/* Laser Scanning Animation */}
              {!scannedSuccess && (
                <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse absolute top-1/2 -translate-y-1/2" />
              )}

              {/* SUCCESS CONFIRMATION OVERLAY */}
              {scannedSuccess && (
                <div className="bg-emerald-950/90 border-2 border-emerald-400 p-3.5 rounded-[2px] flex flex-col items-center gap-2 text-center animate-scaleUp">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                  <strong className="text-sm font-black text-white">QR CODE VERIFIED!</strong>
                  <span className="text-xs text-emerald-300 font-mono">
                    Linking as {scannedSuccess.slot.toUpperCase()} ({scannedSuccess.email})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* FLIP CAMERA BUTTON */}
          <button
            id="flip-scanner-camera-btn"
            type="button"
            onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
            className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-850 backdrop-blur px-3 py-1.5 rounded-[2px] border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 shadow"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Switch: {facingMode === 'environment' ? 'Rear' : 'Front'}</span>
          </button>
        </div>

        {/* ERROR MESSAGE IF CAMERA BLOCKED */}
        {cameraError && (
          <div className="bg-red-950/80 border border-red-500 p-3 rounded-[2px] text-xs text-red-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Camera Permission Needed</strong>
              <span>{cameraError}. Please allow camera access in your browser settings to scan.</span>
            </div>
          </div>
        )}

        {/* INSTRUCTIONS */}
        <div className="bg-slate-950 p-3.5 rounded-[2px] border border-slate-800 text-xs text-slate-300 flex flex-col gap-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Setup Automatic Linking:</span>
          </div>
          <p>
            Scanning the Viewer QR code immediately passes your Gmail address, encryption PIN, and designated camera room slot. No typing required!
          </p>
        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-[2px] transition"
          >
            Cancel
          </button>
          <span className="text-[11px] text-slate-400 font-mono">HGuard QR Pairing v2.4</span>
        </div>
      </div>
    </div>
  );
};
