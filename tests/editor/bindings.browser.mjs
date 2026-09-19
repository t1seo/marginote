import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  entryPoints: [fileURLToPath(new URL("./browser-imports.ts", import.meta.url))],
  bundle: true,
  write: false,
  format: "iife",
  globalName: "EditorHarness",
});
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const source = bundle.outputFiles[0]?.text;
  assert.ok(source);
  await page.setContent("<main style='width:160px;font:16px sans-serif'></main>");
  await page.addScriptTag({ content: source });
  await page.evaluate(() => {
    const { Decoration, EditorState, EditorView, ViewPlugin, EditorAnchorBindings } = EditorHarness;
    const alias = "한글 표시 문구는 여러 줄로 이어지며 선택할 수 있습니다.";
    const active = new Set();
    const stats = { bound: 0, released: 0, retargeted: 0, ownerChanges: 0 };
    let enabled = true;
    let path = "QA.md";
    let target = "Card";
    let tagName = "span";
    let replaceOnGeometry = false;
    const plugin = ViewPlugin.define(
      (view) => {
        const bindings = new EditorAnchorBindings(view, (node, linktext, sourcePath) => {
          let currentNode = node;
          stats.bound++;
          if (node.ownerDocument !== document) stats.ownerChanges++;
          active.add(node);
          node.setAttribute("data-bound", `${sourcePath}:${linktext}`);
          node.setAttribute("aria-expanded", "true");
          const release = () => {
            stats.released++;
            active.delete(currentNode);
            currentNode.removeAttribute("data-bound");
          };
          return {
            release,
            retarget(nextNode) {
              if (nextNode !== currentNode) stats.retargeted++;
              active.delete(currentNode);
              currentNode.removeAttribute("data-bound");
              currentNode = nextNode;
              active.add(currentNode);
              currentNode.setAttribute("data-bound", `${sourcePath}:${linktext}`);
              currentNode.setAttribute("aria-expanded", "true");
            },
          };
        });
        const instance = {
          decorations: Decoration.none,
          update(update) {
            if (replaceOnGeometry && update?.geometryChanged) {
              replaceOnGeometry = false;
              tagName = "em";
            }
            const from = view.state.doc.toString().indexOf(alias);
            const link = {
              from,
              to: from + alias.length,
              labelFrom: from,
              labelTo: from + alias.length,
              linktext: target,
            };
            instance.decorations = enabled
              ? Decoration.set([
                  Decoration.mark({
                    tagName,
                    attributes: { "data-marginote-editor-anchor": "fixture" },
                  }).range(link.from, link.to),
                ])
              : Decoration.none;
            bindings.setAnchors(
              enabled ? new Map([["fixture", { link, sourcePath: path }]]) : new Map(),
            );
          },
          docViewUpdate() {
            bindings.schedule();
          },
          measure() {
            bindings.schedule();
          },
          destroy() {
            bindings.destroy();
          },
        };
        instance.update();
        return instance;
      },
      { decorations: (instance) => instance.decorations },
    );
    const parent = document.querySelector("main");
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: `before ${alias} after`,
        extensions: [plugin, EditorView.lineWrapping],
      }),
    });
    window.fixture = {
      view,
      snapshot: () => ({
        ...stats,
        active: active.size,
        text: view.state.doc.toString(),
        rects: [...active][0]?.getClientRects().length ?? 0,
        tag: view.contentDOM.querySelector("[data-marginote-editor-anchor]")?.tagName,
      }),
      setPath(value) {
        path = value;
        view.dispatch({});
      },
      setTarget(value) {
        target = value;
        view.dispatch({});
      },
      setEnabled(value) {
        enabled = value;
        view.dispatch({});
      },
      replaceNode() {
        const previous = view.contentDOM.querySelector("[data-marginote-editor-anchor]");
        tagName = "mark";
        view.dispatch({});
        return previous?.isConnected;
      },
      replaceDuringMeasure() {
        replaceOnGeometry = true;
        view.dom.style.width = "90px";
        view.plugin(plugin).measure();
      },
      overwriteAttributes() {
        const node = view.contentDOM.querySelector("[data-marginote-editor-anchor]");
        node.removeAttribute("aria-expanded");
        view.plugin(plugin).measure();
        return node;
      },
    };
  });
  await page.waitForFunction(() => window.fixture.snapshot().active === 1);
  const initial = await page.evaluate(() => window.fixture.snapshot());
  assert.ok(initial.rects > 1, "an inline mark must retain every wrapped line rectangle");
  assert.equal(await page.evaluate(() => window.fixture.replaceNode()), false);
  await page.waitForFunction(() => document.querySelector("mark[data-bound]"));
  const replacement = await page.evaluate(() => window.fixture.snapshot());
  assert.equal(
    replacement.released,
    0,
    "replacing the DOM of the same logical link must not close its binding",
  );
  assert.equal(replacement.bound, 1, "replacement must retain the original binding identity");
  assert.equal(replacement.retargeted, 1);
  await page.evaluate(() => window.fixture.replaceDuringMeasure());
  await page.waitForFunction(() => document.querySelector("em[data-bound]"));
  const measuredReplacement = await page.evaluate(() => window.fixture.snapshot());
  assert.equal(
    measuredReplacement.released,
    0,
    "a CM redraw between measurement read and write must retarget the latest node",
  );
  assert.equal(measuredReplacement.retargeted, 2);
  const attributes = await page.evaluate(async () => {
    const node = window.fixture.overwriteAttributes();
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    return {
      sameNode: node === document.querySelector("[data-marginote-editor-anchor]"),
      expanded: node.getAttribute("aria-expanded"),
    };
  });
  assert.equal(attributes.sameNode, true);
  assert.equal(attributes.expanded, "true", "a same-node CM rewrite must resync binding state");
  await page.evaluate(() => window.fixture.setTarget("OtherCard"));
  await page.waitForFunction(
    () => document.querySelector("[data-bound]")?.getAttribute("data-bound") === "QA.md:OtherCard",
  );
  assert.equal((await page.evaluate(() => window.fixture.snapshot())).released, 1);
  await page.evaluate(() => window.fixture.view.dispatch({ selection: { anchor: 8, head: 20 } }));
  assert.equal((await page.evaluate(() => window.fixture.snapshot())).text, initial.text);
  await page.evaluate(() => window.fixture.view.dispatch({ changes: { from: 0, insert: "🙂 " } }));
  await page.waitForFunction(() => window.fixture.snapshot().released >= 2);
  assert.equal((await page.evaluate(() => window.fixture.snapshot())).active, 1);
  await page.evaluate(() => window.fixture.setPath("Renamed.md"));
  await page.waitForFunction(
    () =>
      document.querySelector("[data-bound]")?.getAttribute("data-bound") === "Renamed.md:OtherCard",
  );
  await page.evaluate(() => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const nextDocument = frame.contentDocument;
    nextDocument.body.append(window.fixture.view.dom);
    window.fixture.view.setRoot(nextDocument);
    window.fixture.view.dispatch({});
  });
  await page.waitForFunction(() => window.fixture.snapshot().ownerChanges === 1);
  await page.evaluate(() => window.fixture.setEnabled(false));
  await page.waitForFunction(() => window.fixture.snapshot().active === 0);
  await page.evaluate(() => {
    window.fixture.setEnabled(true);
    window.fixture.view.destroy();
  });
  await page.waitForTimeout(100);
  const final = await page.evaluate(() => window.fixture.snapshot());
  assert.equal(final.active, 0, "a pending measurement must not rebind a destroyed editor");
  assert.equal(final.bound, final.released, "every created binding must be released exactly once");
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      { checks: 12, initial, replacement, measuredReplacement, attributes, final, errors },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
