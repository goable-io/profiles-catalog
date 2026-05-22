# Contributing to goable-io/profiles-catalog

Thanks for considering a contribution! This catalog grows through
community input.

## What this catalog is

A set of YAML files under `catalog/`, one per activity (with optional
regional + spot variants), describing how weather inputs combine into a
0-100 suitability score. Each profile lists its sources and a `maturity`
tag (`provisional` | `reviewed` | `calibrated`).

## Contribution workflow

1. **Fork** this repository.
2. **Add or modify** a YAML under `catalog/<family>/<activity>/`.
   - For new activities: copy an existing similar profile as a template.
   - For regional variants: `catalog/<family>/<activity>/regions/<region>.yaml` extends `index.yaml`.
   - For spot variants: `catalog/<family>/<activity>/spots/<slug>.yaml` extends a region or base.
3. **Run `pnpm validate` locally** — must pass before opening a PR.
4. **Open the PR** and fill in the template (maturity tag, citations, rationale).
5. **Reviewer SLA**: a maintainer responds within 1 week.
6. **Merge** → automatic patch-version bump + npm publish via CI.

## Curve modification policy

When proposing a change to an existing curve parameter (e.g. "kitesurfing
optimal wind should be 22 kn not 20 kn"), the PR must include:

- **Citation** — a published source (sport-science paper, equipment
  manufacturer recommendation, or industry-standards body like IKO, IFMGA,
  CIVL, FFCAM).
- **Sample** — how many practitioner-sessions the contributor's
  experience is based on. ≥100 sessions is meaningful.
- **Alternative proposal** — if disagreeing with the existing value,
  propose a new value with rationale, not just "this is wrong".

Disagreements that can't be resolved by citation are decided by the
maintainer (see `GOVERNANCE.md`). The decision is recorded in the
profile's `meta.notes` for transparency.

## Maturity levels

- **`provisional`** — author-only, no external review yet. New activity
  profiles start here. `reviewed_by` may be empty.
- **`reviewed`** — at least one external practitioner / scientist has
  reviewed. `reviewed_by` must have ≥2 entries; `sources` ≥1.
- **`calibrated`** — backed by Goable's L3 outcome-data pipeline.
  **Not user-claimable**: schema validation requires a `meta.calibration`
  block whenever `maturity === "calibrated"`, and only Goable's L3
  pipeline emits those values.

## Schema sync with the engine

The Zod schema in `schema/profile.schema.ts` is byte-identical to
`packages/profiles/src/schema.ts` in the goable-io/goable monorepo
(checked by a CI test there). When the schema changes, the monorepo PR
and the catalog PR ship together.

## Code of conduct

Be kind. See `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1).

## Questions

Open an issue with the `question` label, or reach out to the maintainer
listed in `MAINTAINERS.md`.
