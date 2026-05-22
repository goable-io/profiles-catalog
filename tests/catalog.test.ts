import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"
import { glob } from "glob"
import { parse as parseYaml } from "yaml"
import { ProfileSchema } from "../schema/profile.schema.js"

const collect = async () => {
  const files = await glob("catalog/**/*.yaml")
  return Promise.all(
    files.sort().map(async (file) => {
      const raw = await readFile(file, "utf8")
      const parsed = parseYaml(raw)
      return { file, parsed }
    }),
  )
}

describe("catalog", () => {
  it("contains at least the documented 33 profiles", async () => {
    const all = await collect()
    expect(all.length).toBeGreaterThanOrEqual(33)
  })

  it("every YAML validates against ProfileSchema", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      const result = ProfileSchema.safeParse(parsed)
      if (!result.success) {
        const messages = result.error.issues
          .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("\n  ")
        throw new Error(`${file} failed schema validation:\n  ${messages}`)
      }
    }
  })

  it("every dimension's weights sum to exactly 1 (tolerance 0.001)", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      const profile = ProfileSchema.parse(parsed)
      const sum = profile.dimensions.reduce((s, d) => s + d.weight, 0)
      expect(Math.abs(sum - 1), `${file}: weights sum = ${sum}`).toBeLessThan(0.001)
    }
  })

  it("bundle keys are unique across base/regions/spots", async () => {
    const all = await collect()
    const keys = all.map(({ file }) =>
      file.replace(/^catalog\//, "").replace(/\.yaml$/, ""),
    )
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("region variants reference an existing base profile via extends", async () => {
    const all = await collect()
    const bySlug = new Map<string, unknown>()
    for (const { parsed } of all) {
      const p = ProfileSchema.parse(parsed)
      bySlug.set(p.slug, p)
    }
    for (const { file, parsed } of all) {
      const p = ProfileSchema.parse(parsed)
      if (p.extends) {
        expect(
          bySlug.has(p.extends),
          `${file} extends unknown slug "${p.extends}"`,
        ).toBe(true)
      }
    }
  })

  it("calibrated profiles ship a meta.calibration block", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      const p = ProfileSchema.parse(parsed)
      if (p.meta.maturity === "calibrated") {
        expect(
          p.meta.calibration,
          `${file}: maturity=calibrated requires meta.calibration`,
        ).toBeDefined()
      }
    }
  })

  it("reviewed profiles list ≥1 source", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      const p = ProfileSchema.parse(parsed)
      if (p.meta.maturity === "reviewed") {
        expect(
          p.meta.sources.length,
          `${file}: maturity=reviewed must list ≥1 source`,
        ).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it("gates have non-empty reason_code in SCREAMING_SNAKE_CASE", async () => {
    const all = await collect()
    for (const { file, parsed } of all) {
      const p = ProfileSchema.parse(parsed)
      for (const g of p.gates) {
        expect(
          /^[A-Z][A-Z0-9_]*$/.test(g.reason_code),
          `${file}: gate reason_code "${g.reason_code}" must be SCREAMING_SNAKE_CASE`,
        ).toBe(true)
      }
    }
  })
})
