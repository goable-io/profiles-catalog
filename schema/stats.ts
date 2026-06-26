// Live coverage statistics for the catalog.
//
// Stats are computed at bundle time by scripts/compute-stats.ts and shipped
// as dist/catalog-stats.json. This module is the package's runtime
// accessor — consumers read precomputed counts, no YAML parsing on the
// consumer side.
//
// Subpath: import { getCatalogStats } from "@goable-io/profiles-catalog/stats"

import { readFileSync } from "node:fs"
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

// Locate the JSON relative to this compiled module. After `tsc -p tsconfig.build.json`
// this file ends up at dist/schema/stats.js, so the JSON is one directory up.
const __dirname = dirname(fileURLToPath(import.meta.url))
const statsPath = join(__dirname, "..", "catalog-stats.json")
const stats = JSON.parse(readFileSync(statsPath, "utf8")) as CatalogStats

export function getCatalogStats(): CatalogStats {
  return stats
}

export function getActivityCoverage(slug: string): ActivityCoverage | null {
  return stats.byActivity.find((a) => a.slug === slug) ?? null
}
