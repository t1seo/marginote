# Release verification

**[Marginote 0.1.2 is published](https://github.com/t1seo/marginote/releases/tag/0.1.2), its Community review is complete, and native-directory installation passed.** Verified on September 19, 2026. The source gate, candidate application checks on Obsidian 1.10.6 and 1.13.7, and actual public provenance verification passed. Final downloaded-application checks passed across initial and targeted runs; earlier intermittent failures remain documented with their limits.

This patch removes unused runtime codecs, adds searchable settings on Obsidian 1.13+, uses compatible dotted borders for link underlines, and signs all three installation assets. The left/below/right proximity behavior introduced in 0.1.1 remains covered in both Reading View and Live Preview. Saved preview choices remain intact. See the [detailed 0.1.2 record](community-review-0.1.2.md).

## Executed checks

| Check | Observed result |
| --- | --- |
| `bun run check:release` | Passed: Biome, 308 tests across 25 files, strict TypeScript 7.0.2, build, official Obsidian ESLint, release validation |
| Official Obsidian ESLint | Zero errors and warnings; the old missing-settings-definitions exception is removed |
| Production codecs regression | Failed first with three `atob` and one `btoa` calls; passes with zero runtime codec calls |
| Settings browser regression | 13 real Chrome DOM scenarios passed; narrow host substitute, separate from application QA |
| Obsidian 1.10.6 candidate | 66 maintained scenarios, fresh defaults, five validation-edge checks, three legacy-settings groups, 13 appearance checks and image fallback passed |
| Obsidian 1.13.7 settings | Nine actual search, update, failure, teardown and full-process restart scenarios passed |
| Final CSS in each host | Eight mode/theme/hover geometry groups and four wrapped-selection checks passed |
| Final proximity in each host | Original 22 assertions passed, including three directions, pointer following and stationary scrolling in both modes |
| Reading pop-out in each host | Four original ownership, Escape, outside-click and hover assertions passed |
| Public provenance | Eleven checkpoints passed: exact release identity, three API verifications, three retained-bundle verifications, one-byte tamper rejection, and unchanged older releases |
| Actual GitHub download on 1.10.6 | Fresh defaults, 66 maintained checks, four Reading pop-out checks, 22 proximity checks, eight CSS groups and four wrapped selections passed across initial/targeted runs |
| Native-directory installation on 1.10.6 | Normal Install/Enable, verified host-added comment, fresh defaults, 22 proximity and four Reading pop-out smoke checks passed |

The Bun runner reports 376 `expect()` calls; Node assertions are additional. Application and browser groups overlap in behavior and are not independent feature counts. The legacy maintained suite completed across the initial and targeted remaining runs. Earlier failures, including an undetermined continuous-path sample and native-host failures in the QA harness, are preserved in the [detailed record](community-review-0.1.2.md#application-release-and-service-checkpoints).

Both application hosts use an isolated test vault and profile. The newer signed official application runs separately from the installed Obsidian application. No personal vault or original reference project was used or changed.

## Published asset identity

Published at **10:30:22 UTC**, with exactly three installation attachments. Tag `0.1.2` resolves to **`339797a578a389f859dde2813c8c5c1d09adccf8`**.

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `main.js` | 73,647 | `5d301c339199b404c5722821a11ddee302cf9ea6f4bad1072c34c1da6395986c` |
| `manifest.json` | 268 | `ad2fe8d1d7b256320a033f4888bbf44b783a970eaebe437b034b7b3ec5e0e29c` |
| `styles.css` | 3,537 | `5aab003a56d510945c252c982dce8c97833548438e64363b5c399617fe477db7` |

All three actual GitHub downloads match the reviewed build and GitHub's asset digests. Attestation verification restricts the repository, workflow, tag ref, source commit, signer commit and hosted-runner identity. A one-byte scratch modification failed with the retained legitimate bundle; the unmodified original passed again afterward. The 0.1.0 and 0.1.1 tag objects, commits, asset IDs, digests, sizes and timestamps remain unchanged.

The [source check](https://github.com/t1seo/marginote/actions/runs/35437519111) and [release workflow](https://github.com/t1seo/marginote/actions/runs/35437559634) passed. The public repository retains independent history rooted at `4c74448a8a80b00ee2427affaef7c36dcfb578b7`; private history and reference media are excluded.

## Community and installation

The [public Community page](https://community.obsidian.md/plugins/marginote) responds without authentication and shows 0.1.2. Its completed scorecard has eight passes, no warnings or other findings, and one malware-scan-unavailability disclosure. CSS, settings, base64 and missing-attestation findings are absent; obfuscation and independent byte-for-byte build reproduction passed. Malware scanning is not counted as passed. See [submission status](submission.md) for the actual management-screen and native-installation observations. Automated review does not imply manual staff approval.

The [downloaded application record](downloaded-app-qa.md) distinguishes a GitHub download installation from native-directory installation. Obsidian adds an exact 18-byte source-map comment to the latter's main.js; the signed original and installed hash are verified separately. The downloaded run preserved 389 preceding content files; the later native run preserved 414 and left 416 including new fixtures. All plugin/data backups remain intact.

Only recorded QA processes and children were stopped. Their debugging endpoint is closed, the temporary disk-image mount is gone, and the excluded personal Obsidian process remained running. The preserved test scene is the English Demo 8 at the top in Reading View with cards / nearby.

## English presentation and limits

The README, sample vault, listing copy and public Markdown are English. The sample uses varied Lorem ipsum passages. The original icon, five clean listing images, 38.6-second GIF and 38.583333-second MP4 remain available. The recording is explicitly a **0.1.1 capture**, not a new 0.1.2 recording. See [demo verification](demo-qa.md).

Physical mobile devices, physical touch, operating-system IME candidate selection, all community themes, all older Obsidian versions and comprehensive screen-reader/WCAG certification are unverified. Automated Chromium touch/composition checks are identified as such. An unavailable malware scan is neither a passing scan nor a malware finding.

One downloaded-run Live Preview pop-out image wait timed out with unchanged source. The same fixture and unchanged assertions subsequently passed, with and without tracing; its initial cause is unknown. This is separate from the earlier altered-alias candidate incident. No product fix or uninterrupted all-green run is claimed for that timeout. The [detailed downloaded record](downloaded-app-qa.md#current-release-012) also preserves the recovered host-target loss and the controlled scroll-position comparison.

The [historical 0.1.1 checkpoint](verification-0.1.1.md) preserves earlier counts, hashes, review findings and the then-unavailable native-directory search. Immutable 0.1.0 failures remain in [downloaded application QA](downloaded-app-qa.md#historical-release-010).
