import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { Lock, Unlock, KeyRound, ShieldAlert, X, Check, Eye, EyeOff } from 'lucide-react';

export default function VaultPinModal({ isOpen, onClose }) {
  const { unlockVault, pinError, setPinError } = useSecurity();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!pin) {
      setPinError('Please enter your Master PIN.');
      return;
    }
    const success = unlockVault(pin);
    if (success) {
      setPin('');
    }
  };

  const handleKeyPress = (num) => {
    if (pin.length < 8) {
      setPin((prev) => prev + num);
      setPinError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setPinError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl p-6 flex flex-col items-center neon-glow-teal">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20">
          <Lock className="w-7 h-7 animate-pulse" />
        </div>

        <h3 className="font-mono font-bold text-white text-lg tracking-wider uppercase text-center">
          Master Vault Locked
        </h3>
        <p className="text-xs text-slate-400 text-center mt-1 mb-5">
          Enter your Master Passcode to unlock write and admin permissions
        </p>

        {/* PIN Input Display */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center mb-4">
          <div className="relative w-full max-w-xs flex items-center">
            <input
              type={showPin ? 'text' : 'password'}
              maxLength={8}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setPinError('');
              }}
              autoFocus
              placeholder="••••"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-2xl bg-slate-950 border border-slate-700 text-teal-300 focus:outline-none focus:border-teal-500 placeholder-slate-600 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 p-1 text-slate-400 hover:text-slate-200"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {pinError && (
            <div className="flex items-center space-x-1.5 text-xs text-rose-400 mt-2 font-mono">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{pinError}</span>
            </div>
          )}
        </form>

        {/* Cyberpad Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs my-2 font-mono text-sm">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleKeyPress(n.toString())}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition active:scale-95 border border-slate-700/50"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-medium transition active:scale-95 border border-slate-700/50"
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition active:scale-95 border border-slate-700/50"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold transition active:scale-95 shadow-md shadow-teal-500/20 flex items-center justify-center"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>

        {/* Default hint for user */}
        <p className="text-[11px] text-slate-500 mt-4 font-mono text-center">
          Default Master PIN: <strong className="text-teal-400">2026</strong> (Change in Settings)
        </p>
      </div>
    </div>
  );
}
