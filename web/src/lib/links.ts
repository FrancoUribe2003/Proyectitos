import {
  Database,
  FolderGit2,
  Link2,
  Monitor,
  Server,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ProjectLinkType } from './storage/types';

export const LINK_META: Record<
  ProjectLinkType,
  { label: string; icon: LucideIcon }
> = {
  repo: { label: 'Repo', icon: FolderGit2 },
  front: { label: 'Front', icon: Monitor },
  back: { label: 'Back', icon: Server },
  db: { label: 'DB', icon: Database },
  other: { label: 'Link', icon: Link2 },
};

export const LINK_TYPE_OPTIONS: Array<{
  value: ProjectLinkType;
  label: string;
}> = [
  { value: 'repo', label: 'Repo' },
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'db', label: 'Base de datos' },
  { value: 'other', label: 'Otro' },
];

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
