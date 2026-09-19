import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import ts from "typescript";

test("given production schemas, the release bundle contains no unused runtime codecs", async () => {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const [license, zodLicense] = await Promise.all([
    readFile(new URL("../../LICENSE", import.meta.url), "utf8"),
    readFile(new URL("../../node_modules/zod/LICENSE", import.meta.url), "utf8"),
  ]);

  const result = await build({
    absWorkingDir: root,
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
    format: "cjs",
    platform: "browser",
    target: "es2021",
    outfile: "main.js",
    minify: true,
    write: false,
    banner: { js: `/*! Marginote\n${license}\nBundled dependency: Zod\n${zodLicense}*/` },
  });

  const output = result.outputFiles[0];
  if (!output) throw new TypeError("The production bundle was not generated.");
  const source = ts.createSourceFile(
    "main.js",
    output.text,
    ts.ScriptTarget.ES2021,
    true,
    ts.ScriptKind.JS,
  );
  const runtimeCodecs: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      const name = ts.isIdentifier(expression)
        ? expression.text
        : ts.isPropertyAccessExpression(expression)
          ? expression.name.text
          : ts.isElementAccessExpression(expression) &&
              ts.isStringLiteral(expression.argumentExpression)
            ? expression.argumentExpression.text
            : null;
      if (name === "atob" || name === "btoa") runtimeCodecs.push(name);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  expect(runtimeCodecs).toEqual([]);
  expect(output.text).toContain(zodLicense.trim());
});
