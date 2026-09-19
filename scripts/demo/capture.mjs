import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function startRecording(page, directory) {
  const framesDirectory = join(directory, "frames");
  await mkdir(framesDirectory, { recursive: true });
  const client = await page.context().newCDPSession(page);
  await client.send("Page.enable");
  const frames = [];
  const pending = new Set();
  const failures = [];
  const started = performance.now();
  const receive = (event) => {
    const index = frames.length;
    const filename = join(framesDirectory, `${String(index).padStart(5, "0")}.jpg`);
    frames.push({ filename, timestamp: event.metadata.timestamp, received: performance.now() });
    const work = writeFile(filename, Buffer.from(event.data, "base64"))
      .then(() => client.send("Page.screencastFrameAck", { sessionId: event.sessionId }))
      .catch((error) => failures.push(String(error)))
      .finally(() => pending.delete(work));
    pending.add(work);
  };
  client.on("Page.screencastFrame", receive);
  await client.send("Page.startScreencast", {
    format: "jpeg",
    quality: 85,
    maxWidth: 1200,
    maxHeight: 800,
    everyNthFrame: 1,
  });
  let stopping;
  const finish = async () => {
    const elapsed = (performance.now() - started) / 1000;
    await client.send("Page.stopScreencast");
    client.off("Page.screencastFrame", receive);
    await Promise.all(pending);
    await client.detach();
    if (failures.length) throw new Error(`Screencast frame failures: ${failures.join("; ")}`);
    if (frames.length < 3) throw new Error("CDP returned fewer than three real frames.");
    const timeline = [...frames].sort((first, second) => first.timestamp - second.timestamp);
    const first = timeline[0].timestamp;
    if (!Number.isFinite(first)) throw new Error("CDP frame timestamps are unavailable.");
    const durations = timeline.map((frame, index) => {
      const next = timeline[index + 1];
      return next
        ? Math.max(0.001, next.timestamp - frame.timestamp)
        : Math.max(0.083, elapsed - (frame.timestamp - first));
    });
    const quote = (value) => value.replaceAll("'", "'\\''");
    const concat = ["ffconcat version 1.0"];
    for (const [index, frame] of timeline.entries()) {
      concat.push(
        `file '${quote(frame.filename)}'`,
        "option framerate 1000",
        `duration ${durations[index].toFixed(6)}`,
      );
    }
    concat.push(`file '${quote(timeline.at(-1).filename)}'`, "option framerate 1000");
    const concatPath = join(directory, "frames.ffconcat");
    await writeFile(concatPath, `${concat.join("\n")}\n`);
    const cadence = {
      elapsed,
      frameCount: frames.length,
      firstTimestamp: first,
      lastTimestamp: timeline.at(-1).timestamp,
      averageCaptureFps: frames.length / elapsed,
      maximumFrameGap: Math.max(...durations),
    };
    await writeFile(
      join(directory, "capture.json"),
      JSON.stringify({ cadence, frames, durations }, null, 2),
    );
    return { concatPath, cadence };
  };
  return {
    elapsed: () => (performance.now() - started) / 1000,
    stop() {
      stopping ??= finish();
      return stopping;
    },
  };
}
