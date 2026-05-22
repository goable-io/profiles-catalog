import { writeFile, mkdir } from "node:fs/promises"
import { z } from "zod"
import { ProfileSchema } from "../schema/profile.schema.js"

async function main(): Promise<void> {
  const jsonSchema = z.toJSONSchema(ProfileSchema, {
    target: "draft-2020-12",
  })
  const wrapped = {
    title: "Goable Activity Profile",
    $comment:
      "Auto-generated from schema/profile.schema.ts via z.toJSONSchema (Zod v4). " +
      "Do not edit by hand — regenerate with `pnpm bundle`.",
    ...jsonSchema,
  }
  await mkdir("dist", { recursive: true })
  await writeFile("dist/profile.schema.json", JSON.stringify(wrapped, null, 2))
  console.log("Emitted dist/profile.schema.json")
}

void main()
