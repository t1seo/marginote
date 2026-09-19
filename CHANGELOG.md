# Changelog

## 0.1.2

- Make both preview settings searchable in Obsidian 1.13 and later while preserving the settings panel on 1.10.6.
- Keep settings changes, saved preferences, and view refreshes consistent across the legacy panel and modern search results.
- Remove unused validation-library codecs from the plugin bundle while preserving card validation and settings recovery.
- Use a dotted bottom border for anchor underlines, with compatible CSS in both preview modes.
- Generate signed GitHub build provenance for all three release assets and verify the published downloads against the release source.

## 0.1.1

- Restore proximity previews as the default: move beside or below a link to see a card follow the pointer in Reading view and Live Preview. Existing saved choices are preserved.
- Keep the last pointer position when a nearby card leaves view so scrolling can reveal a preview without another mouse movement.
- Clarify the automatic-preview choices as **Near text · follows pointer**, **Over link · stays in place**, and **Off**.
- Keep Reading view cards and their event handling in the correct document when Obsidian moves rendered links into a pop-out window.
- Preserve Escape, hover, outside-click dismissal, and cleanup across those window changes.
- Refresh the English sample and recorded demo with varied Lorem ipsum passages, scrolling, and left/below/right pointer following in both view modes.

## 0.1.0

Initial release.

- Connect selected words to Markdown text, local-image, and mixed annotation cards.
- Preview ordinary note links with a title, path, excerpt, and an action to open the full note.
- Choose annotation cards, ordinary notes, or both; choose hover, explicit-only opening, or optional proximity previews.
- Read connected cards in Reading view and Live Preview, with native source editing and selection preservation.
- Use light/dark appearance, split panes, and separate windows with component cleanup.
- Create, edit, and unlink cards without overwriting existing notes or automatically deleting attachments.
- Include an English sample vault, a real interaction recording, and the original Marginote icon.

Requires desktop Obsidian 1.10.6 or later. Mobile and physical-device IME/touch validation are outside this release's tested scope. See the release and Community records for publication status.

To install manually, download `main.js`, `manifest.json`, and `styles.css` from the latest release into `<vault>/.obsidian/plugins/marginote/`, reload Obsidian, and enable Marginote under Community plugins. Fresh installations since 0.1.1 default to **Annotation cards only** and **Near text · follows pointer**; 0.1.0 used stationary hover.
