import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { ShieldAlert, ShieldCheck, KeyRound, Eye, EyeOff, X, Lock, Sparkles, Terminal } from 'lucide-react';

export default function SecretPasscodeModal({ isOpen, onClose }) {
  const { unlockVault, authError, setAuthError } = useSecurity();
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center neon-glow-teal">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20">
          <Terminal className="w-8 h-8 animate-pulse text-teal-400" />
        </div>

        <h3 className="font-mono font-bold text-white text-lg tracking-wider uppercase text-center flex items-center space-x-2">
          <span>Vault Master Authentication</span>
        </h3>
        <p className="text-xs text-slate-400 text-center mt-1.5 mb-6 max-w-xs leading-relaxed">
          Authorized owner access required to modify, create, or manage vault records.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col space-y-4">
          <div className="relative w-full flex items-center">
            <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5" />
            <input
              type={showPasscode ? 'text' : 'password'}
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setAuthError('');
              }}
              autoFocus
              placeholder="Enter Secret Passcode"
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-teal-300 font-mono text-sm focus:outline-none focus:border-teal-500 placeholder-slate-600 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-200"
            >
              {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {authError && (
            <div className="flex items-center space-x-1.5 text-xs text-rose-400 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-mono font-bold text-sm transition shadow-lg shadow-teal-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isVerifying ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Unlock</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800/80 w-full text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">Ctrl+Shift+L</kbd>
          </p>
        </div>
      </div>
    </div>
  );
}
