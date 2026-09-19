# Community review improvements in 0.1.2

**[Version 0.1.2 is published](https://github.com/t1seo/marginote/releases/tag/0.1.2).** Source and candidate application verification passed, and the public release workflow issued and verified provenance for all three installation assets. Downloaded-application QA and the live Community review are recorded separately below.

## Findings reported for 0.1.1

The public scorecard showed three disclosures, three warning occurrences, and two other findings. The developer dashboard grouped the two CSS locations into one warning and the two missing attestations into one recommendation; those grouping counts are not the public occurrence counts.

| Finding | Candidate change | Verification boundary |
| --- | --- | --- |
| Runtime base64 encode/decode calls | Remove unused Zod codecs through supported Mini imports and explicit settings parsing | Production regression finds no `atob` or `btoa` calls; absent from the completed 0.1.2 live review |
| `text-decoration` compatibility, two locations | Use a dotted bottom border and suppress duplicate native underlines | Eight mode/theme/hover comparisons and four wrapped-selection checks pass in each host; absent from the completed second branch preview |
| Missing `getSettingDefinitions()` | Index both settings and share typed rendering/save behavior with the legacy panel | Thirteen Chrome DOM scenarios and nine actual 1.13.7 search/lifecycle/restart scenarios pass; absent from the completed first branch preview |
| Missing attestations for two release assets | Attest all three install assets in the public tag workflow, then verify the published downloads | Actual public workflow passed signing, emitted-bundle verification, and downloaded-asset verification for all three subjects |
| Malware scan unavailable | No plugin-side activation control found in the documented review flow | Still unavailable in the completed 0.1.2 scorecard; not counted as passed |
| Obfuscation scan unavailable | Recheck against the actual new release | The 0.1.2 service scan ran and passed: no obfuscation detected |

## Validation and bundle behavior

The previous bundle retained unused Zod codecs, the classic API, locale catalog, and schema conversion helpers. Mini alone was not enough: its catch helper retained the utility namespace containing unused codecs. Settings now explicitly parse each field and apply its existing fallback. No dependency internals, scanner rules, string spellings, or security checks were patched or suppressed.

Before conversion, characterization tests locked field-specific fallback, legacy-disabled precedence, UUID acceptance, title trimming/length/newlines, required text/image content, readonly drafts, and displayed validation errors. The same behavior passes afterward. Mini's internal error name is `$ZodError`; it remains an Error and its user-facing `issues` messages are preserved. The plugin still bundles Zod's full license notice. Obsidian, Electron, CodeMirror and Lezer remain external host modules.

The production-bundle test first failed on three `atob` calls and one `btoa` call, then passed with zero such calls after removing the unused functionality. English error messages that mention a base64 format are ordinary text and were not removed to influence the scanner.

The candidate full gate passed **308 tests / 376 Bun assertions**, Biome, strict TypeScript, production build, official Obsidian ESLint, and release validation. The settings browser regression passed 13 additional scenarios against real Chrome DOM with a narrow host substitute. These browser checks do not replace actual application tests.

## Settings compatibility

Obsidian 1.13+ receives two named definitions with searchable aliases. Custom render callbacks use the same dropdown choices, typed settings object, and save/refresh callback as the legacy panel. This avoids incorrectly binding to a separate `plugin.settings` object. Summary elements belong to their actual rendered row; registered refresh callbacks are released when that row is removed or the plugin unloads.

The legacy `display()` path remains available below 1.13. The existing minimum of Obsidian 1.10.6 and desktop-only support are unchanged. The former missing-definitions lint exception was removed. This follows the official [dual-support migration](https://docs.obsidian.md/plugins/guides/migrate-declarative-settings).

## Build provenance

The release workflow uses the SHA-pinned official [attestation action](https://github.com/actions/attest/blob/1e69f48acb82d1966a394da916b4c1698aa569d6/action.yml). Its additional OIDC and attestation permissions are scoped to the release job. The exact subjects are `main.js`, `manifest.json`, and `styles.css`.

Before publication, the workflow verifies the emitted attestation bundle. After publication, it downloads the three assets, compares them with the build, and verifies their public attestations against the repository, workflow, tag ref, source commit and signer commit. Self-hosted runner provenance is rejected. The attestation is stored through GitHub's API, so the release still has exactly three installation attachments. See [GitHub verification options](https://cli.github.com/manual/gh_attestation_verify).

Local actionlint, YAML/shell syntax, CLI-option checks and six isolated workflow shell scenarios passed. The actual [0.1.2 release workflow](https://github.com/t1seo/marginote/actions/runs/35437559634) subsequently passed signing, emitted-bundle verification, publication, byte comparison, and public attestation verification. The stable release was published on September 19, 2026 at 10:30:22 UTC.

The immutable public tag resolves to `339797a578a389f859dde2813c8c5c1d09adccf8`. Its [main-branch check](https://github.com/t1seo/marginote/actions/runs/35437519111) passed before publication. The release contains exactly these three assets:

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `main.js` | 73,647 | `5d301c339199b404c5722821a11ddee302cf9ea6f4bad1072c34c1da6395986c` |
| `manifest.json` | 268 | `ad2fe8d1d7b256320a033f4888bbf44b783a970eaebe437b034b7b3ec5e0e29c` |
| `styles.css` | 3,537 | `5aab003a56d510945c252c982dce8c97833548438e64363b5c399617fe477db7` |

Actual public downloads match both the reviewed build and GitHub's asset digests. Separate verification against GitHub's API and retained attestation bundles passed for all three originals. A scratch copy with exactly one changed byte was rejected; the unchanged original passed again afterward with the same bundle and identity policy. All eleven provenance checkpoints passed, including unchanged tag objects, source commits, asset IDs, digests, sizes and timestamps for 0.1.0 and 0.1.1.

The first local negative-control classifier incorrectly expected terminal-only progress text from the GitHub CLI. The real tampered file had already been rejected with exit code 1. An isolated failing-first regression and an actual terminal-output comparison corrected only that QA classifier; verification identity requirements were unchanged. Ten classifier regressions and the complete actual verification then passed. Both runs remain in the local evidence.

## Underline compatibility

The first branch preview for `e63704b` completed before publication. It no longer reported the missing settings API, but reported the same CSS feature at all eight longhand locations. Splitting the shorthand therefore did not resolve compatibility. That candidate was not released.

The replacement uses a CSS2 dotted bottom border on the outer anchor, with basic `text-decoration: none` on the anchor and nested editor text. A scoped hover selector overrides the host editor's more specific hover rule without `!important`. No CSS is hidden in JavaScript and no scanner rule is disabled. The eight modern-host mode/theme/hover comparisons preserve glyph and paragraph geometry, anchor width and wrapping; the inline anchor rectangle gains one border pixel. All four wrapped-text selections still match the original text, and the fixture is unchanged. The new affordance remains dotted, but does not claim an identical 4px decoration offset.

The second branch preview for `b303a65` completed with no CSS or settings-source warnings. This is a source preview; published-asset, build and provenance results still require the actual release review.

Two early comparison attempts crashed the isolated host renderer at a QA callback that returned an entire host `TFile` object to Playwright. Both notes were created with the expected bytes before the failure. Changing only that callback to await creation and return nothing, as the established QA helpers do, allowed the baseline comparison to finish. The native failure mechanism remains unestablished; failed runs are retained. The next comparison exposed and fixed the duplicate editor hover underline before passing all original assertions.

## Application, release and service checkpoints

The actual Obsidian 1.10.6 checks of the earlier candidate, before the border revision, passed: 66 maintained scenarios, four Reading pop-out checks, 22 proximity checks, fresh defaults, five validation-edge checks, three legacy-settings lifecycle groups, eight CSS comparisons, and 13 appearance checks plus an image fallback. Coverage overlaps across these groups. All 337 preceding content files retained their hashes, the three installed assets matched that candidate, and no runtime errors were collected. The previous plugin/settings backup and all newly created fixtures were preserved. The JavaScript and manifest are unchanged by the border revision.

The maintained scenarios were completed across the initial run and targeted remaining runs, not one uninterrupted pass. The first Live Preview pop-out image assertion timed out. Its fixture was later found to contain an unexpected Korean composition character, which also explained a subsequent exact-text locator failure. The origin of that input was not established. Both failures and the changed fixture remain preserved. The original image assertion passed with a new fixture and full event/ownership observations; the five original window scenarios then passed without weakening their assertions. This is a retained QA limitation, not an attributed product root cause.

Nine actual Obsidian 1.13.7 settings scenarios passed, including search before the first plugin-tab render, both dropdowns reached through alias search, immediate Reading View/Live Preview changes, stationary hover and Off, repeated teardown, disabling with settings open, failed-save Notice and unchanged disk bytes, native Settings-window closure, and persistence after a full process restart. No runtime errors were collected. The original cards/nearby preferences were restored.

The newer host opens Settings in a separate native window and creates an additional hidden measuring select for each dropdown. The QA driver was corrected to follow that real window and count only user controls; its earlier scope/count failures remain in the local record. A workspace pop-out can close while the separate Settings window remains alive; its two active refresh callbacks are then expected. Closing the Settings window released both callbacks and invoked the matching disposers in both tested repetitions. This verifies normal window closure, not abrupt process termination or a complete heap audit.

The modern host also passed the original 22 proximity assertions in both modes, eight underline checks, and four Reading pop-out checks before the border revision. Its QA adapter targets the separate Settings window and waits for the long Reading View fixture's initial layout before scrolling to the anchor. The initial layout timeout was retained; product assertions were unchanged. The official signed Obsidian 1.13.7 test app runs separately from the installed application and the preserved 1.10.6 test profile. Its downloaded SHA-256 and code signature were verified; the temporary read-only disk image mount was removed.

After the final border revision, both hosts passed eight style/geometry groups, four wrapped-selection checks, the original 22 proximity assertions, and four Reading pop-out assertions. The legacy run preserved all 380 preceding content files and left 389 content files including new fixtures. Installed JavaScript, manifest and CSS matched the frozen candidate. No runtime errors were collected in the final runs.

The legacy repeat also exposed the same initial-layout race in the QA driver. Its maintained helper now waits for the long fixture to finish layout before calculating the midpoint; the product assertions are unchanged. A subsequent run passed 21 of 22 assertions: the Live Preview card disappeared at one of 17 continuous-path samples, with its stored pointer cleared. The initial cause remains unestablished. The identical fixture passed the unchanged directional assertions with temporary event/call tracing, and the complete final 22-assertion run passed after the tracing was removed. The earlier failure is retained and is not described as a confirmed product fix.

Actual downloaded-asset application checks also finished: fresh defaults, 66 maintained checks, four Reading pop-out checks, 22 proximity checks, eight runtime-CSS groups and four wrapped selections passed across initial and targeted remaining runs. All 389 preceding content files and the old plugin/settings backup were preserved; the final vault held 414 files. No runtime errors were collected. This was not an uninterrupted passing run.

The downloaded run had a separate Live Preview pop-out image timeout while both fixture files remained unchanged. Repeating the same IME/content sequence under tracing and the original five window assertions without tracing passed on that fixture. Its initial cause remains unestablished; the earlier altered-alias incident does not explain it. An initially missing host renderer was recovered by restarting only the recorded QA process with all files unchanged; the loss cause is also unknown. The CSS comparison's 32.5px absolute-position difference was reproduced and reversed by changing only the editor scroll position. The final setup restores baseline scroll before applying the original assertions. See [downloaded application QA](downloaded-app-qa.md#current-release-012) for these retained limits.

The live Community review completed for 0.1.2 / `339797a`. Its public scorecard shows eight passes, no warnings or other findings, and one disclosure: malware scanning is unavailable. The runtime-codec disclosure, CSS/settings warnings and missing-attestation findings are gone. Obfuscation scanning passed and the independent build reproduced main.js byte-for-byte. Normal portal reload confirmed the completed result after an older open page still displayed Pending.

The native directory returns Marginote and its normal Install/Enable flow installed 0.1.2. The host adds its standard source-map marker to main.js; original release bytes and the exact appended comment were verified separately. All 22 proximity and four Reading pop-out smoke checks passed against that installation. The enabled-plugin list, 414 prior content files and old plugin/data backup remained unchanged; the final vault contains 416 files including new fixtures. All probes and pop-outs were removed, the English demo restored, and the recorded QA process and children stopped. The debugging endpoint is closed and the excluded personal instance remains running. See [native installation QA](downloaded-app-qa.md#native-directory-installation-012).

Existing 0.1.0/0.1.1 tags and assets remain immutable. The English interaction recording is still explicitly identified as a 0.1.1 recording; it has not been relabeled as a new capture.

An unavailable scanner is not evidence that malicious code was found, nor is it a passing scan. The [Community management guide](https://docs.obsidian.md/community-directory/manage-entry) documents branch previews, new-release checks and review requests, but no maintainer switch for the remaining unavailable malware scan. The actual final scorecard is recorded in [submission status](submission.md).
