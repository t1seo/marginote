import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const evidence = { started: new Date().toISOString(), suites: [] };
try {
  for (const suite of [
    "authoring",
    "previews",
    "editor",
    "interactions",
    "settings",
    "lifecycle",
  ]) {
    const started = new Date().toISOString();
    const run = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [`scripts/qa/${suite}.mjs`], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      let output = "";
      for (const stream of [child.stdout, child.stderr])
        stream.on("data", (chunk) => {
          output += chunk.toString();
          process.stdout.write(chunk);
        });
      child.on("error", reject);
      child.on("close", (code, signal) => resolve({ code, signal, output }));
    });
    const source = await readFile(`.qa/evidence/${suite}.json`, "utf8");
    await writeFile(`.qa/evidence/review-${suite}.json`, source);
    const detail = JSON.parse(source);
    evidence.suites.push({ suite, started, finished: new Date().toISOString(), ...run, detail });
    assert.equal(run.code, 0, `${suite} failed`);
    assert.deepEqual(detail.errors, [], `${suite} has console/page errors`);
    console.log(`REVIEW PASS ${suite}`);
  }
  evidence.status = "passed";
} catch (error) {
  evidence.status = "failed";
  evidence.failure = String(error);
  throw error;
} finally {
  evidence.finished = new Date().toISOString();
  await writeFile(".qa/evidence/review-suites.json", `${JSON.stringify(evidence, null, 2)}\n`);
}
