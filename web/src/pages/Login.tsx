import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from 'lucide-react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { AuthShell } from '../components/AuthShell';
import { getApiErrorMessage } from '../lib/api';
import { safeNextPath, withNext } from '../lib/navigation';
import { usePageTitle } from '../lib/usePageTitle';

export function LoginPage() {
  usePageTitle('Iniciar sesión');
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to={next ?? '/'} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(next ?? '/', { replace: true });
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-7">
        <h1 className="text-[2rem] leading-tight sm:text-[2.25rem]">
          Bienvenido de nuevo
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Entrá para ver tus proyectos, notas y tareas.
        </p>
      </div>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-4"
      >
        <div>
          <label htmlFor="login-email" className="field-label">
            Email
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              id="login-email"
              name="email"
              type="email"
              className="field pl-9"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              spellCheck={false}
              required
              autoFocus
              placeholder="vos@ejemplo.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="field-label">
            Contraseña
          </label>
          <div className="relative">
            <LockKeyhole
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="field pl-9 pr-11"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              placeholder="Tu contraseña"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-danger-line bg-danger-soft px-3.5 py-3 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-md btn-primary w-full"
          disabled={submitting}
        >
          {submitting && (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          )}
          {submitting ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        ¿Todavía no tenés cuenta?{' '}
        <Link
          to={withNext('/register', next)}
          className="font-semibold text-accent-ink underline decoration-accent-line underline-offset-2 hover:decoration-accent"
        >
          Crear cuenta
        </Link>
      </p>

      <div className="mt-6 border-t border-line pt-5 text-center">
        <Link
          to="/"
          className="text-sm font-medium text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-accent"
        >
          Seguir como invitado
        </Link>
        <p className="mx-auto mt-2 max-w-[34ch] text-xs leading-relaxed text-ink-muted">
          Podés probar la app sin cuenta con un proyecto guardado en este
          navegador.
        </p>
      </div>
    </AuthShell>
  );
}
