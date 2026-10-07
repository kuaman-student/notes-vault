import React from 'react';
import { useNotes } from '../../context/NotesContext';
import { useTheme } from '../../context/ThemeContext';
import { useSecurity } from '../../context/SecurityContext';
import {
  Search,
  Plus,
  Upload,
  Sun,
  Moon,
  Database,
  Menu,
  Sparkles,
  BookMarked,
  Network,
  Timer,
  Edit3,
  Terminal,
  Zap,
  Cloud,
  Lock,
  Unlock,
  RefreshCw,
  Brain
} from 'lucide-react';

export default function Header({ isMobileSidebarOpen, setIsMobileSidebarOpen }) {
  const {
    setIsSearchOpen,
    setIsEditorOpen,
    setEditingNote,
    setIsUploadOpen,
    setIsDatabaseModalOpen,
    setIsGraphOpen,
    setIsPomodoroOpen,
    isScratchpadOpen,
    setIsScratchpadOpen,
    cloudSyncStatus,
    setIsCloudSyncOpen,
    isQuizModalOpen,
    setIsQuizModalOpen,
    quizzes,
    notes
  } = useNotes();

  const { isUnlocked, lockVault, setIsPinModalOpen, requireAuth } = useSecurity();
  const { theme, cycleTheme } = useTheme();

  const handleCreateNew = () => {
    requireAuth(() => {
      setEditingNote(null);
      setIsEditorOpen(true);
    });
  };

  const themeIcons = {
    dark: <Moon className="w-4 h-4 text-indigo-400" />,
    cyberpunk: <Zap className="w-4 h-4 text-purple-400 animate-pulse" />,
    matrix: <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />,
    light: <Sun className="w-4 h-4 text-amber-500" />
  };

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 backdrop-blur-xl bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-xl lg:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Nexus<span className="text-teal-500">Notes</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  v2.0
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-slate-400 font-medium">
                Futuristic Personal Knowledge Base
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search Trigger (Command Palette style) */}
        <div className="flex-1 max-w-sm mx-2">
          <button
            id="search-trigger-btn"
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition text-xs shadow-inner"
          >
            <div className="flex items-center space-x-2 truncate">
              <Search className="w-4 h-4 text-teal-500 shrink-0" />
              <span className="truncate">Search notes, tags...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Futuristic Tools & Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Live Firebase Cloud Sync Pill */}
          <button
            onClick={() => setIsCloudSyncOpen(true)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono border transition shrink-0 ${
              cloudSyncStatus === 'synced'
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : cloudSyncStatus === 'syncing' || cloudSyncStatus === 'connecting'
                ? 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border-teal-500/30'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
            title={`Firebase Status: ${cloudSyncStatus.toUpperCase()} (Click to open Cloud settings)`}
          >
            {cloudSyncStatus === 'synced' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : cloudSyncStatus === 'syncing' || cloudSyncStatus === 'connecting' ? (
              <RefreshCw className="w-3.5 h-3.5 text-teal-400 animate-spin" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden md:inline">
              {cloudSyncStatus === 'synced'
                ? 'Cloud Synced'
                : cloudSyncStatus === 'syncing'
                ? 'Syncing...'
                : 'Local / Offline'}
            </span>
          </button>

          {/* Master Vault Lock / Unlock Guard Toggle */}
          {isUnlocked ? (
            <button
              onClick={lockVault}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-mono bg-teal-500/10 hover:bg-rose-500/15 text-teal-400 hover:text-rose-400 border border-teal-500/30 hover:border-rose-500/30 transition shrink-0"
              title="Vault Unlocked (Admin Mode) - Click to Lock into Read-Only Mode"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Admin Mode</span>
            </button>
          ) : (
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-mono bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition shrink-0 animate-pulse"
              title="Vault Locked (Read-Only Mode) - Click to Unlock with Master PIN"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Read-Only</span>
            </button>
          )}

          {/* Neural Quiz Arena Button */}
          <button
            onClick={() => setIsQuizModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-gradient-to-r from-purple-500/15 to-teal-500/15 hover:from-purple-500/25 hover:to-teal-500/25 text-purple-300 hover:text-white border border-purple-500/30 transition shrink-0 shadow-sm"
            title="Neural Quiz Arena (Generate & Take Tests)"
          >
            <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline font-bold">Quiz Arena</span>
            {quizzes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-bold">
                {quizzes.length}
              </span>
            )}
          </button>

          {/* Cosmic Knowledge Graph HUD */}
          <button
            onClick={() => setIsGraphOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-mono bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 transition shrink-0"
            title="Cosmic Knowledge Graph"
          >
            <Network className="w-4 h-4 text-teal-400 animate-pulse" />
            <span className="hidden lg:inline">Graph</span>
          </button>

          {/* Neural Pomodoro Timer */}
          <button
            onClick={() => setIsPomodoroOpen(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-teal-400 dark:text-slate-400 dark:hover:text-teal-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            title="Pomodoro Focus Timer"
          >
            <Timer className="w-4 h-4" />
          </button>

          {/* Quick Scratchpad HUD */}
          <button
            onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
            className={`p-2 rounded-xl transition shrink-0 ${
              isScratchpadOpen
                ? 'bg-teal-500/20 text-teal-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle Quick Scratchpad"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Quick Create Note */}
          <button
            onClick={handleCreateNew}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20 transition shrink-0"
            title="Create New Note"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">New Note</span>
          </button>

          {/* Upload */}
          <button
            onClick={() => requireAuth(() => setIsUploadOpen(true))}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            title="Upload Markdown or JSON"
          >
            <Upload className="w-4 h-4 text-teal-500" />
          </button>

          {/* Storage Settings */}
          <button
            onClick={() => setIsDatabaseModalOpen(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            title="Database & Storage Settings"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Futuristic Theme Cycler */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0"
            title={`Current Theme: ${theme.toUpperCase()} (Click to cycle)`}
          >
            {themeIcons[theme] || themeIcons.dark}
          </button>
        </div>
      </div>
    </header>
  );
}
