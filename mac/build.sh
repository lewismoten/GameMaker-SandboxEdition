#!/bin/sh
# Builds the Mac player shell (Player/main.swift) as one universal binary (Apple silicon and
# Intel, macOS 11 or later), ad-hoc signs it inside a template app bundle, and copies the
# signed binary to web/public/mac/GameMakerPlayer, where the web app's "Download for Mac"
# (web/src/export/macApp.ts) and mac/package.ts pick it up.
#
# The signature is made with three special slots (Info.plist, requirements, sealed
# resources) so the exporters can re-seal each game's own Info.plist and resources by
# rewriting those hashes, without a Mac. Run it on a Mac with the Xcode command line tools:
#
#   sh mac/build.sh
set -eu
here=$(cd "$(dirname "$0")" && pwd)
out="$here/../web/public/mac"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

for arch in arm64 x86_64; do
  swiftc -O -target "$arch-apple-macos11" -o "$tmp/player-$arch" "$here/Player/main.swift"
done
lipo -create -output "$tmp/GameMakerPlayer" "$tmp/player-arm64" "$tmp/player-x86_64"
strip -x "$tmp/GameMakerPlayer" 2>/dev/null || true

app="$tmp/Template.app/Contents"
mkdir -p "$app/MacOS" "$app/Resources"
cp "$tmp/GameMakerPlayer" "$app/MacOS/GameMakerPlayer"
cp "$here/Player/Info.plist" "$app/Info.plist"
echo '<!doctype html>' > "$app/Resources/game.html"
codesign --force --sign - --identifier com.lewismoten.gamemaker.player "$tmp/Template.app"
codesign --verify --strict "$tmp/Template.app"

mkdir -p "$out"
cp "$app/MacOS/GameMakerPlayer" "$out/GameMakerPlayer"
lipo -info "$out/GameMakerPlayer"
ls -l "$out/GameMakerPlayer"
