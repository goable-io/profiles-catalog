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

describe("catalog", () => {
  it("contains at least 70 profiles (post-v2 hierarchical layout)", async () => {
    const all = await collect()
    expect(all.length).toBeGreaterThanOrEqual(70)
  })

  it("every YAML validates against ProfileSchema", async () => {
    const all = await collect()
    expect(all.length).toBeGreaterThan(0)
  })

  it("every base/region/cluster dimensions sum to 1 (tolerance 0.001)", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      if (
        parsed.spot_kind === "base" ||
        parsed.spot_kind === "region" ||
        parsed.spot_kind === "cluster"
      ) {
        const sum = parsed.dimensions.reduce((s, d) => s + d.weight, 0)
        expect(Math.abs(sum - 1), `${file}: weights sum = ${sum}`).toBeLessThan(0.001)
      }
    }
  })

  it("sub-spot dimensions, if present, sum to 1", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      if (parsed.spot_kind === "sub-spot" && parsed.dimensions) {
        const sum = parsed.dimensions.reduce((s, d) => s + d.weight, 0)
        expect(Math.abs(sum - 1), `${file}: weights sum = ${sum}`).toBeLessThan(0.001)
      }
    }
  })

  it("file path keys are unique", async () => {
    const all = await collect()
    const keys = all.map(({ file }) =>
      file.replace(/^catalog\//, "").replace(/\.yaml$/, ""),
    )
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("slugs are unique across the entire catalog", async () => {
    const all = await collect()
    const slugs = all.map(({ parsed }) => parsed.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it("region/cluster/sub-spot `extends` references an existing slug", async () => {
    const all = await collect()
    const bySlug = new Map(all.map(({ parsed }) => [parsed.slug, parsed]))
    for (const { file, parsed } of all) {
      if (
        parsed.spot_kind === "region" ||
        parsed.spot_kind === "cluster" ||
        parsed.spot_kind === "sub-spot"
      ) {
        expect(
          bySlug.has(parsed.extends),
          `${file} extends unknown slug "${parsed.extends}"`,
        ).toBe(true)
      }
    }
  })

  it("calibrated profiles ship a meta.calibration block", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      if (parsed.meta.maturity === "calibrated") {
        expect(
          parsed.meta.calibration,
          `${file}: maturity=calibrated requires meta.calibration`,
        ).toBeDefined()
      }
    }
  })

  it("reviewed profiles list ≥1 source", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      if (parsed.meta.maturity === "reviewed") {
        expect(
          parsed.meta.sources.length,
          `${file}: maturity=reviewed must list ≥1 source`,
        ).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it("gates have non-empty reason_code in SCREAMING_SNAKE_CASE", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      for (const g of parsed.gates) {
        expect(
          /^[A-Z][A-Z0-9_]*$/.test(g.reason_code),
          `${file}: gate reason_code "${g.reason_code}" must be SCREAMING_SNAKE_CASE`,
        ).toBe(true)
      }
    }
  })
})
