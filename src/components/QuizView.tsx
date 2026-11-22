import { useEffect, useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  FileText,
  MinusCircle,
} from 'lucide-react';
import { generateQuiz } from '../lib/api';
import type { GeneratedQuiz, NavSection, NoteSet, QuizAttempt } from '../types';

interface QuizViewProps {
  activeNote: NoteSet | null;
  currentQuiz: GeneratedQuiz | null;
  reviewAttempt: QuizAttempt | null;
  onSetCurrentQuiz: (quiz: GeneratedQuiz | null) => void;
  onCompleteQuiz: (attempt: QuizAttempt) => void;
  onClearReviewAttempt: () => void;
  onNavigate: (section: NavSection) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const QUESTION_COUNTS: Array<5 | 10 | 20> = [5, 10, 20];

export default function QuizView({
  activeNote,
  currentQuiz,
  reviewAttempt,
  onSetCurrentQuiz,
  onCompleteQuiz,
  onClearReviewAttempt,
  onNavigate,
}: QuizViewProps) {
  const [selectedCount, setSelectedCount] = useState<5 | 10 | 20>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [submittedAttempt, setSubmittedAttempt] = useState<QuizAttempt | null>(null);

  // If user clicked "Review Answers" from Dashboard, show that attempt directly
  useEffect(() => {
    if (reviewAttempt) {
      setSubmittedAttempt(reviewAttempt);
      setError(null);
    }
  }, [reviewAttempt]);

  const handleGenerateQuiz = async () => {
    if (!activeNote || !activeNote.content.trim()) return;
    setIsGenerating(true);
    setError(null);
    onClearReviewAttempt();
    setSubmittedAttempt(null);

    try {
      const data = await generateQuiz(activeNote.content, selectedCount, activeNote.title);
      const quiz: GeneratedQuiz = {
        id: `quiz-${Date.now()}`,
        noteId: activeNote.id,
        topic: data.topic || activeNote.title,
        questionCount: selectedCount,
        questions: data.questions,
        createdAt: new Date().toISOString(),
      };
      onSetCurrentQuiz(quiz);
      setCurrentIndex(0);
      setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate quiz. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (!currentQuiz || submittedAttempt) return;
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = optionIndex;
      return next;
    });
  };

  const handleSubmitQuiz = () => {
    if (!currentQuiz) return;
    let correctCount = 0;
    currentQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const total = currentQuiz.questions.length;
    const scorePercent = Math.round((correctCount / total) * 100);

    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      noteId: currentQuiz.noteId,
      topic: currentQuiz.topic,
      totalQuestions: total,
      correctAnswers: correctCount,
      scorePercent,
      completedAt: new Date().toISOString(),
      answers: [...selectedAnswers],
      questions: currentQuiz.questions,
    };

