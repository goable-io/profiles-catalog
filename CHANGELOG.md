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

## [Unreleased] — lands as 2.3.2

### Added — ski-touring sub-spots bootstrap (7 clusters, 26 sub-spots)

PR3 of the 5-PR bootstrap roadmap. Brings ski-touring from 0
sub-spots to **26 sub-spots across 7 clusters worldwide**. Activity
status flips `empty → seeded`.

**7 new clusters** (region tag in parentheses):

| Cluster | Country | Sub-spots × tiers | Region |
|---|---|---|---|
| `ski-touring-spot-verbier` | CH | mont-fort(T3), tortin(T2), mont-gele(T3), bec-des-rosses(T3) | alpine |
| `ski-touring-spot-zermatt` | CH | theodul-glacier(T3), stockhorn(T3), schwarzsee(T2), klein-matterhorn(T3) | alpine |
| `ski-touring-spot-engadin` | CH | corvatsch(T3), diavolezza(T3), piz-lagalb(T2) | alpine |
| `ski-touring-spot-dolomites-sella` | IT | sella-ronda(T1), marmolada-north(T3), lagazuoi(T2), tofane(T3) | alpine |
| `ski-touring-spot-lyngen` | NO | ullstinden(T2), stortinden(T3), lakselvtinden(T2), tafeltinden(T3) | arctic |
| `ski-touring-spot-tromso` | NO | tromsdalstind(T2), kvaloya-stortinden(T2), senja-sukkertoppen(T3) | arctic |
| `ski-touring-spot-hakuba` | JP | tsugaike(T3), cortina(T3), happo-one(T3), norikura(T2) | sea-of-japan |

= 7 new clusters + 26 new sub-spots. 3 new countries (CH, NO, JP) —
Switzerland is new to the catalog despite the previously-shipped
freeride Chamonix being French; this PR is the first Swiss-soil
content.

### Added — 2 ski-touring region variants

- **`ski-touring-arctic`**: high-latitude touring (Lyngen, Tromsø,
  Lofoten, Iceland). Polar-twilight sun-weight 0.25, -32°C frostbite
  gate, references Norwegian Snøskredvarsel + Sápmi reindeer-husbandry
  seasonal-zone coordination.
- **`ski-touring-sea-of-japan`**: lake-effect snow regime (Hakuba,
  Niseko, Myoko, Nozawa Onsen). Precip-peak shifted to 0.5 mm/h,
  15 mm/h dump gate, references Hakuba Avalanche Network + Japan
  Avalanche Network bulletins.

### Stats impact (live via `getCatalogStats()`)

- Total sub-spots: 91 → 117 (+26)
- Total clusters: 32 → 39 (+7)
- Total countries: 15 → 18 (+CH, +NO, +JP)
- Total regions: 17 → 19 (+ski-touring-arctic, +ski-touring-sea-of-japan)
- Ski-touring status: empty → seeded (26 sub-spots, 4 countries)

### Versioning
- package.json 2.3.1 → 2.3.2 (data-only patch; schema unchanged).
- dist/catalog.json schemaVersion stays at 2.3.0.

## [2.3.1] — published 2026-06-26

### Added — surfing sub-spots bootstrap (12 clusters, 33 sub-spots)

Catalog grows from 3 surfing sub-spots (Nazaré only) to **36 sub-spots
across 13 clusters worldwide**, in commercially priority order
matching PR roadmap step 2.

**12 new clusters** (region tag in parentheses):

