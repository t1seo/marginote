# Community review improvements in 0.1.2

**Candidate verification is in progress. Version 0.1.2 has not been published or rescanned yet.** This record separates code changes, executed tests, signed release provenance, and the live Community result.

## Findings reported for 0.1.1

The public scorecard showed three disclosures, three warning occurrences, and two other findings. The developer dashboard grouped the two CSS locations into one warning and the two missing attestations into one recommendation; those grouping counts are not the public occurrence counts.

| Finding | Candidate change | Verification boundary |
| --- | --- | --- |
| Runtime base64 encode/decode calls | Remove unused Zod codecs through supported Mini imports and explicit settings parsing | The production-bundle regression finds no `atob` or `btoa` calls; live rescan pending |
| `text-decoration` compatibility, two locations | Use equivalent line, style, color and thickness properties | Eight actual 1.10.6 mode/theme/hover comparisons match the preceding appearance; live rescan pending |
| Missing `getSettingDefinitions()` | Index both settings and share typed rendering/save behavior with the legacy panel | Thirteen Chrome DOM scenarios pass; real modern-host search validation pending |
| Missing attestations for two release assets | Attest all three install assets in the public tag workflow, then verify the published downloads | Workflow validated locally; actual signing and public verification require the new release |
| Malware scan unavailable | No plugin-side activation control found in the documented review flow | Recheck the actual service result; do not label it passed |
| Obfuscation scan unavailable | No plugin-side activation control found in the documented review flow | Recheck the actual service result; do not label it passed |

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

Local actionlint, YAML/shell syntax, CLI-option checks and six isolated workflow shell scenarios passed. Those results are preparation evidence, not an issued signature or a published-release result.

## Application, release and service checkpoints

Actual legacy-host candidate QA, modern-host search and persistence QA, final independent review, publication, downloaded-asset QA, and live Community rescan remain in progress. The official signed Obsidian 1.13.7 test app is prepared separately from the installed application. Its downloaded SHA-256 and code signature were verified; the temporary read-only disk image mount was removed.

Existing 0.1.0/0.1.1 tags and assets remain immutable. The English interaction recording is still explicitly identified as a 0.1.1 recording; it has not been relabeled as a new capture.

An unavailable scanner is not evidence that malicious or obfuscated code was found, nor is it a passing scan. The [Community management guide](https://docs.obsidian.md/community-directory/manage-entry) documents branch previews, new-release checks and review requests, but no maintainer switch for those unavailable services. Their final observed status will be recorded after the 0.1.2 review completes.
