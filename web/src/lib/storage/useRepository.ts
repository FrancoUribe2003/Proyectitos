import { useMemo } from 'react';
import { useAuth } from '../../auth/auth-context';
import { localRepository } from './local';
import { apiRepository } from './remote';
import type { ProjectRepository } from './types';

export type RepositoryMode = 'guest' | 'user';

export interface RepositoryHandle {
  /** Included in every query key so guest and account caches never mix. */
  mode: RepositoryMode;
  repository: ProjectRepository;
}

export function useRepository(): RepositoryHandle {
  const { status } = useAuth();
  const mode: RepositoryMode = status === 'authenticated' ? 'user' : 'guest';

  return useMemo(
    () => ({
      mode,
      repository: mode === 'user' ? apiRepository : localRepository,
    }),
    [mode],
  );
}
