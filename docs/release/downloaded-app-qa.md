# Downloaded release application QA

## Current release: 0.1.1

**PASS — actual publicly downloaded [0.1.1 assets](https://github.com/t1seo/marginote/releases/tag/0.1.1), freshly installed in isolated Obsidian 1.10.6.** Verified September 19, 2026. All three downloaded, installed, and tagged-build hashes agree; GitHub asset digests agree too. See [published asset identity](verification.md#published-asset-identity).

| Executed group | Result |
| --- | --- |
| Maintained 66 scenarios, four Reading pop-out regressions, fresh defaults, active-pop-out disable | 72 passed |
| Integrated proximity runner, including left/below/right cold activation and continuous paths in both modes | 22 passed |
| Additional pane and pop-out boundaries | Four passed |
| Observer and empty-controller lifecycle | Three passed |

The 101 counted execution checks overlap in behavior. Four duplicate boundary guards and two modifier-key combinations intercepted by the host are excluded from the count. The unchanged 31-second stationary-hover assertion passed. All four original Reading pop-out failures and all four stationary-pointer scrolling failures now pass against the actual release download.

The preceding plugin folder and its settings were backed up outside the vault before installing exactly the three downloaded files. A fresh runtime instance reported version 0.1.1, null saved data, and cards / nearby in the actual settings UI. All **313 pre-existing content files** retained their hashes, as did every previous-installation backup file. Tests created 24 new fixture files; the final vault contained 337 files. No notes or images were deleted, and no page or error-level console errors were collected.

Cleanup closed every pop-out, restored temporary observer constructors and instance methods, removed event probes, and performed a native fresh enable. The remaining main-window controller had correct document ownership, no card, and no pending task. CDP was disconnected after leaving the English Demo 8 at the top in Reading View with cards / nearby. Final process shutdown is recorded in release verification. Raw results are retained under ignored `.qa/release/downloaded-0.1.1-app/`; its `summary.json` and `cleanup.json` record exact provenance and preservation.

## Historical release: 0.1.0

Release: **[Marginote 0.1.0](https://github.com/t1seo/marginote/releases/tag/0.1.0)**. Verdict: **FAIL — further release approval blocked by Reading View pop-out document ownership**. Confidence: **high**. Verified on **2026-09-19** in Obsidian **1.10.6**.

The actual published assets were downloaded, verified, and cleanly installed. All **66 maintained scenarios**, the fresh-installation check, and the active-pop-out unload check passed. Inspection of the unload evidence exposed an additional defect: some Reading View links in a new pop-out remain registered with the main window's controller. Four new regression scenarios reproduced the ownership, Escape, outside-click, and hover failures. The complete result is **68 passed and 4 failed**; the passing scenarios do not override the newly observed defect.

This record is separate from the [candidate application QA](app-qa.md). The maintained suites ran again after the authorized English reading-fixture and demo update, using a new preservation baseline. No product fix or replacement asset was installed during this review. A correction must be published as a new version and verified separately; the existing 0.1.0 tag and assets remain unchanged.

## Blocking finding

Open `QA Reading.md` in Reading View, create a new pop-out for the same file, and click its image-card link. After Obsidian adopts the rendered nodes into the pop-out document, 16 connected links remain in the main controller's anchor set. The active card renders in the pop-out but is managed by the main controller. This mismatch persisted after 250 ms and reproduced on repeated runs.

| New regression | Expected behavior | Observed on downloaded 0.1.0 |
| --- | --- | --- |
| Document ownership | Every anchor and active card belongs to its controller's document. | 16 live pop-out anchors and its active card belong to the main controller. |
| Escape and focus | Escape closes the pop-out card and restores link focus. | The card remains open after 350 ms. |
| Outside pointerdown | Clicking the introduction outside the card closes it. | The card remains open after 250 ms. |
| Automatic hover | Hovering the pop-out text link opens its preview in that window. | No card appears after 600 ms. |

The nodes were connected to a live pop-out document, so this was not an inert rendering cache or a closed-window reference. Waiting did not resolve it. Normal host window closure did release the nodes, and disabling the plugin released both controllers. No console or page error was emitted; the failure is visible behavior and controller ownership.

The maintained reproducer is [`scripts/qa/reading-popout.mjs`](../../scripts/qa/reading-popout.mjs). `node scripts/qa/reading-popout.mjs` returned exit code 1 with all four scenarios failing. The probe also confirmed that Obsidian's `window-open` event exposes the final pop-out document before the Reading DOM is inserted. Temporary event listeners and mutation observers were removed after that observation. The reviewer reported the evidence before any product modification.

## Observed installation

The published tag resolves to public source commit `4c74448a8a80b00ee2427affaef7c36dcfb578b7`. The downloaded file sizes and SHA-256 values matched both GitHub's release asset digests and the build from that tagged source.

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `main.js` | 497,714 | `d6b570084aba3fce81c7bdf6b460624e14481324fd9e03dbd015647f5855a4d0` |
| `manifest.json` | 268 | `e554d8b3d16a8742bb848253cdd716a9f2690a08219db445234094141bd37594` |
| `styles.css` | 3,406 | `7aaec227bd5a3e1069419300f2e7c1cefdaeaa237e257afd315509a0a432cfd1` |

The previous plugin folder, including its `data.json`, was preserved outside the vault. The fresh installation contained exactly the three downloaded files. Obsidian 1.10.6 enabled a new Marginote 0.1.0 instance, `loadData()` returned `null`, and the actual settings UI showed Annotation cards only / On hover. Runtime versions were Electron 37.10.2, Chromium 138.0.7204.251, and Node 22.21.1. No page errors or error-level console messages were collected.

The fresh defaults were observed before the fixture update. The pre-update content baseline contained 234 existing note/image files. After the authorized fixture migration and six-file Demo 6 import, the reviewer recorded a new baseline of **240 existing files**. All 240 retained their content hashes throughout the final suite and diagnostic runs. The tests left 22 newly created fixture files; no pre-existing file was missing or changed. The three installed asset hashes matched the downloads after each suite and at final cleanup. All four files in the previous installation backup, including saved settings, also retained their hashes.

An initial QA settings-navigation call returned a complex host object and failed Playwright serialization after the plugin had enabled. The recovery path preserved that attempted installation and restored the previous folder. Repeating the clean installation with a void-returning navigation call passed. Both records are retained; no product code or release asset was changed to resolve the harness issue.

## Installation procedure

1. Verify the published tag/source identity and the three downloaded assets: `main.js`, `manifest.json`, and `styles.css`. Record file sizes and SHA-256 hashes, and compare them with the build from the tagged public source.
2. Validate the isolated Obsidian process, profile, endpoint, and actual runtime vault before any application change. Record runtime versions and content hashes for every pre-existing note/image file.
3. Disable the currently installed plugin and confirm its controllers, overlays, and pending operations are released. Rename its complete plugin folder into a unique QA backup location outside the vault; preserve its saved settings and other files.
4. Create a new plugin folder containing only the three files copied from the download directory. Verify the installed bytes before enabling. Do not use the development start, install, or reload helpers, which copy the developer bundle.
5. Enable the downloaded plugin as a fresh instance. Confirm its reported version and the default Annotation cards only / On hover UI settings, with no inherited plugin settings file.
6. Run the maintained application scenarios against that installation, then verify that all three installed asset hashes still match the downloaded bytes. Preserve the backup and all pre-existing notes/images.

The existing scenario plan is the 25 initial groups plus five boundary groups recorded in [candidate QA](app-qa.md#scenario-checklist). This follow-up adds checks for five installation boundaries: preserving the old settings in the backup, creating a settings-free installation, enabling a fresh plugin instance, unloading while another window has an active card, and retaining downloaded byte identity through repeated enable/disable cycles. These checks are grouped into the two additional scenarios below.

## Executed actual-app checks

| Command or scenario | Count | Required behavior | Result |
| --- | ---: | --- | --- |
| Fresh downloaded installation | 1 | Downloaded files alone enable as version 0.1.0 with default settings; previous installation remains in the backup. | PASS before fixture update |
| `node scripts/qa/review-suites.mjs` | 43 | Authoring, Reading View, editor, interactions, settings persistence, split panes, and lifecycle cleanup. | PASS |
| `node scripts/qa/review.mjs` | 13 | Fresh Live Preview image/mixed cards, focus/selection, rapid switching, Markdown content, wrapped aliases, and actual pop-out ownership. | PASS |
| `node scripts/qa/review-regressions.mjs after` | 6 | Modified Enter, delayed hover cancellation, and keyboard pinning preserve their contracts. | PASS |
| `node scripts/qa/review-authoring-edge.mjs` | 3 | Protect list-contained fenced code; allow authoring ordinary prose after the fence. | PASS |
| `node scripts/qa/review-save-failure.mjs` | 1 | Report failed persistence, apply choices to the current session, and retain persisted settings. | PASS |
| Disable with an active pop-out, then close it | 1 | Both documents lose plugin overlays/bindings; normal host window closure releases the pop-out; re-enabling restores a usable main window. | PASS |
| `node scripts/qa/reading-popout.mjs` | 4 | Adopted Reading links retain correct ownership, Escape/focus, outside-click dismissal, and automatic hover. | FAIL |

The same maintained 66 scenarios were rerun with English fixture locators and expected text. Their purposes and counts are unchanged; selection coordinates follow the translated anchor, and proximity checks position the pointer deliberately for the new paragraph layout. Both actual drag-selection preservation and stationary-pointer scroll behavior passed. Dedicated Unicode/composition fixtures remain intact. The authoring suite deliberately creates and deletes its own uniquely named disposable card through the host UI to verify missing-target fallback; it does not delete a pre-existing note or image. Meta/Alt+Enter observations intercepted before the DOM are excluded from passing-scenario counts. The lifecycle listener-count snapshot is diagnostic data, not an additional scenario.

The six-suite runner comprises authoring 11, previews 8, editor 6, interactions 5, settings 9, and lifecycle 4. The earlier pop-out test checked rendering and normal-close cleanup; the new test additionally checks the active controller's document and interactions while the window remains open. This explains why the prior test could pass alongside the newly reproduced failure.

## Evidence and final cleanup

Installation receipts, backup inventory, downloaded/installed asset hashes, content hashes, console/page errors, screenshots, scenario JSON, and command logs are retained under the ignored `.qa/release/downloaded-app-qa/` directory. Earlier candidate evidence remains separate. The overall result is in `summary.json`; `run.json` records the maintained suite commands and asset-identity checks. `installation.json` records the clean installation, and `popout-disable.json` records the additional unload scenario.

The failure evidence is preserved in `owner-popout-probe.json`, `reading-popout-behavior.json`, `reading-popout.json`, the matching command log and screenshots, and `window-open-order.json`. The initial installation serialization failure and the first regression attempt with an unavailable heading locator are retained separately. Correcting those QA calls did not change the release bytes or the product failure.

At final cleanup, `preservation.json` confirmed all 240 baseline files unchanged, and `final-identity.json` confirmed the three asset hashes and previous-plugin backup. All created pop-outs were closed with the host's `window.close()`. Temporary methods, listeners, observers, and globals were restored or removed. One main document remained, with no mismatched anchors, overlays, active cards, or pending automatic work. CDP was disconnected, and the isolated application was left running.

The restored view was `Marginote Demo 6/Read without losing your place.md`, Reading View at scroll position 0, with Annotation cards only / On hover. `cleanup.json` and the visually inspected `final-state.png` record that English screen. The application slot was returned for the next controlled verification step; the reviewer did not install a candidate fix.

## Scope limits

This verifies the downloaded desktop installation in Obsidian 1.10.6. It does not establish Community acceptance or directory installability. Physical mobile/touch devices, operating-system IME candidate selection, all themes, older Obsidian versions, and comprehensive screen-reader certification remain outside the tested scope. Composition and touch scenarios use Chromium simulation.
