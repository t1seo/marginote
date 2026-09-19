# Demo and reading-fixture verification

**Passed on September 19, 2026.** This final capture uses **Marginote 0.1.1** in actual **Obsidian 1.10.6**: an English interface, sample titles, and captions with Latin Lorem ipsum scrolling passages. It verifies the media and fixture workflow; broader product checks, publication, and Community status are tracked in [release verification](verification.md).

The installed `main.js` SHA-256 was checked before and after capture and remained `6eaf6a2b283f6792029a37386e8d988ab5ab44cbb76c94fbd6b382da66a8193c`. No product source, installed plugin asset, or sample text was changed while recording. The application reported Electron 37.10.2, Chromium 138.0.7204.251, and Node 22.21.1.

## Shared reading sample

[examples/reading-vault](../../examples/reading-vault/README.md) contains six files: a reading page, text/image/mixed cards, an ordinary note, and an original SVG. It has English filenames, card text, and headings, with conventional Latin Lorem ipsum passages for actual scrolling. No workspace, profile, account data, or plugin bundle is included.

The page uses **Follow a thought**, **Make room for detail**, and **Return to the margin**, with paragraphs of different lengths and one lower **return to the observation** anchor. The QA reading page, long card, and public sample passed duplicate-paragraph and numbered-filler checks. The long card contains seven distinct prose paragraphs. Dedicated Unicode, Korean input, and excerpt-boundary regression fixtures were preserved.

The final recorder imported the public sample into `Marginote Demo 8`, changing only copied folder prefixes and card UUIDs. The existing **an illustrated note** link was used for directional motion because the following Lorem ipsum section has no competing nearby annotation. This did not require rearranging the sample.

`node scripts/demo/record.mjs --check` passed. General settings displayed **Language = English** and version **1.10.6**; the General, Core plugins, and Community plugins labels were verified. The recorded settings labels were **Near text · follows pointer**, **Over link · stays in place**, and **Off**.

## Directional motion and interaction

The real pointer stopped 150 pixels from the mixed annotation's boundary in this order: **left → below → right**. This was performed in both Reading View and Live Preview. All six points were inside the actual reading pane, and the same mixed card remained passive (`inert`, `aria-hidden`, and pointer events disabled). Each sample retained a visible outline and a connector ending at a card corner.

| View and transition | Card movement | Connector endpoint movement |
| --- | ---: | ---: |
| Reading View, left → below | 260.36 px | 139.89 px |
| Reading View, below → right | 301.48 px | 206.58 px |
| Live Preview, left → below | 230.45 px | 169.80 px |
| Live Preview, below → right | 276.07 px | 227.89 px |

These are measured changes between actual DOM rectangles and SVG endpoints, recorded with pointer coordinates in `behavior.nearby` in [recording.json](../demo/recording.json). Every transition exceeded the recorder's 40-pixel movement assertion. Card kind, local image load, viewport bounds, and absence of a covering native hover popover were also checked.

The subsequent optional stationary-hover scene checked that the card stayed in place when entered and remained open after click pinning and pointer departure. Actual wheel scrolling displayed the Lorem ipsum body and reopened the lower text-card anchor. The ordinary-note scene used the real settings dropdown and checked the note title and persistent readable excerpt. The defaults shown in the clean settings image are **Annotation cards only + Near text · follows pointer**.

## Recording results

| Check | Observed result |
| --- | --- |
| Capture | Real CDP `Page.startScreencast` JPEG frames and timestamps |
| Application viewport | 1200×800, 100% zoom, light theme, collapsed sidebars |
| Real capture | 469 frames / 38.579578 seconds |
| MP4 | 1200×800, 12 fps, 463 frames, 38.583333 seconds, 2,030,115 bytes |
| GIF | 960×640, 10 fps, 386 frames, 38.6 seconds, 4,060,784 bytes |
| GIF cadence | 0.1-second delays; effective 10 fps |
| Duration fidelity | Less than 0.004 seconds between capture and MP4 |
| Full decode | Both MP4 and GIF passed complete ffmpeg decoding |
| Errors | No collected page errors or error-level console messages |
| Caption checks | 2,315 sampled DOM checks and 14 chapter markers; no card/outline intersections |

