import { glob } from "glob"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { parse as parseYaml } from "yaml"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { ProfileSchema, type Profile } from "../schema/profile.schema.js"

const exec = promisify(execFile)

interface CatalogStats {
  computedAt: string
  catalogVersion: string
  totals: {
    activities: number
    subSpots: number
    clusters: number
    regions: number
    countries: number
  }
  byActivity: ActivityCoverage[]
}

interface ActivityCoverage {
  slug: string
  family: string
  displayName: string
  subSpotCount: number
  clusterCount: number
  countryCount: number
  countries: string[]
  clusters: ClusterCoverage[]
  status: "seeded" | "partial" | "empty"
  lastUpdatedAt: string | null
}

interface ClusterCoverage {
  slug: string
  displayName: string
  countryCode: string
  subSpotCount: number
}

const titleCase = (slug: string): string =>
  slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

const pickDisplayName = (p: Profile): string => {
  const en = p.display_name?.en
  if (typeof en === "string" && en.length > 0) return en
  return titleCase(p.slug)
}

const gitLastUpdatedAt = async (dir: string): Promise<string | null> => {
  try {
    const { stdout } = await exec("git", ["log", "-1", "--format=%cI", "--", dir])
    const iso = stdout.trim()
    return iso.length > 0 ? iso : null
  } catch {
    return null
  }
}

async function main(): Promise<void> {
  const files = await glob("catalog/**/*.yaml")
  const parsed: Array<{ file: string; profile: Profile }> = []
  for (const file of files.sort()) {
    const raw = await readFile(file, "utf8")
    parsed.push({ file, profile: ProfileSchema.parse(parseYaml(raw)) })
  }

  // Index by spot_kind for efficient lookup
  const bases = parsed.filter((p) => p.profile.spot_kind === "base")
  const regions = parsed.filter((p) => p.profile.spot_kind === "region")
  const clusters = parsed.filter((p) => p.profile.spot_kind === "cluster")
  const subSpots = parsed.filter((p) => p.profile.spot_kind === "sub-spot")

  // Fail-fast: every sub-spot must have country_code
  for (const { file, profile } of subSpots) {
    if (profile.spot_kind !== "sub-spot") continue
    if (!profile.country_code) {
      throw new Error(
        `compute-stats: sub-spot ${file} is missing country_code. ` +
          `Every sub-spot must carry an ISO 3166-1 alpha-2 code.`,
      )
    }
  }

  // Activity → which base profile does a sub-spot belong to?
  // We resolve by walking the file path: catalog/<family>/<activity>/clusters/<cluster>/...
  // and matching against the base profile at catalog/<family>/<activity>/index.yaml.
  const baseByPath = new Map<string, Profile>()
  for (const { file, profile } of bases) {
    // file is like catalog/water/kitesurfing/index.yaml
    const activityDir = file.replace(/\/index\.yaml$/, "")
    baseByPath.set(activityDir, profile)
  }

  const activityDirOf = (file: string): string | null => {
    // catalog/<family>/<activity>/(rest) → catalog/<family>/<activity>
    const m = file.match(/^(catalog\/[^/]+\/[^/]+)\//)
    return m && m[1] ? m[1] : null
  }

  // Group sub-spots by activity dir
  const subSpotsByActivity = new Map<string, typeof subSpots>()
  for (const entry of subSpots) {
    const dir = activityDirOf(entry.file)
    if (!dir) continue
    const list = subSpotsByActivity.get(dir) ?? []
    list.push(entry)
    subSpotsByActivity.set(dir, list)
  }

  // Group clusters by activity dir
  const clustersByActivity = new Map<string, typeof clusters>()
  for (const entry of clusters) {
    const dir = activityDirOf(entry.file)
    if (!dir) continue
    const list = clustersByActivity.get(dir) ?? []
    list.push(entry)
    clustersByActivity.set(dir, list)
  }

  // Build per-activity stats
  const byActivity: ActivityCoverage[] = []
  for (const [activityDir, baseProfile] of baseByPath.entries()) {
    const familySegment = activityDir.split("/")[1] ?? "unknown"
    const activitySubSpots = subSpotsByActivity.get(activityDir) ?? []
    const activityClusters = clustersByActivity.get(activityDir) ?? []

    // Distinct country codes from this activity's sub-spots
    const countrySet = new Set<string>()
    for (const { profile } of activitySubSpots) {
      if (profile.spot_kind === "sub-spot" && profile.country_code) {
        countrySet.add(profile.country_code)
      }
    }
    const countries = Array.from(countrySet).sort()

    // Per-cluster sub-spot count
    const clusterCoverage: ClusterCoverage[] = activityClusters.map(({ profile }) => {
      if (profile.spot_kind !== "cluster") {
        throw new Error("unreachable: filtered to cluster")
      }
      const childCount = activitySubSpots.filter(
        ({ profile: p }) => p.spot_kind === "sub-spot" && p.parent_cluster === profile.slug,
      ).length
      // Derive country: prefer cluster's own country_code, fall back to the
      // first sub-spot's. (All current clusters have country_code set, but
      // schema makes it optional so we tolerate that.)
      const firstChild = activitySubSpots.find(
        ({ profile: p }) => p.spot_kind === "sub-spot" && p.parent_cluster === profile.slug,
      )
      const childCountry =
        firstChild?.profile.spot_kind === "sub-spot" ? firstChild.profile.country_code : undefined
      const countryCode = profile.country_code ?? childCountry ?? "??"
      return {
        slug: profile.slug,
        displayName: pickDisplayName(profile),
        countryCode,
        subSpotCount: childCount,
      }
    })
    clusterCoverage.sort((a, b) =>
      b.subSpotCount !== a.subSpotCount ? b.subSpotCount - a.subSpotCount : a.slug.localeCompare(b.slug),
    )

    const subSpotCount = activitySubSpots.length
    const status: ActivityCoverage["status"] =
      subSpotCount === 0 ? "empty" : subSpotCount < 10 ? "partial" : "seeded"

    byActivity.push({
      slug: baseProfile.slug,
      family: familySegment,
      displayName: pickDisplayName(baseProfile),
      subSpotCount,
      clusterCount: activityClusters.length,
      countryCount: countries.length,
      countries,
      clusters: clusterCoverage,
      status,
      lastUpdatedAt: await gitLastUpdatedAt(activityDir),
    })
  }

  // Sort byActivity: subSpotCount DESC, stable secondary on slug ASC
  byActivity.sort((a, b) =>
    b.subSpotCount !== a.subSpotCount
      ? b.subSpotCount - a.subSpotCount
      : a.slug.localeCompare(b.slug),
  )

  // Global totals
  const allCountries = new Set<string>()
  for (const a of byActivity) for (const c of a.countries) allCountries.add(c)

  const pkgVersion = process.env.npm_package_version ?? "0.0.0"

  const stats: CatalogStats = {
    computedAt: new Date().toISOString(),
    catalogVersion: pkgVersion,
    totals: {
      activities: bases.length,
      subSpots: subSpots.length,
      clusters: clusters.length,
      regions: regions.length,
      countries: allCountries.size,
    },
    byActivity,
  }

  await mkdir("dist", { recursive: true })
  await writeFile("dist/catalog-stats.json", JSON.stringify(stats, null, 2))
  console.log(
    `Computed stats → dist/catalog-stats.json (${stats.totals.activities} activities, ` +
      `${stats.totals.subSpots} sub-spots, ${stats.totals.countries} countries)`,
  )
}

void main()
