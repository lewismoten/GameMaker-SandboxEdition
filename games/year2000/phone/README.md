# THE PHONE OF THE FUTURE (electronics, rev C)

A solderable toy kit that goes with In The Year 2000!: "a real working wireless phone", the way a 1993 game
imagined one. Infrared voice and touch tones, an eight-digit red display, a real pulse dial, a PIC16F628A and a
CM8870-family tone decoder, through-hole parts only. Two phones are needed to play: digits dialed on one appear on any
phone in sight (no call set-up).

**This is an untested design. Nobody has built one. Treat every claim below as "should", not "does".**
The schematic and board pass KiCad's electrical and design-rule checks and the firmware's logic passes a simulator
I wrote; nothing was powered, soldered or listened to.

Rev C is the cheap, easy-to-build revision. Rev B cost about $68 a phone in parts (most of it a $24 display driver), needed a
72 x 172 mm board (about $96 for three from OSH Park) and a programmer that may not support its chip. Rev C is about $17 a phone in
parts, a 99 x 99 mm board in the cheapest tier at JLCPCB and PCBWay, and a programmer built from an Arduino Nano. The numbers and
sources are in the cost sheet (`.for-lewis/research/phone-of-the-future-parts.md`, not in the repository); the short version is
in "What Rev C changed" below.

## Two builds, named the way Dex would

Dex Dynamo (age 11) wrote a twenty-page science fair report, THE POCKET TELEPHONE, and Sparky 3000 ate it. This kit is
what he would build from it, in two sizes. Both names are on the silkscreen (front and back) and in the desk's 3D viewer.

|       | **Science Project No. 2: The Pocket Telephone, Junior Lab Edition (parts from any hobby shop)**                                                                 | **Science Project No. 1: The Pocket Telephone (Deluxe Model)**                                                |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Where | this folder                                                                                                                                                     | `deluxe/` (the earlier Rev C: sources restored from commit `7e8548a11`, see `deluxe/README-earlier-rev-c.md`) |
| Board | 99 x 99 mm, the cheapest board tier                                                                                                                             | 73.66 x 175.26 mm                                                                                             |
| Parts | PIC16F628A, clone MAX7219, 6 mm tactile switches, ZEPPP programmer; the battery holder and the microphone capsule are off the board, in the shell's battery bay | the long board; the 4 x AAA holder and the microphone are in the bay                                          |
| Shell | one full-width case: earpiece pod, front cover, back tray with the battery bay behind the dial module, battery door, six screws                                 | front cover, back tray with the bay (battery door in its floor)                                               |

Each folder rebuilds on its own (`deluxe/tools/` has its own generators and shares `tools/silkart.py` and `tools/dex_art.py`).
The rest of this file describes the Junior Lab Edition; the Deluxe Model differs in its board and its on-board battery holder.

## The 3D-printed shell and the dial module

`tools/shell.ts` builds each variant's shell as distance fields with the repository's trinket tools (`web/packages/tools/src/mesh/`), sized from its own
`mechanical/interface.json`, `kicad/qr_spots.json` and `viewer/parts.json`. It writes one binary STL per printed part, in printing orientation, to
`<variant>/shell/`, checks each (size, triangles, pieces, thin specks, overhang) and merges every part into `viewer/parts.json` + `parts.bin`, in the
groups `shell`, `dial` and `battery`, so the desk's viewer explodes the case around the board. The Junior Lab case is `tools/shellCheap.ts` (with the dial in
`tools/dialModule.ts`); the Deluxe keeps its own shell in `tools/shellParts.ts`, which is described in `deluxe/README-earlier-rev-c.md`.

### The Junior Lab case: one full-width body

The case is 103.8 mm wide from the top to the chin (the board is 99 x 99) and about 240 mm long, 34 mm thick. Seen from the front, top to bottom:

1. **Earpiece pod** (above the board, between the two infrared parts): the 28 mm speaker clips under the cover's roof, behind a grille of 2 mm holes. Two
   2 mm arms per clip follow the speaker's rim and end in a barb (an 0.8 mm ledge under its back rim), so the speaker snaps in from the back and nothing is glued.
   Two wires (+ is the square pad) run from the board's LS1 pads. This frees the 28 mm circle the speaker used on the board (616 mm2; the pads stay).
2. **The 99 x 99 board**, clamped between the cover's and the tray's walls by the corner bosses.
3. **Lower body**: the dial module sits in the cover (its plate stands 0.8 mm proud of the face), the 4 x AAA holder lies behind it in the tray (the module's base
   lies 0.2 mm over the holder like a lid), the microphone capsule is at the chin under a grille.

_Why this layout._ The dial is below the board where a thumb or finger reaches it best, with room for a 74 mm plate and 13 mm holes. The heaviest part, the
battery, is directly behind the dial, so the phone's weight sits in the palm of the hand that holds the lower body, the thumb reaches the TALK and CLEAR caps
on the board's lower edge, the earpiece is at the top and the mouthpiece at the bottom, 190 mm apart, about a real handset's span. The back is flat and closed.

