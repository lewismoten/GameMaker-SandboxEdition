# Package releases

The browser engine, development tools, and archive utilities have separate tagged release workflows. All publish to GitHub Packages from this repository using the automatic `GITHUB_TOKEN` with `packages: write`.

| Package | Workflow | Tag prefix |
| --- | --- | --- |
| `@lewismoten/gamemaker-sandbox-engine` | [Publish engine](../.github/workflows/publish-engine.yml) | `engine-v` |
| `@lewismoten/gamemaker-sandbox-archives` | [Publish archives](../.github/workflows/publish-archives.yml) | `archives-v` |
| `@lewismoten/gamemaker-sandbox-tools` | [Publish tools](../.github/workflows/publish-tools.yml) | `tools-v` |

The tag must point to a commit on `master`, and its version must exactly match that package's `package.json`. For example, `tools-v3.1.0` releases tools version `3.1.0`. Merge the package changes before pushing its tag. Ordinary branch pushes do not publish packages.

Each workflow checks the source and builds its package before publishing. The tools and archives workflows also verify the packed distribution in an isolated consumer. Package files carry their own license and notices. Tarballs are build artifacts and must not be committed.

Publishing uses the GitHub registry configured by the workflow and package manifest. GitHub manages package visibility and installation permissions; a new package is private by default. A publication to another registry is a separate release operation. Published versions are immutable, so changed package documentation ships with a new version.

Package READMEs describe installation through the consumer's configured npm registry. Consumers choose their registry independently of this repository's publishing automation. For GitHub Packages, configure the scope and authenticate as described in [GitHub's npm registry documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).
