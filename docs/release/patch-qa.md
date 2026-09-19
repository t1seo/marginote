# 0.1.1 candidate application QA

Status: **PARTIAL — one failed hover observation; release QA is incomplete and not approved.** This record covers a **local 0.1.1 candidate**, not a published release download. Verification took place on **2026-09-19** in Obsidian **1.10.6**.

The candidate fixes the Reading View document-adoption defect recorded in [downloaded 0.1.0 QA](downloaded-app-qa.md). All four new pop-out regressions passed with the same test that failed on 0.1.0. The wider run then failed while checking that a hover card remains visible for 31 seconds. Before investigation, the user requested restoration of broad nearby previews and pointer-following behavior in both Reading View and Live Preview. QA was stopped and the application slot returned. The executed result is **31 passed, 1 failed, and 40 not run** out of 72 planned scenarios.

## Candidate identity and installation

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `main.js` | 499,341 | `da7a0cb454f3899cb9c322fb8c18fc82b9fc9c15c120b512deb192e4e99d5fa4` |
| `manifest.json` | 268 | `1ff0b8b26214e1ae126e956fad38599e4de65f272fad87ff00770245b7e0b41e` |
| `styles.css` | 3,406 | `7aaec227bd5a3e1069419300f2e7c1cefdaeaa237e257afd315509a0a432cfd1` |

The actual downloaded 0.1.0 installation, including saved settings, was disabled and preserved in a separate backup outside the isolated vault. A new plugin folder contained only the three candidate files. A fresh plugin instance reported version 0.1.1, had no inherited settings data, and displayed Annotation cards only / On hover defaults. Runtime versions were Electron 37.10.2, Chromium 138.0.7204.251, and Node 22.21.1.

The first installation attempt exposed a host manifest-cache requirement: the on-disk manifest was 0.1.1 while Obsidian's plugin registry still supplied 0.1.0 to the fresh instance. The reviewer preserved that attempted installation and restored 0.1.0. Repeating installation with the host's single-folder manifest rescan updated the registry to 0.1.1 and passed. The initial receipt and host loader evidence are retained; no product modification was made to resolve this QA installation issue.

## Reading pop-out regression

`node scripts/qa/reading-popout.mjs` passed all four scenarios on this candidate. The same script returned exit code 1 with all four failing on downloaded 0.1.0; both results and both bundle hashes are retained.

| Boundary | Candidate result |
| --- | --- |
| Adopted anchors and active card | Main and pop-out each held 21 anchors with zero document mismatches. The active card and anchor belonged to the pop-out controller. |
| Escape and focus | After Escape, no card remained and focus returned to the image link; observed after 350 ms. |
| Outside pointerdown | Clicking the introductory paragraph closed the pop-out card; observed after 250 ms. |
| Automatic hover | Hovering the text link opened one text card owned by the same pop-out document; observed after 600 ms. |

Normal host window closure returned to one main controller without mismatched anchors. This verifies the reported adoption fix; it does not complete the separate planned observer/window-close/unload diagnostic or the remaining application suites.

## Partial scenario results

| Scenario group | Planned | Observed result |
| --- | ---: | --- |
| Fresh candidate installation and defaults | 1 | 1 passed |
| New Reading pop-out regression | 4 | 4 passed |
| Authoring | 11 | 11 passed |
| Reading previews | 8 | 8 passed |
| Editor | 6 | 6 passed |
| Interactions | 5 | 1 passed, 1 failed, 3 not run |
| Settings | 9 | Not run |
| Lifecycle | 4 | Not run |
| Additional Live Preview and pop-out scenarios | 13 | Not run |
| Keyboard and delayed-hover regressions | 6 | Not run |
| List-fence authoring boundaries | 3 | Not run |
| Settings persistence failure | 1 | Not run |
| Active-pop-out disable, close, and re-enable | 1 | Not run |

The interactions run passed drag-selection preservation. In the next scenario, the text hover card initially opened, but the assertion after 31 seconds timed out because the card was no longer present. No page errors or error-level console messages were collected. The cause remains **undetermined**. Direct user use of the application may have overlapped that interval, so host blur, pointer movement, or other user input is a plausible alternative to a product regression. The original failure is retained and its test threshold was not weakened. No retry or diagnostic method/event instrumentation was started after the stop instruction.

## Preservation and hand-back

A new baseline covered **262 pre-existing content files**. At the pause, all 262 retained their hashes, with no missing or changed file. All three installed candidate hashes remained unchanged, and the previous downloaded installation's four backup files, including settings, were preserved.

The final receipt was read-only: the reviewer did not navigate, change settings, move the pointer, change focus, alter the selection, or dismiss a card. The current view was `QA Reading.md` in Reading View, with **Annotation cards and ordinary notes / On hover**; persisted and runtime settings agreed. One document remained, no pop-out was open, and no temporary QA globals remained. CDP was disconnected and the application was left running. The earlier planned restoration to the English demo was superseded by the instruction to preserve the user's current state.

Raw evidence is retained under the ignored `.qa/release/patch-0.1.1-candidate/` directory. `installation.json`, `red-green.json`, and `reading-popout.json` support installation and the four regressions. `first-suite-failure/` preserves the incomplete suite and original failure logs. `summary.json`, `paused-state.json`, and `paused-preservation.json` record the final partial counts and hand-back state. The historical 0.1.0 failure record remains unchanged. A later candidate and any published download require their own completed QA record.
