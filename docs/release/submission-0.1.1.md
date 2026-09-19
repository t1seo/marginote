# Historical 0.1.1 submission record

This preserves the September 19, 2026 checkpoint before 0.1.2. Its pending installation and scanner findings are historical; see the [current submission record](submission.md) for the latest observations.

**Published:** [Marginote in the Obsidian Community directory](https://community.obsidian.md/plugins/marginote), version **0.1.1**. Observed September 19, 2026. The public page responds successfully without authentication and shows the saved English description, five screenshots, the current version, and **Add to Obsidian**. Native-directory installation remains unverified because the entry was absent from the tested in-app search.

The maintained public source is [t1seo/marginote](https://github.com/t1seo/marginote), with [release 0.1.1](https://github.com/t1seo/marginote/releases/tag/0.1.1). Before submission, the actual GitHub downloads passed a fresh installation and 101 application checks in an isolated vault. The Community form was submitted once using the connected account, created the Marginote entry, completed its automated review, and was published after listing verification. The original 0.1.0 tag and assets remain unchanged.

## Observed review

The completed review identifies version 0.1.1 and source commit `21ed246`. **No blocking errors were reported.** Two warnings and one recommendation remain; this is not an all-green scanner claim.

| Scanner section | Observed result |
| --- | --- |
| Releases | Recommendation: GitHub artifact attestations are absent for main.js and styles.css |
| Network requests | Pass: no suspicious network patterns found |
| Behavior | Pass: vault reads and writes use Obsidian APIs |
| Source code | Warning: settings do not implement getSettingDefinitions() for settings search in Obsidian 1.13+ |
| CSS lint | Warning: generic partial-support notice for text-decoration against Obsidian 1.9.12 |
| Dependencies | Pass: no vulnerable dependencies found |
| Build verification | Pass: the release main.js was reproduced byte-for-byte |

The public scorecard shows **Health: Excellent** and **Review: Satisfactory**. These are the directory's displayed labels, not certification of every host version, theme, or device.

### Remaining warnings and recommendation

- **Settings search:** Marginote's settings panel works through the legacy display API used for its tested Obsidian 1.10.6 baseline. Its choices are not integrated into the new global settings search on 1.13+. Obsidian continues to support the legacy display approach; adopting both APIs requires additional newer-host validation. [Official settings documentation](https://github.com/obsidianmd/obsidian-developer-docs/blob/main/en/Plugins/User%20interface/Settings.md#legacy-imperative-display-approach).
- **Text decoration:** the reported declarations use a dotted underline and theme color. The scanner's 1.9.12 comparison is below this release's minimum 1.10.6; the declarations passed the real Chromium 138 light/dark and zoom checks. No supported-host rendering failure was observed. [Compatibility data](https://github.com/mdn/browser-compat-data/blob/main/css/properties/text-decoration.json).
- **Artifact attestations:** no cryptographic GitHub build attestation has been issued for this release. The independent Community build and downloaded-asset hashes do match the reviewed source. A later attestation must describe the build that actually generated it; it must not be presented as an attestation from the original release workflow. [GitHub provenance documentation](https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds).

## Published listing

- **Name / ID:** Marginote / `marginote`
- **Payment / platform:** Free / Desktop
- **Categories:** Annotation (primary), Links, Images
- **Short description:** Connect words and note links to floating text and image cards without leaving the page.
- **Directory icon:** the portal's built-in panels-top-left icon with its green color option.
- **Original product icon:** [Marginote icon](../../assets/brand/marginote-icon.png), displayed in the README and the directory Overview.
- **Gallery:** text, image, mixed, ordinary-note, and settings screenshots, in that order. Five original 1200×800 PNGs were uploaded; the service delivers WebP versions, which were downloaded and visually checked after saving.
- **Animated demo:** the directory Overview renders the README's [38.6-second GIF](../../docs/demo/marginote.gif) directly. Its public source matches the reviewed 4,060,784-byte, 386-frame animation. A test gallery GIF was converted by the image service into a single-frame WebP and was replaced with a clean PNG; the animated Overview remains intact.

Descriptions, icon, color, and all five gallery images were verified after navigating away and reopening the saved form. No private source repository or authentication data was connected to the public entry. Raw UI receipts and delivery checks are retained locally under ignored `.qa/release/`.

## Long description

Keep explanations and linked notes beside the passage you are reading. Marginote connects a word or phrase to a floating Markdown card with a fine outline and connector.

Create text, local-image, or mixed cards from selected text. Preview existing note links with a title, path, readable excerpt, and an action to open the full note. Choose annotation cards only, ordinary notes only, or both.

Move left, below, or right of a link to see its card follow the pointer in Reading View and Live Preview. Click or use the keyboard to keep a card open. Stationary hover and manual-only opening are also available.

Cards remain ordinary Markdown files in your vault. Unlinking restores the phrase without deleting the card or its images. Marginote works locally with no account, telemetry, or network service. Free; desktop Obsidian 1.10.6 or later. The repository includes an English sample vault and a real interaction GIF. Mobile is not supported in this release.

## Installation checkpoint

The public listing and **Add to Obsidian** link are present. Native-directory installation is **blocked by the entry not appearing in the tested app's search**. In Obsidian 1.10.6, three searches including two normal Browse reopenings returned “Showing 0 plugins / No results found” through September 19, 2026 at 06:43:19 UTC. The installed-only filter was unchecked; searching the lowercase ID also returned no result, while an Excalidraw control search returned 22 results. The app reported 7,808 directory entries.

A separate anonymous request to the [official legacy registry](https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json) at 06:42:01 UTC returned 7,806 entries without Marginote. These are separate observations, not evidence of a confirmed cache or propagation cause. No availability date is known.

No native uninstall/install was attempted and no post-directory-install smoke test ran. The preceding verified GitHub installation, plugin preferences, enabled-plugin list, and all 337 content files were preserved. The isolated QA process and its children were subsequently stopped; personal Obsidian remained untouched. The successful GitHub installation and 101 downloaded-release application checks are recorded in [downloaded application QA](downloaded-app-qa.md#current-release-011).

The remaining check is to search the native directory again once its entry becomes available, install from that UI in an isolated vault, verify the three release hashes and version, then rerun the two-mode proximity and Reading pop-out smoke checks. Until then, use the README's GitHub installation instructions.

The submission followed the official [submission guide](https://docs.obsidian.md/plugins/releasing/submit-plugin) and [entry-management guide](https://docs.obsidian.md/community-directory/manage-entry).
