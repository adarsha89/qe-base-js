# Step-by-Step Construction Guide

The 12 verified phases for `learn-and-build-framework`'s BUILD mode. Each phase has its own
verification gate — don't move to the next phase until the current one's gate passes.

1. **Phase 1: Toolchain & Workspace Setup.** `pnpm-workspace.yaml`, root `package.json` (shared
   devDependencies: `typescript`, `eslint`, `prettier`, their plugins), `tsconfig.base.json`
   (strict, Node types), `eslint.config.mjs` (flat config), `.prettierrc`.
   - _Verification:_ `pnpm install && pnpm -r exec tsc --noEmit`
2. **Phase 2: BOM Packages & `qe-bom-guard`.** Create `packages/bom-js/` (`package.json` +
   `qe.bom.json` with the initial `managed`/`overridable` maps) and implement the `qe-bom-guard`
   CLI in `@qe/base-js` (resolve a consumer's lockfile, compare against a BOM's `managed` map,
   respect `overridable` + the consumer's own override config, exit non-zero on an unauthorized
   mismatch).
   - _Verification:_ a self-test that runs `qe-bom-guard check` against a fixture "consumer"
     workspace with a deliberately mismatched version, both allowed (in `overridable`) and
     disallowed, asserting the correct PASS/FAIL for each.
3. **Phase 3: Typed Config & Zod Validation.** Implement each package's config module with a Zod
   schema and explicit defaults.
   - _Verification:_ a self-test asserting the schema throws on a missing/malformed required var
     and resolves defaults correctly when optional vars are absent.
4. **Phase 4: Fixtures Subsystem.** Implement `src/fixtures.ts` per package with `test.extend`,
   worker-scoped and test-scoped fixtures as appropriate to that package's technology.
   - _Verification:_ `pnpm --filter <pkg> exec tsc --noEmit`; a self-test verifying fixture
     resolution and teardown ordering.
5. **Phase 5: Page Object Model (web package).** Implement `BasePage` and domain page objects
   encapsulating locators and actions. Enforce accessible selectors and `level` scoping for
   headings.
   - _Verification:_ `pnpm --filter @qe/base-web-js exec tsc --noEmit`
6. **Phase 6: API Client & Request Context Layer (api package).** Implement a base client
   wrapper and typed client classes using Playwright's `request` fixture/`APIRequestContext`,
   with Zod response validation.
   - _Verification:_ `pnpm --filter @qe/base-api-js exec tsc --noEmit`; self-tests against a
     local mock server.
7. **Phase 7: Synthetic Test Data Builders.** Implement Faker-powered builders ensuring self-tests
   never inline raw literals or PII.
   - _Verification:_ builder unit execution.
8. **Phase 8: BDD Glue (web-cucumber package).** Implement `@cucumber/cucumber` + `playwright-bdd`
   step definitions and hooks, reusing `@qe/base-js` fixtures only (not `@qe/base-web-js`).
   - _Verification:_ run the BDD self-test suite with the sandbox override.
9. **Phase 9: Mutation Testing Subsystem.** Implement the mutation switch module, the per-package
   `mutation-test-map.csv`, and bind the first few mutations to existing `@p0`/`@p1` self-tests.
   - _Verification:_ run the bound self-tests with `MUTATION_ENABLED=false` (unchanged behavior)
     and then `MUTATION_ENABLED=true` with one `MUTATION_ID` at a time (defect caught).
10. **Phase 10: Strict Test Tagging & Project Execution.** Tag every self-test with Playwright's
    `tag` array option (classification + priority + unique scenario tag).
    - _Verification:_ `pnpm --filter <pkg> test -- --grep @unit --project=chromium` (with sandbox
      override); `grep -rn "@<tag>" packages/*/src` to confirm no duplicate unique tags.
11. **Phase 11: Observability, Logging & Reporting.** Configure the shared logger module, HTML +
    JUnit reporters per package, and trace/video/screenshot retention on failure.
    - _Verification:_ verify report generation under each package's own report directory.
12. **Phase 12: CI/CD & Publish Pipeline.** Build `.github/workflows/ci.yml` (the real file — see
    `framework-guidelines.md` §1) with install → cache browsers → lint/typecheck/prettier → BOM
    enforcement → sharded self-tests → publish-on-tag.
    - _Final Verification:_ `pnpm -r exec tsc --noEmit && pnpm -r lint && pnpm -r exec prettier --check . && node .ci/enforce-bom-rules.mjs && pnpm -r test -- --project=chromium` (with sandbox override).
