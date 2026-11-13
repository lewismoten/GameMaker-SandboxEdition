# `hostedPlayer/`: the web player

Part of the [source map](../README.md).

The web player ([`docs/web-player.md`](../../../docs/web-player.md)) plays game folders on a
web host. [`scripts/hostedPlayerBuild.ts`](../../scripts/hostedPlayerBuild.ts) bundles the
player, styles and audio worklet into `web-player.html`; game data stays outside that file.
A production build also emits `player/index.html` and `player/games.json` for trying the
site's catalog. The development plugin serves the player pages on demand without that list.

- `main.ts`: loads the list, selects a game and mounts the shared player.
- `list.ts`: validates `games.json`, resolves its folders and handles `?list=` and `?game=`.
- `load.ts`: fetches the `.gam` and its dependencies through `linkIn/fetchGame.ts`, then tries
  extra listed files and author notices beside it. Optional extras can be absent.
- `saves.ts`: keeps game-written files under the game ID in the origin's `gamemaker-web-player`
  IndexedDB database. If the database cannot open, saves last only in memory for the visit.
  Later transaction failures are logged; successful database opening is not a guarantee that
  every write succeeds.
- `bundle.ts`: exports saves as a ZIP with one folder per game ID, and reads that layout back.
- `page.ts`: draws the list, the how-to and save controls. Import merges files into existing
  saves, replacing matching filenames; it does not erase unmentioned files.
