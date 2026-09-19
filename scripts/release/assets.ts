import { z } from "zod";
import { ReleaseValidationError } from "./metadata";

export const ASSET_NAMES = ["main.js", "manifest.json", "styles.css"] as const;
export type ReleaseAssets = Readonly<Record<(typeof ASSET_NAMES)[number], Uint8Array>>;

const bundleSchema = z.object({
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(
    z.string(),
    z.object({
      entryPoint: z.string().optional(),
      imports: z.array(z.object({ path: z.string(), external: z.boolean().optional() })),
    }),
  ),
});

export function validateReleaseAssets(
  assets: ReleaseAssets,
  notices: readonly string[],
  expected?: ReleaseAssets,
): void {
  for (const name of ASSET_NAMES) {
    if (assets[name].length === 0)
      throw new ReleaseValidationError("assets", `Release asset is empty: ${name}`);
    if (expected && !Buffer.from(assets[name]).equals(expected[name]))
      throw new ReleaseValidationError(
        "assets",
        `Downloaded asset differs from the build: ${name}`,
      );
  }
  const main = new TextDecoder().decode(assets["main.js"]);
  for (const notice of notices) {
    if (!main.includes(notice.trim()))
      throw new ReleaseValidationError(
        "assets",
        "The bundle must include every complete MIT notice.",
      );
  }
  if (/\/\/[#@]\s*sourceMappingURL=/.test(main))
    throw new ReleaseValidationError(
      "assets",
      "Release bundles must not embed development source maps.",
    );
}

export function validateBundleGraph(input: unknown): void {
  const parsed = bundleSchema.safeParse(input);
  if (!parsed.success)
    throw new ReleaseValidationError("bundle", "Build metadata is missing or malformed.");
  const host = /^(obsidian|electron|@codemirror\/[^/]+|@lezer\/[^/]+)$/;
  if (
    Object.keys(parsed.data.inputs).some((path) =>
      /(^|\/)node_modules\/(obsidian|electron|@codemirror|@lezer)\//.test(path),
    )
  )
    throw new ReleaseValidationError("bundle", "Host modules must remain external to the bundle.");
  const output = parsed.data.outputs["main.js"];
  if (output?.entryPoint !== "src/main.ts")
    throw new ReleaseValidationError("bundle", "The build must use the plugin entry point.");
  if (output.imports.some((item) => item.external !== true || !host.test(item.path)))
    throw new ReleaseValidationError("bundle", "Only host-provided modules may remain as imports.");
}
