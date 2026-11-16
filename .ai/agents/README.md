# AI Agents: Framework Pipeline

Model- and tool-agnostic agent definitions. Each is a markdown file with YAML front matter
(`name`, `description`). No model or tool list is pinned, so every agent inherits whatever the
runtime provides. Each stage agent is a thin wrapper around exactly one skill in
[`.ai/skills/`](../skills/README.md) — the procedure lives in the skill, never duplicated here.

| Agent                                                             | Role                                                                                                                              | Skill                         |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| [`framework-orchestrator-agent`](framework-orchestrator-agent.md) | Entry point. Runs the loop, gates, memory, and summary. Holds the flow diagram.                                                   | n/a                           |
| [`task-analysis-agent`](task-analysis-agent.md)                   | Request (+ review report) → requirements                                                                                          | `analyze-task`                |
| [`framework-planning-agent`](framework-planning-agent.md)         | Requirements → approved plan                                                                                                      | `plan-framework-code-changes` |
| [`coding-agent`](coding-agent.md)                                 | Plan (+ review report) → code + change manifest                                                                                   | `make-code-changes`           |
| [`code-review-agent`](code-review-agent.md)                       | Manifest → review with scored parameters                                                                                          | `review-code-changes`         |
| [`code-quality-agent`](code-quality-agent.md)                     | Manifest → quality report (Sonar or ESLint/tsc fallback)                                                                          | `check-code-quality`          |
| [`mutation-testing-agent`](mutation-testing-agent.md)             | Plan, inject into existing package self-tests, execute (`MUTATION_ENABLED=true`), and report controlled framework-logic mutations | `mutation-testing`            |

### Framework-specific agents (run directly, not via the orchestrator)

| Agent                                                                   | Role                                                                                              | Skill                       |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------- |
| [`framework-setup-agent`](framework-setup-agent.md)                     | Scope the monorepo (packages, registry, CI platform) → plan (approval) → scaffold it              | `setup-qe-base-framework`   |
| [`learn-and-build-framework-agent`](learn-and-build-framework-agent.md) | Teach the architecture, guide/scaffold packages step by step, or generate an interview-prep guide | `learn-and-build-framework` |

### Standalone agents (outside the pipeline)

| Agent                                                                   | Role                                                         | Skill                      |
| ----------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------- |
| [`repo-learning-post-writer-agent`](repo-learning-post-writer-agent.md) | Repo → evidence-backed learning-post draft (never publishes) | `write-repo-learning-post` |

## Running

Run `framework-orchestrator-agent` as the top-level session, because it spawns the others
(in Claude Code, a sub-agent can't start other sub-agents — run the orchestrator from the main
session). Tools with native agent discovery should point at this folder (symlink or copy) rather
than keep their own copies. For Claude Code, `.ai/README.md` has the exact symlink command.

## Operating rules (all agents — not repeated per file)

- Load the agent's named skill and follow its `SKILL.md` step by step — that file is the
  procedure; the agent file only adds how it's invoked and what it returns.
- Read every file in `.ai/context/` first (start with `ai-assistant-instructions.md`) and the
  architecture in `.ai/skills/_shared/framework-guidelines.md`; their rules override everything
  else, including anything below.
- You may be running without a human watching. When the skill says to **ask the user** and the
  answer isn't in your prompt or in the repo, do not guess: stop and return the outstanding
  questions (numbered, with option lists) as your final message.
- Run any self-test that launches a real browser or binds a local mock-server port with the
  sandbox override from the start — never sandboxed first.
- Never print, request, write, or commit secrets/tokens.
- Your final message is the skill's result block (`STATUS / OUTPUT / SUMMARY / NEXT`), plus
  whatever extra the specific agent file asks for.
- Hand off artifact **paths**, not inlined content, to the next agent in the pipeline.
