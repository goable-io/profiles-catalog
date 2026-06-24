# Changelog

All notable changes to `@goable-io/profiles-catalog` are documented here.
Versions follow [Semantic Versioning](https://semver.org/).

### Release process

Each merge to `main` triggers `.github/workflows/release.yml`, which
resolves the version to publish as follows:

- If `package.json.version` is **strictly greater** than the latest version
  on npm, that exact version is published. This is the manual path for
  major and minor bumps — edit `package.json` in the PR.
- If `package.json.version` **equals** npm latest, the workflow auto-bumps
  the patch component. This is the default path for routine merges.
- If `package.json.version` is **less than** npm latest, the workflow
  fails loudly. Drift between repo and npm is treated as an error.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased] — lands as 2.1.0

### Added — optional `skill_curves` block (L15 Phase 1c)

Profiles may now carry a pre-computed `SkillCurveFamily` emitted by the
Goable engine's L15 M4 latent-factor calibrator. When present, downstream
scoring engines can prefer these pre-computed values over the on-the-fly
fallback derived from the difficulty atlas — an optimisation, not a
correctness gate.

Shape:

```yaml
skill_curves:
  cohort_hash: "a1b2c3d4..."        # SHA-256 of the cohort parquet
  a: 1.42                            # M4 discrimination scalar (> 0)
  n_train: 4200                      # paired outcomes behind the fit
  levels: [-1, 0, 1]                 # θ quantile anchors (L entries)
  grid: [0, 5, 10, 15, 20]           # metric grid, strictly ascending (G entries)
  curves:                             # L × G suitability values ∈ [0, 1]
    - [0.05, 0.20, 0.55, 0.80, 0.95]  # beginner
    - [0.10, 0.30, 0.65, 0.90, 1.00]  # intermediate
    - [0.15, 0.40, 0.75, 0.95, 1.00]  # expert
```

- **Optional**: every existing profile continues to validate unchanged.
- **Reserved for `meta.maturity: "calibrated"`**: external contributors
  cannot fabricate `skill_curves` — the schema refinement rejects it
  on `provisional` and `reviewed` profiles. Only the L15 M4 pipeline
  emits this block.
- **Strict**: `.strict()` rejects unknown fields inside the block.
- **Cross-field validation**: `curves` must be `L × G`; `grid` must be
  strictly ascending; all suitability values ∈ [0, 1]; `a > 0`.

New exports:

```ts
import {
  SkillCurveFamilySchema,
  type SkillCurveFamily,
} from "@goable-io/profiles-catalog"
```

9 new tests in `tests/schema.test.ts` exercise the maturity gate,
shape constraints, monotonic-grid check, strict-unknown-field, and
backward-compatibility (every existing catalog profile still validates).

No catalog YAMLs change in this release — the block is emitted by the
L15 M4 fitter on the consumer side, never authored by hand.

### Bumped
- `package.json` version 2.0.0 → 2.1.0 (additive, no breaking).

## [2.0.0] — published 2026-05-23

### BREAKING — hierarchical 5-level schema

The profile schema is now a discriminated union on a new required field
`spot_kind`, with four variants:

```
base → region → cluster → sub-spot
```

This is a major-version change. Consumers must update both their imports
and their data-loading code. See "Migration guide" below.

#### New required fields per variant

- **`base`** (was the implicit default in v1): no change to existing
  contents; the field `spot_kind: base` is now required at the top of
  every base profile YAML.
- **`region`** (e.g. `kitesurfing-mediterranean`): unchanged contents;
  `spot_kind: region` now required.
- **`cluster`** (renamed from "spot" in v1, e.g. `kitesurfing-spot-tarifa`):
  the v1 spot YAMLs become cluster YAMLs. New required fields:
  - `spot_kind: cluster`
  - `sub_spots: [...]` — must list ≥1 child sub-spot slug
- **`sub-spot`** (NEW, e.g. `kitesurfing-spot-tarifa-balneario`): the
  fine-grained spatial unit that the engine's spatial resolver returns.
  Required fields:
  - `spot_kind: sub-spot`
  - `parent_cluster: <cluster-slug>`
  - `coordinates: { center: { lat, lng }, radius_m }` (4+ decimal precision recommended)
  - `tier: 1 | 2 | 3` (physical-consequence classification)
  - `tier_rationale: { en: "..." }` (≥3 sentences, English mandatory)
  - All scoring fields (`dimensions`, `verdict_buckets`) are now optional
    on sub-spots — they inherit from the parent cluster when absent.

#### New directory layout

