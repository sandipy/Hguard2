import React from 'react';
import {
  X,
  Shield,
  BatteryCharging,
  Mic,
  PhoneCall,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface SeniorQuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSOS?: () => void;
}

export const SeniorQuickGuideModal: React.FC<SeniorQuickGuideModalProps> = ({
  isOpen,
  onClose,
  onTriggerSOS,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-slate-950 border-2 border-slate-700 rounded-[4px] max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* HEADER */}
        <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2px] bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-wide text-white">
                SENIOR USER GUIDE
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Autonomous Camera Phone Operation • Zero Buttons Required
              </p>
            </div>
          </div>
          <button
            id="close-senior-guide-modal-btn"
            onClick={onClose}
            className="p-2 rounded-[2px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition"
            aria-label="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 SIMPLE RULES CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5">
          {/* Rule 1 */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-[2px] flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-400/40 rounded-[2px] shrink-0 font-black">
              <BatteryCharging className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-amber-400 font-bold text-xs uppercase tracking-wide">
                Rule #1 • Keep It Plugged In
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Leave the phone connected to the wall charger
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                The screen can stay dim or off, while the camera and microphone remain active. You never need to turn the phone off at night.
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-[2px] flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 rounded-[2px] shrink-0 font-black">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wide">
                Rule #2 • Zero Buttons To Push
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                No setup or daily interaction required
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                The camera operates autonomously. You do not need to enter passwords, open apps, or adjust settings.
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-[2px] flex items-start gap-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 border border-sky-400/40 rounded-[2px] shrink-0 font-black">
              <Mic className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sky-400 font-bold text-xs uppercase tracking-wide">
                Rule #3 • Hands-Free Voice Keyword
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Say &quot;Help me&quot; aloud to notify family
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                If you need assistance, say <strong className="text-amber-300">&quot;Help me&quot;</strong> or <strong className="text-amber-300">&quot;I fell&quot;</strong> out loud. The phone detects the keyword and sends a notification to family viewers.
              </p>
              <div className="mt-1.5 text-[11px] text-slate-400 bg-slate-950 p-1.5 rounded-[2px] border border-slate-800">
                💡 <em>Accidental trigger?</em> Say <strong className="text-emerald-400">&quot;I am okay&quot;</strong> to clear the alert hands-free.
              </div>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-[2px] flex items-start gap-3">
            <div className="p-2.5 bg-purple-500/20 text-purple-400 border border-purple-400/40 rounded-[2px] shrink-0 font-black">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-purple-400 font-bold text-xs uppercase tracking-wide">
                Rule #4 • Two-Way Family Audio
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Family can talk to you directly through the speaker
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                When family connects via intercom, a chime sounds and you can speak back naturally into the room.
              </p>
            </div>
          </div>

          {/* Emergency SOS Button */}
          <div className="p-3 bg-red-950/40 border border-red-500/60 rounded-[2px] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-red-300 uppercase">Emergency Family Alert</div>
              <div className="text-white font-bold text-sm">Need family assistance immediately?</div>
            </div>
            <button
              id="senior-modal-sos-btn"
              onClick={() => {
                if (onTriggerSOS) onTriggerSOS();
                onClose();
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-[2px] border border-red-300 shadow flex items-center justify-center gap-2 transition active:scale-95"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>🚨 CALL FAMILY NOW</span>
            </button>
          </div>

          {/* LIABILITY & LEGAL DISCLAIMER BOX */}
          <div className="p-3 bg-slate-900 border border-amber-500/40 rounded-[2px] flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-amber-300 font-bold block mb-0.5">IMPORTANT LEGAL &amp; SAFETY DISCLAIMER:</strong>
              HGuard is a consumer DIY informational camera tool designed solely for convenience and family communication. It is <strong>NOT</strong> an alarm company, certified life-safety device, medical emergency alert system, fire/smoke detector, or 911 dispatch service. In the event of a medical emergency, fire, or immediate danger, always call <strong>911</strong> or local emergency authorities directly.
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            HGuard Senior Monitor • Informational Utility
          </span>
          <button
            id="senior-guide-done-btn"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-[2px] border border-slate-600 transition"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
