# Marginote in real Obsidian

Recorded on September 19, 2026, with **Marginote 0.1.1** in an isolated macOS **Obsidian 1.10.6** test vault. The [GIF](marginote.gif), [MP4](marginote.mp4), and [poster](poster.png) show actual application frames: an **English interface, sample titles, and captions with Latin Lorem ipsum scrolling passages**.

## What the recording shows

1. **Reading View:** the default **Near text · follows pointer** mode opens text and image cards. The pointer then moves **left → below → right**, stopping 150 pixels from the same mixed-card link; its outline, connector, and card remain active.
2. **Live Preview:** the same three-direction motion works while the note is open for editing. The existing **an illustrated note** link has no competing lower card link before the Lorem ipsum section, so the same card stays selected.
3. **Stationary hover and pinning:** the recording selects **Over link · stays in place**, enters the stationary card, then clicks to pin it. It stays open when the pointer leaves.
4. **Keep reading:** real mouse-wheel input scrolls through varied Lorem ipsum paragraphs. The lower **return to the observation** anchor opens its card beside the current passage, then the page scrolls back to the top.
5. **Ordinary notes:** the actual settings dropdown selects **Ordinary note links only**, and Marginote displays an excerpt from an existing Markdown note.

The default is **Annotation cards only + Near text · follows pointer**. Stationary hover is an option. Fixture preparation, view switching, and opening settings use Obsidian's application API; pointer movement, clicks, wheel scrolling, and dropdown selections use Playwright input in the real renderer.

## Measured output

| Item | Result |
| --- | --- |
| Real viewport | 1200×800, 100% app zoom, light theme, collapsed sidebars |
| Raw capture | 469 CDP JPEG frames over 38.579578 seconds |
| MP4 | 1200×800, 12 fps, 463 frames, 38.583333 seconds, 2,030,115 bytes |
| GIF | 960×640, 10 fps, 386 frames, 38.6 seconds, 4,060,784 bytes (4.06 MB) |
| Poster | The text-card chapter, 1200×800 |
| Full decode | MP4 and GIF both decoded completely with ffmpeg, exit 0 |
| Renderer errors | 0 collected page errors or error-level console messages |

CDP timestamps determine the ffconcat intervals. Unchanged scenes hold the previous real frame; the recorder does not redraw the app or synthesize plugin UI. The MP4 differs from the measured capture duration by less than 0.004 seconds. The GIF uses 0.1-second frame delays and was reduced to 960 pixels wide to meet the 5 MB target. Detailed measurements, chapter timestamps, and the tested bundle hash are in [recording.json](recording.json).

## Recording aids and verification

CDP omits the operating-system pointer. A temporary **cursor marker** follows actual `pointermove` coordinates, and short chapter captions explain the modes. These are documentation overlays, not product features. Cards, outlines, connectors, and settings are rendered by the actual plugin and Obsidian.

Captions normally sit in the gap above the note heading. They move to the bottom during settings or when a moving card would intersect them. The final recording passed **2,315 sampled DOM checks** and all **14 chapter-marker checks** with no caption intersection with cards or annotation outlines. An earlier take had a caption over the mixed card's last line; it was retained locally and replaced by this recording.

The isolated vault's spellchecker was temporarily disabled to keep Latin filler free of spelling underlines in Live Preview. Its original effective value, **true**, and the absence of a vault override were both restored and checked. No sample text was changed for recording.

Thirteen final MP4 frames, eight GIF frames, the poster, and five separate [listing screenshots](../release/demo-qa.md#listing-screenshots) were visually inspected. All six Reading View/Live Preview direction samples show the complete mixed-card text, image, anchor, and connector. The listing PNGs contain **no cursor marker or caption overlay**.

The recording uses the same six files distributed in [the reading sample](../../examples/reading-vault/README.md). The isolated import was named `Marginote Demo 8` to preserve earlier fixtures; only copied link prefixes and card IDs differ. No personal notes or third-party editorial assets appear in the media. An earlier, explicitly requested translation of nine QA notes was a separate migration with an external backup; its inventory is described in [demo verification](../release/demo-qa.md#explicit-fixture-migration).

During this recording, SHA-256 comparisons confirmed that all **307 existing QA files** and all **six new sample files** remained unchanged. The recorder removed its listeners, animation-frame task, and overlay elements and checked restoration of the previous app state. It then deliberately left `Marginote Demo 8/Read without losing your place.md` at the top in Reading View with the default card/nearby settings, as requested, before disconnecting CDP.

The reproducible tools are in [scripts/demo](../../scripts/demo/README.md). Raw frames and inspection images remain in ignored `.qa/demo-1789798217218/`; `previous-media/` preserves the preceding take, and earlier raw directories were retained. Broader compatibility, publishing, and Community status are tracked in [release verification](../release/verification.md).
