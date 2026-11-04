"""Footprints for the Phone of the Future, drawn here with big hand-solder pads.

Pad coordinates are in mm, y down, origin at the centre of the pad box, as seen from the side the
part is mounted on. A part on the back is mirrored when placed (what KiCad does when you flip it).
Every pad is a plated through-hole: round, 1.8 mm over a 0.9 mm drill unless noted; pin 1 and
positive pins are square. Dimensions marked ASSUMED must be checked against the chosen part.
"""
from dataclasses import dataclass, field


@dataclass
class Pad:
    num: str
    x: float
    y: float
    d: float = 1.8      # copper diameter / square side
    drill: float = 0.9
    square: bool = False


@dataclass
class Fp:
    name: str
    pads: list
    body: tuple          # (x1, y1, x2, y2) silkscreen/fab outline, relative to origin
    court: tuple         # courtyard
    marks: list = field(default_factory=list)   # (text, x, y) small silk marks
    extra: list = field(default_factory=list)   # extra fab-layer circles (cx, cy, r)
    desc: str = ""


def _dip(n):
    h = n // 2
    pads = [Pad(str(i + 1), -3.81, (i - (h - 1) / 2) * 2.54, square=(i == 0)) for i in range(h)]
    pads += [Pad(str(h + k + 1), 3.81, ((h - 1) / 2 - k) * 2.54) for k in range(h)]
    y = (h - 1) * 1.27 + 1.9
    return Fp(f"DIP-{n}_W7.62mm_BigPads", pads, (-5.2, -y, 5.2, y), (-5.5, -y - .3, 5.5, y + .3),
              [("1", -5.9, -(h - 1) * 1.27)], desc=f"{n}-pin DIP, 0.3in rows, 2.54 mm pitch")


def _axial(name, pitch, bw, bh, desc):
    p = pitch / 2
    return Fp(name, [Pad("1", -p, 0), Pad("2", p, 0)], (-bw / 2, -bh / 2, bw / 2, bh / 2),
              (-p - 1.2, -bh / 2 - .4, p + 1.2, bh / 2 + .4), [], desc=desc)


def _row(name, nums, pitch, body, desc, d=1.8, drill=0.9, square=None, marks=()):
    n = len(nums)
    pads = [Pad(k, (i - (n - 1) / 2) * pitch, 0, d, drill, square=(k == square)) for i, k in enumerate(nums)]
    x = (n - 1) * pitch / 2 + 1.5
    return Fp(name, pads, body, (min(body[0], -x), body[1] - .3, max(body[2], x), body[3] + .3), list(marks), desc=desc)


def _disp():
    pads = [Pad(str(i + 1), -6.35 + 2.54 * i, 5.08, square=(i == 0)) for i in range(6)]
    pads += [Pad(str(7 + i), 6.35 - 2.54 * i, -5.08) for i in range(6)]
    # 3641AS-style 0.36 in module: 30 x 14 x 7.2 mm body, rows 10.16 mm apart (G-NOR GNQ-3641 drawing)
    return Fp("DISP4_CC_0.36in_12pin", pads, (-15, -7, 15, 7), (-15.3, -7.3, 15.3, 7.3),
              [], desc="4-digit 7-segment module (3641AS style), 12 pins, rows 10.16 mm apart")


def _tact():
    pads = [Pad("1", -3.302, -2.286, 2.0, 1.1), Pad("1", -3.302, 2.286, 2.0, 1.1),
            Pad("2", 3.302, -2.286, 2.0, 1.1), Pad("2", 3.302, 2.286, 2.0, 1.1)]
    return Fp("SW_Tactile_6mm_BigPads", pads, (-3.0, -3.0, 3.0, 3.0), (-5.6, -4.1, 5.6, 4.1), [],
              extra=[(0, 0, 1.75)], desc="6 mm tactile switch (6.6 x 4.6 mm pin spacing; pins 1-1 and 2-2 are joined inside); standard 6 x 6 mm switches are 6.5 x 4.5 mm")