```
catalog/<family>/<activity>/
├── index.yaml                      (base, spot_kind: base)
├── regions/<region>.yaml           (region, spot_kind: region)
└── clusters/<name>/                (renamed from spots/)
    ├── index.yaml                  (cluster, spot_kind: cluster)
    └── sub-spots/<sub-name>.yaml   (sub-spot, spot_kind: sub-spot)
```

#### Bundle changes — `dist/catalog.json`

The bundled JSON now exposes two indexes:

```jsonc
{
  "schemaVersion": "2.0.0",
  "version": "2.0.0",
  "generatedAt": "...",
  "profilesByPath": {
    "water/kitesurfing/index": { ... },
    "water/kitesurfing/clusters/tarifa/index": { ... },
    "water/kitesurfing/clusters/tarifa/sub-spots/balneario": { ... }
  },
  "profilesBySlug": {
    "kitesurfing": { ... },
    "kitesurfing-spot-tarifa": { ... },
    "kitesurfing-spot-tarifa-balneario": { ... }
  }
}
```

**The v1 single-index format `{ "water/kitesurfing/spots/tarifa": ... }`
is gone.** Consumers should migrate to `profilesBySlug` (stable
identifiers) for forward-compat against future re-structures.

### Migration guide for downstream consumers

1. **TypeScript / Zod consumers**: bump dependency to `^2.0.0`. The
   `Profile` type is now a discriminated union — branch on
   `spot_kind` before accessing variant-specific fields (`coordinates`,
   `tier`, `sub_spots`, etc.).

2. **JSON consumers** reading `dist/catalog.json` directly: replace
   indexing by path with indexing by slug. Old key
   `"water/kitesurfing/spots/tarifa"` is now
   `"water/kitesurfing/clusters/tarifa/index"` in `profilesByPath`,
   and the same content is available under `"kitesurfing-spot-tarifa"`
   in the new `profilesBySlug` index (preferred for stability).

3. **Engine consumers** using the inheritance chain: a sub-spot now
   inherits from its cluster (which inherits from region → base). When
   resolving scoring data for a sub-spot, walk `parent_cluster` first,
   then `extends` upward. Sub-spot YAMLs may omit `dimensions` and
   `verdict_buckets`; the resolver must fill these from the cluster.

### Added — initial sub-spot bootstrap (26 sub-spots across 8 clusters)

The 8 existing v1 spot profiles have been promoted to clusters, each
with initial sub-spots:

| Cluster | Sub-spots | Tiers |
|---|---|---|
| `kitesurfing-spot-tarifa` | balneario, los-lances-nord, valdevaqueros, punta-paloma, bolonia | 2, 1, 2, 3, 2 |
| `windsurfing-spot-tarifa` | balneario, los-lances-nord, valdevaqueros, punta-paloma, bolonia | 2, 1, 2, 3, 2 |
| `surfing-spot-nazare` | praia-do-norte-xl, praia-do-norte, praia-da-vila | 3, 3, 2 |
| `scuba-spot-red-sea` | ras-mohammed, thistlegorm, brothers | 2, 2, 3 |
| `freeride-spot-chamonix` | vallee-blanche, grands-montets, aiguille-du-midi | 2, 3, 3 |
| `paragliding-spot-oludeniz` | babadag-1700, babadag-1900 | 2, 3 |
| `trekking-spot-dolomites-tre-cime` | classic-loop, via-ferrata-innerkofler | 1, 2 |
| `climbing-spot-el-chorro` | makinodromo, frontales, poema-de-roca | 2, 2, 2 |

All sub-spots are `maturity: provisional`. Coordinates from public sources
(Wikipedia, OpenStreetMap, federation documentation). Tier classifications
reflect objective physical features (bottom type, rescue presence, wind
exposure, glaciation, etc.) and are flagged for domain-expert review.

### Added — schema exports

New named exports for typed consumption per variant:

```ts
import {
  ProfileSchema,
  BaseProfileSchema,
  RegionProfileSchema,
  ClusterProfileSchema,
  SubSpotProfileSchema,
  CoordinatesSchema,
  TierSchema,
  SpotKindEnum,
  type BaseProfile,
  type RegionProfile,
  type ClusterProfile,
  type SubSpotProfile,
  type Coordinates,
  type Tier,
  type SpotKind,
} from "@goable-io/profiles-catalog"
```

### Added — integrity test suite (9 new tests)

