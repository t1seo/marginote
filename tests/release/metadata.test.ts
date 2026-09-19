import { describe, expect, test } from "bun:test";
import { parseReleaseMetadata } from "../../scripts/release/metadata";

const manifest = {
  id: "marginote",
  name: "Marginote",
  version: "0.1.0",
  minAppVersion: "1.10.6",
  description: "Connected cards in your notes.",
  author: "t1seo",
  authorUrl: "https://github.com/t1seo",
  isDesktopOnly: true,
} as const;
const pkg = {
  name: "obsidian-marginote",
  version: "0.1.0",
  private: true,
  license: "MIT",
  repository: { url: "https://github.com/t1seo/marginote.git" },
} as const;
const input = {
  manifest,
  package: pkg,
  versions: { "0.1.0": "1.10.6" },
} as const;

describe("public release metadata", () => {
  test("accepts matching stable metadata and tag", () => {
    expect(parseReleaseMetadata({ ...input, tag: "0.1.0" }).version).toBe("0.1.0");
  });

  test("rejects a package version that differs from the installed manifest", () => {
    expect(() => parseReleaseMetadata({ ...input, package: { ...pkg, version: "0.2.0" } })).toThrow(
      "Package and manifest versions must match",
    );
  });

  test("rejects a missing current compatibility mapping", () => {
    expect(() => parseReleaseMetadata({ ...input, versions: { "0.0.1": "1.10.6" } })).toThrow(
      "versions.json must map",
    );
  });

  test("rejects a minimum app version inconsistent with the compatibility mapping", () => {
    expect(() => parseReleaseMetadata({ ...input, versions: { "0.1.0": "1.11.0" } })).toThrow(
      "versions.json must map",
    );
  });

  test.each(["v0.1.0", "0.2.0", "0.1.0-beta.1", "0.1.0\n"])(
    "rejects a mismatched or prefixed tag: %s",
    (tag) => {
      expect(() => parseReleaseMetadata({ ...input, tag })).toThrow("Release tag must equal");
    },
  );

  test("rejects accidentally enabled npm publication", () => {
    expect(() => parseReleaseMetadata({ ...input, package: { ...pkg, private: false } })).toThrow();
  });

  test("rejects unverified mobile compatibility", () => {
    expect(() =>
      parseReleaseMetadata({ ...input, manifest: { ...manifest, isDesktopOnly: false } }),
    ).toThrow();
  });

  test("rejects a private repository URL in public metadata", () => {
    expect(() =>
      parseReleaseMetadata({
        ...input,
        package: {
          ...pkg,
          repository: { url: "https://github.com/example/private-development.git" },
        },
      }),
    ).toThrow();
  });

  test("rejects unsupported manifest keys before release", () => {
    expect(() =>
      parseReleaseMetadata({ ...input, manifest: { ...manifest, debug: true } }),
    ).toThrow();
  });
});
