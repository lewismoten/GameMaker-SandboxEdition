# THE PHONE OF THE FUTURE (electronics, rev C)

A solderable toy kit that goes with In The Year 2000!: "a real working wireless phone", the way a 1993 game
imagined one. Infrared voice and touch tones, an eight-digit red display, a real pulse dial, a PIC16F628A and a
CM8870 tone decoder, through-hole parts only. Two phones are needed to play: digits dialed on one appear on any
phone in sight (no call set-up).

**This is an untested design. Nobody has built one. Treat every claim below as "should", not "does".**
The schematic and board pass KiCad's electrical and design-rule checks and the firmware's logic passes a simulator
I wrote; nothing was powered, soldered or listened to.

This folder is the electronics only. The 3D-printed shell and dial will come from `mechanical/interface.json`
and the 3D parts file in `viewer/`.

## What is here

| Path | What it is |
| --- | --- |
| `kicad/phone.kicad_sch`, `phone.kicad_pcb` | The KiCad 9 project (written by the scripts below; open it in KiCad to look or edit) |
| `kicad/phone.pretty/`, `phone.kicad_sym`, `models/` | Big-pad footprints, the two local symbols (CM8870, 4-digit display), and the simple 3D models (`.wrl` and `.step`) |
| `firmware/phone.asm` | PIC16F628A firmware, gpasm (ported from the PIC16F84A; same 18-pin pinout) |
| `bom.csv`, `PARTS.md` | Bill of materials and readable parts list (`tools/bom.py`) |
| `mechanical/interface.json` | Board outline, holes, where everything sits and how tall (for the shell) |
| `viewer/parts.json`, `parts.bin` | The board and every part as a compact triangle set for the site's 3D viewer (`tools/export3d.sh`) |
| `tools/` | Generators and checks (below) |
| `out/` (git-ignored) | Gerber zip, schematic PDF, ERC and DRC reports, the `.hex`, the GLB files and the preview PNGs |

The KiCad files and `viewer/` are committed on purpose: they are the design, and the site's GitHub build has no KiCad.
Change `tools/design.py` (circuit) or `tools/gen_pcb.py` (placement, art) and re-run rather than hand-editing, unless you
take the project over in KiCad from here on.

## Commands (from `games/year2000/phone/`)

```sh
python3 tools/gen_sch.py && python3 tools/gen_pcb.py   # rewrite the schematic and board (routing takes a few minutes)
tools/export.sh          # sexp check, ERC, DRC, out/phone-gerbers.zip, out/phone-schematic.pdf
tools/export3d.sh        # out/phone.glb, out/phone-bare.glb, out/front.png, out/back.png, then viewer/parts.json + parts.bin
tools/build_firmware.sh  # gpasm -> out/firmware/phone.hex, then the simulator checks
python3 tools/bom.py && python3 tools/mech.py
```

Needs KiCad 9 (`kicad-cli`; set `KICAD_CLI` if it is not in `/Applications`), `gputils` (`brew install gputils`) and
Python 3. The scripts never use KiCad's own Python: `tools/sexp_check.py` validates a file before any KiCad tool opens it.
To regenerate the viewer file after a board change run `tools/export3d.sh` and commit `viewer/`. Its format is described
at the top of `tools/glb_tool.py`. `tools/glb_check.py` checks that every part's mesh sits on the right side, over its footprint.

## Theory of operation

One infrared beam carries live voice and touch-tone digits, half duplex.

- **Sending voice.** Hold TALK. It puts +5 V on the TALK line, which (1) powers the electret microphone through its bias
  resistor, (2) switches on the IR LED's bias (R8 feeds the 2N3904's base from the TALK line, so the LED is dark and draws no
  current otherwise) and (3) turns on a transistor that shorts the receiver, so a phone does not hear itself. A half of the LM358
  amplifies the mic (gain 47) and modulates the LED around its bias.
- **Sending digits.** Dialing a digit makes the PIC drive the TALK line high for the tone (about 10 ms before, 103 ms during):
  bias on, receiver muted, microphone powered. Two pins output square waves at the row and column frequencies (697, 770, 852, 941 Hz
  and 1209, 1336, 1477, 1633 Hz, ITU-T Q.23); two 10 k resistors and 10 nF sum and soften them. The sum goes to the IR driver and,
  through a large resistor, to the speaker (after the mute point), so the sending phone hears its own tones. The microphone is live during
  the tone, so room noise rides along with it.
- **Receiving.** A PIN photodiode with a 22 k load, AC-coupled into the other LM358 half (gain 47, rolled off above about 7 kHz),
  gives the audio. An LM386 (gain 20) plays it. The same audio goes to the CM8870, which turns tone pairs into a 4-bit code and
  raises StD.
- **Display.** The MAX7219 scans two 4-digit common-cathode modules and the PIC writes it over three wires. A digit typed or received
  is added at the right of the number (left-aligned). The left digit's decimal point lights while TALK is held. An empty display shows a dash.
