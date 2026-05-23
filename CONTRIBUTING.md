# Contributing to goable-io/profiles-catalog

Thanks for considering a contribution! This catalog grows through
community input.

## What this catalog is

A set of YAML files under `catalog/`, organised in a 4-level hierarchy
(base → region → cluster → sub-spot), describing how weather inputs
combine into a 0-100 suitability score and which physical locations the
engine should match incoming coordinates against. Each profile lists its
sources and a `maturity` tag (`provisional` | `reviewed` | `calibrated`).

## YAML conventions (v2 schema)

The `spot_kind` field is required at the top of every YAML and **must
appear immediately after `slug`** as a matter of convention. It is the
discriminator used by the Zod schema and the single most useful piece of
context for a reviewer scanning a diff:

```yaml
slug: kitesurfing-spot-tarifa-balneario
spot_kind: sub-spot
version: "1.0.0"
# ...
```

## Contribution workflow

1. **Fork** this repository.
2. **Add or modify** a YAML under `catalog/<family>/<activity>/`,
   following the directory layout per kind:

   - **Base** (a new activity): `catalog/<family>/<activity>/index.yaml`
     with `spot_kind: base`. Dimensions weights must sum to 1.
   - **Region variant**:
     `catalog/<family>/<activity>/regions/<region>.yaml` with
     `spot_kind: region`, `extends: <base-slug>`, `region: <RegionEnum>`.
   - **Cluster** (a named geographic area with multiple sub-spots):
     `catalog/<family>/<activity>/clusters/<name>/index.yaml` with
     `spot_kind: cluster`, `extends: <base-or-region-slug>`,
     `sub_spots: [<list of child slugs>]`.
   - **Sub-spot** (a specific physical location within a cluster):
     `catalog/<family>/<activity>/clusters/<name>/sub-spots/<sub-name>.yaml`
     with `spot_kind: sub-spot`, `extends: <cluster-slug>`,
     `parent_cluster: <cluster-slug>`, `coordinates`, `tier`, and
     `tier_rationale.en` (≥3 sentences).
3. **Run `pnpm validate` locally** — must pass before opening a PR.
4. **Open the PR** and fill in the template (maturity tag, citations, rationale).
5. **Reviewer SLA**: a maintainer responds within 1 week.
6. **Merge** → automatic version bump + npm publish via CI (patch by
   default; major/minor requires editing `package.json` in the PR — see
   the release-process section in `CHANGELOG.md`).

## Sub-spot authoring rules

A sub-spot is the engine's spatial resolution unit. Authoring quality
directly affects matching accuracy and tier-based safety filtering.

- **Coordinates**: 4+ decimal precision (≈11 m), decimal degrees.
  Verify on a map before committing — coordinates wrong by 0.01° are
  off by ~1 km, more than most sub-spot radii.
- **`radius_m`**: how far from `center` the resolver will accept matches
  for this sub-spot. Choose based on the physical extent of the
  feature: 200-500 m for a defined beach launch, 1500-2500 m for a
  glacier descent zone, up to the 5000 m hard cap for very large
  features.
- **Tier**: a property of the *spot*, not the user. It captures "if a
  session here goes badly, how bad does it get". Tier definitions are
  objective:
  - `tier: 1` (forgiving): errors recoverable; shallow / sand / rescue
    present / on-shore wind / sheltered.
  - `tier: 2` (moderate): errors cost effort or gear; open water with
    rescue infrastructure; moderate exposure.
  - `tier: 3` (critical): errors potentially fatal; offshore wind,
    rocks/reef/cliffs, deep water, no rescue infrastructure, big swell,
    glaciated terrain, exposed multi-pitch.
- **`tier_rationale.en`**: at least 3 sentences with concrete physical
  features. Don't write "this is dangerous" — write "north-facing 45°
  slope with cliff bands below 200 m, lift-accessed with no patrol,
  recorded fatalities on Pas de Chèvre".
- **Cross-activity duplication**: a single physical location often
  supports multiple activities (Tarifa Balneario is both kite and
  windsurf-relevant, Ho'okipa is both windsurf and surf-relevant). Create
  one sub-spot YAML per activity under each activity's `clusters/<name>/
  sub-spots/` directory, with identical coordinates but activity-
  specific tier rationale, description, and (where relevant) curve
  overrides.

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
