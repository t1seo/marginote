# Independent release review

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

This review does not certify untested physical devices, operating-system IMEs, every host version/theme, or comprehensive accessibility. It does not turn a prepared Community form into a submission receipt.
