import { describe, expect, it, beforeAll } from "vitest"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { z } from "zod"

const exec = promisify(execFile)

// Import from source so that `pnpm typecheck` works even before
// `pnpm build` has produced dist/. The source-side schema/stats.ts has a
// robust path-resolution that finds dist/catalog-stats.json from either
// source or dist context. The bundle script in beforeAll guarantees the
// JSON exists by the time tests execute.
import {
  getCatalogStats,
  getActivityCoverage,
} from "../schema/stats.js"

const ClusterCoverageSchema = z.object({
  slug: z.string().min(1),
  displayName: z.string().min(1),
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  subSpotCount: z.number().int().min(0),
})

const ActivityCoverageSchema = z.object({
  slug: z.string().min(1),
  family: z.enum(["water", "snow", "air", "land", "commercial"]),
  displayName: z.string().min(1),
  subSpotCount: z.number().int().min(0),
  clusterCount: z.number().int().min(0),
  countryCount: z.number().int().min(0),
  countries: z.array(z.string().regex(/^[A-Z]{2}$/)),
  clusters: z.array(ClusterCoverageSchema),
  status: z.enum(["seeded", "partial", "empty"]),
  lastUpdatedAt: z.string().nullable(),
})

const CatalogStatsSchema = z.object({
  computedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T/),
  catalogVersion: z.string().min(1),
  totals: z.object({
    activities: z.number().int().min(0),
    subSpots: z.number().int().min(0),
    clusters: z.number().int().min(0),
    regions: z.number().int().min(0),
    countries: z.number().int().min(0),
  }),
  byActivity: z.array(ActivityCoverageSchema),
})

describe("catalog stats (v2.3.0 /stats subpath)", () => {
  beforeAll(async () => {
    // Ensure dist is freshly built so stats.js + catalog-stats.json exist
    await exec("pnpm", ["bundle"])
    await exec("pnpm", ["build"])
  }, 60_000)

  it("getCatalogStats() returns a valid CatalogStats", () => {
    const stats = getCatalogStats()
    expect(() => CatalogStatsSchema.parse(stats)).not.toThrow()
  })

  it("byActivity is sorted DESC by subSpotCount, then ASC by slug", () => {
    const stats = getCatalogStats()
    for (let i = 1; i < stats.byActivity.length; i++) {
      const prev = stats.byActivity[i - 1]!
      const curr = stats.byActivity[i]!
      if (prev.subSpotCount === curr.subSpotCount) {
        expect(prev.slug.localeCompare(curr.slug)).toBeLessThanOrEqual(0)
      } else {
        expect(prev.subSpotCount).toBeGreaterThanOrEqual(curr.subSpotCount)
      }
    }
  })

  it("getActivityCoverage('kitesurfing') returns the kite entry", () => {
    const kite = getActivityCoverage("kitesurfing")
    expect(kite).not.toBeNull()
    expect(kite!.slug).toBe("kitesurfing")
    expect(kite!.family).toBe("water")
    expect(kite!.subSpotCount).toBeGreaterThanOrEqual(37)
  })

  it("getActivityCoverage('not-a-real-slug') returns null", () => {
    expect(getActivityCoverage("not-a-real-slug")).toBeNull()
  })

  it("country codes are 2-letter uppercase ISO 3166-1 alpha-2", () => {
    const stats = getCatalogStats()
    for (const activity of stats.byActivity) {
      for (const code of activity.countries) {
        expect(code).toMatch(/^[A-Z]{2}$/)
      }
      for (const cluster of activity.clusters) {
        expect(cluster.countryCode).toMatch(/^[A-Z]{2}$/)
      }
    }
  })

  it("status thresholds: empty=0, partial=1-9, seeded=10+", () => {
    const stats = getCatalogStats()
    for (const a of stats.byActivity) {
      if (a.subSpotCount === 0) expect(a.status).toBe("empty")
      else if (a.subSpotCount < 10) expect(a.status).toBe("partial")
      else expect(a.status).toBe("seeded")
    }
  })

  it("totals.subSpots equals the sum of byActivity[].subSpotCount", () => {
    const stats = getCatalogStats()
    const sum = stats.byActivity.reduce((s, a) => s + a.subSpotCount, 0)
    expect(sum).toBe(stats.totals.subSpots)
  })

  it("totals.clusters equals the sum of byActivity[].clusterCount", () => {
    const stats = getCatalogStats()
    const sum = stats.byActivity.reduce((s, a) => s + a.clusterCount, 0)
    expect(sum).toBe(stats.totals.clusters)
  })

  it("totals.countries equals the size of the union of byActivity[].countries", () => {
    const stats = getCatalogStats()
    const union = new Set<string>()
    for (const a of stats.byActivity) for (const c of a.countries) union.add(c)
    expect(union.size).toBe(stats.totals.countries)
  })

  it("catalogVersion matches package.json", async () => {
    const { stdout } = await exec("node", ["-p", "require('./package.json').version"])
    const stats = getCatalogStats()
    expect(stats.catalogVersion).toBe(stdout.trim())
  })
})
