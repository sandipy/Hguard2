import React, { useState } from 'react';
import { User, Key, Mail, Lock, X } from 'lucide-react';
import { UserProfile } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile;
  userProfile?: UserProfile;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onSaveProfile?: (updated: Partial<UserProfile>) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  userProfile,
  onUpdateUser,
  onSaveProfile,
}) => {
  const activeUser = user || userProfile || {
    email: '',
    name: 'Primary Household',
    plan: 'Premium Plus',
    activeCamerasAllowed: 6,
    concurrentViewersAllowed: 3,
    cloudRetentionDays: 30,
    loggedIn: false,
    passPin: '8888',
    cloudSyncEnabled: true,
  };

  const handleUpdate = onUpdateUser || onSaveProfile || (() => {});
  const [emailInput, setEmailInput] = useState(activeUser.email || '');
  const [nameInput, setNameInput] = useState(activeUser.name || '');
  const [pinInput, setPinInput] = useState(activeUser.passPin || '8888');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdate({
      email: emailInput,
      name: nameInput,
      passPin: pinInput,
      loggedIn: !!emailInput,
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      id="account-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-2 border-slate-700 rounded-[4px] max-w-md w-full text-white shadow-2xl p-5 flex flex-col gap-4 my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-[2px] border border-emerald-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Household Profile</h2>
              <p className="text-xs text-slate-400">Account identity and master PIN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-[2px] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedNotice && (
          <div className="bg-emerald-950 border border-emerald-500 text-emerald-300 p-2 rounded-[2px] text-xs font-bold text-center">
            Profile saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-3 text-xs">
          <div>
            <label className="text-slate-300 font-bold block mb-1">Household Email (Optional)</label>
            <div className="relative">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="yourhousehold@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-[2px] px-3 py-2 text-white focus:border-amber-400 outline-none"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">Display Station Name</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Living Room Base"
              className="w-full bg-slate-950 border border-slate-700 rounded-[2px] px-3 py-2 text-white focus:border-amber-400 outline-none"
            />
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">4-Digit Security PIN</label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="8888"
                className="w-full bg-slate-950 border border-slate-700 rounded-[2px] px-3 py-2 text-white font-mono font-bold tracking-widest focus:border-amber-400 outline-none"
              />
              <Key className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-[2px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-[2px]"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
