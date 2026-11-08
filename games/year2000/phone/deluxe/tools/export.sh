#!/bin/sh
# Checks the KiCad project and exports everything a board house or a builder needs:
#   gerbers/                Gerbers + Excellon drill files (tracked, so a site built without KiCad still ships them;
#                           their export dates are pinned to 2026-01-01 so an unchanged board gives the same bytes)
#   out/phone-gerbers.zip   the same files zipped, ready to upload to a board house (out/ is git-ignored)
#   out/phone-schematic.pdf the schematic
#   out/erc.rpt, out/drc.rpt
# Needs KiCad 9 (kicad-cli). No KiCad Python is used. Usage: tools/export.sh
set -e
cd "$(dirname "$0")/.."
KC="${KICAD_CLI:-/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli}"
mkdir -p out gerbers
python3 tools/sexp_check.py kicad/phone.kicad_sch
python3 tools/sexp_check.py kicad/phone.kicad_pcb
nice -n 15 "$KC" sch erc --severity-all --exit-code-violations -o out/erc.rpt kicad/phone.kicad_sch || echo "ERC reported violations: see out/erc.rpt"
nice -n 15 "$KC" pcb drc --severity-all --exit-code-violations -o out/drc.rpt kicad/phone.kicad_pcb || echo "DRC reported violations: see out/drc.rpt"
nice -n 15 "$KC" sch export pdf -o out/phone-schematic.pdf kicad/phone.kicad_sch
rm -f gerbers/*
nice -n 15 "$KC" pcb export gerbers -o gerbers/ --layers F.Cu,B.Cu,F.Mask,B.Mask,F.SilkS,B.SilkS,Edge.Cuts kicad/phone.kicad_pcb
nice -n 15 "$KC" pcb export drill -o gerbers/ --format excellon --excellon-units mm --generate-map --map-format gerberx2 kicad/phone.kicad_pcb
sed -i '' -E -e 's/(CreationDate[^0-9]*)[0-9T:+-]{19,25}/\12026-01-01T00:00:00-05:00/' \
  -e 's/(KiCad.*date )[0-9-]{10}[T ][0-9:]{8}/\12026-01-01 00:00:00/' gerbers/*
rm -f out/phone-gerbers.zip
(cd gerbers && zip -q -X ../out/phone-gerbers.zip *)
ls -l out/phone-gerbers.zip out/phone-schematic.pdf
