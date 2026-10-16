import React from 'react';
import { useTheme, AVAILABLE_THEMES } from '../../context/ThemeContext';
import { Palette, Check, X, Moon, Sun, Zap, Terminal, Flame, Sparkles, Compass } from 'lucide-react';

export default function ThemePickerModal({ isOpen, onClose }) {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const getThemeIcon = (iconName, accent) => {
    switch (iconName) {
      case 'Moon':
        return <Moon className="w-5 h-5" style={{ color: accent }} />;
      case 'Zap':
        return <Zap className="w-5 h-5" style={{ color: accent }} />;
      case 'Terminal':
        return <Terminal className="w-5 h-5" style={{ color: accent }} />;
      case 'Flame':
        return <Flame className="w-5 h-5" style={{ color: accent }} />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" style={{ color: accent }} />;
      case 'Compass':
        return <Compass className="w-5 h-5" style={{ color: accent }} />;
      case 'Sun':
        return <Sun className="w-5 h-5" style={{ color: accent }} />;
      default:
        return <Palette className="w-5 h-5" style={{ color: accent }} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shadow-inner">
              <Palette className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Visual Theme Studio</h3>
              <p className="text-xs text-slate-400">Choose your favorite futuristic aesthetic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 max-h-[60vh] overflow-y-auto pr-1">
          {AVAILABLE_THEMES.map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`relative p-3.5 rounded-2xl border text-left transition flex items-start space-x-3 group ${
                  isSelected
                    ? 'bg-slate-800/90 border-teal-500 shadow-lg shadow-teal-500/10'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                {/* Theme Color Preview Circle */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow border border-white/10 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: t.color }}
                >
                  {getThemeIcon(t.icon, t.accent)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white group-hover:text-teal-300 transition-colors">
                      {t.name}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/40">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{t.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Themes auto-persist to your browser cache.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold shadow-md transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
