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
        "speaker": {"ref": "LS1", "center": list(SPK), "diameter": 28.0, "thickness": 4.0, "faces": "front (grille holes over the cone)",
                    "front_clear_zone_radius": 13.5,
                    "solder_pads": [pl["LS1"]["pads"]["1"], pl["LS1"]["pads"]["2"]],
                    "note": "the speaker is glued over the clear zone; the board under it carries only silkscreen on the front, two short wires reach the pads"},
        "microphone": {"ref": "MK1", "center": at("MK1"), "diameter": 9.7, "height": 6.5, "faces": "front, bottom end (mouth end)",
                       "solder_pads": [pl["MK1"]["pads"]["1"], pl["MK1"]["pads"]["2"]]},
        "volume_wheel": {"ref": "RV1", "center": at("RV1"), "body": [10.0, 8.0], "height": 4.9, "wheel_diameter": 10.0, "note": "side thumbwheel pot: its wheel stands 1.5 mm past the board edge, through a slot in the tray's side wall"},
        "buttons": {
            "TALK": {"ref": "SW4", "center": at("SW4"), "body": [6.0, 6.0], "height_above_board": 4.3, "stem_diameter": 3.5, "cap_travel": 0.25},
            "CLEAR": {"ref": "SW5", "center": at("SW5"), "body": [6.0, 6.0], "height_above_board": 4.3, "stem_diameter": 3.5, "cap_travel": 0.25,
                      "note": "also the hang-up button: it resets the PIC and clears the display"}},
    },
    "dial": {
        "center": list(DIAL), "radius": DIAL_R, "front_clear_zone_radius": 21.5, "number_ring_radius": RING_R, "suggested_finger_hole_diameter": 6.5,
        "rotation_to_dial": "clockwise from the digit to the finger stop",
        "finger_stop_angle_cw_from_top_deg": 120, "degrees_per_digit_of_travel": 30,
        "digit_positions": pl["_digits"],
        "hole_pitch_note": "holes are 30 degrees apart on a 14.5 mm ring, so centers are 7.6 mm apart: 6.5 mm holes leave a 1.1 mm web",
        "note": "digits are silkscreened at the hole centers (cw angle from the top). Digit n travels 30 degrees x (n+1) back to the stop... "
                "1 is 60 degrees from the stop, 0 is 330 degrees. Pulse switch closes once per digit step on the return; off-normal is closed while the dial is off rest.",
        "switches": {
            "kind": "6 x 6 mm tactile switches (the same part as TALK and CLEAR), pressed from above by cams on the dial's underside",
            "pulse": {"ref": "SW2", "center": at("SW2"), "pads": [pl["SW2"]["pads"]["1"], pl["SW2"]["pads"]["2"]], "body": [6.0, 6.0], "height_above_board": 4.3, "stem_diameter": 3.5, "travel": 0.25,
                      "closes_on": "each cam tooth during the return stroke (10 teeth for 10 pulses max); give the teeth a ramp so a sideways-moving cam presses the stem straight down"},
            "off_normal": {"ref": "SW3", "center": at("SW3"), "pads": [pl["SW3"]["pads"]["1"], pl["SW3"]["pads"]["2"]], "body": [6.0, 6.0], "height_above_board": 4.3, "stem_diameter": 3.5, "travel": 0.25,
                           "closes_on": "held closed whenever the dial is off its rest position"}},
        "keep_clear": "inside the dial radius the front carries only silkscreen and the two tactile switches (no pads, vias or front copper tracks): the dial can sit about 6 mm above the board",
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
