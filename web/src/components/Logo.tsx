import { Link } from 'react-router-dom';

interface LogoProps {
  compact?: boolean;
  to?: string;
  className?: string;
}

export function Logo({ compact = false, to = '/', className = '' }: LogoProps) {
  return (
    <Link
      to={to}
      aria-label="Proyectitos, ir al inicio"
      className={`group inline-flex items-center gap-3 rounded-xl ${className}`}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-on-accent shadow-control transition-colors group-hover:bg-accent-hover">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="size-5"
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
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate font-display text-[1.3rem] font-semibold leading-none tracking-tight text-ink">
            Proyectitos
          </span>
          <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            Tus proyectos en orden
          </span>
        </span>
      )}
    </Link>
  );
}