| Cluster | Country | Sub-spots × tiers | Region |
|---|---|---|---|
| `surfing-spot-ericeira` | PT | coxos(T3), ribeira-dilhas(T2), pedra-branca(T3) | atlantic |
| `surfing-spot-peniche` | PT | supertubos(T3), praia-do-norte(T2) | atlantic |
| `surfing-spot-mundaka` | ES | left(T3), bakio(T2) | bay-of-biscay |
| `surfing-spot-hossegor` | FR | la-graviere(T3), la-nord(T2), la-sud(T2) | bay-of-biscay |
| `surfing-spot-taghazout` | MA | anchor-point(T2), killers(T3), hash-point(T2) | atlantic |
| `surfing-spot-imsouane` | MA | the-bay(T1), cathedral(T2) | atlantic |
| `surfing-spot-bali` | ID | uluwatu(T3), padang-padang(T3), canggu(T2) | indian |
| `surfing-spot-gold-coast` | AU | snapper-rocks(T2), kirra(T2), burleigh-heads(T2) | pacific |
| `surfing-spot-bells-victoria` | AU | bells-beach(T3), winkipop(T3) | pacific |
| `surfing-spot-oahu-north-shore` | US | pipeline(T3), sunset(T3), waimea(T3), off-the-wall(T3) | pacific |
| `surfing-spot-trestles` | US | lower-trestles(T2), upper-trestles(T2), cottons(T2) | pacific |
| `surfing-spot-norcal` | US | mavericks(T3), steamer-lane(T3), pleasure-point(T2) | pacific |

= 12 new clusters + 33 new sub-spots. 11 distinct countries added/
reinforced; 3 new to the surfing dataset (ID, AU, US).

### Added — `surfing-pacific` + `surfing-indian` region variants

Two new region YAMLs to host the Pacific (Hawaii / Australia /
California) and Indian Ocean (Bali) clusters with consistent
base → region → cluster → sub-spot inheritance. Curves tuned for
basin-specific norms (Pacific 2.0m sweet spot + 10m gate; Indian
1.2m sweet spot + 7m reef gate + warmer water curve).

### Stats impact (live via `getCatalogStats()`)

- Total sub-spots: 58 → 91 (+33)
- Total clusters: 20 → 32 (+12)
- Total countries: 13 → 15 (+AU, +ID)
- Surfing activity status: empty → seeded (36 sub-spots, 9 countries:
  PT, ES, FR, MA, ID, AU, US, ...)

### Versioning
- package.json 2.3.0 → 2.3.1 (data-only patch, schema unchanged).
- `dist/catalog.json` schemaVersion stays at 2.3.0 — no schema fields
  added or modified.

## [2.3.0] — published 2026-06-26

### Added — live coverage stats via `/stats` subpath export

Consumers (the goable.io landing being the first) need to show LIVE
coverage numbers — sub-spots per activity, countries covered, status
per activity — without hardcoding stats that go stale. This release
adds a `./stats` subpath export with pre-computed counts read from an
embedded JSON file. Build-time computation, runtime access, zero
YAML parsing on the consumer side.

```ts
import { getCatalogStats, getActivityCoverage } from "@goable-io/profiles-catalog/stats"

const { totals, byActivity } = getCatalogStats()
// { activities: 28, subSpots: 58, clusters: 20, regions: 15, countries: 13 }

const kite = getActivityCoverage("kitesurfing")
// { slug: "kitesurfing", subSpotCount: 37, status: "seeded", countries: [...] }
```

Status thresholds:
- `empty`: 0 sub-spots
- `partial`: 1–9 sub-spots
- `seeded`: 10+ sub-spots

Per-activity `lastUpdatedAt` reads `git log -1 --format=%cI` on the
activity dir, with a `null` fallback if git is unavailable.

### Added — `country_code` field (additive, optional in schema, required at bundle-time for sub-spots)

ISO 3166-1 alpha-2 country code on `cluster` and `sub-spot` variants.
Schema makes it `.optional()` for v2.x backwards compatibility, but
`scripts/compute-stats.ts` fails loudly if any sub-spot is missing it
— our own catalog enforces full coverage.

Backfilled in this PR across all 58 sub-spots + 20 clusters (78 YAML
files). 13 distinct countries: BR, DO, EG, ES, FR, GR, IT, MA, PT,
TR, US, VN, ZA.

### Added

- `scripts/compute-stats.ts`: walks catalog YAMLs, validates with Zod,
  emits `dist/catalog-stats.json`. Wired into `pnpm bundle`.
- `schema/stats.ts`: runtime accessor reading the JSON via
  `fs.readFileSync` at module load. Exports `CatalogStats`,
  `ActivityCoverage`, `ClusterCoverage` interfaces +
  `getCatalogStats()` + `getActivityCoverage(slug)`.
- `tests/stats.test.ts`: 10 cases (shape validation, sort order,
  threshold check, totals integrity, ISO format).
