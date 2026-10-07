import React, { useState } from 'react';
import { useNotes } from '../../context/NotesContext';
import { StorageService } from '../../services/storageService';
import { Database, Cloud, HardDrive, Download, Upload, RefreshCw, X, Check, ShieldCheck } from 'lucide-react';

export default function DatabaseConfigModal({ isOpen, onClose }) {
  const { notes, exportAllJSON, clearAllNotes } = useNotes();
  const [activeTab, setActiveTab] = useState('storage'); // 'storage', 'cloud', 'backup'
  const [settings, setSettings] = useState(() => StorageService.getSettings());
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    StorageService.saveSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to completely wipe all notes and branches? You will have an empty canvas to add your notes manually.')) {
      await clearAllNotes();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Database className="w-5 h-5 text-teal-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              Database & Cloud Sync Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2 my-4 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('storage')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'storage'
                ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Local Database (IndexedDB)</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'cloud'
                ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Firebase / Cloud</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'backup'
                ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>JSON Backup & Reset</span>
          </button>
        </div>

        {/* Tab 1: Local Storage (Default & Recommended) */}
        {activeTab === 'storage' && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-700 dark:text-teal-300">
              <div className="flex items-center space-x-2 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-teal-500" />
                <span>Zero Server Load Engine Active</span>
              </div>
              <p className="leading-relaxed">
                NexusNotes uses the browser's high-speed <strong>IndexedDB</strong> engine. All your Markdown notes, code snippets, and tags are cached asynchronously locally. This ensures <strong>instant (0ms) page loads</strong>, works 100% offline, and places zero strain on your hosting server!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Total Notes in DB</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{notes.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Storage Type</span>
                <span className="text-lg font-bold text-teal-500">IndexedDB + LocalStorage</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Firebase / Cloud Sync */}
        {activeTab === 'cloud' && (
          <div className="space-y-4 py-2 text-xs">
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 leading-relaxed">
              <p>
                Want to sync notes seamlessly between your phone and laptop? Enter your optional free Firebase Firestore project config below:
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Firebase API Key</label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={settings.firebaseConfig?.apiKey || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      firebaseConfig: { ...settings.firebaseConfig, apiKey: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Project ID</label>
                <input
                  type="text"
                  placeholder="my-notes-app-123"
                  value={settings.firebaseConfig?.projectId || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      firebaseConfig: { ...settings.firebaseConfig, projectId: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-medium shadow-md shadow-teal-500/20 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saveSuccess ? 'Saved!' : 'Save Config'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Backup & Reset */}
        {activeTab === 'backup' && (
          <div className="space-y-4 py-2 text-xs">
            <p className="text-slate-600 dark:text-slate-400">
              Easily export all notes as a JSON backup to keep your files safe or move them to another machine.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={exportAllJSON}
                className="flex items-center justify-center space-x-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition font-medium text-slate-800 dark:text-slate-200"
              >
                <Download className="w-4 h-4 text-teal-500" />
                <span>Export Notes to JSON</span>
              </button>

              <button
                onClick={handleClearAll}
                className="flex items-center justify-center space-x-2 p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Wipe Database (Start Fresh)</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
