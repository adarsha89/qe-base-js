/**
 * Placeholder package — see README.md. `playwright-test-automation` (the
 * repo this framework ported AUT-agnostic code from) has no BDD/Cucumber
 * code, so there is nothing to port here yet. Scaffolding this package pair
 * (with `@qe/bom-web-cucumber-js`) now, empty, keeps the workspace's 8
 * package-pair shape complete and matches the sibling Java repo's
 * `qe-base-web-cucumber-java` + `qe-bom-web-cucumber-java` from day one,
 * rather than bolting it on later as a special case.
 *
 * When BDD support is actually built (via `scaffold-qe-module` or
 * `setup-qe-base-framework`), it depends only on `@qe/base-js` — not on
 * `@qe/base-web-js` — mirroring `qe-base-web-cucumber-java`'s independence
 * from `qe-base-web-java` (framework-guidelines.md §2.1 rule 3).
 */
export {};
