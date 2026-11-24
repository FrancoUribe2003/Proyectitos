import { useEffect, useId, useRef, useState } from 'react';
import { ChevronUp, LogIn, LogOut, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';

interface UserMenuProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('es');
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toLocaleUpperCase('es');
}

export function UserMenu({ collapsed = false, onNavigate }: UserMenuProps) {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const firstItem = menuRef.current?.querySelector<HTMLElement>(
        '[role="menuitem"]',
      );
      firstItem?.focus();
    }
  }, [open]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setOpen(false);
      navigate('/', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  if (status !== 'authenticated' || !user) {
    if (collapsed) {
      return (
        <Link
          to="/login"
          onClick={onNavigate}
          className="icon-btn mx-auto text-accent hover:bg-accent-soft"
          aria-label="Iniciar sesión"
          title="Iniciar sesión"
        >
          <LogIn className="size-5" aria-hidden="true" />
        </Link>
      );
    }

    return (
      <div className="rounded-xl border border-line bg-surface-muted p-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink">
            <UserRound className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">Invitado</p>
            <p className="truncate text-xs text-ink-muted">
              Tus datos quedan en este navegador
            </p>
          </div>
        </div>
        <Link
          to="/login"
          onClick={onNavigate}
          className="btn btn-sm btn-secondary mt-3 w-full"
        >
          <LogIn className="size-4" aria-hidden="true" />
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={
          collapsed
            ? 'mx-auto grid size-10 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent-ink transition-colors hover:bg-accent/15'
            : 'flex w-full items-center gap-3 rounded-xl border border-line bg-surface-muted p-2.5 text-left transition-colors hover:border-line-strong hover:bg-surface'
        }
        title={collapsed ? `${user.name} · ${user.email}` : undefined}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent-ink">
          {initials(user.name)}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">
                {user.name}
              </span>
              <span className="block truncate text-xs text-ink-muted">
                {user.email}
              </span>
            </span>
            <ChevronUp
              className={`size-4 shrink-0 text-ink-muted transition-transform ${
                open ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </>
        )}
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Cuenta"
          className={`absolute z-50 rounded-xl border border-line bg-surface p-1.5 shadow-float ${
            collapsed
              ? 'bottom-0 left-[calc(100%+0.6rem)] w-64'
              : 'bottom-[calc(100%+0.5rem)] left-0 right-0'
          }`}
        >
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-ink">
              {user.name}
            </p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink disabled:opacity-60"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
          >
            <LogOut className="size-4" aria-hidden="true" />
            {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </div>
      )}
    </div>
  );
}
