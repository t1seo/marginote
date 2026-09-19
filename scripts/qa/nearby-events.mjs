export async function observeNearbyEvents(page) {
  await page.evaluate(() => {
    const data = { events: [], listeners: [], origin: performance.now() };
    window.marginoteNearbyEvents = data;
    for (const [target, type] of [
      [document, "pointermove"],
      [document, "pointerdown"],
      [window, "blur"],
      [window, "focus"],
      [document, "visibilitychange"],
    ]) {
      const listener = (event) =>
        data.events.push({
          type,
          ms: performance.now() - data.origin,
          trusted: event.isTrusted,
          x: event.clientX ?? null,
          y: event.clientY ?? null,
          buttons: event.buttons ?? null,
          visibility: document.visibilityState,
          target: event.target === window ? "window" : (event.target?.nodeName ?? null),
        });
      const capture = target !== window;
      target.addEventListener(type, listener, capture);
      data.listeners.push({ target, type, listener, capture });
    }
  });
}

export async function stopNearbyEvents(page) {
  return page.evaluate(() => {
    const data = window.marginoteNearbyEvents;
    if (!data) return [];
    for (const { target, type, listener, capture } of data.listeners)
      target.removeEventListener(type, listener, capture);
    delete window.marginoteNearbyEvents;
    return data.events;
  });
}
