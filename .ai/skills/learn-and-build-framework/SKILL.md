---
name: learn-and-build-framework
description: Model- and tool-agnostic skill to learn this TypeScript BOM/base central automation framework's architecture, build and code it package-by-package from scratch or by extending existing packages, and generate a comprehensive interview preparation guide covering design principles, the BOM dependency-enforcement/override mechanism, parallel-safety, mutation testing, and live coding scenarios.
---

# learn-and-build-framework

## Purpose

Provide a comprehensive, model- and tool-agnostic workflow to:

1. **Learn the Framework:** Deeply explore and understand the repository's architectural layers
   (workspace-level BOM↔base pairing, module-level fixture/config/client/page layering), design
   principles (a–j), and the BOM dependency-enforcement/override mechanism.
2. **Build and Code Step-by-Step:** Follow or execute a structured blueprint to construct or
   extend the framework package by package, with strict verification gates (`tsc --noEmit`,
   `eslint`, `prettier --check`, `pnpm test` with sandbox override, `node .ci/enforce-bom-rules.mjs`).
3. **Generate Interview Preparation File:** Create and maintain an exhaustive interview
   preparation guide (`docs/interview/framework-interview-guide.md`) containing architectural
   pitches, the BOM/override mechanism's tradeoffs, parallel-safety mechanics, Playwright vs
   Selenium/Cypress tradeoffs (the sibling Java framework uses Selenium — a natural comparison
   point), mutation testing, and live coding challenges grounded directly in this repository's
   codebase.

Phases (never skip or reorder within a mode):

- **LEARN:** 1 Inspect Repository & Toolchain → 2 Map Architectural Layers → 3 Ground Findings
  Against Real Code → 4 Output Architecture Blueprint.
- **BUILD:** 1 Toolchain & Workspace Setup → 2 BOM Packages & `qe-bom-guard` → 3 Typed Config &
  Zod Validation → 4 Fixtures Subsystem (`test.extend`) → 5 Page Object Model (web package) → 6
  API Client & Request Context (api package) → 7 Test Data & Builders → 8 BDD Glue (web-cucumber
  package) → 9 Mutation Testing → 10 Test Tagging & Project Routing → 11 Observability &
  Reporting → 12 CI/CD & Publish Pipeline.
- **INTERVIEW_PREP:** 1 Analyze Architecture Decisions → 2 Synthesize Parallel-Safety & BOM
  Enforcement Gotchas → 3 Formulate Technical & Coding Scenarios → 4 Write/Update
  `docs/interview/framework-interview-guide.md`.

---

## Inputs

| Input                   | Required | Default                                       | Description                                                                                          |
| ----------------------- | -------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `mode`                  | no       | `ALL`                                         | Operational mode: `LEARN`, `BUILD`, `INTERVIEW_PREP`, or `ALL`                                       |
| `layer_or_package`      | no       | all                                           | In `BUILD` mode, a specific package (e.g. `base-js`, `base-web-js`, `bom-api-js`) to scaffold/extend |
| `interview_output_path` | no       | `docs/interview/framework-interview-guide.md` | Target path for the generated interview preparation file                                             |
| `target_role`           | no       | `Senior SDET / QE Automation Architect`       | Target seniority/role for interview questions calibration                                            |

---

## Operating Modes & Procedures

### Mode 1: LEARN (Framework Architecture Discovery)

Once code exists, inspect the actual repository files (never rely on assumptions or filenames
alone). Before code exists, be explicit that this is target-architecture reasoning from
`.ai/skills/_shared/framework-guidelines.md`, not an observation of real code:

1. **Build & Toolchain:** Read the root `package.json`, `pnpm-workspace.yaml`,
   `tsconfig.base.json`, `eslint.config.mjs`, `.prettierrc`.
2. **BOM & Dependency Enforcement:** Inspect each `packages/bom-*-js/qe.bom.json` (`managed` /
   `overridable` maps) and `@qe/base-js`'s `qe-bom-guard` CLI implementation (§5 of
   `framework-guidelines.md`). This is the feature that makes the repo a _central_ framework —
   understand it before anything else.
