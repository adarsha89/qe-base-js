# Self-Test Verification Workflow

Non-negotiable rules for verifying this framework's own code before writing any self-test, and
for how framework changes get verified. This repo has **no live external target** — adapt the
spirit of "never guess, always verify against something real" to local stubs/mocks instead of a
real site, since that's all that exists here to verify against.

- **[TEMPERATURE 0 — NON-NEGOTIABLE] Never write a framework self-test's assertions from memory
  or from a design doc alone.** For a web-package change, drive the actual local fixture/mock
  page or the actual `BasePage`/browser-factory code with the `playwright-cli` skill
  (`open`/`goto`/`snapshot`/`click`/`fill`/…) before writing the test, exactly as you would
  explore a real target site. For an API-package change, exercise the actual local mock server
  (never assume a response shape) before asserting on it. This is a strict, zero-deviation rule —
  not a preference to weigh against convenience, time pressure, or the apparent simplicity of the
  change.
- **Every `playwright-cli` session opened for exploration must run headless — never pass
  `--headed`.** This applies to exploration only; a package's own checked-in
  `playwright.config.ts` for its actual self-test suite execution is unaffected by this rule.
- **Exploration must standardize on the `playwright-cli` skill, not throwaway scripts**, so the
  generated Playwright TypeScript for every action is actually captured and reviewable. Collect
  the generated code as you go and hand-author `docs/exploration/<slug>-codegen.ts` from it, with
  a comment block at the top disclosing it was produced via `playwright-cli` sessions. This
  generated file is a reference artifact for locators/flow, not finished code — it still gets
  refactored into the package's real fixtures/page objects/utilities, but reviewers can diff what
  was actually observed against what got implemented.
- **Verify framework changes on `chromium` only — never run or require `firefox`/`webkit` as
  part of planning, implementing or reviewing a change.** Use `--project=chromium` for every
  self-test run a skill or agent executes. Cross-browser coverage (when a downstream consumer's
  own test suite needs it) is that consumer's own responsibility; this repo's pipeline work only
  needs to prove a framework change works on one browser.
- **A non-interactive agent session cannot produce a genuine `npx playwright codegen` recording**
  (its recorder only captures a human physically driving the spawned browser). When exploration
  must happen without a human present, run a headed, live, scripted Playwright run against the
  local fixture/mock to verify every locator/attribute/response shape by printing/asserting it
  before trusting it, then hand-author the `docs/exploration/<slug>-codegen.ts` file from that
  verified output — with a comment block disclosing the substitution and why.
