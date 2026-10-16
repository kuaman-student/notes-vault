import React, { useState, useEffect } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { useNotes } from '../../context/NotesContext';
import { FirebaseService } from '../../services/firebaseService';
import {
  Sliders,
  X,
  Plus,
  FolderPlus,
  Upload,
  Globe,
  Download,
  KeyRound,
  Cloud,
  Check,
  Copy,
  Lock,
  FileText,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Eye,
  User,
  Inbox
} from 'lucide-react';

export default function AdminStudioModal({ isOpen, onClose }) {
  const { lockVault, updatePasscode } = useSecurity();
  const {
    notes,
    folders,
    categories,
    saveNote,
    setIsEditorOpen,
    setEditingNote,
    setIsFolderModalOpen,
    setIsUploadOpen,
    exportAllJSON,
    syncCloudData
  } = useNotes();

  const [activeTab, setActiveTab] = useState('actions'); // 'actions' | 'approvals' | 'github' | 'security' | 'cloud'
  
  // Community Pending Notes Approval State
  const [pendingNotes, setPendingNotes] = useState([]);
  const [approvingNoteId, setApprovingNoteId] = useState(null);
  const [expandedPreviewId, setExpandedPreviewId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = FirebaseService.subscribeToPendingNotes((notesList) => {
      setPendingNotes(notesList || []);
    });
    return () => unsubscribe();
  }, [isOpen]);

  const handleApprove = async (noteId) => {
    setApprovingNoteId(noteId);
    try {
      await FirebaseService.approveNote(noteId);
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      setApprovingNoteId(null);
    }
  };

  const handleReject = async (noteId) => {
    if (!window.confirm('Are you sure you want to discard this community submission?')) return;
    try {
      await FirebaseService.rejectNote(noteId);
    } catch (err) {
      console.error('Reject error:', err);
    }
  };

  // GitHub URL Importer State
  const [githubUrl, setGithubUrl] = useState('');
  const [importCategory, setImportCategory] = useState('General');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [importMsg, setImportMsg] = useState(null);

  // Passcode state
  const [oldPasscode, setOldPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeMsg, setPasscodeMsg] = useState(null);

  // Cloud sync state
  const [syncStatus, setSyncStatus] = useState('idle');

  if (!isOpen) return null;

  // Import from GitHub Raw URL
  const handleImportGithubUrl = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) {
      setImportMsg({ type: 'error', text: 'Please enter a valid raw markdown URL.' });
      return;
    }

    // Convert github.com blob URL to raw.githubusercontent.com if needed
    let cleanUrl = githubUrl.trim();
    if (cleanUrl.includes('github.com') && cleanUrl.includes('/blob/')) {
      cleanUrl = cleanUrl
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/');
    }

    setIsFetchingUrl(true);
    setImportMsg(null);

    try {
      const res = await fetch(cleanUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch (${res.status} ${res.statusText})`);
      }
      const markdownContent = await res.text();

      // Extract title from URL filename or first H1
      const filename = cleanUrl.split('/').pop().replace(/\.md$/, '').replace(/[-_]/g, ' ');
      const h1Match = markdownContent.match(/^#\s+(.+)$/m);
      const title = h1Match ? h1Match[1].trim() : filename || 'Imported Note';

      const newNote = {
        id: `note-${Date.now()}`,
        title,
        content: markdownContent,
        category: importCategory || 'General',
        tags: ['GitHub-Import'],
        revisionStatus: 'need_revision',
        isBookmarked: false,
        lastUpdated: new Date().toISOString().slice(0, 10),
        readTime: `${Math.max(1, Math.ceil(markdownContent.split(/\s+/).length / 200))} min read`
      };

      await saveNote(newNote);
      setImportMsg({ type: 'success', text: `Successfully imported "${title}"!` });
      setGithubUrl('');
    } catch (err) {
      setImportMsg({ type: 'error', text: `Import failed: ${err.message}` });
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Update Master Passcode
  const handleUpdatePasscode = async (e) => {
    e.preventDefault();
    const res = await updatePasscode(oldPasscode, newPasscode);
    if (res.success) {
      setPasscodeMsg({ type: 'success', text: 'Master Passcode updated successfully!' });
      setOldPasscode('');
      setNewPasscode('');
    } else {
      setPasscodeMsg({ type: 'error', text: res.error });
    }
  };

  const handleManualSync = async () => {
    setSyncStatus('syncing');
    try {
      await syncCloudData();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2500);
    } catch {
      setSyncStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-mono text-xs">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden neon-glow-teal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Sliders className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">Pro Admin Studio</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                  MASTER MODE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Authoring, GitHub Import, Cloud Sync, and Vault Security
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                lockVault();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition flex items-center space-x-1.5 text-xs"
              title="Lock Vault Now"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Vault</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex space-x-2 px-6 pt-4 border-b border-slate-800 bg-slate-950/40">
          {[
            { id: 'actions', label: '⚡ Studio Actions' },
            { id: 'approvals', label: `📥 Approvals (${pendingNotes.length})`, count: pendingNotes.length },
            { id: 'github', label: '🌐 GitHub Raw Importer' },
            { id: 'cloud', label: '☁️ Cloud Sync' },
            { id: 'security', label: '🔐 Security Passcode' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-t-xl transition text-xs font-semibold flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-teal-400 border-t-2 border-teal-500 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Tab: Community Notes Approvals Queue */}
        {activeTab === 'approvals' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">Community Submissions Queue</h4>
                <p className="text-[11px] text-slate-400">
                  Review notes submitted by students before they appear publicly in the vault.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold border border-teal-500/30">
                {pendingNotes.length} Pending
              </span>
            </div>

            {pendingNotes.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-teal-400" />
                </div>
                <h5 className="font-bold text-white text-sm">Queue is Clear!</h5>
                <p className="text-slate-400 text-xs max-w-sm">
                  There are no pending notes awaiting moderation. New student contributions will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            {note.category || 'General'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            By {note.authorName || 'Student'} • {new Date(note.submittedAt || note.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <h5 className="font-bold text-white text-sm mt-1.5">{note.title}</h5>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => setExpandedPreviewId(expandedPreviewId === note.id ? null : note.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{expandedPreviewId === note.id ? 'Hide' : 'Preview'}</span>
                        </button>

                        <button
                          onClick={() => handleReject(note.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs flex items-center space-x-1 transition"
                          title="Reject and delete submission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => handleApprove(note.id)}
                          disabled={approvingNoteId === note.id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1 shadow transition disabled:opacity-50"
                          title="Approve and publish publicly"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{approvingNoteId === note.id ? 'Publishing...' : 'Approve'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Expandable Preview */}
                    {expandedPreviewId === note.id && (
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Studio Actions */}
        {activeTab === 'actions' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* New Note */}
              <button
                onClick={() => {
                  setEditingNote({ title: '', content: '# New Note\n\n' });
                  setIsEditorOpen(true);
                  onClose();
                }}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-800/40 text-left transition group flex items-start space-x-3"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Live Markdown Editor</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Create notes with side-by-side live preview & math formulas.
                  </p>
                </div>
              </button>

              {/* New Branch / Folder */}
              <button
                onClick={() => {
                  setIsFolderModalOpen(true);
                  onClose();
                }}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 text-left transition group flex items-start space-x-3"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Create Branch / Folder</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Add unlimited nested folders (B.Tech, Subject, Topic).
                  </p>
                </div>
              </button>

              {/* Upload Markdown or JSON */}
              <button
                onClick={() => {
                  setIsUploadOpen(true);
                  onClose();
                }}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/40 text-left transition group flex items-start space-x-3"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Drag & Drop Upload</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Import multiple .md or .json files instantly.
                  </p>
                </div>
              </button>

              {/* 1-Click Export notes-data.json */}
              <button
                onClick={exportAllJSON}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 text-left transition group flex items-start space-x-3"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">1-Click JSON Backup</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Download full notes-data.json to commit directly to GitHub.
                  </p>
                </div>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-center">
              <div>
                <span className="text-slate-400 text-[10px] block">TOTAL NOTES</span>
                <span className="text-lg font-bold text-white">{notes.length}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">BRANCHES</span>
                <span className="text-lg font-bold text-teal-400">{folders.length}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">CATEGORIES</span>
                <span className="text-lg font-bold text-purple-400">{categories.length}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">SECURITY</span>
                <span className="text-lg font-bold text-emerald-400">SHA-256</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: GitHub Raw Importer */}
        {activeTab === 'github' && (
          <form onSubmit={handleImportGithubUrl} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              <h4 className="font-bold flex items-center space-x-1.5 mb-1">
                <Globe className="w-4 h-4" />
                <span>Import Any GitHub Markdown Note</span>
              </h4>
              <p className="text-[11px] leading-relaxed">
                Paste any raw GitHub URL (or regular GitHub file URL) ending in <code className="text-teal-300">.md</code>. The studio will fetch, format, and save it directly into your vault!
              </p>
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 font-bold">GitHub File or Raw URL:</label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://raw.githubusercontent.com/owner/repo/main/notes/Sample.md"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 font-bold">Assign Category:</label>
              <select
                value={importCategory}
                onChange={(e) => setImportCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-teal-500 text-xs"
              >
                <option value="General">General</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {importMsg && (
              <p
                className={`text-xs p-2 rounded-lg ${
                  importMsg.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {importMsg.text}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isFetchingUrl}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold transition flex items-center space-x-2 disabled:opacity-50"
              >
                {isFetchingUrl ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
                <span>Fetch & Add to Vault</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Cloud Sync */}
        {activeTab === 'cloud' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">Firebase Firestore Connection</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Project: <strong className="text-teal-400">notes-vault-dfc48</strong>
                </p>
              </div>
              <button
                onClick={handleManualSync}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold transition flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>{syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'success' ? 'Synced! 🟢' : 'Sync Now'}</span>
              </button>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Every note, quiz, and folder created in Admin Mode automatically replicates to Firestore and IndexedDB. Visitors on GitHub Pages read from this cloud database in high-speed Read-Only mode.
            </p>
          </div>
        )}

        {/* Tab 4: Passcode Security */}
        {activeTab === 'security' && (
          <form onSubmit={handleUpdatePasscode} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              <h4 className="font-bold flex items-center space-x-1.5 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>SHA-256 Passcode Protection</span>
              </h4>
              <p className="text-[11px] leading-relaxed">
                Your passcode is never stored in plain text. It is cryptographically hashed with SHA-256 so even if someone views the source code, they cannot read your password.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">Current Passcode:</label>
                <input
                  type="password"
                  value={oldPasscode}
                  onChange={(e) => setOldPasscode(e.target.value)}
                  placeholder="Current passcode"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">New Passcode:</label>
                <input
                  type="password"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>
            </div>

            {passcodeMsg && (
              <p
                className={`text-xs p-2 rounded-lg ${
                  passcodeMsg.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {passcodeMsg.text}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold transition flex items-center space-x-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Update Passcode Hash</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
