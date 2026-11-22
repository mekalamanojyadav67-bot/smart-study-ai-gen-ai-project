import {
  FileText,
  BookOpenCheck,
  HelpCircle,
  Layers,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import type {
  FlashcardDeck,
  NavSection,
  NoteSet,
  QuizAttempt,
  StudySummary,
} from '../types';

interface DashboardViewProps {
  activeNote: NoteSet | null;
  noteSets: NoteSet[];
  quizAttempts: QuizAttempt[];
  summariesByNote: Record<string, StudySummary>;
  decksByNote: Record<string, FlashcardDeck>;
  onNavigate: (section: NavSection) => void;
  onReviewAttempt: (attempt: QuizAttempt) => void;
}

export default function DashboardView({
  activeNote,
  noteSets,
  quizAttempts,
  summariesByNote,
  decksByNote,
  onNavigate,
  onReviewAttempt,
}: DashboardViewProps) {
  const totalQuizzes = quizAttempts.length;
  const latestAttempt = quizAttempts[0] ?? null;

  const averageScore =
    totalQuizzes > 0
      ? Math.round(
          quizAttempts.reduce((sum, item) => sum + item.scorePercent, 0) / totalQuizzes
        )
      : null;

  const totalSummaries = Object.keys(summariesByNote).length;

  const totalMasteredCards = Object.values(decksByNote).reduce(
    (sum, deck) => sum + deck.masteredIds.length,
    0
  );
  const totalFlashcards = Object.values(decksByNote).reduce(
    (sum, deck) => sum + deck.cards.length,
    0
  );

  // Compute overall study workflow progress across the active note or overall workspace
  const hasNotes = noteSets.length > 0 && Boolean(activeNote?.content.trim());
  const hasSummaryForActive = Boolean(activeNote && summariesByNote[activeNote.id]);
  const hasQuizForActive = Boolean(
    activeNote && quizAttempts.some((a) => a.noteId === activeNote.id)
  );
  const hasFlashcardsForActive = Boolean(activeNote && decksByNote[activeNote.id]);

  const completedSteps = [
    hasNotes,
    hasSummaryForActive,
    hasQuizForActive,
    hasFlashcardsForActive,
  ].filter(Boolean).length;
  const studyProgressPercent = Math.round((completedSteps / 4) * 100);

  const recentTrend = quizAttempts.slice(0, 7).reverse();

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action Banner */}
      <section className="rounded-2xl bg-gradient-to-br from-sky-50 via-white to-blue-50/70 border border-sky-200/80 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-sky-700">Study Overview</p>
            <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {activeNote
                ? `Studying: ${activeNote.title}`
                : 'Turn your class notes into mastery'}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
              {activeNote
                ? 'Generate a plain-English summary, test yourself with an interactive quiz, or review active-recall flashcards.'
                : 'Upload a PDF or TXT file, paste your lecture notes, or load a sample topic to start generating AI summaries, quizzes, and flashcards.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('notes')}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0"
            >
              <FileText className="h-4 w-4" />
              <span>{activeNote ? 'Manage Notes' : 'Upload Notes'}</span>
            </button>
            {activeNote && (
              <button
                type="button"
                onClick={() => onNavigate('quiz')}
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-sky-200 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50 transition-colors whitespace-nowrap shrink-0"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Take AI Quiz</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Core Metrics Row */}
      <section aria-label="Study metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5">
          <p className="text-sm font-medium text-slate-500">Total Quizzes Completed</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
            {totalQuizzes}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {totalQuizzes === 1 ? '1 quiz submitted' : `${totalQuizzes} quizzes submitted`}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 p-5">
          <p className="text-sm font-medium text-slate-500">Latest Quiz Score</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-sky-700 tabular-nums">
            {latestAttempt ? `${latestAttempt.scorePercent}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 truncate tabular-nums">
            {latestAttempt
              ? `${latestAttempt.correctAnswers}/${latestAttempt.totalQuestions} correct · ${latestAttempt.topic}`
              : 'Complete a quiz to record your score'}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 p-5">
          <p className="text-sm font-medium text-slate-500">Average Quiz Score</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
            {averageScore !== null ? `${averageScore}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {totalSummaries} {totalSummaries === 1 ? 'summary' : 'summaries'} generated
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 p-5">
          <p className="text-sm font-medium text-slate-500">Flashcards Mastered</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
            {totalMasteredCards}
            <span className="text-lg font-normal text-slate-400">
              {totalFlashcards > 0 ? ` / ${totalFlashcards}` : ''}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {totalFlashcards > 0
              ? `${Math.round((totalMasteredCards / totalFlashcards) * 100)}% deck mastery`
              : 'Create flashcards to track mastery'}
          </p>
        </div>
      </section>

      {/* Study Progress & Performance Trend */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Active Study Checklist & Progress */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/90 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">Study Progress</h2>
              <span className="font-mono text-sm font-semibold text-sky-700 tabular-nums">
                {studyProgressPercent}%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {activeNote
                ? `Progress for "${activeNote.title}"`
                : 'Complete all four study stages for your active notes'}
            </p>

            <div className="mt-4 h-2.5 w-full rounded-full bg-sky-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-600 transition-all duration-300"
                style={{ width: `${studyProgressPercent}%` }}
              />
            </div>

            <div className="mt-6 divide-y divide-slate-100">
              {[
                {
                  label: '1. Load or Upload Study Notes',
                  done: hasNotes,
                  action: () => onNavigate('notes'),
                  cta: hasNotes ? 'Edit' : 'Start',
                },
                {
                  label: '2. Generate Plain-English Summary',
                  done: hasSummaryForActive,
                  action: () => onNavigate('summarizer'),
                  cta: hasSummaryForActive ? 'View' : 'Summarize',
                },
                {
                  label: '3. Complete an Interactive Quiz',
                  done: hasQuizForActive,
                  action: () => onNavigate('quiz'),
                  cta: hasQuizForActive ? 'Retake' : 'Start Quiz',
                },
                {
                  label: '4. Practice Active-Recall Flashcards',
                  done: hasFlashcardsForActive,
                  action: () => onNavigate('flashcards'),
                  cta: hasFlashcardsForActive ? 'Review' : 'Practice',
                },
              ].map((step) => (
                <div
                  key={step.label}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 ${
                        step.done ? 'text-emerald-600' : 'text-slate-300'
                      }`}
                    />
                    <span
                      className={`text-sm truncate ${
                        step.done ? 'text-slate-900 font-medium' : 'text-slate-600'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={step.action}
                    className="text-xs font-semibold text-sky-700 hover:text-sky-800 whitespace-nowrap shrink-0"
                  >
                    {step.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Score Progression Chart / Empty State */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200/90 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Quiz Score Progress</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Recent quiz accuracy across your latest study sessions
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-sky-600 shrink-0" />
            </div>

            {recentTrend.length > 0 ? (
              <div className="mt-6">
                <div className="grid grid-cols-7 gap-3 items-end h-44 pt-4 border-b border-slate-100">
                  {recentTrend.map((attempt, index) => (
                    <div
                      key={attempt.id}
                      className="flex flex-col items-center justify-end h-full gap-2"
                    >
                      <span className="font-mono text-xs font-medium text-slate-700 tabular-nums">
                        {attempt.scorePercent}%
                      </span>
                      <div className="w-full max-w-[44px] flex-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => onReviewAttempt(attempt)}
                          title={`${attempt.topic}: ${attempt.scorePercent}% (${attempt.correctAnswers}/${attempt.totalQuestions})`}
                          className={`w-full rounded-t-lg transition-opacity hover:opacity-85 ${
                            attempt.scorePercent >= 70 ? 'bg-sky-600' : 'bg-sky-300'
                          }`}
                          style={{
                            height: `${Math.max(12, attempt.scorePercent)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono tabular-nums pb-2">
                        Q{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Click any bar to review the full question-by-question breakdown.
                </p>
              </div>
            ) : (
              <div className="mt-8 rounded-xl bg-sky-50/60 border border-sky-100 p-6 text-center">
                <p className="text-sm font-medium text-slate-800">
                  No quiz scores recorded yet
                </p>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Generate a 5, 10, or 20-question quiz from your notes to visualize your learning curve here.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('quiz')}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap"
                >
                  <span>Go to Quiz Generator</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Tools Row */}
      <section aria-label="Study tools" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'AI Notes Summarizer',
            desc: 'Condense dense chapters into clear takeaways and simple-English explanations.',
            icon: BookOpenCheck,
            section: 'summarizer' as NavSection,
            cta: 'Open Summarizer',
          },
          {
            title: 'Interactive Quiz',
            desc: 'Test retention with 5, 10, or 20 AI-generated MCQs and instant answer explanations.',
            icon: HelpCircle,
            section: 'quiz' as NavSection,
            cta: 'Launch Quiz',
          },
          {
            title: 'Flashcard Deck',
            desc: 'Flip through Q&A active-recall flashcards and mark concepts you have mastered.',
            icon: Layers,
            section: 'flashcards' as NavSection,
            cta: 'Study Flashcards',
          },
        ].map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.title}
              type="button"
              onClick={() => onNavigate(tool.section)}
              className="text-left rounded-2xl bg-white border border-slate-200/90 p-5 hover:border-sky-300 hover:bg-sky-50/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{tool.title}</h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{tool.desc}</p>
              <p className="mt-3 text-xs font-semibold text-sky-700">{tool.cta}</p>
            </button>
          );
        })}
      </section>

      {/* Recent Quiz History Table */}
      <section className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent Quiz History</h2>
            <p className="text-xs text-slate-500">
              All completed quizzes are saved locally in your browser
            </p>
          </div>
          {quizAttempts.length > 0 && (
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {quizAttempts.length} total
            </span>
          )}
        </div>

        {quizAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-medium text-slate-500">
                  <th className="py-3 px-6">Topic</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Questions</th>
                  <th className="py-3 px-4 text-right">Score</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {quizAttempts.slice(0, 10).map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-sky-50/40 transition-colors">
                    <td className="py-3 px-6 font-medium text-slate-900 max-w-[260px] truncate">
                      {attempt.topic}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs font-mono tabular-nums whitespace-nowrap">
                      {new Date(attempt.completedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {attempt.correctAnswers}/{attempt.totalQuestions}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                      <span
                        className={
                          attempt.scorePercent >= 70 ? 'text-emerald-700' : 'text-amber-700'
                        }
                      >
                        {attempt.scorePercent}%
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => onReviewAttempt(attempt)}
                        className="text-xs font-semibold text-sky-700 hover:text-sky-800 whitespace-nowrap"
                      >
                        Review Answers
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No completed quizzes yet. Head to Study Notes or AI Quiz to take your first quiz.
          </div>
        )}
      </section>
    </div>
  );
}
