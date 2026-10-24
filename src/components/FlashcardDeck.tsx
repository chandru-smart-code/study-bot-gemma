import React, { useState } from 'react';
import {
  Layers,
  RotateCw,
  Plus,
  CheckCircle,
  Sparkles,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Shuffle,
  Smile,
  Frown,
  Meh,
  Award,
} from 'lucide-react';
import { Flashcard, Note } from '../types/index.ts';

interface FlashcardDeckProps {
  flashcards: Flashcard[];
  notes: Note[];
  onAddFlashcard: (card: Flashcard) => void;
  onUpdateFlashcard: (card: Flashcard) => void;
  onGenerateFromNote: (note: Note) => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  flashcards,
  notes,
  onAddFlashcard,
  onUpdateFlashcard,
  onGenerateFromNote,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newSubject, setNewSubject] = useState('General');

  const filteredCards = flashcards.filter(
    (c) => selectedSubject === 'all' || c.subject.toLowerCase() === selectedSubject.toLowerCase()
  );

  const subjects = ['all', ...Array.from(new Set(flashcards.map((c) => c.subject)))];

  const currentCard = filteredCards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % (filteredCards.length || 1));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % (filteredCards.length || 1));
  };

  const handleRate = (difficulty: 'easy' | 'good' | 'hard') => {
    if (!currentCard) return;
    onUpdateFlashcard({
      ...currentCard,
      difficulty,
      lastReviewed: Date.now(),
    });
    handleNext();
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    onAddFlashcard({
      id: `fc-${Date.now()}`,
      front: newFront.trim(),
      back: newBack.trim(),
      subject: newSubject.trim() || 'General',
      difficulty: 'new',
    });

    setNewFront('');
    setNewBack('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 overflow-y-auto">
      {/* Header */}
      <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 px-6 flex items-center justify-between shrink-0 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Flashcard Drill Center</h2>
            <span className="text-[10px] text-neutral-400">Active Recall & Spaced Repetition</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Flashcard</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 md:p-6 flex flex-col justify-between">
        {/* Subject Filter Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          <div className="flex items-center gap-1.5">
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  setSelectedSubject(sub);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition capitalize ${
                  selectedSubject === sub
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          <span className="text-xs text-neutral-400 font-mono">
            {filteredCards.length > 0 ? `${currentIndex + 1} of ${filteredCards.length}` : '0 cards'}
          </span>
        </div>

        {/* 3D Flip Card */}
        {filteredCards.length > 0 && currentCard ? (
          <div className="my-auto py-4">
            <div
              onClick={handleFlip}
              className="relative w-full aspect-[16/10] max-h-[340px] cursor-pointer perspective-1000 group select-none"
            >
              <div
                className={`w-full h-full rounded-3xl p-8 border text-center flex flex-col justify-between shadow-lg transition-transform duration-500 transform-style-3d ${
                  isFlipped
                    ? 'bg-emerald-950/80 text-emerald-100 border-emerald-500/40 rotate-y-180'
                    : 'bg-white dark:bg-neutral-850 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-750'
                }`}
              >
                {/* Card Header tag */}
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-semibold uppercase tracking-wider">
                    {currentCard.subject}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-500">
                    <RotateCw className="w-3 h-3" />
                    Click to flip
                  </span>
                </div>

                {/* Card Content */}
                <div className="my-auto px-4">
                  <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                    {isFlipped ? 'Definition / Concept (Back)' : 'Key Term / Question (Front)'}
                  </div>
                  <div className="text-lg md:text-xl font-bold leading-relaxed">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </div>
                </div>

                {/* Card Footer status */}
                <div className="text-[11px] text-neutral-400 flex items-center justify-center gap-1">
                  <span>Status:</span>
                  <span className="font-semibold capitalize text-emerald-500">
                    {currentCard.difficulty || 'new'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Rating Bar (Appears when flipped) */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => handleRate('hard')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold cursor-pointer transition"
              >
                <Frown className="w-3.5 h-3.5" />
                <span>Hard (Review soon)</span>
              </button>

              <button
                onClick={() => handleRate('good')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold cursor-pointer transition"
              >
                <Meh className="w-3.5 h-3.5" />
                <span>Good (Standard)</span>
              </button>

              <button
                onClick={() => handleRate('easy')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold cursor-pointer transition"
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Easy (Mastered)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="my-auto text-center py-16 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-200 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold">No flashcards in this subject yet</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Create a custom card or import key terms directly from your organized study notes!
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              Add First Flashcard
            </button>
          </div>
        )}

        {/* Controls at bottom */}
        {filteredCards.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={handlePrev}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleFlip}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {isFlipped ? 'Show Front' : 'Show Answer'}
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Add Flashcard Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              Create Flashcard
            </h3>

            <form onSubmit={handleCreateCard} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Subject / Course
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Biology, Calculus, History"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Front (Term, Equation, or Question)
                </label>
                <textarea
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="e.g. What is the First Law of Thermodynamics?"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Back (Definition or Solution)
                </label>
                <textarea
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="e.g. Energy cannot be created or destroyed, only transformed (Delta U = Q - W)."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
