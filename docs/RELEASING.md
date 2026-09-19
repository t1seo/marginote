# Releasing Marginote

The public source repository is `t1seo/marginote`. Release tags must match the manifest version exactly, for example `0.1.2`, without a `v` prefix.

## Prepare and verify

1. Update `package.json`, `manifest.json`, and the entry in `versions.json` together. Keep the minimum supported Obsidian version honest.
2. Update `CHANGELOG.md`, English user documentation, and any affected sample/demo assets.
3. Run `bun install --frozen-lockfile` and `bun run check:release`.
4. Test the candidate in an isolated Obsidian vault, including the behavior changed in this version. Preserve the recorded application/version, source hashes, and limitations.
5. Review the diff and verify CI on the exact main commit before creating a tag.

For Reading view document ownership, run `node tests/reading/adoption.browser.mjs` with Google Chrome installed. This exercises real DOM adoption and MutationObserver delivery with a small host-lifecycle fixture. It is separate from the Bun unit-test count. In the owned isolated Obsidian instance, also run `node scripts/qa/reading-popout.mjs` alongside the maintained application suites: this verifies actual pop-out ownership, Escape/focus, outside-click dismissal, and hover. A passing browser fixture does not replace this application check.

For proximity behavior, run `node tests/ui/nearby.browser.mjs` with Google Chrome installed, then `node scripts/qa/nearby.mjs` in the owned isolated Obsidian instance. Check distant activation, measurable card movement, scrolling with no new pointer input, selection and Escape suppression in both Reading View and Live Preview. Fresh settings must select **Near text · follows pointer**; saved stationary-hover and explicit-only choices must survive an upgrade.

For settings, run `node tests/settings/definitions.browser.mjs`, then verify the legacy panel in Obsidian 1.10.6 and real settings search in 1.13 or later. Search before first opening the plugin tab, change both controls, and check immediate behavior, persistence, save failure, and cleanup after settings or a window closes. The browser substitute does not establish host integration.

## Publish installation assets

Push the matching version tag to the public repository. The release workflow builds the tagged source with the frozen lockfile and attaches:

- `main.js`
- `manifest.json`
- `styles.css`

Keep the release description in English. State new behavior, compatibility, installation instructions, and material limitations. Source archives alone are not sufficient for Obsidian installation.

Starting with 0.1.2, the tag workflow also creates GitHub build attestations for all three assets. It verifies the emitted bundle before publishing, then checks the downloaded bytes and public attestations against the repository, workflow, tag and source commit. Attestations use GitHub's API and are not extra installation attachments. If the workflow fails after creating the release, inspect the existing release before retrying; never replace its assets blindly.

Download all three published assets again. Compare their SHA-256 hashes with the verified tagged build, then install those downloaded files into a separate test vault. Do not replace them with a later local build while testing. Confirm fresh enable, both supported views, all card kinds, ordinary-note previews, settings persistence, editing preservation, and window cleanup.

If a published version needs a correction, increment the patch version and publish a new tag. Do not silently retag or replace an already published release.

## Community directory

The current submission route is the [Obsidian Community directory](https://community.obsidian.md), using an Obsidian account connected to the repository owner's GitHub account. Follow the official [submission guide](https://docs.obsidian.md/plugins/releasing/submit-plugin).

For the initial submission, add `https://github.com/t1seo/marginote` as a new plugin. Review the live form's developer-policy and ongoing-support requirements. Use the Marginote icon, English listing copy, and actual desktop screenshots. After submission, inspect manifest, release assets, source, and build-verification results. Fix actionable errors, publish a new version when required, and request a fresh review.

Distinguish a GitHub release, a submitted entry, a passed automated review, and a published/installable Community listing. Record only observed states in [the submission record](release/submission.md). Do not use the obsolete plugin-list pull-request route.

## Publication boundaries

Only reviewed source, English documentation, original branding, and original sample assets belong in this public repository. Development profiles, personal vault data, original editorial/reference images, credentials, private handoffs, and private Git history are excluded. The release workflow does not access any private source repository.
