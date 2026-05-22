# Security Policy

## Scope

This repository is a **data catalog**: YAML files describing how outdoor
activity suitability scores are computed from weather inputs. It is
distributed as an npm package (`@goable-io/profiles-catalog`) consumed
by the proprietary Goable scoring engine and any third party who wants
to read the catalog.

What's in-scope for security reports:

- **Supply-chain integrity** — published artifacts on npm/GitHub
  Releases not matching the source tree at the tagged commit
- **Validation bypass** — YAML that passes `pnpm validate` but
  violates documented invariants (weight sum, calibration gate)
- **Schema injection** — Zod schema accepting profile fields it
  shouldn't (e.g. allowing external `calibrated` maturity without a
  `meta.calibration` block)
- **Repo / CI** — workflow secrets leakage, malicious tag/push paths

What's out of scope:

- Disagreements over curve values or thresholds — those go through the
  normal PR process described in `CONTRIBUTING.md`
- Generic dependency CVEs without a working exploit path against this
  package — open a normal issue with the `dependencies` label

## Reporting

Email `contact@fabio-carucci.com` with subject `[security] profiles-catalog`.
Please include:

- Affected version (`@goable-io/profiles-catalog@x.y.z`) and / or commit SHA
- Reproduction steps or PoC
- Suggested fix if you have one

You can expect:

- Acknowledgment within **5 business days**
- A fix or a public disclosure plan within **30 days** for confirmed issues
- Credit in the release notes if you want it

Please **don't** open a public GitHub issue or PR for unpatched
vulnerabilities. Use email or the GitHub Security Advisories
"Report a vulnerability" button on this repository.

## Supported versions

Only the latest published minor on npm receives fixes. The catalog
ships patch releases automatically on every merge to `main` (see
`.github/workflows/release.yml`); security fixes follow the same path
and are tagged.
