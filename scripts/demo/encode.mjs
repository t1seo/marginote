import { execFile } from "node:child_process";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const ffmpeg = "/opt/homebrew/bin/ffmpeg";
const ffprobe = "/opt/homebrew/bin/ffprobe";

async function convert(args) {
  return run(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    maxBuffer: 1024 * 1024,
  });
}

export async function encodeRecording(recording, output, markers) {
  await mkdir(output, { recursive: true });
  const mp4 = join(output, "marginote.mp4");
  const gif = join(output, "marginote.gif");
  await convert([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    recording.concatPath,
    "-vf",
    "fps=12,scale=1200:-2:flags=lanczos,format=yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-an",
    "-movflags",
    "+faststart",
    "-t",
    String(recording.cadence.elapsed),
    mp4,
  ]);
  let gifOptions = { width: 1080, fps: 12, colors: 128 };
  const makeGif = async () =>
    convert([
      "-i",
      mp4,
      "-filter_complex",
      `fps=${gifOptions.fps},scale=${gifOptions.width}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff:max_colors=${gifOptions.colors}[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
      "-loop",
      "0",
      gif,
    ]);
  await makeGif();
  if ((await stat(gif)).size > 5_000_000) {
    gifOptions = { width: 960, fps: 10, colors: 128 };
    await makeGif();
  }
  const gifBytes = (await stat(gif)).size;
  if (gifBytes > 10_000_000) throw new Error(`GIF exceeds the 10 MB limit: ${gifBytes}`);
  const posterTime = markers.find((marker) => marker.name === "nearby-text")?.seconds ?? 2;
  await convert([
    "-ss",
    String(posterTime + 0.6),
    "-i",
    mp4,
    "-frames:v",
    "1",
    join(output, "poster.png"),
  ]);
  const verification = resolve(recording.concatPath, "../verification");
  await mkdir(verification, { recursive: true });
  for (const name of [
    "nearby-text",
    "nearby-image",
    "reading-nearby-left",
    "reading-nearby-below",
    "reading-nearby-right",
    "live-preview-nearby-left",
    "live-preview-nearby-below",
    "live-preview-nearby-right",
    "hover-pinned",
    "scrolling-passages",
    "scrolled-card",
    "note-settings",
    "ordinary-note",
  ]) {
    const marker = markers.find((entry) => entry.name === name);
    if (!marker) throw new Error(`Missing recorded stage: ${name}`);
    await convert([
      "-ss",
      String(marker.seconds + 0.5),
      "-i",
      mp4,
      "-frames:v",
      "1",
      join(verification, `${name}.png`),
    ]);
  }
  const probe = await run(ffprobe, [
    "-v",
    "error",
    "-show_streams",
    "-show_format",
    "-of",
    "json",
    mp4,
  ]);
  const info = JSON.parse(probe.stdout);
  const gifProbe = JSON.parse(
    (
      await run(ffprobe, [
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-show_packets",
        "-of",
        "json",
        gif,
      ])
    ).stdout,
  );
  const frameDelays = gifProbe.packets.map((packet) => Number(packet.duration_time));
  const gifDuration = frameDelays.reduce((total, delay) => total + delay, 0);
  for (const path of [mp4, gif]) {
    await convert(["-i", path, "-f", "null", "-"]);
  }
  if (Math.abs(Number(info.format.duration) - recording.cadence.elapsed) > 1 / 12) {
    throw new Error("Encoded video duration differs from the real capture by more than one frame.");
  }
  const report = {
    capture: recording.cadence,
    markers,
    gifOptions,
    gifBytes,
    mp4: {
      bytes: (await stat(mp4)).size,
      duration: info.format.duration,
      streams: info.streams.map(({ width, height, avg_frame_rate, nb_frames }) => ({
        width,
        height,
        avg_frame_rate,
        nb_frames,
      })),
    },
    gif: {
      duration: gifProbe.format.duration,
      frameCount: frameDelays.length,
      frameDelays: [...new Set(frameDelays)],
      effectiveFps: Number((frameDelays.length / gifDuration).toFixed(6)),
      streams: gifProbe.streams.map(({ width, height, avg_frame_rate, nb_frames }) => ({
        width,
        height,
        avg_frame_rate,
        nb_frames,
      })),
    },
    fullDecode: { mp4: "passed", gif: "passed" },
    verification: relative(resolve(output, "../.."), verification),
  };
  await writeFile(join(output, "recording.json"), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}
