import { isHttpUrl, LINK_META } from '../../lib/links';
import type { ProjectLink } from '../../lib/storage/types';

interface ProjectLinksProps {
  projectName: string;
  links: ProjectLink[];
}

export function ProjectLinks({ projectName, links }: ProjectLinksProps) {
  const visible = links.filter((link) => isHttpUrl(link.url));
  if (visible.length === 0) return null;

  return (
    <ul
      className="flex flex-wrap items-center gap-2"
      aria-label={`Links de ${projectName}`}
    >
      {visible.map((link) => {
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
              aria-label={`${label} de ${projectName} (abre en una pestaña nueva)`}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
