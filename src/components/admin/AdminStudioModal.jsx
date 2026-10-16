import React, { useState, useEffect, useMemo } from 'react';
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
  Inbox,
  BarChart3,
  MessageSquare,
  FolderTree,
  Activity,
  ShieldAlert,
  ExternalLink,
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
  CheckCheck
} from 'lucide-react';

export default function AdminStudioModal({ isOpen, onClose }) {
  const {
    lockVault,
    updatePasscode,
    securityAuditLogs,
    failedAttempts,
    maxAttempts,
    isLockedOut,
    lockoutSecondsLeft
  } = useSecurity();

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
    syncCloudData,
    setSelectedNoteId
  } = useNotes();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'actions' | 'approvals' | 'doubts' | 'github' | 'cloud' | 'security'
  
  // Community Pending Notes Approval State
  const [pendingNotes, setPendingNotes] = useState([]);
  const [approvingNoteId, setApprovingNoteId] = useState(null);
  const [expandedPreviewId, setExpandedPreviewId] = useState(null);

  // Doubts state
  const [allDoubts, setAllDoubts] = useState([]);
  const [resolvingDoubtId, setResolvingDoubtId] = useState(null);
  const [doubtsFilter, setDoubtsFilter] = useState('unresolved'); // 'all' | 'unresolved' | 'resolved'

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

  useEffect(() => {
    if (!isOpen) return;
    const unsubNotes = FirebaseService.subscribeToPendingNotes((notesList) => {
      setPendingNotes(notesList || []);
    });
    const unsubDoubts = FirebaseService.subscribeToAllDoubts((doubtsList) => {
      setAllDoubts(doubtsList || []);
    });
    return () => {
      unsubNotes();
      unsubDoubts();
    };
  }, [isOpen]);

  // Memoized Metrics
  const totalWords = useMemo(() => {
    return notes.reduce((sum, n) => {
      const words = (n.content || '').trim().split(/\s+/).filter(Boolean).length;
      return sum + words;
    }, 0);
  }, [notes]);

  const totalReadHours = useMemo(() => {
    return (totalWords / 200 / 60).toFixed(1);
  }, [totalWords]);

  const unresolvedDoubts = useMemo(() => {
    return allDoubts.filter((d) => !d.isResolved);
  }, [allDoubts]);

  const filteredDoubts = useMemo(() => {
    if (doubtsFilter === 'unresolved') return allDoubts.filter((d) => !d.isResolved);
    if (doubtsFilter === 'resolved') return allDoubts.filter((d) => d.isResolved);
    return allDoubts;
  }, [allDoubts, doubtsFilter]);

  // Root folder distribution
  const folderDistribution = useMemo(() => {
    const rootFolders = folders.filter((f) => !f.parentId);
    return rootFolders.map((rf) => {
      const getFolderIdsRecursive = (id) => {
        const children = folders.filter((f) => f.parentId === id);
        return [id, ...children.flatMap((c) => getFolderIdsRecursive(c.id))];
      };
      const allBranchIds = new Set(getFolderIdsRecursive(rf.id));
      const count = notes.filter((n) => allBranchIds.has(n.folderId)).length;
      return {
        id: rf.id,
        name: rf.name,
        icon: rf.icon || '📁',
        count,
        percent: notes.length > 0 ? Math.round((count / notes.length) * 100) : 0
      };
    }).sort((a, b) => b.count - a.count);
  }, [folders, notes]);

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

  const handleToggleResolveDoubt = async (doubt) => {
    setResolvingDoubtId(doubt.id);
    try {
      await FirebaseService.toggleResolveDoubt(doubt.id, doubt.isResolved);
    } catch (err) {
      console.error('Resolve error:', err);
    } finally {
      setResolvingDoubtId(null);
    }
  };

  // Import from GitHub Raw URL
  const handleImportGithubUrl = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) {
      setImportMsg({ type: 'error', text: 'Please enter a valid raw markdown URL.' });
      return;
    }

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-mono text-xs">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden neon-glow-teal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shadow-lg shadow-teal-500/10">
              <Sliders className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">Pro Admin Command Center</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold uppercase tracking-wider">
                  MASTER CONTROLLER
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Full telemetry, student doubts moderation, content publishing, and cyber defense
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                lockVault();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition flex items-center space-x-1.5 text-xs font-semibold"
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

        {/* Tab Navigation */}
        <div className="flex space-x-1.5 px-6 pt-3 border-b border-slate-800 bg-slate-950/50 overflow-x-auto">
          {[
            { id: 'dashboard', label: '📊 Command Center' },
            { id: 'actions', label: '⚡ Studio Actions' },
            { id: 'approvals', label: `📥 Submissions (${pendingNotes.length})`, count: pendingNotes.length },
            { id: 'doubts', label: `💬 Doubts Desk (${unresolvedDoubts.length})`, count: unresolvedDoubts.length },
            { id: 'github', label: '🌐 GitHub Importer' },
            { id: 'cloud', label: '☁️ Cloud Sync' },
            { id: 'security', label: '🔐 Cyber Defense' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-t-xl transition text-xs font-semibold flex items-center space-x-1.5 shrink-0 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-teal-400 border-t-2 border-teal-500 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: EXECUTIVE COMMAND CENTER DASHBOARD */}
        {/* ============================================================== */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Live System Ribbon */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-slate-950 to-indigo-950/40 border border-teal-500/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-white uppercase tracking-wider">System Status:</span>
                <span className="text-emerald-400 font-bold">ALL SYSTEMS OPERATIONAL & SECURE</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                <span className="flex items-center space-x-1 text-teal-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SHA-256 Armed</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1 text-indigo-300">
                  <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Firestore Replicated</span>
                </span>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Total Notes */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-teal-500/40 transition">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Notes</span>
                  <FileText className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-2xl font-extrabold text-white">{notes.length}</div>
                <p className="text-[10px] text-teal-400/80 mt-1 font-medium">
                  {categories.length} categories active
                </p>
              </div>

              {/* Total Folders */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 transition">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Branches & Topics</span>
                  <FolderTree className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-extrabold text-indigo-300">{folders.length}</div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  {folderDistribution.length} top-level branches
                </p>
              </div>

              {/* Total Content Volume */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/40 transition">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Content Volume</span>
                  <BookOpen className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-extrabold text-purple-300">{totalWords.toLocaleString()}</div>
                <p className="text-[10px] text-purple-400/80 mt-1 font-medium">
                  ~{totalReadHours} hours reading time
                </p>
              </div>

              {/* Doubts Desk */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Student Doubts</span>
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-extrabold text-amber-300">{unresolvedDoubts.length}</span>
                  <span className="text-[11px] text-slate-400">/ {allDoubts.length} total</span>
                </div>
                <p className="text-[10px] text-amber-400/90 mt-1 font-medium">
                  {unresolvedDoubts.length === 0 ? '✨ All doubts resolved!' : '⚠️ Needs admin attention'}
                </p>
              </div>
            </div>

            {/* Two-Column Command Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column: Branch Distribution & Fast Launchpad */}
              <div className="space-y-5">
                {/* Branch Distribution */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-teal-400" />
                      <span>Branch Note Distribution</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">{folderDistribution.length} Branches</span>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {folderDistribution.length === 0 ? (
                      <p className="text-slate-500 text-xs italic">No root folders found.</p>
                    ) : (
                      folderDistribution.map((item) => (
                        <div key={item.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-semibold flex items-center space-x-1.5 truncate">
                              <span>{item.icon}</span>
                              <span className="truncate">{item.name}</span>
                            </span>
                            <span className="text-teal-400 font-bold shrink-0 ml-2">
                              {item.count} notes ({item.percent}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(item.percent, 4)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Fast Launchpad */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>Quick Operations Launchpad</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => {
                        setEditingNote({ title: '', content: '# New Note\n\n' });
                        setIsEditorOpen(true);
                        onClose();
                      }}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-800 text-left transition flex items-center space-x-2.5 group"
                    >
                      <Plus className="w-4 h-4 text-teal-400 group-hover:scale-110 transition" />
                      <div>
                        <div className="font-bold text-white text-xs">New Note</div>
                        <div className="text-[10px] text-slate-400">Live Markdown</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsFolderModalOpen(true);
                        onClose();
                      }}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-left transition flex items-center space-x-2.5 group"
                    >
                      <FolderPlus className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
                      <div>
                        <div className="font-bold text-white text-xs">New Branch</div>
                        <div className="text-[10px] text-slate-400">Unlimited nesting</div>
                      </div>
                    </button>

                    <button
                      onClick={exportAllJSON}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 text-left transition flex items-center space-x-2.5 group"
                    >
                      <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                      <div>
                        <div className="font-bold text-white text-xs">JSON Backup</div>
                        <div className="text-[10px] text-slate-400">1-Click commit</div>
                      </div>
                    </button>

                    <button
                      onClick={handleManualSync}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-800 text-left transition flex items-center space-x-2.5 group"
                    >
                      <RefreshCw className={`w-4 h-4 text-teal-400 group-hover:scale-110 transition ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                      <div>
                        <div className="font-bold text-white text-xs">Cloud Replicate</div>
                        <div className="text-[10px] text-slate-400">Sync to Firestore</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Doubts Desk & Security Status */}
              <div className="space-y-5">
                {/* Recent Unresolved Doubts Desk */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span>Unresolved Doubts Desk</span>
                    </h4>
                    <button
                      onClick={() => setActiveTab('doubts')}
                      className="text-teal-400 hover:text-teal-300 text-[11px] font-semibold transition"
                    >
                      View All ({allDoubts.length}) →
                    </button>
                  </div>

                  {unresolvedDoubts.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <CheckCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <div className="font-bold text-white text-xs">Zero Pending Doubts</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        All student questions have been addressed and marked resolved!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {unresolvedDoubts.slice(0, 3).map((doubt) => (
                        <div
                          key={doubt.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-teal-300 text-[11px] truncate">
                              {doubt.userName || 'Student'} on "{doubt.noteTitle || 'Note'}"
                            </span>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {new Date(doubt.timestamp || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">
                            {doubt.question}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => {
                                if (doubt.noteId) {
                                  setSelectedNoteId(doubt.noteId);
                                  onClose();
                                }
                              }}
                              className="text-[11px] text-teal-400 hover:underline flex items-center space-x-1"
                            >
                              <span>Open Note Discussion</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleToggleResolveDoubt(doubt)}
                              disabled={resolvingDoubtId === doubt.id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{resolvingDoubtId === doubt.id ? 'Saving...' : 'Mark Resolved'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cybersecurity HUD & Recent Audit Logs */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-emerald-400" />
                      <span>Cyber Defense HUD</span>
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isLockedOut
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {isLockedOut ? `LOCKOUT ACTIVE (${lockoutSecondsLeft}s)` : 'DEFENSE ARMED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Failed Attempts</span>
                      <span className={`font-bold text-xs ${failedAttempts > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {failedAttempts} / {maxAttempts}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Encryption</span>
                      <span className="font-bold text-xs text-teal-300">SHA-256</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Rate-Limit</span>
                      <span className="font-bold text-xs text-indigo-300">Strict HUD</span>
                    </div>
                  </div>

                  {/* Recent Audit Trail Snippet */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Live Audit Logs (Last 3 Events)
                    </span>
                    {securityAuditLogs.length === 0 ? (
                      <p className="text-slate-500 text-[11px] italic">No security incidents logged.</p>
                    ) : (
                      securityAuditLogs.slice(0, 3).map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-900/80 border border-slate-800"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                log.severity === 'critical'
                                  ? 'bg-rose-500'
                                  : log.severity === 'warning'
                                  ? 'bg-amber-400'
                                  : log.severity === 'success'
                                  ? 'bg-emerald-400'
                                  : 'bg-teal-400'
                              }`}
                            />
                            <span className="font-bold text-white truncate">{log.event}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0 ml-2 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: STUDIO ACTIONS */}
        {/* ============================================================== */}
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
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: COMMUNITY NOTES APPROVALS QUEUE */}
        {/* ============================================================== */}
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

        {/* ============================================================== */}
        {/* TAB 4: DOUBTS MODERATION DESK */}
        {/* ============================================================== */}
        {activeTab === 'doubts' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-white text-sm">Doubts Moderation Desk</h4>
                <p className="text-[11px] text-slate-400">
                  Track and answer queries asked by students across all notes.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { id: 'unresolved', label: `Pending (${unresolvedDoubts.length})` },
                  { id: 'resolved', label: 'Resolved' },
                  { id: 'all', label: `All (${allDoubts.length})` }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setDoubtsFilter(f.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      doubtsFilter === f.id
                        ? 'bg-teal-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredDoubts.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                <CheckCheck className="w-10 h-10 text-emerald-400" />
                <h5 className="font-bold text-white text-sm">No Doubts Found</h5>
                <p className="text-slate-400 text-xs">
                  {doubtsFilter === 'unresolved'
                    ? 'All student doubts have been successfully resolved!'
                    : 'No student discussions match the selected filter.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDoubts.map((doubt) => (
                  <div
                    key={doubt.id}
                    className={`p-4 rounded-2xl bg-slate-950 border transition flex flex-col space-y-2.5 ${
                      doubt.isResolved ? 'border-slate-800 opacity-80' : 'border-amber-500/40 bg-amber-500/[0.02]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            doubt.isResolved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {doubt.isResolved ? 'Resolved' : 'Pending'}
                          </span>
                          <span className="font-bold text-white text-xs">
                            {doubt.userName || 'Student'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            • {new Date(doubt.timestamp || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <h5 className="font-bold text-teal-300 text-xs mt-1">
                          On Note: {doubt.noteTitle || 'Unknown Note'}
                        </h5>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {doubt.noteId && (
                          <button
                            onClick={() => {
                              setSelectedNoteId(doubt.noteId);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 transition"
                            title="Open note in viewer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Jump to Note</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleResolveDoubt(doubt)}
                          disabled={resolvingDoubtId === doubt.id}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                            doubt.isResolved
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{doubt.isResolved ? 'Mark Pending' : 'Resolve'}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-200 text-xs leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      {doubt.question}
                    </p>

                    {doubt.replies && doubt.replies.length > 0 && (
                      <div className="text-[11px] text-slate-400 pl-2 border-l-2 border-teal-500/40">
                        💬 {doubt.replies.length} replies on this discussion
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: GITHUB RAW IMPORTER */}
        {/* ============================================================== */}
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

        {/* ============================================================== */}
        {/* TAB 6: CLOUD SYNC */}
        {/* ============================================================== */}
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

        {/* ============================================================== */}
        {/* TAB 7: PASSCODE SECURITY & CYBER DEFENSE LOGS */}
        {/* ============================================================== */}
        {activeTab === 'security' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <form onSubmit={handleUpdatePasscode} className="space-y-4">
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

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold transition flex items-center space-x-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Update Passcode Hash</span>
                </button>
              </div>
            </form>

            {/* Complete Cyber Defense Audit Log */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>Cyber Defense Security Audit Trail</span>
                </h4>
                <span className="text-[11px] text-slate-400">{securityAuditLogs.length} events logged</span>
              </div>

              {securityAuditLogs.length === 0 ? (
                <p className="text-slate-500 text-xs italic">No security events logged yet.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {securityAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              log.severity === 'critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : log.severity === 'warning'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : log.severity === 'success'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            }`}
                          >
                            {log.severity}
                          </span>
                          <span className="font-bold text-white">{log.event}</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
