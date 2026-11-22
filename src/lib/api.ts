import type { Flashcard, QuizQuestion, DifficultTopic, KeyTerm } from '../types';

async function handleJsonResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (typeof (data as { error?: string }).error === 'string') {
      throw new Error((data as { error: string }).error);
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
  return handleJsonResponse(res);
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
  return handleJsonResponse(res);
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
  return handleJsonResponse(res);
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
  return handleJsonResponse(res);
}
