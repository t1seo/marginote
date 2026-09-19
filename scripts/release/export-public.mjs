import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const files = new Set([
  ".gitignore",
  "README.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "package.json",
  "bun.lock",
  "manifest.json",
  "versions.json",
  "styles.css",
  "esbuild.config.mjs",
  "biome.json",
  "tsconfig.json",
  "eslint.config.mjs",
  "docs/RELEASING.md",
]);
const directories = [
  "src/",
  "tests/",
  "scripts/qa/",
  "scripts/demo/",
  "scripts/release/",
  ".github/workflows/",
  "assets/brand/",
  "examples/reading-vault/",
  "docs/demo/",
  "docs/release/",
];

export function isPublicPath(path) {
  if (path.includes("\\") || path.startsWith("/") || path.includes("\0")) return false;
  const parts = path.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) return false;
  if (parts.some((part) => part.startsWith(".") && part !== ".github" && part !== ".gitignore"))
    return false;
  if (parts.some((part) => ["node_modules", "AGENTS.md", "HANDOFF.md"].includes(part)))
    return false;
  return files.has(path) || directories.some((prefix) => path.startsWith(prefix));
}

function git(repository, args, encoding) {
  return execFileSync("git", ["-C", repository, ...args], {
    encoding,
    maxBuffer: 64 * 1024 * 1024,
  });
}

export function exportPublic({ repository, ref, destination, requestedPaths }) {
  const target = resolve(destination);
  if (existsSync(target))
    throw new Error("Export destination already exists; refusing to overwrite.");
  if (requestedPaths?.some((path) => !isPublicPath(path)))
    throw new Error("Requested inventory contains a private or unsafe path.");
  const commit = git(
    repository,
    ["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`],
    "utf8",
  ).trim();
  const rows = git(repository, ["ls-tree", "-rz", "--full-tree", commit], "utf8")
    .split("\0")
    .filter(Boolean)
    .map((row) => {
      const match = /^(\d+) (\w+) ([a-f0-9]+)\t([\s\S]+)$/.exec(row);
      if (!match) throw new Error("Unexpected Git tree record.");
      const [, mode, type, object, path] = match;
      return { mode, type, object, path };
    });
  const requested = requestedPaths ? new Set(requestedPaths) : undefined;
  const selected = rows.filter(
    ({ path }) => isPublicPath(path) && (!requested || requested.has(path)),
  );
  if (!selected.length) throw new Error("No public files found in the selected commit.");
  if (requested && selected.length !== requested.size)
    throw new Error("Requested inventory contains files missing from the selected commit.");
  for (const row of selected) {
    if (row.type !== "blob" || !["100644", "100755"].includes(row.mode))
      throw new Error(`Only regular committed files may be exported: ${row.path}`);
  }
  mkdirSync(target, { recursive: true });
  const inventory = selected.map(({ mode, object, path }) => {
    const bytes = git(repository, ["cat-file", "blob", object]);
    const output = join(target, path);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, bytes, { mode: mode === "100755" ? 0o755 : 0o644, flag: "wx" });
    return { path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
  });
  return { commit, files: inventory };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [ref, destination] = process.argv.slice(2);
  if (!ref || !destination || process.argv.length !== 4)
    throw new Error("Usage: node scripts/release/export-public.mjs <commit> <new-directory>");
  console.log(
    JSON.stringify(exportPublic({ repository: process.cwd(), ref, destination }), null, 2),
  );
}
