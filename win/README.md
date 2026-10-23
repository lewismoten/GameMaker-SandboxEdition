# win/ — playing the games as Windows programs

Any game, including your own, can be downloaded as a Windows program: on a game's panel on
the home page, in the editor or in a game's **⋯ More** menu, press **Download** and choose
**Windows**. The program is built right there in the browser and saved
as one `.exe` (double-click it to play; nothing is installed) or a `.zip` holding it. It plays
offline in its own window on Windows 10 and 11, x64 or Arm.

## How it works

- `Player/main.c` is a small Win32 program in C: one window (4:3, resizable, full screen
  with F11 or Alt+Enter, or when the page asks) holding Microsoft Edge WebView2, which plays
  the game's **one web page** export (`web/src/export/exportSinglePage.ts`). The page is in
  the program's own resources (RCDATA `GAME`); the title, id and credits are in RCDATA `INFO`.
  At start it writes the page to `%LOCALAPPDATA%\GameMaker\<id>\game\game.html` and serves
  that folder as `https://game.gamemaker.example/` (WebView2's virtual host mapping), so the
  page has a proper origin of its own; saved games and high scores live in its
  `localStorage`, kept in WebView2's data folder there between launches. It needs no
  network; links (the credit, a shareware notice) open in the default browser. Music may
  start without a click (`--autoplay-policy=no-user-gesture-required`). The window's menu
  (Alt+Space) has Restart (Ctrl+R), Full screen (F11) and About. Opening a game that is
  already open brings its window forward.
- WebView2 comes with Windows 11 and with Windows 10 kept up to date. The player finds it
  without Microsoft's `WebView2Loader.dll`: it loads the runtime's own
  `EmbeddedBrowserWebView.dll` from the folder Edge's updater records under
  `HKLM\SOFTWARE\Microsoft\EdgeUpdate\ClientState\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}`
  (value `EBWebView`; or the same under HKCU), as the open source
  [webview](https://github.com/webview/webview) library does. It never loads a DLL from
  beside itself (usually the Downloads folder). Without a runtime it says so and offers
  Microsoft's download.
- `Player/webview2.h` holds the vtable slots and interface IDs the player uses, generated
  from the WebView2 SDK's `WebView2.h` (BSD-licensed; its notice is kept in the file), so
  building needs no SDK.
- `build.sh` cross-compiles it for x64 and arm64 with Zig (clang and MinGW-w64), with the
  generic icon, the DPI-aware manifest and version information from `Player/player.rc`,
  and copies the programs to `web/public/win/GameMakerPlayer-x64.exe` and `-arm64.exe`
  (committed, about 100 KB and 60 KB). The build is reproducible.
- `web/src/export/winApp.ts` makes a game's program from it, in plain JavaScript: it reads
  the player's resource section (`peResources.ts`), puts in the game's page and `INFO`, an
  icon drawn from the game's first level like the Mac app's (`winIcon.ts`) and version
  information naming the game (what the Explorer and the Task Manager show), and writes the
  section back (the base relocations after it move down; sizes and the checksum are
  updated). The web page picks the arm64 player when the browser says it runs on Windows on
  Arm, else x64 (which Arm PCs run as well).

## Running it the first time (SmartScreen)

The players' version of this, with why the programs can't be signed, what the program does
and how to remove it, is the site's
[Windows downloads page](https://lewismoten.github.io/GameMaker-SandboxEdition/#/windows)
(`web/src/winHelp/winPage.ts`, linked from the Download chooser).

The programs are not code-signed: a certificate is paid for every year and signing needs
the author's private key, which a web page cannot hold. So the first time a downloaded
program is run, Windows SmartScreen may say "Windows protected your PC": click **More info**,
then **Run anyway**. (Or right-click the file → Properties → **Unblock**.) With Smart App
Control on (some Windows 11 PCs), unsigned programs cannot run at all.

## Building

```sh
ZIG=/path/to/zig sh win/build.sh                       # rebuild the player (Zig 0.16 or later)
cd web
npx vite-node scripts/winExe.ts teddy goat realm       # .exe files of catalog games, in ../dist/win
npx vite-node scripts/winExe.ts --all --zip --arm64    # every listed game, .exe and .zip, x64 and Arm
npx vite-node scripts/winExe.ts --html game.html --title "My Game" --id my-game
```

`.github/workflows/win-exe.yml` first plays one game on a GitHub Windows runner (it must
load in WebView2 and keep a saved value between two launches), then builds every game and
attaches the programs to a GitHub release (run it by hand from the Actions tab, or publish
a release).

## Testing the player

The player reads a few environment variables, for tests only: `GM_READY_FILE` (write what
the page shows, as JSON, a few seconds after it loads; `GM_READY_DELAY` seconds),
`GM_TEST_SAVE` (store a value the next launch should find), `GM_TEST_EXIT` (close after
writing) and `GM_INSPECT` (allow the DevTools and the context menu).

```bat
set GM_READY_FILE=%TEMP%\ready.json
"Teddy's Little Big Adventure.exe"
```
