import {
  Briefcase,
  Folder,
  ListTodo,
  StickyNote,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { isHttpUrl, LINK_META } from '../lib/links';
import type { Project } from '../lib/storage/types';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const CategoryIcon = project.category === 'personal' ? Folder : Briefcase;
  const categoryLabel =
    project.category === 'personal' ? 'Personal' : 'Trabajo';
  const isShared = project.role !== 'owner';
  const openTasksLabel =
    project.openTasks === 0
      ? 'Sin tareas abiertas'
      : project.openTasks === 1
        ? '1 tarea abierta'
        : `${project.openTasks} tareas abiertas`;
  const visibleLinks = (project.links ?? []).filter((link) =>
    isHttpUrl(link.url),
  );

  return (
    <article className="card flex flex-col gap-5 p-5 transition-shadow duration-200 hover:shadow-float sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span className="chip bg-accent-soft text-accent-ink">
              <CategoryIcon className="size-3.5" aria-hidden="true" />
              {categoryLabel}
            </span>
            {isShared && (
              <span
                className="chip border border-line bg-surface-muted text-ink-soft"
                title={`Rol: ${project.role}`}
              >
                <Users className="size-3.5" aria-hidden="true" />
                Compartido
              </span>
            )}
          </div>
          <h2 className="text-xl leading-tight text-ink sm:text-[1.4rem]">
            <Link
              to={`/p/${project.id}`}
              className="rounded-sm decoration-accent-line decoration-2 underline-offset-4 transition-colors hover:text-accent-ink hover:underline"
            >
              {project.name}
            </Link>
          </h2>
          {project.subtitle && (
            <p className="mt-1 max-w-[60ch] text-sm text-ink-soft">
              {project.subtitle}
            </p>
          )}
        </div>

        <span className="chip border border-line bg-surface-muted text-ink-soft">
          <ListTodo className="size-3.5" aria-hidden="true" />
          {openTasksLabel}
        </span>
      </div>

      {project.description ? (
        <p className="line-clamp-2 max-w-[75ch] text-sm leading-relaxed text-ink-soft">
          {project.description}
        </p>
      ) : (
        <p className="max-w-[75ch] text-sm italic text-ink-muted">
          Sin descripción todavía.
        </p>
      )}

      <div className="mt-auto space-y-4">
        {visibleLinks.length > 0 && (
          <ul
            className="flex flex-wrap items-center gap-2"
            aria-label={`Links de ${project.name}`}
          >
            {visibleLinks.map((link) => {
              const meta = LINK_META[link.type] ?? LINK_META.other;
              const Icon = meta.icon;
              const label =
                link.type === 'other' && link.label.trim()
                  ? link.label.trim()
                  : meta.label;
              return (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-secondary"
                    aria-label={`${label} de ${project.name} (abre en una pestaña nueva)`}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/p/${project.id}`} className="btn btn-sm btn-soft">
            <ListTodo className="size-4" aria-hidden="true" />
            TODO
          </Link>
          <Link
            to={`/p/${project.id}#notas`}
            className="btn btn-sm btn-secondary"
          >
            <StickyNote className="size-4" aria-hidden="true" />
            Notas
          </Link>
        </div>
      </div>
    </article>
  );
}
