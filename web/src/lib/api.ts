export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ApiErrorIssue {
  path?: Array<string | number>;
  message?: string;
}

interface ErrorPayload {
  error?: string;
  issues?: ApiErrorIssue[];
}

export class ApiError extends Error {
  status: number;
  issues?: ApiErrorIssue[];

  constructor(message: string, status: number, issues?: ApiErrorIssue[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.issues = issues;
  }
}

const BASE_URL = (
  import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000'
).replace(/\/$/, '');

/**
 * The access token lives in memory only. A page refresh obtains a new one
 * through the httpOnly refresh cookie (`POST /auth/refresh`).
 */
let accessToken: string | null = null;
let refreshPromise: Promise<User | null> | null = null;
let sessionExpiredHandler: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

export interface RequestOptions extends RequestInit {
  /** Auth screens must surface a 401 directly instead of trying to refresh. */
  skipAuthRefresh?: boolean;
}

function isAuthEntryPoint(path: string): boolean {
  return (
    path === '/auth/login' ||
    path === '/auth/register' ||
    path === '/auth/refresh' ||
    path === '/auth/logout'
  );
}

async function request(path: string, options: RequestOptions = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
}

async function toApiError(response: Response): Promise<ApiError> {
  let payload: ErrorPayload | undefined;
  try {
    payload = (await response.json()) as ErrorPayload;
  } catch {
    payload = undefined;
  }

  return new ApiError(
    payload?.error ?? `La solicitud falló (${response.status})`,
    response.status,
    payload?.issues,
  );
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

interface RefreshResponse {
  user: User;
  accessToken: string;
}

/**
 * Refreshes the session once, even when several requests discover a 401 at
 * the same time. Concurrent callers share the same promise.
 */
export function refreshSession(): Promise<User | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const pending = (async (): Promise<User | null> => {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        accessToken = null;
        return null;
      }
      const data = (await response.json()) as RefreshResponse;
      accessToken = data.accessToken;
      return data.user;
    } catch {
      accessToken = null;
      return null;
    }
  })();

  refreshPromise = pending;
  void pending.finally(() => {
    if (refreshPromise === pending) {
      refreshPromise = null;
    }
  });

  return pending;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await request(path, options);

  if (
    response.status !== 401 ||
    options.skipAuthRefresh ||
    isAuthEntryPoint(path)
  ) {
    return readResponse<T>(response);
  }

  const user = await refreshSession();
  if (!user) {
    sessionExpiredHandler?.();
    throw await toApiError(response);
  }

  const retried = await request(path, options);
  if (retried.status === 401) {
    accessToken = null;
    sessionExpiredHandler?.();
  }
  return readResponse<T>(retried);
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match?.[1]?.trim() || null;
}

/**
 * Downloads an authenticated binary/markdown response. Needed for the TODO
 * export, which is protected by the Bearer token.
 */
export async function apiFetchFile(
  path: string,
): Promise<{ blob: Blob; filename: string | null }> {
  const parse = async (response: Response) => {
    if (!response.ok) {
      throw await toApiError(response);
    }
    return {
      blob: await response.blob(),
      filename: filenameFromDisposition(
        response.headers.get('Content-Disposition'),
      ),
    };
  };

  const response = await request(path);
  if (response.status !== 401) {
    return parse(response);
  }

  const user = await refreshSession();
  if (!user) {
    sessionExpiredHandler?.();
    throw await toApiError(response);
  }

  const retried = await request(path);
  if (retried.status === 401) {
    accessToken = null;
    sessionExpiredHandler?.();
  }
  return parse(retried);
}

interface AuthResponse {
  user: User;
  accessToken: string;
}
export async function loginRequest(
  email: string,
  password: string,
): Promise<User> {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuthRefresh: true,
  });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function registerRequest(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const data = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
    skipAuthRefresh: true,
  });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', {
      method: 'POST',
      skipAuthRefresh: true,
    });
  } finally {
    setAccessToken(null);
  }
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.issues?.[0]?.message
      ? `${error.message}: ${error.issues[0].message}`
      : error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Algo salió mal. Intentá de nuevo.';
}
