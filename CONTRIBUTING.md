# Contributing to Marginote

Start with an issue describing the reading or editing task you want to improve. Include a small example note and expected behavior without sharing personal vault contents.

## Local development

Use Bun 1.3.14 and a desktop installation of Obsidian. Install the pinned dependencies and run the full release gate:

```sh
bun install --frozen-lockfile
bun run check:release
```

`bun run check` runs Biome, regression tests, strict TypeScript checking, and the production build. `bun run lint:obsidian` runs the official Obsidian rules. `bun run validate:release` checks the release metadata and generated installation files. The native TypeScript 7 compiler and the compiler API used by the lint tooling are pinned separately for compatibility.

Run `bun run dev` to watch source changes. Stop the watcher when you finish.

## Test in a separate vault

Use a copy of [the sample vault](examples/reading-vault). Copy `main.js`, `manifest.json`, and `styles.css` into its `.obsidian/plugins/marginote/` folder and enable the plugin there.

The macOS automation under [scripts/qa](scripts/qa/README.md) launches the installed Obsidian app with a separate profile and vault under `.qa/`. It validates the runtime vault path before interaction. Do not point these tools at a personal vault. Stop the recorded instance with `node scripts/qa/obsidian.mjs stop` when finished.

## Implementation boundaries

- Preserve strict typing and the Bun lockfile. Obsidian, CodeMirror, and Lezer are supplied by the host and stay external to the bundle.
- Bind DOM work to the owning document and window. Register listeners, observers, and overlays with their component lifecycle.
- Preserve source text, selection, composition input, and native link navigation.
- Never automatically delete user cards or images. Add a meaningful regression when behavior changes.
- Check Reading view and Live Preview, ordinary-note and annotation modes, dark/light appearance, and pop-out windows when relevant.
- Keep public examples, README files, and demonstration captions in English. Keep multilingual regression fixtures that verify real user input.

See [release instructions](docs/RELEASING.md) and the [verification record](docs/release/verification.md) for the tested scope.
