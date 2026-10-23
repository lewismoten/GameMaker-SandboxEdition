# mac/ — playing the games as Mac apps

Any game, including your own, can be downloaded as a native Mac app: on a game's panel on
the home page press **Mac**, or in the editor use **Save & share → Download for Mac** (also in
a game's **⋯ More** menu). The app is built right there in the browser and saved as a disk
image (`.dmg`: open it, drag the game onto Applications) or a `.zip`. It plays offline in its
own window on Apple silicon and Intel Macs with macOS 11 Big Sur or later.

## How it works

- `Player/main.swift` is a small AppKit program: one window (4:3, resizable, full screen with
  ⌃⌘F) holding a `WKWebView` that plays the game in `Contents/Resources/game.html`, the
  game's **one web page** export (`web/src/export/exportSinglePage.ts`). It needs no network;
  links (the credit, a shareware notice) open in the browser. Music may start without a
  click (`mediaTypesRequiringUserActionForPlayback = []`). Saved games and high scores live
  in the page's `localStorage`, which WebKit keeps per app (by bundle identifier) between
  launches. The menus have About (credits from the Info.plist), Restart, Full Screen and Quit.
- `build.sh` compiles it for `arm64` and `x86_64` (macOS 11 minimum), joins them with `lipo`,
  ad-hoc signs the result inside a template app and copies the binary to
  `web/public/mac/GameMakerPlayer` (committed, about 270 KB). One binary serves every game.
- `web/src/export/macApp.ts` makes a game's app from it, in plain JavaScript:
  `<Title>.app/Contents/` gets an `Info.plist` (bundle id `com.lewismoten.gamemaker.<id>`, the
  title, version, credits), `MacOS/GameMakerPlayer`, `Resources/game.html`,
  `Resources/AppIcon.icns` (drawn from the game's first level, `macIcon.ts`) and
  `_CodeSignature/CodeResources`. `macSign.ts` re-seals the player's ad-hoc signature for that
  Info.plist and those resources (it rewrites two hashes in each architecture's
  CodeDirectory), so `codesign --verify --deep --strict` accepts the app.
- The `.dmg` is an ISO 9660 image with Rock Ridge extensions (`iso9660.ts`: long names, the
  program's executable bit, an `Applications` symlink), a Finder `.DS_Store` that lays out the
  window (`dsStore.ts`), compressed as a UDZO disk image (`udif.ts`). The `.zip` stores Unix
  modes, so the Finder's Archive Utility unzips a runnable app.

## Opening the app the first time (Gatekeeper)

The apps are signed ad-hoc, not with an Apple Developer ID, and are not notarized by Apple
(that needs a paid Apple Developer Program membership). So the first time a downloaded app
is opened, macOS says it cannot check it for malicious software:

1. Click **Done** (or **Cancel**).
2. Open **System Settings → Privacy & Security**, scroll down and click **Open Anyway** next to
   the game's name, then confirm.
3. On macOS 14 Sonoma or earlier you can instead Control-click (right-click) the app, choose
   **Open**, then **Open** again.

After that it opens like any other app.

## Building

```sh
sh mac/build.sh                                       # rebuild the player (needs Xcode's command line tools)
cd web
npx vite-node scripts/macDmg.ts teddy goat realm      # .dmg files of catalog games, in ../dist/mac
npx vite-node scripts/macDmg.ts --all --zip           # every listed game, .dmg and .zip
npx vite-node scripts/macDmg.ts --html game.html --title "My Game" --id my-game
```

`scripts/macDmg.ts` uses the same code as the web page, so it also runs on Linux.
`.github/workflows/mac-dmg.yml` runs it for every game and attaches the images to a GitHub
release (run it by hand from the Actions tab, or publish a release); nothing needs to be
hosted for the web page's own download, which is built in the visitor's browser.

### Signing and notarizing later

With an Apple Developer ID, on a Mac:

```sh
export MAC_SIGN_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export MAC_NOTARY_PROFILE=gamemaker   # saved once with: xcrun notarytool store-credentials gamemaker
npx vite-node scripts/macDmg.ts --all
```

The app is then signed with the identity (hardened runtime), put on a UDZO image by `hdiutil`,
the image signed, sent to Apple's notary service and the ticket stapled to it; such images
open without the warning. `MAC_UDZO=1` alone builds the hdiutil image ad-hoc signed.

## Testing the player

The player reads a few environment variables, for tests only: `GM_READY_FILE` (write what the
page shows, as JSON, a few seconds after it loads; `GM_READY_DELAY` seconds), `GM_TEST_SAVE`
(store a value the next launch should find), `GM_TEST_START` (press the start screen first),
`GM_SNAPSHOT_FILE` (save a PNG of the window) and `GM_INSPECT` (allow Safari's Web Inspector).

```sh
open -n "Teddy's Little Big Adventure.app" --env GM_READY_FILE=/tmp/ready.json
```
