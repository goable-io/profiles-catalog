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

// ─── v2.1.0 skill_curves ────────────────────────────────────────────────────

const validSkillCurves = {
  cohort_hash: "a1b2c3d4e5f60718",
  a: 1.42,
  n_train: 4200,
  levels: [-1, 0, 1],
  grid: [0, 5, 10, 15, 20, 25, 30],
  curves: [
    [0.05, 0.20, 0.55, 0.80, 0.95, 0.90, 0.70], // beginner
    [0.10, 0.30, 0.65, 0.90, 1.00, 0.95, 0.75], // intermediate
    [0.15, 0.40, 0.75, 0.95, 1.00, 1.00, 0.85], // expert
  ],
}

const calibratedMeta = {
  reviewed_by: [],
  sources: [],
  maturity: "calibrated" as const,
  calibration: {
    datasetVersion: "outcomes-2026Q4-v3",
    modelVersion: "L15-M4-isotonic-v1.2",
    samples: 4200,
    fitDate: "2026-05-22",
  },
}

describe("ProfileSchema skill_curves (v2.1.0)", () => {
  it("accepts skill_curves on a calibrated profile", () => {
    const good = {
      ...validBase,
      meta: calibratedMeta,
      skill_curves: validSkillCurves,
    }
    const result = ProfileSchema.safeParse(good)
    expect(result.success, JSON.stringify(result, null, 2)).toBe(true)
  })

  it("rejects skill_curves on a provisional profile", () => {
    const bad = {
      ...validBase,
      // explicit provisional (validBase already has this, but be loud)
      meta: { reviewed_by: [], sources: [], maturity: "provisional" as const },
      skill_curves: validSkillCurves,
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects skill_curves on a reviewed profile", () => {
    const bad = {
      ...validBase,
      meta: {
        reviewed_by: ["Reviewer One", "Reviewer Two"],
        sources: ["Some peer-reviewed paper, 2025"],
        maturity: "reviewed" as const,
      },
      skill_curves: validSkillCurves,
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects curves with mismatched L × G shape", () => {
    const bad = {
      ...validBase,
      meta: calibratedMeta,
      skill_curves: {
        ...validSkillCurves,
        // levels.length=3 but curves.length=2 — should fail superRefine
        curves: [
          [0.05, 0.20, 0.55, 0.80, 0.95, 0.90, 0.70],
          [0.10, 0.30, 0.65, 0.90, 1.00, 0.95, 0.75],
        ],
      },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects curves with row length not matching grid.length", () => {
    const bad = {
      ...validBase,
      meta: calibratedMeta,
      skill_curves: {
        ...validSkillCurves,
        // grid.length=7 but row 1 has 6 entries
        curves: [
          [0.05, 0.20, 0.55, 0.80, 0.95, 0.90, 0.70],
          [0.10, 0.30, 0.65, 0.90, 1.00, 0.95], // ← 6 entries
          [0.15, 0.40, 0.75, 0.95, 1.00, 1.00, 0.85],
        ],
      },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects a non-monotonic grid", () => {
    const bad = {
      ...validBase,
      meta: calibratedMeta,
      skill_curves: {
        ...validSkillCurves,
        // duplicate value violates strict monotonicity
        grid: [0, 5, 10, 10, 20, 25, 30],
      },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("accepts a profile WITHOUT skill_curves at any maturity (backward-compat)", () => {
    const provisional = { ...validBase }
    expect(ProfileSchema.safeParse(provisional).success).toBe(true)

    const reviewed = {
      ...validBase,
      meta: {
        reviewed_by: ["A", "B"],
        sources: ["a"],
        maturity: "reviewed" as const,
      },
    }
    expect(ProfileSchema.safeParse(reviewed).success).toBe(true)

    const calibrated = { ...validBase, meta: calibratedMeta }
    expect(ProfileSchema.safeParse(calibrated).success).toBe(true)
  })

  it("rejects skill_curves with unknown extra fields (strict)", () => {
    const bad = {
      ...validBase,
      meta: calibratedMeta,
      skill_curves: {
        ...validSkillCurves,
        unknown_field: "should not be here",
      },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects negative discrimination scalar a", () => {
    const bad = {
      ...validBase,
      meta: calibratedMeta,
      skill_curves: { ...validSkillCurves, a: -0.5 },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })
})
