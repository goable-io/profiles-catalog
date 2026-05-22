import { describe, expect, it } from "vitest"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { readFile } from "node:fs/promises"

const exec = promisify(execFile)

describe("dist/catalog.json bundle", () => {
  it("regenerates deterministically (run twice → identical bytes)", async () => {
    await exec("pnpm", ["bundle"])
    const a = await readFile("dist/catalog.json", "utf8")
    await exec("pnpm", ["bundle"])
    const b = await readFile("dist/catalog.json", "utf8")
    // generatedAt drifts, so strip it for the equality check
    const stripGen = (s: string) =>
      s.replace(/"generatedAt": "[^"]+"/, '"generatedAt": "<stripped>"')
    expect(stripGen(a)).toBe(stripGen(b))
  }, 30_000)

  it("exposes all profiles under unique bundle keys", async () => {
    await exec("pnpm", ["bundle"])
    const raw = await readFile("dist/catalog.json", "utf8")
    const data = JSON.parse(raw) as { profiles: Record<string, unknown> }
    const keys = Object.keys(data.profiles)
    expect(keys.length).toBeGreaterThanOrEqual(33)
    expect(new Set(keys).size).toBe(keys.length)
  }, 30_000)
})
