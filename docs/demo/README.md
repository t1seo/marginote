# Marginote in real Obsidian

Recorded on September 19, 2026, with **Marginote 0.1.0** in an isolated macOS **Obsidian 1.10.6** test vault. The [GIF](marginote.gif), [MP4](marginote.mp4), and [poster](poster.png) show actual application frames. The host interface, note content, paths, card titles, and captions are English.

## What the recording shows

1. **Near the text:** the optional nearby mode opens text and image cards as the pointer moves through the surrounding text. The outline and connector move with the real card.
2. **On hover:** the recording selects the default hover mode, enters a card to read it, then clicks to pin it. The card remains open when the pointer moves away.
3. **Ordinary notes:** the actual settings dropdown selects **Ordinary note links only**, then Marginote displays an excerpt from an existing Markdown note.

The default is **Annotation cards only + On hover**. The first chapter's nearby mode is opt-in. Fixture preparation, opening the note, and opening settings use Obsidian's application API; pointer movement, clicks, and dropdown selections use Playwright input in the real renderer.

## Measured output

| Item | Result |
| --- | --- |
| Real viewport | 1200×800, 100% app zoom, light theme, collapsed sidebars |
| Raw capture | 280 CDP JPEG frames over 24.454 seconds |
| MP4 | 1200×800, 12 fps, 293 frames, 24.416667 seconds, 548,444 bytes |
| GIF | 1080×720, approximately 12 fps, 293 frames, 24.41 seconds, 2,268,748 bytes (2.27 MB) |
| Poster | The text-card chapter, 1200×800 |
| Full decode | MP4 and GIF both decoded completely with ffmpeg, exit 0 |
| Renderer errors | 0 collected page errors or error-level console messages |

CDP frame timestamps determine the ffconcat intervals. Unchanged scenes hold the previous real frame; the recorder does not redraw the app or synthesize plugin UI. The MP4 differs from the measured capture duration by about 0.037 seconds, less than one output frame. GIF delays alternate between 0.08 and 0.09 seconds; packet durations give an effective 12.003277 fps. The GIF container's `avg_frame_rate` alone is not used to judge playback speed. Detailed measurements are in [recording.json](recording.json).

## Recording aids and verification

CDP omits the operating-system pointer. A small temporary **cursor marker** follows the actual `pointermove` coordinates, and short chapter captions explain each mode. These are documentation overlays, not product features. The cards, outlines, connectors, and settings are rendered by the actual plugin and Obsidian.

Five intermediate frames from the final MP4 were visually inspected: nearby text, nearby image, hover-pinned text, the ordinary-note settings selection, and the ordinary-note excerpt. The English text, card boundaries, connector endpoints, cursor, image, and settings choices were readable. Five separate [listing screenshots](../release/demo-qa.md#listing-screenshots) were also inspected; those contain **no cursor marker or caption overlay**.

The recording uses the same six original files distributed in [the reading sample](../../examples/reading-vault/README.md). The isolated import was named `Marginote Demo 5` to preserve earlier fixtures; only copied link prefixes and card IDs differ. No personal notes or third-party editorial text or images appear in the media.

SHA-256 comparisons confirmed that all 188 existing QA note/image files and all six new sample files remained unchanged. The recorder removed its listeners and overlay elements, restored the previous active note, preview settings, theme, zoom, sidebars, and viewport, then disconnected CDP. It retained the sample and left the isolated app running for the next QA owner.

The reproducible tools are in [scripts/demo](../../scripts/demo/README.md). Raw frames and inspection images remain in the ignored local directory `.qa/demo-1789792056589/`. This demo demonstrates specific interactions; broader compatibility and release checks are tracked in [release verification](../release/verification.md).
