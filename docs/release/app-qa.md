# Release candidate application QA

**Historical record.** The later [downloaded 0.1.0 review](downloaded-app-qa.md) found additional Reading view pop-out failures and supersedes this earlier passing gate. A 0.1.1 correction is being verified; see [release verification](verification.md) for the current state. The results below remain the observations from the earlier candidate run.

Release candidate: **Marginote 0.1.0**. Date: September 19, 2026.

**Verdict: PASS. Confidence: HIGH.** The final consecutive run passed all **66 application scenarios** on the unchanged 0.1.0 candidate, with no collected page errors or error-level console messages. It ran on September 19, 2026, from 04:36:11 to 04:37:28 UTC. The five English listing screenshots and twelve sampled video frames also passed independent visual inspection. These are new release-candidate results, not reused MVP results.

## Candidate and scope

The installed production `main.js` SHA-256 is `d6b570084aba3fce81c7bdf6b460624e14481324fd9e03dbd015647f5855a4d0`. All three installed assets matched the candidate build before execution. The actual General settings screen reported Obsidian 1.10.6 and English; the loaded plugin reported 0.1.0. Runtime versions were Electron 37.10.2, Chromium 138.0.7204.251, and Node 22.21.1. The test used a separate profile and vault; personal vaults and unrelated application instances were excluded.

This review covers the existing 66 actual-app scenarios, the release's DOM-helper and modal-display changes, and independent visual inspection of the English demo and five listing screenshots. Publicly downloaded release assets will receive a separate later verification; this candidate run does not claim to test a GitHub download or Community installation.

## Scenario checklist

The reviewer prepared the first 25 scenario groups before application access, then added five boundary groups after reviewing source preservation, document ownership, failure cleanup, and English presentation. All 30 groups passed: 22 P0 and 8 P1. These groups map to the maintained scenario runners and media review; they are not added to the 66-test total as separate tests. P0 is required functionality or preservation; P1 is interaction, geometry, or lifecycle coverage.

| ID | Priority | Action and expected result | Runner | Result |
| --- | --- | --- | --- | --- |
| 01 | P0 | Open text, image, and mixed cards in Reading View; render Markdown, loaded local images, and connected cards. | previews | PASS |
| 02 | P0 | Open identical aliases pointing to different notes; display the correct target each time. | previews | PASS |
| 03 | P0 | Open ordinary, empty, and long notes; hide frontmatter, show truthful excerpts, and navigate with Open note. | previews/settings | PASS |
| 04 | P0 | Select all nine source/trigger preference pairs; update current bindings immediately. | settings | PASS |
| 05 | P0 | Disable and enable after choosing preferences; retain the saved values. | settings | PASS |
| 06 | P0 | Create text, image, and mixed cards through the modal; handle filename collisions and duplicate source occurrences. | authoring | PASS |
| 07 | P0 | Cancel or submit invalid forms/missing images; preserve source, selection, and file count. | authoring | PASS |
| 08 | P0 | Change the source while a creation modal is open; reject the stale operation. | authoring | PASS |
| 09 | P0 | Attempt authoring/unlink inside code and list-contained fences; leave code unchanged, but allow ordinary prose after the fence. | authoring/review-authoring-edge | PASS |
| 10 | P0 | Undo, redo, and unlink; retain card/image files and restore the expected source text. | authoring | PASS |
| 11 | P0 | Edit, rename, and remove only a disposable fixture card; preserve IDs and use host fallback when the target is absent. | authoring | PASS |
| 12 | P0 | Open text and ordinary-note previews in Live Preview; resolve the correct document. | editor | PASS |
| 13 | P0 | First-click fresh image/mixed links in Live Preview; keep the loaded card through CodeMirror DOM replacement. | review | PASS |
| 14 | P0 | Insert text before links, undo/redo, and place the cursor inside a link; preserve editable source and correct positions. | editor | PASS |
| 15 | P0 | Switch to Source Mode and back; remove preview decorations without rewriting Markdown. | editor/review | PASS |
| 16 | P0 | Send Chromium composition input; preserve Korean text and wikilinks. | editor | PASS |
| 17 | P1 | Drag-select across an anchor; retain the selection and suppress automatic cards. | interactions | PASS |
| 18 | P1 | Hover into a card, wait 30 seconds, then press Escape; keep it readable and suppress immediate reopening. | interactions | PASS |
| 19 | P1 | Switch between links and send Chromium touch input; retain one correct explicit card and unchanged source. | interactions/review | PASS |
| 20 | P1 | Use nearby mode, scroll, and wait for expiry; maintain passive accessibility state, geometry, and timeout behavior. | previews/interactions | PASS |
| 21 | P0 | Use Space/Escape and modified Enter/click; restore appropriate focus and preserve host navigation modifiers. | previews/settings/review-regressions | PASS |
| 22 | P0 | Delay a hover read, then leave, select, or press the pointer; prevent a late card after cancellation. | review-regressions | PASS |
| 23 | P0 | Schedule a second anchor's hover, then pin the first with the keyboard; keep the first card after the timer. | review-regressions | PASS |
| 24 | P0 | Close Live Preview cards by Escape/button; retain editor focus, logical link caret, existing selections/multiple cursors, ARIA, and source after 250ms. | review | PASS |
| 25 | P1 | Render lists/checkboxes/local Markdown links; allow navigation without rewriting card files. | review | PASS |
| 26 | P1 | Wrap a long alias in both views; draw each visible line's outline and keep the connected card inside the window. | review | PASS |
| 27 | P1 | Move an existing Live Preview leaf into a pop-out, change modes/preferences, and close it normally; respect each owner document. | review | PASS |
| 28 | P1 | Use split panes and repeat disable/enable three times; release layers, timers, anchors, listeners, and commands. | lifecycle | PASS |
| 29 | P0 | Reject a settings save and render malformed media; retain session behavior and disk settings, avoid external image requests, and preserve fixture source. | settings/review-save-failure | PASS |
| 30 | P0 | Inspect all five English screenshots and every video chapter; confirm readable English, real card/connector motion, and no unintended recording overlays. | independent visual inspection | PASS |

