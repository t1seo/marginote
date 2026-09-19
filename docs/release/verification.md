# Release verification

**[Marginote 0.1.1 is published](https://github.com/t1seo/marginote/releases/tag/0.1.1). Candidate and actual downloaded-application QA passed. The Community review is complete and the listing is public; its two warnings, one recommendation, and native installation checkpoint are recorded separately.** Verification date: September 19, 2026.

This patch restores pointer-following proximity previews as the fresh-install default, preserves their pointer across scrolling and editor virtualization, and fixes Reading View links adopted into a pop-out window. Saved trigger choices remain intact. The new English demonstration shows activation to the left, below, and right in Reading View and Live Preview.

The published [0.1.0 release](https://github.com/t1seo/marginote/releases/tag/0.1.0) retains its original tag and assets. Its additional Reading pop-out failures are preserved in [downloaded-asset QA](downloaded-app-qa.md); they are not overwritten by the corrected candidate's results.

## Automated checks

| Check | Observed result |
| --- | --- |
| `bun run check:release` | Passed: Biome, 276 tests across 22 files, strict TypeScript 7.0.2, build, official Obsidian lint, and release validation |
| Official Obsidian ESLint | Zero errors and warnings; the minimum-version settings API exception is explained in [compliance](compliance.md) |
| Proximity browser regression | 19 Chrome DOM checks passed; the same set against the previous committed UI had seven failures |
| Reading adoption browser regression | Nine real DOM/MutationObserver checks passed after the failing-first result |
| Public export regressions | Seven tests passed, including committed content only, private inventory rejection, symlink rejection, and existing destination preservation |
| Release validation | Version, exact tag format, host-module boundary, complete license notices, and nonempty assets checked; all three published/downloaded assets match the reviewed build |
| Dependencies | Lockfile unchanged by 0.1.1; no runtime dependency vulnerabilities reported at the compliance checkpoint |

The test runner reports 326 Bun `expect()` calls; the seven export tests additionally use Node assertions. Browser checks and application checks are separate from this unit-test count.

## Actual application and media

The isolated application is desktop Obsidian 1.10.6 on macOS, using Electron 37.10.2 and Chromium 138.0.7204.251. It uses a separate profile and vault; personal vaults and the original reference project are excluded.

| Final candidate application group | Result |
| --- | --- |
| Maintained suite, Reading pop-out regression, fresh-install defaults, and active-pop-out disable | 72 passed |
| Proximity, pointer following, stationary-pointer scrolling, selection, and Escape | 14 passed |
| Three-direction cold activation and continuous paths in both modes | Eight passed |
| Additional pane/pop-out boundaries | Four passed |
| Observer and empty-controller cleanup | Three passed |

All 277 pre-existing content files retained their hashes, installed assets matched the candidate, and no runtime errors were collected. The groups overlap in behavioral coverage; their counts are not independent feature counts. The earlier undetermined stationary-hover failure is retained, and the same 31-second assertion passed in the complete final run. See [proximity correction](proximity-qa.md), [application record](app-qa.md), and [independent review](review.md).

The real English demo is a 38.6-second, 960×640 GIF (4,060,784 bytes) and a 38.583333-second, 1200×800 MP4. It includes both view modes, three-direction pointer following, text/image/mixed cards, ordinary-note settings, and varied Lorem ipsum scrolling passages. Temporary cursor/caption aids are disclosed; captions do not overlap the card or anchor. Five clean 1200×800 listing screenshots and the [original icon](../../assets/brand/README.md) are included. See [demo verification](demo-qa.md) for capture, visual review, decoding, and restoration evidence.

Public Markdown is English. Intentional Unicode input regression fixtures remain. The allowlist and link checks exclude private history, reference screenshots, personal paths, authentication data, and private-repository links.

## Published asset identity

| Asset | SHA-256 |
| --- | --- |
| `main.js` | `6eaf6a2b283f6792029a37386e8d988ab5ab44cbb76c94fbd6b382da66a8193c` |
| `manifest.json` | `1ff0b8b26214e1ae126e956fad38599e4de65f272fad87ff00770245b7e0b41e` |
| `styles.css` | `7aaec227bd5a3e1069419300f2e7c1cefdaeaa237e257afd315509a0a432cfd1` |

All three actual GitHub downloads match these local candidate hashes, the build from tagged public source, and GitHub’s SHA-256 asset digests. `bun run validate:release --tag 0.1.1 --assets <download-directory>` passed. The stable release was published on September 19, 2026 at 06:21:02 UTC with exactly these three assets. Its tag resolves to `21ed246ae5748d175d3fc662c99b01b646baf5b0`. Actual fresh-install application QA against those downloaded bytes also passed: 72 base checks, 22 integrated proximity checks, four additional window boundaries, and three observer/lifecycle checks. All 313 preceding content files and plugin/settings backups were preserved, with zero runtime errors. See [downloaded application QA](downloaded-app-qa.md#current-release-011).

## Publication checkpoints

| Stage | Observed state |
| --- | --- |
| Final local application QA | Passed as detailed above |
| Final media review | Passed independent visual inspection, full decode, and representative-frame identity checks |
| Public 0.1.1 source and CI | `21ed246ae5748d175d3fc662c99b01b646baf5b0`; [Check passed](https://github.com/t1seo/marginote/actions/runs/35426317703); 171-file committed export and independent history audited |
| GitHub 0.1.1 release and downloaded assets | [Release workflow passed](https://github.com/t1seo/marginote/actions/runs/35426347943); three downloads and GitHub digests match the reviewed build |
| Community submission and installation | [Public listing](https://community.obsidian.md/plugins/marginote) published; review complete with zero blocking errors and byte-for-byte build reproduction. Native installation remains unverified because in-app search returned no result. See [submission status](submission.md) |
| Final isolated-process cleanup | Passed: the recorded QA process and all recorded children stopped; its debugging endpoint closed; the excluded personal Obsidian instance remained running; vault and backups preserved |

The public repository has independent history rooted at `4c74448a8a80b00ee2427affaef7c36dcfb578b7`. Its initial [Check](https://github.com/t1seo/marginote/actions/runs/35422279462) and [0.1.0 release workflow](https://github.com/t1seo/marginote/actions/runs/35422326882) passed. Those historical results are not a substitute for verification of 0.1.1.

## Limits

Physical mobile devices, physical touch, operating-system IME candidate selection, all community themes, all older Obsidian versions, and comprehensive screen-reader/WCAG certification are not verified. Automated Chromium touch/composition checks are identified as such. GitHub publication, Community scanner results, submission acceptance, and installation availability are separate observations.

The native directory search returned no Marginote result in three attempts, including two normal modal reopenings, through 06:43:19 UTC. Its installed-only filter was off, and a control search worked. The public legacy registry also lacked the entry when checked at 06:42:01 UTC. The reason and availability timing are undetermined; no native directory installation or subsequent installation smoke test is claimed. The actual GitHub download installation passed the 101 checks above. Existing plugin/settings files and all 337 content files remained intact during the directory check.
