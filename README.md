# Goable Outdoor Activity Profiles Catalog

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![npm](https://img.shields.io/npm/v/@goable-io/profiles-catalog.svg)](https://www.npmjs.com/package/@goable-io/profiles-catalog)

Open catalog of **outdoor activity profiles** — the data layer that defines
how real-time weather inputs combine into a 0-100 suitability score for each
activity. Covers four families: **water** (kitesurf, surf, windsurf, sailing,
diving…), **snow** (ski-touring, freeride, snowboard, cross-country…),
**air** (paragliding, hang-gliding), and **land outdoor** (trekking, climbing,
trail-running).

This catalog is the **public data half** of the [Goable](https://goable.io)
engine. The scoring engine itself is proprietary; the activity definitions —
which weather metrics matter, what curves describe "good vs. bad" conditions
for each sport, citations and review status for every parameter — are open
data under **CC BY 4.0**.

## Why this exists

- **Transparency for partners.** Booking platforms, insurance pilots, and
  tourism boards can audit the exact wind curve scoring their activity.
- **Community contribution.** A windsurf school in Salinas, a paragliding
  club in Annecy, a sailing instructor in Sète — each can submit a regional
  variant for their spot via PR.
- **Citable research artifact.** Each profile lists sources. The catalog
  ships with `CITATION.cff` for academic citation.

## Installation

```sh
npm install @goable-io/profiles-catalog
```

Four consumption paths ship in the same package:

- **YAML directory** at `node_modules/@goable-io/profiles-catalog/catalog/` —
  original files for tools that walk a directory tree.
- **Pre-bundled JSON** at `@goable-io/profiles-catalog/catalog.json` —
  all profiles indexed by both path and slug. Faster startup.
- **Zod schema + TypeScript types** from the package root — for runtime
  validation of custom profiles or strong typing in TS projects.
- **JSON Schema** (Draft 2020-12) at
  `@goable-io/profiles-catalog/profile.schema.json` — for non-TS
  consumers (Python `jsonschema`, Go `gojsonschema`, ajv, etc.). Also
  attached to every GitHub Release.

## Schema (v2)

Profiles are organised in a 4-level hierarchy via the `spot_kind`
discriminator:

| `spot_kind` | Example slug | Required v2 fields |
|---|---|---|
| `base` | `kitesurfing` | (none beyond v1) |
| `region` | `kitesurfing-atlantic` | `extends`, `region` |
| `cluster` | `kitesurfing-spot-tarifa` | `extends`, `sub_spots[]` |
| `sub-spot` | `kitesurfing-spot-tarifa-balneario` | `extends`, `parent_cluster`, `coordinates`, `tier`, `tier_rationale.en` |

Sub-spots inherit `dimensions`, `verdict_buckets`, and other scoring
fields from their parent cluster when not overridden. The engine's
spatial resolver returns the nearest sub-spot within `radius_m` of
incoming request coordinates.

## Usage

### Read the pre-bundled catalog (v2 dual-index)

```ts
import catalog from "@goable-io/profiles-catalog/catalog.json" with { type: "json" }

// By slug (recommended — stable across restructures)
const tarifaBalneario = catalog.profilesBySlug["kitesurfing-spot-tarifa-balneario"]

// By filesystem path (mirrors the catalog/ directory layout)
const tarifaCluster = catalog.profilesByPath["water/kitesurfing/clusters/tarifa/index"]
```

### Validate a custom profile against the schema

```ts
import { ProfileSchema, type Profile } from "@goable-io/profiles-catalog"

const myProfile: Profile = ProfileSchema.parse(yourYaml)

// Discriminated union — branch on spot_kind for variant-specific fields
if (myProfile.spot_kind === "sub-spot") {
  console.log(myProfile.coordinates.center, myProfile.tier)
}
```

### Use the JSON Schema from any language

```py
import json, jsonschema, yaml
schema = json.load(open("node_modules/@goable-io/profiles-catalog/dist/profile.schema.json"))
profile = yaml.safe_load(open("my-profile.yaml"))
jsonschema.validate(profile, schema)
```

See `schema/profile.schema.ts` for the canonical Zod definition and
`catalog/<family>/<activity>/index.yaml` for examples.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs welcome — first review SLA: 1 week.

To propose a new activity, a regional variant, or a curve change:

```sh
git clone https://github.com/goable-io/profiles-catalog
cd profiles-catalog
pnpm install
# Add or edit YAMLs under catalog/
pnpm validate   # must pass before opening a PR
```

## Citation

If you use this catalog in research, please cite using the metadata in
[`CITATION.cff`](./CITATION.cff). A Zenodo DOI will be minted when v1.0.0
ships.

## License

Catalog data (everything under `catalog/`, `schema/`, `scripts/`) is licensed
under [CC BY 4.0](./LICENSE). Attribution required; commercial use permitted.

The Goable scoring engine (a separate proprietary repository) consumes this
catalog as an npm dependency. The license boundary is intentional: open data,
proprietary engine.