- `cluster.sub_spots[]` references must resolve to existing sub-spot slugs
- `sub-spot.parent_cluster` must match an existing cluster slug
- Sub-spot must be listed in its parent cluster's `sub_spots[]` (bidirectional consistency)
- `tier_rationale.en` ≥3 sentences
- Coordinates within approximate bbox of declared region
- `radius_m` in (0, 5000]
- Sub-spot slug starts with `parent_cluster + "-"`

### Future bootstrap targets

This release covers the 8 existing clusters with their initial sub-spots
(26 total). Future PRs will bootstrap new clusters (Ho'okipa, Yosemite,
Kalymnos, Fontainebleau, etc.) and additional sub-spots for the existing
clusters, targeting 250-500 sub-spot YAMLs across 150-200 unique physical
locations × 2-3 activities per location. See `CONTRIBUTING.md` for the
sub-spot authoring conventions.

## [1.0.2] — 2026-05-22

### Fixed
- Release workflow now derives the next version from `npm view <pkg> version`
  instead of bumping the repository's `package.json`. The previous design
  was vulnerable to a race where a release's commit-back to `main` could
  be skipped (branch protection, concurrent merges, conflicts), causing
  the next merge to attempt republishing an already-published version.
  Symptom we hit: PR #2 (the 17 new profiles) merged before the bump from
  PR #1 had landed on main, and the workflow tried to publish `1.0.1`
  again — npm rejected with 403. With this change there is no commit-back
  to main; only a tag is pushed.

### Added — 17 new profiles (33 → 50)

These profiles were merged in PR #2 but never reached npm because the
release workflow failed before publish (see Fixed above). They ship in
1.0.2.

**10 new base profiles:**
- Land (5): `trail-running`, `mountain-biking`, `road-cycling`, `bouldering`, `canyoning`
- Snow (2): `alpine-skiing` (resort), `snowboarding` (resort)
- Water (2): `bodyboarding`, `open-water-swimming`
- Air (1): `hot-air-ballooning`

**4 new regional variants** (extend existing base profiles):
- `snow/freeride/regions/alpine`
- `air/hang-gliding/regions/alpine`
- `water/scuba/regions/mediterranean`
- `land/climbing/regions/alpine`

**3 new spot profiles:**
- `water/windsurfing/spots/tarifa` (Strait of Gibraltar, bidirectional Levante/Poniente)
- `land/climbing/spots/el-chorro` (Andalusian limestone, year-round)
- `water/scuba/spots/red-sea` (warm-water tier-1, region: indian)

All new profiles are `maturity: provisional` with 2-4 citations each. Catalog now covers
50 profiles across all four activity families. Tests updated to assert ≥50 profiles.

## [1.0.1] — Previous unreleased entries

### Added
- Public TypeScript library entry: `import { ProfileSchema, MetricEnum, type Profile } from "@goable-io/profiles-catalog"`
- JSON Schema (Draft 2020-12) emitted to `dist/profile.schema.json` for non-TS consumers
- Package `exports` map covering `.`, `./schema`, `./catalog.json`, `./profile.schema.json`
- `pnpm build` (tsc → `dist/schema/`), `pnpm list-profiles`, `pnpm test`
- Vitest test suite (18 tests): catalog validation, schema invariants, bundle determinism
- `SECURITY.md`, `CHANGELOG.md`
- GitHub issue templates: bug report, new activity proposal, curve change proposal
- npm provenance (`publishConfig.provenance: true`) + `id-token: write` in release workflow
- JSON Schema included as a GitHub Release asset alongside `catalog.json`

### Changed
- `zod` moved from `devDependencies` to `dependencies` (required at runtime by consumers of `ProfileSchema`)
- `pnpm-workspace.yaml`: replaced placeholder `esbuild: set this to true or false` with `esbuild: true`
- CI: `pnpm/action-setup@v4` bumped from `version: 9` to `version: 11` to match `packageManager` field
- Release workflow now runs `typecheck`, `test`, and `build` before publish

### Fixed
- `pnpm install --frozen-lockfile` failed because of invalid YAML in `pnpm-workspace.yaml`
- `catalog/README.md` referenced the old `review_status` field name (renamed to `maturity` in ff4b912) and the monorepo path `packages/profiles/src/schema.ts`

## [1.0.0] — 2026-05-22

### Added
- Initial catalog: 33 profiles across water (12 base + variants), snow (2), air (2), land (2)
- Zod schema in `schema/profile.schema.ts` with maturity gate (`calibrated` requires `meta.calibration`)
- `pnpm validate`, `pnpm bundle` (emits `dist/catalog.json`)
- PR validation + auto-release workflows
- CC BY 4.0 license, `CITATION.cff`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `GOVERNANCE.md`, `MAINTAINERS.md`
