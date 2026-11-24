import { createContext, useContext } from 'react';

export interface GuestImportContextValue {
  hasGuestProject: boolean;
  requestImport: () => void;
}

export const GuestImportContext =
  createContext<GuestImportContextValue | null>(null);

export function useGuestImport(): GuestImportContextValue {
  const context = useContext(GuestImportContext);
  if (!context) {
    throw new Error('useGuestImport debe usarse dentro de GuestImportProvider');
  }
  return context;
}
