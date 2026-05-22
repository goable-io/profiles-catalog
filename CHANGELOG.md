# Changelog

All notable changes to `@goable-io/profiles-catalog` are documented here.
Versions follow [Semantic Versioning](https://semver.org/). Each merge to
`main` triggers a patch bump via `.github/workflows/release.yml`; manual
entries below cover schema-level changes (minor / major) and notable
catalog additions.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added — 17 new profiles (33 → 50)

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
