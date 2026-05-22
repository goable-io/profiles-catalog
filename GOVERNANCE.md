# Governance

## How decisions are made

**v1 (current)**: the founding maintainer is the sole decision-maker on
disputed PRs and on curve changes that lack consensus. All decisions are
recorded in `meta.notes` on the affected profile, with the rationale.

**v2 (when there are ≥3 maintainers)**: simple majority vote among
active maintainers. Tie-breaker: the maintainer whose primary activity
family the profile belongs to.

## What "calibrated" means

A profile tagged `maturity: calibrated` is backed by Goable's L3
outcome-data pipeline (statistical refitting of the curve against paired
forecast × user-reported-outcome data). The schema enforces a
`meta.calibration` block on calibrated profiles with these fields:

- `datasetVersion` — the outcome dataset snapshot used (e.g. `outcomes-2026Q4-v3`)
- `modelVersion` — the calibration model identifier (e.g. `L3-isotonic-v1.2`)
- `samples` — number of paired outcomes the curve was fit against
- `fitDate` — ISO date of the fitting run

External contributors **cannot** mark a profile as calibrated. The schema
rejects it. Calibrated curves arrive via PRs opened by the Goable
engineering team, not the community.

## Disagreements

Citation-led. The PR author cites their source; reviewers cite theirs. If
both are credible and conflict, the maintainer decides and records the
rationale in `meta.notes`. Forking is welcome — anyone who disagrees
with a maintainer call can fork the catalog and propose a merge later.

## Schema changes

Schema modifications (adding/removing fields, tightening constraints) are
treated as major versions and require a coordinated PR with the
`goable-io/goable` monorepo so the engine and the data stay aligned.

## Future: maintainer rotation

Once external contributors are sustained (≥5 merged PRs each from ≥3
people), formalise a rotation. Maintainers serve 12-month renewable terms.

## Contact

For anything not addressed here: `contact@fabio-carucci.com` or open an
issue with the `governance` label.
