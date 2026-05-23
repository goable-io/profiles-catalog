# Goable Activity Profiles Catalog

This directory holds the **Activity Profiles** that describe how a single
outdoor activity is scored: which physical quantities matter, how much
each one contributes, and which combinations are unsafe. Each profile is
a YAML file validated against [`schema/profile.schema.ts`](../schema/profile.schema.ts).

Open data under **CC BY 4.0**. The Goable scoring engine that consumes
this catalog is proprietary; the activity definitions are open.

---

## Categories

The catalog is organised by activity family. The schema's `category`
field accepts: `water`, `snow`, `air`, `land`, `commercial`.

| Category | Directory | Base profiles | Regional / spot variants |
|---|---|---|---|
| Water sports | `water/` | 12 (kitesurfing, windsurfing, surfing, SUP, sailing, scuba, snorkeling, wakeboarding, wing-foiling, kayak, jet-ski, boat-excursion) | regional (mediterranean, atlantic), spot (Tarifa, Nazaré) |
| Snow sports | `snow/` | 2 (ski-touring, freeride) | regional (ski-touring-alpine), spot (freeride-chamonix) |
| Air sports | `air/` | 2 (paragliding, hang-gliding) | regional (paragliding-alpine), spot (paragliding-oludeniz) |
| Land outdoor | `land/` | 2 (trekking, climbing) | regional (trekking-alpine), spot (trekking-dolomites-tre-cime) |
| Commercial | `commercial/` | (none yet) | — |

The snow, air, and land profiles use the currently-implemented
`MetricEnum`. Domain-specific metrics (e.g. `thermal_lift_index`,
`snow_surface_quality`, `aqi_composite`, `freezing_level_m`) are
declared in the schema and progressively adopted as community
contributions extend coverage.

---

## Profile file structure (v2 hierarchical schema)

```
catalog/
  <category>/
    <activity-slug>/
      index.yaml              ← base profile (spot_kind: base)
      regions/                ← region-specific overrides (spot_kind: region)
        mediterranean.yaml
        atlantic.yaml
      clusters/               ← named geographic areas (spot_kind: cluster)
        tarifa/
          index.yaml          ← cluster profile (sub_spots: [...])
          sub-spots/          ← physical locations within the cluster
            balneario.yaml    ← spot_kind: sub-spot
            valdevaqueros.yaml
```

Each YAML must validate against
[`schema/profile.schema.ts`](../schema/profile.schema.ts), which is a
discriminated union on `spot_kind`. Required fields per variant:

| Variant | Required fields |
|---|---|
| `base` | slug, spot_kind, version, category, display_name, dimensions (weights=1), verdict_buckets, meta |
| `region` | base fields + `extends`, `region` (RegionEnum) |
| `cluster` | base fields + `extends`, `sub_spots[]` (≥1 child slug) |
| `sub-spot` | slug, spot_kind, version, category, display_name, meta + `extends`, `parent_cluster`, `coordinates`, `tier` (1\|2\|3), `tier_rationale.en` |

On sub-spots, scoring fields (`dimensions`, `verdict_buckets`) are
**optional** — they inherit from the parent cluster when absent.

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
region: null                 # optional: mediterranean | atlantic | pacific | indian | alpine | global

dimensions:                  # weights MUST sum to 1.0 (tolerance 0.001)
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
  maturity: provisional | reviewed | calibrated
  reviewed_by: ["Name (Affiliation)", ...]
  sources: ["Citation 1", "URL 2", ...]
  notes: |
    Provenance, known limitations, calibration plan.
  calibration:               # REQUIRED iff maturity == "calibrated"
    datasetVersion: "outcomes-2026Q4-v3"
    modelVersion: "L3-isotonic-v1.2"
    samples: 4200
    fitDate: "2026-05-22"
```

The `calibrated` maturity tag is **reserved**: schema validation
rejects it without a `meta.calibration` block, and those values are
emitted only by Goable's L3 outcome-data pipeline. External
contributors use `provisional` or `reviewed`. See
[GOVERNANCE.md](../GOVERNANCE.md).

---

## Contributing a profile

See [CONTRIBUTING.md](../CONTRIBUTING.md). Short version:

1. Fork, branch from `main`
2. Add `<category>/<activity-slug>/index.yaml` following the schema
3. Run `pnpm validate` locally (must pass)
4. Open a PR using the template — include citations and rationale
5. Reviewer SLA: 1 week. Merge → automatic patch-version bump + npm publish

---

## Why open catalog, closed engine?

- The **YAML profiles** and the **schema** are the open standard. Open
  earns credibility, attracts domain-expert contributors, and
  accelerates catalog coverage.
- The **scoring engine** (ensemble logic, ML calibration, multi-tenant
  audit log) stays proprietary. The catalog alone, without the engine,
  scores nothing — anyone can fork the data and re-implement scoring.
  Over time the *catalog quality + endorsement network* is the moat.
