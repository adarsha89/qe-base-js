---
name: check-code-quality
description: Set up SonarQube / SonarCloud / Sonar Scanner CLI for this TypeScript pnpm workspace if not already configured, run a scan, and write a code quality report (quality gate, bugs, vulnerabilities, code smells, duplication, hotspots) to docs/quality/<slug>-quality.md. Falls back to ESLint + tsc + Prettier metrics, plus a BOM-manifest hygiene check, when no Sonar server/token is available.
argument-hint: '[optional: sonarcloud|sonarqube, server URL, project key, scope path]'
---

# check-code-quality

Before starting, read every file in `.ai/context/` and `.ai/skills/_shared/framework-guidelines.md`
(note: no Sonar server/token is configured yet — a skipped Sonar gate is expected, not a pipeline
defect).

## Step 1 — Detect existing setup

Check for `sonar-project.properties`, a `sonar`/`sonar-scanner` script in the root `package.json`,
a Sonar stage in any CI file, and whether `SONAR_TOKEN` (and `SONAR_HOST_URL` for SonarQube) are
set in the environment (`[ -n "$SONAR_TOKEN" ] && echo set` — never print the value).

## Step 2 — Set up if missing

Ask (one at a time, only what's unknown):

1. SonarCloud or self-hosted SonarQube? (If unsure and Docker is available, offer a local
   `sonarqube:community` container for a one-off scan.)
2. Server URL (SonarQube) or organization key (SonarCloud), and project key.
3. Confirm the token is exported as `SONAR_TOKEN` in their shell/CI secret store.
   **Never ask the user to paste a token into chat and never write it to a file.**

Then add (after confirming with the user):

- `sonar-project.properties`:
  ```properties
  sonar.projectKey=<key>
  # sonar.organization=<org>          # SonarCloud only
  sonar.sources=packages/*/src
  sonar.tests=packages/*/src/__tests__
  sonar.test.inclusions=packages/*/src/**/*.spec.ts
  sonar.exclusions=**/node_modules/**,**/dist/**,**/playwright-report/**,**/test-results/**,docs/**
  sonar.typescript.tsconfigPaths=tsconfig.base.json,packages/*/tsconfig.json
  sonar.eslint.reportPaths=reports/eslint-report.json
  sonar.sourceEncoding=UTF-8
  ```
- Scanner: prefer the npm package (`pnpm add -Dw sonarqube-scanner` — check the latest version and
  record it) with a `"sonar": "sonar-scanner"` script, or the official Docker image
  `sonarsource/sonar-scanner-cli`.
- An ESLint JSON report script: `"lint:report": "eslint . -f json -o reports/eslint-report.json"`.
- A CI step (matching the repo's CI platform) that runs the scan with the token from the CI
  secret store and, optionally, waits on the quality gate (`-Dsonar.qualitygate.wait=true`).
- Ensure `reports/` is gitignored (it already should be — verify).

If the user can't provide a server/token now, **skip Sonar** and continue with the fallback in Step 3.

## Step 3 — Scan

With Sonar available:

```bash
pnpm run lint:report
npx sonar-scanner -Dsonar.host.url="$SONAR_HOST_URL" -Dsonar.token="$SONAR_TOKEN"
```

Then fetch results via the Web API (`/api/qualitygates/project_status`, `/api/measures/component`
with `bugs,vulnerabilities,code_smells,security_hotspots,duplicated_lines_density,ncloc,sqale_rating,reliability_rating,security_rating`,
and `/api/issues/search`), authenticating with the env token.

Fallback (always run — it's also the local signal alongside Sonar):

```bash
pnpm -r exec tsc --noEmit
pnpm -r exec eslint . -f json -o reports/eslint-report.json
pnpm -r exec prettier --check .
node .ci/enforce-bom-rules.mjs
```

Plus repo-specific static checks (grep): `page.waitForTimeout`, `test.only`, `process.env`
outside a package's own config module, locators (`page.locator`/`getBy*`) inline in a self-test
body rather than a page object, `test(` calls without a `tag` option, duplicated unique tags,
hard-coded credentials/URLs, and a `qe.bom.json` `overridable` entry with no comment/justification
in the same package's `README.md` or the BOM's own doc.

Network calls to a Sonar server need to leave the sandbox — run them with the sandbox override.

## Step 4 — Report

Write `docs/quality/<slug>-quality.md` (or `docs/quality/code-quality-<YYYY-MM-DD>.md` for a
whole-repo scan with no specific change manifest):

1. Setup status (Sonar configured / skipped and why), tool versions, scope scanned.
2. Quality gate status and ratings (A–E) — or "N/A (Sonar skipped)".
3. Metrics table: bugs, vulnerabilities, hotspots, code smells, duplication %, LOC; ESLint
   errors/warnings; tsc errors; Prettier non-compliant file count; BOM enforcement result.
4. Top issues by severity: `Severity | Rule | file:line | Message`.
5. Repo-convention check results (the grep checks above).
6. Trend vs. the previous `docs/quality/*.md`, if any.
7. Prioritised recommendations — distinguish issues introduced recently from pre-existing debt.

Tell the user the gate status, headline numbers and the report path. Don't auto-fix code in this
skill — hand fixes to `make-code-changes` via a plan if the user wants them.
