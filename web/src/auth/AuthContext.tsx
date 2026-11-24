import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  loginRequest,
  logoutRequest,
  refreshSession,
  registerRequest,
  setSessionExpiredHandler,
  setAccessToken,
} from '../lib/api';
import {
  AuthContext,
  type AuthContextValue,
  type AuthState,
} from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    status: 'loading',
  });

  useEffect(() => {
    let active = true;

    void refreshSession().then((user) => {
      if (!active) return;
      setState({
        user,
        status: user ? 'authenticated' : 'guest',
      });
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setAccessToken(null);
      setState({ user: null, status: 'guest' });
      queryClient.clear();
    });

    return () => {
      setSessionExpiredHandler(null);
    };
  }, [queryClient]);

  const login = useCallback(
    async (email: string, password: string) => {
      const user = await loginRequest(email, password);
      queryClient.clear();
      setState({ user, status: 'authenticated' });
    },
    [queryClient],
  );

  const register = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const user = await registerRequest(input);
      queryClient.clear();
      setState({ user, status: 'authenticated' });
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setAccessToken(null);
      setState({ user: null, status: 'guest' });
      queryClient.clear();
    }
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, register, logout }),
    [state, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
