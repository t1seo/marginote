import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { captureErrors, connectQa } from "./connect.mjs";
import { assertCard, closeCard, openNote, preferences, readingLink } from "./preview-driver.mjs";

const { browser, page } = await connectQa();
const phase = process.argv[2] ?? "before";
const evidence = {
  phase,
  started: new Date().toISOString(),
  results: [],
  errors: captureErrors(page),
};
page.setDefaultTimeout(6000);

async function restoreGate() {
  await page.evaluate(() => {
    const gate = window.marginoteReviewGate;
    if (!gate) return;
    gate.repository.read = gate.original;
    for (const release of gate.releases) release();
    delete window.marginoteReviewGate;
  });
}

try {
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.bringToFront();
  await openNote(page);
  await preferences(page, "cards", "click");
  for (const key of ["Meta+Enter", "Shift+Enter", "Control+Enter", "Alt+Enter"]) {
    await readingLink(page, "Annotations/Text").focus();
    await page.evaluate(() => {
      window.marginoteReviewKeys = [];
      const listener = (event) => {
        if (event.key !== "Enter") return;
        window.marginoteReviewKeys.push(event);
      };
      window.marginoteReviewKeyListener = listener;
      document.addEventListener("keydown", listener, true);
    });
    await page.keyboard.press(key);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    const state = await page.evaluate(() => {
      document.removeEventListener("keydown", window.marginoteReviewKeyListener, true);
      return {
        keys: window.marginoteReviewKeys.map((event) => ({
          key: event.key,
          meta: event.metaKey,
          shift: event.shiftKey,
          ctrl: event.ctrlKey,
          alt: event.altKey,
          prevented: event.defaultPrevented,
        })),
        cards: document.querySelectorAll(".marginote-card").length,
      };
    });
    evidence.results.push({
      name: key,
      status:
        state.keys.length === 0
          ? "host-intercepted"
          : state.cards === 0 && state.keys.every((entry) => !entry.prevented)
            ? "passed"
            : "failed",
      ...state,
    });
    console.log(`${evidence.results.at(-1).status.toUpperCase()} ${key} ${JSON.stringify(state)}`);
    await closeCard(page);
    await openNote(page);
  }
  await preferences(page, "cards", "hover");
  for (const cancellation of ["leave", "selection", "pointerdown"]) {
    await page.mouse.move(20, 20);
    await page.evaluate(() => getSelection().removeAllRanges());
    await closeCard(page);
    await page.evaluate(() => {
      const manager = app.plugins.plugins.marginote._children.find(
        (child) => child.controllers instanceof Map,
      );
      const repository = manager.controllers.get(document).repository;
      const gate = { repository, original: repository.read, releases: [], started: 0, finished: 0 };
      window.marginoteReviewGate = gate;
      repository.read = async function (reference) {
        gate.started++;
        await new Promise((resolve) => gate.releases.push(resolve));
        const result = await gate.original.call(this, reference);
        gate.finished++;
        return result;
      };
    });
    try {
      const link = readingLink(page, "Annotations/Text");
      await link.hover();
      await page.waitForFunction(() => window.marginoteReviewGate.started > 0);
      if (cancellation === "leave") await page.mouse.move(20, 20);
      if (cancellation === "selection")
        await link.evaluate((node) => {
          const range = node.ownerDocument.createRange();
          range.selectNodeContents(node);
          const selection = node.ownerDocument.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        });
      if (cancellation === "pointerdown") await page.mouse.down();
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      await page.evaluate(() => {
        for (const release of window.marginoteReviewGate.releases) release();
      });
      await page.waitForFunction(() => window.marginoteReviewGate.finished > 0);
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      const state = await page.evaluate(() => ({
        cards: document.querySelectorAll(".marginote-card").length,
        started: window.marginoteReviewGate.started,
        finished: window.marginoteReviewGate.finished,
        selected: getSelection().toString(),
      }));
      evidence.results.push({
        name: `pending hover ${cancellation}`,
        status: state.cards === 0 ? "passed" : "failed",
        ...state,
      });
      console.log(
        `${evidence.results.at(-1).status.toUpperCase()} pending hover ${cancellation} ${JSON.stringify(state)}`,
      );
      await page.screenshot({
        path: `.qa/evidence/review-regressions-${phase}-${cancellation}.png`,
        scale: "css",
      });
    } finally {
      await restoreGate();
      await page.mouse.up();
      await page.evaluate(() => getSelection().removeAllRanges());
      await closeCard(page);
    }
  }
  await page.mouse.move(20, 20);
  await readingLink(page, "Annotations/Text").hover();
  await assertCard(page, "text");
  await readingLink(page, "Annotations/Image").hover();
  await page.waitForFunction(() => {
    const manager = app.plugins.plugins.marginote._children.find(
      (child) => child.controllers instanceof Map,
    );
    return manager.controllers.get(document)?.automatic.pending?.linktext === "Annotations/Image";
  });
  await readingLink(page, "Annotations/Text").focus();
  await page.keyboard.press("Enter");
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 600)));
  const pinned = await page.evaluate(() => ({
    kind: document.querySelector(".marginote-card")?.getAttribute("data-kind"),
    count: document.querySelectorAll(".marginote-card").length,
  }));
  evidence.results.push({
    name: "keyboard pin cancels another anchor's pending hover timer",
    status: pinned.kind === "text" && pinned.count === 1 ? "passed" : "failed",
    ...pinned,
    observationMs: 600,
  });
  console.log(
    `${evidence.results.at(-1).status.toUpperCase()} keyboard pin after another hover was scheduled ${JSON.stringify(pinned)}`,
  );
  await closeCard(page);
  assert.deepEqual(evidence.errors, []);
  evidence.status = evidence.results.every((result) => result.status !== "failed")
    ? "passed"
    : "failed";
  if (phase !== "before" && evidence.status === "failed") process.exitCode = 1;
} finally {
  await restoreGate();
  await page.evaluate(() => {
    document.removeEventListener("keydown", window.marginoteReviewKeyListener, true);
    delete window.marginoteReviewKeys;
    delete window.marginoteReviewKeyListener;
  });
  await closeCard(page);
  await preferences(page, "cards", "hover");
  await openNote(page);
  evidence.finished = new Date().toISOString();
  await writeFile(
    `.qa/evidence/review-regressions-${phase}.json`,
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  await browser.close();
}
