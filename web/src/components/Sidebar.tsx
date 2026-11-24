import { useMemo, useState } from 'react';
import {
  Briefcase,
  ChevronDown,
  Folder,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useProjects } from '../lib/storage/hooks';
import { filterProjects, useSearch } from '../lib/search';
import type { Project, ProjectCategory } from '../lib/storage/types';
import { Logo } from './Logo';
import { UserMenu } from './UserMenu';

interface SidebarContentProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onClose?: () => void;
  onNavigate?: () => void;
}

interface GroupDefinition {
  key: ProjectCategory;
  label: string;
  icon: LucideIcon;
}

const GROUPS: GroupDefinition[] = [
  { key: 'personal', label: 'Personal', icon: Folder },
  { key: 'trabajo', label: 'Trabajo', icon: Briefcase },
];

function projectInitial(project: Project): string {
  return project.name.trim().slice(0, 1).toLocaleUpperCase('es') || '·';
}

function SidebarSkeleton() {
  return (
    <div className="space-y-2 px-1" aria-hidden="true">
      <div className="skeleton h-6 rounded-lg" />
      <div className="skeleton h-8 rounded-lg" />
      <div className="skeleton h-8 rounded-lg" />
      <div className="skeleton mt-4 h-6 w-3/4 rounded-lg" />
      <div className="skeleton h-8 rounded-lg" />
    </div>
  );
}

