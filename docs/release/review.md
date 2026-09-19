# Independent release review

## Current release: 0.1.2

**PASS for the verified release and installation scope.** Five independent perspectives reviewed the 0.1.2 changes, frozen assets, completed Community scorecard, actual downloaded-application results, native installation and final cleanup. No release-blocking finding remains in that scope. The code-quality review retains medium confidence because the initial intermittent Live Preview failures have no confirmed root cause. Final documentation commits are separate from the immutable release source.

| Perspective | Verdict | Evidence checked |
| --- | --- | --- |
| Goal and constraints | PASS / HIGH | English media and samples, both-mode proximity, settings, published source/tag/assets, native Install/Enable, data and process preservation |
| Code quality | PASS / MEDIUM | Validation contracts, document ownership, asynchronous cancellation, unchanged application assertions, controlled CSS geometry and scroll comparison |
| Security and privacy | PASS | Three original asset attestations, tamper rejection, independent public history and allowlist, exact native host transformation, backup and content preservation |
| Hands-on application QA | PASS / HIGH for the recorded evidence | Actual downloads, native 22 proximity plus four Reading pop-out checks, installed-file identity, English screenshots, preserved failures and cleanup |
| Repository context | PASS / HIGH | Source/release CI, immutable earlier releases, 181-file English public inventory, local links and separation of current and historical records |

The final source gate passed 308 tests / 376 Bun assertions, strict TypeScript, Biome, official Obsidian ESLint, production build and release validation. Public release source remains `339797a578a389f859dde2813c8c5c1d09adccf8`; original main.js SHA-256 is `5d301c339199b404c5722821a11ddee302cf9ea6f4bad1072c34c1da6395986c`. Original release files, GitHub digests, API attestations and retained bundles agree. A modified scratch file was rejected, and the original passed again.

The native installer appends exactly `\n/* nosourcemap */` to main.js. Independent reviewers compared the full installed file with the signed original plus those 18 bytes; manifest and CSS are unchanged. The post-smoke check uses the separately verified installed hashes. Existing content files, previous installation backups and the enabled-plugin list remained intact. All recorded QA processes stopped, the endpoint closed, and the personal application was preserved.

The Community review completed with eight passes, zero warnings, zero other findings and one unavailable-malware-scan disclosure. The management screen, public scorecard and native installation support that result; one reviewer's separate anonymous request returned HTTP 403 and is not reported as another successful fetch. Automated review is not manual staff approval or a comprehensive security certification.

