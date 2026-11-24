import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Folder,
  RefreshCw,
  Settings,
  Users,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { MembersModal } from '../components/project/MembersModal';
import { NotesCard } from '../components/project/NotesCard';
import { ProjectLinks } from '../components/project/ProjectLinks';
import { SettingsModal } from '../components/project/SettingsModal';
import { TasksCard, type AssigneeFilter } from '../components/project/TasksCard';
import { TodayCard } from '../components/project/TodayCard';
import { ApiError } from '../lib/api';
import { useMembers } from '../lib/collab';
import { initials } from '../lib/format';
import { useProject } from '../lib/storage/hooks';
import { useRepository } from '../lib/storage/useRepository';
import { usePageTitle } from '../lib/usePageTitle';

interface FilterOption {
  value: AssigneeFilter;
  label: string;
  badge?: string;
}

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const { mode } = useRepository();
  const session = mode === 'user' && status === 'authenticated';
  const { data: project, isLoading, isError, error, refetch } = useProject(id);

  const members = useMembers(id, session);
  const [membersOpen, setMembersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('all');
  const notesRef = useRef<HTMLDivElement>(null);

  usePageTitle(project ? project.name : 'Proyecto');

  useEffect(() => {
    if (location.hash !== '#notas' || isLoading || !project) return;
    const node = notesRef.current;
    if (!node) return;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    node.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    });
    node.focus({ preventScroll: true });
  }, [location.hash, isLoading, project]);

  const filterOptions = useMemo<FilterOption[]>(() => {
    if (!session) return [];
    const options: FilterOption[] = [
      { value: 'all', label: 'Todas' },
      { value: 'unassigned', label: 'Sin asignar' },
      { value: 'mine', label: 'Mías' },
    ];
    for (const member of members.data ?? []) {
      if (member.userId === user?.id) continue;
      options.push({
        value: member.userId,
        label: member.name,
        badge: initials(member.name),
      });
    }
    return options;
  }, [members.data, session, user?.id]);

  const activeFilter: AssigneeFilter = useMemo(() => {
    if (
      assigneeFilter === 'all' ||
      assigneeFilter === 'unassigned' ||
      assigneeFilter === 'mine'
    ) {
      return assigneeFilter;
    }
    return filterOptions.some((option) => option.value === assigneeFilter)
      ? assigneeFilter
      : 'all';
  }, [assigneeFilter, filterOptions]);

  if (isLoading) {
    return (
      <div className="space-y-5" aria-hidden="true">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-10 w-1/2 rounded-lg" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton mt-8 h-72 rounded-2xl" />
      </div>
    );
  }

  if (isError || !project) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="card mx-auto mt-6 max-w-lg p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
          <AlertCircle className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl text-ink">
          {notFound ? 'Proyecto no encontrado' : 'No pudimos abrir el proyecto'}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {notFound
            ? 'Puede que se haya borrado, que ya no seas miembro o que el link no exista.'
            : error instanceof Error
              ? error.message
              : 'Intentá de nuevo en unos segundos.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/" className="btn btn-md btn-primary">
            Volver a proyectos
          </Link>
          {!notFound && (
            <button
              type="button"
              className="btn btn-md btn-secondary"
              onClick={() => void refetch()}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  const CategoryIcon = project.category === 'personal' ? Folder : Briefcase;
  const categoryLabel =
    project.category === 'personal' ? 'Personal' : 'Trabajo';
  const isShared = project.role !== 'owner';
  const isOwner = project.role === 'owner';
  const canEdit = project.role !== 'viewer';
  const memberCount = members.data?.length;

  const goHome = () => navigate('/', { replace: true });

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Todos los proyectos
      </Link>

      <header className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="chip bg-accent-soft text-accent-ink">
              <CategoryIcon className="size-3.5" aria-hidden="true" />
              {categoryLabel}
            </span>
            {isShared && (
              <span className="chip border border-line bg-surface-muted text-ink-soft">
                <Users className="size-3.5" aria-hidden="true" />
                Compartido
              </span>
            )}
          </div>
          <h1 className="max-w-[28ch] break-words text-[2rem] leading-tight sm:text-[2.5rem]">
            {project.name}
          </h1>
          {project.subtitle && (
            <p className="mt-2 max-w-[65ch] text-base text-ink-soft">
              {project.subtitle}
            </p>
          )}
          {project.description && (
            <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {session && (
            <button
              type="button"
              className="btn btn-md btn-secondary"
              onClick={() => setMembersOpen(true)}
            >
              <Users className="size-4" aria-hidden="true" />
              Miembros
              {typeof memberCount === 'number' && (
                <span className="chip bg-surface-muted text-ink-muted">
                  {memberCount}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            className="btn btn-md btn-secondary"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="size-4" aria-hidden="true" />
            Ajustes
          </button>
        </div>
      </header>

      {project.links.length > 0 && (
        <div className="mt-5">
          <ProjectLinks projectName={project.name} links={project.links} />
        </div>
      )}

      {session && filterOptions.length > 0 && (
        <div
          role="group"
          aria-label="Filtrar tareas por persona"
          className="mt-5 flex flex-wrap items-center gap-2"
        >
          {filterOptions.map((option) => {
            const active = activeFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setAssigneeFilter(option.value)}
                className={`btn btn-sm rounded-full ${
                  active
                    ? 'btn-primary'
                    : 'border border-line bg-surface text-ink-soft shadow-control hover:border-line-strong hover:bg-surface-muted hover:text-ink'
                }`}
              >
                {option.badge && (
                  <span
                    className={`grid size-5 place-items-center rounded-full text-[10px] font-bold ${
                      active
                        ? 'bg-[var(--color-on-accent)]/20'
                        : 'bg-accent-soft text-accent-ink'
                    }`}
                    aria-hidden="true"
                  >
                    {option.badge}
                  </span>
                )}
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-3 lg:items-stretch">
        <div className="flex flex-col lg:col-span-2">
          <TasksCard
            projectId={project.id}
            canEdit={canEdit}
            isSession={session}
            members={members.data ?? []}
            currentUserId={user?.id ?? null}
            assigneeFilter={activeFilter}
          />
        </div>

        <div className="flex flex-col gap-5">
          <div
            ref={notesRef}
            id="notas"
            tabIndex={-1}
            className="scroll-mt-24 outline-none"
          >
            <NotesCard
              projectId={project.id}
              canEdit={canEdit}
              isOwner={isOwner}
              session={session}
            />
          </div>
          <div className="flex flex-1 flex-col">
            <TodayCard />
          </div>
        </div>
      </div>

      {membersOpen && (
        <MembersModal
          projectId={project.id}
          currentUserId={user?.id ?? null}
          isOwner={isOwner}
          onClose={() => setMembersOpen(false)}
          onLeft={goHome}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          project={project}
          isGuest={!session}
          isOwner={isOwner}
          canEditLinks={canEdit}
          currentUserId={user?.id ?? null}
          onClose={() => setSettingsOpen(false)}
          onDeleted={goHome}
          onLeft={goHome}
        />
      )}
    </div>
  );
}
