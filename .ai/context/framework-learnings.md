# Framework Learnings

Repo-specific learnings captured by pipeline runs (skills/agents under `.ai/`). Append new,
non-obvious, reusable lessons here — one bullet each, with the evidence that surfaced it. This
file is this repo's shared memory: `CLAUDE.md` imports it for Claude Code and `AGENTS.md` points
every other tool to it. Never store repo knowledge only in a tool-specific memory store.

- **A GitLab (and npm generally) package registry rejects re-publishing a version that already
  exists — check the registry's actual published versions (`npm view <pkg> versions --json
  --registry <url>`) before running `pnpm -r publish`, never assume the workspace version in
  `package.json` is unpublished.** All 8 `@qe/*-js` packages were already published at `0.1.0` on
  project `88594233` from an earlier run; confirmed by querying the registry directly, then
  bumped every package (root + all 8, single-workspace-version convention) to `0.1.1` before
  publishing again. `pnpm -r publish` gives no pre-flight warning for this — it fails per-package
  only once it actually attempts the push.
- **[NON-NEGOTIABLE] When a skill or agent actually runs a self-test that launches a real browser
  or binds a local mock-server port, never run it inside the default command sandbox — run it
  with the sandbox override from the start.** The sandboxed shell's filesystem and network
  restrictions produce failures that look like real framework defects but aren't (a Chromium
  profile "Operation not permitted" error; a blocked local socket bind). Don't try sandboxed
  first and fall back on failure — that wastes a run and risks a sandbox artifact being misread
  as evidence.
- **TypeScript 7.0 (the native/Go compiler, GA July 2026) breaks `typescript-eslint`'s
  type-aware linting: no importable compiler API yet, and `typescript-eslint`'s own
  `peerDependencies` range caps below `6.1.0`, so `pnpm install` fails outright with
  `typescript@7.x`.** Confirmed by actually running `pnpm install` against `typescript@^6.0.0`
  (which doesn't exist as a published version — see the next bullet) and separately checking the
  real npm registry's `typescript` dist-tags. Pin `typescript` to the 6.x line (this repo uses
  `6.0.3`, the latest real 6.x stable as of this writing) until `typescript-eslint` ships support
  (tracked against TypeScript 7.1, timing unconfirmed). Re-check before ever bumping past 6.x.
- **Don't trust a web search for an exact npm package version — verify against the real
  registry (or a sibling repo's already-verified lockfile) instead.** A web search claimed
  TypeScript `6.0.0` was the GA release; `pnpm install` rejected it outright
  (`ERR_PNPM_NO_MATCHING_VERSION`) because that exact version was never published — only
  `6.0.0-beta`/`6.0.0-dev.*` prereleases and later `6.0.2`/`6.0.3` stable releases exist. Caught
  immediately by actually running the install rather than trusting the search result; `pnpm view
<pkg> versions --json` (or `dist-tags`) is the ground truth.
- **A pnpm-workspace `.gitignore` pattern needs no leading slash to match inside every package,
  not just the repo root.** `/test-results/` only ignores `<repo>/test-results/`, not
  `packages/*/test-results/` — each package's own Playwright run leaves one. Use the unanchored
  form (`test-results/`, `playwright-report/`, `reports/`, etc.) in a monorepo's root
  `.gitignore` so it matches at every depth.
- **Playwright Test's `test.extend<TestFixtures, WorkerFixtures>` breaks if you pass
  `Record<string, never>` for an empty "no new test-scoped fixtures" generic — use `{}`
  instead.** `Record<string, never>`'s index signature (`[x: string]: never`) makes TypeScript
  infer `never` for the parameter of any _overridden built-in_ fixture (e.g. `context`) in the
  same `extend()` call, which doesn't type-check. `{}` is Playwright's own documented pattern for
  this case (seen in `@qe/base-web-js/src/fixtures.ts`, which overrides `context` while adding
  only a worker-scoped `sharedBrowser`) and needs a
  `// eslint-disable-next-line @typescript-eslint/no-empty-object-type` directly above it.
- **Check installed tool versions before trusting an example config value.** Before finalizing
  any file that pins or assumes a tool version (a CI runner's Node version, a Docker image tag,
  an ESLint config format), cross-check against what's actually installed/locked rather than
  copying an example verbatim — this exact mistake surfaced repeatedly in the sibling
  `playwright-test-automation` repo's own framework-scaffold history.
- **ESLint 9+ only supports flat config.** Use `eslint.config.mjs`, not `.eslintrc.*` — the
  legacy format was removed in ESLint 9.
