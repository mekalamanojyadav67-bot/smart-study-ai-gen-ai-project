import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  Upload,
  FileText,
  BookOpenCheck,
  HelpCircle,
  Layers,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { SAMPLE_NOTES, type SampleNote } from '../data/sampleNotes';
import { extractPdfText } from '../lib/api';
import type { NavSection, NoteSet } from '../types';

interface NotesWorkspaceProps {
  activeNote: NoteSet | null;
  noteSets: NoteSet[];
  onSaveNote: (note: NoteSet) => void;
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onNavigateAndRun: (section: NavSection) => void;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

export default function NotesWorkspace({
  activeNote,
  noteSets,
  onSaveNote,
  onSelectNote,
  onDeleteNote,
  onNavigateAndRun,
}: NotesWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState(activeNote?.title ?? '');
  const [content, setContent] = useState(activeNote?.content ?? '');
  const [sourceType, setSourceType] = useState<NoteSet['sourceType']>(
    activeNote?.sourceType ?? 'pasted'
  );
  const [fileName, setFileName] = useState<string | undefined>(activeNote?.fileName);
  const [editingId, setEditingId] = useState<string | null>(activeNote?.id ?? null);

  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const prevActiveIdRef = useRef<string | null>(activeNote?.id ?? null);

  useEffect(() => {
    const nextId = activeNote?.id ?? null;
    if (nextId !== prevActiveIdRef.current) {
      prevActiveIdRef.current = nextId;
      if (activeNote) {
        setEditingId(activeNote.id);
        setTitle(activeNote.title);
        setContent(activeNote.content);
        setSourceType(activeNote.sourceType);
        setFileName(activeNote.fileName);
        setError(null);
        setStatusMessage(null);
      }
    }
  }, [activeNote]);

  const syncFromNote = (note: NoteSet) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setSourceType(note.sourceType);
    setFileName(note.fileName);
    setError(null);
    setStatusMessage(null);
  };

