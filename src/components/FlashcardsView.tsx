import { useEffect, useState } from 'react';
import {
  Layers,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Shuffle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { generateFlashcards } from '../lib/api';
import type { Flashcard, FlashcardDeck, NavSection, NoteSet } from '../types';

interface FlashcardsViewProps {
  activeNote: NoteSet | null;
  deck: FlashcardDeck | null;
  onSaveDeck: (deck: FlashcardDeck) => void;
  onToggleMastered: (noteId: string, cardId: number) => void;
  onResetMastery: (noteId: string) => void;
  onNavigate: (section: NavSection) => void;
}

export default function FlashcardsView({
  activeNote,
  deck,
  onSaveDeck,
  onToggleMastered,
  onResetMastery,
  onNavigate,
}: FlashcardsViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardOrder, setCardOrder] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (deck && Array.isArray(deck.cards)) {
      setCardOrder(deck.cards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      setCardOrder([]);
    }
  }, [deck?.noteId, deck?.generatedAt]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (cardOrder.length === 0) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.code === 'ArrowRight') {
        setCurrentIndex((i) => Math.min(cardOrder.length - 1, i + 1));
        setIsFlipped(false);
        setShowHint(false);
      } else if (e.code === 'ArrowLeft') {
        setCurrentIndex((i) => Math.max(0, i - 1));
        setIsFlipped(false);
        setShowHint(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cardOrder.length]);

  const handleGenerate = async () => {
    if (!activeNote || !activeNote.content.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateFlashcards(activeNote.content, activeNote.title);
      const nextDeck: FlashcardDeck = {
        noteId: activeNote.id,
        topic: data.topic || activeNote.title,
        cards: Array.isArray(data.cards) ? data.cards : [],
        masteredIds: [],
        generatedAt: new Date().toISOString(),
      };
      onSaveDeck(nextDeck);
      setCardOrder(nextDeck.cards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowHint(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate flashcards. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleShuffle = () => {
    if (cardOrder.length <= 1) return;
    const copy = [...cardOrder];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setCardOrder(copy);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handlePrev = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((i) => i - 1);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleNext = () => {
    if (currentIndex >= cardOrder.length - 1) return;
    setCurrentIndex((i) => i + 1);
    setIsFlipped(false);
    setShowHint(false);
  };

  if (!activeNote) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200/90 p-10 text-center max-w-xl mx-auto mt-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <FileText className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">No Study Notes Loaded</h2>
        <p className="mt-2 text-sm text-slate-600">
          Upload or paste your study notes first to automatically generate Q&A flashcards.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('notes')}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
        >
          <span>Go to Study Notes</span>
        </button>
      </div>
    );
  }

  const safeIndex =
    cardOrder.length > 0 ? Math.min(Math.max(0, currentIndex), cardOrder.length - 1) : 0;
  const currentCard = cardOrder[safeIndex] ?? null;
  const masteredIds = Array.isArray(deck?.masteredIds) ? deck.masteredIds : [];
  const masteredCount = masteredIds.length;
  const isCurrentMastered = Boolean(
    deck && currentCard && masteredIds.includes(currentCard.id)
  );

  return (
    <div className="space-y-6">
      {/* Header Control Bar */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-sky-700">AI Flashcard Generator</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900 truncate">{activeNote.title}</h2>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {deck
              ? `${cardOrder.length} cards · ${masteredCount} mastered`
              : 'Automatically create question-and-answer flashcards from your notes'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {deck && cardOrder.length > 0 && !isLoading && (
            <>
              <button
                type="button"
                onClick={handleShuffle}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <Shuffle className="h-4 w-4" />
                <span>Shuffle</span>
              </button>
              {masteredCount > 0 && (
                <button
                  type="button"
                  onClick={() => onResetMastery(activeNote.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  <span>Reset Mastery</span>
                </button>
              )}
            </>
          )}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>
              {isLoading
                ? 'Creating Deck...'
                : deck
                  ? 'Regenerate Deck'
                  : 'Generate Flashcards'}
            </span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3.5 text-sm text-red-800"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="text-xs font-semibold text-red-800 underline hover:text-red-900 whitespace-nowrap"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-900">
            Creating your active-recall flashcard deck with Gemini AI — this may take up to a minute.
          </div>
          <div className="rounded-2xl bg-white border border-slate-200/90 p-10 h-80 flex flex-col items-center justify-center space-y-4 animate-pulse">
            <div className="h-4 w-28 rounded bg-sky-100" />
            <div className="h-6 w-2/3 rounded bg-slate-100" />
            <div className="h-6 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      )}

      {/* Empty Deck Prompt */}
      {!isLoading && !deck && (
        <div className="rounded-2xl bg-gradient-to-br from-sky-50/80 to-white border border-sky-200/80 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Create Active-Recall Flashcards
          </h3>
          <p className="mt-1.5 text-sm text-slate-600 max-w-lg mx-auto">
            Generate a 10-card deck of focused questions and concise answers from "{activeNote.title}". Flip cards by clicking or pressing Spacebar.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
          >
            <span>Generate Flashcards</span>
          </button>
        </div>
      )}

      {/* Active Interactive Flashcard Stage */}
      {!isLoading && deck && currentCard && (
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Card Progress Bar */}
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span className="font-mono text-sky-700 font-semibold tabular-nums">
              Card {safeIndex + 1} of {cardOrder.length}
            </span>
            <span className="tabular-nums">
              Use Space to flip · Left/Right arrows to navigate
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-sky-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-600 transition-all duration-200"
              style={{
                width: `${((safeIndex + 1) / cardOrder.length) * 100}%`,
              }}
            />
          </div>

          {/* 3D Flip Card */}
          <div className="perspective-1200">
            <div
              role="button"
              tabIndex={0}
              aria-label={isFlipped ? 'Flashcard answer side, click to show question' : 'Flashcard question side, click to reveal answer'}
              onClick={() => setIsFlipped((f) => !f)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsFlipped((f) => !f);
                }
              }}
              className={`relative min-h-[300px] sm:min-h-[330px] w-full cursor-pointer preserve-3d transition-transform duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 rounded-2xl ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front Face (Question) */}
              <div className="absolute inset-0 backface-hidden rounded-2xl bg-white border border-sky-200 p-6 sm:p-10 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-sky-700">Question</span>
                  {isCurrentMastered && (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mastered</span>
                    </span>
                  )}
                </div>

                <div className="my-auto py-4 text-center">
                  <p className="font-display text-xl sm:text-2xl font-semibold text-slate-900 leading-snug">
                    {currentCard.front}
                  </p>
                  {showHint && (
                    <p className="mt-4 text-sm text-sky-800 bg-sky-50 border border-sky-100 rounded-xl px-4 py-2.5 inline-block">
                      Hint: {currentCard.hint}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHint((h) => !h);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                  </button>
                  <span className="text-xs text-slate-400">Click card to reveal answer</span>
                </div>
              </div>

              {/* Back Face (Answer) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-gradient-to-br from-sky-50 via-white to-blue-50 border border-sky-300 p-6 sm:p-10 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-sky-700">Answer</span>
                  {isCurrentMastered && (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mastered</span>
                    </span>
                  )}
                </div>

                <div className="my-auto py-4 text-center">
                  <p className="text-base sm:text-xl font-medium text-slate-900 leading-relaxed">
                    {currentCard.back}
                  </p>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <span className="text-xs text-slate-500">Click card to view question</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation & Mastery Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsFlipped((f) => !f)}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-50 border border-sky-200 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100 transition-colors whitespace-nowrap"
              >
                <RotateCw className="h-4 w-4" />
                <span>Flip Card</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleMastered(activeNote.id, currentCard.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
                  isCurrentMastered
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isCurrentMastered ? 'Mastered' : 'Mark Mastered'}</span>
              </button>
            </div>

            <button
              type="button"
              disabled={currentIndex >= cardOrder.length - 1}
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* All Cards Quick Index */}
          <div className="pt-4 border-t border-slate-200/80">
            <p className="text-xs font-semibold text-slate-500 mb-3">Deck Overview</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {cardOrder.map((card, idx) => {
                const isSelected = idx === safeIndex;
                const mastered = masteredIds.includes(card.id);
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsFlipped(false);
                      setShowHint(false);
                    }}
                    className={`text-left rounded-xl border px-3.5 py-2.5 transition-colors flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-sky-400 bg-sky-50'
                        : 'border-slate-200 bg-white hover:border-sky-200'
                    }`}
                  >
                    <span className="text-xs font-medium text-slate-800 truncate">
                      <span className="font-mono text-sky-700 mr-1.5 tabular-nums">
                        {idx + 1}.
                      </span>
                      {card.front}
                    </span>
                    {mastered && (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
