import { describe, expect, it } from "vitest"
import { ProfileSchema, MetricEnum } from "../schema/profile.schema.js"

const validProfile = {
  slug: "test-activity",
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

describe("ProfileSchema", () => {
  it("accepts a minimal valid profile", () => {
    const result = ProfileSchema.safeParse(validProfile)
    expect(result.success).toBe(true)
  })

  it("rejects dimensions whose weights don't sum to 1", () => {
    const bad = {
      ...validProfile,
      dimensions: [
        { ...validProfile.dimensions[0], weight: 0.5 },
        { ...validProfile.dimensions[0], name: "other", weight: 0.3 },
      ],
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects calibrated maturity without meta.calibration", () => {
    const bad = {
      ...validProfile,
      meta: { ...validProfile.meta, maturity: "calibrated" as const },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("accepts calibrated maturity with full calibration block", () => {
    const good = {
      ...validProfile,
      meta: {
        ...validProfile.meta,
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
      ...validProfile,
      meta: {
        ...validProfile.meta,
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
    const bad = { ...validProfile, slug: "Invalid Slug!" }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects non-semver version", () => {
    const bad = { ...validProfile, version: "1.0" }
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
