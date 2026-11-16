# qe-base-js

A central TypeScript QE automation framework: a pnpm-workspace monorepo of paired **BOM**
packages (dependency-version pinning only, no code) and **base** packages (the real framework
code) that other QE repos consume — either by taking on a BOM's pinned, strictly-enforced
dependency versions (with a narrow, explicit override allowance), or by depending directly on a
base package's code. It mirrors the architecture of the sibling Java repo `qe-bom-base-java`,
translated to Node/TypeScript/pnpm.

See [`.ai/skills/_shared/framework-guidelines.md`](.ai/skills/_shared/framework-guidelines.md)
for the authoritative architecture reference (layering rules, the 10 design principles, and —
most importantly — the BOM dependency-enforcement/override mechanism in its §5). See
[`.ai/README.md`](.ai/README.md) for the AI-assistant tooling (skills/agents) that builds and
maintains this repo.

## Packages

| Package                                                     | Role                                                                                                                                                                                                                                                        | Status                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| [`@qe/bom-js`](packages/bom-js)                             | Version pins for the core slice                                                                                                                                                                                                                             | Real                                              |
| [`@qe/base-js`](packages/base-js)                           | Core: `joinUrl`, a structured `logger`, `createEnv` (typed/validated config factory), `isPlaywrightDebugMode`, the `MUTATION_ENABLED`/`MUTATION_ID` mutation-testing switch                                                                                 | Real                                              |
| [`@qe/bom-api-js`](packages/bom-api-js)                     | Version pins for the API-testing slice                                                                                                                                                                                                                      | Real                                              |
| [`@qe/base-api-js`](packages/base-api-js)                   | `BaseClient` (typed wrapper over Playwright's `APIRequestContext`, with `ApiError`), request-building helpers, response-assertion helpers                                                                                                                   | Real                                              |
| [`@qe/bom-web-js`](packages/bom-web-js)                     | Version pins for the web/E2E-testing slice                                                                                                                                                                                                                  | Real                                              |
| [`@qe/base-web-js`](packages/base-web-js)                   | `BasePage`, the **shared-browser execution model** (one detached browser process per engine per run, shared by every worker — see below), `applyUiMutation`, `waitForResponses` (race-free network interception), browser-state isolation self-test helpers | Real                                              |
| [`@qe/bom-web-cucumber-js`](packages/bom-web-cucumber-js)   | Version pins for the web-BDD-testing slice                                                                                                                                                                                                                  | Placeholder (no BDD libraries chosen/managed yet) |
| [`@qe/base-web-cucumber-js`](packages/base-web-cucumber-js) | BDD glue (`@cucumber/cucumber` + `playwright-bdd`), depending only on `@qe/base-js`                                                                                                                                                                         | Placeholder — see its own `src/index.ts` for why  |

"Real" means the package has working, self-tested TypeScript source — not just a scaffold. Every
"Real" package's self-tests pass (`pnpm --filter <pkg> test`); see **Verification**, below.

## Provenance

Most of `@qe/base-js`, `@qe/base-api-js`, and the non-shared-browser parts of `@qe/base-web-js`
were ported from the sibling repo `playwright-test-automation` — specifically, the code in it
that was already application-under-test-agnostic (no SauceDemo/example-site specifics), carried
over verbatim or lightly generalized (e.g. `BaseClient` now takes `baseUrl` as a constructor
parameter instead of reading a hardcoded `env.API_BASE_URL` global, so the base framework doesn't
assume any one consumer's env var naming). The entire **shared-browser execution model** in
`@qe/base-web-js` — a detached, loopback-only browser server per engine, shared across every
worker of every UI project on it, with atomic state files, a runner-pid watchdog, and
crash/launch-failure attribution — was ported essentially unchanged: it was already pure
Playwright infrastructure with zero application-specific logic. What was **not** ported:
app-specific page objects/fixtures (SauceDemo login, the `authToken`/`AuthHelper` login-endpoint
client, `example.client.ts`), because genericizing a login flow that varies per consumer (OAuth,
API key, session cookie, …) would be premature abstraction for a base framework that doesn't know
any one consumer's auth scheme.

## The BOM dependency-enforcement/override mechanism

Every `@qe/bom-*-js` package ships a `qe.bom.json` next to its `package.json`:

```json
{
  "managed": { "@playwright/test": "1.62.1", "zod": "4.4.3" },
  "overridable": ["typescript", "eslint", "prettier", "@types/node"]
}
```

- **`managed`** — exact versions every consumer resolves to. A base package's own
  `package.json` must agree with its BOM's `managed` map, version for version — enforced in this
  repo, on itself, by `node .ci/enforce-bom-rules.mjs` (`pnpm run bom:check`).
- **`overridable`** — names a consumer is explicitly allowed to repin (via its own
  `pnpm.overrides`/npm `overrides`/yarn `resolutions`) without breaking enforcement — by default,
  pure build/lint/type tooling, never a runtime dependency like `@playwright/test` itself.

Full design, including the planned `qe-bom-guard` consumer-facing CLI (not yet implemented — see
the comment at the top of `.ci/enforce-bom-rules.mjs`), is in
[`framework-guidelines.md` §5](.ai/skills/_shared/framework-guidelines.md#5-bom-dependency-enforcement--override-mechanism).

## The shared-browser execution model

`@qe/base-web-js` solves a real, generic Playwright problem: launching one browser per worker
explodes CPU/memory as worker count grows. Instead, for each engine (chromium/firefox/webkit) a
`setup_<engine>` project test spawns ONE detached, loopback-only browser server for the whole test
run, and every UI project on that engine connects to it via `connectOptions`; a `teardown_<engine>`
project stops it once every dependent project has finished. Every test still gets a fresh
`BrowserContext`/`Page` — only the underlying browser process is shared. See
[`packages/base-web-js/src/fixtures.ts`](packages/base-web-js/src/fixtures.ts) for the fixture
wiring and [`packages/base-web-js/src/shared-browser/`](packages/base-web-js/src/shared-browser)
for the implementation.

## Browser-exploration & MCP tooling

`@qe/base-web-js` and `@qe/base-web-cucumber-js` (plus the workspace root) carry two dev-only
tools, never a runtime dependency since no `src/` file imports either:

- **`@playwright/cli`** (bin `playwright-cli`) — the engine behind the vendored `playwright-cli`
  skill (`.ai/skills/playwright-cli/`). Run it as `pnpm exec playwright-cli <command>` from
  either package, or `pnpm --filter @qe/base-web-js exec playwright-cli <command>` from the root.
- **`@playwright/mcp`** (bin `playwright-mcp`) — registered as the `playwright` server in
  [`.mcp.json`](.mcp.json), so an MCP-aware coding agent can drive a real browser directly
  instead of going through the CLI's shell interface.

Both are listed in `qe.bom.json` for the two web slices, marked `overridable` (dev tooling, like
`typescript`/`eslint`) — see
[`.ai/skills/_shared/framework-guidelines.md`](.ai/skills/_shared/framework-guidelines.md) §1.
Either interface is still bound by the same rule as manual exploration:
`.ai/context/self-test-verification-workflow.md`'s "local stubs/mocks only, never a live external
site" applies regardless of which tool drives the browser.

## Local setup

```bash
pnpm install
```

## Verification

```bash
pnpm run typecheck       # tsc --noEmit, every package
pnpm run lint            # ESLint, flat config
pnpm run format:check    # Prettier
pnpm run bom:check       # BOM self-enforcement (node .ci/enforce-bom-rules.mjs)
pnpm run build           # tsc -b, every package
pnpm run test            # every package's self-tests (needs Playwright browsers installed)
```

Self-test runs that launch a real browser or bind a local port need to run outside any command
sandbox that blocks process spawn or socket binding — see
[`.ai/context/framework-learnings.md`](.ai/context/framework-learnings.md).

## Consuming this framework from another repo

Published to the GitLab project npm registry on gitlab.com, project `88594233`
(`adarsha.shetty.1989/javascript-qe-package-management`), scope `@qe`. A consumer repo:

1. Points its package manager at that registry for the `@qe` scope. `.npmrc` (safe to commit —
   no secret in this part):

   ```ini
   @qe:registry=https://gitlab.com/api/v4/projects/88594233/packages/npm/
   ```

   The auth token line is **never** committed — each developer's own `~/.npmrc` and CI's
   secret-backed npmrc step supply it instead, because a project-level `.npmrc` can't use
   env-var substitution for credentials (see `.ai/context/framework-learnings.md`):

   ```ini
   //gitlab.com/api/v4/projects/88594233/packages/npm/:_authToken=${GITLAB_PRIVATE_TOKEN_FOR_JS}
   ```

   The token needs at least Developer role (`access_level: 30`) on project `88594233` — Guest
   access can read packages but not resolve/install from a registry in all cases and cannot
   publish.

2. Depends on the `@qe/bom-*-js` package(s) matching the technology it needs, and/or directly on
   the matching `@qe/base-*-js` package(s) for the actual code. Example `package.json` for a
   consumer taking the web slice (both the pinned versions and the real code):

   ```json
   {
     "name": "my-downstream-qe-suite",
     "version": "1.0.0",
     "private": true,
     "dependencies": {
       "@qe/bom-web-js": "0.1.0",
       "@qe/base-web-js": "0.1.0"
     },
     "devDependencies": {
       "typescript": "6.0.2",
       "@types/node": "26.2.0"
     },
     "pnpm": {
       "overrides": {
         "typescript": "6.0.2",
         "@types/node": "26.2.0"
       }
     }
   }
   ```

   That `pnpm.overrides` block repins **two** of `@qe/bom-web-js`'s `managed` entries away from
   its pinned `typescript: "6.0.3"` / `@types/node: "26.2.0"` — here, pinning `typescript` back
   to the real, previously-published `6.0.2` patch (always confirm the exact version against the
   registry before pinning one for real — never write down an invented version number, see
   `.ai/context/framework-learnings.md`). This is only a legal override because
   `@qe/bom-web-js`'s `qe.bom.json` lists both names in `overridable`
   (`["typescript", "eslint", "prettier", "@types/node"]`); overriding a non-overridable managed
   dependency like `@playwright/test` the same way is exactly what `qe-bom-guard check` is meant
   to reject, once it exists (see "Known limitations", below). The equivalent field is root-level
   `"overrides"` for npm (8.3+) or `"resolutions"` for yarn — same shape, no `"pnpm"` wrapper.

3. Runs the BOM enforcement check in its own CI (the consumer-facing `qe-bom-guard` CLI —
   see "The BOM dependency-enforcement/override mechanism", above — once it exists).

## Known limitations / honest gaps

- **`qe-bom-guard`, the consumer-facing enforcement CLI, doesn't exist yet.** Only the
  self-validation half (`.ci/enforce-bom-rules.mjs`, this repo checking its own base packages
  against their BOM) is implemented.
- **`@qe/bom-web-cucumber-js` / `@qe/base-web-cucumber-js` are placeholders.** No BDD library
  versions have been chosen or verified against the registry yet.
- **TypeScript is pinned to the 6.x line, not the new 7.x native/Go compiler**, because
  `typescript-eslint`'s type-aware linting breaks against TypeScript 7 as of this writing (no
  importable compiler API yet; its own peer range caps below 6.1.0). See
  `.ai/context/framework-learnings.md` for the evidence. Revisit once `typescript-eslint`
  supports it.