FP = {
    "dip8": _dip(8), "dip18": _dip(18), "dip24": _dip(24),
    "axial": _axial("R_Axial_P7.62mm_BigPads", 7.62, 6.4, 2.4, "1/4 W resistor, lying flat, 7.62 mm hole spacing"),
    "ceramic": _axial("C_Disc_P5.08mm_BigPads", 5.08, 3.0, 4.2, "disc or multilayer ceramic capacitor"),
    "elec": Fp("C_Radial_P2.54mm_BigPads", [Pad("1", -1.27, 0, square=True), Pad("2", 1.27, 0)],
               (-3.6, -3.6, 3.6, 3.6), (-3.9, -3.9, 3.9, 3.9), [("+", -3.0, -2.2)],
               desc="radial electrolytic or tantalum; pin 1 is plus"),
    "to92": _row("TO-92_Inline_BigPads", ["1", "2", "3"], 2.54, (-3.2, -2.0, 3.2, 3.4), "TO-92, flat face up, pins E B C", marks=[("E", -2.54, 3.9)]),
    "to92reg": Fp("TO-92_MCP1702_BigPads", [Pad("2", -2.54, 0, square=True), Pad("1", 0, 0), Pad("3", 2.54, 0)],
                  (-3.2, -2.0, 3.2, 3.4), (-4.0, -2.3, 4.0, 3.7), [("G", -2.54, 3.9), ("I", 0, 3.9), ("O", 2.54, 3.9)],
                  desc="MCP1702 TO-92, flat face up: physical pin 1 GND (square), 2 IN, 3 OUT; the pads carry the symbol's numbers (GND is 2, IN is 1)"),
    "xtal": _row("Crystal_HC49_BigPads", ["1", "2"], 5.08, (-6.0, -2.6, 6.0, 2.6), "HC-49 crystal, lying flat", d=2.0, drill=1.0),
    "led": _row("LED_5mm_BigPads", ["1", "2"], 2.54, (-3.5, -3.5, 3.5, 3.5), "5 mm IR LED, leads bent so the dome points off the board edge; pin 1 is the cathode (K)",
                square="1", marks=[("K", -2.9, 2.6), ("A", 2.7, 2.6)]),
    "mic": Fp("Mic_Electret_2pad_BigPads", [Pad("1", -2.54, 0, 2.4, 1.2, True), Pad("2", 2.54, 0, 2.4, 1.2)],
              (-4.2, -2.4, 4.2, 2.4), (-4.5, -2.7, 4.5, 2.7), [("+", -2.54, 3.6), ("-", 2.54, 3.6)],
              desc="two pads for the electret capsule's twisted-pair wires (the capsule sits in the shell's mouthpiece); + is the pad that goes to the bias resistor"),
    "spk": Fp("Speaker_28mm_BigPads", [Pad("1", -2.54, 19.05, 2.4, 1.2, True), Pad("2", 2.54, 19.05, 2.4, 1.2)],
              (-14.2, -14.2, 14.2, 21.4), (-14.2, -14.2, 14.2, 21.4), [("+", -4.6, 19.05)], extra=[(0, 0, 14)],
              desc="28 mm speaker centered on the footprint origin (glued over a clear zone); two short wires reach the pads 19 mm below its center"),
    "batt": Fp("BatteryLeads_2pad_BigPads", [Pad("1", -5.08, 0, 2.6, 1.4, True), Pad("2", 5.08, 0, 2.6, 1.4)],
               (-8.0, -3.2, 8.0, 3.2), (-8.3, -3.5, 8.3, 3.5), [("+", -5.08, 3.9), ("-", 5.08, 3.9)],
               desc="two pads for the 4 x AAA holder's wire leads (red to +, black to -)"),
    "hdr6": _row("PinHeader_1x6_BigPads", ["1", "2", "3", "4", "5", "6"], 2.54, (-7.62, -1.5, 7.62, 1.5), "1x6 pin header, 2.54 mm", square="1",
                 marks=[("1", -7.0, 2.6)]),
    "thumb": _row("Thumbwheel_10k_3pin_BigPads", ["1", "2", "3"], 2.54, (-6.0, -4.0, 6.0, 4.0), "side thumbwheel volume pot, 3 pins 2.54 mm apart in a row; the wheel stands off the board edge (the part's pin 1 is the top of the divider, 2 the wiper, 3 ground)",
                  square="1", marks=[("1", -2.54, 5.0)]),
    "disp4": _disp(), "tact": _tact(),
}
# the netlist pins "1".."3" of the slide switch follow the schematic symbol (checked by gen_pcb)
NAMES = {k: v.name for k, v in FP.items()}
