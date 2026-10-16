import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotes } from '../../context/NotesContext';
import { FirebaseService } from '../../services/firebaseService';
import MarkdownRenderer from './MarkdownRenderer';
import confetti from 'canvas-confetti';
import {
  Share2,
  X,
  FileText,
  Tag,
  Folder,
  Send,
  Eye,
  Edit,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Lock
} from 'lucide-react';

export default function ContributeNoteModal({ isOpen, onClose }) {
  const { user, isLoggedIn, openAuthModal } = useAuth();
  const { folders } = useNotes();

  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [content, setContent] = useState('');
  const [previewTab, setPreviewTab] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Please provide a title and note content.');
      return;
    }

    if (!isLoggedIn) {
      openAuthModal('login');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const targetFolder = folders.find((f) => f.id === folderId);

      const payload = {
        title: title.trim(),
        content: content.trim(),
        folderId: folderId || null,
        category: targetFolder ? targetFolder.name : 'General',
        tags: tags.length > 0 ? tags : ['Community'],
        readTime: `${Math.max(1, Math.ceil(content.split(/\s+/).length / 200))} min read`
      };

      await FirebaseService.submitNoteContribution(payload, user);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setTitle('');
        setContent('');
        setTagsInput('');
        onClose();
      }, 2200);
    } catch (err) {
      console.error('Failed to submit contribution:', err);
      setErrorMsg(err.message || 'Failed to submit note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-teal-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Share2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Contribute a Study Note</h3>
              <p className="text-xs text-slate-400">
                Share your knowledge with the placement & engineering community
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Splash */}
        {isSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-white">Contribution Submitted!</h4>
            <p className="text-sm text-slate-300 max-w-md">
              Thank you! Your note has been queued for Vault Admin review. Once approved, it will go live for everyone.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            {/* Moderation Notice Banner */}
            <div className="px-6 py-2.5 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center space-x-2 text-xs text-indigo-300 shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>Community Protocol:</strong> All submitted notes are reviewed by Admin before publishing to prevent spam and maintain high placement quality.
              </span>
            </div>

            {/* Form Fields */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Note Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master OpenCV Image Transformations & Kernel Math"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-sm outline-none transition"
                  required
                />
              </div>

              {/* Target Folder & Tags (Clean & matching Admin Editor) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Folder / Branch
                  </label>
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs outline-none transition"
                  >
                    <option value="">📁 Root / Unfiled</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.parentId ? '↳ 📂 ' : '📁 '} {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. opencv, python, placement"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs outline-none transition"
                  />
                </div>
              </div>

              {/* Markdown Content & Preview Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Note Content (Markdown supported) *
                  </label>
                  <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPreviewTab(false)}
                      className={`px-2.5 py-1 rounded-md transition flex items-center space-x-1 ${
                        !previewTab ? 'bg-teal-500/20 text-teal-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <Edit className="w-3 h-3" />
                      <span>Write</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab(true)}
                      className={`px-2.5 py-1 rounded-md transition flex items-center space-x-1 ${
                        previewTab ? 'bg-teal-500/20 text-teal-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>

                {!previewTab ? (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    placeholder={`# Your Title\n\n## Overview\nExplain key concepts clearly...\n\n\`\`\`python\ndef solution():\n    pass\n\`\`\`\n\n> 💡 Tip: Add key takeaways for your peers!`}
                    className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 font-mono text-xs outline-none resize-none leading-relaxed transition"
                    required
                  />
                ) : (
                  <div className="w-full min-h-[250px] max-h-[350px] overflow-y-auto p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100">
                    {content.trim() ? (
                      <MarkdownRenderer content={content} />
                    ) : (
                      <p className="text-slate-500 italic text-xs">Nothing to preview yet. Start typing!</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">
                Author: {user?.displayName || user?.email?.split('@')[0] || 'Guest'}
              </span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit for Review'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
