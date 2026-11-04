#!/bin/sh
# Rebuilds everything for BOTH phone variants in one go, with no arguments: npm run phone:build (repository root).
#   cheap   (Science Project No. 2, Junior Lab Edition): games/year2000/phone/      99 x 99 mm
#   deluxe  (Science Project No. 1, Deluxe Model):       games/year2000/phone/deluxe/  73.66 x 175.26 mm
# For each: schematic and board (gen_sch.py, gen_pcb.py, with the silkscreen QR codes and Dex), ERC + DRC and the Gerbers
# (export.sh), the 3D parts file and previews (export3d.sh), the BOM and mechanical interface, the QR scan of the preview,
# then the 3D-printed shell, dial, caps and battery box (shell.ts: STL files in <variant>/shell/ and the shell parts merged
# into viewer/parts.json + parts.bin). kicad-cli only, never KiCad's Python. The log is out/build.log (git-ignored).
cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd)"
mkdir -p out
LOG="$ROOT/out/build.log"
: > "$LOG"
{
  for V in . deluxe; do
    echo "=== variant $V ($(date))"
    ( cd "$ROOT/$V" &&
      python3 tools/gen_sch.py &&
      python3 tools/gen_pcb.py &&
      tools/export.sh &&
      tools/export3d.sh &&
      python3 tools/bom.py &&
      python3 tools/mech.py ) || echo "!! variant $V: a step failed"
    echo "--- QR scan ($V)"
    python3 -I "$ROOT/tools/qrscan.py" "$ROOT/$V" || echo "!! a QR code did not decode"
  done
  echo "=== shells"
  ( cd "$ROOT/../../../web" && npx vite-node ../games/year2000/phone/tools/shell.ts ) || echo "!! shell.ts failed"
  echo "=== done $(date)"
} >> "$LOG" 2>&1
echo "build log: $LOG"
for V in . deluxe; do
  printf '%s: ' "$V"
  grep -h "Found .* DRC violations" "$ROOT/$V/out/drc.rpt" | tr '\n' ' '
  grep -h "Found .* violations\|Total" "$ROOT/$V/out/erc.rpt" | tr '\n' ' '
  if [ -f "$ROOT/$V/viewer/parts.json" ]; then python3 -I -c "import json,sys;print('viewer parts:',len(json.load(open(sys.argv[1]))['parts']))" "$ROOT/$V/viewer/parts.json"; else echo; fi
done
grep -E "^(!!|-->|QR|shell )|->" "$LOG" | head -30
