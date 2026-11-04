# Package releases

The browser engine, development tools, and archive utilities have separate tagged release workflows. All publish to GitHub Packages from this repository using the automatic `GITHUB_TOKEN` with `packages: write`.

| Package | Workflow | Tag prefix |
| --- | --- | --- |
| `@lewismoten/gamemaker-sandbox-engine` | [Publish engine](../.github/workflows/publish-engine.yml) | `engine-v` |
| `@lewismoten/gamemaker-sandbox-archives` | [Publish archives](../.github/workflows/publish-archives.yml) | `archives-v` |
| `@lewismoten/gamemaker-sandbox-tools` | [Publish tools](../.github/workflows/publish-tools.yml) | `tools-v` |

The tag must point to a commit on `master`, and its version must exactly match that package's `package.json`. For example, `tools-v3.1.0` releases tools version `3.1.0`. Merge the package changes before pushing its tag. Ordinary branch pushes do not publish packages.

Each workflow checks the source, builds its package, and runs `npm run test:fast` before publishing, with a five-minute job timeout. Tests measured over 50 ms are excluded by `web/test/slowTests.json`. Before tagging a release, run the full test suite and root `npm run verify:packages` locally: each package builds from a source copy outside the repository, then its tarball is tested in an isolated consumer. These longer checks do not run in GitHub Actions. Packed sibling dependencies let local verification run before new dependency versions are published. Publish dependencies first (engine, then archives, then tools), so registry installs can resolve their declared versions. Package files carry their own license and notices. Tarballs are build artifacts and must not be committed.

Publishing uses the GitHub registry configured by the workflow and package manifest. GitHub manages package visibility and installation permissions; a new package is private by default. A publication to another registry is a separate release operation. Published versions are immutable, so changed package documentation ships with a new version.

Package READMEs describe installation through the consumer's configured npm registry. Consumers choose their registry independently of this repository's publishing automation. For GitHub Packages, configure the scope and authenticate as described in [GitHub's npm registry documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).

## Release notes

Every release target has a hand-written [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) file: the site's [`CHANGELOG.md`](../CHANGELOG.md) (tags `pages-v*`) and `web/packages/<pkg>/CHANGELOG.md` (each package's `files` list ships it in the tarball, and `npm run verify:packages` checks that it does). A version is `## [x.y.z] - YYYY-MM-DD`, a one to three sentence summary, then only the sections it needs: Added, Changed, Fixed, Removed, Security. `## [Unreleased]` sits at the top, and the link references at the bottom compare tags on GitHub.

- **While you work:** a merge into `develop` that changes what users or package consumers see adds one line to the right Unreleased section (AGENTS.md).
- **Before a release:** `npm run release:draft -- <pages|engine|archives|tools>` prints a draft Unreleased body from the commits since the target's last tag (merges, formatting, tests-only, docs-only, agent-note and secret-game commits left out; commits sharing an "Area:" prefix become one line). Copy what matters into the changelog and edit it; the script never writes a file.
- **Cutting:** `npm run release:cut -- <target> <version> [date]` turns Unreleased into the dated version, fixes the link references and sets the package's `package.json` version. Commit, merge to `master`, then tag.
- **Keeping it honest:** `npm run release:check` (part of root `npm run verify`) fails when a package's `src` changed since its last tag but Unreleased lists nothing, or when the changelog's newest version is newer than `package.json`'s. For the site it only warns. A `package.json` version ahead of the changelog is fine: that is a bump waiting for its release.

Each tag workflow ends by creating the GitHub Release: the body is that version's changelog section (`scripts/release/section.mjs`), and a CycloneDX SBOM of the runtime dependencies from npm's own `npm sbom` is attached. This runs in the existing job, needs `contents: write`, and is untested until the next tag. (`npm sbom` needs the root `package.json` to have a `version`, which is why it says `0.0.0`.)

To add a release for a tag that already exists (such as `engine-v3.1.0`), run from the repository root with `gh` signed in:

```sh
node scripts/release/section.mjs web/packages/engine/CHANGELOG.md 3.1.0 > notes.md
npm sbom --sbom-format cyclonedx --package-lock-only --omit=dev -w @lewismoten/gamemaker-sandbox-engine > engine-3.1.0.sbom.cdx.json
gh release create engine-v3.1.0 --title "engine 3.1.0" --notes-file notes.md engine-3.1.0.sbom.cdx.json
```

For the site use `CHANGELOG.md` and no `-w`. The SBOM then describes the lockfile as it is now, not as it was at the tag; check out the tag first for an exact one.
