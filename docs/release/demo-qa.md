# English demo verification

**Passed on September 19, 2026.** The final English demo and five listing screenshots were captured from **Marginote 0.1.0** in actual **Obsidian 1.10.6**, using the dedicated test profile and vault. This verifies the media and sample; it does not claim Community acceptance or completion of the broader [release verification](verification.md).

The tested installed `main.js` SHA-256 is `d6b570084aba3fce81c7bdf6b460624e14481324fd9e03dbd015647f5855a4d0`. The application reported Electron 37.10.2, Chromium 138.0.7204.251, and Node 22.21.1.

## Shared English sample

[examples/reading-vault](../../examples/reading-vault/README.md) contains six original files: a reading page, text/image/mixed cards, an ordinary note, and an SVG illustration. It includes no workspace, profile, account data, or plugin bundle. Every filename and file's contents are English; all local wiki links resolve within the sample and all three card kinds are present.

The recorder imported these same files into the new `Marginote Demo 5` folder. It changed copied folder prefixes and card UUIDs, without overwriting existing files. Earlier test fixtures, including language regression notes, were preserved and did not appear in the recording.

`node scripts/demo/record.mjs --check` and `bunx biome check scripts/demo` passed. The real application run checked **Language = English** in General settings, read its displayed version, and verified the English **General**, **Core plugins**, and **Community plugins** navigation labels. Each chapter and each listing screenshot passed the visible-surface language check.

## Recording results

| Check | Observed result |
| --- | --- |
| Capture method | Real CDP `Page.startScreencast` JPEG frames and timestamps |
| Application viewport | 1200×800, 100% zoom, light theme, collapsed sidebars |
| Real capture | 280 frames / 24.454 seconds |
| MP4 | 1200×800, 12 fps, 293 frames, 24.416667 seconds, 548,444 bytes |
| GIF | 1080×720, 293 frames, 24.41 seconds, 2,268,748 bytes |
| GIF cadence | 0.08/0.09-second delays; effective 12.003277 fps |
| Duration fidelity | MP4 differs from capture by approximately 0.037 seconds, below one output frame |
| Full media decode | Both MP4 and GIF passed complete ffmpeg decoding |
| Application errors | No collected page errors or error-level console messages |
| Native assertions | Card kind, viewport bounds, connector corner, local image load, hover persistence, click pinning, ordinary-note title, and absence of a covering native hover popover |

The [recording metadata](../demo/recording.json) contains measured values and chapter timestamps. The [recording guide](../demo/README.md) links the media and describes its temporary cursor and caption overlays. Five final intermediate MP4 frames were opened and visually inspected: nearby text, nearby image, hover-pinned text, ordinary-note settings, and ordinary-note content. The English text, pointer, original illustration, card outlines, connectors, and settings were readable.

The demonstration enters hover cards within the existing exit grace period; it does not change plugin timing. The nearby path avoids ordinary-note links so Obsidian's native preview does not obscure the image chapter. These are input-path choices in the recorder, with no product source or UI modification.

## Listing screenshots

All five are actual 1200×800 PNG captures, with both documentation overlays removed before capture. Each was opened for visual inspection and is below the 5 MB limit. The settings image shows the defaults.

| Image | Bytes | Visual result |
| --- | ---: | --- |
| [Text card](screenshots/text-card.png) | 76,691 | English text, outline, connector, and controls visible |
| [Image card](screenshots/image-card.png) | 55,502 | Original SVG visible within the real card |
| [Mixed card](screenshots/mixed-card.png) | 73,209 | Heading, local image, and caption fit within the viewport |
| [Ordinary note](screenshots/ordinary-note.png) | 95,765 | Title, local path, excerpt, and Open note control visible |
| [Settings](screenshots/settings.png) | 71,669 | Annotation cards only and On hover selected |

## Preservation and cleanup

The final run compared SHA-256 content hashes for all **188 existing QA note/image files**, then for those files plus the **six imported sample files**. Both comparisons passed; no original or copied note/image changed. Application files under `.obsidian` are excluded from content hashing because settings and workspace state are expected to change during use.

The script removed its recording-only event listeners and DOM nodes, restored the saved active note, preview settings, theme, zoom, sidebars, and viewport, and disconnected CDP. Restoration assertions passed. It did not stop the shared isolated app, modify the personal Obsidian instance, or delete any generated notes or images. Local raw evidence is retained under ignored `.qa/demo-1789792056589/`.

The ordinary missing-image and unresolved-link edge cases, other interaction modes, and compatibility limits are tracked separately in [release verification](verification.md). This recording is not a replacement for that test matrix.