- **Front cover**: covers everything except the dial opening (a 76.4 mm hole), the display window, the speaker and mouthpiece grilles and the TALK / CLEAR
  caps. The dial module's tube hangs from the roof around the opening; the base's rim seats against its end, so nothing is glued. The finger stop's clip
  comes through a small slot at 4 o'clock. It prints face down.
- **Back tray**: closed, one flat floor 20.7 mm under the board's back plane (a stepped floor would print as an 11,000 mm2 overhang). The battery cradle has crush
  ribs 0.3 mm off the holder on all four sides; the door is in the floor under the holder, so the cells change **without opening the case**. The volume wheel's
  slot is in the side wall. Six screw seats.
- **Six screws, all from the back.** M3 x 30 pan-head **thread-forming (self-tapping) screws**, heads on the back, into 2.5 mm pilot holes in six bosses of the
  front cover: the case's two top corners (they pass through the board's top mounting holes and clamp it), the board's two lower mounting holes (the
  board is clamped between bosses in both halves), and the two corners of the chin. The cover and tray have no other screw bosses. The dial uses the same kind
  of screw (M3 x 10, into a 2.5 mm pilot in its post). Why not heat-set inserts: a lead stub of a part on the back stands 3.4 mm from the board's top left hole, which
  leaves a boss only 2.4 mm in radius, too small for an insert. The pilot holes stop short of the roof (nothing shows on the face).
- **Battery holder**: held by the tray's cradle (ribs on all four sides, 0.3 mm of slack), crush ribs, and the module's base 0.2 mm over its top. Most 4 x AAA
  holders have a screw hole in the middle, but the part listed here (Parts Express 142-254) is not checked for one, so no screw is used. If yours has a center
  hole, a screw from the back into a boss would be an upgrade.
- **Microphone**: the 9.7 mm capsule in a collar hanging from the cover, at the chin. Its twisted pair runs from the board's MK1 pads, out to the corridor
  beside the holder (x 2.5 and 4.5 mm), down the lower body and across below the dial's base to the capsule.
- **Wires to the dial's switches**: SW2 and SW3 are 6 mm tactile switches in the dial module, with two thin wires each to wire pads at the bottom of the board's old
  dial circle (24, 80 and 36, 80 mm). The wires run along the front of the board's left side, in the cover's cavity, to the module. (Their path is not drawn.)

### The dial module

A self-contained stack, drawn from scratch (no mesh or STL copied) in `tools/dialModule.ts`, numbers shared with the mechanism check in `tools/dialParams.json`.
Front to back: **plate**, **cam wheel**, **spring**, **base**. Fat-finger sizing: 13 mm finger holes on a 29 mm ring (webs of 2.0 mm), a 74 mm plate, a clip-on
finger stop with an arm over the holes at 4 o'clock, hole 1 at 3 o'clock, 30 degrees from the stop.

