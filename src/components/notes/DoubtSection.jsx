import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSecurity } from '../../context/SecurityContext';
import { FirebaseService } from '../../services/firebaseService';
import {
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Send,
  CornerDownRight,
  Code,
  ThumbsUp,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

export default function DoubtSection({ noteId, noteTitle }) {
  const { user, isLoggedIn, openAuthModal } = useAuth();
  const { isUnlocked } = useSecurity();

  const [doubts, setDoubts] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [activeReplyDoubtId, setActiveReplyDoubtId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [expandedDoubts, setExpandedDoubts] = useState({});

  // Subscribe to real-time doubts for this note
  useEffect(() => {
    if (!noteId) return;
    const unsubscribe = FirebaseService.subscribeToDoubts(noteId, (liveDoubts) => {
      setDoubts(liveDoubts || []);
    });
    return () => unsubscribe();
  }, [noteId]);

  const handlePostDoubt = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    if (!isLoggedIn && !isUnlocked) {
      openAuthModal('login');
      return;
    }

    setIsPosting(true);
    try {
      const authorName = user?.displayName || user?.email?.split('@')[0] || (isUnlocked ? 'Vault Admin' : 'Student');
      await FirebaseService.createDoubt({
        noteId,
        noteTitle,
        question: questionText.trim(),
        codeSnippet: codeSnippet.trim() || null,
        authorUid: user?.uid || (isUnlocked ? 'admin' : 'guest'),
        authorName,
        authorAvatar: user?.photoURL || null,
        isAdmin: isUnlocked || user?.email?.toLowerCase().includes('admin'),
      });
      setQuestionText('');
      setCodeSnippet('');
      setShowCodeInput(false);
    } catch (err) {
      console.error('Failed to post doubt:', err);
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostReply = async (doubtId) => {
    if (!replyText.trim()) return;

    if (!isLoggedIn && !isUnlocked) {
      openAuthModal('login');
      return;
    }

    try {
      const authorName = user?.displayName || user?.email?.split('@')[0] || (isUnlocked ? 'Vault Admin' : 'Student');
      await FirebaseService.addReplyToDoubt(doubtId, {
        text: replyText.trim(),
        authorUid: user?.uid || (isUnlocked ? 'admin' : 'guest'),
        authorName,
        authorAvatar: user?.photoURL || null,
        isAdmin: isUnlocked || user?.email?.toLowerCase().includes('admin'),
      });
      setReplyText('');
      setActiveReplyDoubtId(null);
      // Auto expand to show the new reply
      setExpandedDoubts((prev) => ({ ...prev, [doubtId]: true }));
    } catch (err) {
      console.error('Failed to post reply:', err);
    }
  };

  const handleToggleResolve = async (doubt) => {
    try {
      await FirebaseService.toggleResolveDoubt(doubt.id, doubt.isResolved);
    } catch (err) {
      console.error('Toggle resolve error:', err);
    }
  };

  return (
    <section className="mt-14 pt-8 border-t border-slate-200 dark:border-slate-800 font-mono text-xs">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Doubts & Community Discussions
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ask questions or help classmates solve tricky concepts in this note.
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] border border-slate-700/50">
          {doubts.length} {doubts.length === 1 ? 'Discussion' : 'Discussions'}
        </span>
      </div>

      {/* Ask Doubt Form */}
      <form onSubmit={handlePostDoubt} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 mb-8 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold text-teal-400 text-[11px] flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got a doubt about this topic?</span>
          </span>
          <button
            type="button"
            onClick={() => setShowCodeInput(!showCodeInput)}
            className={`px-2 py-1 rounded-lg text-[10px] transition flex items-center space-x-1 ${
              showCodeInput
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3 h-3" />
            <span>{showCodeInput ? 'Hide Code' : '+ Add Code Snippet'}</span>
          </button>
        </div>

        <textarea
          rows={2}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder={
            isLoggedIn
              ? `Ask your question as @${user?.displayName || 'Student'}...`
              : 'Write your doubt here... (sign in to post)'
          }
          className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 text-xs resize-none"
        />

        {showCodeInput && (
          <textarea
            rows={3}
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            placeholder="// Paste any relevant code snippet or error message here..."
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-teal-300 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-xs font-mono"
          />
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="text-[10px] text-slate-500">
            {isLoggedIn ? (
              <span>Posting as <strong className="text-teal-400">{user?.displayName || user?.email}</strong></span>
            ) : isUnlocked ? (
              <span className="text-teal-400 font-bold">Posting as Vault Admin 👑</span>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-teal-400 hover:underline font-bold"
              >
                Sign in to post doubts
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isPosting || !questionText.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold transition flex items-center space-x-1.5 disabled:opacity-40 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Doubt</span>
          </button>
        </div>
      </form>

      {/* Doubts List */}
      <div className="space-y-4">
        {doubts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 text-center text-slate-500">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-30 text-purple-400" />
            <p className="font-bold text-slate-400 text-xs">No doubts on this note yet</p>
            <p className="text-[10px] mt-0.5">Be the first to ask a question or start a discussion!</p>
          </div>
        ) : (
          doubts.map((doubt) => {
            const isResolved = doubt.isResolved;
            const replies = doubt.replies || [];
            const isExpanded = expandedDoubts[doubt.id] !== false; // default expanded

            return (
              <div
                key={doubt.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isResolved
                    ? 'bg-slate-900/40 border-emerald-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-purple-500/40'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                      {doubt.authorAvatar ? (
                        <img src={doubt.authorAvatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        doubt.authorName?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-white text-xs">{doubt.authorName}</span>
                        {doubt.isAdmin && (
                          <span className="px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[9px] font-bold">
                            ADMIN 👑
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(doubt.timestamp || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Resolved Badge / Toggle Button */}
                    <button
                      onClick={() => handleToggleResolve(doubt)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition flex items-center space-x-1 border ${
                        isResolved
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-emerald-400'
                      }`}
                      title="Click to toggle resolved status"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isResolved ? 'Resolved' : 'Mark Resolved'}</span>
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-xs text-slate-200 leading-relaxed font-sans mt-1">
                  {doubt.question}
                </p>

                {/* Optional Code Snippet */}
                {doubt.codeSnippet && (
                  <pre className="p-3 my-2 rounded-xl bg-slate-950 border border-slate-800 text-teal-300 font-mono text-[11px] overflow-x-auto">
                    <code>{doubt.codeSnippet}</code>
                  </pre>
                )}

                {/* Replies Count & Reply Button */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60 text-[10px]">
                  <button
                    onClick={() =>
                      setExpandedDoubts((prev) => ({ ...prev, [doubt.id]: !isExpanded }))
                    }
                    className="flex items-center space-x-1 text-slate-400 hover:text-white"
                  >
                    <span>{replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <button
                    onClick={() => setActiveReplyDoubtId(activeReplyDoubtId === doubt.id ? null : doubt.id)}
                    className="text-purple-400 hover:text-purple-300 font-bold flex items-center space-x-1"
                  >
                    <CornerDownRight className="w-3 h-3" />
                    <span>Reply</span>
                  </button>
                </div>

                {/* Threaded Replies */}
                {isExpanded && replies.length > 0 && (
                  <div className="mt-3 pl-3 border-l-2 border-purple-500/30 space-y-2">
                    {replies.map((reply) => (
                      <div key={reply.id} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <span className="font-bold text-white text-[11px]">{reply.authorName}</span>
                          {reply.isAdmin && (
                            <span className="px-1 py-0.2 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[9px] font-bold">
                              ADMIN 👑
                            </span>
                          )}
                          <span className="text-[9px] text-slate-500 ml-auto">
                            {new Date(reply.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                          {reply.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input Box */}
                {activeReplyDoubtId === doubt.id && (
                  <div className="mt-3 flex items-center space-x-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your answer or solution..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-purple-500 text-xs"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePostReply(doubt.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handlePostReply(doubt.id)}
                      disabled={!replyText.trim()}
                      className="px-3 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition disabled:opacity-40 shrink-0 text-xs"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
