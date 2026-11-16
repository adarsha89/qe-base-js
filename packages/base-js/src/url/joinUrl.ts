/**
 * Joins a base URL and a path with exactly one `/` between them.
 *
 * Ported verbatim from `playwright-test-automation`'s `utils/url.ts` — fully
 * AUT-agnostic already. A `z.string().url()` env schema doesn't enforce a
 * trailing slash, so raw concatenation like `` `${baseUrl}inventory.html` ``
 * breaks as soon as the value is set without one. `joinUrl(base)` with no
 * path returns the base normalized to a single trailing slash, matching how
 * a browser reports a site's root URL.
 */
export function joinUrl(base: string, path = ''): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
