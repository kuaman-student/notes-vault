import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, Minimize2, BookOpen } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

export default function ZenReaderModal({ note, isOpen, onClose }) {
  const [fontSize, setFontSize] = useState(18); // px
  const [zenTheme, setZenTheme] = useState('dark'); // 'dark', 'light', 'sepia'

  if (!isOpen || !note) return null;

  const themeStyles = {
    dark: 'bg-[#0b0f19] text-slate-100',
    light: 'bg-[#fcfbf9] text-slate-900',
    sepia: 'bg-[#f4ecd8] text-[#433422]'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-xl animate-fade-in flex flex-col transition-colors">
      {/* Floating Zen Controls */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-opacity-80 border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-5 h-5 text-teal-400" />
          <span className="text-sm font-semibold truncate max-w-xs sm:max-w-md opacity-80">
            Zen Focus: {note.title}
          </span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Zen themes */}
          <div className="flex items-center bg-black/20 rounded-lg p-1 space-x-1 text-xs">
            <button
              onClick={() => setZenTheme('dark')}
              className={`px-2.5 py-1 rounded transition-colors ${
                zenTheme === 'dark' ? 'bg-slate-700 text-white font-medium' : 'opacity-60 hover:opacity-100'
              }`}
            >
              OLED
            </button>
            <button
              onClick={() => setZenTheme('sepia')}
              className={`px-2.5 py-1 rounded transition-colors ${
                zenTheme === 'sepia' ? 'bg-[#e2d5b6] text-stone-900 font-medium' : 'opacity-60 hover:opacity-100'
              }`}
            >
              Paper
            </button>
            <button
              onClick={() => setZenTheme('light')}
              className={`px-2.5 py-1 rounded transition-colors ${
                zenTheme === 'light' ? 'bg-white text-slate-900 font-medium' : 'opacity-60 hover:opacity-100'
              }`}
            >
              Light
            </button>
          </div>

          {/* Font resizing */}
          <div className="flex items-center space-x-1 bg-black/20 rounded-lg p-1">
            <button
              onClick={() => setFontSize((s) => Math.max(14, s - 2))}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title="Smaller font"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs px-1 font-mono">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(26, s + 2))}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title="Larger font"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Close Zen Mode */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
            title="Exit Zen Mode (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Zen Body Content */}
      <main className={`flex-1 py-12 px-6 sm:px-12 md:px-24 transition-colors ${themeStyles[zenTheme]}`}>
        <div
          className="max-w-3xl mx-auto leading-relaxed transition-all"
          style={{ fontSize: `${fontSize}px` }}
        >
          <div className="mb-8 border-b border-current/10 pb-4">
            <div className="text-xs uppercase tracking-widest opacity-60 mb-2 font-mono">
              {note.category} • {note.readTime}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {note.title}
            </h1>
          </div>

          <MarkdownRenderer content={note.content} />
        </div>
      </main>
    </div>
  );
}
