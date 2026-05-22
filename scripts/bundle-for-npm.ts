import { glob } from "glob"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { parse as parseYaml } from "yaml"
import { ProfileSchema } from "../schema/profile.schema.js"

async function main(): Promise<void> {
  const files = await glob("catalog/**/*.yaml")
  const profiles: Record<string, unknown> = {}
  for (const file of files.sort()) {
    const raw = await readFile(file, "utf8")
    const parsed = parseYaml(raw)
    const validated = ProfileSchema.parse(parsed)
    // Slug uniqueness across base/region/spot variants is enforced by file path,
    // but explicit double-keying detects collisions.
    const key = file.replace(/^catalog\//, "").replace(/\.yaml$/, "")
    if (profiles[key]) {
      throw new Error(`duplicate bundle key: ${key}`)
    }
    profiles[key] = validated
  }
  await mkdir("dist", { recursive: true })
  const out = {
    version: process.env.npm_package_version ?? "1.0.0",
    generatedAt: new Date().toISOString(),
    profiles,
  }
  await writeFile("dist/catalog.json", JSON.stringify(out, null, 2))
  console.log(`Bundled ${Object.keys(profiles).length} profiles → dist/catalog.json`)
}

void main()