    setSubmittedAttempt(attempt);
    onCompleteQuiz(attempt);
  };

  const handleRetake = () => {
    if (!currentQuiz) {
      if (reviewAttempt) {
        onSetCurrentQuiz({
          id: `quiz-${Date.now()}`,
          noteId: reviewAttempt.noteId,
          topic: reviewAttempt.topic,
          questionCount: (reviewAttempt.totalQuestions === 10 || reviewAttempt.totalQuestions === 20
            ? reviewAttempt.totalQuestions
            : 5) as 5 | 10 | 20,
          questions: reviewAttempt.questions,
          createdAt: new Date().toISOString(),
        });
        setSelectedAnswers(new Array(reviewAttempt.questions.length).fill(-1));
        setCurrentIndex(0);
        setSubmittedAttempt(null);
        onClearReviewAttempt();
      }
      return;
    }
    setSelectedAnswers(new Array(currentQuiz.questions.length).fill(-1));
    setCurrentIndex(0);
    setSubmittedAttempt(null);
    onClearReviewAttempt();
  };

  if (!activeNote && !submittedAttempt && !currentQuiz) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200/90 p-10 text-center max-w-xl mx-auto mt-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <FileText className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">No Study Notes Loaded</h2>
        <p className="mt-2 text-sm text-slate-600">
          Upload or paste your study notes first so Gemini can generate custom multiple-choice questions.
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

  // Generator Header Bar (always accessible when notes are loaded)
  const generatorBar = activeNote ? (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium text-sky-700">AI Quiz Generator</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900 truncate">{activeNote.title}</h2>
        <p className="mt-1 text-xs text-slate-500">
          Choose 5, 10, or 20 multiple-choice questions generated from your notes
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <div
          role="group"
          aria-label="Question count"
          className="inline-flex items-center gap-1 rounded-xl bg-sky-50 p-1 border border-sky-100"
        >
          {QUESTION_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              disabled={isGenerating}
              onClick={() => setSelectedCount(count)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap tabular-nums ${
                selectedCount === count
                  ? 'bg-white text-sky-700 shadow-xs border border-sky-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {count} Questions
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={isGenerating}
          onClick={handleGenerateQuiz}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 transition-colors whitespace-nowrap"
        >
          <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Creating Quiz...' : 'Generate Quiz'}</span>
        </button>
      </div>
    </div>
  ) : null;

  // Results & Explanations View
  if (!isGenerating && submittedAttempt) {
    const passed = submittedAttempt.scorePercent >= 70;
    return (
      <div className="space-y-6">
        {generatorBar}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Score Summary Card */}
        <section className="rounded-2xl bg-gradient-to-br from-sky-50 via-white to-blue-50/70 border border-sky-200/80 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {passed ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-700">Quiz Completed · Great Mastery</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <span className="text-amber-700">Quiz Completed · Keep Reviewing</span>
                  </>
                )}
              </div>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">{submittedAttempt.topic}</h3>
              <p className="mt-1 text-sm text-slate-600 tabular-nums">
                You answered {submittedAttempt.correctAnswers} out of{' '}
                {submittedAttempt.totalQuestions} questions correctly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <div className="rounded-2xl bg-white border border-sky-200 px-6 py-4 text-center">
                <p className="text-xs font-medium text-slate-500">Final Score</p>
                <p className="mt-1 font-mono text-3xl font-bold text-sky-700 tabular-nums">
                  {submittedAttempt.scorePercent}%
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Retake This Quiz</span>
                </button>
                {activeNote && (
                  <button
                    type="button"
                    onClick={handleGenerateQuiz}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>New Questions</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Question-by-Question Review */}
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900">
            Answer Breakdown & Explanations
          </h3>
          {submittedAttempt.questions.map((q, qIdx) => {
            const userAnswer = submittedAttempt.answers[qIdx] ?? -1;
            const isCorrect = userAnswer === q.correctIndex;
            const isSkipped = userAnswer === -1;

            return (
              <div
                key={q.id}
                className="rounded-2xl bg-white border border-slate-200/90 p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <p className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                    <span className="font-mono text-sky-700 mr-2 tabular-nums">Q{qIdx + 1}.</span>
                    {q.question}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-700">Correct</span>
                      </>
                    ) : isSkipped ? (
                      <>
                        <MinusCircle className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-600">Unanswered</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-700">Incorrect</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isRightOption = optIdx === q.correctIndex;
                    const isUserChoice = optIdx === userAnswer;

                    let cardStyle = 'border-slate-200 bg-slate-50/40 text-slate-700';
                    let statusTag = '';
                    if (isRightOption) {
                      cardStyle = 'border-emerald-300 bg-emerald-50 text-emerald-950 font-medium';
                      statusTag = 'Correct Answer';
                    } else if (isUserChoice && !isRightOption) {
                      cardStyle = 'border-red-300 bg-red-50 text-red-900';
                      statusTag = 'Your Answer';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`rounded-xl border px-3.5 py-2.5 text-sm flex items-start justify-between gap-3 ${cardStyle}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono text-xs font-semibold mt-0.5">
                            {OPTION_LETTERS[optIdx]}.
                          </span>
                          <span>{opt}</span>
                        </div>
                        {statusTag && (
                          <span className="text-[11px] font-semibold whitespace-nowrap shrink-0 mt-0.5">
                            {statusTag}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl bg-sky-50/70 border border-sky-100 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                  <span className="font-semibold text-sky-900">Explanation: </span>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    );
  }

  const activeQuestion =
    !isGenerating && currentQuiz ? currentQuiz.questions[currentIndex] : null;
  const answeredCount = selectedAnswers.filter((a) => a !== -1).length;

  return (
    <div className="space-y-6">
      {generatorBar}

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
            onClick={handleGenerateQuiz}
            className="text-xs font-semibold text-red-800 underline hover:text-red-900 whitespace-nowrap"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isGenerating && (
        <div className="space-y-4">
          <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-900">
            Generating {selectedCount} multiple-choice questions with Gemini AI — larger quizzes may take up to a minute.
          </div>
          <div className="rounded-2xl bg-white border border-slate-200/90 p-8 space-y-5 animate-pulse">
            <div className="flex justify-between">
              <div className="h-4 w-32 rounded bg-sky-100" />
              <div className="h-4 w-24 rounded bg-slate-100" />
            </div>
            <div className="h-2.5 w-full rounded-full bg-sky-50" />
            <div className="h-6 w-3/4 rounded bg-slate-100" />
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-12 w-full rounded-xl bg-slate-100" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prompt before generating first quiz */}
      {!isGenerating && !currentQuiz && activeNote && (
        <div className="rounded-2xl bg-gradient-to-br from-sky-50/80 to-white border border-sky-200/80 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Ready to test your knowledge?
          </h3>
          <p className="mt-1.5 text-sm text-slate-600 max-w-lg mx-auto">
            Select 5, 10, or 20 questions above and click Generate Quiz. You will answer one question at a time and receive instant explanations after submitting.
          </p>
          <button
            type="button"
            onClick={handleGenerateQuiz}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
          >
            <span>Generate {selectedCount}-Question Quiz</span>
          </button>
        </div>
      )}

      {/* Interactive One-Question-at-a-Time Quiz */}
      {!isGenerating && currentQuiz && activeQuestion && (
        <div className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 space-y-6">
          {/* Progress Header */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500">
              <span className="font-mono text-sky-700 font-semibold tabular-nums">
                Question {currentIndex + 1} of {currentQuiz.questions.length}
              </span>
              <span className="tabular-nums">
                {answeredCount} of {currentQuiz.questions.length} answered
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-sky-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-600 transition-all duration-200"
                style={{
                  width: `${((currentIndex + 1) / currentQuiz.questions.length) * 100}%`,
                }}
              />
            </div>

            {/* Question Stepper Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentQuiz.questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = selectedAnswers[idx] !== -1;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to question ${idx + 1}`}
                    className={`h-8 min-w-[32px] px-2 rounded-lg font-mono text-xs font-semibold transition-colors tabular-nums ${
                      isCurrent
                        ? 'bg-sky-600 text-white'
                        : isAnswered
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Text */}
          <div className="pt-2">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug">
              {activeQuestion.question}
            </h3>
          </div>

          {/* Four Answer Options */}
          <div className="space-y-3" role="radiogroup" aria-label="Answer choices">
            {activeQuestion.options.map((option, optIdx) => {
              const isSelected = selectedAnswers[currentIndex] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left rounded-xl border px-4 py-3.5 min-h-[52px] flex items-start gap-3.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/40'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold mt-0.5 ${
                      isSelected
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {OPTION_LETTERS[optIdx]}
                  </span>
                  <span className="text-sm sm:text-base leading-relaxed">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation & Submit Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2.5">
              {currentIndex < currentQuiz.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((i) =>
                      Math.min(currentQuiz.questions.length - 1, i + 1)
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap"
                >
                  <span>Next Question</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={answeredCount === 0}
                  onClick={handleSubmitQuiz}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  <span>
                    Submit Quiz ({answeredCount}/{currentQuiz.questions.length})
                  </span>
                </button>
              )}

              {currentIndex < currentQuiz.questions.length - 1 && answeredCount === currentQuiz.questions.length && (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <span>Submit Quiz</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
