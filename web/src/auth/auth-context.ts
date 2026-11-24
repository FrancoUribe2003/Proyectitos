import { createContext, useContext } from 'react';
import type { User } from '../lib/api';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

export interface AuthState {
  user: User | null;
  status: AuthStatus;
}

export interface AuthContextValue extends AuthState {
  login(email: string, password: string): Promise<void>;
  register(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<void>;
  logout(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
