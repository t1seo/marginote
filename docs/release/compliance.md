# Release compliance

This is the local release-preparation checkpoint for Marginote 0.1.0, verified
on September 19, 2026. Publishing, downloaded-release testing, and Community
directory review are separate steps recorded in the release verification and
submission documents.

## Checks performed

| Check | Observed result |
| --- | --- |
| `bun install --frozen-lockfile` | Passed without lockfile changes |
| `bun run check:release` | Passed Biome, 268 tests / 325 assertions, TypeScript 7.0.2, production build, official Obsidian lint, and release validation |
| `bun run lint:obsidian` | Zero errors and zero warnings under the configuration below |
| `bun run validate:release --tag 0.1.0` | Passed metadata, compatibility mapping, license, bundle boundary, and asset checks |
| Release validator CLI | Five scenarios passed: matching copied assets; rejected prefixed tag, wrong tag, changed byte, and empty asset |
| `bun audit --production` | No vulnerabilities reported for runtime dependencies |
| `git diff --check` | Passed |

The 25 new release tests cover version/tag mismatches, compatibility mappings,
publication metadata, missing license text, modified assets, development source
maps, and bundled host modules. The metadata tests first exposed seven failures
before consistency checks were added. Validation of the previous production
bundle failed because its complete Zod MIT notice was missing; the new build
passed the same check.

The CLI asset scenarios used a local copy of the build. They do not constitute
verification of a GitHub download or an Obsidian installation. Those checks
must run against the published assets before the release is reported verified.

## Official lint configuration

Obsidian recommends its maintained ESLint plugin for pre-submission checks.
Marginote uses `eslint-plugin-obsidianmd` 0.4.2's complete recommended config,
including type-aware checks, on `src/` and `package.json`. ESLint 9.39.5 and
typescript-eslint 8.70.0 are pinned in the lockfile.
See the [official plugin configuration](https://github.com/obsidianmd/eslint-plugin/blob/d7e223960226cf747549c5b21313bd187113640e/docs/configuration.md)
and [Community directory FAQ](https://docs.obsidian.md/community-directory/faq).

There is one deliberately scoped rule exception:
`settings-tab/prefer-setting-definitions` is disabled only in `src/settings.ts`.
The release retains the settings API tested on the minimum supported Obsidian
1.10.6. The newer 1.13 settings-search API has not received real-app coverage;
Marginote does not claim its settings are indexed by that newer search UI.
No security rule is disabled. Product names and keyboard key names are declared
for sentence-case checking; ordinary uses of “cursor” are not treated as the
Cursor editor brand.

The recommended package does not apply its manifest/license rules to those
files automatically. `validate:release` therefore separately checks the actual
manifest schema, package identity, stable version, desktop flag, repository,
license, and version-to-minimum-app mapping. This is a project check, not a
claim that the official scanner has reviewed the submission.

The first lint attempt demonstrated that the TypeScript 7 API is unsupported
by typescript-eslint. The build still runs the pinned native TypeScript 7.0.2
compiler explicitly; TypeScript 6.0.3 supplies the API used by ESLint. This follows
Microsoft's [side-by-side compiler guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0).
The explicit binary path avoids ambiguity between the installed compiler CLIs.

## Release artifacts and licensing

The release tag is `0.1.0`, without a `v` prefix. The required assets are
`main.js`, `manifest.json`, and `styles.css`. The MIT license covers the plugin;
the complete plugin and Zod MIT notices are embedded in `main.js`, and Zod's
notice is also retained in `THIRD_PARTY_NOTICES.md`.

The checked esbuild graph bundles only Zod as an external dependency. Obsidian,
CodeMirror, Lezer, and Electron remain host-provided. An unexpected runtime
import, a bundled host copy, or an inline development source map fails release
validation. The current production bundle is 497,714 bytes.

| Asset | SHA-256 at this checkpoint |
| --- | --- |
| `main.js` | `d6b570084aba3fce81c7bdf6b460624e14481324fd9e03dbd015647f5855a4d0` |
| `manifest.json` | `e554d8b3d16a8742bb848253cdd716a9f2690a08219db445234094141bd37594` |
| `styles.css` | `7aaec227bd5a3e1069419300f2e7c1cefdaeaa237e257afd315509a0a432cfd1` |

The release workflow runs only in `t1seo/marginote`, uses SHA-pinned actions,
installs from the frozen Bun lockfile, runs `check:release`, verifies the tag,
and publishes the three assets with the English changelog. The ordinary check
workflow also runs `check:release`. The package remains `private: true` to
prevent accidental npm publication.

## Remaining verification boundary

These results do not certify all Obsidian versions, themes, operating systems,
physical input devices, or the Community directory's review outcome. Actual-app
regressions must include Reading View, Live Preview, card authoring, and pop-out
windows because the lint fixes replaced native element factories with host DOM
helpers that preserve the owning document. No minimum-version or mobile-support
claim was expanded for this release.
