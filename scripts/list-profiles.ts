import { glob } from "glob"
import { readFile } from "node:fs/promises"
import { parse as parseYaml } from "yaml"
import { ProfileSchema } from "../schema/profile.schema.js"

type Row = {
  key: string
  category: string
  slug: string
  region: string
  maturity: string
  sources: number
  reviewers: number
}

async function main(): Promise<void> {
  const files = await glob("catalog/**/*.yaml")
  const rows: Row[] = []
  for (const file of files.sort()) {
    const raw = await readFile(file, "utf8")
    const parsed = ProfileSchema.parse(parseYaml(raw))
    rows.push({
      key: file.replace(/^catalog\//, "").replace(/\.yaml$/, ""),
      category: parsed.category,
      slug: parsed.slug,
      region: parsed.region ?? "—",
      maturity: parsed.meta.maturity,
      sources: parsed.meta.sources.length,
      reviewers: parsed.meta.reviewed_by.length,
    })
  }

  const widths = {
    key: Math.max(3, ...rows.map((r) => r.key.length)),
    category: Math.max(8, ...rows.map((r) => r.category.length)),
    slug: Math.max(4, ...rows.map((r) => r.slug.length)),
    region: Math.max(6, ...rows.map((r) => r.region.length)),
    maturity: Math.max(8, ...rows.map((r) => r.maturity.length)),
  }
  const pad = (s: string, w: number): string => s.padEnd(w)
  const header =
    pad("key", widths.key) +
    "  " + pad("category", widths.category) +
    "  " + pad("slug", widths.slug) +
    "  " + pad("region", widths.region) +
    "  " + pad("maturity", widths.maturity) +
    "  sources  reviewers"
  console.log(header)
  console.log("-".repeat(header.length))
  for (const r of rows) {
    console.log(
      pad(r.key, widths.key) +
      "  " + pad(r.category, widths.category) +
      "  " + pad(r.slug, widths.slug) +
      "  " + pad(r.region, widths.region) +
      "  " + pad(r.maturity, widths.maturity) +
      "  " + String(r.sources).padStart(7) +
      "  " + String(r.reviewers).padStart(9),
    )
  }

  const byMaturity = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.maturity] = (acc[r.maturity] ?? 0) + 1
    return acc
  }, {})
  console.log(`\nTotal: ${rows.length} profiles`)
  for (const [m, n] of Object.entries(byMaturity).sort()) {
    console.log(`  ${m}: ${n}`)
  }
}

void main()
