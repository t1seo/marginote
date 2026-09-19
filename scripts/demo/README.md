# Real Obsidian demo capture

`node scripts/demo/record.mjs --check` verifies local prerequisites, the six shared sample files, and their links without connecting to Obsidian.

Run `node scripts/demo/record.mjs --record` only when the coordinator has released the isolated QA app for this recording and installed the final build. The script uses `connectQa()` to validate both the receipt and the real vault path. It imports the original English Markdown/SVG files from [the shared reading sample](../../examples/reading-vault/README.md) into a new `Marginote Demo` folder, or the next available numbered name. Only copied link prefixes and card IDs change. Existing files are never overwritten.

The sequence shows opt-in nearby motion with text/image cards, default hover and click pinning, then a real settings dropdown change to ordinary note previews. It uses a 1200×800 viewport, 100% Electron zoom, light theme, and collapsed sidebars. The actual host settings labels and every recorded chapter are checked for English; old timestamped fixtures cannot appear in the recording.

CDP captures page pixels without the operating-system pointer. A temporary cursor follows the actual `pointermove` coordinates, and chapter captions identify the modes. They are documentation overlays only. The recorder removes their listeners and DOM nodes, then captures five clean directory screenshots: text, image, mixed, ordinary note, and settings. Those PNGs contain no documentation overlay, are exactly 1200×800, and must each be below 5 MB.

The previous active note, preview preferences, theme, zoom, sidebars, and viewport are restored before CDP disconnects. Restoration assertions compare the saved state. SHA-256 checks verify that existing notes/images and the prepared sample files remain unchanged; `.obsidian` application state is excluded from content hashing. The new sample is retained rather than automatically deleting notes or images.

Raw JPEG frames and capture timestamps remain under ignored `.qa/demo-<timestamp>/`. Their actual intervals produce an ffconcat input; ffmpeg generates `docs/demo/marginote.mp4`, a palette GIF targeting less than 5 MB (hard ceiling 10 MB), `poster.png`, and `recording.json`. Full MP4 and GIF decoding must pass. Five intermediate MP4 frames are extracted into the local capture folder for visual inspection. They must be inspected, along with the listing images, before the demo is declared ready. Measured cadence, frame delays, file sizes, runtime versions, language checks, screenshot dimensions, and session cleanup are recorded in JSON.

Existing personal vaults, third-party editorial assets, and other Obsidian instances are out of scope. This is a real application recording; the script does not replace the app with a browser mock or manufacture plugin UI.
