# linux/ — playing the games on Linux

Any game, including your own, can be downloaded for Linux: on a game's panel on the home
page, in the editor or in a game's **⋯ More** menu, press **Download** and choose **Linux**.
It is built right there in the browser and saved as `<Title>.tar.gz`: a folder that plays
the game offline in a window of its own, on x86_64 and aarch64 PCs. The players' guide is the site's
[Linux downloads page](https://lewismoten.github.io/GameMaker-SandboxEdition/#/linux)
(`web/src/linuxHelp/linuxPage.ts`).

## What is in the folder

- `play.sh` runs `GameMakerPlayer-x86_64` or `-aarch64` (by `uname -m`) on `game.html`, the
  game's **one web page** export, with its title, id and `icon.png`. If the player cannot
  run (no WebKitGTK: exit status 3; or 126/127, another kind of computer), it prints a
  one-line notice (and shows it with `notify-send` when there is one) and opens `game.html`
  in the web browser with `xdg-open`.
- `install.sh` copies the folder to `~/.local/share/GameMaker/<id>/app` and writes
  `~/.local/share/applications/gamemaker-<id>.desktop` (Games category, the icon,
  `StartupWMClass=gamemaker-<id>`); `uninstall.sh` takes them out again, and with `--all`
  the saved games too. Both honor `$XDG_DATA_HOME`; neither needs root.
- `README.txt`: how to play, the packages, and where the saves are.

The .tar.gz is written in JavaScript (`web/src/export/tar.ts`, POSIX ustar, so the programs
and scripts keep their executable bit) by `web/src/export/linuxApp.ts`. No AppImage: it
would need a squashfs image and the AppImage runtime, and bundling WebKitGTK would make every
game well over 100 MB.

## The player

`Player/main.c` is a GTK 3 window holding a WebKitGTK web view (960 x 720, 4:3, resizable;
F11 full screen, and the page's own full screen; Ctrl+R restarts). It links only the C
library: it `dlopen`s `libwebkit2gtk-4.1.so.0` (or `libwebkit2gtk-4.0.so.37`) and finds the
few GTK, GLib and WebKit functions it uses in it and its dependencies, so one build runs on
any distribution with glibc and WebKitGTK, and says what to install when there is none.
Saved games and high scores live in the page's `localStorage`, which a per-game WebKit
data manager keeps in `~/.local/share/GameMaker/<id>/webkit` (cache in
`~/.cache/GameMaker/<id>`). Links (the credit, a shareware notice) open in the default
browser (`g_app_info_launch_default_for_uri`); media may play without a click. It makes no
network requests of its own.

WebKitGTK packages: Debian/Ubuntu/Mint `libwebkit2gtk-4.1-0`, Fedora `webkit2gtk4.1`, Arch
`webkit2gtk-4.1`.

## Building

```sh
ZIG=/path/to/zig sh linux/build.sh                     # rebuild the players (Zig 0.16 or later; no GTK needed)
cd web
npx vite-node scripts/linuxTar.ts teddy goat realm     # .tar.gz files of catalog games, in ../dist/linux
npx vite-node scripts/linuxTar.ts --all
npx vite-node scripts/linuxTar.ts --html game.html --title "My Game" --id my-game
```

The players are committed to `web/public/linux/` (about 11 KB each). The build is
reproducible.

`.github/workflows/linux-tar.yml` first tries one game on Ubuntu: without WebKitGTK,
`play.sh` must open the browser; with it (under `xvfb-run`), the game must load and keep a
saved value between two launches. Then it builds every game and attaches them to a GitHub
release.

## Testing the player

Environment variables, for tests only: `GM_READY_FILE` (write what the page shows, as JSON,
a few seconds after it loads; `GM_READY_DELAY` seconds), `GM_TEST_SAVE` (store a value the
next launch should find), `GM_TEST_EXIT` (quit after writing) and `GM_INSPECT` (allow the Web
Inspector).
