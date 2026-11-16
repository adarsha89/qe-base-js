# Results and Reporting

How to classify a mutation run's outcome and write it up. Output path:
`docs/mutation/<slug>-mutation.md` (see `.ai/skills/_shared/framework-guidelines.md` §7).

## Outcome classification

For each mutation run (one mutation ID, one test, isolated execution):

| Outcome                   | Meaning                                                                                                                                                       | Counts toward mutation score?                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Killed**                | The bound test failed, and the failure is directly attributable to the injected defect (the `expected_assertion` row's condition held)                        | Yes — this is the goal                                                                         |
| **Survived**              | The bound test passed despite the injected defect                                                                                                             | Yes — this is a real assertion-quality gap                                                     |
| **Baseline unhealthy**    | The same test, with `MUTATION_ENABLED=false`, already fails or is flaky                                                                                       | No — skip mutation evaluation for this test until the baseline is fixed, and say so explicitly |
| **Invalid / environment** | The run failed for a reason unrelated to the mutation (sandbox blocked a browser launch or a local port bind, a timeout caused by test infra, not the defect) | No — report separately, never count as Killed or Survived                                      |
| **Not run**               | Mapped but not yet executed this campaign                                                                                                                     | No — list as pending                                                                           |

Never reclassify a Survived result as Invalid without concrete evidence (a log line, a stack
trace) that the failure mechanism was actually environmental, not the defect.

## Metrics

Report per package and in total:

- **Mutation score** = Killed / (Killed + Survived) — explicitly exclude "Baseline unhealthy" and
  "Invalid / environment" from both the numerator and denominator.
- **Coverage** = (number of `@p0`/`@p1`/`@p2` tests with ≥ 1 mapped mutation) / (total `@p0`/`@p1`/`@p2` tests).
- Trend vs. the previous `docs/mutation/*.md` report for the same package, if any.

## Report structure

```markdown
# Mutation Testing Report: <package or slug>

| Field                         | Value                                                  |
| ----------------------------- | ------------------------------------------------------ |
| Date                          | <YYYY-MM-DD>                                           |
| Package(s)                    | `@qe/base-*-js`                                        |
| Mode(s) run                   | ANALYZE / GENERATE / VALIDATE / RUN / REPORT / IMPROVE |
| `MUTATION_ENABLED` validation | PASS/FAIL — disabled-mode behavior unchanged           |

## Summary

<mutation score, coverage, headline findings>

## Mutation results

| Mutation ID | Test | Target | Outcome | Evidence |
| ----------- | ---- | ------ | ------- | -------- |

## Survived mutations — assertion gaps

For each Survived result: what the existing assertion actually checks, why it didn't catch this
defect, and a proposed strengthening of that **same** test (never a new mutation-only test).

## Excluded from scoring

| Mutation ID | Test | Reason (baseline unhealthy / invalid environment) | Evidence |

## Infrastructure built this run

<hooks added, map rows added, files touched — distinct from "campaign executed">

## Limitations / unsupported layers

<what wasn't attempted and why>
```

Always distinguish infrastructure you built from a campaign you actually ran end to end. Never
report a mutation score for a campaign that wasn't fully executed — say "not run" instead.
