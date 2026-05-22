import { readFile } from "node:fs/promises"
import { glob } from "glob"
import { parse as parseYaml } from "yaml"
import { ProfileSchema } from "./profile.schema.js"

async function main(): Promise<void> {
  const files = await glob("catalog/**/*.yaml")
  if (files.length === 0) {
    console.error("No YAML files found under catalog/")
    process.exit(2)
  }

  let failed = 0
  for (const file of files.sort()) {
    const raw = await readFile(file, "utf8")
    let parsed: unknown
    try {
      parsed = parseYaml(raw)
    } catch (err) {
      console.error(`✗ ${file}: YAML parse error — ${(err as Error).message}`)
      failed++
      continue
    }
    const result = ProfileSchema.safeParse(parsed)
    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = issue.path.length ? issue.path.join(".") : "(root)"
        console.error(`✗ ${file}: ${path} — ${issue.message}`)
      }
      failed++
    } else {
      console.log(`✓ ${file}`)
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} of ${files.length} files failed validation.`)
    process.exit(1)
  }
  console.log(`\nAll ${files.length} files validated successfully.`)
}

void main()
