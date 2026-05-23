import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"
import { glob } from "glob"
import { parse as parseYaml } from "yaml"
import { ProfileSchema, type Profile } from "../schema/profile.schema.js"

const collect = async (): Promise<Array<{ file: string; parsed: Profile }>> => {
  const files = await glob("catalog/**/*.yaml")
  return Promise.all(
    files.sort().map(async (file) => {
      const raw = await readFile(file, "utf8")
      const parsed = ProfileSchema.parse(parseYaml(raw))
      return { file, parsed }
    }),
  )
}

// Approximate bounding boxes per region. Used as a sanity check: a sub-spot
// declared in region "alpine" must have coordinates somewhere broadly Alpine,
// not in the Indian Ocean. Loose tolerances on purpose (the resolver doesn't
// rely on these for routing).
const regionBbox: Record<string, { latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
  mediterranean: { latMin: 28, latMax: 48, lngMin: -10, lngMax: 38 },
  // Atlantic includes Iberian + Moroccan coast + the Nazaré canyon area;
  // very loose because Atlantic region spans both hemispheres in our schema.
  atlantic: { latMin: -45, latMax: 70, lngMin: -85, lngMax: 5 },
  pacific: { latMin: -50, latMax: 65, lngMin: 100, lngMax: 180 },
  // Indian Ocean basin including Red Sea (our schema places Red Sea under
  // region: indian as the closest of the six available enum values).
  indian: { latMin: -45, latMax: 32, lngMin: 25, lngMax: 110 },
  alpine: { latMin: 42, latMax: 51, lngMin: 5, lngMax: 18 },
  global: { latMin: -90, latMax: 90, lngMin: -180, lngMax: 180 },
}

describe("v2 hierarchical integrity", () => {
  it("every cluster.sub_spots[] reference resolves to an existing sub-spot slug", async () => {
    const all = await collect()
    const bySlug = new Map(all.map(({ parsed }) => [parsed.slug, parsed]))
    for (const { file, parsed } of all) {
      if (parsed.spot_kind === "cluster") {
        for (const childSlug of parsed.sub_spots) {
          const child = bySlug.get(childSlug)
          expect(child, `${file}: sub_spots references unknown slug "${childSlug}"`).toBeDefined()
          expect(
            child!.spot_kind,
            `${file}: sub_spots["${childSlug}"] is not a sub-spot (spot_kind=${child!.spot_kind})`,
          ).toBe("sub-spot")
        }
      }
    }
  })

  it("every sub-spot.parent_cluster matches an existing cluster slug", async () => {
    const all = await collect()
    const bySlug = new Map(all.map(({ parsed }) => [parsed.slug, parsed]))
    for (const { file, parsed } of all) {
      if (parsed.spot_kind === "sub-spot") {
        const parent = bySlug.get(parsed.parent_cluster)
        expect(
          parent,
          `${file}: parent_cluster "${parsed.parent_cluster}" not found in catalog`,
        ).toBeDefined()
        expect(
          parent!.spot_kind,
          `${file}: parent_cluster "${parsed.parent_cluster}" is not a cluster (spot_kind=${parent!.spot_kind})`,
        ).toBe("cluster")
      }
    }
  })

  it("every sub-spot is listed in its parent cluster's sub_spots[] array", async () => {
    const all = await collect()
    const bySlug = new Map(all.map(({ parsed }) => [parsed.slug, parsed]))
    for (const { file, parsed } of all) {
      if (parsed.spot_kind === "sub-spot") {
        const parent = bySlug.get(parsed.parent_cluster)
        if (!parent || parent.spot_kind !== "cluster") continue
        expect(
          parent.sub_spots.includes(parsed.slug),
          `${file}: parent cluster "${parent.slug}" does not include "${parsed.slug}" in its sub_spots[]`,
        ).toBe(true)
      }
    }
  })

  it("every sub-spot tier_rationale.en is ≥3 sentences", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      if (parsed.spot_kind === "sub-spot") {
        const en = parsed.tier_rationale.en ?? ""
        // Count terminal sentence punctuation, allowing for "e.g." abbreviations.
        const sentenceCount = en
          .replace(/\be\.g\./gi, "eg")
          .replace(/\bi\.e\./gi, "ie")
          .replace(/\bvs\./gi, "vs")
          .split(/[.!?]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 4).length
        expect(
          sentenceCount,
          `${file}: tier_rationale.en should be ≥3 sentences, got ${sentenceCount}`,
        ).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it("sub-spot coordinates lie within an approximate bbox of their declared region", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      if (parsed.spot_kind !== "sub-spot") continue
      const region = parsed.region
      if (!region) continue
      const bbox = regionBbox[region]
      if (!bbox) continue
      const { lat, lng } = parsed.coordinates.center
      expect(
        lat >= bbox.latMin && lat <= bbox.latMax,
        `${file}: coordinates.lat=${lat} outside region ${region} bbox [${bbox.latMin}, ${bbox.latMax}]`,
      ).toBe(true)
      expect(
        lng >= bbox.lngMin && lng <= bbox.lngMax,
        `${file}: coordinates.lng=${lng} outside region ${region} bbox [${bbox.lngMin}, ${bbox.lngMax}]`,
      ).toBe(true)
    }
  })

  it("sub-spot tier ∈ {1, 2, 3} (enforced by schema but tested explicitly)", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      if (parsed.spot_kind === "sub-spot") {
        expect([1, 2, 3]).toContain(parsed.tier)
        // satisfy ts-unused-vars
        void file
      }
    }
  })

  it("sub-spot coordinates.radius_m is positive and ≤ 5000", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      if (parsed.spot_kind === "sub-spot") {
        const r = parsed.coordinates.radius_m
        expect(r, `${file}: radius_m=${r} must be > 0`).toBeGreaterThan(0)
        expect(r, `${file}: radius_m=${r} must be ≤ 5000`).toBeLessThanOrEqual(5000)
      }
    }
  })

  it("sub-spot slug starts with parent_cluster slug + '-'", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      if (parsed.spot_kind === "sub-spot") {
        expect(
          parsed.slug.startsWith(parsed.parent_cluster + "-"),
          `${file}: slug "${parsed.slug}" should start with parent_cluster "${parsed.parent_cluster}-"`,
        ).toBe(true)
      }
    }
  })
})
