import { describe, expect, it } from "vitest"
import { ProfileSchema, MetricEnum } from "../schema/profile.schema.js"

const validBase = {
  slug: "test-activity",
  spot_kind: "base" as const,
  version: "1.0.0",
  category: "water" as const,
  display_name: { en: "Test" },
  dimensions: [
    {
      name: "wind",
      metric: "wind_speed_kn",
      weight: 1.0,
      curve: [
        { x: 0, s: 0 },
        { x: 20, s: 1 },
      ],
    },
  ],
  gates: [],
  verdict_buckets: {
    unsafe: 0 as const,
    poor: [1, 30] as [number, number],
    marginal: [31, 50] as [number, number],
    fair: [51, 70] as [number, number],
    favorable: [71, 85] as [number, number],
    excellent: [86, 100] as [number, number],
  },
  meta: { reviewed_by: [], sources: [], maturity: "provisional" as const },
}

const validSubSpot = {
  slug: "test-activity-spot-test-cluster-alpha",
  spot_kind: "sub-spot" as const,
  version: "1.0.0",
  category: "water" as const,
  extends: "test-activity-spot-test-cluster",
  parent_cluster: "test-activity-spot-test-cluster",
  region: "atlantic" as const,
  coordinates: {
    center: { lat: 36.01, lng: -5.6 },
    radius_m: 300,
  },
  tier: 2 as const,
  tier_rationale: {
    en: "Deep open water. Sand bottom. Rescue available from local schools.",
  },
  display_name: { en: "Test sub-spot" },
  gates: [],
  meta: { reviewed_by: [], sources: [], maturity: "provisional" as const },
}

describe("ProfileSchema discriminated union", () => {
  it("accepts a minimal valid base profile", () => {
    expect(ProfileSchema.safeParse(validBase).success).toBe(true)
  })

  it("accepts a minimal valid sub-spot profile", () => {
    expect(ProfileSchema.safeParse(validSubSpot).success).toBe(true)
  })

  it("rejects profile without spot_kind", () => {
    const bad: Record<string, unknown> = { ...validBase }
    delete bad.spot_kind
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects sub-spot without coordinates", () => {
    const bad: Record<string, unknown> = { ...validSubSpot }
    delete bad.coordinates
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects sub-spot with tier outside {1, 2, 3}", () => {
    const bad = { ...validSubSpot, tier: 4 }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects sub-spot without tier_rationale.en", () => {
    const bad = { ...validSubSpot, tier_rationale: { it: "solo italiano" } }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects sub-spot coordinates with lat out of range", () => {
    const bad = {
      ...validSubSpot,
      coordinates: { center: { lat: 91, lng: 0 }, radius_m: 100 },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects sub-spot coordinates with radius_m > 5000", () => {
    const bad = {
      ...validSubSpot,
      coordinates: { center: { lat: 0, lng: 0 }, radius_m: 6000 },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects cluster with empty sub_spots[]", () => {
    const badCluster = {
      ...validBase,
      slug: "test-activity-spot-test-cluster",
      spot_kind: "cluster" as const,
      extends: "test-activity",
      sub_spots: [],
    }
    expect(ProfileSchema.safeParse(badCluster).success).toBe(false)
  })

  it("rejects base profile whose dimensions don't sum to 1", () => {
    const bad = {
      ...validBase,
      dimensions: [
        { ...validBase.dimensions[0], weight: 0.5 },
        { ...validBase.dimensions[0], name: "other", weight: 0.3 },
      ],
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects calibrated maturity without meta.calibration", () => {
    const bad = {
      ...validBase,
      meta: { ...validBase.meta, maturity: "calibrated" as const },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("accepts calibrated maturity with full calibration block", () => {
    const good = {
      ...validBase,
      meta: {
        ...validBase.meta,
        maturity: "calibrated" as const,
        calibration: {
          datasetVersion: "outcomes-2026Q4-v3",
          modelVersion: "L3-isotonic-v1.2",
          samples: 4200,
          fitDate: "2026-05-22",
        },
      },
    }
    expect(ProfileSchema.safeParse(good).success).toBe(true)
  })

  it("rejects non-ISO calibration fitDate", () => {
    const bad = {
      ...validBase,
      meta: {
        ...validBase.meta,
        maturity: "calibrated" as const,
        calibration: {
          datasetVersion: "x",
          modelVersion: "y",
          samples: 1,
          fitDate: "22-05-2026",
        },
      },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects invalid slug format", () => {
    const bad = { ...validBase, slug: "Invalid Slug!" }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects non-semver version", () => {
    const bad = { ...validBase, version: "1.0" }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("MetricEnum is non-empty and contains core metrics", () => {
    const values = MetricEnum.options
    expect(values).toContain("wind_speed_kn")
    expect(values).toContain("wave_height_m")
    expect(values).toContain("uv_index")
    expect(values.length).toBeGreaterThan(20)
  })
})