- `dist/catalog-stats.json` shipped alongside `catalog.json` (added
  to `package.exports` under `./catalog-stats.json` for JSON consumers).
- README section showing the new subpath.

### Changed

- `package.json` exports adds `./stats` and `./catalog-stats.json`.
- `package.json` version bumped 2.2.0 → 2.3.0 (additive — schema is
  backwards-compatible).
- `dist/catalog.json` `schemaVersion` bumped 2.2.0 → 2.3.0.

## [2.2.0] — published 2026-06-26

### Added — 14 new RegionEnum values (additive)

`RegionEnum` was undersized at 6 values for v1 and v2; this release adds
14 finer-grained sub-basin tags so clusters can declare a region that
matches their actual climatology + forecast pool. Existing 6 values
unchanged. Total enum goes from 6 → 20.

**Migrated catalog entries (4 regions, 14 YAML files)**

| Value | Migrated clusters | Reason |
|---|---|---|
| `caribbean` | `kitesurfing-spot-cabarete` (cluster + 3 sub-spots) | Trade-wind tropical, distinct from northern-Atlantic synoptic regime. |
| `red-sea` | `scuba-spot-red-sea` (cluster + 3 sub-spots) | Distinct hydrography from the Indian Ocean basin; warmer mean SST + reef ecosystem. |
| `aegean` | `kitesurfing-spot-naxos` (cluster + 2 sub-spots) | Meltemi summer regime is climatologically distinct from the broader Mediterranean. |
| `south-china-sea` | `kitesurfing-spot-mui-ne` (cluster + 2 sub-spots) | NE monsoon delivery (Nov–Apr) is climatologically distinct from the broader Pacific. |

**Added pre-emptively for forthcoming bootstrap PRs (10 regions, no current catalog entries)**

| Value | Will host | Reason |
|---|---|---|
| `north-sea` | NL/DE/DK kite + windsurf | Northern Atlantic synoptic regime with cold-water + tidal-range characteristics. |
| `baltic` | Sweden/Estonia/Polish-coast kite + sailing | Semi-enclosed cold-water sea with distinct ice-season dynamics. |
| `bay-of-biscay` | Hossegor / Mundaka surf (PR2) | Atlantic coast with W-Europe groundswell + summer thermal. |
| `gulf-of-mexico` | South Padre TX, FL panhandle | Tropical-but-not-Caribbean Gulf with own seasonal pattern. |
| `adriatic` | Italian NE coast, Croatia kite + windsurf | Bora regime is climatologically distinct from the broader Mediterranean. |
| `arctic` | Lofoten, Lyngen, Tromsø, Iceland (PR3 ski-touring) | High-latitude polar-influenced climatology. |
| `sea-of-japan` | Niseko, Hakuba (PR4 freeride) | Lake-effect snowfall regime is the *reason* Japanese west-coast snow exists. |
| `rockies` | Whistler, Revelstoke, Jackson Hole (PR4 freeride) | North American continental mountain range. |
| `andes` | Iquique, Roldanillo paragliding (PR5), Patagonia ski | South American continental mountain range. |
| `himalayas` | Bir-Billing paragliding (PR5), Annapurna trek | Asian mountain range with monsoon-influenced climate. |

**Not added in this PR** (defer to when catalog coverage requires them):
`black-sea`, `andaman-sea`, `persian-gulf`, `gulf-of-california`,
`caspian`, `pyrenees`, `atlas`, `southern-alps`, `tasman`, `celtic-sea`,
`caucasus`, `carpathians`. Adding values is additive and non-breaking,
so future PRs can extend at low cost.

### Changed
- `dist/catalog.json` `schemaVersion` bumped 2.1.0 → 2.2.0 (additive
  schema change). Downstream consumers reading `schemaVersion` can
  branch their parser version against this string.
- `tests/integrity.test.ts` region bbox table extended with the 4 new
  regions. Approximate tolerances per usual.

### Cleaned up
- `cabarete/index.yaml`, `mui-ne/index.yaml`, `scuba/clusters/red-sea/index.yaml`:
  the placeholder notes explaining "tagged as X until the schema adds Y"
  have been replaced with positive statements about the actual v2.2 tag.