3. **Typed Configuration Subsystem:** Inspect each package's config module and its Zod schema.
4. **Fixture Composition & Injection:** Inspect each package's `test.extend`-based fixtures file.
   Understand worker-scoped vs test-scoped fixtures, and how parallel-safety is guaranteed
   without a `ThreadLocal`-equivalent (Playwright Test's own fixture scoping does the job).
5. **Page Object Model (web package):** Inspect `BasePage` and any domain page objects. Verify
   locator encapsulation and `getByRole` with `level` heading scoping.
6. **API Client & Request Context Layer (api package):** Inspect the base client wrapper and any
   typed client classes.
7. **Test Data Management:** Inspect any data builders (Faker-style synthetic data).
8. **BDD glue (web-cucumber package):** Inspect step definitions and hooks, and how they reuse
   fixtures from `@qe/base-js` without depending on `@qe/base-web-js`.
9. **Mutation Testing Subsystem:** Inspect `src/__mutation__/` and the `mutation-test-map.csv`
   per package. Verify how the mutation switch module gates everything on `MUTATION_ENABLED` and
   why it must never run unattended in CI.
10. **Test Tagging & Projects:** Inspect self-test files. Verify the Playwright `tag` option with
    unique scenario tags and classification tags (`@unit`, `@integration`, `@bom`, `@framework`,
    `@p0`–`@p3`).
11. **Observability, Logging & Artifacts:** Inspect the shared logger module and each package's
    `playwright.config.ts` reporters/retention settings.
12. **CI/CD Pipeline:** Inspect `.github/workflows/ci.yml` (the real file — see
    `framework-guidelines.md` §1's note on why it can't be a symlink there). Verify browser
    caching, the BOM-enforcement step, and the publish job.

Refer to [`references/framework-architecture.md`](references/framework-architecture.md) for the
full architectural mapping.

---

### Mode 2: BUILD (Step-by-Step Construction)

Construct or extend the framework following the phases detailed in
[`references/step-by-step-guide.md`](references/step-by-step-guide.md), each with its own
verification gate (`tsc --noEmit`, `eslint`, `prettier --check`, `pnpm test` with sandbox
override, `node .ci/enforce-bom-rules.mjs` from phase 2 onward).

---

### Mode 3: INTERVIEW_PREP (Generate Interview Preparation File)

Generate or update the comprehensive interview preparation guide at
`docs/interview/framework-interview-guide.md`.

The generated interview preparation file **MUST** cover the following 10 sections with concrete
code references from this repo (or, before code exists, clearly labelled target-architecture
reasoning):

1. **Executive Pitch & Architecture Overview:** 30-second and 2-minute elevator pitches
   calibrated for Senior SDET and QE Automation Architect roles; full Mermaid architecture
   diagram (BOM↔base pairing).
2. **The BOM Dependency-Enforcement/Override Mechanism:** Why a separate BOM package per
   technology slice beats a flat `package.json` with `overrides`; the `managed`/`overridable`
   split and why runtime deps default to non-overridable; how `qe-bom-guard` is the TS analogue
   of `maven-enforcer-plugin`'s `dependencyConvergence`.
3. **Architectural Patterns & Tradeoffs:** Why `test.extend` fixtures were chosen over a
   `beforeEach`/base-class inheritance model; why locators are encapsulated inside page objects;
   why Zod environment validation beats raw `process.env`.
4. **Playwright vs Alternative Tools:** Comparison table and rationale (Playwright vs Selenium
   vs Cypress vs WebdriverIO) — useful context given the sibling Java framework (`qe-bom-base-java`)
   uses Selenium for its own web package.
5. **Parallel Safety & Worker Isolation:** How Playwright Test's own fixture scoping replaces
   Java's `ThreadLocal<TestExecutionContext>` pattern; what "no shared mutable module-level
   state" actually protects against.
6. **Mutation Testing & Test Quality:** How the deterministic hook-based mutation system works;
   why it's bound to existing tests rather than auto-generating mutants; why it's strictly
   prohibited on CI.
7. **Test Tagging, Sharding & CI/CD Scalability:** Playwright's `tag` option vs title `@tag`;
   unique scenario tagging; classification + priority tags; publish pipeline shape.
8. **Live Coding Challenges & Solutions:** 4 complete, runnable TypeScript coding problems
   frequently asked in SDET interviews:
   - Challenge 1: Custom Worker- and Test-Scoped Fixture (`test.extend`).
   - Challenge 2: A `qe-bom-guard`-style version-pin checker (given a "BOM" map and a "resolved"
     map, report violations, respecting an override allowlist).
   - Challenge 3: Race-Free Network Response Interceptor with Bounded Timeout
     (`Promise.all([waitForResponse, trigger()])`).
   - Challenge 4: A deterministic mutation-switch module gated by an env var, with isolation and
     cleanup guarantees.
9. **STAR Scenario-Based Interview Questions:** 3 detailed STAR stories derived from actual
   repository learnings (`.ai/context/framework-learnings.md`), e.g. diagnosing a sandboxed
   environment's browser-launch/port-bind failures vs a real framework defect; resolving a BOM
   convergence conflict between two libraries that pull the same transitive dependency at
   different versions.
10. **Rapid-Fire Technical Q&A:** 30 fast technical questions and answers for quick revision.

Refer to [`references/interview-topics-catalog.md`](references/interview-topics-catalog.md) for
detailed topic questions.

---

## Output Result Block

Every execution of this skill must end with the following standardized result block:

```text
STATUS: DONE | NEEDS_INPUT | BLOCKED
OUTPUT: <path to generated files, e.g. docs/interview/framework-interview-guide.md>
SUMMARY: <summary of framework layers analyzed/built and key interview prep highlights>
NEXT: <recommended next step, e.g. review interview guide, run verification command, or proceed with code implementation>
```
