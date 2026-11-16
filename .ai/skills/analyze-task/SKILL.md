---
name: analyze-task
description: Analyze a framework change request (ticket text, issue, feature doc) and turn it into a clear, explicit requirements document for changing this TypeScript BOM/base framework — goals, scope, acceptance criteria, compatibility constraints and environment needs — written like a Lead engineer briefing a junior contributor, with no implementation details. Writes docs/requirements/<slug>-requirements.md.
argument-hint: '<task description, file path, or link>'
---

# analyze-task

Input: the task (`$ARGUMENTS`) — free text, a file path, or a ticket/doc link. If a link can't
be read, ask the user to paste the content.

Output: `docs/requirements/<slug>-requirements.md` describing **what** must change and **how
success is judged** — never **how** to build it.

## Rules

- **No implementation details**: no class/module/file names, fixture designs, code snippets or
  library choices. (Naming the affected package, the managed dependency involved, or an external
  contract an API client must honor is fine — those are requirements, not implementation.)
- **No invention**: every requirement traces to the task, a referenced doc, or a user answer.
  Unknowns become explicit open questions, not assumptions. If an assumption is unavoidable,
  label it `ASSUMPTION` and list it for confirmation.
- Be explicit and testable: each acceptance criterion is observable and pass/fail
  (Given/When/Then is welcome).
- Respect the known constraints in `.ai/context/framework-learnings.md` and
  `.ai/skills/_shared/framework-guidelines.md` (e.g. no code exists yet until
  `setup-qe-base-framework` has run; a managed dependency's version is only ever changed via its
  `qe.bom.json`) and flag them as environment dependencies.

## Steps

1. Read every file in `.ai/context/`, `.ai/skills/_shared/framework-guidelines.md`, `README.md`
   (once it exists), and existing `docs/requirements/*` to avoid duplicating work already
   specified or built (check `packages/*/src` for existing coverage of the area).
2. Extract: which package(s) are affected, preconditions, flows (happy path + alternates +
   errors), contracts (a managed dependency's API surface, a consumer-facing export's signature),
   data variations, non-functional expectations (parallel-safety, performance) if stated.
3. If critical information is missing (which package, whether this is a new BOM-managed
   dependency or a code change, compatibility/breaking-change tolerance), ask the user **one
   question at a time** before writing. Keep questions to what genuinely blocks a clear
   requirement.
4. Choose a kebab-case `<slug>` and write the document.

## Re-analysis after review

Used when the `orchestrate-framework-changes` skill sends a failed review back (cycle ≥ 2).
Input: the original request, the existing `docs/requirements/<slug>-requirements.md` and the
latest `docs/reviews/<slug>-review-cycle-*.md`.

1. Keep the same slug and file; set `Status: Revision <n> (after review cycle <n−1>)`.
2. For every scorecard parameter below 4 and every blocker/major finding, decide whether it shows
   a requirement gap (missing/ambiguous AC, wrong scope, unstated constraint) or an implementation
   defect against a correct requirement.
3. Fix requirement gaps in the relevant sections. Add section `## 13. Review-cycle <n−1> findings
to resolve`: `Finding ID | Parameter (score) | Requirement impact | AC affected/added` — one row
   per finding, stated as observable outcomes. Implementation defects are listed with "no
   requirement change — implementation must satisfy AC-x" and a pointer to the review report for
   the `file:line` detail (still no implementation detail in this document).
4. Don't drop or weaken an existing AC to make a finding disappear; if a finding shows an AC was
   wrong, change it and record why in section 11.
5. Append a line to a `## Revision history` section at the end: date, cycle, what changed.

## Document structure

```markdown
# <Change> — Framework Requirements

Source: <task/ticket/links> · Date: <YYYY-MM-DD> · Status: Draft for review

## 1. Objective — why this change exists, in 2–4 sentences

## 2. Scope — in scope / out of scope (explicitly name exclusions and existing coverage)

## 3. Affected package(s) — which @qe/bom-_-js / @qe/base-_-js package(s), or "new pair" (see scaffold-qe-module)

## 4. Preconditions — framework state, existing consumers that must keep working

## 5. Scenarios — numbered; each with goal, steps in plain language, expected outcomes

## 6. Acceptance criteria — AC-1..n, observable and pass/fail, mapped to scenarios

## 7. Compatibility — breaking vs. additive; which downstream consumers are affected; BOM version bump implications

## 8. Classification — expected test classification tags (@unit/@integration/@bom/@framework)

## 9. Non-functional — only if stated (parallel-safety, performance, publish size)

## 10. Dependencies & risks — new managed dependency needed? environment gaps; BOM override implications

## 11. Open questions / assumptions

## 12. Definition of done — e.g. all ACs built and self-tested, reviewed, `.ai/context/` rules followed, BOM enforcement passes
```

Finish by summarising the objective and number of ACs, listing open questions, and suggesting
`plan-framework-code-changes docs/requirements/<slug>-requirements.md` as the next step.
