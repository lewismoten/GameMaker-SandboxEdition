#!/usr/bin/env python3
"""Writes mechanical/interface.json for the shell task, from kicad/placement.json.

Coordinates: mm, origin at the board's top-left corner as seen from the FRONT (the side the user
looks at), +x to the right, +y down toward the bottom (battery) end. Heights are above the board's
front (or back) surface and are TYPICAL values for the example parts: check them against the
parts actually bought. Designed by Claude Sonnet 5.5 under Lewis Moten's direction.
"""
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
pl = json.load(open(os.path.join(HERE, "..", "kicad", "placement.json")))
W, H = pl['_board']['w'], pl['_board']['h']
DIAL = tuple(pl['_dial']['c'])
DIAL_R, RING_R = pl['_dial']['r'], pl['_dial']['ring']
SPK = pl['_speaker']['c']


def at(ref):
    return [pl[ref]["x"], pl[ref]["y"]]


def toward(ref, c):
    x, y = at(ref)
    dx, dy = c[0] - x, c[1] - y
    n = math.hypot(dx, dy)
    return [round(dx / n, 3), round(dy / n, 3)]


m = {
    "about": "THE PHONE OF THE FUTURE board, rev C. Untested design. Units mm; origin top-left seen from the front; +x right, +y down.",
    "board": {"width": W, "height": H, "thickness": 1.6, "corner_radius": 4.0,
              "outline": "rounded rectangle, corner radius 4 mm",
              "mounting_holes": [{"x": x, "y": y, "drill": 3.2, "keepout_diameter": 7.2} for x, y in
                                 ((3.81, 3.81), (W - 3.81, 3.81), (3.81, H - 3.81), (W - 3.81, H - 3.81))]},
    "front": {
        "note": "Everything the user sees or touches is on the front. Solder tails of the front parts stick out of the back.",
        "antenna_end": "top edge (y = 0)",
        "ir_led": {"ref": "D2", "center": at("D2"), "dome_points": [0, -1], "dome_diameter": 5.0, "axis_height_above_board": 3.5,
                   "note": "5 mm LED with leads bent 90 degrees, dome beyond the top edge; pin 1 (square pad) is the cathode"},
        "ir_receiver": {"ref": "D1", "center": at("D1"), "faces": [0, -1], "dome_diameter": 5.0, "axis_height_above_board": 3.5,
                        "note": "5 mm IR photodiode bent 90 degrees like the LED, dome beyond the top edge; pin 1 (square pad) is the cathode"},
        "display": {"refs": ["DS1", "DS2"], "centers": [at("DS1"), at("DS2")], "module_body": [30.0, 14.0], "module_height": 7.2, "digit_height": 9.2,
                    "window_rect": {"x": at("DS1")[0] - 15, "y": at("DS1")[1] - 7, "w": at("DS2")[0] - at("DS1")[0] + 30, "h": 14.0},
                    "note": "two 3641AS-style 4-digit modules side by side (30 x 14 x 7.2 mm, pin rows 10.16 mm apart), checked against the GNQ-3641 datasheet"},
        "speaker": {"ref": "LS1", "center": list(SPK), "in_shell": True, "earpiece_center": [round(W / 2, 2), -16.5], "diameter": 28.0, "thickness": 4.0,
                    "faces": "front, in the earpiece pod above the board's top end (grille holes in the front cover over the cone)",
                    "freed_circle": {"center": list(SPK), "radius": 14.0, "area_mm2": round(math.pi * 14.0 ** 2)},
                    "solder_pads": [pl["LS1"]["pads"]["1"], pl["LS1"]["pads"]["2"]],
                    "note": "the speaker is no longer on the board: it clips into the front cover's earpiece pod at the top end (three flexure clips). Two wires (+ marked, the square pad) run from the pads, along the board's right edge, to the speaker. The 28 mm circle it used is free"},
        "microphone": {"ref": "MK1", "diameter": 9.7, "height": 6.5, "in_shell": True, "faces": "front, in the shell's mouthpiece past the bottom end (grille holes in the front cover)",
                       "solder_pads": [pl["MK1"]["pads"]["1"], pl["MK1"]["pads"]["2"]],
                       "note": "the electret capsule is NOT on the board: a printed collar under the front cover's grille grips it. Two short wires (a twisted pair) run from the pads, through the wire slot in the shell and across the battery bay, to the capsule (+ is pad 1, the bias side, marked + on the silkscreen)"},
        "volume_wheel": {"ref": "RV1", "center": at("RV1"), "body": [10.0, 8.0], "height": 4.9, "wheel_diameter": 10.0, "note": "side thumbwheel pot: its wheel stands 1.5 mm past the board edge, through a slot in the tray's side wall"},
        "buttons": {
            "TALK": {"ref": "SW4", "center": at("SW4"), "body": [6.0, 6.0], "height_above_board": 4.3, "stem_diameter": 3.5, "cap_travel": 0.25},
            "CLEAR": {"ref": "SW5", "center": at("SW5"), "body": [6.0, 6.0], "height_above_board": 4.3, "stem_diameter": 3.5, "cap_travel": 0.25,
                      "note": "also the hang-up button: it resets the PIC and clears the display"}},
    },
    "dial": {
        "center": [round(W / 2, 2), round(H + 0.3 + 3.0 + 1.0 + 43.2, 2)], "in_module": True, "radius": 37.0, "base_radius": 43.2, "front_clear_zone_radius": 21.5, "number_ring_radius": 29.0,
        "suggested_finger_hole_diameter": 13.0,
        "rotation_to_dial": "clockwise from the digit to the finger stop",
        "finger_stop_angle_cw_from_top_deg": 120, "degrees_per_digit_of_travel": 30,
        "digit_positions": [{"digit": str(d % 10), "angle_cw_from_top_deg": (90 - 30 * (d - 1)) % 360} for d in range(1, 11)],
        "hole_pitch_note": "ten 13 mm holes on a 29 mm ring, 30 degrees apart: webs of 2.0 mm; plate 74 mm across",
        "note": "the dial is a self-contained module in the lower body of the case, below the board (tools/dialModule.ts, the numbers in tools/dialParams.json). "
                "Hole 1 is 30 degrees from the finger stop, so digit n travels 30 x n degrees (0 = 300): a one-way clutch makes the pulse cam move only on the return, giving exactly n pulses. "
                "The board only has wire pads for the module's two switches. The board's old dial circle (silkscreen only) is free.",
        "switches": {
            "kind": "6 x 6 mm tactile switches inside the dial module, two wires each to the board's wire pads",
            "pulse": {"ref": "SW2", "center": at("SW2"), "pads": [pl["SW2"]["pads"]["1"], pl["SW2"]["pads"]["2"]], "in_module": True,
                      "closes_on": "each cam lobe during the return stroke (12 lobes, 30 degrees apart; the clutch keeps the cam still on the wind)"},
            "off_normal": {"ref": "SW3", "center": at("SW3"), "pads": [pl["SW3"]["pads"]["1"], pl["SW3"]["pads"]["2"]], "in_module": True,
                           "closes_on": "held closed whenever the dial plate is off its rest position (a wall under the plate rim presses it)"}},
        "keep_clear": "the old dial circle on the board is free of parts; it carries only silkscreen and the two wire pads of the module's switches",
    },
    "back": {
        "note": "Electronics are on the back. Back parts are mirrored footprints. The battery holder is NOT on the board: it lies flat in the shell's battery bay, past the bottom end of the board (the shell is one continuous case).",
        "max_part_height": 11.0,
        "battery_holder": {"ref": "BT1", "outside_board": True, "body_center": [round(W / 2, 2), round(H + 30.0, 2)], "body": [60.0, 52.0], "height": 17.0,
                           "lead_pads": [pl["BT1"]["pads"]["1"], pl["BT1"]["pads"]["2"]],
                           "note": "4 x AAA holder with cover, switch and 6 in leads (typical 60 x 52 x 17 mm: measure the one bought); the ON/OFF switch is on the holder, so the bay needs a window for it (NOT cut yet: place it once the holder is chosen). The leads are shortened and soldered to the two pads (red to +)"},
        "programming_header": {"ref": "J1", "center": at("J1"), "pins": [pl["J1"]["pads"][str(k)] for k in range(1, 7)], "height": 8.5,
                               "note": "1 x 6 header for the PIC programmer (MCLR, +5 V, GND, PGD, PGC, PGM); a plug-in lid or a service hole in the back of the shell keeps it reachable"},
        "regulator": {"ref": "U6", "center": at("U6"), "height": 4.6},
        "tallest_parts": ["BT1 17 mm (outside the board, in the battery bay)", "C19 100 uF electrolytic 11 mm", "C1 C2 C4 C18 10 uF electrolytics 11 mm", "J1 header 8.5 mm", "ICs and sockets 6 mm"],
    },
    "silkscreen": {"front_title": "THE PHONE OF THE FUTURE near the top, orbit rings and rays around the dial and speaker, a YEAR 2000 badge at the upper right", "labels": ["TALK", "CLEAR", "MIC"]},
}
os.makedirs(os.path.join(HERE, "..", "mechanical"), exist_ok=True)
json.dump(m, open(os.path.join(HERE, "..", "mechanical", "interface.json"), "w"), indent=2)
print("wrote mechanical/interface.json")
