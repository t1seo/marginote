import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { captureErrors, connectQa } from "./connect.mjs";
import { assertCard, closeCard, openNote, preferences, readingLink } from "./preview-driver.mjs";

const { browser, page, receipt } = await connectQa();
const evidence = { started: new Date().toISOString(), results: [] };
const errors = [captureErrors(page)];
const originalFile = await page.evaluate(() => app.workspace.getActiveFile()?.path);
let pop;
page.setDefaultTimeout(5000);

async function owners() {
  return page.evaluate(() => {
    const manager = app.plugins.plugins.marginote._children.find(
      (child) => typeof child.controllers?.get === "function",
    );
    return [...manager.controllers.entries()].map(([doc, owner]) => ({
      current: doc === document,
      closed: doc.defaultView?.closed ?? true,
      anchors: owner.anchors.size,
      mismatches: [...owner.anchors]
        .filter((anchor) => anchor.node.ownerDocument !== doc)
        .map((anchor) => ({
          source: anchor.sourcePath,
          link: anchor.linktext,
          connected: anchor.node.isConnected,
          url: anchor.node.ownerDocument.URL,
          windowClosed: anchor.node.ownerDocument.defaultView?.closed ?? null,
        })),
      active: owner.active
        ? {
            link: owner.active.anchor.linktext,
            cardInOwnerDocument: owner.active.card.ownerDocument === doc,
            anchorInOwnerDocument: owner.active.anchor.node.ownerDocument === doc,
          }
        : null,
    }));
  });
}

function record(name, passed, detail) {
  evidence.results.push({ name, status: passed ? "passed" : "failed", detail });
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
}

async function observe(milliseconds) {
  await pop.evaluate((delay) => new Promise((resolve) => setTimeout(resolve, delay)), milliseconds);
}

async function dismissRemainingCard() {
  if (await pop.locator(".marginote-card").count()) {
    await pop.getByRole("button", { name: "Close annotation", exact: true }).click();
    await pop.locator(".marginote-card").waitFor({ state: "hidden" });
  }
}

try {
  await openNote(page);
  await preferences(page, "cards", "click");
  const future = page.context().waitForEvent("page", { timeout: 10000 });
  await page.evaluate(async () => {
    const leaf = app.workspace.openPopoutLeaf({ size: { width: 900, height: 800 } });
    await leaf.setViewState({
      type: "markdown",
      state: { file: "QA Reading.md", mode: "preview", source: false },
    });
  });
  pop = await future;
  pop.setDefaultTimeout(5000);
  errors.push(captureErrors(pop));
  await pop.waitForFunction(() => window.app?.workspace.layoutReady);
  assert.equal(await pop.evaluate(() => app.vault.adapter.basePath), receipt.vault);
  await readingLink(pop, "Annotations/Image").click();
  await assertCard(pop, "image");
  await observe(250);
  const ownership = await owners();
  record(
    "new Reading popout binds adopted anchors and active cards to its own document",
    ownership.length === 2 &&
      ownership.every((owner) => owner.mismatches.length === 0 && !owner.closed) &&
      ownership.some(
        (owner) =>
          !owner.current && owner.active?.cardInOwnerDocument && owner.active.anchorInOwnerDocument,
      ),
    { owners: ownership, observationMs: 250 },
  );

  await pop.keyboard.press("Escape");
  await observe(350);
  const escaped = await pop.evaluate(() => ({
    cards: document.querySelectorAll(".marginote-card").length,
    focusedTarget: document.activeElement?.getAttribute("data-href"),
  }));
  record(
    "Escape in a new Reading popout closes its card and restores link focus",
    escaped.cards === 0 && escaped.focusedTarget === "Annotations/Image",
    { ...escaped, observationMs: 350, owners: await owners() },
  );
  await pop.screenshot({ path: ".qa/evidence/reading-popout-escape.png", scale: "css" });
  await dismissRemainingCard();

  await readingLink(pop, "Annotations/Text").click();
  await assertCard(pop, "text");
  await pop
    .locator(".markdown-preview-view:visible p")
    .filter({ hasText: /^Keep a small explanation beside the sentence/ })
    .click({ position: { x: 4, y: 4 } });
  await observe(250);
  const outsideCards = await pop.locator(".marginote-card").count();
  record("pointerdown outside a Reading popout card closes that card", outsideCards === 0, {
    cards: outsideCards,
    observationMs: 250,
    owners: await owners(),
  });
  await dismissRemainingCard();

  await preferences(page, "cards", "hover");
  await pop.bringToFront();
  await pop.mouse.move(20, 20);
  await readingLink(pop, "Annotations/Text").hover();
  await observe(600);
  const hovered = await pop.evaluate(() => ({
    cards: document.querySelectorAll(".marginote-card").length,
    kind: document.querySelector(".marginote-card")?.getAttribute("data-kind") ?? null,
  }));
  const hoverOwners = await owners();
  record(
    "hover in a new Reading popout opens a card in the same document",
    hovered.cards === 1 &&
      hovered.kind === "text" &&
      hoverOwners.some((owner) => !owner.current && owner.active?.cardInOwnerDocument),
    { ...hovered, observationMs: 600, owners: hoverOwners },
  );
  await pop.screenshot({ path: ".qa/evidence/reading-popout-hover.png", scale: "css" });
  evidence.status = evidence.results.every((result) => result.status === "passed")
    ? "passed"
    : "failed";
  if (evidence.status === "failed") process.exitCode = 1;
} catch (error) {
  evidence.status = "failed";
  evidence.failure = String(error);
  throw error;
} finally {
  if (pop && !pop.isClosed()) await pop.evaluate(() => window.close());
  await page.bringToFront();
  await closeCard(page);
  await preferences(page, "cards", "hover");
  await openNote(page, originalFile ?? "QA Reading.md");
  await page.locator(".markdown-preview-view:visible").evaluate((node) => {
    node.scrollTop = 0;
  });
  await page.mouse.move(20, 20);
  evidence.cleanupOwners = await owners();
  evidence.errors = errors.flat();
  evidence.finished = new Date().toISOString();
  try {
    assert.equal(evidence.cleanupOwners.length, 1);
    assert.ok(evidence.cleanupOwners.every((owner) => owner.mismatches.length === 0));
    assert.deepEqual(evidence.errors, []);
  } catch (error) {
    evidence.status = "failed";
    evidence.cleanupFailure = String(error);
    process.exitCode = 1;
  }
  await writeFile(".qa/evidence/reading-popout.json", `${JSON.stringify(evidence, null, 2)}\n`);
  await browser.close();
}
