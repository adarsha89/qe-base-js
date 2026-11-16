# .ai — skills, agents and repo context

| Folder     | Contents                                                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `context/` | All repo rules and learnings, tool-agnostic. `CLAUDE.md` (Claude Code) and `AGENTS.md` (Codex, Cursor, Copilot, Gemini CLI, …) are thin pointers to it. Edit here, never in those entry files.                                             |
| `skills/`  | Step-by-step procedures (`<name>/SKILL.md`), plus `_shared/` reference docs every skill plans/implements/reviews against.                                                                                                                  |
| `agents/`  | Agent roles, one per skill, that run their skill autonomously and report back. Frontmatter uses the Claude Code subagent format; the body is plain instructions for any tool. Agents are thin wrappers — the procedure lives in the skill. |

Claude Code natively discovers skills/agents only from `.claude/skills` and `.claude/agents`, which are
symlinks to the folders here (`.claude/skills` and `.claude/agents` are gitignored — recreate them
after cloning; `.claude/settings.local.json` is local-only and also gitignored). Other tools
read the files directly as instructed by `AGENTS.md`:

```bash
mkdir -p .claude && ln -s ../.ai/skills .claude/skills && ln -s ../.ai/agents .claude/agents
```

`.ai/` itself (this folder) and the root `CLAUDE.md`/`AGENTS.md` **are** tracked in git — unlike
a leaf test-automation repo, this is a shared central framework: every contributor and every AI
tool working on it needs the same governance docs, so they can't be local-only.

## Context files

| File                                         | What it holds                                                                                                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `context/ai-assistant-instructions.md`       | Start here: tool-agnostic entry, reading order, terminology, skills/agents catalogue, per-tool wiring                                                              |
| `context/self-test-verification-workflow.md` | Non-negotiable explore-before-code rules for this framework's own self-tests (local stubs/mocks only — no live external target exists), codegen output conventions |
| `context/test-tagging.md`                    | Playwright Test `tag` option usage, classification + unique scenario tags                                                                                          |
| `context/framework-design-principles.md`     | Pointer to `skills/_shared/framework-guidelines.md` (the real content) + a short non-negotiable-rules summary                                                      |
| `context/framework-learnings.md`             | Growing, repo-specific lessons — this repo's shared memory across tools                                                                                            |

The architecture itself — workspace layering, the 10 design principles made concrete, module-
pairing conventions, verification commands, and (most importantly) the BOM dependency
enforcement/override mechanism — lives in
[`skills/_shared/framework-guidelines.md`](skills/_shared/framework-guidelines.md), not in
`context/`. That file is the single source of truth every skill and agent plans against.

## Skills and agents

See [`skills/README.md`](skills/README.md) and [`agents/README.md`](agents/README.md) for the
full catalogue, typical flows, and conventions.

## Playwright CLI skills

`playwright-cli`, `playwright-component-testing` and `playwright-trace` are the official Playwright
skills (`npx playwright init-skills`), vendored under `.ai/skills/` so they're model-agnostic like
everything else here — no pipeline agent, no Claude-specific wording. Reach for them directly for
live ad hoc browser driving/debugging of this framework's own self-test fixtures, React/Vue
component-test setup (if a future package needs it), or CLI trace inspection. Refresh by rerunning
the generator into a scratch directory and diffing — don't hand-edit the vendored copies.

The `playwright-cli` skill's own command is the real `@playwright/cli` npm package (bin:
`playwright-cli`), a `devDependency` of `@qe/base-web-js`/`@qe/base-web-cucumber-js` and of the
workspace root — run it as `pnpm exec playwright-cli <command>` (or, inside either package,
plain `playwright-cli <command>`) rather than installing it globally or falling back to
`npx playwright cli` every time.

## Playwright MCP

`@playwright/mcp` (bin: `playwright-mcp`) is also a `devDependency` of the same packages and the
workspace root, and is registered in the repo's [`.mcp.json`](../.mcp.json) as an MCP server
named `playwright` — an MCP-aware tool (Claude Code included) can drive a real browser directly
through it, as an alternative or complement to the `playwright-cli` skill's shell-command
interface. Same non-negotiable rule applies regardless of which interface is used: never explore
or write framework self-test code against a live external site — only the local stubs/mocks
described in `context/self-test-verification-workflow.md`.
