# QE Base JS Framework Guidelines

Single source of truth for the design principles every skill in `.ai/skills/`
plans against, implements against, and reviews against. Skills reference this
file by path instead of restating it.

If this file disagrees with the code in the repo, the code wins for "what
exists today." This file wins for "what new code should look like." Flag the
disagreement in your output and don't resolve it silently.

**As of this writing, 6 of the 8 packages have real, self-tested code** —
`@qe/bom-js`/`@qe/base-js`, `@qe/bom-api-js`/`@qe/base-api-js`,
`@qe/bom-web-js`/`@qe/base-web-js` — ported from the sibling repo
`playwright-test-automation` (its application-under-test-agnostic code only)
plus the BOM manifests and enforcement script written fresh for this repo.
`@qe/bom-web-cucumber-js`/`@qe/base-web-cucumber-js` are still placeholders —
`playwright-test-automation` has no BDD code to port, and no BDD library
versions have been chosen yet. See the root `README.md`'s package table for
the authoritative per-package status. Section 1's table below is mostly
_actual_, not target, architecture now; re-verify it against
`pnpm-workspace.yaml` and each package's `package.json` before relying on it
— don't trust it blindly just because it's written down.

---

## 1. Repo snapshot (verify before relying on it)

| Concern                         | Target choice                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language / runtime              | TypeScript 6.x (`strict: true`), pinned exactly — **not** the new 7.x native/Go compiler, because `typescript-eslint`'s type-aware linting breaks against it as of this writing (see `.ai/context/framework-learnings.md`). Node.js 20+ LTS                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Package manager / workspaces    | pnpm, via `pnpm-workspace.yaml` (no Nx/Turborepo layered on top — plain workspace, matching `qe-bom-base-java`'s "plain Maven reactor, no wrapper" philosophy)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Repo shape                      | Monorepo with 8 workspace packages under `packages/`: 4 **BOM** packages (`@qe/bom-js`, `@qe/bom-api-js`, `@qe/bom-web-js`, `@qe/bom-web-cucumber-js` — no `src/`, version-pinning only) paired with 4 **base** packages (`@qe/base-js`, `@qe/base-api-js`, `@qe/base-web-js`, `@qe/base-web-cucumber-js` — real `src/`), directly mirroring `qe-bom-java`/`qe-base-java`/`qe-bom-api-java`/`qe-base-api-java`/`qe-bom-web-java`/`qe-base-web-java`/`qe-bom-web-cucumber-java`/`qe-base-web-cucumber-java`                                                                                                                                                                       |
| What "the product" is           | Published npm packages (private registry/GitHub Packages, scope `@qe`) consumed by other QE repos — either by taking on a `@qe/bom-*-js` package's pinned versions (see §5, the "BOM" dependency-enforcement mechanism) and/or depending directly on a `@qe/base-*-js` package for real code. There is no end-to-end application under test here; "correctness" means each base package's own self-test suite passes and the workspace builds/typechecks/publishes cleanly                                                                                                                                                                                                       |
| Test runner                     | `@playwright/test`, used for **both** web and API self-tests (one runner for both, same way TestNG covers both `qe-base-api-java` and `qe-base-web-java`). BDD self-tests (`@qe/base-web-cucumber-js`) use `@cucumber/cucumber` + `playwright-bdd`                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Browser-exploration/MCP tooling | `@playwright/cli` (bin `playwright-cli`, the engine behind the vendored `playwright-cli` skill) and `@playwright/mcp` (bin `playwright-mcp`, registered as the `playwright` server in the repo's root `.mcp.json`) are `devDependencies` of `@qe/base-web-js`, `@qe/base-web-cucumber-js`, and the workspace root — never a runtime dependency, since no `src/` file imports either. Each pins its own `playwright-core` (independent of, and not required to match, `@qe/bom-js`'s managed `@playwright/test` version) — don't assume they share one browser install. Managed in `qe.bom.json` for both web slices, and `overridable` (dev tooling, like `typescript`/`eslint`) |
| Context isolation               | Worker/test isolation comes from Playwright Test's own per-test fixtures (`test.extend`) — the TS equivalent of `TestExecutionContextManager`'s `ThreadLocal`. A package's base class/fixture must never hold mutable state in module scope; anything per-test goes through a fixture                                                                                                                                                                                                                                                                                                                                                                                            |
| BOM / dependency enforcement    | Each `@qe/bom-*-js` package ships a `qe.bom.json` manifest (`managed` = exact pinned versions, `overridable` = names a consumer may repin). **Implemented today**: `.ci/enforce-bom-rules.mjs` validates every `@qe/base-*-js` package's `package.json` against its paired BOM, in this repo, on itself. **Not implemented yet**: the consumer-facing `qe-bom-guard` CLI described in §5.2 (checking a downstream repo's own lockfile) — don't claim it exists until it's actually built. Full mechanism in §5 — this is the load-bearing feature of the whole repo                                                                                                              |
| HTTP (API package)              | Playwright's own `request` fixture/`APIRequestContext` as the HTTP client (`@qe/base-api-js`'s `BaseClient`); `zod` for response-schema validation (`expectSchema`); self-tests target a tiny local `node:http` stub server started in the test file itself — no `msw` dependency was needed                                                                                                                                                                                                                                                                                                                                                                                     |
| Web / browser (web package)     | `@playwright/test` browser automation; `@qe/base-web-js` ships a `BasePage` (locator encapsulation, explicit waits) and the **shared-browser execution model** — one detached, loopback-only browser server per engine per run (`src/shared-browser/browser-server.mjs` + `lifecycle.ts`/`state.ts`/`client.ts`/`projects.ts`), shared by every worker of every UI project on that engine, wired into `src/fixtures.ts`. This is a materially more capable mechanism than a simple per-worker `DriverManager`-style factory — don't undersell it as one                                                                                                                          |
| BDD                             | `@cucumber/cucumber` + `playwright-bdd`, in `@qe/base-web-cucumber-js` only — it depends on `@qe/base-js` only, not on `@qe/base-web-js`, mirroring `qe-base-web-cucumber-java`'s independence from `qe-base-web-java`                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Reporting                       | Playwright's built-in HTML + JUnit reporters for every self-test suite; a package may add Allure (`allure-playwright`) later if a consumer requires it — don't assume it exists until it's actually added                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Logging                         | `@qe/base-js`'s `logger` — a thin `console`-based wrapper (`info`/`warn`/`error`/`debug`, the last gated on `process.env.DEBUG`), ported verbatim from `playwright-test-automation`. Every other package imports it rather than calling `console.*` directly or rolling its own. A heavier structured-logging library (e.g. `pino`) is a possible future upgrade, not a current dependency — don't claim one exists                                                                                                                                                                                                                                                              |
| Build                           | Each package built independently via `tsc -b` (TypeScript project references) emitting `dist/` (types + JS); a root `tsconfig.base.json` all packages extend                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Lint / format                   | ESLint flat config (`eslint.config.mjs`) + Prettier, shared from the workspace root, same as `playwright-test-automation`'s setup                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Mutation testing                | A custom, deterministic hook-based system (not an automatic mutant-generation engine) — controlled defects are bound to specific existing self-tests via a `mutation-test-map.csv` per package, gated strictly behind an opt-in env var (`MUTATION_ENABLED=true`), never run unattended in CI. Direct TS port of the sibling Java repo's `mutation-testing` skill (which itself hand-rolls this rather than using PIT's automatic engine)                                                                                                                                                                                                                                        |
| Config                          | No ambient config-loading layer beyond what each package's own typed config module (e.g. `@qe/base-web-js`'s `WebConfig`) exposes. Don't invent a cross-package config framework that isn't there                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| CI                              | **Implemented**: `.github/workflows/ci.yml` (install → typecheck → lint → format:check → `bom:check` → build → install chromium → self-tests). `.ci/github/workflows/ci.yml` is a symlink back to it, per the sibling Java repo's hard-won convention: GitHub reads `.github/workflows/*.yml` literally (no symlink resolution there), so the **real** file must live at that exact path; the symlink exists only so the `.ci/` convention has an entry too. All other CI-platform files (Jenkins, GitLab, local scripts) would live under their own `.ci/<platform>/` folder — none exist yet                                                                                   |
| Versioning                      | Single workspace version (currently `0.1.0`), bumped together across all 8 packages (the npm analogue of the Java reactor's shared `${project.version}`); every internal cross-package dependency (e.g. `@qe/base-api-js` → `@qe/base-js`) uses `workspace:*`, resolved to that exact version at publish time                                                                                                                                                                                                                                                                                                                                                                    |
| Publishing                      | **Implemented**: GitLab project-level npm package registry on gitlab.com, project `88594233` (`adarsha.shetty.1989/javascript-qe-package-management` — the JS-specific project, distinct from the sibling Java repo's Maven project `88582779`). Repo's `.npmrc` maps `@qe:registry` to `https://gitlab.com/api/v4/projects/88594233/packages/npm/`; the publishing machine's own `~/.npmrc` (never committed) supplies `//<that registry>:_authToken=${GITLAB_PRIVATE_TOKEN_FOR_JS}` — a project-level `.npmrc` can't use env-var substitution for credentials (see `framework-learnings.md`), and the token needs at least Developer role (`access_level: 30`) on `88594233` specifically, not just any valid GitLab token. All 8 packages published at `0.1.0` via `pnpm -r publish --no-git-checks`. Each of the 4 base packages' `package.json` declares `"files": ["dist"]` so the tarball actually ships built output despite `dist/` being `.gitignore`d. Note: an earlier attempt also published all 8 packages to project `88582779` before the target was corrected to `88594233` — both registries currently hold `0.1.0`; `88594233` is the authoritative one going forward                                                                                                                                                                                                                                                                                                                                                                                                                                          |

Re-check `pnpm-workspace.yaml`, each package's `package.json`, and the source
tree at the start of every run. Versions, packages and module boundaries
drift, so don't trust this table blindly once code exists.

## 2. Layering (dependency direction is strictly top → down)

Two layering stories apply here, at different granularities — directly
mirroring the sibling Java repo's reactor-level / class-level split.

### 2.1 Workspace-level (package → package)

```
Downstream consumer repo (another QE repo)
  └─ takes on a @qe/bom-*-js package's pinned versions (qe.bom.json, no src/)
      │   @qe/bom-js               — core runtime libs (logging, zod, picocolors/CLI libs), @qe/base-js
      │   @qe/bom-api-js           — managed set ⊇ @qe/bom-js + API/HTTP/mocking libs, @qe/base-api-js
      │   @qe/bom-web-js           — managed set ⊇ @qe/bom-js + Playwright/browser libs, @qe/base-web-js
      │   @qe/bom-web-cucumber-js  — managed set ⊇ @qe/bom-js + Cucumber/playwright-bdd libs, @qe/base-web-cucumber-js
      └─ and/or depends directly on a @qe/base-*-js package (real code)
          @qe/base-js               — no internal dependency (the foundation)
          @qe/base-api-js           → depends on @qe/base-js
          @qe/base-web-js           → depends on @qe/base-js
          @qe/base-web-cucumber-js  → depends on @qe/base-js (NOT on @qe/base-web-js — its own parallel driver/page/config stack)
```

Hard rules — a violation of any of these is a review blocker:

1. A `@qe/bom-*-js` package has **no `src/`** and ships only `package.json`
   (its `dependencies`/`peerDependencies` ARE the managed version set) plus
   `qe.bom.json` (the machine-readable `managed`/`overridable` manifest, §5).
   It never carries real implementation code.
2. A `@qe/base-*-js` package is real code (`src/`, built via `tsc -b` to
   `dist/`). Its own `package.json` dependencies must match, version for
   version, what the paired `@qe/bom-*-js` package's `qe.bom.json` `managed`
   map says — never a hand-picked version the BOM already manages.
3. Dependency direction between base packages is one-way: `@qe/base-js` has
   zero dependencies on any other `@qe/base-*-js` package. `@qe/base-api-js`
   and `@qe/base-web-js` depend only on `@qe/base-js`. `@qe/base-web-cucumber-js`
   depends only on `@qe/base-js` — it does not reuse `@qe/base-web-js`'s
   page/browser-factory classes today; reusing them instead of its own
   parallel `src/cucumber/driver`/`src/cucumber/page` modules is a deliberate,
   plan-level decision, not an incidental edit.
4. Every new internal cross-package dependency pins the exact workspace
   version (`workspace:*` in each package's `package.json`, resolved to the
   literal version at publish time), never a caret/tilde range.
5. A new managed third-party dependency gets added to the **parent** BOM's
   `qe.bom.json` `managed` map first (whichever `@qe/bom-*-js` owns that
   technology slice), and the matching base package's `package.json` then
   depends on it with no version (resolved via the workspace, matching the
   BOM). A version bump happens in exactly one place — the BOM's
   `qe.bom.json` — never a hand-edited duplicate in the base package.
6. New package pairs (BOM + base) are registered in the root
   `pnpm-workspace.yaml`'s `packages:` list in BOM-before-base order, matching
   the existing 8. See `scaffold-qe-module` for adding a new technology pair.

### 2.2 Within a base package (module layering)

```
Self-test (src/__tests__/**/*.spec.ts, *VerificationTest-equivalent)
  └─ Fixture / base class (test.extend-based fixtures, analogue of BaseTest/BaseApiTest/BaseWebTest)
      Per-test state via Playwright Test's own fixture scoping — no ThreadLocal needed in JS,
      but the RULE IT SERVES is identical: never share mutable state across tests/workers.
      ├─ config/*Config.ts        (typed, defaulted accessors — analogue of ApiConfig/WebConfig)
      ├─ browser/ (web packages only; a context/browser factory, analogue of DriverManager)
      ├─ client/ (api package only; a typed request wrapper, analogue of ApiClient)
      ├─ page/BasePage.ts + wait helpers (web packages only)
      ├─ util/ (json helpers, random/synthetic-data helpers — analogue of JsonUtils/RandomDataUtils)
      └─ retry/ (qe-base-js only, opt-in; Playwright Test's own retries plus any custom retry helper)
```

Hard rules:

1. `src/` (library code) never depends on anything in `src/__tests__/` (or
   whatever self-test folder is chosen), in any package.
2. A self-test consumes the package's own fixtures/base classes — it doesn't
   reimplement context management, browser/client creation, or JSON
   (de)serialization inline.
3. Parallel-safety is load-bearing: no shared mutable module-level state
   anywhere in `src/`. Per-test state goes through a `test.extend` fixture,
   not a module-level `let`/singleton, because Playwright Test runs fully
   parallel by default.
4. Every new test uses Playwright Test's `tag` option (see
   `.ai/context/test-tagging.md`) — classification tag(s) plus one unique
   kebab-case scenario tag, never inline `@tag` text in the title.
5. A new self-test file is picked up by the package's own `playwright.config.ts`
   `testDir`/`testMatch` — confirm it actually runs under the package's full
   `pnpm --filter <pkg> test`, not only under a narrowed `--grep`.
6. Non-trivial new `src/` logic (a utility, a client wrapper, a config
   resolver, a retry helper) ships with its own self-test in the same
   package, mirroring whatever `*VerificationTest`-equivalent pattern the
   package has already established.
7. Every exported symbol from a base package's `src/index.ts` is part of its
   public contract — removing or changing the signature of an exported symbol
   is a breaking change for every downstream consumer and must be called out
   explicitly in a plan/review, never done incidentally.

## 3. The ten design principles, made concrete for a published BOM/framework

| #   | Principle                      | What it means here                                                                                                                                                                                                                                                          | Evidence a reviewer looks for                                                                                                                      |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | Layered / modular architecture | §2's workspace-level and module-level layering both hold; a new technology gets its own `@qe/base-<tech>-js` + `@qe/bom-<tech>-js` pair instead of being bolted onto an existing package                                                                                    | No upward/cross-package imports; no BOM package with real source; no base package with a hardcoded version its BOM already manages                 |
| b   | Reusability                    | New capability extends an existing fixture/base class/client/config module before adding a parallel mechanism; downstream consumers get it by bumping one version, not by copy-pasting code                                                                                 | No duplicated context/browser/client logic; a fix in one package isn't silently re-implemented in a sibling package that could have depended on it |
| c   | Flexibility / configurability  | Per-package typed config modules expose defaulted accessors, validated with `zod`                                                                                                                                                                                           | No hardcoded host/port/timeout where a config module already exists for that concern                                                               |
| d   | Readability                    | Module/class names mirror the established style; TSDoc on public framework API explains _why_, not _what_                                                                                                                                                                   | A consumer can read a base package's public `src/index.ts` surface without reading internals                                                       |
| e   | Maintainability                | Small focused modules; no dead code; a package's public surface is exactly its `src/index.ts` exports                                                                                                                                                                       | Change is localized to the right package; no copy-paste across `@qe/base-web-js` and `@qe/base-web-cucumber-js` without a stated reason            |
| f   | Scalability                    | Parallel-safe by construction (§2.2 rule 3); Playwright Test's own sharding/worker model, not a custom one                                                                                                                                                                  | New code passes under the package's full parallel self-test run without added synchronization hacks                                                |
| g   | Robustness / reliability       | Deterministic teardown via fixture `use()`/cleanup, not manual try/finally scattered in test bodies; retries used deliberately, never to paper over a real defect; no `page.waitForTimeout`/hard sleeps where an explicit wait exists                                       | Self-tests are deterministic; no flaky-by-design sleep-based waits                                                                                 |
| h   | Reporting & traceability       | HTML + JUnit reporters on every self-test suite; a failure is diagnosable from trace/screenshot/log alone                                                                                                                                                                   | No need to re-run with a debugger to understand a failure                                                                                          |
| i   | Security & data hygiene        | No live external target or real credentials exist in this repo — self-tests run entirely against local mocks/stubs. The actual secret surface is CI/publishing: registry tokens (`NODE_AUTH_TOKEN`/`NPM_TOKEN`) must never be a literal anywhere, only an env-var reference | No token, password, or API key literal anywhere in `package.json`, CI config, source, or docs                                                      |
| j   | CI/CD readiness                | `pnpm -r build && pnpm -r test` and `pnpm -r publish` both succeed unattended; a new package is added to `pnpm-workspace.yaml` so it's built, tested and published automatically                                                                                            | Non-zero exit on failure; no manual step between a merge/tag and a package landing in the registry                                                 |

Framework code (anything new under `src/` that isn't a thin pass-through)
ships with its own self-test, run against local stubs/mocks, never a live
external service — none exists for this repo to target.

## 4. Module-pairing & extension conventions

- Every new or changed self-test carries Playwright Test's `tag` option (see
  `.ai/context/test-tagging.md`): at least one classification tag plus one
  globally unique kebab-case scenario tag.
- A whole new protocol/technology (mobile, GraphQL, gRPC, …) becomes a new
  `@qe/base-<tech>-js` + `@qe/bom-<tech>-js` package pair, not a module
  bolted onto an existing base package. See `scaffold-qe-module`.
- A new managed third-party dependency always lands in a BOM package's
  `qe.bom.json` `managed` map first — see §5.

## 5. BOM dependency enforcement & override mechanism

This is the feature that makes the repo a _central_ framework rather than a
pile of copy-pasted packages: every repo that inherits from `qe-base-js` gets
**strictly enforced dependency versions and code**, with a narrow, explicit
escape hatch to override specific dependencies that are declared overridable.
Don't weaken either half of that sentence when implementing or reviewing it.

### 5.1 The manifest

Each `@qe/bom-*-js` package ships a `qe.bom.json` next to its `package.json`:

```json
{
  "name": "@qe/bom-web-js",
  "managed": {
    "@playwright/test": "1.49.1",
    "zod": "3.23.8"
  },
  "overridable": ["typescript", "eslint", "prettier", "@types/node"]
}
```

- **`managed`** — exact versions every consumer must resolve to. This is the
  npm analogue of a Maven `<dependencyManagement>` block: it is the single
  source of truth for "what version of X does this technology slice run."
  A base package's own `package.json` dependency on a `managed` entry is
  never version-pinned itself — it depends on the BOM having already pinned
  it (practically: the base package's `package.json` still needs _a_ version
  for npm's sake, but CI enforcement in §5.3 fails the build if it diverges
  from the BOM's `managed` entry — the BOM is the authority, the base
  package's copy must agree, never invent its own number).
- **`overridable`** — a package name is listed here, by the BOM maintainer,
  specifically because a consumer repo overriding it is a safe, expected
  thing (typically pure build/lint/type tooling that doesn't affect the
  framework's own runtime behavior — `typescript`, `eslint`, `prettier`,
  `@types/node` are the default set; a runtime dependency like
  `@playwright/test` itself is deliberately **not** overridable by default,
  because an override there could silently break the framework's own
  guarantees). Adding a name here is a deliberate, reviewed decision — see
  the review checklist in `review-code-changes`.
- Anything **not** listed in either map isn't managed by this BOM at all —
  an ordinary free dependency, outside the enforcement mechanism entirely.

### 5.1.1 Example consumer `package.json`

A downstream QE repo that wants the web slice — both the pinned dependency
versions (`@qe/bom-web-js`) and the real framework code (`@qe/base-web-js`)
— points its package manager at the GitLab project npm registry (§6's
"Publishing" row: project `88594233` on gitlab.com) and depends on both
packages. This repo's own workspace is the reference for what "correct" looks
like, since it consumes its sibling packages the same way:

`.npmrc` (committed — no secret in this part):

```ini
@qe:registry=https://gitlab.com/api/v4/projects/88594233/packages/npm/
```

The auth token line is **never** committed here — each developer's
`~/.npmrc` and CI's own secret-backed npmrc step supply it, because a
project-level `.npmrc` can't use env-var substitution for credentials (see
`framework-learnings.md`):

```ini
//gitlab.com/api/v4/projects/88594233/packages/npm/:_authToken=${GITLAB_PRIVATE_TOKEN_FOR_JS}
```

`package.json`:

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

That `pnpm.overrides` block is the escape hatch from §5.1, repinning **two**
of `@qe/bom-web-js`'s `managed` entries away from its pinned `typescript:
"6.0.3"` / `@types/node: "26.2.0"` (here, pinning `typescript` back to the
real, previously-published `6.0.2` patch — see `framework-learnings.md` for
why an invented version number is never safe to write down; always confirm
the exact version against the registry before pinning one for real, this
example included). Both names are legal to override only because
`@qe/bom-web-js`'s `qe.bom.json` lists them in `overridable`
(`["typescript", "eslint", "prettier", "@types/node"]`) — overriding
`@playwright/test` or `zod` the same way would be exactly the kind of
override `qe-bom-guard check` (§5.2) is meant to reject, since neither name
is in that BOM's `overridable` list. The equivalent field is root-level
`"overrides"` for npm (8.3+) or `"resolutions"` for yarn — same shape, no
`"pnpm"` wrapper.

### 5.2 The enforcement CLI: `qe-bom-guard`

Shipped as a published `bin` from `@qe/base-js`, so every consumer gets it
for free (via `npx qe-bom-guard check`, no separate install) the moment they
depend on any `@qe/base-*-js` or `@qe/bom-*-js` package.

`qe-bom-guard check [--bom <pkg>...]`:

1. Resolves every installed `@qe/bom-*-js` package's `qe.bom.json` (default:
   all of them found in the consumer's lockfile; `--bom` narrows it).
2. Resolves what the consumer actually has installed for every name in each
   BOM's `managed` map (read the consumer's lockfile — `pnpm-lock.yaml` /
   `package-lock.json` / `yarn.lock`, whichever is present — not just its
   `package.json`, since the installed/resolved version is what matters).
3. For each `managed` entry:
   - resolved version **equals** the pinned version → **OK**.
   - resolved version **differs**, the consumer's own root `package.json`
     declares an override for that name (`pnpm.overrides` / npm `overrides` /
     yarn `resolutions`), **and** the name is in that BOM's `overridable`
     list → **OK**, logged explicitly as an intentional, allowed override.
   - resolved version differs and either there's no override declared, or
     the name isn't in `overridable` → **FAIL**: hard error naming the
     package, the pinned version, the resolved version, and exactly what to
     do (drop the override to match the BOM, or ask the BOM's maintainers to
     add the name to `overridable` if the override is genuinely needed).
4. Non-zero exit on any `FAIL`. This is the CI gate — see §5.3.

### 5.3 Where it runs

- **In this repo, on itself**: `.ci/enforce-bom-rules.mjs` (the TS/npm
  analogue of the sibling Java repo's `.ci/enforce-bom-rules.sh`) runs
  `qe-bom-guard check` across the workspace, validating that every
  `@qe/base-*-js` package's own `package.json` agrees with its paired BOM's
  `managed` map — catching drift at the source before it's ever published.
  Wired into every CI entry point the same way the Java script is: a step
  before the main build/test job in `.github/workflows/ci.yml`, and into any
  other CI platform file under `.ci/<platform>/` that gets added later.
- **In every downstream consumer repo**: the same `qe-bom-guard check`
  command, run as a CI step (and optionally a pre-commit hook), gives that
  repo the "strictly enforced, narrowly overridable" dependency behavior this
  whole mechanism exists for. `setup-qe-base-framework` and the root
  `README.md`'s consumption patterns document the exact CI snippet a new
  consumer repo adds.

### 5.4 What "strictly enforced... code" means beyond dependencies

The dependency mechanism (§5.1–§5.3) is the versions half. The _code_ half is
simpler and is just normal package consumption: a consumer that wants the
base framework's actual classes/fixtures/utilities depends on the relevant
`@qe/base-*-js` package directly and imports from its public `src/index.ts`
surface (§2.2 rule 7) — there is no separate "enforcement" needed for code
reuse beyond ordinary semantic versioning (a breaking change bumps a major
version, same as any published package). Don't build a second, redundant
enforcement path for code when npm's own dependency resolution already does
the job.

## 6. Verification commands

```bash
pnpm install                                    # whole workspace
pnpm -r build                                   # build every package (tsc -b)
pnpm -r test                                    # every package's self-tests
pnpm --filter @qe/base-web-js test              # one package only
pnpm --filter @qe/base-api-js... test           # one package + what it depends on
pnpm -r lint                                    # ESLint, flat config
pnpm -r exec tsc --noEmit                       # typecheck without emitting
node .ci/enforce-bom-rules.mjs                  # BOM enforcement (§5), run before publish
pnpm -r publish --access restricted             # publish every package to the @qe scope
```

- Before pinning a new dependency version in a `qe.bom.json` or any CI file,
  check what's actually resolvable (the npm registry) — don't copy an
  example version from memory or from another repo.
- Self-test runs that launch a real browser or bind a local port need to run
  outside any command sandbox that blocks process spawn or socket binding —
  same caveat as the sibling Java repo's WebDriver/WireMock tests.
- There is no live external target for any package's self-tests — they run
  against local stubs/mocks only, because none exists for this repo to
  target.

## 7. Document conventions (shared by all skills)

| Artifact                                        | Path                                                                          | Written by                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------ |
| Requirements                                    | `docs/requirements/<slug>-requirements.md`                                    | `analyze-task`                 |
| Code-change plan                                | `docs/plans/<slug>-plan.md`                                                   | `plan-framework-code-changes`  |
| Change manifest                                 | `docs/changes/<slug>-changes.md`                                              | `make-code-changes`            |
| Review report                                   | `docs/reviews/<slug>-review-cycle-<n>.md`                                     | `review-code-changes`          |
| Quality report                                  | `docs/quality/<slug>-quality.md`                                              | `check-code-quality`           |
| Mutation testing report                         | `docs/mutation/<slug>-mutation.md`                                            | `mutation-testing`             |
| Orchestration input / run log / abort / summary | `docs/orchestration/<slug>-{input,run-log,abort,summary}.md`                  | `framework-orchestrator-agent` |
| New-module scaffold plan / change manifest      | `docs/framework/scaffold-module-plan.md`, `docs/framework/scaffold-module.md` | `scaffold-qe-module`           |
| Framework setup plan / change log               | `docs/plans/framework-setup-plan.md`, `docs/setup-framework.md`               | `setup-qe-base-framework`      |

- `docs/` is gitignored in this repo. These are local working documents, so
  never assume a reviewer can see them through git history.
- `<slug>` is short kebab-case and identical across all artifacts of one task.
- Diagrams are Mermaid (` ```mermaid `) so they render on GitHub and in most
  IDEs without extra tooling.
- **Hand off paths, not content.** A skill that feeds another skill passes
  the document's path. The receiving skill reads the file itself.
- Every skill ends by printing a **result block** to its caller:

```
STATUS: <DONE | NEEDS_INPUT | BLOCKED | APPROVED | CHANGES_REQUESTED | PASSED | FAILED>
OUTPUT: <path(s) written>
SUMMARY: <≤ 3 lines>
NEXT: <suggested next skill + the input path to give it, or "none">
```

## 8. Project memory / guideline sources

Before planning, coding, or reviewing, read whichever of these exist. They
hold repo-specific learnings that override generic habits:

- `CLAUDE.md`, `AGENTS.md` at the repo root (thin pointers — see `.ai/README.md`)
- `.ai/context/*.md` (tool-agnostic repo context, incl. the pipeline handoff rules)
- `.ai/context/framework-learnings.md` (the shared, growing memory file)
- `README.md` (repo root — architecture, BOM tables, consumption patterns, once written)
- Any persistent memory store your agent runtime provides for this project

When a run surfaces a durable, non-obvious lesson (an environment quirk, a
convention a reviewer enforced), append it as a one-line bullet to
`.ai/context/framework-learnings.md`. Never store secrets there.
