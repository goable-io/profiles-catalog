import { describe, expect, it } from "vitest"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { readFile } from "node:fs/promises"

const exec = promisify(execFile)

describe("dist/catalog.json bundle (v2 dual-index)", () => {
  it("regenerates deterministically (run twice → identical bytes)", async () => {
    await exec("pnpm", ["bundle"])
    const a = await readFile("dist/catalog.json", "utf8")
    await exec("pnpm", ["bundle"])
    const b = await readFile("dist/catalog.json", "utf8")
    const stripGen = (s: string) =>
      s.replace(/"generatedAt": "[^"]+"/, '"generatedAt": "<stripped>"')
    expect(stripGen(a)).toBe(stripGen(b))
  }, 30_000)

  it("emits schemaVersion 2.3.0 + profilesByPath + profilesBySlug", async () => {
    await exec("pnpm", ["bundle"])
    const raw = await readFile("dist/catalog.json", "utf8")
    const data = JSON.parse(raw) as {
      schemaVersion: string
      profilesByPath: Record<string, unknown>
      profilesBySlug: Record<string, unknown>
    }
    expect(data.schemaVersion).toBe("2.3.0")
    expect(Object.keys(data.profilesByPath).length).toBeGreaterThanOrEqual(70)
    expect(Object.keys(data.profilesBySlug).length).toBeGreaterThanOrEqual(70)
  }, 30_000)

  it("profilesByPath and profilesBySlug have matching cardinality (no dropped profiles)", async () => {
    await exec("pnpm", ["bundle"])
    const raw = await readFile("dist/catalog.json", "utf8")
    const data = JSON.parse(raw) as {
      profilesByPath: Record<string, unknown>
      profilesBySlug: Record<string, unknown>
    }
    expect(Object.keys(data.profilesByPath).length).toBe(
      Object.keys(data.profilesBySlug).length,
    )
  }, 30_000)
})
