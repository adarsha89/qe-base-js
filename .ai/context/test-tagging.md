# Test Tagging

Rules for tagging every self-test in this repo (there are no end-to-end product tests here —
every test proves the framework's own fixtures/base classes/utilities behave correctly).

- **Every testcase must carry tags, added or updated whenever a testcase is created or modified.**
  Use Playwright Test's `tag` option (the options object passed as the second argument to
  `test()`, e.g. `test('BrowserFactory reuses a context per worker', { tag: ['@unit', '@browser-factory-reuses-context'] }, async () => { ... })`),
  not inline `@tag` text appended to the title string. Tag values still start with `@` per
  Playwright's convention.
- **Every testcase must have its own unique tag that identifies specifically what it tests**, in
  addition to any shared classification tags, all listed in the same `tag` array. Classification
  tags for this repo: `@unit` (no browser/socket), `@integration` (spawns a real browser or binds
  a local mock-server port — needs the sandbox override), `@bom` (BOM-manifest/enforcement
  self-tests), `@framework` (cross-package self-tests, e.g. `scaffold-qe-module`'s own
  verification). The unique tag should read as a short, kebab-case description of the scenario
  under test (e.g. `@retry-helper-retries-transient-failure`, `@bom-guard-blocks-unlisted-override`),
  so a single tag alone is enough to identify which testcase ran/failed in a report without
  opening the file. Do not reuse a unique tag across two different testcases, even across
  packages — `grep -rn "@<tag>" packages/*/src` to check before adding one.
- When adding a new testcase or editing an existing one's behavior, review its tags as part of
  the change: add the unique scenario tag if missing, and add/update classification tags in the
  `tag` array to reflect what the test now covers.
