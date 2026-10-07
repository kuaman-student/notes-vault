import React, { useState, useEffect } from 'react';
import { useNotes } from '../../context/NotesContext';
import { useSecurity } from '../../context/SecurityContext';
import { StorageService } from '../../services/storageService';
import MarkdownRenderer from './MarkdownRenderer';
import TableOfContents from './TableOfContents';
import ZenReaderModal from './ZenReaderModal';
import FlashcardsModal from './FlashcardsModal';
import {
  Clock,
  Bookmark,
  Sparkles,
  Maximize2,
  Volume2,
  VolumeX,
  Printer,
  Download,
  Edit3,
  Trash2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Share2,
  Calendar,
  Bot,
  ChevronRight,
  Folder
} from 'lucide-react';

export default function NoteReader() {
  const {
    activeNote,
    notes,
    setSelectedNoteId,
    toggleBookmark,
    updateRevisionStatus,
    deleteNote,
    setEditingNote,
    setIsEditorOpen,
    isZenMode,
    setIsZenMode,
    isFlashcardsOpen,
    setIsFlashcardsOpen,
    setIsAICopilotOpen,
    getFolderPath,
    setSelectedFolderId,
    setSidebarViewMode,
    setIsFolderModalOpen,
    setIsUploadOpen
  } = useNotes();

  const { requireAuth } = useSecurity();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Stop speech if note changes
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [activeNote?.id]);

  if (!activeNote) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center min-h-[75vh] animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-teal-500/20 to-indigo-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-6 neon-glow-teal">
          <Sparkles className="w-10 h-10 animate-pulse" />
        </div>
        
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Your Clean Canvas is Ready 🚀
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-lg text-sm sm:text-base leading-relaxed">
          All default notes have been removed. You have complete freedom to manually add your subjects, nested branches, and notes!
        </p>

        {/* Quick Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-8 w-full max-w-xl text-left">
          {/* Action 1: Create Note */}
          <div
            onClick={() => {
              requireAuth(() => {
                setEditingNote({ title: '', content: '# ' });
                setIsEditorOpen(true);
              });
            }}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all shadow-sm group"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Edit3 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              + New Note
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Write a note from scratch in live Markdown.
            </p>
          </div>

          {/* Action 2: Create Folder */}
          <div
            onClick={() => {
              requireAuth(() => {
                setIsFolderModalOpen(true);
              });
            }}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all shadow-sm group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Folder className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              📁 New Branch
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Create a subject folder or subfolder.
            </p>
          </div>

          {/* Action 3: Upload Files */}
          <div
            onClick={() => {
              requireAuth(() => {
                setIsUploadOpen(true);
              });
            }}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all shadow-sm group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Download className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              📂 Upload .md
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Drag-and-drop existing Markdown files.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Text-to-speech toggle
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Clean markdown tags for natural speech
      const cleanText = activeNote.content
        .replace(/[#*`_>$\-]/g, '')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportMarkdown = () => {
    StorageService.exportAsMarkdown(activeNote);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${activeNote.title}"?`)) {
      deleteNote(activeNote.id);
    }
  };

  // Status colors & labels
  const statusConfig = {
    mastered: {
      label: 'Mastered',
      color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    },
    need_revision: {
      label: 'Need Revision',
      color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
    },
    in_progress: {
      label: 'In Progress',
      color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
    }
  };

  const currentStatus = statusConfig[activeNote.revisionStatus] || statusConfig.in_progress;

  // Next / Previous notes
  const currentIndex = notes.findIndex((n) => n.id === activeNote.id);
  const prevNote = currentIndex > 0 ? notes[currentIndex - 1] : null;
  const nextNote = currentIndex < notes.length - 1 ? notes[currentIndex + 1] : null;

  return (
    <div className="flex-1 flex w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Main Content Article */}
      <article className="flex-1 min-w-0 max-w-4xl">
        {/* Breadcrumb & Metadata Header */}
        <div className="pb-6 border-b border-slate-200 dark:border-slate-800/80">
          {/* Interactive Branch Breadcrumbs */}
          {activeNote.folderId && (
            <nav className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono mb-3 overflow-x-auto pb-1">
              {getFolderPath(activeNote.folderId).map((f, i, arr) => (
                <React.Fragment key={f.id}>
                  <button
                    onClick={() => {
                      setSelectedFolderId(f.id);
                      setSidebarViewMode('tree');
                    }}
                    className="hover:text-teal-400 transition flex items-center space-x-1 shrink-0"
                  >
                    <span>{f.icon || '📁'}</span>
                    <span className="font-semibold uppercase tracking-wider text-[11px]">{f.name}</span>
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                </React.Fragment>
              ))}
              <span className="text-slate-200 truncate font-medium">{activeNote.title}</span>
            </nav>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            {/* Category & Status Badges */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                {activeNote.category}
              </span>

              {/* Revision status dropdown */}
              <select
                value={activeNote.revisionStatus || 'need_revision'}
                onChange={(e) => updateRevisionStatus(activeNote.id, e.target.value)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer outline-none bg-transparent ${currentStatus.color}`}
              >
                <option value="need_revision" className="bg-slate-900 text-slate-200">
                  ⚠️ Need Revision
                </option>
                <option value="in_progress" className="bg-slate-900 text-slate-200">
                  🔄 In Progress
                </option>
                <option value="mastered" className="bg-slate-900 text-slate-200">
                  ✅ Mastered
                </option>
              </select>

              {activeNote.difficulty && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {activeNote.difficulty}
                </span>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2 no-print">
              {/* AI Copilot */}
              <button
                onClick={() => setIsAICopilotOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-500/15 to-teal-500/15 hover:from-purple-500/25 hover:to-teal-500/25 text-purple-600 dark:text-purple-300 border border-purple-500/30 transition-all shadow-sm"
                title="AI Study Copilot"
              >
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">AI Copilot</span>
              </button>

              {/* Flashcard revision */}
              <button
                onClick={() => setIsFlashcardsOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-500/10 to-indigo-500/10 hover:from-teal-500/20 hover:to-indigo-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/20 transition-all shadow-sm"
                title="Practice Flashcards"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                <span className="hidden sm:inline">Flashcards</span>
              </button>

              {/* Zen Mode */}
              <button
                onClick={() => setIsZenMode(true)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Zen Focus Mode"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Text-to-speech */}
              <button
                onClick={toggleSpeech}
                className={`p-2 rounded-xl transition ${
                  isSpeaking
                    ? 'bg-teal-500/20 text-teal-500'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isSpeaking ? 'Stop Audio' : 'Listen to Note (TTS)'}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Bookmark Toggle */}
              <button
                onClick={() => toggleBookmark(activeNote.id)}
                className={`p-2 rounded-xl transition ${
                  activeNote.isBookmarked
                    ? 'text-amber-500 bg-amber-500/15'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={activeNote.isBookmarked ? 'Remove Bookmark' : 'Bookmark Note'}
              >
                <Bookmark className="w-4 h-4" fill={activeNote.isBookmarked ? 'currentColor' : 'none'} />
              </button>

              {/* Edit Note */}
              <button
                onClick={() => {
                  requireAuth(() => {
                    setEditingNote(activeNote);
                    setIsEditorOpen(true);
                  });
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Edit Note"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {/* Export Markdown */}
              <button
                onClick={handleExportMarkdown}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Download as .md"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Print / PDF */}
              <button
                onClick={handlePrint}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Print or Save PDF"
              >
                <Printer className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                onClick={() => {
                  requireAuth(() => {
                    if (confirm(`Are you sure you want to delete "${activeNote.title}"?`)) {
                      deleteNote(activeNote.id);
                    }
                  });
                }}
                className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition"
                title="Delete Note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reading Time & Date Info */}
          <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-teal-500" />
              <span>{activeNote.readTime || '5 min read'}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Updated {activeNote.lastUpdated || 'Recently'}</span>
            </span>
          </div>

          {/* Tags */}
          {activeNote.tags && activeNote.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {activeNote.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-xs font-mono bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Note Body (Markdown Content) */}
        <div className="py-6">
          <MarkdownRenderer content={activeNote.content} />
        </div>

        {/* Previous & Next Navigation */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
          {prevNote ? (
            <button
              onClick={() => setSelectedNoteId(prevNote.id)}
              className="group flex flex-col items-start p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition max-w-[45%]"
            >
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">← Previous</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-500 truncate">
                {prevNote.title}
              </span>
            </button>
          ) : (
            <div />
          )}

          {nextNote ? (
            <button
              onClick={() => setSelectedNoteId(nextNote.id)}
              className="group flex flex-col items-end p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition max-w-[45%]"
            >
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Next →</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-500 truncate">
                {nextNote.title}
              </span>
            </button>
          ) : (
            <div />
          )}
        </div>
      </article>

      {/* Table of Contents Floating Right Sidebar */}
      <TableOfContents content={activeNote.content} />

      {/* Zen Mode Modal */}
      <ZenReaderModal
        note={activeNote}
        isOpen={isZenMode}
        onClose={() => setIsZenMode(false)}
      />

      {/* Flashcards Modal */}
      <FlashcardsModal
        note={activeNote}
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
      />
    </div>
  );
}
