import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { SearchContext, type SearchContextValue } from './search';

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const clearQuery = useCallback(() => setQuery(''), []);

  const value = useMemo<SearchContextValue>(
    () => ({ query, normalizedQuery, setQuery, clearQuery }),
    [query, normalizedQuery, clearQuery],
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
