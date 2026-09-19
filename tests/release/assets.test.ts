import { describe, expect, test } from "bun:test";
import {
  type ReleaseAssets,
  validateBundleGraph,
  validateReleaseAssets,
} from "../../scripts/release/assets";

const encode = (text: string) => new TextEncoder().encode(text);
const notices = ["MIT License\nCopyright (c) Author\nFull terms."] as const;
const assets: ReleaseAssets = {
  "main.js": encode(`/*! ${notices[0]} */\nmodule.exports = {};`),
  "manifest.json": encode('{"version":"0.1.0"}'),
  "styles.css": encode(".marginote-card {}"),
};
const graph = {
  inputs: { "src/main.ts": {}, "node_modules/zod/index.js": {} },
  outputs: {
    "main.js": {
      entryPoint: "src/main.ts",
      imports: [
        { path: "obsidian", external: true },
        { path: "@codemirror/state", external: true },
      ],
    },
  },
} as const;

describe("release assets", () => {
  test("accepts matching assets with complete license terms", () => {
    expect(() => validateReleaseAssets(assets, notices, assets)).not.toThrow();
  });

  test.each(["main.js", "manifest.json", "styles.css"] as const)(
    "rejects an empty %s asset",
    (name) => {
      expect(() => validateReleaseAssets({ ...assets, [name]: encode("") }, notices)).toThrow(
        "Release asset is empty",
      );
    },
  );

  test("rejects a license banner containing only the copyright line", () => {
    expect(() =>
      validateReleaseAssets(
        { ...assets, "main.js": encode("/*! Copyright (c) Author */") },
        notices,
      ),
    ).toThrow("complete MIT notice");
  });

  test("rejects a downloaded file that differs by one byte", () => {
    expect(() =>
      validateReleaseAssets(
        { ...assets, "styles.css": encode(".marginote-card { }") },
        notices,
        assets,
      ),
    ).toThrow("Downloaded asset differs");
  });

  test("rejects a development bundle with an inline source map", () => {
    expect(() =>
      validateReleaseAssets(
        {
          ...assets,
          "main.js": encode(`${notices[0]}\n//# sourceMappingURL=data:application/json`),
        },
        notices,
      ),
    ).toThrow("source maps");
  });
});

describe("host bundle boundary", () => {
  test("accepts bundled runtime dependencies and external host modules", () => {
    expect(() => validateBundleGraph(graph)).not.toThrow();
  });

  test.each(["obsidian", "@codemirror/view", "@lezer/common"])(
    "rejects a bundled host copy: %s",
    (name) => {
      expect(() =>
        validateBundleGraph({ ...graph, inputs: { [`node_modules/${name}/index.js`]: {} } }),
      ).toThrow("Host modules must remain external");
    },
  );

  test("rejects an unbundled runtime dependency unavailable in the host", () => {
    expect(() =>
      validateBundleGraph({
        ...graph,
        outputs: {
          "main.js": { entryPoint: "src/main.ts", imports: [{ path: "zod", external: true }] },
        },
      }),
    ).toThrow("Only host-provided modules");
  });

  test("rejects output built from a different entry point", () => {
    expect(() =>
      validateBundleGraph({
        ...graph,
        outputs: { "main.js": { entryPoint: "tests/fixture.ts", imports: [] } },
      }),
    ).toThrow("plugin entry point");
  });
});
