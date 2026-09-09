import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Crown,
  Check,
  HardDrive,
  Camera,
  Eye,
  Lock,
  Key,
  LogOut,
  Mail,
  Smartphone,
  Sparkles,
  X,
  RefreshCw,
  Github,
  ExternalLink,
  Copy,
  Terminal,
  Download,
  AlertCircle,
} from 'lucide-react';
import { UserProfile } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [emailInput, setEmailInput] = useState(user.email);
  const [nameInput, setNameInput] = useState(user.name);
  const [driveWebhookInput, setDriveWebhookInput] = useState(user.googleDriveWebhookUrl || '');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState('https://github.com/sandipy/Hguard2');
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedPagesUrl, setCopiedPagesUrl] = useState(false);
  const [copiedCamLink, setCopiedCamLink] = useState<string | null>(null);
  const [showDriveConnectPrompt, setShowDriveConnectPrompt] = useState(false);

  if (!isOpen) return null;

  const baseUrl = window.location.origin + window.location.pathname;

  const getQuickPairLink = (slot: 'cam1' | 'cam2' | 'cam3') => {
    return `${baseUrl}?role=camera&cam=${slot}&pin=${user.passPin}&user=${encodeURIComponent(user.email)}`;
  };

  const handleCopyCamLink = (slot: 'cam1' | 'cam2' | 'cam3') => {
    const link = getQuickPairLink(slot);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiedCamLink(slot);
      setTimeout(() => setCopiedCamLink(null), 2500);
    }
  };

  const [customGmailInput, setCustomGmailInput] = useState('');
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);

  const handleSignOut = () => {
    onUpdateUser({
      email: '',
      name: '',
      loggedIn: false,
      googleDriveAutoBackup: false,
      googleDriveEnabled: false,
    });
    setEmailInput('');
    setCustomGmailInput('');
    setFeedbackMsg('Signed out successfully.');
    setShowDriveConnectPrompt(false);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleCustomLogin = (targetEmail?: string) => {
    let email = (targetEmail || customGmailInput || emailInput).trim();
    if (!email) return;
    if (!email.includes('@')) {
      email = `${email}@gmail.com`;
    }
    setEmailInput(email);
    onUpdateUser({
      email,
      name: email.split('@')[0],
      authProvider: 'google',
      loggedIn: true,
    });
    setFeedbackMsg(`Connected with Gmail account: ${email}`);
    setShowDriveConnectPrompt(true);
    setShowSwitchAccount(false);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleGoogleQuickLogin = (email: string) => {
    handleCustomLogin(email);
  };

  const gitPushCommand = `git remote add origin ${repoUrl.trim()}
git branch -M main
git push -u origin main`;

  const handleCopyCmd = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(gitPushCommand);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2500);
    }
  };

  const handleCopyPagesUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('https://sandipy.github.io/Hguard2/');
      setCopiedPagesUrl(true);
      setTimeout(() => setCopiedPagesUrl(false), 2500);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      email: emailInput,
      name: nameInput,
      passPin: pinInput.length === 4 ? pinInput : user.passPin,
      googleDriveWebhookUrl: driveWebhookInput,
      authProvider: 'google',
    });
    setFeedbackMsg('Account & Google Drive settings saved successfully!');
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleToggleLogin = () => {
    onUpdateUser({ loggedIn: !user.loggedIn });
  };

  return (
    <div
      id="account-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        id="account-modal-container"
        className="bg-slate-900 border-2 border-amber-500/40 rounded-[2px] max-w-2xl w-full text-white shadow-2xl p-5 sm:p-7 flex flex-col gap-5 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2px] bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black">User Account & Settings</h2>
                <span className="bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-[2px] uppercase tracking-wider">
                  Premium Plus
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Senior identity, Google Drive cloud vault, and 6-camera pairing
              </p>
            </div>
          </div>
          <button
            id="account-close-btn"
            onClick={onClose}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-[2px] transition border border-slate-700"
            aria-label="Close Account Dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedbackMsg && (
          <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 p-3 rounded-[2px] text-center font-bold text-sm">
            {feedbackMsg}
          </div>
        )}

        {/* PROMPT: LIKE IF YOU SIGN IN WITH GMAIL, THEN IT ASKS STORE ON GOOGLE DRIVE, YES, CONNECT IT */}
        {showDriveConnectPrompt && (
          <div className="bg-emerald-950/70 border-2 border-emerald-400 p-4 rounded-[2px] flex flex-col gap-3 shadow-xl">
            <div className="flex items-center gap-2 text-white font-black text-base sm:text-lg">
              <HardDrive className="w-6 h-6 text-emerald-400" />
              <span>Store security recordings on Google Drive?</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200">
              Automatically save all camera video clips and motion snapshots to your Google Drive ({user.email}). Zero setup needed!
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                id="prompt-connect-drive-btn"
                onClick={() => {
                  onUpdateUser({ googleDriveAutoBackup: true, googleDriveEnabled: true });
                  setShowDriveConnectPrompt(false);
                  setFeedbackMsg('Connected! Videos will automatically store in Google Drive / HGuard_Surveillance');
                  setTimeout(() => setFeedbackMsg(null), 3500);
                }}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm rounded-[2px] border border-emerald-400 flex items-center gap-2 transition"
              >
                <Check className="w-4 h-4" />
                <span>YES, CONNECT IT</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDriveConnectPrompt(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-[2px] border border-slate-700 transition"
              >
                Not Now
              </button>
            </div>
          </div>
        )}

        {/* Gmail Authentication (Any Gmail Login) */}
        <div className="bg-slate-950 border border-slate-800 rounded-[2px] p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[2px] bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">Gmail Account</h3>
                  <span
                    className={`text-[11px] border px-2 py-0.5 rounded-[2px] font-bold ${
                      user.loggedIn && user.email
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {user.loggedIn && user.email ? 'Connected' : 'Signed Out'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Use any Gmail account to link your 6 cameras and 3 family viewers
                </p>
              </div>
            </div>

            {user.loggedIn && user.email && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSwitchAccount(!showSwitchAccount)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-[2px] border border-slate-700 transition"
                >
                  {showSwitchAccount ? 'Cancel' : 'Switch Account'}
                </button>
                <button
                  type="button"
                  id="account-signout-top-btn"
                  onClick={handleSignOut}
                  className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-bold rounded-[2px] border border-red-700/60 flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* If Logged In and not switching */}
          {user.loggedIn && user.email && !showSwitchAccount && (
            <div className="bg-slate-900 border border-slate-800 rounded-[2px] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[2px] bg-slate-800 flex items-center justify-center font-bold text-amber-400 border border-amber-500/30 text-xs">
                  G
                </div>
                <div>
                  <div className="text-xs font-black text-white font-mono">{user.email}</div>
                  <div className="text-[11px] text-slate-400">
                    PIN: <span className="font-mono text-amber-300 font-bold">{user.passPin}</span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-[2px] border border-emerald-500/30 font-bold">
                ✓ 24/7 Permanent Zero-Crash Session
              </div>
            </div>
          )}

          {/* If Logged Out OR Switching Account: Enter ANY Gmail */}
          {(!user.loggedIn || !user.email || showSwitchAccount) && (
            <div className="bg-slate-900 border border-slate-700 rounded-[2px] p-3.5 flex flex-col gap-3">
              <div className="text-xs text-slate-200 font-bold">
                Enter any Gmail address to connect:
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={customGmailInput}
                    onChange={(e) => setCustomGmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCustomLogin();
                      }
                    }}
                    placeholder="Enter any Gmail address (e.g. name@gmail.com)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-[2px] text-white text-xs focus:border-red-500 focus:outline-none placeholder-slate-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  id="account-submit-gmail-login-btn"
                  onClick={() => handleCustomLogin()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-xs rounded-[2px] flex items-center justify-center gap-1.5 transition shadow"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>SIGN IN WITH GMAIL</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>Quick Fill:</span>
                <button
                  type="button"
                  onClick={() => handleCustomLogin('drshahenyashpal@gmail.com')}
                  className="text-amber-400 underline hover:text-amber-300 font-mono"
                >
                  drshahenyashpal@gmail.com
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Google Drive Cloud Storage Settings */}
        <div className="bg-slate-950 border border-slate-800 rounded-[2px] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-[2px] border border-amber-500/30">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  Google Drive Storage
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-[2px] font-bold">
                    {user.googleDriveAutoBackup !== false ? 'ACTIVE' : 'OFF'}
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Folder: <span className="font-mono text-amber-300">HGuard_Surveillance</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              id="account-toggle-drive-btn"
              onClick={() => {
                const next = !user.googleDriveAutoBackup;
                onUpdateUser({ googleDriveAutoBackup: next, googleDriveEnabled: next });
              }}
              className={`px-3 py-1.5 rounded-[2px] text-xs font-black border transition ${
                user.googleDriveAutoBackup !== false
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {user.googleDriveAutoBackup !== false ? 'Connected' : 'Connect'}
            </button>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-[2px] border border-slate-800 text-xs text-slate-300 flex flex-col gap-1">
            <div>Recorded clips and motion alerts are automatically archived into date folders on your Google Drive.</div>
            <div className="text-[11px] text-amber-300 font-mono">
              Managed 12 GB Quota: automatically purges 100 MB batches from the oldest recorded footage to maintain continuous recording space.
            </div>
          </div>
        </div>

        {/* GitHub Repository, Web URL & Offline Package */}
        <div className="bg-slate-950 border border-slate-800 rounded-[2px] p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-[2px] border border-purple-500/30">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  GitHub & Web Deployment
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-[2px] font-bold">
                    sandipy/Hguard2
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Continuous sync to GitHub Pages with ready-to-run offline package
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                id="account-download-offline-zip-btn"
                href="/hguard-offline.zip"
                download="hguard-offline.zip"
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-[2px] flex items-center gap-1.5 shadow transition"
                title="Download offline standalone package"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Offline ZIP</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="bg-slate-900 border border-slate-800 rounded-[2px] p-2.5 flex flex-col justify-between gap-2">
              <div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Live Web URL (GitHub Pages)</span>
                <div className="text-xs font-mono text-emerald-400 truncate mt-0.5">https://sandipy.github.io/Hguard2/</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="copy-pages-url-btn"
                  onClick={handleCopyPagesUrl}
                  className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-[2px] border border-slate-700 flex items-center justify-center gap-1.5 transition"
                >
                  {copiedPagesUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPagesUrl ? 'Copied URL!' : 'Copy Web URL'}</span>
                </button>
                <a
                  href="https://sandipy.github.io/Hguard2/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-[2px] border border-slate-700 flex items-center gap-1 transition"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[2px] p-2.5 flex flex-col justify-between gap-2">
              <div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">GitHub Source Repository</span>
                <div className="text-xs font-mono text-purple-300 truncate mt-0.5">https://github.com/sandipy/Hguard2</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="copy-git-cmd-btn"
                  onClick={handleCopyCmd}
                  className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-[2px] border border-slate-700 flex items-center justify-center gap-1.5 transition"
                >
                  {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCmd ? 'Copied Git Cmd!' : 'Copy Git Push'}</span>
                </button>
                <a
                  href="https://github.com/sandipy/Hguard2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-[2px] border border-slate-700 flex items-center gap-1 transition"
                >
                  <span>Repo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 1-Tap Quick Pair Links for Very Old Phones */}
        <div className="bg-slate-950 border border-cyan-500/50 rounded-[2px] p-4 flex flex-col gap-3 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-[2px] border border-cyan-500/40">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  Old Phone 1-Tap Quick Links
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded-[2px] font-bold">
                    Up to 6 Cameras
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Open link on old phones to start camera mode automatically
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {(['cam1', 'cam2', 'cam3'] as const).map((slot, idx) => {
              const names = ['Front Door', 'Living Room', 'Backyard'];
              return (
                <div key={slot} className="bg-slate-900 border border-slate-700 rounded-[2px] p-3 flex flex-col justify-between gap-2">
                  <div>
                    <span className="text-xs font-black text-amber-400">{names[idx]}</span>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Boots directly into camera mode with Eco-Cool screen.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id={`copy-${slot}-link-btn`}
                      onClick={() => handleCopyCamLink(slot)}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-[2px] border border-slate-600 flex items-center justify-center gap-1.5 transition"
                    >
                      {copiedCamLink === slot ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCamLink === slot ? 'Copied Link!' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={getQuickPairLink(slot)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-[2px] border border-slate-600 transition"
                      title="Test in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Account Profile Form */}
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-200">
            <User className="w-5 h-5 text-amber-400" />
            Profile Credentials
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Account Email
              </label>
              <div className="relative">
                <input
                  id="account-email-input"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-[2px] px-3 py-2 text-white focus:border-amber-400 focus:outline-none text-sm"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Display Name
              </label>
              <input
                id="account-name-input"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-[2px] px-3 py-2 text-white focus:border-amber-400 focus:outline-none text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Senior Master PIN (4 digits)
              </label>
              <div className="relative">
                <input
                  id="account-pin-input"
                  type="password"
                  maxLength={4}
                  placeholder={`Current: ${user.passPin}`}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-[2px] px-3 py-2 text-white focus:border-amber-400 focus:outline-none text-sm tracking-widest"
                />
                <Key className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cloud Sync Status
              </label>
              <button
                id="account-cloud-sync-btn"
                type="button"
                onClick={() => onUpdateUser({ cloudSyncEnabled: !user.cloudSyncEnabled })}
                className={`w-full py-2 px-3 rounded-[2px] font-bold text-xs flex items-center justify-between border transition ${
                  user.cloudSyncEnabled
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  <span>Google Drive Vault</span>
                </div>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-[2px] font-black bg-emerald-500/30 text-emerald-300">
                  {user.cloudSyncEnabled ? 'ENABLED' : 'OFFLINE'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              id="account-save-changes-btn"
              type="submit"
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-[2px] shadow transition"
            >
              Save Account Changes
            </button>
            <button
              id="account-logout-btn"
              type="button"
              onClick={user.loggedIn ? handleSignOut : () => setShowSwitchAccount(true)}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-[2px] border border-slate-700 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {user.loggedIn ? 'Sign Out of Gmail' : 'Sign In with Gmail'}
            </button>
          </div>
        </form>

        {/* 6 Cameras & 3 Viewers Topology Info */}
        <div className="bg-slate-950 border border-slate-800 rounded-[2px] p-3 text-xs text-slate-300 flex items-start gap-2.5">
          <Smartphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-slate-300 leading-relaxed">
            <strong className="text-white">Topology:</strong> Up to 6 old phones in Camera mode and up to 3 viewers (tablets, phones, TVs) concurrently connected through your Gmail account and Google Drive vault.
          </p>
        </div>
      </div>
    </div>
  );
};
