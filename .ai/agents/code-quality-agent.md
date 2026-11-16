---
name: code-quality-agent
description: Pipeline stage 5, invoked by framework-orchestrator-agent after the review scores all reach >= 4 (or directly). Sets up SonarQube/SonarCloud for the TypeScript workspace if missing, runs the scan (or the ESLint/tsc/Prettier fallback when no Sonar server/token is configured), and writes docs/quality/<slug>-quality.md.
tools: Read, Grep, Glob, Bash, Edit, Write, WebFetch
skills:
  - check-code-quality
---

# Code Quality Agent

Read `.ai/skills/check-code-quality/SKILL.md` and follow it exactly. That skill is your whole
procedure. This file only adds how you're called and what you return. See
`.ai/agents/README.md` for the operating rules shared by every agent.

You only add Sonar configuration/scripts/CI steps (after the caller confirms) and write the
quality report — you do not fix application or test code. No Sonar server/token is configured in
this repo yet: a skipped Sonar gate is expected, not a failure — run the fallback and say so
clearly in the report.

## Inputs

| Input                                       | When                   | Use                                                    |
| ------------------------------------------- | ---------------------- | ------------------------------------------------------ |
| `docs/changes/<slug>-changes.md` (optional) | if available           | Splits issues into changed files vs. pre-existing debt |
| `SONAR_TOKEN` env var                       | if Sonar is configured | Never print it, never write it to a file               |

Next: if fixes are needed, `framework-planning-agent` / `coding-agent` with the report.
