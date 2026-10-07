import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Timer, Flame, Bell, Coffee } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PomodoroTimerModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('focus'); // 'focus' (25m), 'shortBreak' (5m), 'longBreak' (15m)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const durations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        // Audio beep using Web Audio API
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch {}

      if (mode === 'focus') {
        setCompletedSessions((s) => s + 1);
        setMode('shortBreak');
        setTimeLeft(durations.shortBreak);
      } else {
        setMode('focus');
        setTimeLeft(durations.focus);
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  if (!isOpen) return null;

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(durations[newMode]);
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalDuration = durations[mode];
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-teal-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center neon-glow-teal">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Timer className="w-5 h-5 text-teal-400" />
            <h3 className="font-mono font-bold text-white text-base uppercase tracking-wider">
              Neural Focus HUD
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex space-x-2 my-5 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => handleModeChange('focus')}
            className={`px-3 py-1.5 rounded-xl transition ${
              mode === 'focus' ? 'bg-teal-500 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            25m Focus
          </button>
          <button
            onClick={() => handleModeChange('shortBreak')}
            className={`px-3 py-1.5 rounded-xl transition ${
              mode === 'shortBreak' ? 'bg-indigo-500 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            5m Break
          </button>
          <button
            onClick={() => handleModeChange('longBreak')}
            className={`px-3 py-1.5 rounded-xl transition ${
              mode === 'longBreak' ? 'bg-purple-500 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            15m Rest
          </button>
        </div>

        {/* Circular Progress Display */}
        <div className="relative w-56 h-56 flex items-center justify-center my-3">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="95"
              stroke="#1e293b"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="112"
              cy="112"
              r="95"
              stroke={mode === 'focus' ? '#14b8a6' : '#6366f1'}
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 95}
              strokeDashoffset={2 * Math.PI * 95 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500"
            />
          </svg>

          <div className="absolute flex flex-col items-center">
            <span className="font-mono text-5xl font-black text-white tracking-tighter">
              {formattedTime}
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-teal-400 mt-1">
              {isRunning ? '● ACTIVE FLOW' : '⏸ PAUSED'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-4 my-3">
          <button
            onClick={resetTimer}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTimer}
            className={`px-8 py-3.5 rounded-2xl font-mono font-bold text-sm text-white shadow-lg transition flex items-center space-x-2 ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/25'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
          </button>
        </div>

        {/* Streak counter */}
        <div className="mt-4 flex items-center space-x-1.5 text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
          <Flame className="w-4 h-4 fill-amber-400" />
          <span>Sessions Completed Today: <strong>{completedSessions}</strong></span>
        </div>
      </div>
    </div>
  );
}
