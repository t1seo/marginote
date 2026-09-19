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
      bottom: "18px",
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
    window.marginoteDemoCleanup = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", click);
      cursor.remove();
      caption.remove();
      delete window.marginoteDemoCleanup;
    };
  });
}

export async function caption(page, text) {
  await page.locator("#marginote-demo-caption").evaluate((node, value) => {
    node.textContent = value;
  }, text);
}

export async function removeDemoOverlays(page) {
  await page.evaluate(() => window.marginoteDemoCleanup?.());
}