The initial downloaded-run Live Preview image timeout occurred with unchanged fixture bytes. Its original window assertions passed in a same-fixture rerun, both with and without tracing. The cause remains unknown; this review does not claim that a product defect was diagnosed or repaired, or that every suite passed uninterrupted. The earlier continuous-path failure and distinct altered-alias candidate incident are also retained. See [downloaded application QA](downloaded-app-qa.md#current-release-012), [the 0.1.2 record](community-review-0.1.2.md) and [release verification](verification.md) for exact coverage and limits.

Two final documentation findings were corrected: the 0.1.0 candidate banner now describes its later correction in the past tense, and the historical 0.1.1 installation link points to its archived checkpoint. The existing English icon, sample, listing images and demo passed prior visual review and remain unchanged; the demo still identifies its 0.1.1 capture version.

## Historical correction: 0.1.1

**Preparation verdict: PASS / HIGH.** Five independent perspectives reviewed the frozen 0.1.1 candidate, including the [proximity correction](proximity-qa.md), complete application QA, and the corrected English recording. This approves release preparation; publication, downloaded-byte QA, and Community submission are recorded separately as they occur.

| Perspective | Verdict | Final evidence |
| --- | --- | --- |
| Goal and constraints | PASS / HIGH | Both modes, left/below/right activation and following, saved preferences, source preservation, complete English media |
| Code quality | PASS / HIGH | Pointer lifecycle, owner identity, Reading adoption, suppression before any card opens, 19 proximity browser checks |
| Security and privacy | PASS | Window-local pointer state, no new network or file access, existing data preservation; final 171-file committed export and independent public history audited |
| Hands-on application QA | PASS / HIGH | 72 base checks + 14 proximity + eight direction + four boundary + three observer checks, zero runtime errors; coverage overlaps |
| Repository context | PASS / HIGH | Current authorization, English/public-link boundaries, historical failures and pending publication stages clearly separated |

The final source gate passed 276 tests and 326 Bun assertions. Candidate bundle SHA-256: `6eaf6a2b283f6792029a37386e8d988ab5ab44cbb76c94fbd6b382da66a8193c`. The unchanged 31-second hover assertion passed in the complete run; its earlier undetermined failure remains recorded.

Independent media review opened 13 MP4 frames, eight GIF frames, the poster, and five listing PNGs. Both media decoded fully; the 21 extracted video/GIF images matched their decoded frame hashes. The 38.6-second GIF shows all six directional samples with the complete mixed-card body visible. The earlier caption overlap was corrected in the recording aid without changing product code. See [demo QA](demo-qa.md).

### Final delivery audit

**PASS / HIGH for the completed delivery stages.** An independent reviewer verified the public 0.1.1 tag, successful source/release workflows, all three asset digests, the actual downloaded application's 101-check evidence, and preservation of its 313 preceding content files. The reviewer also fetched the public Community listing without authentication and visually inspected all five delivered gallery images. The original GIF remained animated in the README-derived Overview.

The Community scan had zero blocking errors, two warnings, and one recommendation, described in the [historical submission status](submission-0.1.1.md). A separate hands-on reviewer could not find Marginote in the native Obsidian 1.10.6 directory after three normal searches; that installation path remained unverified at this checkpoint. The successful GitHub download installation was not counted as a native-directory install. Final teardown stopped only recorded QA processes and retained the vault, backups, and personal Obsidian instance. This limitation did not invalidate the completed release checks, and was not reported as a passing installation check.

### Reading adoption checkpoint before proximity changes

The later [downloaded 0.1.0 application review](downloaded-app-qa.md#historical-release-010) reproduced four Reading view pop-out failures and superseded the earlier passing gate below. At that checkpoint, Community submission was held until the correction and its published assets passed verification.

That 0.1.1 candidate rebinds Reading view sections when their owner document changes, with one observer per document and cleanup on window closure or plugin unload. Independent code-quality and security reviews passed at that checkpoint. The 275-test release gate and nine browser DOM/lifecycle checks passed, and all four previously failing behaviors passed in real Obsidian with that candidate. The wider run stopped with one undetermined hover-persistence failure; [the partial record](patch-qa.md) preserves its exact result. At that checkpoint, complete candidate and downloaded-asset verification remained outstanding.

## Historical 0.1.0 preparation review

Date: September 19, 2026. Candidate: Marginote 0.1.0.

**Pre-publication verdict: PASS.** Five independent review perspectives found no unresolved release-preparation blocker. This gate covers the candidate and its publication preparation; remote publication and Community states are recorded in [verification](verification.md) and [submission status](submission.md).

| Perspective | Verdict | Evidence checked |
| --- | --- | --- |
| Goal and constraints | PASS / HIGH | English documentation/sample/media, original icon, implemented interactions, source preservation, and honest compatibility scope |
| Code quality | PASS / HIGH | DOM ownership, component cleanup, strict types, release validator/workflows, and committed-tree export |
| Security and privacy | PASS | Public allowlist, no private history or references, no personal paths/credentials in the candidate inventory, dependency/license boundaries |
| Hands-on application QA | PASS / HIGH | 66 fresh scenarios, zero collected errors, unchanged installed assets and 194 existing content files; independent English media inspection |
| Repository context | PASS / HIGH | Current release authorization, original source remaining read-only, English links/metadata, and current official web-submission requirements |

The final automated gate passed 275 tests, strict TypeScript, Biome, official Obsidian lint, production build, and release validation. The verified bundle SHA-256 is `d6b570084aba3fce81c7bdf6b460624e14481324fd9e03dbd015647f5855a4d0`.

The first lifecycle run exposed a test precondition issue: Obsidian's native Page preview temporarily added three window listeners. Controlled runtime registration/removal evidence identified the host callbacks. The test now waits for the same closed-popover state before comparison; it excludes no additional listener. All 66 scenarios passed after that correction. See [the full application record](app-qa.md).

The reviewers also inspected the original icon on light/dark backgrounds, all five listing PNGs, sampled MP4/GIF scenes, output dimensions, and complete media decoding. The demonstration is actual Obsidian input and capture, with disclosed temporary cursor/caption aids.

## English reading-fixture follow-up

The visible QA reading page and its basic linked notes were translated to English, and varied Lorem ipsum paragraphs replaced repeated numbered filler. An independent review of the affected QA modules passed. Card metadata, duplicate aliases, heading/block references, and selection-test intent are preserved. The fixture helper still creates files with exclusive `wx` writes; the explicit migration helper only returns the nine approved file contents and does not write them automatically.

The review found one stale mixed-card text assertion, which was updated to match the new English card before application verification. Product source and the published plugin assets are unchanged. Revised demo inspection and the downloaded-application results are recorded separately in [demo QA](demo-qa.md) and [downloaded release QA](downloaded-app-qa.md).

The longer page also exposed a test precondition: at 360 pixels, Obsidian had not rendered a reference near the bottom until the document was scrolled. A runtime trace confirmed the link appeared after scrolling and its card passed the geometry checks. The appearance harness now scrolls to render the reference before clicking it; all twelve theme/width/zoom combinations, the internal-scroll scenario, and missing-image fallback passed. Independent review confirmed that no existing assertion was removed or weakened.

This review does not certify untested physical devices, operating-system IMEs, every host version/theme, or comprehensive accessibility. It does not turn a prepared Community form into a submission receipt.
