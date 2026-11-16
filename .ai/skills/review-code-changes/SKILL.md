---
name: review-code-changes
description: Thoroughly review TypeScript BOM/base framework code changes listed in a markdown change manifest (e.g. docs/changes/<slug>-changes.md or docs/setup-framework.md / docs/framework/scaffold-module.md) against the functional requirements, repo rules in .ai/context, the layering/BOM rules in .ai/skills/_shared/framework-guidelines.md, and framework principles a-j. Scores each parameter 1-5 with evidence; correctness and coverage are judged strictly (temperature 0 - no assumed test cases). Writes docs/reviews/<slug>-review-cycle-<n>.md.
argument-hint: '<path to md listing the code changes>'
---

# review-code-changes

Input: a md file listing code changes (`$ARGUMENTS`) — typically
`docs/changes/<slug>-changes.md`, `docs/setup-framework.md`, or
`docs/framework/scaffold-module.md`. If none is given, ask for it. This skill **reviews only — it
does not edit code.**

## Strictness mode (temperature 0)

For **correctness** and **coverage**, be deterministic and evidence-bound:

- Every finding cites `file:line` and the rule/requirement it violates. No finding without evidence.
- Coverage is measured **only** against explicitly stated requirements/acceptance criteria/user
  expectations (requirements doc, plan, user-provided assertions). Do **not** invent "you should
  also test X" cases unless they follow unambiguously from a stated requirement. Anything else
  goes in an optional "Suggestions (non-scoring)" list.
- Don't trust the change manifest's claims — read the actual files and re-run the checks yourself.
- Same inputs must produce the same scores: use the rubric below literally.

## Step 1 — Gather context

Read:

- The input md and every file it lists (full files, not just excerpts); also `git diff` / `git status`
  to catch changes the md forgot to list (report omissions as findings).
- Every file in `.ai/context/`, plus `.ai/skills/_shared/framework-guidelines.md`, plus any
  persistent assistant memory your tool keeps for this repo, if present.
- The requirements doc, plan and exploration files referenced by the md.

## Step 2 — Verify independently

```bash
pnpm --filter <pkg> exec tsc --noEmit
pnpm --filter <pkg> exec eslint <changed files>
pnpm --filter <pkg> exec prettier --check <changed files>
node .ci/enforce-bom-rules.mjs
pnpm --filter <pkg> test -- --list --grep "<tags of changed tests>"
```

Run the changed tests **with the sandbox override from the start**. Record exact results. Known
environment gaps from `.ai/context/framework-learnings.md` are noted, not scored as defects.

## Step 3 — Review checklist

Correctness

- Assertions actually prove the requirement (right locator/schema, right expected value, not
  tautological).
- Locators/request shapes exist in the exploration evidence; no guessed selectors; headings
  scoped with `level`.
- Async correctness: every Playwright call awaited; no floating promises; no race-prone patterns.
- Fixture scope/teardown correct; test isolation (no shared mutable module-level state between
  tests).

Repo rules (`.ai/context/` + `.ai/skills/_shared/framework-guidelines.md`)

- Tags: `tag` option used, classification + unique tag per test, no duplicate unique tags
  (`grep -rn`).
- **Layering (§2):** no BOM package carries real source; no base package hardcodes a version its
  BOM already manages; dependency direction between base packages is one-way; a new internal
  cross-package dependency pins the exact workspace version.
- **BOM enforcement/override (§5):** any new managed dependency or new `overridable` entry is a
  deliberate, justified edit to a `qe.bom.json` — flag an unjustified or overly broad
  `overridable` addition as a blocker (it weakens the enforcement guarantee for every downstream
  consumer). A runtime dependency being added to `overridable` without a strong stated reason is
  always at least a major finding.
- Exploration artifact present for any new browser/HTTP touchpoint; versions pinned match the
  lockfile; flat ESLint config.

Principles a–j (`.ai/skills/_shared/framework-guidelines.md` §3) — layering, reuse, config,
readability, maintainability, scalability, robustness (no hard waits/`test.only`), reporting,
security (no secrets/PII), CI readiness.

## Step 4 — Score (1–5 each)

| Score | Meaning                                                                                                   |
| ----- | --------------------------------------------------------------------------------------------------------- |
| 5     | No findings.                                                                                              |
| 4     | Only minor/nit findings; nothing affecting behaviour or rules.                                            |
| 3     | At least one major finding (maintainability/rule deviation) but no correctness defect.                    |
| 2     | At least one correctness defect or a non-negotiable `.ai/context/`/`framework-guidelines.md` rule broken. |
| 1     | Multiple correctness defects, or the change does not typecheck / self-tests cannot run due to the code.   |

Parameters: **Correctness**, **Requirement coverage**, **Architecture & reusability (a, b)**,
**Configurability (c)**, **Readability & style (d)**, **Maintainability (e)**,
**Scalability & tagging (f)**, **Robustness & reliability (g)**, **Reporting & traceability (h)**,
**Security & data hygiene (i)**, **CI/CD readiness (j)**, **BOM layering & enforcement
compliance (`framework-guidelines.md` §2, §5)**, **Repo-rule compliance (`.ai/context/`)**.

Mark a parameter `N/A` if the change doesn't touch it. **Overall** = the minimum of Correctness,
Requirement coverage, and BOM layering & enforcement compliance, otherwise the rounded mean — a
change with a correctness defect, or a BOM/layering violation, can't score above 2 overall.
**Verdict**: `Approve` (overall ≥ 4 and no blocker) · `Approve with nits` · `Changes requested`
(any blocker or overall ≤ 3).

## Step 5 — Write the report

Write `docs/reviews/<slug>-review-cycle-<n>.md` (derive the slug from the input file; if a review
already exists, append `-cycle-<n>` and link the previous one):

1. Scope reviewed (input md, files, commit/diff base) and verification results.
2. Scorecard table: `Parameter | Score | Justification`.
3. **Coverage matrix**: `Requirement/AC | Covered by (test + tag) | Status (covered/partial/missing)`.
4. Findings table, most severe first: `ID | Severity (blocker/major/minor/nit) | file:line | Issue | Rule/requirement | Suggested fix`.
5. Suggestions (non-scoring).
6. Verdict and what must change for approval.
7. Proposed new learnings for `.ai/context/framework-learnings.md`, if the review surfaced a
   non-obvious, reusable lesson.

If your tool has a structured findings/review-comment feature and the caller asked for it, also
report findings there. Tell the user the verdict, overall score and report path.