## Executed commands and evidence

| Command | Passed scenario count | Result |
| --- | --- | --- |
| `node scripts/qa/review-suites.mjs` | 43: authoring 11, previews 8, editor 6, interactions 5, settings 9, lifecycle 4 | PASS |
| `node scripts/qa/review.mjs` | 13 | PASS |
| `node scripts/qa/review-regressions.mjs after` | 6; host-intercepted Meta/Alt+Enter observations excluded | PASS |
| `node scripts/qa/review-authoring-edge.mjs` | 3 | PASS |
| `node scripts/qa/review-save-failure.mjs` | 1 | PASS |

All five commands exited zero in the final consecutive run. Fresh logs, JSON, screenshots, asset identities, and visual-review frames are retained under the ignored `.qa/release/app-qa/` directory, separate from historical MVP evidence. `summary.json` lists the 66 passing scenarios individually; `run.json` records each command, start/end time, exit code, and copied evidence. The detailed results are `review-suites.json`, `review-additional.json`, `review-regressions-after.json`, `review-authoring-edge.json`, and `review-save-failure.json`. The lifecycle listener-count snapshot is a diagnostic row, not a fifth lifecycle scenario. Meta/Alt+Enter were intercepted by the host before the observed DOM and are recorded separately, outside the 66 passes.

The reviewer found one test-harness cleanup issue during preparation: the lifecycle runner's failure-path `finally` used CDP `page.close()`, although its normal path already used the host's `window.close()`. The coordinator authorized changing that one line to normal host closure so that both paths execute Obsidian's window cleanup. No product source or build was changed by this reviewer.

## Lifecycle observation and harness correction

The first release run passed authoring, previews, editor, interactions, settings, and the first three lifecycle scenarios. Its last lifecycle comparison failed because window `click`, `contextmenu`, and `mousemove` counts changed from zero to one. The initial failed log and snapshots are retained under `.qa/release/app-qa/initial-failure/`; the failure was not discarded or counted as a pass.

