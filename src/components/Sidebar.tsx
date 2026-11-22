import {
  LayoutDashboard,
  FileText,
  BookOpenCheck,
  HelpCircle,
  Layers,
  GraduationCap,
  X,
} from 'lucide-react';
import type { NavSection, NoteSet } from '../types';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  activeNote: NoteSet | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'notes', label: 'Study Notes', icon: FileText },
  { id: 'summarizer', label: 'AI Summarizer', icon: BookOpenCheck },
  { id: 'quiz', label: 'AI Quiz', icon: HelpCircle },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
];

export default function Sidebar({
  activeSection,
  onSelectSection,
  activeNote,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const handleNav = (section: NavSection) => {
    onSelectSection(section);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-sky-100 px-4 py-6">
      <div>
        <div className="flex items-center justify-between px-2 pb-6 border-b border-sky-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Smart Study AI
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-sky-50 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Primary navigation" className="mt-6 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200/80'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive ? 'text-sky-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-5 border-t border-sky-100 px-2">
        <p className="text-xs font-medium text-slate-400">Active Study Material</p>
        {activeNote ? (
          <div className="mt-1.5">
            <p className="text-sm font-semibold text-slate-800 truncate" title={activeNote.title}>
              {activeNote.title}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
              {activeNote.wordCount.toLocaleString()} words · {activeNote.sourceType.toUpperCase()}
            </p>
          </div>
        ) : (
          <p className="mt-1.5 text-xs text-slate-500">
            No notes loaded yet. Upload or select a sample to begin.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile & tablet drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
