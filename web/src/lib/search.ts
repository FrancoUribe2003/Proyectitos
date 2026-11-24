import { createContext, useContext } from 'react';
import type { Project } from './storage/types';

export interface SearchContextValue {
  query: string;
  normalizedQuery: string;
  setQuery(value: string): void;
  clearQuery(): void;
}

export const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch debe usarse dentro de SearchProvider');
  }
  return context;
}

export function filterProjects(
  projects: Project[] | undefined,
  normalizedQuery: string,
): Project[] {
  if (!projects) return [];
  if (!normalizedQuery) return projects;

  return projects.filter((project) => {
    const haystack = `${project.name} ${project.subtitle ?? ''}`.toLocaleLowerCase(
      'es',
    );
    return haystack.includes(normalizedQuery);
  });
}
