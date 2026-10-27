# `hostedPlayer/`: the web player

Part of the [source map](../README.md).

The web player
([`docs/web-player.md`](../../../docs/web-player.md)), built into one file (`web-player.html`, and
`player/` with a `games.json` of the site's games): `main.ts` starts it, `list.ts` reads
`games.json` and `?game=`, `load.ts` fetches a game's files from its folder (the `.gam` names
them, as in `linkIn/fetchGame.ts`), `saves.ts` keeps what games write in IndexedDB, `bundle.ts`
exports and imports saves as a zip, and `page.ts` draws the list, the how-to and the saves.
