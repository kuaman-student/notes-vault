import React, { useMemo } from 'react';
import { AlignLeft, Hash, X } from 'lucide-react';

export default function TableOfContents({ content, isMobileOpen, onMobileClose }) {
  const headings = useMemo(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const result = [];

    lines.forEach((line) => {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length; // 2 or 3
        const title = match[2].trim().replace(/[*_`]/g, '');
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        result.push({ level, title, id });
      }
    });

    return result;
  }, [content]);

  if (headings.length === 0) return null;

  const scrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      if (onMobileClose) onMobileClose();
    }
  };

  return (
    <>
      {/* Desktop Persistent Sidebar (Screen >= xl) */}
      <div className="hidden xl:block w-64 shrink-0 pl-6 sticky top-24 self-start">
        <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 font-mono">
            <AlignLeft className="w-3.5 h-3.5 text-teal-500" />
            <span>Table of Contents</span>
          </div>

          <nav className="space-y-1 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1 font-mono text-xs">
            {headings.map((item, index) => (
              <button
                key={index}
                onClick={() => scrollToHeading(item.id)}
                className={`w-full text-left py-1 text-xs transition-colors rounded hover:text-teal-600 dark:hover:text-teal-400 flex items-start space-x-1.5 ${
                  item.level === 3 ? 'pl-4 text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300 font-medium'
                }`}
              >
                <Hash className="w-3 h-3 mt-0.5 shrink-0 opacity-40 text-teal-500" />
                <span className="truncate">{item.title}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile & Tablet Outline Drawer (Screen < xl) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 xl:hidden flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-slate-900 border border-teal-500/30 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[80vh] flex flex-col font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-teal-400 font-bold uppercase tracking-wider text-xs">
                <AlignLeft className="w-4 h-4" />
                <span>Note Headings ({headings.length})</span>
              </div>
              <button
                onClick={onMobileClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="overflow-y-auto space-y-1 py-3 pr-1">
              {headings.map((item, index) => (
                <button
                  key={index}
                  onClick={() => scrollToHeading(item.id)}
                  className={`w-full text-left py-2 px-2.5 transition rounded-xl hover:bg-slate-800 flex items-start space-x-2 ${
                    item.level === 3 ? 'pl-6 text-slate-400' : 'text-slate-200 font-bold'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5 mt-0.5 shrink-0 text-teal-400" />
                  <span className="truncate">{item.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
