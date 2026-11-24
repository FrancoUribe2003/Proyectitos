import { useMemo, useState } from 'react';
import {
  AlertCircle,
  FolderPlus,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { useGuestImport } from '../lib/guest-import-context';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { useProjects } from '../lib/storage/hooks';
import { filterProjects, useSearch } from '../lib/search';
import { usePageTitle } from '../lib/usePageTitle';
import type { Project } from '../lib/storage/types';

function EmptyIllustration() {
  return (
    <svg
      viewBox="0 0 220 150"
      role="img"
      aria-label="Ilustración de una pila de proyectos esperando ser creados"
      className="h-32 w-auto"
    >
      <rect
        x="32"
        y="38"
        width="132"
        height="84"
        rx="14"
        fill="var(--color-surface-muted)"
        stroke="var(--color-line)"
        strokeWidth="2"
      />
      <rect
        x="46"
        y="26"
        width="132"
        height="84"
        rx="14"
        fill="var(--color-surface)"
        stroke="var(--color-line-strong)"
        strokeWidth="2"
      />
      <path
        d="M64 48h76M64 62h52"
        stroke="var(--color-line-strong)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="166"
        cy="98"
        r="22"
        fill="var(--color-accent)"
        stroke="var(--color-surface)"
        strokeWidth="4"
      />
      <path
        d="M166 88v20M156 98h20"
        stroke="var(--color-on-accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M36 128c14-8 30-8 44 0"
        stroke="var(--color-accent-line)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <div key={index} className="card space-y-4 p-6">
          <div className="flex gap-2">
            <div className="skeleton h-6 w-24 rounded-full" />
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>
          <div className="skeleton h-6 w-2/5 rounded-lg" />
          <div className="skeleton h-4 w-3/5 rounded-lg" />
          <div className="skeleton h-4 w-full rounded-lg" />
          <div className="skeleton h-4 w-4/5 rounded-lg" />
          <div className="flex gap-2 pt-2">
            <div className="skeleton h-9 w-24 rounded-lg" />
            <div className="skeleton h-9 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NewProjectButton({
  guest,
  hasGuestProject,
  onClick,
}: {
  guest: boolean;
  hasGuestProject: boolean;
  onClick: () => void;
}) {
  const disabled = guest && hasGuestProject;

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        className="btn btn-md btn-primary"
        onClick={onClick}
        disabled={disabled}
        aria-describedby={disabled ? 'guest-limit' : undefined}
      >
        <Plus className="size-4" aria-hidden="true" />
        Nuevo proyecto
      </button>
      {disabled && (
        <p
          id="guest-limit"
          className="max-w-xs text-xs leading-relaxed text-ink-soft sm:text-right"
        >
          Como invitado solo podés tener un proyecto.{' '}
          <Link
            to="/login"
            className="font-semibold text-accent-ink underline decoration-accent-line underline-offset-2 hover:decoration-accent"
          >
            Iniciá sesión
          </Link>{' '}
          para crear más.
        </p>
      )}
    </div>
  );
}

export function HomePage() {
  usePageTitle('Proyectos');
  const { status } = useAuth();
  const { data: projects, isLoading, isError, error, refetch, isFetching } =
    useProjects();
  const { query, normalizedQuery, clearQuery } = useSearch();
  const { hasGuestProject: guestProjectPending, requestImport } =
    useGuestImport();
  const [formOpen, setFormOpen] = useState(false);

  const guest = status !== 'authenticated';
  const filtered = useMemo(
    () => filterProjects(projects, normalizedQuery),
    [projects, normalizedQuery],
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [filtered],
  );

  const hasProjects = Boolean(projects?.length);
  const guestHasProject = guest && hasProjects;
  const showNoResults =
    !isLoading && !isError && hasProjects && normalizedQuery && sorted.length === 0;

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[2rem] leading-tight sm:text-[2.5rem]">
            Proyectos
          </h1>
          <p className="mt-2 max-w-[55ch] text-sm leading-relaxed text-ink-soft sm:text-base">
            Todo lo que estás construyendo, con su TODO y sus notas a mano.
          </p>
        </div>
        <NewProjectButton
          guest={guest}
          hasGuestProject={guestHasProject}
          onClick={() => setFormOpen(true)}
        />
      </div>

      {guest && !guestHasProject && !isLoading && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-accent-line bg-accent-soft px-4 py-3 text-sm text-accent-ink">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Estás en modo invitado: podés probar todo con un proyecto guardado
            solo en este navegador.
          </p>
        </div>
      )}

      {!guest && guestProjectPending && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-accent-line bg-accent-soft px-4 py-3 text-sm text-accent-ink">
          <Sparkles className="size-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1">
            Tenés un proyecto de invitado guardado en este navegador. Podés
            importarlo a tu cuenta.
          </p>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={requestImport}
          >
            Importarlo
          </button>
        </div>
      )}

      {isLoading && <HomeSkeleton />}

      {isError && (
        <div className="card flex flex-col items-start gap-4 p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
              <AlertCircle className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg text-ink">
                No pudimos cargar tus proyectos
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {error instanceof Error
                  ? error.message
                  : 'Revisá tu conexión e intentá de nuevo.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-md btn-secondary"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && !hasProjects && (
        <div className="card flex flex-col items-center px-6 py-12 text-center sm:py-16">
          <EmptyIllustration />
          <h2 className="mt-6 text-xl text-ink sm:text-2xl">
            Tu primer proyecto empieza acá
          </h2>
          <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-ink-soft">
            Creá un proyecto y tené su TODO, sus notas y sus links en un solo
            lugar. Sin planillas sueltas.
          </p>
          <button
            type="button"
            className="btn btn-md btn-primary mt-6"
            onClick={() => setFormOpen(true)}
          >
            <FolderPlus className="size-4" aria-hidden="true" />
            Crear mi primer proyecto
          </button>
        </div>
      )}

      {showNoResults && (
        <div className="card flex flex-col items-center px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-surface-muted text-ink-muted">
            <Search className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl text-ink">Sin resultados</h2>
          <p className="mt-2 max-w-[44ch] text-sm text-ink-soft">
            No encontramos proyectos que coincidan con “{query.trim()}”. Probá
            con otro nombre o subtítulo.
          </p>
          <button
            type="button"
            className="btn btn-sm btn-secondary mt-5"
            onClick={clearQuery}
          >
            Limpiar búsqueda
          </button>
        </div>
      )}

      {!isLoading && !isError && sorted.length > 0 && (
        <>
          {normalizedQuery && (
            <p className="mb-3 text-sm text-ink-soft" aria-live="polite">
              {sorted.length === 1
                ? '1 proyecto encontrado'
                : `${sorted.length} proyectos encontrados`}
            </p>
          )}
          <div className="space-y-4">
            {sorted.map((project: Project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </>
      )}

      {formOpen && <ProjectFormModal onClose={() => setFormOpen(false)} />}
    </div>
  );
}
