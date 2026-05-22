# Goable Activity Physics Profiles Catalog

This directory holds the **Activity Physics Profiles** consumed by the Goable
scoring engine. Each profile is a YAML file describing how a single outdoor
activity is scored: which physical quantities matter, how much each one
contributes, and which combinations are unsafe.

> **Long-term plan:** this catalog will be extracted into a separate public
> repository (`goable/profiles`) under **CC BY 4.0**, with community
> contributions accepted via GitHub Issues and Pull Requests. The scoring
> engine remains proprietary. See
> `docs/superpowers/specs/2026-05-20-engine-design.md` § 4.7 for the full
> open-catalog governance model.

---

## Categories

The catalog is organised by activity family. The schema's `category` field
(`packages/profiles/src/schema.ts`) accepts: `water`, `snow`, `air`, `land`,
`commercial`. Subdirectories follow:

| Category | Directory | Base profiles | Regional / spot variants | Phase | Status |
|---|---|---|---|---|---|
| Water sports | `water/` | 12 (kitesurfing, windsurfing, surfing, SUP, sailing, scuba, snorkeling, wakeboarding, wing-foiling, kayak, jet-ski, boat-excursion) | regional (mediterranean, atlantic), spot (Tarifa) | Phase 1 | Production-ready |
| Snow sports | `snow/` | 2 (ski-touring, freeride) | regional (ski-touring-alpine), spot (freeride-chamonix) | Phase 4 | Draft (architectural demo) |
| Air sports | `air/` | 2 (paragliding, hang-gliding) | regional (paragliding-alpine), spot (paragliding-oludeniz) | Phase 4 | Draft (architectural demo) |
| Land outdoor | `land/` | 2 (trekking, climbing) | regional (trekking-alpine), spot (trekking-dolomites-tre-cime) | Phase 5+ opportunistic | Draft (architectural demo) |
| Commercial | `commercial/` | (none yet) | — | Out of 5-year scope | Not started |

The snow and air profiles in this repository are **architectural
demonstrations** that the engine handles multi-domain scoring with the
same YAML structure, schema, and runtime path as water profiles. They use
the currently-implemented `MetricEnum` and will be refined once L1d and
L1e (`docs/superpowers/specs/2026-05-20-engine-design.md`) add domain-
specific metrics: `thermal_lift_index`, `snow_surface_quality`,
`snowpack_stability_class`, `convective_cloud_base_m`, `aqi_composite`,
and others.

---

## Profile file structure

```
catalog/
  <category>/
    <activity-slug>/
      index.yaml              ← canonical global profile
      regional/               ← optional region-specific overrides (extends: ...)
        mediterranean.yaml
        atlantic.yaml
      spots/                  ← optional spot-specific profiles (Phase 4)
        tarifa.yaml
        nazare.yaml
```

Each `index.yaml` must validate against `packages/profiles/src/schema.ts`.
Key required fields: `slug`, `version` (semver), `category`, `display_name`
(per-locale), `dimensions` (weights summing to 1), `gates` (safety
hard-gates), `verdict_buckets`, optional `sustainability` block.

---

## Schema summary

```yaml
slug: example-activity
version: "1.0.0"
category: water | snow | air | land | commercial
display_name:
  en: ...
  it: ...
description:
  en: |
    Free text describing the activity, conditions that favour it, and
    why specific physical quantities matter for safety and quality.
extends: null                # optional: parent profile slug for inheritance
region: null                 # optional: mediterranean | atlantic | ... | global

dimensions:                  # weights MUST sum to 1.0
  - name: <human-readable>
    metric: <from MetricEnum>
    weight: 0.30
    curve:                   # piecewise-linear (x, s) suitability function
      - { x: 0, s: 0.0 }
      - { x: 10, s: 1.0 }
    modifiers:               # optional
      gust_factor_penalty: { threshold: 1.4, penalty_coefficient: 0.5 }
      direction_preference: [...]

gates:                       # hard safety constraints; trigger -> score=0
  - metric: <metric>
    condition: lt | gt | in | not_in | between
    value: <scalar | array>
    reason_code: SOMETHING_DESCRIPTIVE
    description: Why this gate exists in plain language.

sustainability:              # optional but recommended for research dataset
  carbon_neutral: true
  equipment_dependency: none | low | medium | high
  typical_season_weeks: 28
  carrying_capacity_sensitivity: low | medium | high
  notes: |
    Free text on lifecycle, conservation considerations, etc.

verdict_buckets:
  unsafe: 0
  poor: [1, 30]
  marginal: [31, 50]
  fair: [51, 70]
  favorable: [71, 85]
  excellent: [86, 100]

meta:
  reviewed_by: ["Name (Affiliation)", ...]
  sources: ["Citation 1", "URL 2", ...]
  review_status: draft | provisional | validated | calibrated
  notes: |
    Provenance, known limitations, calibration plan.
```

---

## Contributing a profile (current internal process)

Until the catalog is extracted to a public repository (planned: Phase 4),
contributions go through internal review:

1. Branch from `main` (or current working branch)
2. Create `<category>/<activity-slug>/index.yaml` following the schema above
3. Ensure `pnpm test --filter @goable-io/profiles` passes (schema + weight-sum)
4. Open a PR with: profile YAML, references for chosen thresholds, and a
   short rationale for the curve shapes
5. Founder review + (where available) domain expert sign-off via the
   `meta.reviewed_by` list

After Phase 4 extraction the same workflow runs on the public
`goable/profiles` repository, with PRs accepted from external domain
experts (kite instructors, certified avalanche professionals, IFMGA
guides, paragliding examiners, etc.).

---

## Why open catalog, closed engine?

This is the most-asked question. Short answer:

- **Physics formulas** (in `@goable-io/physics`) and **profile YAMLs** become
  the **open standard**. Open earns credibility, attracts contributors,
  and accelerates catalog coverage — exactly what we want.
- **Scoring engine, ensemble logic, ML calibration** stay proprietary.
  These are the actual product moat: the composition of physics + curves
  + gates into a calibrated score with confidence intervals and a
  multi-tenant audit log.
- The YAML alone, without the engine, scores nothing. Anyone can fork
  the profiles and re-implement scoring; over time the *catalog quality
  + endorsement network* is the moat, not the data files in isolation.

Full rationale in `docs/superpowers/specs/2026-05-20-engine-design.md`
§ 4.7 "Open catalog governance".