### Compatibility

This is **additive** — every previously-valid profile still validates
unchanged. Downstream `RegionEnum` consumers that exhaustively
pattern-match on the 6 v1 values (e.g. with a `default: never` arm)
will get a TypeScript exhaustiveness error and must add cases for the
4 new values. The byte-hash schema-sync test in the consumer monorepo
will fail with an expected mismatch.

## [2.1.1] — published 2026-06-26

### Added — kitesurfing sub-spots bootstrap (12 clusters, 32 sub-spots)

### Added — kitesurfing sub-spots bootstrap (12 clusters, 32 sub-spots)

The /recommend-spot endpoint was failing in production because most
regions had 0-3 sub-spots in radius. This release pushes kitesurfing
coverage from 5 sub-spots (Tarifa only) to **37 sub-spots across 13
clusters** by adding 12 new clusters and 32 new sub-spots in commercially
priority order.

**12 new clusters** (region tagged in parentheses):

| Cluster | Sub-spots × tiers | Region |
|---|---|---|
| kitesurfing-spot-sardinia | punta-trettu(1), porto-pollo(2), sa-mola(3), chia(2) | mediterranean |
| kitesurfing-spot-sicily | lo-stagnone(1), san-vito-lo-capo(2) | mediterranean |
| kitesurfing-spot-naxos | mikri-vigla(2), plaka(2) | mediterranean |
| kitesurfing-spot-fuerteventura | sotavento(2), flag-beach(2), el-cotillo(3) | atlantic |
| kitesurfing-spot-dakhla | lagoon(1), speed-spot(2), foum-labouir(3) | atlantic |
| kitesurfing-spot-essaouira | bay(2), sidi-kaouki(2), moulay(3) | atlantic |
| kitesurfing-spot-cape-town | bloubergstrand(2), sunset-beach(2), langebaan(1) | atlantic |
| kitesurfing-spot-cabarete | kite-beach(2), la-boca(2), encuentro(3) | atlantic ⚠ |
| kitesurfing-spot-maui | kanaha(2), kite-beach-kihei(2), hookipa(3) | pacific |
| kitesurfing-spot-cumbuco | beach(2), cauipe-lagoon(1) | atlantic |
| kitesurfing-spot-jericoacoara | main(2), prea(2) | atlantic |
| kitesurfing-spot-mui-ne | main-beach(2), malibu(2) | pacific ⚠ |

⚠ marks clusters where the region tag is a least-bad fit pending the
v2.2 region-enum expansion (Cabarete is Caribbean, Mui Ne is South
China Sea — both broader Atlantic/Pacific by current enum).

All new sub-spots are `maturity: provisional`, 2-4 citations each,
coordinates verified against published kite-school sites and federation
documentation (limited cross-source verification under current
WebFetch sandbox; `meta.notes` flags where coordinates need
domain-expert verification before production routing).

### Added — `kitesurfing-pacific` region variant

`catalog/water/kitesurfing/regions/pacific.yaml`. Required to host the
Maui and Mui Ne clusters with a consistent base → region → cluster
inheritance chain (mirroring the existing atlantic + mediterranean
pattern). Curves favour NE-trade direction preference, warmer water
sweet spot (25°C), tighter gust threshold (1.30 vs Atlantic 1.35).

### Fixed — placeholder reviewer in `kitesurfing/index.yaml`

The v1 seed listed `reviewed_by: ["Marco Rossi (kite instructor, IKO L3,
12 years experience, Sardinia)"]` on the kitesurfing base profile.
No actual Marco Rossi authored a review. Set to `[]` — no profile in
the catalog currently claims a `reviewed_by` entry, restoring honesty
to the maturity gate.

### Fixed — integrity test region bbox coverage

`tests/integrity.test.ts` region bounding-boxes were too narrow:
- `atlantic` lngMax raised 5 → 25 to cover Cape Town / South African
  Atlantic coast.
- `pacific` now supports antimeridian wraparound (lngMin > lngMax
  signals "lng >= lngMin OR lng <= lngMax"), so Hawaii (-156°E) and
  Mui Ne (108°E) both validate. Added `lngInBbox` helper.

## [2.1.0] — published 2026-06-24

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
