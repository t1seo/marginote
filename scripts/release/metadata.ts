import { z } from "zod";

const version = z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
const manifestSchema = z.strictObject({
  id: z.literal("marginote"),
  name: z.literal("Marginote"),
  version,
  minAppVersion: version,
  description: z.string().trim().min(1).max(250),
  author: z.literal("t1seo"),
  authorUrl: z.literal("https://github.com/t1seo"),
  isDesktopOnly: z.literal(true),
});
const packageSchema = z.object({
  name: z.literal("obsidian-marginote"),
  version,
  private: z.literal(true),
  license: z.literal("MIT"),
  repository: z.object({ url: z.literal("https://github.com/t1seo/marginote.git") }),
});
const versionsSchema = z.record(version, version);

export class ReleaseValidationError extends Error {
  override readonly name = "ReleaseValidationError";

  constructor(
    readonly code: "metadata" | "version" | "tag" | "assets" | "bundle",
    message: string,
  ) {
    super(message);
  }
}

export type ReleaseMetadataInput = {
  readonly manifest: unknown;
  readonly package: unknown;
  readonly versions: unknown;
  readonly tag?: string;
};

export function parseReleaseMetadata(
  input: ReleaseMetadataInput,
): Readonly<z.infer<typeof manifestSchema>> {
  const manifest = manifestSchema.safeParse(input.manifest);
  const pkg = packageSchema.safeParse(input.package);
  const versions = versionsSchema.safeParse(input.versions);
  if (!manifest.success || !pkg.success || !versions.success)
    throw new ReleaseValidationError(
      "metadata",
      "Release metadata does not match the public schema.",
    );
  if (pkg.data.version !== manifest.data.version)
    throw new ReleaseValidationError("version", "Package and manifest versions must match.");
  if (versions.data[manifest.data.version] !== manifest.data.minAppVersion)
    throw new ReleaseValidationError(
      "version",
      "versions.json must map this release to minAppVersion.",
    );
  if (input.tag !== undefined && input.tag !== manifest.data.version)
    throw new ReleaseValidationError(
      "tag",
      "Release tag must equal the manifest version without v.",
    );
  return manifest.data;
}
