#!/bin/sh
# Assembles firmware/phone.asm with gpasm (brew install gputils) into out/firmware/phone.hex,
# then runs the simulator checks (tools/picsim.py) against that hex.
set -e
cd "$(dirname "$0")/.."
mkdir -p out/firmware
gpasm -p p16f84a -w2 -o out/firmware/phone.hex firmware/phone.asm
python3 tools/picsim.py out/firmware/phone.hex
echo "hex: $(pwd)/out/firmware/phone.hex"
