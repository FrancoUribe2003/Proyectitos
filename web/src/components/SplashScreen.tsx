export function SplashScreen() {
  return (
    <div
      className="grid min-h-svh place-items-center bg-canvas px-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="relative grid size-14 place-items-center rounded-2xl bg-accent text-on-accent shadow-card">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="size-7"
          >
            <path
              d="M4.5 8.25h15M4.5 12h15M4.5 15.75h9"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <path
              d="M6.75 5.25h10.5c.828 0 1.5.672 1.5 1.5v10.5c0 .828-.672 1.5-1.5 1.5H6.75c-.828 0-1.5-.672-1.5-1.5V6.75c0-.828.672-1.5 1.5-1.5Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <p className="font-display text-2xl font-semibold text-ink">
            Proyectitos
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Preparando tus proyectos…
          </p>
        </div>
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-1.5 animate-pulse rounded-full bg-accent-line [animation-delay:0ms]" />
          <span className="size-1.5 animate-pulse rounded-full bg-accent-line [animation-delay:150ms]" />
          <span className="size-1.5 animate-pulse rounded-full bg-accent-line [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}
