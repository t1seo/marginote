# Proximity preview correction

Status: **Final candidate and actual downloaded 0.1.1 application QA passed; Community review is tracked separately.** The observations below are from real Obsidian 1.10.6 in the isolated QA vault on September 19, 2026. They are separate from the earlier [Reading pop-out candidate](patch-qa.md) and [downloaded 0.1.0 result](downloaded-app-qa.md).

## Report and source comparison

The user reported that a card appeared only when the pointer touched a link and stayed still. The current application had saved `both` / `hover` preferences. Stationary hover requires an actual link hit; proximity previews use the original 300-pixel reading zone beside and below a link. Both Reading View and Live Preview share the same window controller.

The original implementation retains the pointer when it hides a nearby card, then reevaluates that position during scrolling. The plugin instead discarded the position when no eligible anchor remained. This also affected links removed and recreated by editor virtualization.

The candidate defaults fresh installations to **Annotation cards only** and **Near text · follows pointer**. Existing saved choices remain intact. **Over link · stays in place** and **Off** remain available. The geometry's 300-pixel zone and note-pane boundaries are preserved.

## Failing-first application evidence

The first run used the earlier local 0.1.1 candidate, with `main.js` SHA-256 `da7a0cb454f3899cb9c322fb8c18fc82b9fc9c15c120b512deb192e4e99d5fa4`. It was not a new release download.

| Scenario | Reading View | Live Preview |
| --- | --- | --- |
| Hover → nearby → hover at about 158 pixels from the anchor | 0 → 1 → 0 cards | 0 → 1 → 0 cards |
| Move the pointer 111.8 pixels | Card moved 111.8 pixels | Card moved 111.8 pixels |
| Above the anchor or beyond 300 pixels | No automatic card | No automatic card |
| Stationary pointer; scroll an anchor into view | Failed | Failed |
| Stationary pointer; scroll an open card away and back | Failed | Failed |

The four failures had no intervening pointer movement. The anchor returned and its binding existed, but the remembered pointer was `null` and no card opened. The passing movement checks also asserted one card, a connected line, the correct document, and placement within the note pane. All 275 pre-existing content files and all three installed plugin assets were unchanged; no runtime errors were collected.

The maintained runner is `node scripts/qa/nearby.mjs`. The original failing receipt is retained locally under `.qa/release/proximity-0.1.1/before-Nearby-1789796550933/`.

## Source correction and automated checks

The new default passed 17 settings tests after the expected failing-first result; saved hover, explicit-only, nearby, and disabled legacy choices are preserved. A separate Chrome DOM regression ran before the source fix: 10 checks passed and six failed, covering scroll entry, return, expiry, replacement with and without other anchors, and retargeting. Explicit dismissal and cleanup checks passed. Later failing-first checks covered a stale binding after window release and Escape, typing, or selection before any card appears.

The final correction passed **19 Chrome DOM checks**. The same test set with the previous committed UI sources produced 12 passes and seven failures. The fixture uses real DOM, scrolling, timers, and input with a small Obsidian lifecycle/rendering substitute; this is separate from actual Obsidian validation. The source change keeps hidden-preview coordinates, schedules reevaluation after anchor changes, retains one controller per document until window/plugin cleanup, and ignores callbacks from a released owner. Explicit dismissal still clears the remembered pointer.

The final local release gate passed **276 tests / 326 Bun assertions**, Biome, strict TypeScript, production build, official Obsidian lint, and release validation. The candidate `main.js` SHA-256 is `6eaf6a2b283f6792029a37386e8d988ab5ab44cbb76c94fbd6b382da66a8193c`. Independent final source-quality and security reviews found no blocking issue.

The unchanged 31-second stationary-hover assertion was rerun once with temporary event and close-stack observation. It passed: the card stayed visible, and its only active close occurred when the test pressed Escape after 32.065 seconds. No intervening window blur, visibility change, pointerdown, or metadata change was observed. All temporary instrumentation was removed. This does not establish the cause of the earlier failed run, which remains preserved as undetermined; the assertion must also pass in the final complete suite.

## Actual candidate verification

The final candidate was installed into a fresh plugin folder after preserving the preceding installation and saved preferences outside the vault. Its runtime version was 0.1.1, saved data was initially null, and the actual settings UI selected cards / nearby. All three installed asset hashes matched the candidate build. An initial installation-harness version lookup failed; that attempt restored the previous installation and was not counted as a product pass. The corrected harness then completed the fresh installation.

| Executed group | Result |
| --- | --- |
| Maintained application suite, Reading pop-out regression, fresh defaults, and active-pop-out disable | 72 passed |
| Proximity activation, motion, stationary scroll entry/return, selection, and Escape in both modes | 14 passed |
| Left, below, and right 150px cold activation, plus a continuous 17-position path in each mode | 8 passed |
| Additional split-pane placement, two-mode pop-out following, and normal window close | 4 passed |
| Observer and empty-controller lifecycle | 3 passed |

The four stationary-scroll failures turned green with the same assertions and no additional pointer movement. Every directional path retained one connected card in its source pane. The unchanged 31-second stationary-hover assertion also passed in the complete suite. These groups share behavioral coverage; the counts describe executed checks, not independent product features.

Three pop-out close cycles disconnected their Reading observers and removed empty document controllers. Disabling the plugin cleared every observer, controller, pending automatic task, and remembered pointer, including an empty main-window controller. Re-enabling while two documents were already open observed each document once. Temporary constructors, instance methods, and event probes were restored; a final fresh enable used the native observer without instrumentation.

All **277 pre-existing content files** retained their hashes; the vault held 301 files after new QA fixtures. Previous plugin/data backups remained intact. No runtime errors were collected. The app was left on the English demo in Reading View at the top with cards / nearby, zero pop-outs, and no temporary probes; CDP was disconnected before the recording owner took over.

Directional assertions are now maintained in `scripts/qa/nearby-directions.mjs`, called by `scripts/qa/nearby.mjs`. This candidate executed the original 14 checks plus the same eight direction checks separately. The integrated 22-check runner subsequently passed against the actual downloaded 0.1.1 release; see [downloaded application QA](downloaded-app-qa.md#current-release-011). The original failing run and the earlier incomplete candidate remain preserved.

## Delivery result

The updated English recording shows 150px left, below, and right activation and pointer following in both modes. The 38.6-second GIF and 38.583333-second MP4 use this exact candidate; recording captions have zero overlap with the card or anchor in 2,315 DOM checks. See [demo verification](demo-qa.md). Independent final media and preparation reviews passed. Version 0.1.1 was published and its actual downloaded files passed the full 101-check application verification. The Community listing is public with no blocking review errors; native-directory installation remains unverified because the entry did not appear in the tested app's search. See [directory status](submission.md). Browser receipts are retained under `.qa/nearby-browser/`; application and build receipts are under `.qa/release/proximity-0.1.1/`, with the final application summary in `candidate-final/summary.json`.
