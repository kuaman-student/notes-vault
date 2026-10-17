import React, { useState, useMemo, useEffect } from 'react';
import { X, Sparkles, RotateCw, ChevronLeft, ChevronRight, CheckCircle2, Award, Zap } from 'lucide-react';
import { SmartQuizEngine } from '../../services/smartQuizEngine';
import confetti from 'canvas-confetti';

export default function FlashcardsModal({ note, isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ratings, setRatings] = useState({}); // { [cardId]: 'hard' | 'good' | 'easy' }

  // Generate cards via Smart Extraction Engine
  const cards = useMemo(() => {
    if (!note || !note.content) return [];
    return SmartQuizEngine.generateFlashcards(note);
  }, [note]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    if (!isOpen || cards.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight' || e.key === 'j') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '1') {
        rateCurrentCard('hard');
      } else if (e.key === '2') {
        rateCurrentCard('good');
      } else if (e.key === '3') {
        rateCurrentCard('easy');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, cards, currentIndex]);

  if (!isOpen || !note) return null;

  const currentCard = cards[currentIndex] || cards[0];
  const currentRating = currentCard ? ratings[currentCard.id] : null;

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const rateCurrentCard = (ratingLevel) => {
    if (!currentCard) return;
    const nextRatings = { ...ratings, [currentCard.id]: ratingLevel };
    setRatings(nextRatings);

    // If all rated easy, celebrate!
    const ratedEasyCount = Object.values(nextRatings).filter((r) => r === 'easy').length;
    if (ratedEasyCount === cards.length) {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }

    // Auto advance
    setTimeout(() => {
      handleNext();
    }, 250);
  };

  const masteredCount = Object.values(ratings).filter((r) => r === 'easy').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-mono">
      <div className="relative w-full max-w-xl bg-slate-900 border border-teal-500/30 rounded-3xl shadow-2xl p-4 sm:p-8 flex flex-col max-h-[94vh] overflow-y-auto neon-glow-teal">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div className="min-w-0 truncate">
              <h3 className="font-bold text-white text-sm sm:text-base truncate">
                Spaced Repetition Flashcards
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {note.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Stats */}
        <div className="mt-3 sm:mt-4 flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-slate-200">
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mastered: {masteredCount} / {cards.length}</span>
          </span>
        </div>

        <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>

        {/* Flip Card Container */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="my-4 min-h-[220px] sm:min-h-[260px] p-4 sm:p-8 rounded-2xl border-2 border-dashed border-teal-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between select-none shadow-2xl relative group"
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border ${
                currentCard?.badgeColor || 'bg-teal-500/20 text-teal-300 border-teal-500/30'
              }`}
            >
              {currentCard?.badge || 'CONCEPT'}
            </span>
            <div className="flex items-center space-x-1 text-xs text-slate-400 group-hover:text-teal-300 transition">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Tap to flip</span>
            </div>
          </div>

          <div className="my-auto py-4 text-center">
            {isFlipped ? (
              <div className="animate-fade-in text-slate-100 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                {currentCard?.back}
              </div>
            ) : (
              <h4 className="animate-fade-in text-base sm:text-lg font-bold text-white tracking-tight leading-relaxed">
                {currentCard?.front}
              </h4>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-500">
            {isFlipped ? 'Tap card or press Space to show front' : 'Tap card or press Space to reveal answer'}
          </div>
        </div>

        {/* Spaced Repetition Rating Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => rateCurrentCard('hard')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              currentRating === 'hard'
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-slate-950 border-rose-500/30 text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            <span>🔴 Hard [1]</span>
          </button>

          <button
            onClick={() => rateCurrentCard('good')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              currentRating === 'good'
                ? 'bg-amber-500 text-white border-amber-400'
                : 'bg-slate-950 border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <span>🟡 Good [2]</span>
          </button>

          <button
            onClick={() => rateCurrentCard('easy')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              currentRating === 'easy'
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-slate-950 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            <span>🟢 Easy [3]</span>
          </button>
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 hover:text-white transition flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <span className="text-[10px] text-slate-500 hidden sm:inline">Shortcuts: ← / → or J / K</span>

          <button
            onClick={handleNext}
            className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 hover:text-white transition flex items-center space-x-1"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
