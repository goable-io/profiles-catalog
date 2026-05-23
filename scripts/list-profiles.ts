import { glob } from "glob"
import { readFile } from "node:fs/promises"
import { parse as parseYaml } from "yaml"
import { ProfileSchema } from "../schema/profile.schema.js"

type Row = {
  key: string
  category: string
  slug: string
  kind: string
  region: string
  tier: string
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
      kind: parsed.spot_kind,
      region: "region" in parsed && parsed.region ? parsed.region : "—",
      tier: "tier" in parsed ? String(parsed.tier) : "—",
      maturity: parsed.meta.maturity,
      sources: parsed.meta.sources.length,
      reviewers: parsed.meta.reviewed_by.length,
    })
  }

  const widths = {
    key: Math.max(3, ...rows.map((r) => r.key.length)),
    category: Math.max(8, ...rows.map((r) => r.category.length)),
    slug: Math.max(4, ...rows.map((r) => r.slug.length)),
    kind: Math.max(4, ...rows.map((r) => r.kind.length)),
    region: Math.max(6, ...rows.map((r) => r.region.length)),
    tier: 4,
    maturity: Math.max(8, ...rows.map((r) => r.maturity.length)),
  }
  const pad = (s: string, w: number): string => s.padEnd(w)
  const header =
    pad("key", widths.key) +
    "  " + pad("category", widths.category) +
    "  " + pad("kind", widths.kind) +
    "  " + pad("slug", widths.slug) +
    "  " + pad("region", widths.region) +
    "  " + pad("tier", widths.tier) +
    "  " + pad("maturity", widths.maturity) +
    "  sources  reviewers"
  console.log(header)
  console.log("-".repeat(header.length))
  for (const r of rows) {
    console.log(
      pad(r.key, widths.key) +
      "  " + pad(r.category, widths.category) +
      "  " + pad(r.kind, widths.kind) +
      "  " + pad(r.slug, widths.slug) +
      "  " + pad(r.region, widths.region) +
      "  " + pad(r.tier, widths.tier) +
      "  " + pad(r.maturity, widths.maturity) +
      "  " + String(r.sources).padStart(7) +
      "  " + String(r.reviewers).padStart(9),
    )
  }

  const byKind = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1
    return acc
  }, {})
  const byMaturity = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.maturity] = (acc[r.maturity] ?? 0) + 1
    return acc
  }, {})
  console.log(`\nTotal: ${rows.length} profiles`)
  console.log("By kind:")
  for (const [k, n] of Object.entries(byKind).sort()) {
    console.log(`  ${k}: ${n}`)
  }
  console.log("By maturity:")
  for (const [m, n] of Object.entries(byMaturity).sort()) {
    console.log(`  ${m}: ${n}`)
  }
}

void main()
