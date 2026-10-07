import React, { useMemo } from 'react';
import { AlignLeft, Hash } from 'lucide-react';

export default function TableOfContents({ content }) {
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
    }
  };

  return (
    <div className="hidden xl:block w-64 shrink-0 pl-6 sticky top-24 self-start">
      <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          <AlignLeft className="w-3.5 h-3.5 text-teal-500" />
          <span>Table of Contents</span>
        </div>

        <nav className="space-y-1 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
          {headings.map((item, index) => (
            <button
              key={index}
              onClick={() => scrollToHeading(item.id)}
              className={`w-full text-left py-1 text-xs transition-colors rounded hover:text-teal-600 dark:hover:text-teal-400 flex items-start space-x-1.5 ${
                item.level === 3 ? 'pl-4 text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300 font-medium'
              }`}
            >
              <Hash className="w-3 h-3 mt-0.5 shrink-0 opacity-40" />
              <span className="truncate">{item.title}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
