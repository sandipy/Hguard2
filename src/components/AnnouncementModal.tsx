import React, { useState } from 'react';
import { Volume2, X, Send, Sparkles, Radio, Check } from 'lucide-react';
import { CameraSlot } from '../types';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string, target: CameraSlot | 'all') => void;
  defaultTarget?: CameraSlot | 'all';
}

const ROOM_NAMES: Record<CameraSlot, string> = {
  cam1: 'Senior Bedroom',
  cam2: 'Bathroom',
  cam3: 'Living Room',
  cam4: 'Kitchen',
  cam5: 'Hallway & Front Door',
  cam6: 'Patio & Back',
};

const PRESETS = [
  { label: 'Dinner Ready', text: 'Dinner is ready, please come to the dining table!' },
  { label: 'Medicine Time', text: 'Reminder: It is time to take your medicine and drink water.' },
  { label: 'Doctor Appointment', text: 'Your doctor appointment is in 20 minutes.' },
  { label: 'Delivery at Door', text: 'A package has just been delivered to the front porch.' },
  { label: 'Stay Seated Drill', text: 'Please stay seated and do not rush, I am coming right over.' },
  { label: 'Family Check-in', text: 'Hello! Just checking in from the family monitor to say hi.' },
  { label: 'Bedtime Lock', text: 'Good night! Please make sure the doors are locked.' },
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
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="announcement-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-emerald-500 rounded-[2px] w-full max-w-xl shadow-2xl p-5 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950 border border-emerald-500 text-emerald-300 rounded-[2px]">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                LOUD SPEAKER ANNOUNCEMENT
              </h3>
              <p className="text-xs text-slate-300">
                Plays chime and speaks announcement loudly through camera phone speakers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-[2px] border border-slate-700 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentNotice ? (
          <div className="p-8 text-center flex flex-col items-center gap-3 bg-emerald-950/80 border border-emerald-400 rounded-[2px]">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-2xl">
              ✓
            </div>
            <div className="text-lg font-black text-white">Announcement Broadcasted!</div>
            <p className="text-xs text-emerald-200">
              Chime and high-volume speech played on camera speaker unit.
            </p>
          </div>
        ) : (
          <>
            {/* Target Camera Slot Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Target Camera Speaker:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTarget('all')}
                  className={`p-2 rounded-[2px] text-xs font-black border transition ${
                    target === 'all'
                      ? 'bg-emerald-600 text-white border-emerald-300 shadow'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  📢 All Cameras
                </button>
                {(['cam1', 'cam2', 'cam3', 'cam4', 'cam5', 'cam6'] as CameraSlot[]).map((slotId) => (
                  <button
                    key={slotId}
                    type="button"
                    onClick={() => setTarget(slotId)}
                    className={`p-2 rounded-[2px] text-xs font-bold border transition truncate ${
                      target === slotId
                        ? 'bg-emerald-600 text-white border-emerald-300 shadow'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {ROOM_NAMES[slotId]}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Message Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Custom Announcement:
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type any message to speak out loud on the camera speaker (e.g., Mom, dinner is on the table)..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 p-3 rounded-[2px] text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            {/* 1-Tap Presets */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                1-Tap Fast Presets:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMessage(p.text);
                      handleBroadcast(p.text);
                    }}
                    className="p-2.5 bg-slate-800 hover:bg-slate-750 text-left border border-slate-700 hover:border-emerald-500 rounded-[2px] text-xs text-slate-200 transition group flex flex-col gap-0.5"
                  >
                    <span className="font-bold text-amber-300 group-hover:text-emerald-300">
                      {p.label}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate">{p.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-[2px] border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                id="send-speaker-announcement-btn"
                disabled={!message.trim()}
                onClick={() => handleBroadcast()}
                className={`px-5 py-2.5 font-black text-xs rounded-[2px] border transition shadow flex items-center gap-2 ${
                  message.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 active:scale-95'
                    : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>BROADCAST TO CAMERA SPEAKER</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
