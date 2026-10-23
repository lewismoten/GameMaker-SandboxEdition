#!/bin/sh
# Builds the Linux player shell (Player/main.c) for x86_64 and aarch64 and copies it to
# web/public/linux/GameMakerPlayer-x86_64 and -aarch64, where the web app's "Download for
# Linux" (web/src/export/linuxApp.ts) and web/scripts/linuxTar.ts pick it up.
#
# It links only the C library (glibc 2.17 or later); GTK 3 and WebKitGTK are loaded at run
# time, so no GTK headers or libraries are needed to build it. Cross-compiles from macOS or
# Linux with Zig 0.16 or later (https://ziglang.org/download/):
#
#   sh linux/build.sh                  # zig on the PATH
#   ZIG=/path/to/zig sh linux/build.sh
set -eu
here=$(cd "$(dirname "$0")" && pwd)
out="$here/../web/public/linux"
zig=${ZIG:-zig}
mkdir -p "$out"
for arch in x86_64 aarch64; do
  "$zig" cc -target "$arch-linux-gnu.2.28" -Os -s -Wall -Wextra -Wno-unused-parameter -Wno-cast-function-type \
    -o "$out/GameMakerPlayer-$arch" "$here/Player/main.c" -ldl
done
ls -l "$out"
