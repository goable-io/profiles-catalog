import { z } from "zod"

export const CurvePointSchema = z.object({
  x: z.number(),
  s: z.number().min(0).max(1),
})

export type CurvePoint = z.infer<typeof CurvePointSchema>

export const MetricEnum = z.enum([
  "wind_speed_kn",
  "wind_gust_factor",
  "wind_direction_deg",
  "wave_height_m",
  "wave_period_s",
  "tide_phase",
  "sun_altitude_deg",
  "air_temperature_c",
  "water_temperature_c",
  "uv_index",
  "visibility_km",
  "precipitation_mm_h",
  "apparent_temp_c",
  "ground_swell_height_m",
  "swell_quality",
  "utci_c",
  "bathymetry_quality_multiplier",
  "swell_consistency",
  "storm_intensity",
  // L1d additions
  "thermal_lift_index",
  "convective_cloud_base_m",
  "wind_shear_vertical",
  "xc_condition_score",
  "snow_surface_quality",
  "snow_density_estimate_kg_m3",
  "snow_visibility_m",
  "lightning_proximity_score",
  "precipitation_form",
  "wbgt_c",
  // L1e additions
  "aqi_composite",
  "aqi_category",
  "tidal_current_speed_kn",
  "rip_current_proxy",
  "turbidity_proxy",
  "algal_bloom_risk",
  "water_clarity_index",
  "freezing_level_m",
  "rockfall_risk_index",
  "sea_fog_likelihood",
  "storm_surge_proxy",
  "coastal_visibility_combined_m",
  "twilight_band",
  // L1f additions
  "breaker_height_m",
  "breaker_type",
  "surf_quality_from_breaker",
  "air_density_kg_m3",
  "density_altitude_m",
  "oxygen_partial_pressure_hPa",
  "solar_azimuth_deg",
  "uv_dose_med",
  "swe_mm",
])

export type Metric = z.infer<typeof MetricEnum>

const DirectionRangeSchema = z.object({
  from: z.number(),
  to: z.number(),
  multiplier: z.number().min(0).max(1),
})

const ModifiersSchema = z
  .object({
    gust_factor_penalty: z
      .object({
        threshold: z.number(),
        penalty_coefficient: z.number(),
      })
      .optional(),
    direction_preference: z.array(DirectionRangeSchema).optional(),
  })
  .optional()

export const DimensionSchema = z.object({
  name: z.string(),
  metric: MetricEnum,
  weight: z.number().min(0).max(1),
  curve: z.array(CurvePointSchema).optional(),
  preferred_phases: z.array(z.string()).optional(),
  comfort_range: z.tuple([z.number(), z.number()]).optional(),
  modifiers: ModifiersSchema,
})

export type Dimension = z.infer<typeof DimensionSchema>

export const GateSchema = z.object({
  metric: z.string(),
  condition: z.enum(["lt", "gt", "in", "not_in", "between"]),
  value: z.union([z.number(), z.string(), z.array(z.union([z.number(), z.string()]))]),
  reason_code: z.string(),
  description: z.string(),
})

export type Gate = z.infer<typeof GateSchema>

const VerdictBucketsSchema = z.object({
  unsafe: z.literal(0),
  poor: z.tuple([z.number(), z.number()]),
  marginal: z.tuple([z.number(), z.number()]),
  fair: z.tuple([z.number(), z.number()]),
  favorable: z.tuple([z.number(), z.number()]),
  excellent: z.tuple([z.number(), z.number()]),
})

const CalibrationSchema = z.object({
  datasetVersion: z.string().min(1),
  modelVersion: z.string().min(1),
  samples: z.number().int().min(1),
  fitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "fitDate must be ISO date YYYY-MM-DD"),
})

export type Calibration = z.infer<typeof CalibrationSchema>

