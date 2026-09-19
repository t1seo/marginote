import { mkdir, readFile, writeFile } from "node:fs/promises";
import { build, context } from "esbuild";

const license = await readFile(new URL("./LICENSE", import.meta.url), "utf8");
const zodLicense = await readFile(new URL("./node_modules/zod/LICENSE", import.meta.url), "utf8");
const options = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
  format: "cjs",
  platform: "browser",
  target: "es2021",
  outfile: "main.js",
  logLevel: "info",
  banner: { js: `/*! Marginote\n${license}\nBundled dependency: Zod\n${zodLicense}*/` },
};

if (process.argv.includes("--watch")) {
  const watcher = await context({ ...options, sourcemap: "inline" });
  await watcher.watch();
} else {
  const result = await build({ ...options, minify: true, metafile: true });
  await mkdir(new URL("./dist", import.meta.url), { recursive: true });
  await writeFile(
    new URL("./dist/build-meta.json", import.meta.url),
    JSON.stringify(result.metafile),
  );
}
