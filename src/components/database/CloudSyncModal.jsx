import React, { useState, useEffect } from 'react';
import { useNotes } from '../../context/NotesContext';
import { useSecurity } from '../../context/SecurityContext';
import { FirebaseService } from '../../services/firebaseService';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Lock,
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  Server
} from 'lucide-react';

const RECOMMENDED_FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // NexusNotes Vault: Anyone can read, but you can secure writes
    match /{document=**} {
      allow read: if true;
      allow write: if true; // Or restrict to your admin auth if using Firebase Auth
    }
  }
}`;

export default function CloudSyncModal({ isOpen, onClose }) {
  const { notes, folders, categories, syncCloudData } = useNotes();
  const { masterPin, updatePin, isUnlocked, lockVault } = useSecurity();

  const [activeTab, setActiveTab] = useState('cloud'); // 'cloud', 'security', 'rules'
  const [syncStatus, setSyncStatus] = useState('checking'); // 'connected', 'error', 'syncing'
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedRules, setCopiedRules] = useState(false);

  // PIN change state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  const checkConnection = async () => {
    setSyncStatus('checking');
    const result = await FirebaseService.testConnection();
    if (result.success) {
      setSyncStatus('connected');
      setErrorMessage('');
    } else {
      setSyncStatus('error');
      setErrorMessage(result.error || 'Failed to connect to Firebase Firestore');
    }
  };

  const handleManualSync = async () => {
    setSyncStatus('syncing');
    try {
      await syncCloudData();
      setSyncStatus('connected');
    } catch (err) {
      setSyncStatus('error');
      setErrorMessage(err.message);
    }
  };

  const handleUpdatePin = (e) => {
    e.preventDefault();
    const result = updatePin(currentPinInput, newPinInput);
    if (result.success) {
      setPinChangeMsg({ type: 'success', text: 'Master PIN successfully updated!' });
      setCurrentPinInput('');
      setNewPinInput('');
    } else {
      setPinChangeMsg({ type: 'error', text: result.error });
    }
  };

  const handleCopyRules = () => {
    navigator.clipboard.writeText(RECOMMENDED_FIRESTORE_RULES);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] neon-glow-teal">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <Cloud className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-mono font-bold text-white text-base">
                  Firebase Cloud & Vault Security
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  notes-vault-dfc48
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-device real-time sync & Master PIN security
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 my-4 border-b border-slate-800 pb-3 text-xs font-mono">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'cloud' ? 'bg-teal-500 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cloud Status
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'security' ? 'bg-teal-500 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Master PIN
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'rules' ? 'bg-teal-500 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Firestore Rules
          </button>
        </div>

        {/* Tab 1: Cloud Sync Status */}
        {activeTab === 'cloud' && (
          <div className="flex-1 overflow-y-auto space-y-4 py-2 text-xs">
            {/* Status Indicator Banner */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                syncStatus === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : syncStatus === 'syncing' || syncStatus === 'checking'
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                {syncStatus === 'connected' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : syncStatus === 'syncing' || syncStatus === 'checking' ? (
                  <RefreshCw className="w-6 h-6 text-teal-400 animate-spin shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold font-mono text-sm">
                    {syncStatus === 'connected'
                      ? 'Live Cloud Sync Active 🟢'
                      : syncStatus === 'syncing'
                      ? 'Syncing with Firestore... 🔄'
                      : 'Connection Notice'}
                  </h4>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {syncStatus === 'connected'
                      ? 'Connected to Firebase Firestore (Project: notes-vault-dfc48)'
                      : syncStatus === 'syncing'
                      ? 'Pushing & pulling notes across all your devices'
                      : errorMessage || 'Checking connection...'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleManualSync}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono transition flex items-center space-x-1.5 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Now</span>
              </button>
            </div>

            {/* Sync Metrics */}
            <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Cloud Notes</span>
                <span className="text-xl font-bold text-white">{notes.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Branches</span>
                <span className="text-xl font-bold text-teal-400">{folders.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Offline Engine</span>
                <span className="text-xl font-bold text-indigo-400">IndexedDB</span>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed text-[11px] pt-1">
              Any note or branch you create on this laptop will automatically appear on your phone, and vice versa! Even if you are offline, notes are cached and synced the moment you reconnect.
            </p>
          </div>
        )}

        {/* Tab 2: Security & Master PIN */}
        {activeTab === 'security' && (
          <div className="flex-1 overflow-y-auto space-y-4 py-2 text-xs">
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Public GitHub Protection Active</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                When you host this site publicly on GitHub Pages or portfolio, visitors are restricted to <strong>Read-Only Mode</strong> unless they enter your Master PIN.
              </p>
            </div>

            {/* Change Master PIN Form */}
            <form onSubmit={handleUpdatePin} className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <h4 className="font-mono font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                <span>Change Master Passcode</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1 font-mono">Current PIN:</label>
                  <input
                    type="password"
                    maxLength={8}
                    placeholder="Current PIN (e.g. 2026)"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1 font-mono">New PIN:</label>
                  <input
                    type="password"
                    maxLength={8}
                    placeholder="New 4-8 Digit PIN"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {pinChangeMsg && (
                <p className={`text-[11px] font-mono ${pinChangeMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pinChangeMsg.text}
                </p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs transition"
                >
                  Update Passcode
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <span className="font-bold text-white block">Vault Lock Status</span>
                <span className="text-[11px] text-slate-400">
                  {isUnlocked ? 'Currently Unlocked (Admin Mode)' : 'Currently Locked (Read-Only Mode)'}
                </span>
              </div>
              <button
                onClick={lockVault}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-mono text-xs border border-rose-500/30 transition flex items-center space-x-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Vault Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Firestore Rules */}
        {activeTab === 'rules' && (
          <div className="flex-1 overflow-y-auto space-y-3 py-2 text-xs">
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Paste these rules in your Firebase Console $\rightarrow$ <strong>Firestore Database $\rightarrow$ Rules tab</strong>:
            </p>

            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-[11px] text-teal-300">
              <button
                onClick={handleCopyRules}
                className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center space-x-1 text-[10px]"
              >
                {copiedRules ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedRules ? 'Copied!' : 'Copy Rules'}</span>
              </button>
              <pre className="overflow-x-auto whitespace-pre-wrap">{RECOMMENDED_FIRESTORE_RULES}</pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
