# Game distribution ZIPs

A production website build publishes one ZIP for each game at a permanent URL, for example:

```text
games/gameware/nebula/nebula.zip
games/originals/teddy/teddy.zip
```

A link serves the current release of that game. Its URL stays the same when game files,
player settings or the website change. ZIP filenames use the first eight characters of
the catalog ID, or the game's `dosName` when its `about.json` has one (the id is
longer than 8 characters or has a hyphen: `keys-and-doors` is `KEYSDOOR`, `reckoning` is
`RECKON`). Every native file inside also follows DOS 8.3 naming. Website folder IDs
are independent of the DOS directory you extract into, and URLs keep the id
(`games/originals/keys-and-doors/keysdoor.zip`).

`dosName` is the one source for a game's DOS name: `dosDir()` in `web/src/project/dosDir.ts`
returns it (upper case) for the ZIP, the desk's `C:\DOWNLOAD\<NAME>` folder, the Sample
Disk's folder and any CD folder. Without one it is the id when that is already 8.3.
The ZIP a game had before it had a `dosName` (its id cut to 8 letters, such as `reckonin.zip`)
still serves the same file. `web/scripts/dosNames.test.ts` checks that every name is 8.3
and unique.

Playable distributions include the native game files, XFERPLAY named after the `.GAM`,
SNDBLAST.DRV, CONFIG.BAT, CONFIG.HLP, instructions and notices. The game's own readme is
preserved. Player appearance and extension customizations are applied using the same DOS
exporter as edited projects. Resource-only CD folders receive data ZIPs.

The browser player and editor share one ZIP download through the archives SDK. Import
that ZIP or its extracted folder to edit a copy; its player customizations are recovered
and native extensions restored. Existing catalog download/edit permissions still apply.
The Download dialog's DOS choice saves this built ZIP and exposes its permanent link.
Exports of your edited projects continue to use their current files.

Loose native payloads, their gzip duplicates and production GMPK files are not deployed.
Catalog JSON, prebuilt preview images and walkthrough metadata remain separate, so listing
available games does not require extracting every game. Legacy GMPK and loose-file sites
remain readable; Vite serves the same permanent ZIP URLs, caches them and their preview images, and
refreshes them when source files change. Loose native HTTP URLs are not served.

ZIP timestamps are fixed for reproducible builds. The site's service worker versions ZIPs
by their folder's content hash, refreshing a changed distribution through its existing
update flow while retaining permanent links. ZIPs are generated build output, not source
files to commit. Deployment still requires a `pages-v*` tag.
