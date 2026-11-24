/**
 * Only internal paths are valid redirect targets after auth. Anything that
 * could leave the app (protocol-relative or absolute URLs) is rejected.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//') || value.includes('://')) return null;
  return value;
}

export function withNext(path: string, next: string | null): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}
