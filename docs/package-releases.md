# Package releases

The browser engine, development tools, and archive utilities share one tagged release workflow, [Publish packages](../.github/workflows/publish-packages.yml). It publishes to GitHub Packages from this repository using the automatic `GITHUB_TOKEN` with `packages: write`.

| Package                                  | Tag prefix   |
| ---------------------------------------- | ------------ |
| `@lewismoten/gamemaker-sandbox-engine`   | `engine-v`   |
| `@lewismoten/gamemaker-sandbox-archives` | `archives-v` |
| `@lewismoten/gamemaker-sandbox-tools`    | `tools-v`    |

The tag must point to a commit on `master`, and its version must exactly match that package's `package.json`. For example, `tools-v3.1.0` releases tools version `3.1.0`. Merge the package changes before pushing its tag. Ordinary branch pushes do not publish packages.

The job installs once (`npm ci --ignore-scripts`, then `build:packages`), type-checks the whole web project, runs `npm run test:fast` on the test paths selected for the packages it will publish, publishes them and creates their GitHub Releases, with a five-minute job timeout. The selected paths include shared engine, audio and format tests; this is not the full local suite. Format and lint are not repeated there: root `npm run verify` runs them before you tag. Tag all the packages of a release at the same commit and push the tags together: each tag starts a run, the run for the first of them (engine, archives, tools) publishes every package tagged at that commit that has no Release yet, and the others finish in seconds (they still bill a minute each). The publish job builds no game disks (`GM_SKIP_GAME_BUILD`), so a test that reads `games/*/disk` must skip when those files are missing (`it.skipIf`, as `fliPlaygame.test.ts` does). Tests measured over 50 ms are excluded by `web/test/slowTests.json`. Before tagging a release, run the full test suite and root `npm run verify:packages` locally: each package builds from a source copy outside the repository, then its tarball is tested in an isolated consumer. These longer checks do not run in GitHub Actions. Packed sibling dependencies let local verification run before new dependency versions are published. Publish dependencies first (engine, then archives, then tools; the workflow does so), so registry installs can resolve their declared versions. Package files carry their own license and notices. Tarballs are build artifacts and must not be committed.

Publishing uses the GitHub registry configured by the workflow and package manifest. GitHub manages package visibility and installation permissions; a new package is private by default. A publication to another registry is a separate release operation. Do not replace a published version; ship changed package documentation with a new version.

Package READMEs describe installation through the consumer's configured npm registry. Consumers choose their registry independently of this repository's publishing automation. For GitHub Packages, configure the scope and authenticate as described in [GitHub's npm registry documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).

## Release notes

Every release target has a hand-written [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) file: the site's [`CHANGELOG.md`](../CHANGELOG.md) (tags `pages-v*`) and `web/packages/<pkg>/CHANGELOG.md` (each package's `files` list ships it in the tarball, and `npm run verify:packages` checks that it does). A version is `## [x.y.z] - YYYY-MM-DD`, a one to three sentence summary, then only the sections it needs: Added, Changed, Fixed, Removed, Security. `## [Unreleased]` sits at the top, and the link references at the bottom compare tags on GitHub.

- **While you work:** a change that users or package consumers see adds one file at `changes/unreleased/<target>/<branch-or-slug>.md` (targets: `pages`, `engine`, `archives`, `tools`). Choose a unique slug. Use one category heading (`### Added`, `Changed`, `Fixed`, `Removed`, or `Security`), a blank line, then one `- ` bullet on a single line. Plain words, US English, one voice, no secret games. Do not edit the shared changelog on a feature branch. Internal tooling changes need no fragment. See [the fragment README](../changes/README.md).
- **Before a release:** `npm run release:draft -- <pages|engine|archives|tools>` prints pending fragments (sorted by filename within categories) together with existing Unreleased notes, then separately labeled suggestions from the commits since the target's last tag (merges, formatting, tests-only, docs-only, agent-note and secret-game commits left out; commits sharing an "Area:" prefix become one line). Review the suggestions against the pending notes to avoid duplicates; the script never writes a file.
- **Cutting:** `npm run release:cut -- <target> <version> [date]` combines the target’s fragments with existing Unreleased lines, turns that body into the dated version, fixes the link references and sets the package's `package.json` version. After successful writes it removes only the collected fragments for that target. Version and pending-note validation happens before any output is written; the changelog and manifest writes are sequential, not an atomic transaction if a filesystem write fails.
- **Short section, full list:** a changelog version shows only a summary and the most important changes (about 8 to 15 bullets for the site, fewer for a package, under the usual headings). Move every collected bullet, with the summary, into `changes/release/<target>/<version>.md` (for example `changes/release/pages/3.2.0.md` or `changes/release/engine/3.3.0.md`). End the short section with a line that links to that file at its tag by absolute URL: `Full list: [changes/release/pages/3.2.0.md](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/pages-v3.2.0/changes/release/pages/3.2.0.md)`. The absolute URL works on GitHub, in a GitHub Release body (`section.mjs` prints the short section) and on npm, so the package tarballs ship only their `CHANGELOG.md`. The link resolves once the tag is pushed. Review and commit the changelogs, the full lists, the manifests and the fragment deletions together, merge to `master`, then tag.
- **Keeping it honest:** `npm run release:check` (part of root `npm run verify`) fails when a package's `src` changed since its last tag but neither fragments nor Unreleased list a change, or when the changelog's newest version is newer than `package.json`'s. Missing release notes for site changes produce only a warning. A malformed fragment fails the check for any target, including the site. A `package.json` version ahead of the changelog is fine until that version is tagged; a tag whose version is missing from the changelog fails the check. A version cut but not yet tagged covers the commits since the last tag, so the check passes between `release:cut` and the tag.

