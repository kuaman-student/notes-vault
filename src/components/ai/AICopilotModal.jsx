import React, { useState, useMemo } from 'react';
import { useNotes } from '../../context/NotesContext';
import { Bot, Sparkles, Copy, Check, X, FileQuestion, Lightbulb, Zap, BookCheck } from 'lucide-react';

export default function AICopilotModal({ isOpen, onClose }) {
  const { activeNote } = useNotes();
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'interview', 'eli5', 'cheatsheet'
  const [copied, setCopied] = useState(false);

  // Client-side intelligent analysis of the note
  const analysis = useMemo(() => {
    if (!activeNote || !activeNote.content) return null;
    const content = activeNote.content;

    // Extract headings
    const headings = content
      .split('\n')
      .filter((l) => l.startsWith('## '))
      .map((l) => l.replace(/^##\s+/, '').replace(/[*_`]/g, ''));

    // Extract code blocks
    const hasCode = content.includes('```');

    // Extract formulas
    const hasMath = content.includes('$');

    // 1. Summary (Key Bullet points)
    const sentences = content
      .replace(/[#*`_>$\-]/g, '')
      .split(/(?<=[.?!])\s+/)
      .filter((s) => s.length > 25 && s.length < 150)
      .slice(0, 3);

    const summaryPoints = sentences.length > 0 ? sentences : [
      `Deep focus on ${activeNote.title} and related fundamental concepts.`,
      `Covers theoretical foundations, practical applications, and interview trade-offs.`,
      `Includes essential implementation patterns and algorithmic edge cases.`
    ];

    // 2. Interview Questions Generator
    const interviewQuestions = headings.map((h, i) => ({
      q: `Can you explain the core architecture of ${h} and where it is applied?`,
      hint: `Mention practical trade-offs, scalability, and time/space complexity.`
    }));

    if (interviewQuestions.length === 0) {
      interviewQuestions.push(
        { q: `What are the primary performance trade-offs in ${activeNote.title}?`, hint: `Discuss memory vs speed.` },
        { q: `How would you explain ${activeNote.title} in a system design interview?`, hint: `Start with high-level architecture.` }
      );
    }

    // 3. ELI5 (Explain Like I'm 5)
    const eli5 = `Imagine you are building a giant library. ${activeNote.title} is like having a super-smart librarian who remembers exactly which shelf holds every single page so you never have to search all the books one by one!`;

    // 4. Cheat Sheet
    const cheatSheet = [
      { label: 'Category', val: activeNote.category },
      { label: 'Difficulty Level', val: activeNote.difficulty || 'Intermediate' },
      { label: 'Key Pillars', val: headings.slice(0, 4).join(', ') || 'Core Principles' },
      { label: 'Formulas & Math Included', val: hasMath ? 'Yes (LaTeX KaTeX)' : 'Conceptual focus' },
      { label: 'Code Snippets Included', val: hasCode ? 'Yes' : 'No' }
    ];

    return { summaryPoints, interviewQuestions, eli5, cheatSheet };
  }, [activeNote]);

  if (!isOpen || !activeNote) return null;

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col max-h-[85vh] neon-glow-teal">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-500/30">
              <Bot className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-mono font-bold text-white text-base">
                  AI Study Copilot
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Neural Analyzer
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md">
                Analyzing: {activeNote.title}
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

        {/* Mode Tabs */}
        <div className="grid grid-cols-4 gap-1.5 my-4 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-center">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'summary' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'interview' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Questions</span>
          </button>

          <button
            onClick={() => setActiveTab('eli5')}
            className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'eli5' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ELI5 Analogy</span>
          </button>

          <button
            onClick={() => setActiveTab('cheatsheet')}
            className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'cheatsheet' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cheat Sheet</span>
          </button>
        </div>

        {/* Dynamic AI Content Output */}
        <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-xs sm:text-sm leading-relaxed text-slate-200 space-y-3">
          {activeTab === 'summary' && (
            <div className="space-y-3">
              <h4 className="font-mono text-teal-400 font-bold text-xs uppercase tracking-wider">
                ⚡ 3 Key Architectural Pillars:
              </h4>
              <ul className="space-y-2">
                {analysis?.summaryPoints.map((pt, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                      {i + 1}
                    </span>
                    <span className="text-slate-300">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'interview' && (
            <div className="space-y-3">
              <h4 className="font-mono text-indigo-400 font-bold text-xs uppercase tracking-wider">
                🎯 Mock Interview Questions for this topic:
              </h4>
              <div className="space-y-2.5">
                {analysis?.interviewQuestions.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="font-semibold text-white">Q{i + 1}: {item.q}</p>
                    <p className="text-[11px] text-teal-400/80 mt-1">💡 Tip: {item.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'eli5' && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-mono text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <Lightbulb className="w-4 h-4" />
                <span>Explain Like I'm 5 (Intuitive Analogy):</span>
              </h4>
              <p className="text-slate-300 italic text-sm leading-relaxed">
                "{analysis?.eli5}"
              </p>
            </div>
          )}

          {activeTab === 'cheatsheet' && (
            <div className="space-y-2">
              <h4 className="font-mono text-emerald-400 font-bold text-xs uppercase tracking-wider">
                📋 Topic Quick Summary Card:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysis?.cheatSheet.map((item, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">{item.label}</span>
                    <span className="font-semibold text-white text-xs">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => handleCopyText(JSON.stringify(analysis, null, 2))}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Analysis!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs shadow-md shadow-teal-500/20 transition"
          >
            Close Copilot
          </button>
        </div>
      </div>
    </div>
  );
}
