import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { captureErrors, connectQa } from "../qa/connect.mjs";
import { openNote, preferences } from "../qa/preview-driver.mjs";
import { startRecording } from "./capture.mjs";
import { encodeRecording } from "./encode.mjs";
import { createDemoFixture, loadSample } from "./fixtures.mjs";
import { assertNotesUnchanged, snapshotNotes } from "./integrity.mjs";
import { assertEnglishSurface, verifyEnglishHost } from "./language.mjs";
import { installDemoOverlays, removeDemoOverlays } from "./overlays.mjs";
import { captureListingScreenshots } from "./screenshots.mjs";
import { performDemo } from "./sequence.mjs";
import { restoreAppState, saveAppState } from "./state.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const output = resolve(root, "docs/demo");

async function preflight() {
  await Promise.all([
    access("/opt/homebrew/bin/ffmpeg"),
    access("/opt/homebrew/bin/ffprobe"),
    access(resolve(root, ".qa/resource-receipt.json")),
    loadSample(),
  ]);
  console.log(
    "Demo tooling and six sample files with English prose and Latin passages passed preflight. No app connection or recording was made.",
  );
}

async function record() {
  const expectedBuildSha256 = process.argv
    .find((argument) => argument.startsWith("--expected-build-sha256="))
    ?.split("=")[1];
  assert.match(
    expectedBuildSha256 ?? "",
    /^[a-f0-9]{64}$/u,
    "Provide the verified candidate's --expected-build-sha256.",
  );
  const bundle = resolve(root, ".qa/vault/.obsidian/plugins/marginote/main.js");
  const testedBuildSha256 = createHash("sha256")
    .update(await readFile(bundle))
    .digest("hex");
  assert.equal(
    testedBuildSha256,
    expectedBuildSha256,
    "The installed candidate must match the approved QA build.",
  );
  const directory = resolve(root, `.qa/demo-${Date.now()}`);
  await mkdir(directory, { recursive: true });
  const previousMedia = resolve(directory, "previous-media");
  await mkdir(previousMedia);
  for (const name of ["marginote.gif", "marginote.mp4", "poster.png", "recording.json"]) {
    await copyFile(resolve(output, name), resolve(previousMedia, name));
  }
  const { browser, page, receipt } = await connectQa();
  const errors = captureErrors(page);
  const saved = await saveAppState(page).catch(async (error) => {
    await browser.close();
    throw error;
  });
  const originalNotes = await snapshotNotes(receipt.vault).catch(async (error) => {
    await browser.close();
    throw error;
  });
  const session = {
    errors,
    restored: false,
    overlaysRemoved: false,
    cdpDisconnected: false,
    recordingSpellcheck: false,
    originalSpellcheck: saved.app.spellcheck,
  };
  let recorder = null;
  let recording;
  let markers;
  let behavior;
  let paths;
  let preparedNotes;
  let language;
  let screenshots;
  try {
    await page.bringToFront();
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.evaluate(async () => {
      require("electron").webFrame.setZoomFactor(1);
      document.body.classList.remove("theme-dark");
      document.body.classList.add("theme-light");
      app.workspace.leftSplit.collapse();
      app.workspace.rightSplit.collapse();
      app.vault.setConfig("spellcheck", false);
      await app.vault.saveConfig();
    });
    paths = await createDemoFixture(page);
    session.fixture = paths.folder;
    preparedNotes = await snapshotNotes(receipt.vault);
    await preferences(page, "cards", "nearby");
    await openNote(page, paths.source);
    language = await verifyEnglishHost(page);
    await assertEnglishSurface(page);
    await page.mouse.move(1050, 650);
    await installDemoOverlays(page);
    recorder = await startRecording(page, directory);
    ({ markers, behavior } = await performDemo(page, paths, recorder));
    recording = await recorder.stop();
    recorder = null;
    session.captionLayout = await removeDemoOverlays(page);
    assert.equal(
      session.captionLayout.overlapFrames,
      0,
      "Captions must remain clear of product cards and outlines.",
    );
    screenshots = await captureListingScreenshots(
      page,
      paths,
      resolve(root, "docs/release/screenshots"),
    );
    assert.deepEqual(errors, []);
  } finally {
    try {
      try {
        if (recorder) await recorder.stop();
      } finally {
        try {
          await removeDemoOverlays(page);
        } finally {
          await restoreAppState(page, saved, preferences);
        }
      }
      await page.mouse.move(50, 50);
      const remaining = await page
        .locator("#marginote-demo-cursor, #marginote-demo-caption")
        .count();
      assert.equal(remaining, 0, "Demo-only overlay nodes must be removed.");
      session.overlaysRemoved = true;
      session.restored = true;
      session.spellcheckRestored = true;
      session.originalNotes = await assertNotesUnchanged(receipt.vault, originalNotes);
      if (preparedNotes)
        session.preparedNotes = await assertNotesUnchanged(receipt.vault, preparedNotes);
      if (screenshots && process.argv.includes("--leave-sample-open")) {
        await preferences(page, "cards", "nearby");
        await openNote(page, paths.source);
        await page.locator(".markdown-preview-view:visible").evaluate((node) => {
          node.scrollTop = 0;
        });
        await page.mouse.move(50, 50);
        session.requestedFinalView = {
          file: paths.source,
          mode: "preview",
          scrollTop: 0,
          previewSource: "cards",
          previewTrigger: "nearby",
        };
      }
    } finally {
      await browser.close();
      session.cdpDisconnected = true;
      await writeFile(resolve(directory, "session.json"), `${JSON.stringify(session, null, 2)}\n`);
      if (screenshots) {
        console.log(
          JSON.stringify({ phase: "app-disconnected", directory, sample: paths.source, session }),
        );
      }
    }
  }
  assert.equal(
    createHash("sha256")
      .update(await readFile(bundle))
      .digest("hex"),
    testedBuildSha256,
  );
  const report = await encodeRecording(recording, output, markers);
  Object.assign(report, { language, screenshots, session, testedBuildSha256, behavior });
  await writeFile(resolve(output, "recording.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

switch (process.argv[2]) {
  case "--check":
    await preflight();
    break;
  case "--record":
    await record();
    break;
  default:
    throw new Error(
      "Use --check for a read-only preflight, or --record only after the isolated app slot is available.",
    );
}