const MetaSchema = z
  .object({
    reviewed_by: z.array(z.string()).default([]),
    sources: z.array(z.string()).default([]),
    notes: z.string().optional(),
    maturity: z.enum(["provisional", "reviewed", "calibrated"]),
    calibration: CalibrationSchema.optional(),
  })
  .default({ reviewed_by: [], sources: [], maturity: "provisional" })

const SustainabilitySchema = z
  .object({
    carbon_neutral: z.boolean().default(true),
    equipment_dependency: z.enum(["none", "low", "medium", "high"]).default("medium"),
    typical_season_weeks: z.number().int().min(1).max(52).optional(),
    carrying_capacity_sensitivity: z.enum(["low", "medium", "high"]).default("medium"),
    notes: z.string().optional(),
  })
  .optional()

export const RegionEnum = z.enum([
  // v1 core basins
  "mediterranean",
  "atlantic",
  "pacific",
  "indian",
  "alpine",
  "global",
  // v2.2 — finer-grained sub-basins (additive)
  "caribbean",       // tropical W Atlantic — Caribbean Sea + adjacent islands
  "red-sea",         // separates from "indian" — distinct hydrography and use case
  "aegean",          // Mediterranean sub-basin with the dominant Meltemi regime
  "south-china-sea", // Pacific sub-basin with the SE Asia NE-monsoon regime
  // v2.2 — additional sub-basins added pre-emptively for forthcoming
  // bootstrap PRs (surf, ski-touring, freeride, paragliding)
  "north-sea",       // NW European coast (NL, DE, DK) — N-Atlantic synoptic regime
  "baltic",          // NE European semi-enclosed sea — distinct cold-water regime
  "bay-of-biscay",   // FR/ES Atlantic coast — Hossegor / Mundaka surf zone
  "gulf-of-mexico",  // US Gulf coast (South Padre, FL panhandle) — distinct from Caribbean
  "adriatic",        // Italian NE / Croatia — Bora regime is climatologically distinct
  "arctic",          // High latitude (Lofoten, Lyngen, Iceland) — polar-influenced
  "sea-of-japan",    // Japanese W coast (Hokkaido, Niseko, Hakuba) — lake-effect snow
  "rockies",         // North American Rocky Mountains (Whistler, Revelstoke, Jackson)
  "andes",           // South American Andes (Iquique, Roldanillo, Patagonia)
  "himalayas",       // Himalayan range (Bir-Billing, Annapurna, Karakoram)
])
export type Region = z.infer<typeof RegionEnum>

// v2.0.0 additions ────────────────────────────────────────────────────────────

export const CoordinatesSchema = z.object({
  center: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  radius_m: z.number().int().positive().max(5000),
})

export type Coordinates = z.infer<typeof CoordinatesSchema>

export const TierSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])
export type Tier = z.infer<typeof TierSchema>

export const SpotKindEnum = z.enum(["base", "region", "cluster", "sub-spot"])
export type SpotKind = z.infer<typeof SpotKindEnum>

// v2.1.0 additions ────────────────────────────────────────────────────────────

