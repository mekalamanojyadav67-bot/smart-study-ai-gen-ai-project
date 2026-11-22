import { useState } from 'react';
import {
  BookOpenCheck,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { generateSummary } from '../lib/api';
import type { NavSection, NoteSet, StudySummary } from '../types';

interface SummarizerViewProps {
  activeNote: NoteSet | null;
  summary: StudySummary | null;
  onSaveSummary: (summary: StudySummary) => void;
  onNavigate: (section: NavSection) => void;
}

export default function SummarizerView({
  activeNote,
  summary,
  onSaveSummary,
  onNavigate,
}: SummarizerViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!activeNote || !activeNote.content.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateSummary(activeNote.content, activeNote.title);
      onSaveSummary({
        noteId: activeNote.id,
        title: data.title || activeNote.title,
        overview: data.overview,
        importantPoints: data.importantPoints,
        difficultTopics: data.difficultTopics,
        keyTerms: data.keyTerms,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate summary. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!summary) return;
    const text = [
      `# ${summary.title}`,
      '',
      '## Overview',
      summary.overview,
      '',
      '## Important Points',
      ...summary.importantPoints.map((p) => `- ${p}`),
      '',
      '## Difficult Topics Explained Simply',
      ...summary.difficultTopics.map(
        (d) => `- ${d.topic}: ${d.simpleExplanation} (Analogy: ${d.analogy})`
      ),
      '',
      '## Key Terms',
      ...summary.keyTerms.map((k) => `- ${k.term}: ${k.definition}`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  if (!activeNote) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200/90 p-10 text-center max-w-xl mx-auto mt-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <FileText className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">No Study Notes Loaded</h2>
        <p className="mt-2 text-sm text-slate-600">
          Upload a PDF or TXT file, paste your notes, or select a sample topic before generating an AI summary.
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

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-sky-700">AI Notes Summarizer</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900 truncate">{activeNote.title}</h2>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {activeNote.wordCount.toLocaleString()} words ·{' '}
            {summary
              ? `Summarized ${new Date(summary.generatedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : 'Ready to summarize'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {summary && !isLoading && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
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
                ? 'Analyzing Notes...'
                : summary
                  ? 'Regenerate Summary'
                  : 'Generate Summary'}
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
            className="text-xs font-semibold text-red-800 underline hover:text-red-900 whitespace-nowrap self-start sm:self-auto"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-900">
            Generating your study summary with Gemini AI — this may take up to a minute for detailed notes.
          </div>
          <div className="space-y-6 animate-pulse">
            <div className="rounded-2xl bg-white border border-slate-200/90 p-6 space-y-3">
              <div className="h-5 w-40 rounded bg-sky-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-11/12 rounded bg-slate-100" />
              <div className="h-4 w-4/5 rounded bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white border border-slate-200/90 p-6 space-y-3">
                <div className="h-5 w-44 rounded bg-sky-100" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
                <div className="h-4 w-4/6 rounded bg-slate-100" />
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/90 p-6 space-y-3">
                <div className="h-5 w-48 rounded bg-sky-100" />
                <div className="h-16 w-full rounded-xl bg-slate-100" />
                <div className="h-16 w-full rounded-xl bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Initial Empty Prompt */}
      {!isLoading && !summary && (
        <div className="rounded-2xl bg-gradient-to-br from-sky-50/80 to-white border border-sky-200/80 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Ready to summarize "{activeNote.title}"
          </h3>
          <p className="mt-1.5 text-sm text-slate-600 max-w-lg mx-auto">
            Click Generate Summary to distill these notes into a clear overview, highlighted exam points, and simple-English breakdowns of tough concepts.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
          >
            <span>Generate Summary Now</span>
          </button>
        </div>
      )}

      {/* Populated AI Summary */}
      {!isLoading && summary && (
        <div className="space-y-6">
          {/* Overview */}
          <section className="rounded-2xl bg-white border border-slate-200/90 p-6">
            <h3 className="text-base font-semibold text-slate-900">Plain-English Overview</h3>
            <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed max-w-4xl">
              {summary.overview}
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Important Points */}
            <section className="lg:col-span-6 rounded-2xl bg-white border border-slate-200/90 p-6">
              <h3 className="text-base font-semibold text-slate-900">
                Important Points & Key Takeaways
              </h3>
              <ol className="mt-4 space-y-3">
                {summary.importantPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                    <span className="font-mono text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-md h-6 w-6 shrink-0 flex items-center justify-center tabular-nums mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ol>
            </section>

            {/* Key Terms */}
            <section className="lg:col-span-6 rounded-2xl bg-white border border-slate-200/90 p-6">
              <h3 className="text-base font-semibold text-slate-900">Core Vocabulary & Terms</h3>
              <dl className="mt-4 divide-y divide-slate-100">
                {summary.keyTerms.map((item, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0">
                    <dt className="text-sm font-semibold text-slate-900">{item.term}</dt>
                    <dd className="mt-1 text-sm text-slate-600 leading-relaxed">
                      {item.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {/* Difficult Topics Explained Simply */}
          <section className="rounded-2xl bg-sky-50/60 border border-sky-200/80 p-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-sky-600 shrink-0" />
              <h3 className="text-base font-semibold text-slate-900">
                Difficult Topics Explained in Simple English
              </h3>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.difficultTopics.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-white border border-sky-100 p-5 space-y-2.5"
                >
                  <h4 className="text-sm font-semibold text-slate-900">{item.topic}</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {item.simpleExplanation}
                  </p>
                  <p className="pt-2 border-t border-slate-100 text-xs text-sky-800 leading-relaxed">
                    <span className="font-semibold">Analogy: </span>
                    {item.analogy}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
