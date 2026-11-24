import { useEffect, useRef } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { useSearch } from '../lib/search';

interface TopbarProps {
  onOpenSidebar: () => void;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
}

export function Topbar({
  onOpenSidebar,
  sidebarOpen,
  sidebarCollapsed,
}: TopbarProps) {
  const { query, setQuery, clearQuery } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');

      if (
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTyping &&
        !document.querySelector('dialog[open]')
      ) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/90 backdrop-blur-md">
      <div className="grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-5">
        <button
          type="button"
          className="icon-btn col-start-1 lg:hidden"
          onClick={onOpenSidebar}
          aria-label="Abrir menú de navegación"
          aria-expanded={sidebarOpen}
          aria-controls={sidebarOpen ? 'mobile-navigation' : undefined}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        {/*
          On desktop the search is pulled toward the viewport centre (which is
          half the sidebar width to the left of the content centre). The width
          cap keeps it clear of the expanded sidebar on smaller screens.
        */}
        <div
          className={`col-start-2 mx-auto w-full max-w-xl ${
            sidebarCollapsed
              ? 'lg:max-w-[min(36rem,calc(100vw-11.5rem))] lg:-translate-x-[0.875rem]'
              : 'lg:max-w-[min(36rem,calc(100vw-37rem))] lg:-translate-x-[7.25rem]'
          }`}
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && query) {
                  event.preventDefault();
                  clearQuery();
                }
              }}
              placeholder="Buscar por nombre o subtítulo…"
              aria-label="Buscar proyectos"
              aria-keyshortcuts="/"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              className="h-10 w-full rounded-full border border-line bg-surface pl-9 pr-16 text-sm text-ink shadow-control transition-colors placeholder:text-ink-muted hover:border-line-strong focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/15 [&::-webkit-search-cancel-button]:hidden"
            />
            <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    clearQuery();
                    inputRef.current?.focus();
                  }}
                  className="grid size-6 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              ) : (
                <kbd
                  className="hidden h-6 min-w-6 items-center justify-center rounded-md border border-line bg-surface-muted px-1.5 font-sans text-[11px] font-semibold text-ink-muted sm:inline-flex"
                  aria-hidden="true"
                >
                  /
                </kbd>
              )}
            </div>
          </div>
        </div>

        <div className="col-start-3 size-10" aria-hidden="true" />
      </div>
    </header>
  );
}
