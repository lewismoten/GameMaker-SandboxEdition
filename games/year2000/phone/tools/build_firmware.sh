#!/bin/sh
# Assembles each build's firmware/phone.asm with gpasm (brew install gputils) into its firmware/phone.hex (tracked, so a
# site built without gpasm still ships it; web/test/phoneFirmware.test.ts says when it is stale), then runs the
# simulator checks (tools/picsim.py) against the Junior Lab hex.
set -e
cd "$(dirname "$0")/.."
for V in . deluxe; do
  [ -f "$V/firmware/phone.asm" ] && gpasm -p p16f628a -w2 -o "$V/firmware/phone.hex" "$V/firmware/phone.asm"
  rm -f "$V/firmware/phone.cod" "$V/firmware/phone.lst"
done
python3 tools/picsim.py firmware/phone.hex
echo "hex: $(pwd)/firmware/phone.hex"
