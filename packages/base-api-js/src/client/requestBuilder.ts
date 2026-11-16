/**
 * Centralizes default header construction and query/path param
 * interpolation so `BaseClient` and every resource client that extends it
 * call into this instead of duplicating string-building.
 *
 * Generalized from `playwright-test-automation`'s
 * `api/helpers/request-builder.helper.ts`: that file's `getApiBaseUrl()`
 * read a hardcoded `env.API_BASE_URL` global, which doesn't fit a base
 * framework consumed by many repos with different base URLs. `BaseClient`
 * now takes `baseUrl` as a constructor parameter instead (dependency
 * injection — each consumer's own config module supplies it), so this
 * module keeps only the parts that were already AUT-agnostic.
 */

export function buildDefaultHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Interpolates `:paramName` path segments, e.g.
 * `buildPath('/users/:id', { id: 42 })` -> `/users/42`.
 */
export function buildPath(path: string, pathParams?: Record<string, string | number>): string {
  if (!pathParams) {
    return path;
  }

  return Object.entries(pathParams).reduce(
    (acc, [key, value]) => acc.replace(`:${key}`, encodeURIComponent(String(value))),
    path,
  );
}

/**
 * Appends a query string built from `queryParams`, skipping
 * `undefined`/`null` values.
 */
export function buildQuery(queryParams?: Record<string, string | number | boolean | undefined>): string {
  if (!queryParams) {
    return '';
  }

  const entries = Object.entries(queryParams).filter(([, value]) => value !== undefined && value !== null);

  if (entries.length === 0) {
    return '';
  }

  const search = new URLSearchParams();
  for (const [key, value] of entries) {
    search.set(key, String(value));
  }

  return `?${search.toString()}`;
}