export function SidebarContent({
  collapsed = false,
  onToggleCollapsed,
  onClose,
  onNavigate,
}: SidebarContentProps) {
  const location = useLocation();
  const { data: projects, isLoading, isError } = useProjects();
  const { normalizedQuery } = useSearch();
  const [openGroups, setOpenGroups] = useState<Record<ProjectCategory, boolean>>(
    { personal: true, trabajo: true },
  );

  const filtered = useMemo(
    () => filterProjects(projects, normalizedQuery),
    [projects, normalizedQuery],
  );

  const groups = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        projects: filtered.filter((project) => project.category === group.key),
        total: (projects ?? []).filter(
          (project) => project.category === group.key,
        ).length,
      })),
    [filtered, projects],
  );

  const toggleGroup = (key: ProjectCategory) => {
    setOpenGroups((current) => ({ ...current, [key]: !current[key] }));
  };

  const isProjectActive = (project: Project) =>
    location.pathname.startsWith(`/p/${project.id}`);

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <div
        className={`shrink-0 ${
          collapsed
            ? 'flex flex-col items-center gap-2 px-2 pb-3 pt-4'
            : 'flex flex-col items-start gap-2 px-4 pb-4 pt-5'
        }`}
      >
        {onClose ? (
          <div className="flex w-full items-center justify-between gap-2">
            <Logo compact={collapsed} />
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label="Cerrar menú"
              autoFocus
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <Logo compact={collapsed} />
            {onToggleCollapsed && (
              <button
                type="button"
                className="icon-btn"
                onClick={onToggleCollapsed}
                aria-label={
                  collapsed
                    ? 'Expandir barra lateral'
                    : 'Colapsar barra lateral'
                }
                title={
                  collapsed
                    ? 'Expandir barra lateral'
                    : 'Colapsar barra lateral'
                }
                aria-pressed={collapsed}
              >
                {collapsed ? (
                  <PanelLeftOpen className="size-5" aria-hidden="true" />
                ) : (
                  <PanelLeftClose className="size-5" aria-hidden="true" />
                )}
              </button>
            )}
          </>
        )}
      </div>

      <nav
        aria-label="Proyectos"
        className={`min-h-0 flex-1 overflow-y-auto pb-4 ${
          collapsed ? 'px-2' : 'px-3'
        }`}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            {isLoading && <SidebarSkeleton />}
            {isError && (
              <span
                className="px-1 text-center text-[11px] leading-tight text-danger"
                title="No se pudieron cargar los proyectos"
              >
                Error
              </span>
            )}
            {!isLoading &&
              !isError &&
              filtered.map((project) => {
                const active = isProjectActive(project);
                return (
                  <Link
                    key={project.id}
                    to={`/p/${project.id}`}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    aria-label={`${project.name}${
                      project.role !== 'owner' ? ' (compartido)' : ''
                    }`}
                    title={`${project.name} · ${
                      project.category === 'personal' ? 'Personal' : 'Trabajo'
                    }${project.role !== 'owner' ? ' · Compartido' : ''}`}
                    className={`grid size-9 place-items-center rounded-lg text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-accent-soft text-accent-ink'
                        : 'text-ink-soft hover:bg-surface-muted hover:text-ink'
                    }`}
                  >
                    {projectInitial(project)}
                  </Link>
                );
              })}
            {!isLoading && !isError && filtered.length === 0 && (
              <Folder
                className="size-5 text-ink-muted"
                aria-hidden="true"
              />
            )}
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between px-2">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                Proyectos
              </h2>
              {typeof projects !== 'undefined' && (
                <span className="text-[10px] font-semibold tabular-nums text-ink-muted">
                  {projects.length}
                </span>
              )}
            </div>

            {isLoading && <SidebarSkeleton />}
            {isError && (
              <p className="rounded-lg bg-danger-soft px-2.5 py-2 text-xs leading-snug text-danger">
                No se pudieron cargar los proyectos.
              </p>
            )}

            {!isLoading &&
              !isError &&
              groups.map((group) => {
                const open =
                  Boolean(normalizedQuery) || openGroups[group.key];
                const panelId = `sidebar-group-${group.key}`;
                return (
                  <section key={group.key} className="mb-2">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.key)}
                      aria-expanded={open}
                      aria-controls={panelId}
                      className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                    >
                      <group.icon
                        className="size-3.5 text-ink-muted"
                        aria-hidden="true"
                      />
                      <span>{group.label}</span>
                      <span className="ml-auto rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-ink-muted ring-1 ring-line">
                        {normalizedQuery ? group.projects.length : group.total}
                      </span>
                      <ChevronDown
                        className={`size-3.5 shrink-0 transition-transform ${
                          open ? '' : '-rotate-90'
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {open && (
                      <div id={panelId} className="mt-1">
                        {group.projects.length === 0 ? (
                          <p className="px-2 py-1.5 pl-7 text-xs text-ink-muted">
                            {normalizedQuery && group.total > 0
                              ? 'Sin coincidencias'
                              : 'Sin proyectos'}
                          </p>
                        ) : (
                          <ul className="space-y-0.5">
                            {group.projects.map((project) => {
                              const active = isProjectActive(project);
                              return (
                                <li key={project.id}>
                                  <Link
                                    to={`/p/${project.id}`}
                                    onClick={onNavigate}
                                    aria-current={active ? 'page' : undefined}
                                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                                      active
                                        ? 'bg-accent-soft font-semibold text-accent-ink'
                                        : 'text-ink-soft hover:bg-surface-muted hover:text-ink'
                                    }`}
                                  >
                                    <Folder
                                      className={`size-3.5 shrink-0 ${
                                        active
                                          ? 'text-accent'
                                          : 'text-ink-muted'
                                      }`}
                                      aria-hidden="true"
                                    />
                                    <span className="truncate">
                                      {project.name}
                                    </span>
                                    {project.role !== 'owner' && (
                                      <span
                                        className="ml-auto shrink-0 text-ink-muted"
                                        title={`Compartido · ${project.role}`}
                                      >
                                        <Users
                                          className="size-3.5"
                                          aria-label="Compartido"
                                        />
                                      </span>
                                    )}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
          </>
        )}
      </nav>

      <div
        className={`shrink-0 border-t border-line ${
          collapsed ? 'p-2' : 'p-3'
        }`}
      >
        <UserMenu collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
