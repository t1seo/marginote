# Release verification

**Marginote 0.1.1: local candidate checks passed; publication, downloaded-asset QA, and Community submission are pending.** Verification date: September 19, 2026.

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
| Release validation | Version, exact tag format, host-module boundary, complete license notices, and nonempty assets checked; published-byte identity is still pending |
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

## Candidate asset identity

| Asset | SHA-256 |
| --- | --- |
| `main.js` | `6eaf6a2b283f6792029a37386e8d988ab5ab44cbb76c94fbd6b382da66a8193c` |
| `manifest.json` | `1ff0b8b26214e1ae126e956fad38599e4de65f272fad87ff00770245b7e0b41e` |
| `styles.css` | `7aaec227bd5a3e1069419300f2e7c1cefdaeaa237e257afd315509a0a432cfd1` |

These are the local candidate and installed-candidate hashes. They do not yet establish the identity of a public 0.1.1 download. The release workflow, tag, downloaded files, and fresh installation must be checked separately before Community submission.

## Publication checkpoints

| Stage | Observed state |
| --- | --- |
| Final local application QA | Passed as detailed above |
| Final media review | Passed independent visual inspection, full decode, and representative-frame identity checks |
| Public 0.1.1 source and CI | Pending reviewed export and push |
| GitHub 0.1.1 release and downloaded assets | Pending |
| Community submission and installation | Authenticated form prepared; not submitted. See [submission status](submission.md) |
| Final isolated-process cleanup | Pending completion of downloaded application testing |

The public repository has independent history rooted at `4c74448a8a80b00ee2427affaef7c36dcfb578b7`. Its initial [Check](https://github.com/t1seo/marginote/actions/runs/35422279462) and [0.1.0 release workflow](https://github.com/t1seo/marginote/actions/runs/35422326882) passed. Those historical results are not a substitute for verification of 0.1.1.

## Limits

Physical mobile devices, physical touch, operating-system IME candidate selection, all community themes, all older Obsidian versions, and comprehensive screen-reader/WCAG certification are not verified. Automated Chromium touch/composition checks are identified as such. GitHub publication, Community scanner results, submission acceptance, and installation availability are separate observations.
