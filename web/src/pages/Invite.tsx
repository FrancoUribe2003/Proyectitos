import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  LoaderCircle,
  MailCheck,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { Logo } from '../components/Logo';
import { ApiError, getApiErrorMessage } from '../lib/api';
import { acceptInvite, fetchInvite } from '../lib/collab';
import { usePageTitle } from '../lib/usePageTitle';

export function InvitePage() {
  usePageTitle('Invitación');
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { status } = useAuth();
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const invite = useQuery({
    queryKey: ['invite', token],
    queryFn: () => fetchInvite(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  });

  const invalid =
    invite.isError && invite.error instanceof ApiError && invite.error.status === 404;
  const next = `/invite/${encodeURIComponent(token)}`;
  const roleText =
    invite.data?.role === 'editor' ? 'Editor' : 'Solo lectura';

  const handleJoin = async () => {
    setJoinError(null);
    setJoining(true);
    try {
      const result = await acceptInvite(token);
      navigate(`/p/${result.projectId}`, { replace: true });
    } catch (error) {
      setJoinError(getApiErrorMessage(error));
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-canvas px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <div className="card p-6 sm:p-8">
          {invite.isPending && (
            <div className="space-y-3" aria-live="polite">
              <div className="skeleton h-6 w-2/3 rounded-lg" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-4/5 rounded" />
              <span className="sr-only">Cargando invitación…</span>
            </div>
          )}

          {invite.isError && (
            <div className="text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
                <AlertCircle className="size-5" aria-hidden="true" />
              </span>
              <h1 className="mt-4 text-2xl text-ink">
                Invitación inválida o vencida
              </h1>
              <p className="mt-2 text-sm text-ink-soft">
                {invalid
                  ? 'Pedile a quien te invitó un link nuevo.'
                  : getApiErrorMessage(invite.error)}
              </p>
              <Link to="/" className="btn btn-md btn-primary mt-6">
                Ir a Proyectitos
              </Link>
            </div>
          )}

          {invite.data && (
            <div>
              <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-ink">
                <MailCheck className="size-5" aria-hidden="true" />
              </span>
              <h1 className="mt-4 text-2xl leading-tight text-ink">
                Te invitaron a «{invite.data.projectName}» como {roleText}
              </h1>
              <p className="mt-2 text-sm text-ink-soft">
                Invitación de {invite.data.invitedBy}.
              </p>

              {status === 'authenticated' ? (
                <div className="mt-6">
                  <button
                    type="button"
                    className="btn btn-md btn-primary w-full"
                    onClick={() => void handleJoin()}
                    disabled={joining}
                  >
                    {joining ? (
                      <LoaderCircle
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <ArrowRight className="size-4" aria-hidden="true" />
                    )}
                    {joining ? 'Uniéndome…' : 'Unirme'}
                  </button>
                  {joinError && (
                    <p role="alert" className="mt-3 text-sm text-danger">
                      {joinError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-6 space-y-2">
                  <Link
                    to={`/login?next=${encodeURIComponent(next)}`}
                    className="btn btn-md btn-primary w-full"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to={`/register?next=${encodeURIComponent(next)}`}
                    className="btn btn-md btn-secondary w-full"
                  >
                    Crear cuenta
                  </Link>
                  <p className="pt-2 text-center text-xs leading-relaxed text-ink-muted">
                    Necesitás una cuenta para unirte. Después de entrar volvés
                    a esta invitación.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-ink-muted">
          Proyectitos · tus proyectos, en orden
        </p>
      </div>
    </div>
  );
}