- **Dial.** SW2 (pulse) closes once per number step on the return; SW3 (off-normal) is closed while the dial is off rest. The PIC
  counts closures after SW3 closes (debounce about 1 ms for pulses and 15 ms for off-normal, so a fast printed dial with no governor
  still counts); when SW3 opens the count is the digit. 10 pulses are 0, more than 10 are ignored.
- **CLEAR** is the PIC's reset button (MCLR): it restarts the phone and clears the number.
- **Volume.** Fixed by default (R20 and R21). Optionally fit the 10k trimmer RV1 **instead of** R20 and R21: it is wired as a divider
  from the receiver to the speaker amplifier, so leaving it out (and fitting R20 and R21) still works. It needs no extra parts.
- **Clock.** One 3.579545 MHz crystal runs the CM8870; the PIC (XT mode) takes the clock from the CM8870's OSC2 through a 30 pF
  capacitor, as the CM8870/MT8870 datasheets do when chaining decoders. The PIC runs at 894,886 instructions per second; the tone loop
  is exactly 24 cycles.

### Tone decoder choice

`CM8870P` (California Micro Devices) has the same 18-pin DIP pinout as the MT8870D (datasheet pin table, p. 6): pins 5 and 6 are
"IC" (must be tied to ground, as here), 17 is St/GT, 4.75 to 5.25 V supply. The Holtek `HT9170B` is also pin-compatible (pins 5 and 6
are INH and PWDN, tied low), though Holtek lists it as phased out. A socket takes any of them. Where to buy singly: see `PARTS.md`.

### Pin budget (PIC16F628A, 13 I/O used)

| Pin | Use | | Pin | Use |
| --- | --- | --- | --- | --- |
| RA0 | TALK line (input; driven high by the PIC while it sends a digit) | | RB0 | dial pulse (low = closed, weak pull-up) |
| RA1 | MAX7219 DIN | | RB1 | dial off-normal (low = closed, weak pull-up) |
| RA2 | MAX7219 CLK | | RB2 | tone square wave A |
| RA3 | MAX7219 LOAD | | RB3 | tone square wave B |
| RA4 | CM8870 StD (input) | | RB4..RB7 | CM8870 Q1..Q4 |

All 13 are used. CLEAR takes none (it is MCLR), and the pulsed IR bias costs no pin (it shares RA0).

### Power: four AAA cells and a 5 V low-dropout regulator

Limits: MAX7219 4.0 to 5.5 V; PIC16F628A 3.0 to 5.5 V; CM8870/MT8870 4.75 to 5.25 V (6.0 V absolute); LM386-1 4 to 12 V; LM358 3 to 32 V.
Three cells (4.5 V fresh) fall under the MAX7219's 4.0 V early, and four fresh alkaline cells (6.4 V) are over the decoder's limit, so
**four AAA cells into a 5.0 V LDO** (MCP1702-5002E/TO, TO-92: 0.65 V dropout max at 250 mA, 250 mA). Expected (calculated, not measured): a steady 5 V until the cells
average about 1.3 V each, and a draw of roughly 70 to 100 mA with eight digits lit (the IR LED no longer adds 9 mA while idle),
so roughly 10 to 15 hours from alkalines. Rev C swapped the LM2940 for it to save about $1.60; the 250 mA limit at the LM386's loudest peaks is untested
(the LM2940 gave 1 A), and the 5 V rail now holds only until the pack sags to about 5.65 V under full load.

## Board layout (rev C)

Everything the user sees is on the front; electronics and the battery are on the back. The front under the **dial** (radius 24 mm) and
the **speaker** (24 mm) is clear of pads, vias and copper tracks: only silkscreen and the two dial microswitches sit under the dial, so the
silkscreen number ring (1 to 9 and 0, placed where the finger holes show) reads cleanly through the holes. Back copper may cross those areas.
Power and ground use 0.5 mm tracks (no zone fill is possible without KiCad's Python, so there is no ground pour). Silkscreen art (orbit rings, rays around
the dial, a YEAR 2000 badge, lettering) is clipped away from pads by the generator. The battery holder is a 4 x AAA holder with wire leads
stuck behind the dial, its leads soldered to two pads. Preview images: `out/front.png` and `out/back.png` after `tools/export3d.sh`.

## Build order for a beginner

You need a 25 to 40 W iron, thin rosin-core solder, flush cutters, a multimeter and four AAA cells; a programmer that can program a
PIC16F628A (a blank chip takes low-voltage programming once; the firmware then turns that off, so a re-burn needs 12 to 13 V on MCLR, which a PICkit 3 or 5 supplies; PICkit 5 support for this chip is unconfirmed) or a pre-programmed chip. Socket the PIC only; solder the other ICs. Parts on the back
(battery side) go in first and are soldered from the front; front parts (display, buttons, switches, LED, photodiode) go in last and are soldered from the back.

