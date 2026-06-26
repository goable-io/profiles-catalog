// Live coverage statistics for the catalog.
//
// Stats are computed at bundle time by scripts/compute-stats.ts and shipped
// as dist/catalog-stats.json. This module is the package's runtime
// accessor — consumers read precomputed counts, no YAML parsing on the
// consumer side.
//
// Subpath: import { getCatalogStats } from "@goable-io/profiles-catalog/stats"

import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

export interface CatalogStats {
  computedAt: string                      // ISO timestamp when the bundle was computed
  catalogVersion: string                  // mirrors package.json version
  totals: {
    activities: number                    // distinct base profile slugs
    subSpots: number
    clusters: number
    regions: number                       // count of region YAML files
    countries: number                     // distinct ISO 3166-1 alpha-2 codes
  }
  byActivity: ActivityCoverage[]          // one entry per base profile, sorted by subSpotCount DESC
}

export interface ActivityCoverage {
  slug: string                            // e.g. "kitesurfing"
  family: string                          // "water" | "snow" | "air" | "land" | "commercial"
  displayName: string                     // from the base profile's display_name.en
  subSpotCount: number
  clusterCount: number
  countryCount: number
  countries: string[]                     // ISO codes sorted alphabetically
  clusters: ClusterCoverage[]             // sorted by subSpotCount DESC, then slug ASC
  status: "seeded" | "partial" | "empty"  // empty=0, partial=1-9, seeded=10+
  lastUpdatedAt: string | null            // newest commit touching the activity dir (ISO), null if git unavailable
}

export interface ClusterCoverage {
  slug: string
  displayName: string
  countryCode: string                     // ISO 3166-1 alpha-2
  subSpotCount: number
}

// Lazy-load the stats JSON. Doing the read at module top-level would race
// with test fixtures that regenerate dist/ in beforeAll — and would prevent
// consumers from importing the type definitions without dist/ on disk.
//
// We check two candidate paths so the module works in both contexts:
//   - As published / compiled: this file is at dist/schema/stats.js, so
//     dist/catalog-stats.json is at "../catalog-stats.json".
//   - When running the source via tsx (tests, scripts): this file is at
//     schema/stats.ts, so dist/catalog-stats.json is at "../dist/catalog-stats.json".
const __dirname = dirname(fileURLToPath(import.meta.url))
const candidatePaths = [
  join(__dirname, "..", "catalog-stats.json"),
  join(__dirname, "..", "dist", "catalog-stats.json"),
]

let cached: CatalogStats | null = null

const loadStats = (): CatalogStats => {
  if (cached) return cached
  const statsPath = candidatePaths.find((p) => existsSync(p))
  if (!statsPath) {
    throw new Error(
      `[@goable-io/profiles-catalog/stats] catalog-stats.json not found. ` +
        `Looked in: ${candidatePaths.join(", ")}. ` +
        `Run \`pnpm bundle\` to generate it.`,
    )
  }
  cached = JSON.parse(readFileSync(statsPath, "utf8")) as CatalogStats
  return cached
}

export function getCatalogStats(): CatalogStats {
  return loadStats()
}

export function getActivityCoverage(slug: string): ActivityCoverage | null {
  return loadStats().byActivity.find((a) => a.slug === slug) ?? null
}
