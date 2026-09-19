export async function installDemoOverlays(page) {
  await page.evaluate(() => {
    if (window.marginoteDemoCleanup) throw new Error("A demo overlay is already present.");
    const cursor = document.createElement("div");
    cursor.id = "marginote-demo-cursor";
    cursor.setAttribute("aria-hidden", "true");
    Object.assign(cursor.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: "13px",
      height: "19px",
      background: "#263b34",
      clipPath: "polygon(0 0, 0 92%, 29% 66%, 49% 100%, 68% 89%, 47% 57%, 94% 57%)",
      filter: "drop-shadow(0 0 1px white)",
      pointerEvents: "none",
      zIndex: "2147483647",
      transform: "translate(-30px, -30px)",
    });
    const caption = document.createElement("div");
    caption.id = "marginote-demo-caption";
    caption.setAttribute("aria-hidden", "true");
    Object.assign(caption.style, {
      position: "fixed",
      left: "50%",
      top: "70px",
      bottom: "auto",
      transform: "translateX(-50%)",
      background: "rgba(30, 42, 36, 0.94)",
      color: "#fff",
      padding: "10px 18px",
      borderRadius: "8px",
      fontSize: "15px",
      fontFamily: "var(--font-interface)",
      letterSpacing: "0.01em",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      zIndex: "2147483646",
    });
    const move = (event) => {
      cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
    };
    const click = () => {
      cursor.animate([{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }], { duration: 220 });
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", click, { passive: true });
    document.body.append(cursor, caption);
    const statistics = { checks: 0, top: 0, bottom: 0, overlapFrames: 0 };
    const intersects = (first, second) =>
      first.left < second.right &&
      first.right > second.left &&
      first.top < second.bottom &&
      first.bottom > second.top;
    let frame;
    const positionCaption = () => {
      const blockers = [
        ...document.querySelectorAll(
          ".marginote-card, .marginote-connector rect:not(.marginote-endpoint)",
        ),
      ].map((node) => node.getBoundingClientRect());
      caption.style.top = "70px";
      caption.style.bottom = "auto";
      if (
        document.querySelector(".modal-container") ||
        blockers.some((box) => intersects(caption.getBoundingClientRect(), box))
      ) {
        caption.style.top = "auto";
        caption.style.bottom = "18px";
      }
      if (caption.textContent) {
        statistics.checks += 1;
        statistics[caption.style.top === "70px" ? "top" : "bottom"] += 1;
        if (blockers.some((box) => intersects(caption.getBoundingClientRect(), box)))
          statistics.overlapFrames += 1;
      }
      frame = requestAnimationFrame(positionCaption);
    };
    positionCaption();
    window.marginoteDemoCleanup = () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", click);
      cursor.remove();
      caption.remove();
      delete window.marginoteDemoCleanup;
      return statistics;
    };
  });
}

export async function caption(page, text) {
  await page.locator("#marginote-demo-caption").evaluate((node, value) => {
    node.textContent = value;
  }, text);
}

export async function removeDemoOverlays(page) {
  return page.evaluate(() => window.marginoteDemoCleanup?.());
}

export async function assertCaptionClear(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  const geometry = await page.locator("#marginote-demo-caption").evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      intersections: [
        ...document.querySelectorAll(
          ".marginote-card, .marginote-connector rect:not(.marginote-endpoint)",
        ),
      ].filter((target) => {
        const box = target.getBoundingClientRect();
        return (
          rect.left < box.right &&
          rect.right > box.left &&
          rect.top < box.bottom &&
          rect.bottom > box.top
        );
      }).length,
    };
  });
  assert.equal(
    geometry.intersections,
    0,
    "Documentation captions must not cover a card or annotation outline.",
  );
  return geometry;
}

import assert from "node:assert/strict";
