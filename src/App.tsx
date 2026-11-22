import { useEffect, useState } from 'react';
import { Menu, FilePlus2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import NotesWorkspace from './components/NotesWorkspace';
import SummarizerView from './components/SummarizerView';
import QuizView from './components/QuizView';
import FlashcardsView from './components/FlashcardsView';
import { SAMPLE_NOTES } from './data/sampleNotes';
import type {
  FlashcardDeck,
  GeneratedQuiz,
  NavSection,
  NoteSet,
  QuizAttempt,
  StudySummary,
} from './types';

const STORAGE_KEYS = {
  notes: 'smart_study_ai_notes_v1',
  activeNoteId: 'smart_study_ai_active_note_v1',
  summaries: 'smart_study_ai_summaries_v1',
  attempts: 'smart_study_ai_attempts_v1',
  decks: 'smart_study_ai_decks_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: 'Study Dashboard',
  notes: 'Study Notes',
  summarizer: 'AI Notes Summarizer',
  quiz: 'AI Quiz Generator',
  flashcards: 'Flashcards',
};

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize with saved notes or pre-load the first sample note on fresh visit so users can immediately explore
  const [noteSets, setNoteSets] = useState<NoteSet[]>(() => {
    const stored = readStorage<NoteSet[]>(STORAGE_KEYS.notes, []);
    if (stored.length > 0) return stored;
    const firstSample = SAMPLE_NOTES[0];
    return [
      {
        id: firstSample.id,
        title: firstSample.title,
        content: firstSample.content,
        sourceType: 'sample',
        updatedAt: new Date().toISOString(),
        wordCount: firstSample.content.trim().split(/\s+/).length,
      },
    ];
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    const storedId = readStorage<string | null>(STORAGE_KEYS.activeNoteId, null);
    return storedId ?? SAMPLE_NOTES[0].id;
  });

  const [summariesByNote, setSummariesByNote] = useState<Record<string, StudySummary>>(() =>
    readStorage<Record<string, StudySummary>>(STORAGE_KEYS.summaries, {})
  );

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() =>
    readStorage<QuizAttempt[]>(STORAGE_KEYS.attempts, [])
  );

  const [decksByNote, setDecksByNote] = useState<Record<string, FlashcardDeck>>(() =>
    readStorage<Record<string, FlashcardDeck>>(STORAGE_KEYS.decks, {})
  );

  const [currentQuiz, setCurrentQuiz] = useState<GeneratedQuiz | null>(null);
  const [reviewAttempt, setReviewAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(noteSets));
  }, [noteSets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activeNoteId, JSON.stringify(activeNoteId));
  }, [activeNoteId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.summaries, JSON.stringify(summariesByNote));
  }, [summariesByNote]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.attempts, JSON.stringify(quizAttempts));
  }, [quizAttempts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.decks, JSON.stringify(decksByNote));
  }, [decksByNote]);

  const activeNote =
    noteSets.find((n) => n.id === activeNoteId) ?? noteSets[0] ?? null;

  const handleSaveNote = (note: NoteSet) => {
    setNoteSets((prev) => {
      const exists = prev.some((item) => item.id === note.id);
      if (exists) {
        return prev.map((item) => (item.id === note.id ? note : item));
      }
      return [note, ...prev];
    });
    setActiveNoteId(note.id);
    if (currentQuiz && currentQuiz.noteId !== note.id) {
      setCurrentQuiz(null);
    }
  };

  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
    setReviewAttempt(null);
    if (currentQuiz && currentQuiz.noteId !== id) {
      setCurrentQuiz(null);
    }
  };

  const handleDeleteNote = (id: string) => {
    setNoteSets((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (activeNoteId === id) {
        setActiveNoteId(filtered[0]?.id ?? null);
      }
      return filtered;
    });
  };

  const handleSaveSummary = (summary: StudySummary) => {
    setSummariesByNote((prev) => ({
      ...prev,
      [summary.noteId]: summary,
    }));
  };

  const handleCompleteQuiz = (attempt: QuizAttempt) => {
    setQuizAttempts((prev) => [attempt, ...prev]);
  };

  const handleSaveDeck = (deck: FlashcardDeck) => {
    setDecksByNote((prev) => ({
      ...prev,
      [deck.noteId]: deck,
    }));
  };

  const handleToggleMastered = (noteId: string, cardId: number) => {
    setDecksByNote((prev) => {
      const existing = prev[noteId];
      if (!existing) return prev;
      const isMastered = existing.masteredIds.includes(cardId);
      const nextIds = isMastered
        ? existing.masteredIds.filter((id) => id !== cardId)
        : [...existing.masteredIds, cardId];
      return {
        ...prev,
        [noteId]: {
          ...existing,
          masteredIds: nextIds,
        },
      };
    });
  };

  const handleResetMastery = (noteId: string) => {
    setDecksByNote((prev) => {
      const existing = prev[noteId];
      if (!existing) return prev;
      return {
        ...prev,
        [noteId]: {
          ...existing,
          masteredIds: [],
        },
      };
    });
  };

  const handleNavigate = (section: NavSection) => {
    if (section !== 'quiz') {
      setReviewAttempt(null);
    }
    setActiveSection(section);
  };

  const handleReviewAttempt = (attempt: QuizAttempt) => {
    setReviewAttempt(attempt);
    setActiveSection('quiz');
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={handleNavigate}
        activeNote={activeNote}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-sky-100 px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-sky-50"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-bold text-slate-900 truncate">
              {SECTION_TITLES[activeSection]}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {noteSets.length > 1 && (
              <label className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                <span className="whitespace-nowrap">Active Note:</span>
                <select
                  value={activeNote?.id ?? ''}
                  onChange={(e) => handleSelectNote(e.target.value)}
                  aria-label="Switch active study notes"
                  className="max-w-[220px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-sky-500 focus:outline-none"
                >
                  {noteSets.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="button"
              onClick={() => handleNavigate('notes')}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="h-4 w-4" />
              <span>Upload Notes</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-[1280px] w-full mx-auto">
          {activeSection === 'dashboard' && (
            <DashboardView
              activeNote={activeNote}
              noteSets={noteSets}
              quizAttempts={quizAttempts}
              summariesByNote={summariesByNote}
              decksByNote={decksByNote}
              onNavigate={handleNavigate}
              onReviewAttempt={handleReviewAttempt}
            />
          )}

          {activeSection === 'notes' && (
            <NotesWorkspace
              activeNote={activeNote}
              noteSets={noteSets}
              onSaveNote={handleSaveNote}
              onSelectNote={handleSelectNote}
              onDeleteNote={handleDeleteNote}
              onNavigateAndRun={handleNavigate}
            />
          )}

          {activeSection === 'summarizer' && (
            <SummarizerView
              activeNote={activeNote}
              summary={activeNote ? summariesByNote[activeNote.id] ?? null : null}
              onSaveSummary={handleSaveSummary}
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'quiz' && (
            <QuizView
              activeNote={activeNote}
              currentQuiz={currentQuiz}
              reviewAttempt={reviewAttempt}
              onSetCurrentQuiz={setCurrentQuiz}
              onCompleteQuiz={handleCompleteQuiz}
              onClearReviewAttempt={() => setReviewAttempt(null)}
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'flashcards' && (
            <FlashcardsView
              activeNote={activeNote}
              deck={activeNote ? decksByNote[activeNote.id] ?? null : null}
              onSaveDeck={handleSaveDeck}
              onToggleMastered={handleToggleMastered}
              onResetMastery={handleResetMastery}
              onNavigate={handleNavigate}
            />
          )}
        </main>
      </div>
    </div>
  );
}
