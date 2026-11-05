#!/bin/bash
# Fidelity spike, DOS side: runs a CD game under DOSBox with a timed key script, records the
# screen and sound with DOSBox's own capture (Ctrl+Alt+F5 video: zmbv AVI with the audio in it),
# and decodes the level's AVI to raw RGB. Run only while Lewis is away (it opens a DOSBox window).
#   scripts/fidelity/dosCapture.sh <gameware|sharware> <id> <keys.txt> <out dir> [seconds before keys (28)] [seconds after (6)]
# keys.txt lines: "<ms since the first key> down|up <mac key code>" (see keyseq.swift).
# Needs: /Applications/dosbox.app, ffmpeg, swiftc, and Accessibility + Screen Recording for the terminal app.
set -u
KIND=$1 ID=$2 KEYS=$(cd "$(dirname "$3")" && pwd)/$(basename "$3") OUT=$4 BEFORE=${5:-28} AFTER=${6:-6}
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../../.." && pwd)
mkdir -p "$OUT/c/$ID" "$OUT/cap"
OUT=$(cd "$OUT" && pwd)
UP=$(echo "$ID" | tr a-z A-Z)
for f in "$ROOT/cd/$KIND/$ID"/*; do cp "$f" "$OUT/c/$ID/$(basename "$f" | tr a-z A-Z)"; done
cp "$ROOT/cd/gm/xferplay.exe" "$OUT/c/$ID/$UP.EXE"; cp "$ROOT/cd/gm/sndblast.drv" "$OUT/c/$ID/SNDBLAST.DRV"
cp "$ROOT/cd/gm/config.hlp" "$OUT/c/$ID/CONFIG.HLP"; MAIN=$(cd "$(git -C "$ROOT" rev-parse --git-common-dir)/.." && pwd)  # the main checkout holds dosbox/ (npm run dosbox)
cp "$MAIN/dosbox/GM/CONFIG.DAT" "$OUT/c/$ID/" 2>/dev/null || echo "no dosbox/GM/CONFIG.DAT: run npm run dosbox once, or the game asks for its sound setup" >&2
cat > "$OUT/dosbox.conf" <<CONF
[sdl]
fullscreen=false
windowresolution=640x400
output=surface
[cpu]
core=normal
cycles=fixed 12000
[sblaster]
sbtype=sb16
[dosbox]
captures=$OUT/cap
[autoexec]
mount c $OUT/c
c:
cd \\$UP
CONF
[ -x "$OUT/keyseq" ] || swiftc -O "$HERE/keyseq.swift" -o "$OUT/keyseq" || exit 1
START='tell application "System Events"
 set frontmost of process "DOSBox" to true
 delay 1
 key code 96 using {control down, option down}
 delay 1
 keystroke "'$ID'"
 key code 36
end tell'
STOP='tell application "System Events"
 key code 96 using {control down, option down}
 delay 1
end tell'
/Applications/dosbox.app/Contents/MacOS/DOSBox -conf "$OUT/dosbox.conf" > "$OUT/dosbox.log" 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null; sleep 1; pgrep -x DOSBox >/dev/null && echo "DOSBox still open: close it by hand" >&2' EXIT
sleep 4
osascript -e "$START" || echo "start keys failed" >&2
sleep "$BEFORE"
"$OUT/keyseq" "$PID" < "$KEYS"
sleep "$AFTER"
osascript -e "$STOP"
ls -la "$OUT/cap"
echo "decode a level's AVI: ffmpeg -i $OUT/cap/${ID}_001.avi -an -f rawvideo -pix_fmt rgb24 -fps_mode passthrough $OUT/dos.rgb (size: ffprobe)"
