import React, { useState, useMemo } from 'react';
import { X, Sparkles, RotateCw, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FlashcardsModal({ note, isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState(new Set());

  // Generate flashcards from note sections
  const cards = useMemo(() => {
    if (!note || !note.content) return [];
    const generated = [];

    // Card 1: Overview
    if (note.summary) {
      generated.push({
        question: `What is the core concept of "${note.title}"?`,
        answer: note.summary,
        category: note.category
      });
    }

    // Split markdown by H2 headers
    const sections = note.content.split(/\n(?=##\s+)/);
    sections.forEach((section) => {
      const match = section.match(/^##\s+(.+)\r?\n([\s\S]+)$/);
      if (match) {
        const title = match[1].trim().replace(/[*_`]/g, '');
        const body = match[2].trim().slice(0, 320).replace(/[#*`_>]/g, '').trim() + '...';
        generated.push({
          question: `Explain: ${title}`,
          answer: body,
          category: note.category
        });
      }
    });

    return generated.length > 0
      ? generated
      : [
          {
            question: note.title,
            answer: note.summary || 'Review this note for key concepts and details.',
            category: note.category
          }
        ];
  }, [note]);

  if (!isOpen || !note) return null;

  const currentCard = cards[currentIndex] || cards[0];
  const isCurrentKnown = knownCards.has(currentIndex);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const toggleKnown = () => {
    const updated = new Set(knownCards);
    if (updated.has(currentIndex)) {
      updated.delete(currentIndex);
    } else {
      updated.add(currentIndex);
      if (updated.size === cards.length) {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      }
    }
    setKnownCards(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-500 animate-pulse" />
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              Placement Flashcard Mode
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span>
            Mastered: {knownCards.size} / {cards.length}
          </span>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-teal-500 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>

        {/* Flip Card Container */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="my-6 min-h-[260px] p-8 rounded-2xl border-2 border-dashed border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-purple-500/5 hover:border-teal-500 cursor-pointer transition-all flex flex-col justify-between select-none shadow-inner"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-500/20 text-teal-700 dark:text-teal-300">
              {isFlipped ? 'Answer / Explanation' : 'Concept / Question'}
            </span>
            <div className="flex items-center space-x-1 text-xs text-slate-400">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Tap to flip</span>
            </div>
          </div>

          <div className="my-auto py-4 text-center">
            {isFlipped ? (
              <p className="text-base sm:text-lg text-slate-800 dark:text-slate-100 leading-relaxed font-normal">
                {currentCard.answer}
              </p>
            ) : (
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {currentCard.question}
              </h4>
            )}
          </div>

          <div className="text-center text-xs text-slate-400">
            {isFlipped ? 'Tap to show question' : 'Tap to reveal answer'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handlePrev}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
            title="Previous Card"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={toggleKnown}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
              isCurrentKnown
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCurrentKnown ? 'Mastered!' : 'Mark as Mastered'}</span>
          </button>

          <button
            onClick={handleNext}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
            title="Next Card"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
