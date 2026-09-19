import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

export async function snapshotNotes(vault) {
  const snapshot = new Map();
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const path = join(directory, entry.name);
      assert.ok(!entry.isSymbolicLink(), "Refusing a symbolic link in the QA vault.");
      if (entry.isDirectory()) await visit(path);
      else
        snapshot.set(
          relative(vault, path),
          createHash("sha256")
            .update(await readFile(path))
            .digest("hex"),
        );
    }
  }
  await visit(vault);
  return snapshot;
}

export async function assertNotesUnchanged(vault, snapshot) {
  const after = await snapshotNotes(vault);
  for (const [path, hash] of snapshot) {
    assert.equal(after.get(path), hash, `The demo must preserve existing file ${path}`);
  }
  return { originalFiles: snapshot.size, unchanged: true, newFiles: after.size - snapshot.size };
}
