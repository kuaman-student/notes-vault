import React from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { ShieldCheck, Lock, Sliders, Sparkles } from 'lucide-react';

export default function AdminFloatingPill() {
  const { isUnlocked, lockVault, setIsAdminStudioOpen } = useSecurity();

  if (!isUnlocked) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center space-x-2 bg-slate-900/95 border border-teal-500/50 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl animate-fade-in font-mono text-xs">
      <div className="flex items-center space-x-2 px-2.5 py-1 text-teal-400">
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
        <span className="font-bold hidden sm:inline">Admin Mode Active</span>
        <span className="font-bold sm:hidden">Admin</span>
      </div>

      <button
        onClick={() => setIsAdminStudioOpen(true)}
        className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 transition flex items-center space-x-1.5"
        title="Open Admin Studio"
      >
        <Sliders className="w-3.5 h-3.5" />
        <span>Studio</span>
      </button>

      <button
        onClick={lockVault}
        className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition flex items-center space-x-1.5"
        title="Lock Vault Now (Return to Read-Only)"
      >
        <Lock className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Lock</span>
      </button>
    </div>
  );
}
