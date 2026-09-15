import React, { useState } from 'react';
import { Volume2, X, Send, Sparkles } from 'lucide-react';
import { CameraSlot } from '../types';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string, target: CameraSlot | 'all') => void;
  defaultTarget?: CameraSlot | 'all';
}

const ROOM_NAMES: Record<CameraSlot, string> = {
  cam1: 'Front Door',
  cam2: 'Master Bedroom',
  cam3: 'Living Room',
  cam4: 'Kitchen',
  cam5: 'Backyard',
  cam6: 'Garage',
};

const PRESETS = [
  { label: 'Dinner Ready', text: 'Dinner is ready, please come to the dining table!' },
  { label: 'Medicine Reminder', text: 'Reminder: It is time to take your medicine and drink water.' },
  { label: 'Stay Seated', text: 'Please stay seated and do not rush, I am coming right over.' },
  { label: 'Delivery at Door', text: 'A package has just been delivered to the front door.' },
  { label: 'Family Check-in', text: 'Hello! Just checking in from the family monitor to say hi.' },
  { label: 'Good Morning', text: 'Good morning! Hope you had a restful night.' },
];

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSend,
  defaultTarget = 'all',
}) => {
  const [target, setTarget] = useState<CameraSlot | 'all'>(defaultTarget);
  const [message, setMessage] = useState('');
  const [sentNotice, setSentNotice] = useState(false);

  if (!isOpen) return null;

  const handleBroadcast = (textToBroadcast?: string) => {
    const finalMsg = (textToBroadcast || message).trim();
    if (!finalMsg) return;
    onSend(finalMsg, target);
    setSentNotice(true);
    setTimeout(() => {
      setSentNotice(false);
      setMessage('');
      onClose();
    }, 1200);
  };

  return (
    <div
      id="announcement-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-emerald-500 rounded-[4px] w-full max-w-lg shadow-2xl p-5 text-white flex flex-col gap-4 max-h-[90vh] overflow-y-auto my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950 border border-emerald-500 text-emerald-400 rounded-[2px]">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                BROADCAST LOUD ANNOUNCEMENT
              </h3>
              <p className="text-xs text-slate-400">
                Plays loud chime and speaks announcement on camera phone speaker
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-[2px] transition border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentNotice ? (
          <div className="p-8 text-center bg-emerald-950/60 border border-emerald-400 rounded-[2px] text-emerald-200 font-bold text-sm">
            Announcement broadcasted to camera speakers!
          </div>
        ) : (
          <>
            {/* Target Camera Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase">Target Camera Speaker:</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTarget('all')}
                  className={`py-1.5 px-2 rounded-[2px] text-xs font-bold border transition ${
                    target === 'all'
                      ? 'bg-emerald-600 text-white border-emerald-400 font-black'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  All Cameras
                </button>
                {(['cam1', 'cam2', 'cam3', 'cam4', 'cam5', 'cam6'] as CameraSlot[]).map((slotId) => (
                  <button
                    key={slotId}
                    type="button"
                    onClick={() => setTarget(slotId)}
                    className={`py-1.5 px-2 rounded-[2px] text-xs font-bold border transition truncate ${
                      target === slotId
                        ? 'bg-emerald-600 text-white border-emerald-400 font-black'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {ROOM_NAMES[slotId]}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase">Custom Message:</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type message to speak out loud on the camera speaker..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 p-2.5 rounded-[2px] text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* 1-Tap Presets */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Quick Presets:</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMessage(p.text);
                      handleBroadcast(p.text);
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-750 text-left border border-slate-700 hover:border-emerald-500 rounded-[2px] text-xs transition flex flex-col"
                  >
                    <span className="font-bold text-amber-300">{p.label}</span>
                    <span className="text-[10px] text-slate-400 truncate">{p.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-[2px]"
              >
                Cancel
              </button>
              <button
                type="button"
                id="send-broadcast-btn"
                disabled={!message.trim()}
                onClick={() => handleBroadcast()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-[2px] flex items-center gap-1.5 transition"
              >
                <Send className="w-4 h-4" />
                <span>BROADCAST NOW</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
