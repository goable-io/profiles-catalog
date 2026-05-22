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

Two consumption paths ship in the same package:

- **YAML directory** at `node_modules/@goable-io/profiles-catalog/catalog/` —
  original files for tools that walk a directory tree.
- **Pre-bundled JSON** at `node_modules/@goable-io/profiles-catalog/dist/catalog.json` —
  single file, all profiles parsed and merged. Faster startup.

## Usage

See `schema/profile.schema.ts` for the canonical structure of a profile, and
`catalog/<family>/<activity>/index.yaml` for examples.

```ts
import catalog from "@goable-io/profiles-catalog/dist/catalog.json"
console.log(Object.keys(catalog.profiles))
// → ["kitesurfing", "surfing", "ski-touring", ...]
```

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
