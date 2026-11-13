# Game distribution ZIPs

A production website build makes a DOS ZIP for each catalog game. Games shipped as
whole ZIPs have permanent URLs, for example:

```text
games/gameware/nebula/nebula.zip
games/originals/teddy/teddy.zip
```

A link serves the current release of that game. Its URL stays the same when game files,
player settings or the website change. ZIP filenames use the lower-case DOS directory
name from `dosDir()`: a valid `dosName` from `about.json`, otherwise an already valid
8.3 catalog ID, then a valid executable stem, and finally a shortened `~1` fallback.
The catalog's naming test rejects that fallback for shipped games. For example,
`keys-and-doors` uses `KEYSDOOR` and `reckoning` uses `RECKON`. Every native file inside
also follows DOS 8.3 naming. Website folder IDs are independent of the DOS directory
you extract into; for example, Reckoning's URL is
`games/originals/reckoning/reckon.zip`.

`dosDir()` also names the desk's `C:\DOWNLOAD\<NAME>` folder, the Sample
Disk's folder and CD folders. The previously published truncated ZIP names for
Reckoning and Snowbound remain aliases for their current ZIPs; new games do not get
a truncated-name alias. `web/scripts/dosNames.test.ts` checks that the catalog names
are 8.3 and unique.

Playable distributions include the native game files, XFERPLAY named after the `.GAM`,
SNDBLAST.DRV, CONFIG.BAT, CONFIG.HLP, instructions and notices. The game's own readme is
preserved. Player appearance and extension customizations are applied using the same DOS
exporter as edited projects. Resource-only CD folders receive data ZIPs.

The browser player and editor share one ZIP download through the archives SDK. Import
that ZIP or its extracted folder to edit a copy; its player customizations are recovered
and native extensions restored. Existing catalog download/edit permissions still apply.
The Download dialog's DOS choice saves this built ZIP. It exposes a permanent link
only when the catalog entry ships as a whole ZIP.
Exports of your edited projects continue to use their current files.

In production, Starters ship as a `.zpart` file plus shared data under `games/shared/`,
not as directly served ZIP files. `web/src/project/sharedZip.ts` joins those pieces
back into the exact ZIP bytes for the player, editor and DOS download. Their catalog
entries have a `parts` field; use the site's download flow rather than constructing
a ZIP URL for them. Development Vite still serves their whole ZIPs.

Loose native payloads, their gzip duplicates and production GMPK files are not deployed.
Catalog JSON, prebuilt preview images and walkthrough metadata remain separate, so listing
available games does not require extracting every game. Legacy GMPK and loose-file sites
remain readable; Vite serves the same permanent ZIP URLs, caches them and their preview images, and
refreshes them when source files change. Loose native HTTP URLs are not served.

ZIP timestamps are fixed for reproducible builds. The site's service worker versions ZIPs
by their folder's content hash, refreshing a changed distribution through its existing
update flow while retaining permanent links. ZIPs are generated build output, not source
files to commit. Site publication is a local supervised release from a `pages-v*` tag,
not a tag-triggered Pages workflow; see [Package releases](package-releases.md#publishing-the-site-gh-pages).
