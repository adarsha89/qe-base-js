# Interview Topics Catalog

Detailed topic questions for `learn-and-build-framework`'s INTERVIEW_PREP mode. Each question
should be answered with a concrete reference to this repo's actual code once it exists (file +
symbol), or explicitly marked as target-architecture reasoning before it does.

## 1. Architecture & the BOM mechanism

- Why does this repo pair a BOM package with a base package per technology slice, instead of one
  flat `package.json`?
- Walk through what happens when a downstream consumer's `pnpm.overrides` tries to pin
  `@playwright/test` to a version different from `@qe/bom-web-js`'s `managed` entry, when
  `@playwright/test` is **not** in `overridable`.
- What's the difference between a dependency that's simply absent from a BOM's `managed`/
  `overridable` maps, and one that's explicitly `overridable`?
- How would you add a new technology slice (say, GraphQL) without breaking any existing package?
  (Answer should reference `scaffold-qe-module`.)

## 2. Parallel safety & fixtures

- Why is `test.extend` preferred over a shared base-class/`beforeEach` pattern here?
- What category of bug does "no shared mutable module-level state" actually prevent? Give a
  concrete example of what would go wrong if a browser-context factory cached one context in a
  module-level variable.
- Worker-scoped vs test-scoped fixture: when would you choose each, and what's the cost of
  getting it wrong in both directions?

## 3. Playwright vs alternatives

- Playwright vs Selenium: how does this repo's web package differ architecturally from the
  sibling Java framework's Selenium-based `qe-base-web-java`, and why?
- Playwright vs Cypress: what does out-of-process, multi-browser-engine automation buy you that
  an in-browser test runner can't?

## 4. Mutation testing

- Why is this repo's mutation testing hand-wired to specific existing tests instead of using an
  automatic mutant-generation tool?
- What does `MUTATION_ENABLED=false` guarantee, and how would you prove that guarantee in review?
- A mutation "survives" — what three things must you check before concluding it's a real
  assertion-quality gap (vs. a mis-set-up mutation or an environment artifact)?

## 5. Tagging, CI & publishing

- Why does every self-test need a globally unique scenario tag, and what breaks if two tests
  share one?
- Walk through the CI pipeline from a PR being opened to a package landing in the registry on a
  tagged release — where does `qe-bom-guard` run, and why there?
- Why must the real `ci.yml` live at `.github/workflows/ci.yml` rather than being a symlink
  pointing elsewhere, while a `.ci/github/workflows/ci.yml` symlink pointing _back_ to it is fine?

## 6. Live coding challenges

1. **Custom fixture**: write a worker-scoped `test.extend` fixture that lazily creates one shared
   resource and tears it down once, after the last test in that worker.
2. **`qe-bom-guard`-style checker**: given a `managed` map, an `overridable` list, a "resolved"
   map, and a consumer's own override declarations, return the list of violations.
3. **Race-free interceptor**: fix a `page.click()` followed by `await page.waitForResponse(...)`
   that misses a fast response — rewrite it with `Promise.all`.
4. **Mutation switch**: implement a module exposing `mutationEnabled()`/`mutationId()`, gated on
   env vars, with a test proving disabled-mode is a true no-op.

## 7. STAR scenarios (source from `.ai/context/framework-learnings.md` as they accumulate)

- A time a sandboxed environment's browser-launch or port-bind restriction looked like a real
  framework defect until proven otherwise.
- A time two libraries pulled the same transitive dependency at different versions and a BOM's
  `managed` map had to pin the higher one explicitly.
- A time a review caught an unjustified `overridable` addition before it shipped.

## 8. Rapid-fire (aim for 30; grow this list as the framework is actually built)

- What's the difference between a `@qe/bom-*-js` and a `@qe/base-*-js` package, in one sentence?
- What does `pnpm --filter <pkg>...` (with the ellipsis) select, versus `pnpm --filter <pkg>`?
- Why does a base package's `package.json` dependency version have to match its BOM's `managed`
  entry exactly, even though npm would resolve a caret range too?
- What's the one thing `qe-bom-guard` must never do, concurrency-wise, when run across CI shards?
- (Continue filling in as real code and real review findings accumulate — don't pad this list
  with generic trivia unconnected to this repo's actual decisions.)