// L15 Inverse Suitability "skill curve family" — pre-computed suitability
// curves conditioned on rider skill, emitted by the M4 latent-factor
// calibrator in the consumer monorepo. When present, scoring engines may
// prefer these pre-computed values over the on-the-fly fallback derived
// from the difficulty atlas. Reserved for `meta.maturity: "calibrated"`
// profiles — external contributors cannot author this block.
export const SkillCurveFamilySchema = z
  .object({
    // SHA-256 hex of the canonicalised cohort parquet that produced
    // this fit. Joinable to the consumer's calibration_runs.cohort_hash.
    cohort_hash: z.string().regex(/^[a-f0-9]{8,}$/i),
    // Fitted discrimination scalar from M4 (a > 0).
    a: z.number().positive(),
    // Paired-outcome count behind the fit.
    n_train: z.number().int().positive(),
    // The θ quantile anchors — Phase 1 ships [-1, 0, 1] (beginner /
    // intermediate / expert under the N(0, 1) prior). Length L.
    levels: z.array(z.number()).min(2).max(7),
    // Metric grid where suitability is evaluated. Strictly monotonic
    // ascending. Length G.
    grid: z.array(z.number()).min(2),
    // Suitability values per (level × grid point). Shape L × G,
    // every entry in [0, 1].
    curves: z.array(z.array(z.number().min(0).max(1))).min(2),
  })
  .strict()
  .superRefine((data, ctx) => {
    const L = data.levels.length
    const G = data.grid.length
    if (data.curves.length !== L) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `curves rows (${data.curves.length}) must equal levels.length (${L})`,
        path: ["curves"],
      })
    }
    data.curves.forEach((row, i) => {
      if (row.length !== G) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `curves[${i}] length (${row.length}) must equal grid.length (${G})`,
          path: ["curves", i],
        })
      }
    })
    // Strict-monotone grid (consumers linear-interp between adjacent points).
    for (let i = 1; i < data.grid.length; i++) {
      const prev = data.grid[i - 1]
      const curr = data.grid[i]
      if (prev === undefined || curr === undefined) continue
      if (curr <= prev) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `grid must be strictly ascending; failed at index ${i}`,
          path: ["grid", i],
        })
      }
    }
  })

export type SkillCurveFamily = z.infer<typeof SkillCurveFamilySchema>

// Dimensions sum-to-1 check used by base/region/cluster variants
const dimsSumToOne = (dims: Array<z.infer<typeof DimensionSchema>>): boolean =>
  Math.abs(dims.reduce((s, d) => s + d.weight, 0) - 1) < 0.001
const dimsSumMessage = "Sum of dimension weights must equal 1 (tolerance 0.001)"

// Calibration refinement: if maturity is "calibrated", meta.calibration is required.
// Defined as a (data) => boolean predicate so it can be passed to .refine() on any
// schema whose output has a `meta` shape.
const calibrationOk = (data: {
  meta: { maturity: string; calibration?: unknown }
}): boolean =>
  data.meta.maturity !== "calibrated" || data.meta.calibration !== undefined

const calibrationRefineMessage = {
  message:
    "meta.maturity='calibrated' requires meta.calibration block (datasetVersion, modelVersion, samples, fitDate). Calibrated status is emitted only by Goable's L3 pipeline, not by external contributors.",
  path: ["meta", "calibration"],
}

// skill_curves gate: a profile with `meta.maturity !== "calibrated"` MUST NOT
// carry `skill_curves`. The block is emitted only by the L15 M4 fitter on
// the consumer side; external contributors cannot fabricate it.
const skillCurvesOk = (data: {
  meta: { maturity: string }
  skill_curves?: unknown
}): boolean =>
  data.meta.maturity === "calibrated" || data.skill_curves === undefined

const skillCurvesRefineMessage = {
  message:
    "skill_curves block requires meta.maturity='calibrated'. External contributors cannot fabricate it — only the L15 M4 pipeline emits this block.",
  path: ["skill_curves"],
}

// Fields common to every variant
const commonFields = {
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must be semver MAJOR.MINOR.PATCH"),
  category: z.enum(["water", "snow", "air", "land", "commercial"]),
  display_name: z.record(z.string(), z.string()),
  description: z.record(z.string(), z.string()).optional(),
  gates: z.array(GateSchema).default([]),
  sustainability: SustainabilitySchema,
  meta: MetaSchema,
  // v2.1.0: optional L15 skill-conditioned suitability curves. Reserved
  // for `meta.maturity: "calibrated"` profiles — see refinement below.
  skill_curves: SkillCurveFamilySchema.optional(),
}

// ── base ────────────────────────────────────────────────────────────────────
const baseInner = z.object({
  spot_kind: z.literal("base"),
  ...commonFields,
  dimensions: z.array(DimensionSchema).refine(dimsSumToOne, { message: dimsSumMessage }),
  verdict_buckets: VerdictBucketsSchema,
})
export const BaseProfileSchema = baseInner.refine(calibrationOk, calibrationRefineMessage)
  .refine(skillCurvesOk, skillCurvesRefineMessage)

