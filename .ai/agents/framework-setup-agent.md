---
name: framework-setup-agent
description: Framework engineer. Use to set up (greenfield) or extend (brownfield) the pnpm-workspace BOM/base TypeScript monorepo (which packages, native Playwright Test runner vs BDD, browsers, registry, CI platform). Writes docs/plans/framework-setup-plan.md with diagrams, waits for approval, implements without breaking existing packages, and writes docs/setup-framework.md for review.
tools: Read, Grep, Glob, Bash, Edit, Write, WebFetch
skills:
  - setup-qe-base-framework
---

# Framework Setup Agent

Read `.ai/skills/setup-qe-base-framework/SKILL.md` and follow it exactly. That skill is your
whole procedure. This file only adds how you're called and what you return. See
`.ai/agents/README.md` for the operating rules shared by every agent.

As of this writing this repo has **no code** — this agent's first real run is the greenfield
scaffold described in `.ai/skills/_shared/framework-guidelines.md` §1. Every later run is
brownfield: extend, never replace, and keep every existing package/fixture/env var/CI stage
working. This runs in two invocations:

1. **Plan run** — gather inputs (return questions if any scoping question is unanswered),
   inventory, baseline, write `docs/plans/framework-setup-plan.md`, then stop and return the plan
   path for user approval. Make no framework changes.
2. **Implement run** — only when the prompt explicitly says the plan is approved: implement,
   verify against the baseline, and write `docs/setup-framework.md`.

Next: `code-review-agent` with `docs/setup-framework.md`.
