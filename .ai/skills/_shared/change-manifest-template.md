# Change Manifest Template

Shared format for every "list of code changes" document. It's produced by
`make-code-changes` (`docs/changes/<slug>-changes.md`) and
`scaffold-qe-module` (`docs/framework/scaffold-module.md`), and
consumed by `review-code-changes` and `check-code-quality`.

The manifest is a map for the reviewer, not a substitute for the code.
Reviewers read the actual files and diff. Keep the per-file notes factual:
what changed and why, not a sales pitch.

Copy everything below the line.

---

# Change Manifest: <title>

| Field        | Value                                                           |
| ------------ | --------------------------------------------------------------- |
| Slug         | `<slug>`                                                        |
| Produced by  | `<skill name>`                                                  |
| Source plan  | `<path to plan md>`                                             |
| Requirements | `<path to requirements md, or "n/a">`                           |
| Base commit  | `<git rev-parse HEAD before changes>`                           |
| Branch       | `<branch name>`                                                 |
| Date         | `<YYYY-MM-DD>`                                                  |
| Review cycle | `<0 for first implementation; n when reworking review cycle n>` |

## Summary

<3–6 sentences: what framework capability now exists that didn't before —
e.g. a new fixture/utility, a new managed BOM dependency, a new package pair.>

## Files changed

| #   | Path                                                 | Change   | Layer   | Purpose                      | Plan ref |
| --- | ---------------------------------------------------- | -------- | ------- | ---------------------------- | -------- |
| 1   | `packages/base-web-js/src/browser/BrowserFactory.ts` | Modified | browser | …                            | §4.2     |
| 2   | `packages/base-web-js/playwright.config.ts`          | Modified | config  | registers new self-test file | §6       |
| 3   | `packages/bom-web-js/qe.bom.json`                    | Modified | bom     | bump `@playwright/test` pin  | §5       |

Change = `Added` / `Modified` / `Deleted` / `Renamed (from …)`.
Layer = bom · config · browser · client · page · util · retry · fixture · test · build (`package.json`, `tsconfig.json`) · ci (`.github/workflows/*.yml`, `.ci/**`) · docs (`README.md`).

## Per-file details

### 1. `<path>`

- **What:** <new/changed public symbols: exported classes, functions, managed versions, package entries>
- **Why:** <requirement / plan item it satisfies>
- **Notes:** <non-obvious decisions, parallel-safety, backward-compatibility impact for version-pinned consumers, anything a reviewer should look at first>

(repeat per file)

## Test coverage added / changed

| Test file#test title                          | Package       | Picked up by `playwright.config.ts`/`testMatch`? | Requirement / plan ID |
| --------------------------------------------- | ------------- | ------------------------------------------------ | --------------------- |
| `retry.spec.ts > retries a transient failure` | `@qe/base-js` | yes                                              | FR-1                  |

## BOM / dependency changes

- New or bumped managed versions (which `qe.bom.json` → `managed` entry → why):
- New entries added to a `qe.bom.json`'s `overridable` list (if any) and why that override is safe:
- New internal package dependency wiring (which `@qe/base-*-js` now depends on which):
- New packages registered in `pnpm-workspace.yaml` (if any):

## Deviations from plan

| Plan item | What was done instead | Reason |
| --------- | --------------------- | ------ |
| …         | …                     | …      |

(write "None" if none)

## Compilation / typecheck fixes applied

<Each `tsc` error hit after implementation: the error, the fix, and why the
fix preserves the original intent. "None" if none.>

## Verification

| Command                           | Result                                               |
| --------------------------------- | ---------------------------------------------------- |
| `pnpm --filter <package> build`   | PASS / FAIL (details)                                |
| `pnpm --filter <package> test`    | PASS / FAIL — counts from the Playwright Test report |
| `pnpm -r build` (whole workspace) | PASS / FAIL                                          |
| `node .ci/enforce-bom-rules.mjs`  | PASS / FAIL                                          |

Environment-caused failures (sandbox blocking browser launch or local port
binding, missing Node 20+) are listed separately from genuine failures, with
the evidence.

## Known limitations / open items

- …

## How to review

```bash
git diff <base-commit> -- <paths…>
```