- **Whether a package dependency belongs in `dependencies` or `devDependencies` is decided by
  whether the package's _public_ `src/index.ts` surface needs it at runtime — not by whether it's
  "just a test tool."** `@qe/base-web-js` originally had `@playwright/test` and `@faker-js/faker`
  under `devDependencies`, but `src/fixtures.ts` has a real value import (`import { test as base
} from '@playwright/test'`, then `base.extend(...)`) that's re-exported from `index.ts`, and
  `src/shared-browser/browser-server.mjs` value-imports `chromium`/`firefox`/`webkit` from
  `@playwright/test` to run as a spawned child process — and `src/testing/buildStateMarker.ts`
  (also re-exported from `index.ts`) imports `@faker-js/faker`. A consumer installing
  `@qe/base-web-js` as a bare `dependency` would NOT get either package (npm/pnpm don't install a
  dependency's own `devDependencies`), so both calls would throw `Cannot find module` at runtime.
  Moved both to `dependencies`. A `type`-only import (e.g. `import type { Page } from
'@playwright/test'` in `BasePage.ts`/`applyUiMutation.ts`/etc.) is erased at compile time and
  does _not_ need this — check each import individually, not file-by-file or package-by-package.
- **`@playwright/cli` and `@playwright/mcp` each pin their own `playwright`/`playwright-core`
  dependency (currently a `1.66.0-alpha-*` prerelease, independent of and newer than this repo's
  `@playwright/test@1.62.1`).** Confirmed via `pnpm view @playwright/cli dependencies`/`pnpm view
@playwright/mcp dependencies`. They bring their own separate browser-automation engine/binary
  set, not the one `@qe/bom-js` manages — don't assume installing them affects, or is affected
  by, the workspace's pinned `@playwright/test` version.
- **GitHub Actions reads `.github/workflows/*.yml` literally (no symlink resolution there).**
  The real workflow file must live at that exact path; if you want a `.ci/` folder entry for
  convention's sake too, make the symlink point the other way
  (`.ci/github/workflows/ci.yml` → `../../../.github/workflows/ci.yml`). Carried over from the
  sibling Java repo (`qe-bom-base-java`'s `CLAUDE.md`), where this was learned the hard way.
- **A base package's own `package.json` needs an explicit `"files"` allowlist (e.g. `["dist"]`)
  before its first publish — `.gitignore`-based exclusion silently drops `dist/` from the
  tarball.** When no `files` field and no `.npmignore` exist, npm falls back to `.gitignore` to
  decide what to pack, and this repo's root `.gitignore` ignores `dist/` (correctly, for git).
  Confirmed with `npm pack --dry-run`: without `"files": ["dist"]`, the packed tarball for
  `@qe/base-js` contained no `dist/` at all, even though `main`/`types` point there — every
  consumer install would have thrown `Cannot find module`. Caught before publishing, not after.
- **npm/pnpm refuse `${ENV_VAR}` substitution in a *project-level* `.npmrc` for registry/auth
  lines — only a user-level `~/.npmrc` honors it.** `pnpm install`/`publish` printed `Ignored
  //<registry>:_authToken from <repo>/.npmrc: a project .npmrc cannot use environment variables
  in registry settings or credentials` and silently dropped the line. Fix: keep the non-secret
  `@scope:registry=...` mapping in the repo's `.npmrc` (fine to commit), but put the
  `//<registry>:_authToken=${TOKEN_VAR}` line in the publishing machine's own `~/.npmrc`
  (never committed) — this is a deliberate npm security control against a malicious package.json
  script reading secrets via a checked-in `.npmrc`, not a bug to work around.
- **A GitLab personal/project access token only authorizes the one project (or group) it was
  issued against — reading a *different* public project with the same token works, but pushing
  to that project's package registry 403s.** `GET /projects/:id` with a token scoped to project
  A returned 200 for an unrelated public project B (public read doesn't need project membership),
  masking the mismatch; `pnpm publish` to project B's npm registry then failed with
  `403 Forbidden`. Diagnosed via `GET /projects/:id` → `permissions.project_access` (`null` on
  the project the token doesn't belong to, a real `access_level` on the one it does) and
  `GET /user` on the token itself (username revealed it was a `project_<id>_bot_*` account tied to
  one specific project). When a publish 403s with an otherwise-valid token, check which project
  the token is actually scoped to before assuming a role/permission problem on the target
  project — they may simply be different projects.
- **GitLab package registry push needs at least Developer (`access_level: 30`) on the target
  project — Guest (`10`) reads fine but is not enough to publish.** Confirmed by checking
  `GET /projects/:id` → `permissions.project_access.access_level` before and after the project
  owner bumped a token's role: `10` → `30` is what turned a would-be `403 Forbidden` into a
  working publish. Check this field proactively before attempting a real publish with a new
  token, rather than discovering it from a failed publish.
- **A long-running interactive shell session (this Claude Code session's own Bash tool) can hold
  a stale snapshot of environment variables from before a profile file (`~/.zshrc`) was edited —
  plain `env` in a new Bash call does *not* re-source the profile if the session's underlying
  shell process predates the edit.** A newly-added `export FOO=...` in `~/.zshrc` was invisible
  to `env` in this session even though `grep` confirmed the line was there, while `zsh -lic 'env
| grep FOO'` (forcing a brand-new login+interactive shell) picked it up immediately. When a
  just-exported var isn't showing up, wrap the command that needs it in `zsh -lic '...'` (or
  equivalent for the user's shell) instead of assuming the export itself failed.
