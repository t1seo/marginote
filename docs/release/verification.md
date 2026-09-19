# Release verification

Release candidate: **Marginote 0.1.0**. Verification date: September 19, 2026.

The final local build passes the automated release gate and all 66 independent application scenarios. Publication, downloaded-asset testing, and Community submission are recorded separately when they occur.

## Automated checks

| Check | Observed result |
| --- | --- |
| `bun install --frozen-lockfile` | Passed; lockfile unchanged |
| `bun run check:release` | Passed: Biome, 275 tests across 22 files, strict TypeScript 7.0.2, build, official Obsidian lint, and release validation |
| Official Obsidian ESLint | Zero errors and warnings; the minimum-version settings API exception is explained in [compliance](compliance.md) |
| Release validation | Version, exact tag format, host-module boundary, complete license notices, nonempty assets, and byte identity checked |
| Public export regressions | Seven tests passed, including committed content only, private inventory rejection, symlink rejection, and existing destination preservation |
| Production dependency audit | No runtime dependency vulnerabilities reported at the compliance checkpoint |

The test runner reports 325 Bun `expect()` calls; the seven export tests additionally use Node assertions. Test count and assertion count are not interchangeable.

## Actual application and media

The isolated application is desktop Obsidian 1.10.6 on macOS, using Electron 37.10.2 and Chromium 138.0.7204.251. The application uses a separate profile and vault; personal vaults and the original reference project are excluded.

- [Application regression record](app-qa.md): current scenario results, view/window lifecycle, source preservation, and test-harness findings.
- [English demo verification](demo-qa.md): 24.416667-second real recording, 2.27 MB GIF, five 1200×800 listing screenshots, English UI/sample, and state restoration.
- [Icon provenance](../../assets/brand/README.md): original generated product mark, inspected at 32/64/128 pixels on light and dark surfaces.

The public Markdown inventory has no broken relative links, private-repository links, personal absolute paths, or Korean presentation text. Unicode input regression fixtures remain intentional.

## Candidate asset identity

| Asset | SHA-256 |
| --- | --- |
| `main.js` | `d6b570084aba3fce81c7bdf6b460624e14481324fd9e03dbd015647f5855a4d0` |
| `manifest.json` | `e554d8b3d16a8742bb848253cdd716a9f2690a08219db445234094141bd37594` |
| `styles.css` | `7aaec227bd5a3e1069419300f2e7c1cefdaeaa237e257afd315509a0a432cfd1` |

These are locally verified candidate hashes. A release download is not claimed verified until its bytes have been compared and installed in the isolated application.

## Publication checkpoints

| Stage | Observed state |
| --- | --- |
| Final independent application QA | 66 scenarios passed; zero collected application errors; 194 existing content files unchanged |
| New public source history and CI | Pending publication |
| GitHub release and downloaded assets | Pending publication |
| Community submission and installation | See [submission status](submission.md) |
| Final isolated-process cleanup | Pending completion of application testing |

## Limits

Physical mobile devices, physical touch, operating-system IME candidate selection, all community themes, all older Obsidian versions, and comprehensive screen-reader/WCAG certification are not verified. Automated Chromium touch/composition checks are identified as such. GitHub release publication, Community scanner results, and installation availability are separate observations.