The reviewer tested three explanations: leaked Marginote listeners, transient native Page preview listeners, and recording/automation state. A diagnostic run preserving the original assertions passed all four lifecycle scenarios. A separate controlled host probe then opened native Page preview and observed those same three event types change from zero to one; closing it returned all three to zero. The actual callback bodies referred to host hover windows, and their registration and removal stacks came from Obsidian's `app.js` (`P_` and `A_`). Showing a normal tooltip did not add them. Callback source, counts, and stacks are retained in `host-listener-probe.json`; the temporary method wrappers were restored in `finally`.

The maintained lifecycle runner now parks the pointer away from links before disabling Marginote and waits for native hover-popover elements to disappear before counting listeners. It still disables an open Marginote card, checks every controller/anchor/timer/command cleanup assertion, and compares the same raw and filtered listener counts over three cycles. No host or product listener was newly excluded. The correction changes the QA precondition to compare the same host state, without modifying the product or its installed bytes. The complete 66-scenario sequence passed after this correction. The updated runner also passed Biome.

## Independent English media inspection

This section records the earlier 24-second capture inspected during candidate QA. The later English/Lorem ipsum recording replaces those media files; its current measurements and inspection results are in [demo verification](demo-qa.md).

The reviewer opened all five final 1200×800 listing PNGs individually. Text, image, mixed, ordinary-note, and settings views contain readable English; card content and controls fit in the viewport, the original local illustration is visible, and no recording caption or cursor marker appears. All five files are below 5 MB. The settings screenshot shows Annotation cards only and On hover.

Both final media files passed independent full ffmpeg decoding. ffprobe measured the MP4 as 1200×800, 293 frames at 12 fps, 24.416667 seconds, and 548,444 bytes; the GIF is 1080×720, 293 frames, 24.41 seconds, and 2,268,748 bytes. Twelve sampled MP4 frames were opened across all six chapter markers and additional opening, motion, pinning, and final states. They show the nearby image card changing position with the pointer, the hover text card remaining after the pointer leaves, English source/host/settings/captions, and the ordinary-note excerpt. This is sampled-frame visual inspection plus full decoding, not a claim of frame-by-frame manual inspection.

A small native English link tooltip appears near the final caption at 23.8 seconds; it does not cover the card content. No covering native Page preview appears in the inspected frames. Media hashes, measurements, image identities, observations, and twelve extracted frames are retained in `.qa/release/app-qa/visual-review.json` and `visual/`. The demo's original capture and restoration record remains in [demo verification](demo-qa.md).

## Verification boundaries

The maintained runners use Obsidian APIs for disposable fixture setup and real Playwright mouse, keyboard, and locator interactions for behavior. Delayed-read and failed-save checks temporarily replace the corresponding QA instance methods and restore them in `finally`. The selection-cancellation fixture uses a DOM Range and selection-change event; composition and touch are Chromium simulations.

Physical touch devices, operating-system IME candidate selection, mobile, all community themes, older Obsidian versions, and comprehensive screen-reader/WCAG certification are not covered. Meta/Alt+Enter must be reported as host-intercepted if the event never reaches the observed DOM; they must not be counted as plugin passes.

## Preservation and final state

SHA-256 comparisons confirmed that all **194 pre-existing note/image files** were unchanged across this review, including the English sample imports. The three installed plugin assets and local build files still matched the identities captured before the run. Source-preservation assertions for newly created fixtures also passed. No product source or installed plugin asset was changed during this review.

Live Preview Image/Escape and Mixed/Close both retained the loaded local image and correct ARIA while open, then returned focus to the native editor and a caret within the logical link after 250ms. Nonempty selections and multiple cursors were preserved. Reading View returned focus to its DOM anchor. Delayed hover reads did not reopen after leave, selection, or pointer-down; a second anchor's queued hover did not replace a keyboard-pinned first card after 600ms. Existing main-window and pop-out bindings applied source preferences immediately.

The reviewer closed created pop-outs through `window.close()`, restored temporary methods/listeners, removed active cards and the temporary diagnostic script, and disconnected CDP. Final assertions found one Markdown Reading View, cards/hover settings, one current owner document, zero mismatched node owners, zero overlay layers, no pending request, no remaining test globals, and no collected errors. `cleanup.json` records these observations. The isolated application remained running and its exclusive slot was returned to the coordinator. No release-blocking application issue remains in the tested scope.
