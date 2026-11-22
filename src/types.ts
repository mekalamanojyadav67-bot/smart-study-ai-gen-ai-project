export type NavSection = 'dashboard' | 'notes' | 'summarizer' | 'quiz' | 'flashcards';

export interface NoteSet {
  id: string;
  title: string;
  content: string;
  sourceType: 'pasted' | 'txt' | 'pdf' | 'sample';
  fileName?: string;
  updatedAt: string;
  wordCount: number;
}

export interface DifficultTopic {
  topic: string;
  simpleExplanation: string;
  analogy: string;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface StudySummary {
  noteId: string;
  title: string;
  overview: string;
  importantPoints: string[];
  difficultTopics: DifficultTopic[];
  keyTerms: KeyTerm[];
  generatedAt: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GeneratedQuiz {
  id: string;
  noteId: string;
  topic: string;
  questionCount: 5 | 10 | 20;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  noteId: string;
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  completedAt: string;
  answers: number[];
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: number;
  front: string;
  back: string;
  hint: string;
}

export interface FlashcardDeck {
  noteId: string;
  topic: string;
  cards: Flashcard[];
  masteredIds: number[];
  generatedAt: string;
}
