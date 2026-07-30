import { describe, expect, it } from "vitest"
import { ProfileSchema } from "../schema/profile.schema.js"

// A minimal, known-valid base profile used as the baseline for every test
// below. Each test clones it and mutates exactly the field under test.
const validBase = {
  slug: "test-activity",
  spot_kind: "base" as const,
  version: "1.0.0",
  category: "water" as const,
  display_name: { en: "Test" },
  dimensions: [
    {
      name: "wind",
      metric: "wind_speed_kn" as const,
      weight: 0.5,
      curve: [
        { x: 0, s: 0 },
        { x: 20, s: 1 },
      ],
    },
    {
      name: "wind_direction",
      metric: "wind_direction_deg" as const,
      weight: 0.5,
      modifiers: {
        direction_preference: [{ from: 0, to: 90, multiplier: 1 }],
      },
    },
  ],
  gates: [
    {
      metric: "wind_speed_kn",
      condition: "gt" as const,
      value: 45,
      reason_code: "HIGH_WIND",
      description: "Too windy.",
    },
  ],
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

describe("FIX #7 / #17 — Gate.condition coupled to Gate.value shape", () => {
  it("accepts a valid gt gate with a numeric value", () => {
    const good = {
      ...validBase,
      gates: [{ metric: "wind_speed_kn", condition: "gt" as const, value: 40, reason_code: "HIGH_WIND", description: "d" }],
    }
    expect(ProfileSchema.safeParse(good).success).toBe(true)
  })

  it("rejects gt/lt gate with a string value (type mismatch)", () => {
    const bad = {
      ...validBase,
      gates: [{ metric: "wind_speed_kn", condition: "gt" as const, value: "40", reason_code: "HIGH_WIND", description: "d" }],
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects lt gate with an array value", () => {
    const bad = {
      ...validBase,
      gates: [{ metric: "wind_speed_kn", condition: "lt" as const, value: [1, 2], reason_code: "TOO_LOW", description: "d" }],
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("accepts a valid between gate with a 2-element ascending number array", () => {
    const good = {
      ...validBase,
      gates: [{ metric: "tide_phase", condition: "between" as const, value: [0.2, 0.8], reason_code: "TIDE_WINDOW", description: "d" }],
    }
    expect(ProfileSchema.safeParse(good).success).toBe(true)
  })

  it("rejects between gate with a scalar number value (wrong shape)", () => {
    const bad = {
      ...validBase,
      gates: [{ metric: "tide_phase", condition: "between" as const, value: 5, reason_code: "TIDE_WINDOW", description: "d" }],
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects between gate with a 3-element array (wrong shape)", () => {
    const bad = {
      ...validBase,
      gates: [{ metric: "tide_phase", condition: "between" as const, value: [1, 2, 3], reason_code: "TIDE_WINDOW", description: "d" }],
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects between gate with REVERSED bounds (FIX #17: lo > hi is unsatisfiable)", () => {
    const bad = {
      ...validBase,
      gates: [{ metric: "tide_phase", condition: "between" as const, value: [0.8, 0.2], reason_code: "TIDE_WINDOW", description: "d" }],
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("accepts equal bounds for between (lo === hi is a degenerate but satisfiable point)", () => {
    const good = {
      ...validBase,
      gates: [{ metric: "tide_phase", condition: "between" as const, value: [0.5, 0.5], reason_code: "TIDE_WINDOW", description: "d" }],
    }
    expect(ProfileSchema.safeParse(good).success).toBe(true)
  })

  it("accepts a valid in gate with an array value", () => {
    const good = {
      ...validBase,
      gates: [{ metric: "precipitation_form", condition: "in" as const, value: ["rain", "sleet"], reason_code: "WET_FORM", description: "d" }],
    }
    expect(ProfileSchema.safeParse(good).success).toBe(true)
  })

  it("rejects in gate with a scalar value (not an array)", () => {
    const bad = {
      ...validBase,
      gates: [{ metric: "precipitation_form", condition: "in" as const, value: "rain", reason_code: "WET_FORM", description: "d" }],
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects not_in gate with a scalar value (not an array)", () => {
    const bad = {
      ...validBase,
      gates: [{ metric: "precipitation_form", condition: "not_in" as const, value: 12, reason_code: "BAD_FORM", description: "d" }],
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })
})

describe("FIX #19 — DimensionSchema requires curve or direction_preference", () => {
  it("accepts a dimension with only `curve`", () => {
    const good = {
      ...validBase,
      dimensions: [
        { name: "wind", metric: "wind_speed_kn" as const, weight: 1, curve: [{ x: 0, s: 0 }, { x: 20, s: 1 }] },
      ],
    }
    expect(ProfileSchema.safeParse(good).success).toBe(true)
  })

  it("accepts a dimension with only `modifiers.direction_preference`", () => {
    const good = {
      ...validBase,
      dimensions: [
        {
          name: "wind_direction",
          metric: "wind_direction_deg" as const,
          weight: 1,
          modifiers: { direction_preference: [{ from: 0, to: 90, multiplier: 1 }] },
        },
      ],
    }
    expect(ProfileSchema.safeParse(good).success).toBe(true)
  })

  it("rejects a dimension with NEITHER curve nor direction_preference", () => {
    const bad = {
      ...validBase,
      dimensions: [{ name: "wind", metric: "wind_speed_kn" as const, weight: 1 }],
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects a dimension with an empty curve array and no direction_preference", () => {
    const bad = {
      ...validBase,
      dimensions: [{ name: "wind", metric: "wind_speed_kn" as const, weight: 1, curve: [] }],
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects a dimension with an empty direction_preference array and no curve", () => {
    const bad = {
      ...validBase,
      dimensions: [
        {
          name: "wind_direction",
          metric: "wind_direction_deg" as const,
          weight: 1,
          modifiers: { direction_preference: [] },
        },
      ],
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })
})

describe("FIX #21 — verdict_buckets must be contiguous and cover [1, 100]", () => {
  it("accepts the standard contiguous tiling used across the catalog", () => {
    expect(ProfileSchema.safeParse(validBase).success).toBe(true)
  })

  it("rejects verdict_buckets with a GAP between bands", () => {
    const bad = {
      ...validBase,
      verdict_buckets: {
        ...validBase.verdict_buckets,
        // gap: marginal ends at 50, fair should start at 51 but starts at 55
        fair: [55, 70] as [number, number],
      },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects verdict_buckets with OVERLAPPING bands", () => {
    const bad = {
      ...validBase,
      verdict_buckets: {
        ...validBase.verdict_buckets,
        // overlap: marginal ends at 50, fair should start at 51 but starts at 45
        fair: [45, 70] as [number, number],
      },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects verdict_buckets that doesn't start coverage at 1", () => {
    const bad = {
      ...validBase,
      verdict_buckets: {
        ...validBase.verdict_buckets,
        poor: [2, 30] as [number, number],
      },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects verdict_buckets that doesn't end coverage at 100", () => {
    const bad = {
      ...validBase,
      verdict_buckets: {
        ...validBase.verdict_buckets,
        excellent: [86, 99] as [number, number],
      },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })

  it("rejects a band with reversed internal bounds (lo > hi)", () => {
    const bad = {
      ...validBase,
      verdict_buckets: {
        ...validBase.verdict_buckets,
        marginal: [50, 31] as [number, number],
      },
    }
    expect(ProfileSchema.safeParse(bad).success).toBe(false)
  })
})
