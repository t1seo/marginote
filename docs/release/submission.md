# Community submission status

**Published: [Marginote 0.1.2](https://community.obsidian.md/plugins/marginote).** Observed September 19, 2026. The public page responds without authentication and shows the saved English presentation, five screenshots, current version, and Add to Obsidian. Its scorecard now displays **Health: Excellent** and **Review: Passed**.

The existing entry was updated through the portal's new-release check; no duplicate submission was created. The maintained source is [t1seo/marginote](https://github.com/t1seo/marginote), and the immutable [0.1.2 release](https://github.com/t1seo/marginote/releases/tag/0.1.2) contains three verified assets. See [release verification](verification.md) for hashes, provenance and actual application coverage.

## Observed 0.1.2 review

The anonymous public scorecard at 10:36:43 UTC, followed by the authenticated management screen and rendered scorecard, shows **eight passes, zero warnings, zero other findings, and one disclosure**. The management review is **Completed** for 0.1.2 / `339797a`. The remaining disclosure is malware-scan unavailability. The previous runtime base64 disclosure, CSS and settings warnings, and missing-attestation findings are absent.

| Scanner section | Observed result |
| --- | --- |
| Releases | Pass: verified GitHub attestations for main.js and styles.css; independent release verification also covers manifest.json |
| Network requests | Pass: no suspicious network patterns found |
| Behavior | Pass: vault reads and writes use Obsidian APIs |
| Source code and CSS | No settings, runtime-codec or CSS compatibility findings |
| Dependencies | Pass: no vulnerable dependencies found |
| Code obfuscation | Pass: no obfuscation detected |
| Build verification | Pass: independently reproduced main.js byte-for-byte |
| Malware | Unavailable; not counted as a passing scan |

These are the service's observed results, not a certification of all security properties, host versions, themes or devices. The [0.1.2 implementation record](community-review-0.1.2.md) explains the code changes and preserves the failed first CSS preview. No scanner rule, detection spelling or dependency internal was altered to suppress a result.

## Native installation checkpoint

**PASS — normal native-directory installation and post-install smoke checks completed in Obsidian 1.10.6.** The official legacy registry included Marginote at 10:19:05 UTC; the actual Browse search subsequently returned the exact Marginote / t1seo entry. After preserving the existing plugin/data folder, the normal Uninstall, Install and Enable controls produced a fresh 0.1.2 installation with cards / nearby defaults.

The host appends its source-map marker to main.js. The original signed bytes plus that exact comment were verified before enable; manifest and CSS are byte-identical to the release. All 22 proximity and four Reading pop-out smoke assertions passed, with unchanged installed hashes, 414 preceding content files, enabled-plugin list and backup. The final 416-file vault and all backups were retained, and only the recorded QA process and children were stopped. See [native installation evidence](downloaded-app-qa.md#native-directory-installation-012) for the exact byte distinction and retained helper failures.

The native listing states that Obsidian staff have not manually reviewed the plugin. Its completed automated review and successful installation are the verified results; no manual staff approval is claimed. The earlier unsuccessful 0.1.1 searches remain in the [historical record](submission-0.1.1.md#installation-checkpoint).

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

The submission and release update follow the official [submission guide](https://docs.obsidian.md/plugins/releasing/submit-plugin) and [entry-management guide](https://docs.obsidian.md/community-directory/manage-entry).
