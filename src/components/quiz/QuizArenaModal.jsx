import React, { useState, useEffect, useMemo } from 'react';
import { useNotes } from '../../context/NotesContext';
import { useSecurity } from '../../context/SecurityContext';
import { QuizGenerator } from '../../services/quizGenerator';
import confetti from 'canvas-confetti';
import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Award,
  Sparkles,
  RotateCcw,
  Trash2,
  Search,
  Folder,
  FileText,
  Check,
  ChevronRight,
  Zap,
  BarChart2,
  X,
  Flame,
  BookOpen,
  ArrowRight,
  Filter
} from 'lucide-react';

export default function QuizArenaModal({ isOpen, onClose }) {
  const {
    notes,
    folders,
    categories,
    quizzes,
    saveQuizAttempt,
    deleteQuizAttempt,
    clearAllQuizAttempts,
    quizSelectedNoteIds,
    setQuizSelectedNoteIds
  } = useNotes();

  const { requireAuth } = useSecurity();

  // Active view: 'setup' | 'playing' | 'result' | 'vault'
  const [view, setView] = useState('setup');

  // Setup state
  const [selectedNoteIds, setSelectedNoteIds] = useState([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('all'); // 'all', 'easy', 'medium', 'hard'
  const [quizMode, setQuizMode] = useState('practice'); // 'practice' (instant hints) | 'exam' (timed simulation)
  const [noteSearch, setNoteSearch] = useState('');
  const [filterFolderId, setFilterFolderId] = useState('all');

  // Active quiz gameplay state
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qIndex]: selectedOptionIndex }
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [activeQuizTitle, setActiveQuizTitle] = useState('');

  // Reviewing a saved quiz
  const [reviewingQuiz, setReviewingQuiz] = useState(null);

  // Initialize selected notes from context when modal opens
  useEffect(() => {
    if (isOpen) {
      if (quizSelectedNoteIds && quizSelectedNoteIds.length > 0) {
        setSelectedNoteIds(quizSelectedNoteIds);
        setView('setup');
      } else if (selectedNoteIds.length === 0 && notes.length > 0) {
        // Default select all or first note
        setSelectedNoteIds(notes.slice(0, 3).map((n) => n.id));
      }
    }
  }, [isOpen, quizSelectedNoteIds]);

  // Quiz timer ticker
  useEffect(() => {
    let interval = null;
    if (timerActive && view === 'playing') {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, view]);

  if (!isOpen) return null;

  // Filter notes in setup
  const filteredNotes = notes.filter((n) => {
    if (filterFolderId !== 'all' && n.folderId !== filterFolderId) return false;
    if (noteSearch.trim()) {
      const q = noteSearch.toLowerCase();
      return (
        (n.title || '').toLowerCase().includes(q) ||
        (n.category || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleSelectNote = (id) => {
    setSelectedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredNotes.map((n) => n.id);
    setSelectedNoteIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleDeselectAll = () => {
    setSelectedNoteIds([]);
  };

  // Start Quiz
  const handleStartQuiz = () => {
    const notesToUse = notes.filter((n) => selectedNoteIds.includes(n.id));
    if (notesToUse.length === 0) {
      alert('Please select at least one note to generate a quiz!');
      return;
    }

    const generated = QuizGenerator.generateQuiz(notesToUse, {
      questionCount,
      difficulty
    });

    if (generated.length === 0) {
      alert('Could not extract enough questions from selected notes. Try writing more content or selecting more notes!');
      return;
    }

    const title =
      notesToUse.length === 1
        ? `${notesToUse[0].title} Quiz`
        : `${notesToUse.length} Notes Multi-Topic Quiz`;

    setActiveQuizTitle(title);
    setCurrentQuestions(generated);
    setCurrentIndex(0);
    setUserAnswers({});
    setSecondsElapsed(0);
    setTimerActive(true);
    setView('playing');
  };

  // Answer selection in active quiz
  const handleSelectAnswer = (optionIndex) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
  };

  // Finish and Score Quiz
  const handleFinishQuiz = async () => {
    setTimerActive(false);

    // Calculate score
    let correctCount = 0;
    currentQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / currentQuestions.length) * 100);

    // Trigger celebration confetti for score >= 70%
    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
    }

    const notesToUse = notes.filter((n) => selectedNoteIds.includes(n.id));
    const quizRecord = {
      id: `quiz_${Date.now()}`,
      title: activeQuizTitle,
      date: new Date().toISOString(),
      score: correctCount,
      totalQuestions: currentQuestions.length,
      percentage,
      timeTakenSeconds: secondsElapsed,
      difficulty,
      mode: quizMode,
      sourceNoteTitles: notesToUse.map((n) => n.title),
      sourceNoteIds: selectedNoteIds,
      questions: currentQuestions.map((q, idx) => ({
        ...q,
        userSelectedAnswer: userAnswers[idx] !== undefined ? userAnswers[idx] : null,
        isCorrect: userAnswers[idx] === q.correctIndex
      }))
    };

    // Auto-save to IndexedDB and Firebase Firestore
    await saveQuizAttempt(quizRecord);

    setReviewingQuiz(quizRecord);
    setView('result');
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const handleDeleteQuiz = (id) => {
    requireAuth(() => {
      if (confirm('Delete this saved quiz attempt?')) {
        deleteQuizAttempt(id);
      }
    });
  };

  const handleClearAll = () => {
    requireAuth(() => {
      if (confirm('Are you sure you want to clear ALL saved quiz records?')) {
        clearAllQuizAttempts();
      }
    });
  };

  // Retake a previously saved quiz
  const handleRetakeQuiz = (savedQuiz) => {
    setActiveQuizTitle(savedQuiz.title);
    setCurrentQuestions(savedQuiz.questions);
    setCurrentIndex(0);
    setUserAnswers({});
    setSecondsElapsed(0);
    setTimerActive(true);
    setView('playing');
  };

  const currentQ = currentQuestions[currentIndex];
  const isLastQuestion = currentIndex === currentQuestions.length - 1;
  const hasAnsweredCurrent = userAnswers[currentIndex] !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-teal-500/30 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden neon-glow-teal">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-mono font-bold text-white text-base sm:text-lg tracking-tight">
                  Neural Quiz Arena
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  AI & Multi-Note Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate custom practice & placement tests across single or multiple notes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Navigation Tabs */}
            {view !== 'playing' && (
              <div className="flex items-center space-x-1 bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setView('setup')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    view === 'setup'
                      ? 'bg-teal-500 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Quiz
                </button>
                <button
                  onClick={() => setView('vault')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                    view === 'vault'
                      ? 'bg-teal-500 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Quiz Vault ({quizzes.length})</span>
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setTimerActive(false);
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Quiz Arena"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ----------------- VIEW 1: QUIZ SETUP ----------------- */}
        {view === 'setup' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-mono">
            {/* Step 1: Multi-Note Selector */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                    1
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    Select Notes for Overall Quiz ({selectedNoteIds.length} chosen)
                  </h4>
                </div>

                <div className="flex items-center space-x-2 text-[11px]">
                  <button
                    onClick={handleSelectAllFiltered}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 transition"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>

              {/* Filter controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Search note filter */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    placeholder="Search notes to include..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Folder filter */}
                <div className="flex items-center space-x-2">
                  <select
                    value={filterFolderId}
                    onChange={(e) => setFilterFolderId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  >
                    <option value="all">📁 All Folders & Branches</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.icon || '📁'} {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes Grid with Checkboxes */}
              {notes.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-400" />
                  <p>You haven't created any notes yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Create or upload some notes first, then return here to test your knowledge!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-800/80 rounded-2xl bg-slate-950/40">
                  {filteredNotes.map((note) => {
                    const isSelected = selectedNoteIds.includes(note.id);
                    return (
                      <div
                        key={note.id}
                        onClick={() => toggleSelectNote(note.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-teal-500/15 border-teal-500/50 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-700 text-teal-500 focus:ring-0 shrink-0 cursor-pointer"
                          />
                          <div className="truncate">
                            <h5 className="font-semibold text-xs truncate">{note.title}</h5>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {note.category} • {note.readTime || '5m'}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-teal-400 shrink-0 ml-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Choose Number of Questions & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              {/* Question Count */}
              <div>
                <label className="block text-slate-300 font-bold mb-2 flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>Number of Questions</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[3, 5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-2 rounded-xl font-bold transition ${
                        questionCount === num
                          ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-slate-300 font-bold mb-2 flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Difficulty Level</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'all', label: 'Mixed' },
                    { id: 'easy', label: 'Easy' },
                    { id: 'medium', label: 'Medium' }
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDifficulty(d.id)}
                      className={`py-2 rounded-xl font-bold transition text-xs ${
                        difficulty === d.id
                          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3: Quiz Mode */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-slate-300 font-bold mb-2">
                Practice Mode vs Exam Simulation
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setQuizMode('practice')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    quizMode === 'practice'
                      ? 'bg-teal-500/15 border-teal-500/60 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold text-sm mb-1">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>Instant Practice Mode</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Shows immediate explanations after choosing each answer. Great for learning!
                  </p>
                </div>

                <div
                  onClick={() => setQuizMode('exam')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    quizMode === 'exam'
                      ? 'bg-indigo-500/15 border-indigo-500/60 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold text-sm mb-1">
                    <Flame className="w-4 h-4 text-indigo-400" />
                    <span>Exam / Placement Mode</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Timed simulation with zero hints until final submission. Tests true recall!
                  </p>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                disabled={selectedNoteIds.length === 0}
                onClick={handleStartQuiz}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-teal-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Generate & Start Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ----------------- VIEW 2: ACTIVE QUIZ GAMEPLAY ----------------- */}
        {view === 'playing' && currentQ && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col justify-between space-y-6">
            {/* Top Status Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-400 border border-teal-500/30 font-bold">
                    Question {currentIndex + 1} of {currentQuestions.length}
                  </span>
                  <span className="text-slate-500 hidden sm:inline">
                    From: <strong className="text-slate-300 font-semibold">{currentQ.sourceNoteTitle}</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-teal-300 font-mono">
                    <Clock className="w-3.5 h-3.5 animate-pulse text-teal-400" />
                    <span>{formatTime(secondsElapsed)}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400">
                    {currentQ.difficulty}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / currentQuestions.length) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed whitespace-pre-wrap">
                {currentQ.question}
              </h3>
            </div>

            {/* Options Cards */}
            <div className="space-y-3">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = userAnswers[currentIndex] === optIdx;
                const isCorrect = optIdx === currentQ.correctIndex;
                const showInstantResult = quizMode === 'practice' && hasAnsweredCurrent;

                let borderBg =
                  'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-teal-500/50 hover:bg-slate-800/60';

                if (showInstantResult) {
                  if (isCorrect) {
                    borderBg = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold';
                  } else if (isSelected && !isCorrect) {
                    borderBg = 'bg-rose-500/20 border-rose-500 text-rose-200';
                  }
                } else if (isSelected) {
                  borderBg = 'bg-teal-500/20 border-teal-500 text-white font-semibold shadow-md shadow-teal-500/10';
                }

                const optionLetter = ['A', 'B', 'C', 'D'][optIdx];

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectAnswer(optIdx)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start space-x-3.5 transition-all ${borderBg}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                        showInstantResult && isCorrect
                          ? 'bg-emerald-500 text-white'
                          : showInstantResult && isSelected && !isCorrect
                          ? 'bg-rose-500 text-white'
                          : isSelected
                          ? 'bg-teal-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {optionLetter}
                    </span>
                    <span className="text-xs sm:text-sm pt-0.5 leading-relaxed flex-1">
                      {option}
                    </span>
                    {showInstantResult && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {showInstantResult && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Instant Practice Explanation Card */}
            {quizMode === 'practice' && hasAnsweredCurrent && (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs animate-fade-in font-mono space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Concept Explanation:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-indigo-200">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Bottom Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              <div className="flex items-center space-x-2">
                {isLastQuestion ? (
                  <button
                    disabled={!hasAnsweredCurrent}
                    onClick={handleFinishQuiz}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs font-mono transition shadow-lg shadow-emerald-500/20 disabled:opacity-40"
                  >
                    Submit & View Results 🎉
                  </button>
                ) : (
                  <button
                    disabled={!hasAnsweredCurrent}
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs font-mono transition flex items-center space-x-1.5 disabled:opacity-40"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- VIEW 3: SCORECARD & RESULTS ----------------- */}
        {view === 'result' && reviewingQuiz && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Scorecard Hero Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-500/15 via-indigo-500/15 to-purple-500/15 border border-teal-500/30 text-center relative overflow-hidden">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center mb-3">
                <Award className="w-8 h-8 animate-bounce" />
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                {reviewingQuiz.percentage >= 80
                  ? 'Outstanding Performance! 🏆'
                  : reviewingQuiz.percentage >= 50
                  ? 'Good Effort! Keep Revising 🎯'
                  : 'Needs Practice & Revision ⚠️'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Results automatically saved in your Cloud Quiz Vault
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mt-6 font-mono text-center">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Score</span>
                  <span className="text-xl font-bold text-white">
                    {reviewingQuiz.score} / {reviewingQuiz.totalQuestions}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Percentage</span>
                  <span
                    className={`text-xl font-bold ${
                      reviewingQuiz.percentage >= 70
                        ? 'text-emerald-400'
                        : reviewingQuiz.percentage >= 50
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {reviewingQuiz.percentage}%
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Time Taken</span>
                  <span className="text-xl font-bold text-teal-400">
                    {formatTime(reviewingQuiz.timeTakenSeconds || 0)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => handleRetakeQuiz(reviewingQuiz)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs transition flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake This Quiz</span>
                </button>
                <button
                  onClick={() => setView('setup')}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-mono text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create New Quiz</span>
                </button>
              </div>
            </div>

            {/* Questions Detailed Review List */}
            <div className="space-y-4">
              <h4 className="font-mono font-bold text-white text-sm uppercase tracking-wider flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-teal-400" />
                <span>Detailed Questions Review</span>
              </h4>

              <div className="space-y-3">
                {reviewingQuiz.questions.map((q, idx) => {
                  const isCorrect = q.userSelectedAnswer === q.correctIndex;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border text-xs ${
                        isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-rose-500/10 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2 font-mono">
                        <div className="flex items-center space-x-2 font-bold text-white">
                          <span>Q{idx + 1}.</span>
                          <span className="text-slate-200">{q.question}</span>
                        </div>
                        {isCorrect ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] shrink-0 font-bold">
                            +1 Correct
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] shrink-0 font-bold">
                            Incorrect
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 my-2 font-mono text-[11px]">
                        <p className="text-slate-400">
                          Your Answer:{' '}
                          <span
                            className={isCorrect ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}
                          >
                            {q.userSelectedAnswer !== null && q.userSelectedAnswer !== undefined
                              ? q.options[q.userSelectedAnswer]
                              : 'Not answered'}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-slate-400">
                            Correct Answer:{' '}
                            <span className="text-emerald-400 font-bold">
                              {q.options[q.correctIndex]}
                            </span>
                          </p>
                        )}
                      </div>

                      {q.explanation && (
                        <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60 font-sans">
                          💡 <strong>Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- VIEW 4: QUIZ VAULT & SAVED SCORES ----------------- */}
        {view === 'vault' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-white text-sm">
                  Saved Quizzes & Exam History
                </h4>
                <p className="text-slate-400 text-[11px]">
                  All test attempts are automatically synced across devices
                </p>
              </div>

              {quizzes.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs transition flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {quizzes.length === 0 ? (
              <div className="p-12 rounded-3xl bg-slate-950/50 border border-slate-800 text-center text-slate-400">
                <Brain className="w-10 h-10 mx-auto mb-3 opacity-30 text-teal-400" />
                <p className="font-bold text-white text-sm">No Quizzes Completed Yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Select your notes, start a quiz, and your scores and detailed answers will be saved right here in your database!
                </p>
                <button
                  onClick={() => setView('setup')}
                  className="mt-4 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold transition"
                >
                  Generate Your First Quiz
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <h5 className="font-bold text-white text-sm">{quiz.title}</h5>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            quiz.percentage >= 70
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : quiz.percentage >= 50
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {quiz.score} / {quiz.totalQuestions} ({quiz.percentage}%)
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                        <span>📅 {new Date(quiz.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>⏱️ {formatTime(quiz.timeTakenSeconds || 0)}</span>
                        {quiz.sourceNoteTitles && (
                          <>
                            <span>•</span>
                            <span className="text-teal-400 truncate max-w-xs">
                              {quiz.sourceNoteTitles.join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => {
                          setReviewingQuiz(quiz);
                          setView('result');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => handleRetakeQuiz(quiz)}
                        className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 transition text-xs flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake</span>
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete Quiz Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