1. Check the board against the Gerbers when it arrives (`out/phone-gerbers.zip` in a Gerber viewer); no bridged pads.
2. Back side, power only: slide switch, regulator (TO-92, flat side up, pin 1 GND at the "G" mark), C1 and C2 (C2 is electrolytic: mind the + mark). **Fit no ICs.** Wire the battery holder
   to the two BT pads (red +). Switch on: the multimeter must read 5.0 V (+/-0.1) from the regulator's pin 3 to pin 2. Stop if not.
3. The PIC's socket, then resistors and capacitors (shortest first). Electrolytics have polarity: the square pad is +.
4. Crystal, Q1 and Q2, then the soldered ICs (U2 to U5; pin 1 is the square pad) and, with the power off, the PIC in its socket. Pin 1 is the square pad.
5. Front: the two display modules (pin 1 square pad, bottom left of each). Power up: a dash appears at the left. If blank, check R26 and the 5 V.
6. TALK and CLEAR, then the two microswitches. CLEAR restarts the display. Mimic a dial by hand: close SW3, tap SW2 three times, open SW3: a 3 appears.
7. Speaker and microphone (short wires from the pads). A dialed digit makes a tone from the speaker.
8. IR LED and photodiode last (leads bent 90 degrees so they face the top edge). Point two phones at each other a hand's length apart and dial: the digit
   appears on both. Hold TALK and speak: expect quiet, noisy voice on the other. Tune by ear.

Likely first things to adjust: R19 (receive gain), R20/R21 or RV1 (speaker level), R16, R12 and R15 (modulation depth), R9 (IR bias), R26 (display brightness).

## Checked and not checked

| Check | Result |
| --- | --- |
| KiCad ERC | 0 violations |
| KiCad DRC | 0 violations, 0 unconnected, with **all silkscreen rules on**. One rule is set to *ignore* in `kicad/phone.kicad_pro`: `lib_footprint_mismatch` (back parts are mirrored copies of the library footprints). For two parts (U1 and C9) the value text did not fit clear of pads and is on the fab layer, not the silkscreen |
| Schematic vs board parity | not run |
| gpasm | assembles (`tools/build_firmware.sh`) |
| Firmware simulation | passes `tools/picsim.py` (my own PIC16F84A instruction simulator, run on the PIC16F628A build; it does not model the comparators, so CMCON = 7 is untested): start-up and display, dialing at 33 ms and 8 ms pulses, all ten digits' tone pairs (Goertzel), 10 pulses = 0, 11 ignored, received digits, TALK mutes and lights the point, and the IR bias line (RA0) is driven only for the tone |
| 3D export | `kicad-cli pcb export glb` works; `tools/glb_check.py` checks each part's mesh against its footprint |
| Not tested | the analog parts, the IR link's range, real CM8870 timing, the regulator, the Gerbers in a viewer or at a board house. gpsim was installed but not used |
| Parts | see `PARTS.md` and the cost sheet; prices and stock were read from retailer pages on 2026-11-03 where marked |

## Assumptions to confirm before ordering

- **Display:** 3641AS-style module (30 x 14 x 7.2 mm, pin rows 10.16 mm apart, 12 pins) per the G-NOR GNQ-3641 datasheet; the Futurlec 7FR3641AS unit itself was not seen.
- **Microswitch** pins (5.08 mm apart; the Omron SS-5GL2 has solder-lug terminals), **slide switch** pitch and **tactile** pin spacing: placeholders marked ASSUMED in `tools/footprints.py`.
- The **CM8870 OSC2 to PIC OSC1** link through 30 pF follows the chained-decoder circuit in the datasheets but has not been tried with a PIC.
- Component heights in the mechanical file and the 3D models are typical values (simple boxes and cylinders, not the parts' real shapes).

## References and credits

Designed by Claude Sonnet 5.5 (Anthropic) under Lewis Moten's direction, in KiCad 9 (schematic and board are written as text by the scripts here and
checked with `kicad-cli`). Firmware assembled with gputils/gpasm. The firmware simulator, router, STEP writer and GLB packer are original.

- DTMF standard frequencies: ITU-T Recommendation Q.23.
- MT8870D/MT8870D-1 (Mitel/Zarlink/Microchip) and CM8870/70C (California Micro Devices) datasheets; HT9170 (Holtek) datasheet; MAX7219/MAX7221 (Maxim Integrated) datasheet; GNQ-3641 (G-NOR) display datasheet; Microchip PIC16F84A datasheet.
- KiCad stock symbols (CC-BY-SA 4.0 with the KiCad library exception) are embedded in the schematic. See `NOTICE.md`.

No real phone brand is named. The game it goes with is `games/year2000`.

## Rev C (cost) notes

- Parts: PIC16F628A, an HGSEMI MAX7219N clone (stock unconfirmed), MCP1702 TO-92 regulator, one socket, two fewer capacitor values. Prices: the parts sheet in `.for-lewis/research/` (about $38.78 per phone against $67.85 for rev B).
- Board size is unchanged, 73.66 x 175.26 mm: it is the shell's size, so it cannot fit JLCPCB's 100 x 100 mm tier. Shrinking it would mean redesigning the shell and moving the dial, the two displays, the speaker and the battery holder.
