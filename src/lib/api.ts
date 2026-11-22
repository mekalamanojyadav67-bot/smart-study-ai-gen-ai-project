import type { Flashcard, QuizQuestion, DifficultTopic, KeyTerm } from '../types';

async function handleJsonResponse<T>(res: Response): Promise<T> {
  const rawText = await res.text().catch(() => '');
  let data: Record<string, unknown> = {};
  if (rawText) {
    try {
      const parsed = JSON.parse(rawText);
      if (parsed && typeof parsed === 'object') {
        data = parsed as Record<string, unknown>;
      }
    } catch {
      data = {};
    }
  }

  if (!res.ok) {
    if (typeof data.error === 'string' && data.error.trim()) {
      throw new Error(data.error);
    }
    if (res.status === 404) {
      throw new Error(
        'API endpoint not found (404). Make sure the backend or Vercel /api serverless functions are deployed.'
      );
    }
    if (res.status === 413) {
      throw new Error(
        'The uploaded PDF is too large for the serverless request limit. Try a smaller PDF or paste the notes.'
      );
    }
    if (res.status === 504) {
      throw new Error(
        'The AI request timed out. Try generating fewer questions or shorter notes.'
      );
    }
    throw new Error(`Request failed with status ${res.status}`);
  }

  return data as T;
}

export async function extractPdfText(
  fileName: string,
  base64Data: string
): Promise<{ text: string; pages: number; method: 'text-parser' | 'gemini-vision' }> {
  const res = await fetch('/api/extract-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, base64Data }),
  });
  const data = await handleJsonResponse<{
    text?: string;
    pages?: number;
    method?: 'text-parser' | 'gemini-vision';
  }>(res);

  if (typeof data.text !== 'string' || !data.text.trim()) {
    throw new Error('Could not extract readable text from this PDF.');
  }

  return {
    text: data.text,
    pages: typeof data.pages === 'number' ? data.pages : 0,
    method: data.method === 'gemini-vision' ? 'gemini-vision' : 'text-parser',
  };
}

export async function generateSummary(
  notes: string,
  title?: string
): Promise<{
  title: string;
  overview: string;
  importantPoints: string[];
  difficultTopics: DifficultTopic[];
  keyTerms: KeyTerm[];
}> {
  const res = await fetch('/api/ai/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, title }),
  });
  const data = await handleJsonResponse<{
    title?: string;
    overview?: string;
    importantPoints?: string[];
    difficultTopics?: DifficultTopic[];
    keyTerms?: KeyTerm[];
  }>(res);

  if (typeof data.overview !== 'string' || !data.overview.trim()) {
    throw new Error('Received an incomplete summary from the server. Please try again.');
  }

  return {
    title: typeof data.title === 'string' && data.title.trim() ? data.title : title || 'Study Summary',
    overview: data.overview,
    importantPoints: Array.isArray(data.importantPoints) ? data.importantPoints : [],
    difficultTopics: Array.isArray(data.difficultTopics) ? data.difficultTopics : [],
    keyTerms: Array.isArray(data.keyTerms) ? data.keyTerms : [],
  };
}

export async function generateQuiz(
  notes: string,
  count: 5 | 10 | 20,
  title?: string
): Promise<{ topic: string; questions: QuizQuestion[] }> {
  const res = await fetch('/api/ai/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, count, title }),
  });
  const data = await handleJsonResponse<{
    topic?: string;
    questions?: QuizQuestion[];
  }>(res);

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('The server did not return valid quiz questions. Please try again.');
  }

  const sanitized = data.questions.map((q, idx) => ({
    id: typeof q?.id === 'number' ? q.id : idx + 1,
    question: typeof q?.question === 'string' ? q.question : `Question ${idx + 1}`,
    options: Array.isArray(q?.options) && q.options.length > 0 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: typeof q?.correctIndex === 'number' ? q.correctIndex : 0,
    explanation: typeof q?.explanation === 'string' ? q.explanation : 'Review your study notes for this concept.',
  }));

  return {
    topic: typeof data.topic === 'string' && data.topic.trim() ? data.topic : title || 'Study Quiz',
    questions: sanitized,
  };
}

export async function generateFlashcards(
  notes: string,
  title?: string
): Promise<{ topic: string; cards: Flashcard[] }> {
  const res = await fetch('/api/ai/flashcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, title }),
  });
  const data = await handleJsonResponse<{
    topic?: string;
    cards?: Flashcard[];
  }>(res);

  if (!Array.isArray(data.cards) || data.cards.length === 0) {
    throw new Error('The server did not return valid flashcards. Please try again.');
  }

  const sanitized = data.cards.map((c, idx) => ({
    id: typeof c?.id === 'number' ? c.id : idx + 1,
    front: typeof c?.front === 'string' ? c.front : `Card ${idx + 1}`,
    back: typeof c?.back === 'string' ? c.back : '',
    hint: typeof c?.hint === 'string' ? c.hint : '',
  }));

  return {
    topic: typeof data.topic === 'string' && data.topic.trim() ? data.topic : title || 'Flashcard Deck',
    cards: sanitized,
  };
}
