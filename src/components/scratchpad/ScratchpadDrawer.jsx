import React, { useState } from 'react';
import { useNotes } from '../../context/NotesContext';
import { X, Copy, Check, Trash2, ArrowUpRight, Edit3, Sparkles } from 'lucide-react';

export default function ScratchpadDrawer() {
  const {
    isScratchpadOpen,
    setIsScratchpadOpen,
    scratchpadText,
    updateScratchpad,
    setIsEditorOpen,
    setEditingNote
  } = useNotes();

  const [copied, setCopied] = useState(false);

  if (!isScratchpadOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(scratchpadText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConvertToNote = () => {
    setEditingNote({
      title: 'Note from Scratchpad',
      content: scratchpadText,
      tags: ['Scratchpad']
    });
    setIsScratchpadOpen(false);
    setIsEditorOpen(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[400px] animate-fade-in neon-glow-teal">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-black/40">
        <div className="flex items-center space-x-2">
          <Edit3 className="w-4 h-4 text-teal-400" />
          <h4 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
            Quick Scratchpad HUD
          </h4>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleCopy}
            className="p-1 rounded text-slate-400 hover:text-white transition"
            title="Copy Text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => updateScratchpad('')}
            className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
            title="Clear Scratchpad"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsScratchpadOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-3">
        <textarea
          value={scratchpadText}
          onChange={(e) => updateScratchpad(e.target.value)}
          placeholder="Type scratch thoughts, rough algorithm steps, interview cheat lines here... (Auto-saved ⚡)"
          className="w-full h-full bg-transparent resize-none focus:outline-none font-mono text-xs leading-relaxed text-slate-200 placeholder-slate-500"
        />
      </div>

      {/* Footer Convert Button */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-mono">
          {scratchpadText.length} chars
        </span>
        <button
          onClick={handleConvertToNote}
          className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-mono text-[11px] border border-teal-500/30 transition"
        >
          <span>Convert to Note</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