  const handleNewBlank = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setSourceType('pasted');
    setFileName(undefined);
    setError(null);
    setStatusMessage(null);
  };

  const persistCurrentNote = (overrides?: {
    id?: string | null;
    title?: string;
    content?: string;
    sourceType?: NoteSet['sourceType'];
    fileName?: string;
  }): NoteSet | null => {
    const finalContent = (overrides?.content ?? content).trim();
    if (finalContent.length < 20) {
      setError('Please enter or upload at least 20 characters of study notes.');
      return null;
    }

    const derivedTitle =
      (overrides?.title ?? title).trim() ||
      finalContent.split('\n')[0].slice(0, 48).trim() ||
      'Untitled Study Notes';

    const note: NoteSet = {
      id: overrides?.id ?? editingId ?? `note-${Date.now()}`,
      title: derivedTitle,
      content: finalContent,
      sourceType: overrides?.sourceType ?? sourceType,
      fileName: overrides?.fileName ?? fileName,
      updatedAt: new Date().toISOString(),
      wordCount: countWords(finalContent),
    };

    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setSourceType(note.sourceType);
    setFileName(note.fileName);
    onSaveNote(note);
    return note;
  };

  const processFile = async (file: File) => {
    setError(null);
    setStatusMessage(null);

    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf') || file.type === 'application/pdf';
    const isTxt =
      lowerName.endsWith('.txt') ||
      lowerName.endsWith('.md') ||
      file.type.startsWith('text/');

    if (!isPdf && !isTxt) {
      setError('Unsupported file type. Please upload a PDF (.pdf) or text (.txt, .md) file.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File is too large (max 15 MB).');
      return;
    }

    const baseTitle = file.name.replace(/\.(pdf|txt|md)$/i, '');

    if (isTxt) {
      try {
        const text = await file.text();
        if (!text.trim()) {
          setError('The uploaded text file appears to be empty.');
          return;
        }
        const saved = persistCurrentNote({
          id: `note-${Date.now()}`,
          title: baseTitle,
          content: text,
          sourceType: 'txt',
          fileName: file.name,
        });
        if (saved) {
          setStatusMessage(`Loaded ${file.name} (${saved.wordCount.toLocaleString()} words).`);
        }
      } catch {
        setError('Failed to read the text file.');
      }
      return;
    }

    // PDF extraction via backend
    setIsExtracting(true);
    try {
      const base64Data = await readFileAsBase64(file);
      const result = await extractPdfText(file.name, base64Data);
      const saved = persistCurrentNote({
        id: `note-${Date.now()}`,
        title: baseTitle,
        content: result.text,
        sourceType: 'pdf',
        fileName: file.name,
      });
      if (saved) {
        const pageInfo = result.pages > 0 ? `${result.pages} pages · ` : '';
        setStatusMessage(
          `Extracted ${file.name} (${pageInfo}${saved.wordCount.toLocaleString()} words).`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not extract text from this PDF. Please paste your notes manually.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleLoadSample = (sample: SampleNote) => {
    setError(null);
    const saved = persistCurrentNote({
      id: sample.id,
      title: sample.title,
      content: sample.content,
      sourceType: 'sample',
      fileName: undefined,
    });
    if (saved) {
      setStatusMessage(`Loaded sample notes: ${sample.title}`);
    }
  };

  const handleSaveManual = () => {
    setError(null);
    const saved = persistCurrentNote();
    if (saved) {
      setStatusMessage('Study notes saved and ready for AI tools.');
    }
  };

  const handleLaunchTool = (section: NavSection) => {
    setError(null);
    const saved = persistCurrentNote();
    if (saved) {
      onNavigateAndRun(section);
    }
  };

  const wordCount = countWords(content);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Notes Editor & File Uploader */}
        <div className="lg:col-span-8 space-y-6">
          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-6 transition-colors ${
              isDragging
                ? 'border-sky-500 bg-sky-50'
                : 'border-sky-200 bg-white hover:border-sky-300'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  {isExtracting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {isExtracting ? 'Extracting text from PDF...' : 'Upload PDF or TXT Study Notes'}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Drag and drop a .pdf or .txt file here, or choose a file from your device.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isExtracting}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <FileText className="h-4 w-4" />
                <span>{isExtracting ? 'Processing...' : 'Choose File'}</span>
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && !error && (
            <div className="flex items-start gap-3 rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-900">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-sky-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Notes Editor */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Study Notes Editor</h2>
                <p className="text-xs text-slate-500">
                  Paste lecture notes manually or review extracted file content below
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono tabular-nums">
                <span>{wordCount.toLocaleString()} words</span>
                <span aria-hidden="true">·</span>
                <span>{content.length.toLocaleString()} chars</span>
              </div>
            </div>

            <div>
              <label htmlFor="note-title" className="block text-xs font-medium text-slate-600 mb-1.5">
                Topic / Note Title
              </label>
              <input
                id="note-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Biology Chapter 7: Cellular Respiration"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label htmlFor="note-content" className="block text-xs font-medium text-slate-600 mb-1.5">
                Study Content
              </label>
              <textarea
                id="note-content"
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your lecture notes, textbook excerpts, or study outline here..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-sm text-slate-900 leading-relaxed placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveManual}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <span>Save Notes</span>
                </button>
                <button
                  type="button"
                  onClick={handleNewBlank}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Blank</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLaunchTool('summarizer')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 border border-sky-200 px-3.5 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors whitespace-nowrap"
                >
                  <BookOpenCheck className="h-3.5 w-3.5" />
                  <span>Summarize</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchTool('quiz')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 border border-sky-200 px-3.5 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors whitespace-nowrap"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Generate Quiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchTool('flashcards')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 border border-sky-200 px-3.5 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors whitespace-nowrap"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Flashcards</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sample Notes & Saved Library */}
        <div className="lg:col-span-4 space-y-6">
          {/* Sample Notes */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5">
            <h2 className="text-base font-semibold text-slate-900">Sample Notes for Testing</h2>
            <p className="mt-1 text-xs text-slate-500">
              Load ready-made academic notes with one click to test AI summarization, quizzes, and flashcards.
            </p>
            <div className="mt-4 space-y-2.5">
              {SAMPLE_NOTES.map((sample) => {
                const isSelected = editingId === sample.id;
                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleLoadSample(sample)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                      isSelected
                        ? 'border-sky-300 bg-sky-50/70'
                        : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/30'
                    }`}
                  >
                    <p className="text-xs font-medium text-sky-700">{sample.subject}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{sample.title}</p>
                    <p className="mt-1 text-xs text-slate-500 tabular-nums">
                      {countWords(sample.content)} words · Click to load
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Saved Notes Library */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">Saved Notes</h2>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {noteSets.length}
              </span>
            </div>

            {noteSets.length > 0 ? (
              <div className="mt-3 divide-y divide-slate-100">
                {noteSets.map((note) => {
                  const isCurrent = activeNote?.id === note.id;
                  return (
                    <div
                      key={note.id}
                      className="py-3 flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectNote(note.id);
                          syncFromNote(note);
                        }}
                        className="text-left min-w-0 flex-1"
                      >
                        <p
                          className={`text-sm truncate ${
                            isCurrent
                              ? 'font-semibold text-sky-700'
                              : 'font-medium text-slate-800 hover:text-sky-700'
                          }`}
                        >
                          {note.title}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">
                          {note.wordCount.toLocaleString()} words · {note.sourceType.toUpperCase()}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteNote(note.id);
                          if (editingId === note.id) {
                            handleNewBlank();
                          }
                        }}
                        aria-label={`Delete ${note.title}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                Saved and uploaded notes will appear here for quick switching.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
