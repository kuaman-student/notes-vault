import React, { useMemo } from 'react';
import { useNotes } from '../../context/NotesContext';
import { useSecurity } from '../../context/SecurityContext';
import {
  Brain,
  Sparkles,
  BookMarked,
  Clock,
  CheckCircle2,
  Folder,
  Tag,
  Star,
  Zap,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Search,
  Plus,
  Network,
  Timer
} from 'lucide-react';

export default function DashboardHome() {
  const {
    notes,
    folders,
    categories,
    quizzes,
    allTags,
    setSelectedNoteId,
    setIsSearchOpen,
    setIsQuizModalOpen,
    setIsFlashcardsOpen,
    setIsPomodoroOpen,
    setIsGraphOpen,
    noteChecklists,
    lastViewedNoteId,
    setSearchQuery
  } = useNotes();

  const { isUnlocked, requireAuth } = useSecurity();

  // Dynamic time greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Today formatted
  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Starred / Bookmarked notes
  const starredNotes = useMemo(() => {
    return notes.filter((n) => n.isBookmarked);
  }, [notes]);

  // Recent notes (sorted by last updated or slice)
  const recentNotes = useMemo(() => {
    return [...notes].slice(0, 6);
  }, [notes]);

  // Quick Resume Note
  const resumeNote = useMemo(() => {
    if (lastViewedNoteId) {
      const found = notes.find((n) => n.id === lastViewedNoteId);
      if (found) return found;
    }
    return starredNotes[0] || notes[0] || null;
  }, [notes, lastViewedNoteId, starredNotes]);

  // Total checklist tasks completed
  const totalChecklistsCompleted = useMemo(() => {
    let completed = 0;
    Object.values(noteChecklists || {}).forEach((noteList) => {
      Object.values(noteList || {}).forEach((isDone) => {
        if (isDone) completed++;
      });
    });
    return completed;
  }, [noteChecklists]);

  // Quiz average accuracy
  const quizAccuracy = useMemo(() => {
    if (!quizzes || quizzes.length === 0) return 0;
    const totalPercentage = quizzes.reduce((acc, q) => acc + (q.percentage || 0), 0);
    return Math.round(totalPercentage / quizzes.length);
  }, [quizzes]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto animate-fade-in font-mono text-slate-100">
      {/* 1. Hero Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-teal-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs text-teal-400 font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span>{todayStr}</span>
              <span>•</span>
              <span className="text-slate-400 font-normal">Personal Knowledge Vault</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-300 to-indigo-300">Explorer</span> ✨
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl leading-relaxed">
              Your high-speed engineering documentation & placement vault. Review concepts, practice flashcards, and test recall with zero friction.
            </p>
          </div>

          {/* Quick Hub Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsQuizModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition flex items-center space-x-2"
            >
              <Brain className="w-4 h-4 text-purple-200" />
              <span>Quiz Arena</span>
            </button>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center space-x-2"
            >
              <Search className="w-4 h-4 text-teal-400" />
              <span>Search (Ctrl+K)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-teal-500/40 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold">TOTAL NOTES</span>
            <BookMarked className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{notes.length}</div>
          <span className="text-[10px] text-slate-500">Across {folders.length} branches</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold">BRANCHES / FOLDERS</span>
            <Folder className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-300">{folders.length}</div>
          <span className="text-[10px] text-slate-500">Subject-wise structure</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold">TASKS COMPLETED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-300">{totalChecklistsCompleted}</div>
          <span className="text-[10px] text-slate-500">Interactive checklist items</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-purple-500/40 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold">QUIZ ACCURACY</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-300">
            {quizzes.length > 0 ? `${quizAccuracy}%` : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-500">{quizzes.length} tests completed</span>
        </div>
      </div>

      {/* 3. Hero Card: Quick Resume Learning */}
      {resumeNote && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                ⚡ QUICK RESUME
              </span>
              <span className="text-xs text-slate-400">{resumeNote.category}</span>
              <span>•</span>
              <span className="text-xs text-slate-500">{resumeNote.readTime || '5 min read'}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {resumeNote.title}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              {resumeNote.summary || resumeNote.content?.slice(0, 140).replace(/[#*`_>]/g, '')}
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedNoteId(resumeNote.id);
              window.location.hash = `note=${resumeNote.id}`;
            }}
            className="px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs transition flex items-center justify-center space-x-2 shrink-0 shadow-lg shadow-teal-500/20"
          >
            <span>Resume Reading</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Starred / Pinned High-Yield Notes Grid */}
      {starredNotes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Starred & High-Yield Notes</span>
            </h3>
            <span className="text-xs text-slate-500">{starredNotes.length} pinned</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {starredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNoteId(note.id);
                  window.location.hash = `note=${note.id}`;
                }}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-400/50 hover:bg-slate-800/40 cursor-pointer transition shadow-sm group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {note.category}
                  </span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-amber-300 transition">
                  {note.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {note.summary || note.content?.slice(0, 100).replace(/[#*`_>]/g, '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Recently Added & Updated Notes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>Recent Notes</span>
          </h3>
          <span className="text-xs text-slate-500">{notes.length} total in vault</span>
        </div>

        {notes.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center text-slate-400">
            <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-30 text-teal-400" />
            <h4 className="font-bold text-white text-sm">Your Knowledge Vault is Ready</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Unlock Admin Mode (<kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-teal-300">Ctrl+Shift+L</kbd>) to add your own Markdown notes, upload files, or import from GitHub!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNoteId(note.id);
                  window.location.hash = `note=${note.id}`;
                }}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-800/40 cursor-pointer transition shadow-sm group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    {note.category}
                  </span>
                  <span className="text-[10px] text-slate-500">{note.readTime || '5m'}</span>
                </div>
                <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-teal-300 transition">
                  {note.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {note.summary || note.content?.slice(0, 100).replace(/[#*`_>]/g, '')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Interactive Tag Cloud */}
      {allTags.length > 0 && (
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase">
            <Tag className="w-3.5 h-3.5 text-teal-400" />
            <span>Tag Explorer</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchQuery(tag);
                  setIsSearchOpen(true);
                }}
                className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 hover:bg-teal-500/10 text-xs text-slate-300 hover:text-teal-300 transition font-mono"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