Thirteen final MP4 frames and eight GIF frames were opened for inspection, including all six directional samples, real scrolling, and the lower card. The complete mixed-card text is visible in the final direction samples. The poster and all listing PNGs were also inspected.

An earlier 37.4-second take was rejected because its bottom caption covered part of the mixed card's last line. Three hypotheses were checked against the evidence: product viewport clipping, encoding crop, and caption overlap. The clean PNG contained the complete card, its bottom edge remained within the viewport, and the overlap matched the caption bounds in both MP4 and GIF. Only the recording overlay was changed. A real three-direction sample check passed before the final full capture. Captions now prefer top 70–109.5 pixels and move to the bottom for settings or to avoid a moving card. The prior take remains in `.qa/demo-1789797853012/` and in the final run's `previous-media/` backup.

Cursor/caption overlays are temporary recording aids, not product features. The isolated vault's spellchecker was temporarily disabled for Latin filler; its original effective value `true` and absent override were restored exactly. Cleanup cancels the caption animation-frame task and removes pointer listeners and overlay nodes.

## Listing screenshots

All five are actual 1200×800 PNG captures made after removing both documentation overlays. Each was opened for visual inspection and is below 5 MB.

| Image | Bytes | Visual result |
| --- | ---: | --- |
| [Text card](screenshots/text-card.png) | 152,252 | English text, outline, connector, and controls visible |
| [Image card](screenshots/image-card.png) | 125,299 | Original SVG visible in the real card |
| [Mixed card](screenshots/mixed-card.png) | 115,534 | Complete heading, image, and caption fit in the viewport |
| [Ordinary note](screenshots/ordinary-note.png) | 145,085 | Title, local path, excerpt, and Open note control visible |
| [Settings](screenshots/settings.png) | 95,928 | Annotation cards only and Near text · follows pointer selected |

## Explicit fixture migration

Before these recordings, the user requested an update to existing demonstration notes. This was a deliberate one-time migration, separate from the recorder's content-preservation checks.

Before any write, complete originals and SHA-256 hashes were saved outside the vault in `.qa/release/english-fixture-backup/1789794140205/`. Exactly nine Markdown files were updated: `QA Reading.md`, `Ordinary note.md`, and `Annotations/{Text, Mixed, Other text, Long, Bad schema, Bad kind, No marker}.md`. The inventory at `.qa/release/english-fixture-migration.json` records every path, backup copy, byte count, and before/after hash. All **225 other files existing at migration time** were unchanged, including images and dedicated Unicode regression notes. No files were deleted.

The duplicate H1, test-instruction-heavy introduction, and repeated 30-item list were replaced with concise English prose and varied Lorem ipsum paragraphs. The long card's repeated list was replaced too. The real-app screenshots `.qa/release/qa-reading-english-top.png` and `.qa/release/qa-reading-lorem-scroll.png` were inspected. Normal `prepareFixtures` remains create-only (`wx`); a scratch-vault check confirmed it did not overwrite an intentionally edited note.

The translation-stage application checks passed 8 preview scenarios, 5 interaction scenarios, and 13 appearance/scroll cases plus missing-image fallback, with no page errors. The longer page exposed host Reading View virtualization: the lower Large image reference did not exist in the DOM until scrolling. The retained trace is `.qa/release/reading-virtualization-check.json`. The final appearance command passed after a harness-only scroll/viewport check. Those earlier checks are historical evidence; current product regression status is in release verification.

## Preservation and handoff

For the final capture, SHA-256 comparisons verified all **307 existing QA files** unchanged, then verified those files plus the **six newly imported sample files** unchanged. `.obsidian` application state is excluded from content hashing because settings and workspace state change during use. This recording preservation result is separate from the earlier authorized nine-file translation.

The recorder passed saved-state restoration assertions, including spelling preferences, before intentionally applying the requested final view: `Marginote Demo 8/Read without losing your place.md`, Reading View, scroll position 0, **Annotation cards only + Near text · follows pointer**. That exception is recorded in `session.requestedFinalView`.

CDP was disconnected before returning the exclusive app slot. The isolated app remained running; the personal Obsidian instance was not modified. No notes or images were deleted. Final raw evidence is in ignored `.qa/demo-1789798217218/`, with preceding media in `previous-media/`. Earlier 0.1.0 raw recordings remain preserved. The reproducible workflow is documented in [scripts/demo](../../scripts/demo/README.md).
