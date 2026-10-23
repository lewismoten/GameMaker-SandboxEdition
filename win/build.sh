#!/bin/sh
# Builds the Windows player shell (Player/main.c) for x64 and arm64 Windows 10/11 and copies
# it to web/public/win/GameMakerPlayer-x64.exe and -arm64.exe, where the web app's "Download
# for Windows" (web/src/export/winApp.ts) and web/scripts/winExe.ts pick it up. Each game's
# program is this one with the game and its icon, title and version put into its resources.
#
# Cross-compiles from macOS or Linux with Zig 0.16 or later (https://ziglang.org/download/,
# one download, no install), which brings clang, the MinGW-w64 headers and libraries, and a
# resource compiler:
#
#   sh win/build.sh                    # zig on the PATH
#   ZIG=/path/to/zig sh win/build.sh
#
# No WebView2 SDK is needed: Player/webview2.h has the few interface slots the player uses.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
out="$here/../web/public/win"
zig=${ZIG:-zig}
mkdir -p "$out"
cd "$here/Player"
for arch in x64 arm64; do
  case $arch in x64) target=x86_64-windows-gnu ;; arm64) target=aarch64-windows-gnu ;; esac
  "$zig" cc -target "$target" -Os -s -municode -Wl,--subsystem,windows -Wall -Wextra -Wno-unused-parameter \
    -Wno-missing-field-initializers -Wno-cast-function-type -o "$out/GameMakerPlayer-$arch.exe" \
    main.c player.rc -lole32 -lshell32 -luser32 -ladvapi32 -lgdi32
  rm -f "$out/GameMakerPlayer-$arch.pdb" "$out/GameMakerPlayer-$arch.lib"
done
ls -l "$out"
