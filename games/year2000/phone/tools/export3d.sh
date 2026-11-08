#!/bin/sh
# 3D and preview exports, kicad-cli only (no KiCad Python), into out/ (git-ignored):
#   out/phone.glb          board + components (the simple models in kicad/3d)
#   out/phone-bare.glb     the bare board (copper, silkscreen, mask, no components)
#   out/front.png, back.png   board previews (front: F.Cu F.SilkS F.Mask Edge; back mirrored)
# then packs out/phone.glb into the committed compact parts file for the site viewer: viewer/parts.json + parts.bin.
set -e
cd "$(dirname "$0")/.."
KC="${KICAD_CLI:-/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli}"
mkdir -p out
KP="$(pwd)/kicad"
python3 tools/sexp_check.py kicad/phone.kicad_pcb
nice -n 15 "$KC" pcb export glb -f --subst-models -D KIPRJMOD="$KP" --include-tracks --include-pads --include-silkscreen --include-soldermask -o out/phone.glb kicad/phone.kicad_pcb
nice -n 15 "$KC" pcb export glb -f --board-only -D KIPRJMOD="$KP" --include-tracks --include-pads --include-silkscreen --include-soldermask -o out/phone-bare.glb kicad/phone.kicad_pcb
# viewer file: board body + silkscreen + mask + components (no copper tracks: they are 0.3 mm wide and would not survive decimation)
nice -n 15 "$KC" pcb export glb -f --subst-models -D KIPRJMOD="$KP" --include-silkscreen --include-soldermask -o out/phone-viewer.glb kicad/phone.kicad_pcb
nice -n 15 "$KC" pcb export svg --exclude-drawing-sheet --mode-single --page-size-mode 2 --layers F.Cu,F.SilkS,F.Mask,Edge.Cuts -o out/front.svg kicad/phone.kicad_pcb
nice -n 15 "$KC" pcb export svg --exclude-drawing-sheet --mode-single --page-size-mode 2 --mirror --layers B.Cu,B.SilkS,B.Mask,Edge.Cuts -o out/back.svg kicad/phone.kicad_pcb
# SVG -> PNG with Playwright's Chromium (needs the repository's node_modules; WEB_DIR may point at a package.json next to them)
for s in front back; do
  node tools/svg2png.mjs out/$s.svg out/$s.png 2400 || echo "no PNG for $s: open out/$s.svg in a browser"
done
python3 tools/glb_check.py
python3 tools/glb_tool.py pack out/phone-viewer.glb viewer --budget-mb 2
ls -l out/phone.glb out/phone-bare.glb viewer/parts.json viewer/parts.bin
