import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ASSET_NAMES,
  type ReleaseAssets,
  validateBundleGraph,
  validateReleaseAssets,
} from "./assets";
import { parseReleaseMetadata, ReleaseValidationError } from "./metadata";

async function json(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readAssets(directory: string): Promise<ReleaseAssets> {
  const read = async (name: string) => {
    const path = resolve(directory, name);
    if (!(await lstat(path)).isFile())
      throw new ReleaseValidationError("assets", `Release assets must be regular files: ${name}`);
    return Uint8Array.from(await readFile(path));
  };
  const [main, manifest, styles] = await Promise.all([
    read("main.js"),
    read("manifest.json"),
    read("styles.css"),
  ]);
  return { "main.js": main, "manifest.json": manifest, "styles.css": styles };
}

async function run(): Promise<void> {
  const args = process.argv.slice(2);
  let tag: string | undefined;
  let assetDirectory: string | undefined;
  for (let i = 0; i < args.length; i += 2) {
    const option = args[i];
    const value = args[i + 1];
    if (!value || (option !== "--tag" && option !== "--assets"))
      throw new ReleaseValidationError(
        "metadata",
        "Usage: validate.ts [--tag VERSION] [--assets DIR]",
      );
    if (option === "--tag") tag = value;
    else assetDirectory = value;
  }
  const root = process.cwd();
  const [manifest, pkg, versions, graph, license, zodLicense, notices, assets] = await Promise.all([
    json(resolve(root, "manifest.json")),
    json(resolve(root, "package.json")),
    json(resolve(root, "versions.json")),
    json(resolve(root, "dist/build-meta.json")),
    readFile(resolve(root, "LICENSE"), "utf8"),
    readFile(resolve(root, "node_modules/zod/LICENSE"), "utf8"),
    readFile(resolve(root, "THIRD_PARTY_NOTICES.md"), "utf8"),
    readAssets(root),
  ]);
  const metadata = parseReleaseMetadata({
    manifest,
    package: pkg,
    versions,
    ...(tag === undefined ? {} : { tag }),
  });
  if (!license.includes("Copyright (c) 2026 t1seo") || !license.startsWith("MIT License"))
    throw new ReleaseValidationError(
      "metadata",
      "LICENSE must identify the plugin's MIT copyright.",
    );
  if (!notices.includes(zodLicense.trim()))
    throw new ReleaseValidationError(
      "metadata",
      "THIRD_PARTY_NOTICES.md must contain Zod's MIT text.",
    );
  validateBundleGraph(graph);
  validateReleaseAssets(assets, [license, zodLicense]);
  if (assetDirectory)
    validateReleaseAssets(await readAssets(resolve(assetDirectory)), [license, zodLicense], assets);
  console.log(`Release ${metadata.version} passed metadata, license, bundle, and asset checks.`);
  for (const name of ASSET_NAMES) {
    const hash = createHash("sha256").update(assets[name]).digest("hex");
    console.log(`${hash}  ${name}`);
  }
}

try {
  await run();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unknown release validation failure.");
  process.exitCode = 1;
}
