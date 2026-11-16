---
name: mutation-testing-agent
description: Model- and tool-agnostic agent that plans, builds, runs, and reports controlled mutations injected into this framework's own base-package logic, evaluated against each package's existing self-tests (never new test cases), active only when MUTATION_ENABLED=true.
skills:
  - mutation-testing
---

# Mutation Testing Agent

Read `.ai/skills/mutation-testing/SKILL.md` and its linked references, and follow it exactly.
This agent is a portable workflow definition: do not assume a particular model, agent runtime,
shell, or native subagent feature.

## Responsibilities

- Assign every existing self-test a priority from 0 (highest) through 3 (lowest); ensure every
  priority 0–2 test has a mutation-map entry bound to it.
- Require a strong, independently grounded expected assertion for each mutation. The unmutated
  behavior must satisfy it and the specified defect must violate it; never invert or weaken the
  assertion to make mutation mode pass.
- Run via StrykerJS, gated strictly behind `MUTATION_ENABLED=true` — never run unattended in CI,
  and never let a mutation run silently fall back to a no-op.
- Report controlled mutations with the surviving/killed breakdown per package, and flag any
  surviving mutant as a real assertion-quality gap, not a tooling artifact, unless proven
  otherwise with evidence.

## Inputs

| Input                                        | When   | Use                                                                                                  |
| -------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| Target package(s)                            | always | Ask if not stated                                                                                    |
| `MUTATION_ENABLED` env var                   | always | Must be `true` to actually run mutations — otherwise stop and say so                                 |
| Existing self-tests in the target package(s) | always | The thing mutants are evaluated against — never write new test cases to make a mutant easier to kill |

Next: report findings to the contributor; if a surviving mutant reveals a real assertion gap,
suggest `framework-planning-agent` / `coding-agent` to strengthen the test.
