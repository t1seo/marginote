import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { exportPublic, isPublicPath } from "../../scripts/release/export-public.mjs";

function fixture(run) {
  const temporary = mkdtempSync(join(tmpdir(), "marginote-export-"));
  const repository = join(temporary, "source");
  const destination = join(temporary, "public");
  mkdirSync(repository);
  const git = (...args) => execFileSync("git", ["-C", repository, ...args], { stdio: "pipe" });
  const put = (path, text) => {
    mkdirSync(dirname(join(repository, path)), { recursive: true });
    writeFileSync(join(repository, path), text);
  };
  try {
    git("init", "--initial-branch=main");
    git("config", "user.name", "Export test");
    git("config", "user.email", "export@example.invalid");
    put("README.md", "Committed public content\n");
    put("docs/references/private.md", "Private reference\n");
    put(".qa/receipt.json", "{}\n");
    git("add", ".");
    git("commit", "-m", "Fixture");
    run({ repository, destination, git, put });
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

test("public inventory includes reproducible source and English presentation assets", () => {
  for (const path of [
    "README.md",
    "bun.lock",
    ".github/workflows/check.yml",
    "src/main.ts",
    "tests/editor/unicode.test.ts",
    "assets/brand/marginote-icon.png",
    "examples/reading-vault/Start here.md",
    "docs/demo/marginote-demo.gif",
  ])
    assert.equal(isPublicPath(path), true, path);
});

test("public inventory excludes private handoff, references, profiles and traversal", () => {
  for (const path of [
    "AGENTS.md",
    "HANDOFF.md",
    "plans/global-release.md",
    ".git/config",
    "docs/references/text-card.png",
    "docs/SOURCE_ANALYSIS.md",
    ".qa/receipt.json",
    "src/.env",
    "examples/reading-vault/.obsidian/config.json",
    "src/node_modules/a.js",
    "src/../HANDOFF.md",
    "src//main.ts",
    "/src/main.ts",
    "src\\main.ts",
  ])
    assert.equal(isPublicPath(path), false, path);
});

test("export reads the committed tree without private history or uncommitted edits", () =>
  fixture((context) => {
    context.put("README.md", "Uncommitted private working text\n");
    const receipt = exportPublic({ ...context, ref: "HEAD" });
    assert.equal(
      readFileSync(join(context.destination, "README.md"), "utf8"),
      "Committed public content\n",
    );
    assert.equal(receipt.files.length, 1);
    assert.equal(receipt.files[0].sha256.length, 64);
    assert.equal(existsSync(join(context.destination, ".git")), false);
    assert.equal(existsSync(join(context.destination, "docs/references")), false);
  }));

test("an explicit private inventory is refused before any file is copied", () =>
  fixture((context) => {
    assert.throws(
      () =>
        exportPublic({
          ...context,
          ref: "HEAD",
          requestedPaths: ["README.md", ".qa/receipt.json"],
        }),
      /private or unsafe/,
    );
    assert.equal(existsSync(context.destination), false);
  }));

test("an existing destination remains untouched", () =>
  fixture((context) => {
    mkdirSync(context.destination);
    const sentinel = join(context.destination, "sentinel");
    writeFileSync(sentinel, "Keep this");
    assert.throws(() => exportPublic({ ...context, ref: "HEAD" }), /already exists/);
    assert.equal(readFileSync(sentinel, "utf8"), "Keep this");
  }));

test("a committed symlink in an allowed folder is rejected before export", () =>
  fixture((context) => {
    mkdirSync(join(context.repository, "src"));
    symlinkSync("../docs/references/private.md", join(context.repository, "src/reference.ts"));
    context.git("add", "src");
    context.git("commit", "-m", "Symlink fixture");
    assert.throws(() => exportPublic({ ...context, ref: "HEAD" }), /Only regular committed files/);
    assert.equal(existsSync(context.destination), false);
  }));

test("a requested missing file cannot silently disappear from the export", () =>
  fixture((context) => {
    assert.throws(
      () => exportPublic({ ...context, ref: "HEAD", requestedPaths: ["README.md", "LICENSE"] }),
      /missing from the selected commit/,
    );
    assert.equal(existsSync(context.destination), false);
  }));