| Part           | What it is                                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dial-plate`   | 74 mm plate, ten 13 mm holes, a hub tube with two drive tabs, two flexure pawls (2 mm thick, 18 mm of arm), a 1.5 mm wall under the rim that presses SW3 whenever the plate is off rest, a rest dog                                                                 |
| `dial-cam`     | the pulse cam wheel: an internal 12-tooth ratchet the pawls drive only on the return, 12 lobes on its rim that press SW2 sideways, 12 detent teeth, a smooth band for the brake, a grease groove under its web                                                      |
| `dial-spring`  | the printed flat spiral spring in one piece with its own frame ring (the frame has three lugs that key into a wall on the base, six slots in the hub ring set the preload)                                                                                          |
| `dial-base`    | the backplate: the center post with a 2.5 mm screw pilot, the **ten digit pedestals** (the digits are engraved on them, 2.6 mm under the plate, so they read through the holes), switch cradles, the hold-back and brake leaves, the rest post, an ear for the clip |
| `dial-stop`    | the finger stop: a C-clip over the base's ear, a post through the cover's slot, an arm over the plate; printed on its side                                                                                                                                          |
| `dial-bushing` | the spacer the washer clamps, so the plate turns freely on the post and cannot lift off (the washer overlaps the plate's hub lip by 1.2 mm each side)                                                                                                               |
| bought         | 2 tactile switches (SW2, SW3, on the BOM already), an M3 x 10 thread-forming screw, an M3 fender washer 9 mm outside diameter                                                                                                                                       |

- **One-way counting (the ratchet clutch).** The plate winds clockwise. Two flexure pawls on the plate ride over a 12-tooth ratchet on the cam wheel, one click
  every 30 degrees, and a hold-back leaf on the base keeps the cam wheel still, so SW2 does nothing on the wind. On the return the pawls catch the teeth's steep
  faces and carry the cam wheel back with the plate, and the 12 lobes press SW2 once per 30 degrees of cam travel. Hole 1 is one pitch (30 degrees) from the
  stop, so digit n travels 30 x n degrees and gives exactly n pulses (0 is 300 degrees, 10 pulses). When the plate stops at rest, the hold-back leaf's gentle
  forward flank lets the cam coast the last 8 degrees to its parked tooth, which also puts every ridge 8 degrees ahead of the pawl, so a finger that winds up to
  21 degrees past the stop (or 0.5 degrees short) still crosses the same number of ridges. `shell.ts` runs the **angle walk** (`tools/dialMechanism.ts`, the
  same arithmetic as the Stage Box's mechanism check) for every digit and fails the build if a wind gives a pulse or a return gives other than n; the phone's
  firmware simulator (`tools/picsim.py`) plays the same walk into the real hex, with contact bounce.
- **Retention.** The post stands on the base; the M3 x 10 screw goes through the washer and the bushing into the post's pilot and clamps only the bushing. The plate
  turns on the post and its hub lip sits between the bushing's flange-free top and the washer, so it can lift only 0.6 mm and never fall out. No snap prongs.
- **Return spring.** First choice, the printed spiral: strip 1.6 x 3.0 mm, pitch 2.8, 4 turns (about 300 mm), parameters in `DM.spring`. In PETG (E about 2 GPa,
  an assumption) it gives about 5 N mm at rest (60 degrees of preload) and 30 N mm fully wound (about 1 N at a finger), strain 1.3 % (PETG takes about 2 %, PLA
  about 1 %, and PLA creeps: use PETG). Fallback: a metal torsion spring, 0.5 mm wire, 13 mm coil, fits around the spring frame's hub ring (OD 16 mm; the printed
  spiral is snipped off) with one leg in a hub slot and the other in a lug notch of the base's wall.
- **Speed.** A free printed dial returns in about 50 ms, far too fast; the cam wheel is slowed by the grease film between its web and the spring (a 0.4 mm gap, a
  groove to hold the grease) and by the brake leaf's friction. `shell.ts` prints an estimate for several greases; the first print decides (thin the grease or add a
  shim to change the film). The firmware accepts 8 to 15 pulses a second.
- **Credit.** Inspired by "Rotary Dial mechanism" by dAcid (Thingiverse 3153349, CC BY 4.0, https://www.thingiverse.com/thing:3153349). Ideas we took: a printed
  spiral spring in one piece with a frame, a clip-on finger stop, a headed center screw through a stack that prints flat, and digits printed under the holes. Ours
  differs: a ratchet clutch so that only the return counts (that dial reads both ways with an optical sensor and software), tactile switches in place of the
  optical slotted disc, a bigger plate with 13 mm holes, a separate cam wheel, a grease damper, a heat-free self-tapping screw, and every dimension is our own
  (no STL, mesh or spring parameter was copied or adapted, so NOTICE.md has no entry for it).

### Assemble the module and the case

Print the plate, cam wheel, spring, base and the clip in **PETG** (the flexure pawls, leaves and the spiral spring crack and creep in PLA); the cover, tray, caps and door can be PLA.
The STLs in `shell/` are in printing orientation.

1. **Dial module (on the bench).** Press SW3 flat into its low frame on the base (pins down through the four holes) and SW2 on its side into its cradle, button toward the center. Solder
   two wires to each switch (pulse and ground; about 100 mm). Set the spring plate on the base, its three lugs in the wall's notches. Put the cam wheel over it
   (a dab of grease on the spring plate's top and in the cam's groove). Wind the plate 60 degrees clockwise from rest and lower it on the cam wheel: the hub tube's two tabs go into two
   opposite slots of the spring's hub ring, the pawls fall into the cam's teeth. Let it back to its rest dog. Drop the bushing on the post, then the washer, then the M3 x 10 screw: snug, then back off an eighth of a turn
   so the plate turns freely. Press the clip over the base's ear.
2. **Check the dial** before the case: wind a digit to the clip's arm and let go; SW3 should close at once and SW2 should click open and shut once per 30 degrees of the return (with a meter, or the board).
3. **Case.** Cover face down: the speaker (two wires) pops into the pod's clips from behind; the microphone capsule goes in its collar; the caps drop into their holes. Lay the dial module in the
   tube from behind (the plate through the opening, the clip's post through its slot). Lower the board onto the cover's bosses, solder the dial and speaker wires to their pads, the holder's leads and
   the microphone's pair, set the holder in the tray's cradle and the tray on the cover. Six M3 x 30 screws from the back, then the battery cells and the door.

### Lead and solder clearance

Every pad is a plated through-hole, so a part on one face has its trimmed lead and solder fillet standing out of the other. The viewer's models leave them out,
so `tools/clearance.ts` adds them (a 0.9 mm radius fillet 1 mm tall, then a 0.3 mm wire, to **LEAD = 2.5 mm** from the board face, at every pad of
`kicad/placement.json`) and measures every printed part (including the whole dial module and the six screw bosses) against those stubs and against every part
body. `shell.ts` fails the build, and `web/src/desk/boxes/phone/phoneClearance.test.ts` fails the tests, if any gap is under 1 mm; the numbers go to
`viewer/clearance.json`. The 2.5 mm is an **assumption** (IPC-A-610 allows 0.5 to 1.5 mm; a hobbyist trims to about 1 to 2 mm). The dial module is below the board, so
it is far from every stub; the closest approaches are the screw bosses and the cover over the board.

Nothing was printed. The fits (0.3 mm), the lobes' travel (0.15 mm of overtravel), the spring and the grease are starting guesses.

## What is printed on the board

Front: the project name ("SCIENCE PROJECT NO. 2" and "JUNIOR LAB EDITION", or "NO. 1" and "DELUXE MODEL"), "IN THE YEAR 2000!", "SANDBOX SOFTWARE" and
"MADE WITH GAME-MAKER". The front of the 99 x 99 board is full of through-hole pads, and the dial and speaker cover their circles, so there is no
room there for a code. On the back, in the blank spots: two QR codes (the game's site, and this folder's parts list and build steps on GitHub) and a
block-art picture of Dex (`tools/dex_art.py`, from his sprite, as big as the back's pads leave room for: 16.8 x 18.9 mm on the Junior Lab board, with the few pixels that would land on a pad left out like the front's art clipped away from pads): one color of silkscreen, with tone shown by diagonal hatching and cross-hatching and his
face and hands left bare, so he is never an undressed outline. A code is silkscreen where a module is light and bare soldermask where it is dark.
`tools/silkart.py` draws them (QR from OpenCV's encoder, Apache-2.0). Modules are 0.5 mm, except the parts code on the Junior Lab board (0.44 mm) and the
site code on the Deluxe board (0.45 mm), which had to be a little smaller to fit. `tools/qrscan.py` decodes the rendered preview and compares it with the URL:
the layout scans; whether a phone camera reads these small modules from a real board has not been tried.

## Rebuild everything

From the repository root, one command rebuilds both variants (schematic, board, ERC and DRC, Gerbers, 3D parts file, BOM, previews, QR scan, shell)
and writes `games/year2000/phone/out/build.log`:

```sh
npm run phone:build
```

## What is here

| Path                                                | What it is                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `kicad/phone.kicad_sch`, `phone.kicad_pcb`          | The KiCad 9 project (written by the scripts below; open it in KiCad to look or edit)                               |
| `kicad/phone.pretty/`, `phone.kicad_sym`, `models/` | Big-pad footprints, the two local symbols (CM8870, 4-digit display), and the simple 3D models (`.wrl` and `.step`) |
| `firmware/phone.asm`                                | PIC16F628A firmware, gpasm                                                                                         |
| `bom.csv`, `PARTS.md`                               | Bill of materials and readable parts list (`tools/bom.py`)                                                         |
| `mechanical/interface.json`                         | Board outline, holes, where everything sits and how tall (for the shell)                                           |
| `viewer/parts.json`, `parts.bin`                    | The board and every part as a compact triangle set for the site's 3D viewer (`tools/export3d.sh`)                  |
| `tools/`                                            | Generators and checks (below)                                                                                      |
| `out/` (git-ignored)                                | Gerber zip, schematic PDF, ERC and DRC reports, the `.hex`, the GLB files and the preview PNGs                     |

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

## What Rev C changed (and why)

Prices are quantity 1, checked 2026-11-03 (sources and caveats are in the cost sheet).

| Decision                     | Rev B                                                | Rev C                                                                                                          | Saves per phone     |
| ---------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------- |
| Display driver               | MAX7219CNG+ $23.97                                   | clone MAX7219N (HGSEMI, DIP-24, LCSC) about $1; genuine MAX7219CNG is $7.95 at Jameco if a clone is not wanted | $22.97 (or $16.02)  |
| Microcontroller              | PIC16F84A $4.95, 12 to 13 V programming              | PIC16F628A $2.20, same 18-pin DIP and pinout, programmable at 5 V                                              | $2.75               |
| Programmer (once)            | PICkit 5 $79.68, F84A support unconfirmed            | Arduino Nano clone about $9 and the open-source ZEPPP sketch                                                   | $70 once            |
| Board                        | 72 x 172 mm, about $96 for 3 (OSH Park)              | 99 x 99 mm, $2 for 5 (JLCPCB) or $5 for 10 (PCBWay), plus shipping                                             | about $75 per order |
| Regulator                    | LM2940T-5.0 $2.22, TO-220                            | MCP1702-5002E/TO $0.65, TO-92                                                                                  | $1.57               |
| Dial switches                | two lever microswitches $5.22                        | two 6 mm tactile switches $0.50 (the dial's cams press them from above)                                        | $4.72               |
| Battery and power switch     | 4 x AAA holder $2.54 and slide switch $0.95          | one holder with cover and switch, $1.93                                                                        | $1.56               |
| Sockets                      | four machined sockets $5.48                          | two stamped 18-pin sockets $0.16 (the PIC and the decoder)                                                     | $5.32               |
| IR photodiode and LED        | BPW34 $1.82, TSAL6200 $0.50                          | 5 mm IR photodiode $0.25, 5 mm IR LED $0.16                                                                    | $1.91               |
| Everything else              | LM358 $1.18, LM386 $1.18, 2N3904 x2 $0.58, mic $1.49 | $0.22, $0.55, $0.12, $0.45                                                                                     | $3.09               |
| Resistors and capacitors     | an assortment, about $9 (estimate)                   | 7 resistor values and 4 capacitor values, about $2.60                                                          | about $6.30         |
| **Total (one phone, parts)** | **$67.85**                                           | **$17.37**                                                                                                     | **$50.48**          |

Two phones: $135.70 (Rev B) becomes $34.14; the resistor packs of 10 stretch across both.

**Fewer parts.** 71 parts become 65. Gone: the volume trimmer, the zobel resistor and capacitor, the half of the input network the
speaker amplifier already has (its own 50 k to ground), the receive-amp roll-off capacitor, the LM386 bypass capacitor, the
MAX7219 bulk capacitor, the slide switch, and two sockets. Added: a six-pin programming header.

**Few values.** Resistors: 100, 1 k, 4.7 k, 10 k, 47 k, 100 k, 470 k. Capacitors: 100 nF, 1 uF, 10 uF, 100 uF. The tone mixer is now
two 1 k resistors and 100 nF in place of two 10 k and 10 nF (same corner frequency), the MAX7219's current-set resistor is 10 k with
the brightness set by the firmware (register 0x0A) in place of a 30 k, and the IR driver and the receive amp were rescaled onto the
same values (calculated, not measured: IR current about 8 mA instead of 11 mA, receive gain 21 instead of 47 but a 47 k photodiode load
instead of 22 k, so about the same signal).

**Easier to build.** Through-hole only. Resistors are standard 1/4 W parts lying flat on 7.62 mm holes. Only the PIC and the decoder
sit in sockets (the PIC is the part you program; the decoder is one of three look-alike chips). The battery holder is not on the board:
it lies in the shell's battery bay and two wires reach the board.

## Theory of operation

One infrared beam carries live voice and touch-tone digits, half duplex.

- **Sending voice.** Hold TALK. It puts +5 V on the TALK line, which (1) powers the electret microphone through its bias
  resistor (R3), (2) switches on the IR LED's bias (R8 feeds the 2N3904's base from the TALK line, so the LED is dark and draws no
  current otherwise) and (3) turns on a transistor that shorts the receiver, so a phone does not hear itself. A half of the LM358
  amplifies the mic (gain 47) and modulates the LED around its bias.
- **Sending digits.** Dialing a digit makes the PIC drive the TALK line high for the tone (about 10 ms before, 103 ms during):
  bias on, receiver muted, microphone powered. Two pins output square waves at the row and column frequencies (697, 770, 852, 941 Hz
  and 1209, 1336, 1477, 1633 Hz, ITU-T Q.23); two 1 k resistors and 100 nF sum and soften them. The sum goes to the IR driver and,
  through a large resistor, to the speaker (after the mute point), so the sending phone hears its own tones. The microphone is live during
  the tone, so room noise rides along with it.
- **Receiving.** A 5 mm IR PIN photodiode with a 47 k load, AC-coupled into the other LM358 half (gain 21),
  gives the audio. An LM386 (gain 20) plays it. The same audio goes to the CM8870, which turns tone pairs into a 4-bit code and
  raises StD.
- **Display.** The MAX7219 scans two 4-digit common-cathode modules and the PIC writes it over three wires. A digit typed or received
  is added at the right of the number (left-aligned). The left digit's decimal point lights while TALK is held. An empty display shows a dash.
- **Dial.** SW2 (pulse) closes once per number step on the return; SW3 (off-normal) is closed while the dial is off rest. Both are 6 mm
  tactile switches inside the dial module (two wires each to the board's SW2 and SW3 wire pads); the dial's one-way clutch makes the pulse cam move only on the
  return. The PIC counts closures after SW3 closes (debounce about 5 ms for pulses, so contact bounce does not count and pulses at 8 to 15 a second still do, and 15 ms for
  off-normal); when SW3 opens the count is the digit. 10 pulses are 0, more than 10 are ignored.
- **CLEAR** is the PIC's reset button (MCLR): it restarts the phone and clears the number.
- **Volume.** The side thumbwheel RV1 (100 k) is a divider after R20 (33 k): the amplifier input sees the wiper. At the top of its range the level is within about 0.3 dB of the old fixed R20 (47 k) against the amplifier's own 50 k input (an estimate from the divider alone; the source impedance upstream was not measured). The wheel also scales the tone path through R16 a little. 65 parts become 66 with RV1; one extra part, about $1 to $2 each (price not confirmed: no retailer page was read).
- **Clock.** One 3.579545 MHz crystal runs the CM8870; the PIC (XT mode) takes the clock from the CM8870's OSC2 through a 100 nF
  capacitor (C12). The PIC runs at 894,886 instructions per second; the tone loop is exactly 24 cycles.

### Tone decoder choice

`MT8870DE` has the same 18-pin DIP pinout as the CM8870P (datasheet pin table, p. 6): pins 5 and 6 are
"IC" (must be tied to ground, as here), 17 is St/GT, 4.75 to 5.25 V supply. The Holtek `HT9170B` is also pin-compatible (pins 5 and 6
are INH and PWDN, tied low), though Holtek lists it as phased out. The socket takes any of them.

### The PIC16F628A and its pins

The 16F628A is a near drop-in for the 16F84A: the same 18-pin DIP and pin numbers, 2K words of flash instead of 1K, and RAM from 0x20
instead of 0x0C. The firmware changes are small and all in `firmware/phone.asm`:

- `CMCON = 7` at start-up (the 628A's two comparators share RA0 to RA3 and power up on, so they are switched off).
- The register block starts at 0x20 (0x0C to 0x1F are special registers on the 628A).
- The configuration word is `XT oscillator, watchdog off, power-up timer on, MCLR on, brown-out off, LVP off, no code protection`
  (0x3F21, checked bit by bit against the datasheet's table). **LVP off** matters: with low-voltage programming on, RB4 becomes the PGM
  pin and could not be the CM8870's Q1 input. A blank chip comes with LVP on, so it can be programmed at 5 V the first time and that
  programming turns LVP off. A chip programmed this way can only be rewritten with a 12 to 13 V programmer (a PICkit, for example) or
  replaced with a blank chip (about $2).
- Display brightness is now register 0x0A = 1 (with R25 at 10 k), where Rev B used a 30 k resistor and 5.

### Pin budget (PIC16F628A, 13 I/O used)

| Pin | Use                                                              |     | Pin      | Use                                          |
| --- | ---------------------------------------------------------------- | --- | -------- | -------------------------------------------- |
| RA0 | TALK line (input; driven high by the PIC while it sends a digit) |     | RB0      | dial pulse (low = closed, weak pull-up)      |
| RA1 | MAX7219 DIN                                                      |     | RB1      | dial off-normal (low = closed, weak pull-up) |
| RA2 | MAX7219 CLK                                                      |     | RB2      | tone square wave A                           |
| RA3 | MAX7219 LOAD                                                     |     | RB3      | tone square wave B                           |
| RA4 | CM8870 StD (input; open-drain output, unused as one)             |     | RB4..RB7 | CM8870 Q1..Q4                                |

CLEAR takes none (it is MCLR), and the pulsed IR bias costs no pin (it shares RA0).

### Power: four AAA cells and a 5 V low-dropout regulator

Limits: MAX7219 4.0 to 5.5 V; PIC16F628A 3.0 to 5.5 V at 4 MHz (XT); CM8870/MT8870 4.75 to 5.25 V (6.0 V absolute); LM386 4 to 12 V; LM358 3 to 32 V.
Three cells (4.5 V fresh) fall under the MAX7219's 4.0 V early, and four fresh alkaline cells (6.4 V) are over the decoder's limit, so
**four AAA cells into a 5.0 V LDO**: the MCP1702-5002E/TO (TO-92, 250 mA, 13.2 V in; about 0.5 to 0.6 V typical dropout at 250 mA per the datasheet
and a distributor listing, less at lower current). Its datasheet asks for 1 uF minimum and 1 to 22 uF at the output (ceramic, tantalum or aluminum electrolytic are all
named), hence the 10 uF electrolytics at C1 and C2. Expected (calculated, not measured): a steady 5 V until the cells average about 1.3 V
each (at the LM386's loud peaks, near 250 mA, it sags sooner), and a draw of roughly 60 to 80 mA with
eight digits lit, so roughly 12 to 16 hours from alkalines. **Pin order:** the TO-92 is pin 1 GND, pin 2 IN, pin 3 OUT, unlike the
TO-220 parts. The footprint carries G, I, O marks and its square pad is GND.

## Board layout (rev C)

The board is **99 x 99 mm**, inside JLCPCB's and PCBWay's cheapest tier (100 x 100 mm). Everything the user sees is on the front;
electronics are on the back. The dial is no longer on the board: it is a module in the case's lower body, and the speaker is the earpiece in the cover's top pod.
Both circles (dial radius 20 mm, centered at 30, 61; speaker 28 mm, centered at 74, 56) are still kept free of pads, vias and F.Cu tracks and carry only silkscreen (the speaker's
616 mm2 circle is free for a future part). Only wire pads remain: SW2 and SW3 (two pads each, where the switches stood) and LS1 (two pads, + is the square one, 19 mm
below the old speaker center). Back copper may cross those areas.
Power and ground use 0.5 mm tracks (no zone fill is possible without KiCad's Python, so there is no ground pour). Silkscreen art (orbit rings, rays around
the dial, a YEAR 2000 badge, lettering) is clipped away from pads by the generator. The bottom edge holds TALK, the battery pads, the
microphone, the programming header and CLEAR. The battery holder (60 x 52 x 17 mm, typical) is not on the board: it goes in the shell's
battery bay below the bottom edge, with its leads soldered to the two BT pads. Preview images: `out/front.png` and `out/back.png` after `tools/export3d.sh`.

## Build order for a beginner

You need a 25 to 40 W iron, thin rosin-core solder, flush cutters, a multimeter and four AAA cells; and to program the PIC an Arduino
Nano (or Uno), five jumper wires, Java and the ZEPPP programmer (below). Only the PIC and the decoder go in sockets. Parts on the back
(electronics side) go in first and are soldered from the front; front parts (display, buttons, switches, LED, photodiode) go in last and are
soldered from the back. Electrolytic capacitors: the square pad is +, and the + mark is silkscreened.

1. Check the board against the Gerbers when it arrives (`out/phone-gerbers.zip` in a Gerber viewer); no bridged pads.
2. Back side, power only: regulator (lying flat, mind its G, I, O marks), C1 and C2 (the + marks). **Fit no ICs.** Solder the battery
   holder's two leads to the BT pads (red +) and switch the holder on: the multimeter must read 5.0 V (+/-0.1) between the regulator's
   OUT and GND pads. Stop if not.
3. Resistors and ceramic capacitors (shortest first), then the electrolytics (C1, C2, C4, C5 and C18: the square pad is +; C5 is a 1 uF electrolytic with + on the LM358's output side, the pad marked +), then the two 18-pin sockets. C3, the other 1 uF coupling capacitor, stays ceramic because the DC across it reverses (0 V on the microphone side while TALK is up, about 2.5 V on the amplifier side; with TALK held the microphone side is the electret's bias, which depends on the capsule). Pin 1 is the square pad.
4. Crystal, the two 2N3904s (flat side as drawn), the LM358, LM386 and MAX7219 (pin 1 square pad, notch toward it). The two socketed
   chips wait.
5. **Program the PIC** (next section) with the CM8870 socket empty, then put the PIC in its socket and the CM8870 in the other.
6. Front: the two display modules (pin 1 square pad, bottom left of each). Power up: a dash appears at the left. If blank, check R25 and the 5 V.
7. TALK and CLEAR, then the two dial-switch wires (SW2, SW3 pads; the switches are in the dial module). CLEAR restarts the display. Mimic a dial by hand: close SW3, tap SW2 three times, open SW3: a 3 appears.
8. Speaker (two wires from the LS1 pads to the earpiece in the cover's pod) and microphone (two wires from MK1 to the capsule). A dialed digit makes a tone from the speaker.
9. IR LED and photodiode last (leads bent 90 degrees so they face the top edge). Point two phones at each other a hand's length apart and dial: the digit
   appears on both. Hold TALK and speak: expect quiet, noisy voice on the other. Tune by ear.

Likely first things to adjust: R18 and R19 (receive gain), R20 and RV1 (speaker level), R16 and R12 and R15 (modulation depth), R9 (IR bias), the brightness
register in the firmware.

## Programming the PIC (an Arduino Nano and ZEPPP)

[ZEPPP](https://github.com/battlecoder/zeppp) ("Zero External Parts PIC Programmer", by battlecoder, MIT License) turns an Arduino Nano,
Uno or Pro Mini into a low-voltage programmer for PIC16F6xx parts; its list names the 16F628A. A Nano clone is about $9 (Jameco KS0173,
2026-11-03). It needs no parts on the board but the six-pin header, J1.

1. `tools/build_firmware.sh` (or take `phone.hex` from a release): `out/firmware/phone.hex`.
2. Load `ZEPPP/ZEPPP.ino` from the ZEPPP repository onto the Nano with the Arduino IDE (once). Install Java and download `zeppp-cli.jar`.
3. Phone switched off, batteries out of the way, the CM8870 socket **empty**. Wire the Nano to J1 (pin 1 is the square pad, marked "1"):

   | J1 pin | Signal    | Nano |
   | ------ | --------- | ---- |
   | 1      | MCLR      | D6   |
   | 2      | +5 V      | 5V   |
   | 3      | GND       | GND  |
   | 4      | PGD (RB7) | D7   |
   | 5      | PGC (RB6) | D8   |
   | 6      | PGM (RB4) | D9   |

   (The 5 V pin powers the whole board for a few seconds: the display, op-amp and audio chip add up to a small load. If the Nano's USB
   port complains, switch the phone's own batteries on instead and leave J1 pin 2 unwired.)

4. Put the blank PIC16F628A in its socket. Run: `java -jar zeppp-cli.jar -c <port> -wait 2000 -d 16f628a -i out/firmware/phone.hex -p`
   (the `-wait` is for the Nano's USB reset; `-p` erases and programs everything), then verify with
   `java -jar zeppp-cli.jar -c <port> -wait 2000 -i out/firmware/phone.hex -va`.
5. Check the configuration word: `-ra -o dump.hex` and look for the line `:02400E00213F50` (word 0x3F21: XT oscillator, watchdog off,
   power-up timer on, MCLR on, brown-out off, LVP off). **The ZEPPP page does not say whether `-p` writes the configuration word from
   the hex file. If the dump shows something else, the chip will not run at the right clock; ask the author or use another programmer.**
6. Unplug the Nano, put the CM8870 in its socket, and continue with step 6 above.

An ordinary PICkit also works on J1 (pin order MCLR, VDD, GND, PGD, PGC; the CM8870 socket empty) and is the way to reprogram a chip
whose LVP bit is off. The Rev B sheet's PICkit 5 ($79.68) is not needed.

## Checked and not checked

| Check                     | Result                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KiCad ERC                 | 0 violations                                                                                                                                                                                                                                                                                                                                                                                                          |
| KiCad DRC                 | 0 violations, 0 unconnected, with **all silkscreen rules on**. One rule is set to _ignore_ in `kicad/phone.kicad_pro`: `lib_footprint_mismatch` (back parts are mirrored copies of the library footprints). Some part values did not fit clear of pads and are on the fab layer, not the silkscreen (the generator prints which)                                                                                      |
| Schematic vs board parity | not run                                                                                                                                                                                                                                                                                                                                                                                                               |
| gpasm                     | assembles for p16f628a (`tools/build_firmware.sh`)                                                                                                                                                                                                                                                                                                                                                                    |
| Firmware simulation       | passes `tools/picsim.py` (my own PIC16F84A-style instruction simulator, which runs the same code on the 628A): start-up and display, dialing at 33 ms and 8 ms pulses, all ten digits' tone pairs (Goertzel), 10 pulses = 0, 11 ignored, received digits, TALK mutes and lights the point, and the IR bias line (RA0) is driven only for the tone. It does not model CMCON, the comparators or the configuration word |
| 3D export                 | `kicad-cli pcb export glb` works; `tools/glb_check.py` checks each part's mesh against its footprint                                                                                                                                                                                                                                                                                                                  |
| Not tested                | the analog parts and the rescaled values, the IR link's range, real CM8870 timing, the regulator under the LM386's peaks, ZEPPP on a 16F628A and its configuration-word handling, the Gerbers in a viewer or at a board house, the 6 mm tactile switches under the dial's cams. gpsim was installed but not used                                                                                                      |
| Parts                     | see `PARTS.md` and the cost sheet; prices and stock were read from retailer pages on 2026-11-03 where marked                                                                                                                                                                                                                                                                                                          |

## Assumptions to confirm before ordering

- **Display:** 3641AS-style module (30 x 14 x 7.2 mm, pin rows 10.16 mm apart, 12 pins) per the G-NOR GNQ-3641 datasheet; the Futurlec 7FR3641AS unit itself was not seen.
- **Clone MAX7219N:** its price was not readable on the LCSC page (a search snippet said from about $0.96) and pin compatibility with the genuine part is the clone maker's claim. The genuine part fits the same socket-less footprint.
- **Tactile switches:** standard 6 x 6 mm switches use a 6.5 x 4.5 mm pin pattern, which the footprint follows; the Futurlec TACT001 drawing was not seen.
- **Battery holder:** 60 x 52 x 17 mm is a typical size for a covered 4 x AAA holder with a switch; measure the one bought. Its price comes from a search snippet.
- **Futurlec's microphone** (KEB6538TF, 4.5 V, over 1 k) shows no size; the mechanical file assumes 9.7 mm. Any two-pad electret works with R3.
- **Speaker:** the Adafruit 1890 (28 mm) was out of stock on 2026-11-03; another 8 ohm 28 mm speaker will do.
- **Photodiode:** Futurlec's 5 mm IR photodiode (INFD5940DIODE) was priced, its sensitivity and capacitance not read.
- The **CM8870 OSC2 to PIC OSC1** link through 100 nF follows the chained-decoder circuit in the datasheets (they use a smaller capacitor) but has not been tried with a PIC.
- Component heights in the mechanical file and the 3D models are typical values (simple boxes and cylinders, not the parts' real shapes).

## References and credits

Designed by Claude Sonnet 5.5 (Anthropic) under Lewis Moten's direction, in KiCad 9 (schematic and board are written as text by the scripts here and
checked with `kicad-cli`). Firmware assembled with gputils/gpasm. The firmware simulator, router, STEP writer and GLB packer are original.

- DTMF standard frequencies: ITU-T Recommendation Q.23.
- MT8870D/MT8870D-1 (Mitel/Zarlink/Microchip) and CM8870/70C (California Micro Devices) datasheets; HT9170 (Holtek) datasheet; MAX7219/MAX7221 (Maxim Integrated) datasheet; GNQ-3641 (G-NOR) display datasheet; Microchip PIC16F628A and MCP1702 datasheets.
- ZEPPP (Zero External Parts PIC Programmer), battlecoder, MIT License: <https://github.com/battlecoder/zeppp>. The phone does not include or copy its code; the steps above only use it.
- KiCad stock symbols (CC-BY-SA 4.0 with the KiCad library exception) are embedded in the schematic. See `NOTICE.md`.

No real phone brand is named. The game it goes with is `games/year2000`.
