# Independent release review

## Current correction: 0.1.1

**Preparation verdict: PASS / HIGH.** Five independent perspectives reviewed the frozen 0.1.1 candidate, including the [proximity correction](proximity-qa.md), complete application QA, and the corrected English recording. This approves release preparation; public 0.1.1 publication, downloaded-byte QA, and Community submission still require their own evidence.

| Perspective | Verdict | Final evidence |
| --- | --- | --- |
| Goal and constraints | PASS / HIGH | Both modes, left/below/right activation and following, saved preferences, source preservation, complete English media |
| Code quality | PASS / HIGH | Pointer lifecycle, owner identity, Reading adoption, suppression before any card opens, 19 proximity browser checks |
| Security and privacy | PASS | Window-local pointer state, no new network or file access, existing data preservation; final committed export audit follows |
| Hands-on application QA | PASS / HIGH | 72 base checks + 14 proximity + eight direction + four boundary + three observer checks, zero runtime errors; coverage overlaps |
| Repository context | PASS / HIGH | Current authorization, English/public-link boundaries, historical failures and pending publication stages clearly separated |

The final source gate passed 276 tests and 326 Bun assertions. Candidate bundle SHA-256: `6eaf6a2b283f6792029a37386e8d988ab5ab44cbb76c94fbd6b382da66a8193c`. The unchanged 31-second hover assertion passed in the complete run; its earlier undetermined failure remains recorded.

Independent media review opened 13 MP4 frames, eight GIF frames, the poster, and five listing PNGs. Both media decoded fully; the 21 extracted video/GIF images matched their decoded frame hashes. The 38.6-second GIF shows all six directional samples with the complete mixed-card body visible. The earlier caption overlap was corrected in the recording aid without changing product code. See [demo QA](demo-qa.md).

### Reading adoption checkpoint before proximity changes

The later [downloaded 0.1.0 application review](downloaded-app-qa.md) reproduced four Reading view pop-out failures and supersedes the earlier passing gate below. Community submission is held until the correction and its published assets pass verification.

That 0.1.1 candidate rebinds Reading view sections when their owner document changes, with one observer per document and cleanup on window closure or plugin unload. Independent code-quality and security reviews passed at that checkpoint. The 275-test release gate and nine browser DOM/lifecycle checks passed, and all four previously failing behaviors passed in real Obsidian with that candidate. The wider run stopped with one undetermined hover-persistence failure; [the partial record](patch-qa.md) preserves its exact result. Complete verification of the later candidate and published download is still required.

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