// ── region ──────────────────────────────────────────────────────────────────
const regionInner = z.object({
  spot_kind: z.literal("region"),
  extends: z.string(),
  region: RegionEnum,
  ...commonFields,
  dimensions: z.array(DimensionSchema).refine(dimsSumToOne, { message: dimsSumMessage }),
  verdict_buckets: VerdictBucketsSchema,
})
export const RegionProfileSchema = regionInner.refine(calibrationOk, calibrationRefineMessage)
  .refine(skillCurvesOk, skillCurvesRefineMessage)

// ── cluster ─────────────────────────────────────────────────────────────────
const clusterInner = z.object({
  spot_kind: z.literal("cluster"),
  extends: z.string(),
  region: RegionEnum.optional(),
  // ISO 3166-1 alpha-2 country code. Optional on cluster (may span multiple
  // countries in theory; required on every contained sub-spot in practice).
  country_code: z.string().regex(/^[A-Z]{2}$/, "country_code must be ISO 3166-1 alpha-2 (e.g. IT, FR, US)").optional(),
  sub_spots: z
    .array(z.string())
    .min(1, "cluster must reference at least one sub-spot in `sub_spots`"),
  ...commonFields,
  dimensions: z.array(DimensionSchema).refine(dimsSumToOne, { message: dimsSumMessage }),
  verdict_buckets: VerdictBucketsSchema,
})
export const ClusterProfileSchema = clusterInner.refine(calibrationOk, calibrationRefineMessage)
  .refine(skillCurvesOk, skillCurvesRefineMessage)

// ── sub-spot ────────────────────────────────────────────────────────────────
// On sub-spots, scoring fields (dimensions, verdict_buckets) are optional —
// they inherit from the parent cluster when absent. coordinates + tier +
// tier_rationale are mandatory.
const subSpotInner = z.object({
  spot_kind: z.literal("sub-spot"),
  extends: z.string(),
  parent_cluster: z.string(),
  region: RegionEnum.optional(),
  // ISO 3166-1 alpha-2 country code. Optional in the schema for v2.x
  // back-compat, but the compute-stats pipeline fails loudly if missing —
  // every sub-spot in this repo MUST carry it.
  country_code: z.string().regex(/^[A-Z]{2}$/, "country_code must be ISO 3166-1 alpha-2 (e.g. IT, FR, US)").optional(),
  coordinates: CoordinatesSchema,
  tier: TierSchema,
  tier_rationale: z.record(z.string(), z.string()).refine(
    (r) => typeof r.en === "string" && r.en.trim().length > 0,
    { message: "tier_rationale must include an 'en' entry" },
  ),
  ...commonFields,
  dimensions: z
    .array(DimensionSchema)
    .refine(dimsSumToOne, { message: dimsSumMessage })
    .optional(),
  verdict_buckets: VerdictBucketsSchema.optional(),
})
export const SubSpotProfileSchema = subSpotInner.refine(calibrationOk, calibrationRefineMessage)
  .refine(skillCurvesOk, skillCurvesRefineMessage)

// ── union ───────────────────────────────────────────────────────────────────
// discriminatedUnion takes the unrefined inner ZodObjects (Zod v4 requires
// ZodObject members on the union). The calibration refinement is applied once
// to the union's output, which catches calibrated profiles missing the
// calibration block across every variant.
export const ProfileSchema = z
  .discriminatedUnion("spot_kind", [baseInner, regionInner, clusterInner, subSpotInner])
  .refine(calibrationOk, calibrationRefineMessage)
  .refine(skillCurvesOk, skillCurvesRefineMessage)

export type Profile = z.infer<typeof ProfileSchema>
export type BaseProfile = z.infer<typeof baseInner>
export type RegionProfile = z.infer<typeof regionInner>
export type ClusterProfile = z.infer<typeof clusterInner>
export type SubSpotProfile = z.infer<typeof subSpotInner>
