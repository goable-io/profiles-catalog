import { glob } from "glob"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { parse as parseYaml } from "yaml"
import { ProfileSchema, type Profile } from "../schema/profile.schema.js"

async function main(): Promise<void> {
  const files = await glob("catalog/**/*.yaml")
  const profilesByPath: Record<string, Profile> = {}
  const profilesBySlug: Record<string, Profile> = {}

  for (const file of files.sort()) {
    const raw = await readFile(file, "utf8")
    const parsed = parseYaml(raw)
    const validated = ProfileSchema.parse(parsed)

    const pathKey = file.replace(/^catalog\//, "").replace(/\.yaml$/, "")
    if (profilesByPath[pathKey]) {
      throw new Error(`duplicate path key: ${pathKey}`)
    }
    profilesByPath[pathKey] = validated

    if (profilesBySlug[validated.slug]) {
      throw new Error(`duplicate slug: ${validated.slug} (in ${file})`)
    }
    profilesBySlug[validated.slug] = validated
  }

  await mkdir("dist", { recursive: true })
  const out = {
    schemaVersion: "2.0.0",
    version: process.env.npm_package_version ?? "2.0.0",
    generatedAt: new Date().toISOString(),
    profilesByPath,
    profilesBySlug,
  }
  await writeFile("dist/catalog.json", JSON.stringify(out, null, 2))
  console.log(
    `Bundled ${Object.keys(profilesByPath).length} profiles → dist/catalog.json`,
  )
  console.log(
    `  schemaVersion: ${out.schemaVersion}`,
  )
  console.log(
    `  bySlug index: ${Object.keys(profilesBySlug).length} slugs`,
  )
}

void main()