The workflow ends each package by creating its GitHub Release: the body is that version's changelog section (`scripts/release/section.mjs`), and a CycloneDX SBOM of the runtime dependencies from npm's own `npm sbom` is attached. This runs in the same job and needs `contents: write`. (`npm sbom` needs the root `package.json` to have a `version`, which is why it says `0.0.0`.)

`npm run release:sbom -- <pages|engine|archives|tools> [version] [--out file]` runs that same `npm sbom` for a target and writes `release-out/<target>-<version>.sbom.cdx.json` (git-ignored; the site's version defaults to `next`). Use it for the site's release, and to look at a package's SBOM before the tag; the workflow still makes the packages' own. `release:cut` prints the command when it finishes.

To add a release for a tag that already exists (such as `engine-v3.1.0`), run from the repository root with `gh` signed in:

```sh
node scripts/release/section.mjs web/packages/engine/CHANGELOG.md 3.1.0 > notes.md
npm sbom --sbom-format cyclonedx --package-lock-only --omit=dev -w @lewismoten/gamemaker-sandbox-engine > engine-3.1.0.sbom.cdx.json
gh release create engine-v3.1.0 --title "engine 3.1.0" --notes-file notes.md engine-3.1.0.sbom.cdx.json
```

For the site use `CHANGELOG.md` and no `-w`. The SBOM then describes the lockfile as it is now, not as it was at the tag; check out the tag first for an exact one.

## Sizes

`npm run release:sizes -- [--dist <site build>] [--packages] [--downloads <folder>]` checks what a release distributes against `scripts/release/size-budgets.json`: the Pages artifact (total, a few large folders, the biggest file and the biggest game ZIP), its offline copy (`offline.json`), each npm tarball, and the native downloads. It prints a table and exits 1 over a budget. `npm run release:pages` runs it on the site build before making the gh-pages commit, the downloads workflow on its files, and `npm run verify:packages` holds each packed tarball to the same limits. Raise a budget only on purpose, with the reason in the commit.

## Publishing the site (gh-pages)

The site is served from the `gh-pages` branch, which holds one commit: the finished `web/dist` of a release, built on the Mac (no GitHub Actions workflow builds or deploys it). In the repository settings, **Pages → Source** is **Deploy from a branch**, `gh-pages`, `/ (root)`.

`npm run release:pages -- pages-vX.Y.Z` (`scripts/release/publish-pages.mjs`; run it through `npm run heavy --`) takes a tag that is on `master`, checks it out in a clean temporary worktree, runs `npm ci` (which builds the packages), builds every game from nothing (trinkets, laser nickels and Depth's frames included) and the site, runs `release:sizes` on it, adds `.nojekyll`, and writes one orphan commit, "Site pages-vX.Y.Z from <sha>", whose tree is the built site. By default it only prints that commit and the push it would make. With `--push` it pushes the commit to `gh-pages` with `--force-with-lease`, and only when `.for-lewis/release/SUPERVISED` exists in the main checkout (the maintainer's file, ignored by version control and never in a worktree; the script finds the main checkout through the repository's common directory, `scripts/release/supervised.mjs`, so running it from an agent's worktree sees it too) and names that tag: `gh-pages` changes only during a release under the maintainer's direct supervision, and agents never create that file. `--keep` leaves the temporary worktree for a look. Earlier `gh-pages` commits stay in the repository's history after a force-push; the branch shows anyone exactly what is deployed.

After the push, make the site's GitHub Release from its changelog section:

```sh
node scripts/release/section.mjs CHANGELOG.md 3.2.0 > notes.md
npm sbom --sbom-format cyclonedx --package-lock-only --omit=dev > pages-3.2.0.sbom.cdx.json
gh release create pages-v3.2.0 --title "Site 3.2.0" --notes-file notes.md pages-3.2.0.sbom.cdx.json
```

Native downloads (Mac, Windows, Linux) are one job, `.github/workflows/downloads.yml`, run by hand with a release tag. `win-exe.yml` and `linux-tar.yml` only try one game on a real Windows or Linux machine, by hand.
