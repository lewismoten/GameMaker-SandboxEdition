# Contributing

This is a one-maintainer project, and much of its code is written with AI assistance.
[AGENTS.md](AGENTS.md) is the full contract for people and agents alike; this page is the short
version. Questions and ideas are welcome as GitHub issues.

## Setup

```sh
npm ci            # from the repository root; links the workspaces and builds the games
cd web && npm run dev
```

## Branches

`master` holds releases and `develop` collects finished work. Nobody commits on either. Start a
`feature/<short-name>` branch from an up-to-date `develop`, commit small and often (one feature
or one game per commit), push the branch, and merge it back into `develop` with `--no-ff`. A pull
request into `master` is opened only when the maintainer says it is time. Open pull requests
against `lewismoten/GameMaker-SandboxEdition`, not the upstream repository. Never force-push.

## Before you push

From `web/`:

```sh
npm run format
npm run lint
npx tsc --noEmit -p .
npx vitest run
```

`npm run verify:changed` checks changed files and related tests and typechecks the whole project, and root
`npm run verify` runs everything. If you changed a game, rebuild it and run
`npm run check:games -- --game <id>`; it also checks that two independent builds match byte for
byte. Generated `disk/` folders are never committed. Bump the game's `"version"` in `about.json`
once if its built content changed since the last push to `master`.

## Release notes

For a change users or package consumers see, add a Markdown file under
`changes/unreleased/<target>/`. Choose `pages` for the site or `engine`, `archives`, or
`tools` for the package. Give the file a unique name and write one category heading, a blank
line, and one single-line bullet in plain US English. The release command collects the
fragments into the changelog. See the [release guide](docs/package-releases.md).

## Credits

Credit anything that is not this project's own, as soon as you use it: third-party code or
data (with its license, in [NOTICE.md](NOTICE.md)), every AI tool or model that made anything,
and source material. Do not edit `code/`, `cd/` or `runtime/`: they are the original release.
