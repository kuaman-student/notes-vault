import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  X,
  Lock,
  Terminal,
  Clock,
  AlertTriangle,
  Flame,
  Shield
} from 'lucide-react';

export default function SecretPasscodeModal({ isOpen, onClose }) {
  const {
    unlockVault,
    authError,
    setAuthError,
    failedAttempts,
    maxAttempts,
    isLockedOut,
    lockoutSecondsLeft
  } = useSecurity();

  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isLockedOut) {
      return;
    }
    if (!passcode) {
      setAuthError('Please enter your Master Passcode.');
      return;
    }
    setIsVerifying(true);
    const success = await unlockVault(passcode);
    setIsVerifying(false);
    if (success) {
      setPasscode('');
    }
  };

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-mono text-xs">
      <div
        className={`relative w-full max-w-md bg-slate-900 border rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center transition-all ${
          isLockedOut
            ? 'border-rose-500/70 shadow-rose-500/20'
            : failedAttempts > 0
            ? 'border-amber-500/60 shadow-amber-500/20'
            : 'border-teal-500/40 neon-glow-teal'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Shield Icon */}
        <div
          className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 shadow-lg transition-transform ${
            isLockedOut
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse scale-105'
              : failedAttempts > 0
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
              : 'bg-teal-500/15 border-teal-500/30 text-teal-400 shadow-teal-500/20'
          }`}
        >
          {isLockedOut ? (
            <ShieldAlert className="w-8 h-8 text-rose-400 animate-bounce" />
          ) : (
            <Terminal className="w-8 h-8 text-teal-400 animate-pulse" />
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-white text-base tracking-wider uppercase text-center flex items-center space-x-2">
          <span>{isLockedOut ? '🚨 CYBER DEFENSE LOCKOUT' : 'Vault Master Authentication'}</span>
        </h3>
        <p className="text-[11px] text-slate-400 text-center mt-1.5 mb-4 max-w-xs leading-relaxed">
          {isLockedOut
            ? 'Multiple invalid passcode attempts detected. Brute-force defense protocol engaged.'
            : 'Authorized administrator access required to modify, create, or manage vault records.'}
        </p>

        {/* Security Attempts Counter */}
        <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 mb-4">
          <span className="text-[10px] text-slate-400 flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider">Cyber Defense HUD</span>
          </span>

          <div className="flex items-center space-x-1">
            {Array.from({ length: maxAttempts }).map((_, idx) => {
              const isUsed = idx < failedAttempts;
              return (
                <span
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isLockedOut
                      ? 'bg-rose-500 animate-pulse'
                      : isUsed
                      ? 'bg-rose-500/80 shadow-sm shadow-rose-500'
                      : 'bg-teal-500/40'
                  }`}
                  title={`Attempt ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Active Lockout Timer Card */}
        {isLockedOut ? (
          <div className="w-full p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex flex-col items-center justify-center space-y-2 mb-4 text-center">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <Clock className="w-4 h-4 animate-spin" />
              <span>LOCKOUT ACTIVE: {formatCountdown(lockoutSecondsLeft)}</span>
            </div>
            <p className="text-[11px] text-rose-200/80 max-w-xs">
              System input is temporarily disabled to prevent automated dictionary attacks. Please wait for cooldown.
            </p>
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col space-y-3.5">
          <div className="relative w-full flex items-center">
            <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5" />
            <input
              type={showPasscode ? 'text' : 'password'}
              value={passcode}
              disabled={isLockedOut || isVerifying}
              onChange={(e) => {
                setPasscode(e.target.value);
                setAuthError('');
              }}
              autoFocus
              placeholder={isLockedOut ? 'Input disabled during lockout' : 'Enter Secret Passcode'}
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-teal-300 font-mono text-xs focus:outline-none focus:border-teal-500 placeholder-slate-600 shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              disabled={isLockedOut}
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-200 disabled:opacity-40"
            >
              {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {authError && (
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying || isLockedOut}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-teal-500/25 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLockedOut ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Locked ({formatCountdown(lockoutSecondsLeft)})</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Unlock</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-3.5 border-t border-slate-800/80 w-full flex items-center justify-between text-[10px] text-slate-500">
          <span>SHA-256 Protected</span>
          <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Ctrl+Shift+L</kbd></span>
        </div>
      </div>
    </div>
  );
}
