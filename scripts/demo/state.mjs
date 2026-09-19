import assert from "node:assert/strict";

export async function saveAppState(page) {
  return {
    viewport: page.viewportSize(),
    app: await page.evaluate(async () => ({
      leafId: app.workspace.activeLeaf.id,
      viewState: app.workspace.activeLeaf.getViewState(),
      leftCollapsed: app.workspace.leftSplit.collapsed,
      rightCollapsed: app.workspace.rightSplit.collapsed,
      light: document.body.classList.contains("theme-light"),
      dark: document.body.classList.contains("theme-dark"),
      zoom: require("electron").webFrame.getZoomFactor(),
      spellcheck: {
        effective: app.vault.getConfig("spellcheck"),
        hasOverride: Object.hasOwn(app.vault.config, "spellcheck"),
        override: app.vault.config.spellcheck ?? null,
      },
      settings: await app.plugins.plugins.marginote.loadData(),
    })),
  };
}

export async function restoreAppState(page, state, preferences) {
  await page.keyboard.press("Escape");
  await preferences(
    page,
    state.app.settings?.previewSource ?? "cards",
    state.app.settings?.previewTrigger ?? "nearby",
  );
  await page.evaluate(async (saved) => {
    app.setting.close();
    const leaf = app.workspace.getLeafById(saved.leafId);
    if (leaf) {
      await leaf.setViewState(saved.viewState);
      app.workspace.setActiveLeaf(leaf, { focus: true });
    }
    for (const [split, collapsed] of [
      [app.workspace.leftSplit, saved.leftCollapsed],
      [app.workspace.rightSplit, saved.rightCollapsed],
    ]) {
      if (collapsed) split.collapse();
      else split.expand();
    }
    document.body.classList.toggle("theme-light", saved.light);
    document.body.classList.toggle("theme-dark", saved.dark);
    require("electron").webFrame.setZoomFactor(saved.zoom);
    app.vault.setConfig(
      "spellcheck",
      saved.spellcheck.hasOverride ? saved.spellcheck.override : undefined,
    );
    await app.vault.saveConfig();
  }, state.app);
  if (state.viewport) await page.setViewportSize(state.viewport);
  else {
    const client = await page.context().newCDPSession(page);
    await client.send("Emulation.clearDeviceMetricsOverride");
    await client.detach();
  }
  const restored = await saveAppState(page);
  assert.deepEqual(
    restored.app.spellcheck,
    state.app.spellcheck,
    "Restore spelling preference and override presence",
  );
  for (const key of ["leafId", "leftCollapsed", "rightCollapsed", "light", "dark", "zoom"]) {
    assert.equal(restored.app[key], state.app[key], `Restore ${key}`);
  }
  for (const key of ["file", "mode", "source"]) {
    assert.equal(
      restored.app.viewState.state[key],
      state.app.viewState.state[key],
      `Restore ${key}`,
    );
  }
  for (const key of ["previewSource", "previewTrigger"]) {
    const fallback = key === "previewSource" ? "cards" : "nearby";
    assert.equal(
      restored.app.settings?.[key],
      state.app.settings?.[key] ?? fallback,
      `Restore ${key}`,
    );
  }
}
