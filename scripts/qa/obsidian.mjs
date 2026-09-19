import { execFileSync, spawn } from "node:child_process";
import { closeSync, constants, openSync } from "node:fs";
import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { prepareFixtures } from "./fixtures.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const qa = join(root, ".qa");
const profile = join(qa, "profile");
const vault = join(qa, "vault");
const receiptPath = join(qa, "resource-receipt.json");
const binary =
  process.env.OBSIDIAN_QA_BINARY ?? "/Applications/Obsidian.app/Contents/MacOS/Obsidian";
const port = 19222;
const endpoint = `http://127.0.0.1:${port}`;

async function receipt() {
  return JSON.parse(await readFile(receiptPath, "utf8"));
}

function ownsProcess(pid) {
  try {
    const command = execFileSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8" });
    return command.includes(binary) && command.includes(`--user-data-dir=${profile}`);
  } catch {
    return false;
  }
}

function processRows() {
  return execFileSync("ps", ["-axo", "pid=,ppid=,command="], { encoding: "utf8" })
    .trim()
    .split("\n")
    .map((line) => {
      const parts = line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/);
      if (!parts) throw new Error("Could not parse the process table.");
      return { pid: Number(parts[1]), parentPid: Number(parts[2]), command: parts[3] };
    });
}

function descendants(pid) {
  const rows = processRows();
  const owned = new Set([pid]);
  for (let changed = true; changed; ) {
    changed = false;
    for (const row of rows) {
      if (owned.has(row.parentPid) && !owned.has(row.pid)) {
        owned.add(row.pid);
        changed = true;
      }
    }
  }
  return rows.filter((row) => owned.has(row.pid));
}

async function install() {
  const plugin = join(vault, ".obsidian/plugins/marginote");
  await mkdir(plugin, { recursive: true });
  for (const file of ["main.js", "manifest.json", "styles.css"]) {
    await copyFile(join(root, file), join(plugin, file));
  }
  console.log(`Installed current build into ${plugin}`);
}

async function targets() {
  const response = await fetch(`${endpoint}/json/list`);
  if (!response.ok) throw new Error(`CDP target request failed: ${response.status}`);
  return response.json();
}

async function start() {
  await access(binary, constants.X_OK);
  try {
    const previous = await receipt();
    if (ownsProcess(previous.pid))
      throw new Error(`QA instance is already running as PID ${previous.pid}. Use status or stop.`);
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
  }
  try {
    await targets();
    throw new Error(`Port ${port} already has a CDP service; no new process was started.`);
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
  }
  await mkdir(profile, { recursive: true });
  await prepareFixtures(vault);
  await install();
  const registry = {
    vaults: { a1e7a0d11a000001: { path: vault, ts: Date.now(), open: true } },
    updateDisabled: true,
    autoUpdate: false,
  };
  await writeFile(join(profile, "obsidian.json"), JSON.stringify(registry, null, 2));
  const log = join(qa, "obsidian.log");
  const output = openSync(log, "a");
  const args = [
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    "--remote-debugging-address=127.0.0.1",
    "--no-first-run",
    "--no-default-browser-check",
  ];
  const existingUserPidsExcluded = processRows()
    .filter((row) => row.command.startsWith(binary))
    .map((row) => row.pid);
  const child = spawn(binary, args, { detached: true, stdio: ["ignore", output, output] });
  closeSync(output);
  child.unref();
  if (!child.pid) throw new Error("Obsidian did not provide a process ID.");
  const record = {
    pid: child.pid,
    binary,
    args,
    profile,
    vault,
    endpoint,
    log,
    startedAt: new Date().toISOString(),
    existingUserPidsExcluded,
    processes: [],
    status: "starting",
  };
  await writeFile(receiptPath, JSON.stringify(record, null, 2));
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (!ownsProcess(child.pid)) throw new Error(`QA process exited. Inspect ${log}.`);
    try {
      const pages = await targets();
      if (pages.some((page) => page.type === "page")) {
        record.status = "running";
        record.processes = descendants(child.pid);
        await writeFile(receiptPath, JSON.stringify(record, null, 2));
        console.log(JSON.stringify({ ...record, targets: pages }, null, 2));
        return;
      }
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
    }
    await setTimeout(500);
  }
  throw new Error(`Timed out waiting for Obsidian. Inspect ${log}.`);
}

async function stop() {
  const record = await receipt();
  if (ownsProcess(record.pid)) {
    record.processes = descendants(record.pid);
    await writeFile(receiptPath, JSON.stringify(record, null, 2));
    process.kill(record.pid, "SIGTERM");
    for (let attempt = 0; attempt < 30 && ownsProcess(record.pid); attempt += 1)
      await setTimeout(100);
    if (ownsProcess(record.pid))
      throw new Error(`QA PID ${record.pid} did not terminate; inspect it before retrying.`);
  }
  record.status = "stopped";
  record.stoppedAt = new Date().toISOString();
  await writeFile(receiptPath, JSON.stringify(record, null, 2));
  console.log(`Stopped only the recorded QA instance (${record.pid}); fixtures remain at ${vault}`);
}

async function status() {
  const record = await receipt();
  if (ownsProcess(record.pid)) {
    record.processes = descendants(record.pid);
    await writeFile(receiptPath, JSON.stringify(record, null, 2));
  }
  console.log(JSON.stringify({ receipt: record, targets: await targets() }, null, 2));
}

switch (process.argv[2] ?? "status") {
  case "start":
    await start();
    break;
  case "install":
    await install();
    break;
  case "status":
    await status();
    break;
  case "stop":
    await stop();
    break;
  default:
    throw new Error("Usage: node scripts/qa/obsidian.mjs start|install|status|stop");
}
