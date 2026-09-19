import assert from "node:assert/strict";
import { access, mkdir, writeFile } from "node:fs/promises";
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
    "Demo tooling and all six English sample files passed preflight. No app connection or recording was made.",
  );
}

async function record() {
  const directory = resolve(root, `.qa/demo-${Date.now()}`);
  await mkdir(directory, { recursive: true });
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
  const session = { errors, restored: false, overlaysRemoved: false, cdpDisconnected: false };
  let recorder = null;
  let recording;
  let markers;
  let paths;
  let preparedNotes;
  let language;
  let screenshots;
  try {
    await page.bringToFront();
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.evaluate(() => {
      require("electron").webFrame.setZoomFactor(1);
      document.body.classList.remove("theme-dark");
      document.body.classList.add("theme-light");
      app.workspace.leftSplit.collapse();
      app.workspace.rightSplit.collapse();
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
    markers = await performDemo(page, paths, recorder);
    recording = await recorder.stop();
    recorder = null;
    await removeDemoOverlays(page);
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
      session.originalNotes = await assertNotesUnchanged(receipt.vault, originalNotes);
      if (preparedNotes)
        session.preparedNotes = await assertNotesUnchanged(receipt.vault, preparedNotes);
    } finally {
      await browser.close();
      session.cdpDisconnected = true;
      await writeFile(resolve(directory, "session.json"), `${JSON.stringify(session, null, 2)}\n`);
    }
  }
  const report = await encodeRecording(recording, output, markers);
  Object.assign(report, { language, screenshots, session });
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
