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
    "about": "THE PHONE OF THE FUTURE board, rev A. Untested design. Units mm; origin top-left seen from the front; +x right, +y down.",
    "board": {"width": W, "height": H, "thickness": 1.6, "corner_radius": 4.0,
              "outline": "rounded rectangle, corner radius 4 mm",
              "mounting_holes": [{"x": x, "y": y, "drill": 3.2, "keepout_diameter": 7.2} for x, y in
                                 ((3.81, 3.81), (W - 3.81, 3.81), (3.81, H - 3.81), (W - 3.81, H - 3.81))]},
    "front": {
        "note": "Everything the user sees or touches is on the front. Solder tails of the front parts stick out of the back.",
        "antenna_end": "top edge (y = 0)",
        "ir_led": {"ref": "D2", "center": at("D2"), "dome_points": [0, -1], "dome_diameter": 5.0, "axis_height_above_board": 3.5,
                   "note": "5 mm LED with leads bent 90 degrees, dome beyond the top edge; pin 1 (square pad) is the cathode"},
        "ir_receiver": {"ref": "D1", "center": at("D1"), "faces": [0, -1], "body": [5.4, 4.3], "axis_height_above_board": 3.0,
                        "note": "BPW34-style photodiode bent to face the top edge; its package needs a clear IR window about 6 x 5 mm"},
        "display": {"refs": ["DS1", "DS2"], "centers": [at("DS1"), at("DS2")], "module_body": [30.0, 14.0], "module_height": 7.2, "digit_height": 9.2,
                    "window_rect": {"x": at("DS1")[0] - 15, "y": at("DS1")[1] - 7, "w": at("DS2")[0] - at("DS1")[0] + 30, "h": 14.0},
                    "note": "two 3641AS-style 4-digit modules side by side (30 x 14 x 7.2 mm, pin rows 10.16 mm apart), checked against the GNQ-3641 datasheet"},
        "speaker": {"ref": "LS1", "center": list(SPK), "diameter": 28.0, "thickness": 4.0, "faces": "front (grille holes over the cone)",
                    "front_clear_zone_radius": 13.5,
                    "solder_pads": [pl["LS1"]["pads"]["1"], pl["LS1"]["pads"]["2"]],
                    "note": "the speaker is glued over the clear zone; the board under it carries only silkscreen on the front, two short wires reach the pads"},
        "microphone": {"ref": "MK1", "center": at("MK1"), "diameter": 9.7, "height": 6.5, "faces": "front, bottom end (mouth end)",
                       "solder_pads": [pl["MK1"]["pads"]["1"], pl["MK1"]["pads"]["2"]]},
        "buttons": {
            "TALK": {"ref": "SW4", "center": at("SW4"), "body": [6.0, 6.0], "height_above_board": 4.3, "stem_diameter": 3.5, "cap_travel": 0.25},
            "CLEAR": {"ref": "SW5", "center": at("SW5"), "body": [6.0, 6.0], "height_above_board": 4.3, "stem_diameter": 3.5, "cap_travel": 0.25,
                      "note": "also the hang-up button: it resets the PIC and clears the display"}},
    },
    "dial": {
        "center": list(DIAL), "radius": DIAL_R, "front_clear_zone_radius": 25.5, "number_ring_radius": RING_R, "suggested_finger_hole_diameter": 8.5,
        "rotation_to_dial": "clockwise from the digit to the finger stop",
        "finger_stop_angle_cw_from_top_deg": 120, "degrees_per_digit_of_travel": 30,
        "digit_positions": pl["_digits"],
        "note": "digits are silkscreened at the hole centers (cw angle from the top). Digit n travels 30 degrees x (n+1) back to the stop... "
                "1 is 60 degrees from the stop, 0 is 330 degrees. Pulse switch closes once per digit step on the return; off-normal is closed while the dial is off rest.",
        "microswitches": {
            "pulse": {"ref": "SW2", "center": at("SW2"), "pads": [pl["SW2"]["pads"]["1"], pl["SW2"]["pads"]["2"]], "body": [12.8, 6.5], "height_above_board": 10.2,
                      "lever_direction_toward_dial_center": toward("SW2", DIAL), "closes_on": "each cam tooth during the return stroke (10 teeth for 10 pulses max)"},
            "off_normal": {"ref": "SW3", "center": at("SW3"), "pads": [pl["SW3"]["pads"]["1"], pl["SW3"]["pads"]["2"]], "body": [12.8, 6.5], "height_above_board": 10.2,
                           "lever_direction_toward_dial_center": toward("SW3", DIAL), "closes_on": "held closed whenever the dial is off its rest position"}},
        "keep_clear": "inside the dial radius the front carries only silkscreen and the two microswitches (no pads, vias or front copper tracks): the dial can sit about 11 mm above the board",
    },
    "back": {
        "note": "Electronics and the battery holder are on the back. Back parts are mirrored footprints.",
        "max_part_height": 13.0,
        "battery_holder": {"ref": "BT1", "body_center": list(DIAL), "body": [53.0, 50.0], "height": 13.0, "lead_pads": [pl["BT1"]["pads"]["1"], pl["BT1"]["pads"]["2"]],
                           "note": "a 4 x AAA holder with wire leads (Pololu 1145 size), stuck to the back behind the dial; its 6 in leads are shortened and soldered to the two pads (red to +)"},
        "volume_trimmer": {"ref": "RV1", "center": at("RV1"), "optional": True, "body": [9.5, 9.5], "height": 4.9, "note": "optional: fit instead of R20 and R21; needs a screwdriver hole in the shell's back"},
        "power_switch": {"ref": "SW1", "center": at("SW1"), "handle_direction": [1, 0], "body": [10.0, 6.0], "height": 6.0,
                         "note": "slide switch near the right edge; the shell needs a slot there"},
        "regulator": {"ref": "U6", "center": at("U6"), "height": 4.6},
        "tallest_parts": ["BT1 13 mm (behind the dial)", "C21 220 uF electrolytic 11 mm", "ICs 4 mm", "LM2940 lying flat 9 mm"],
    },
    "silkscreen": {"front_title": "THE PHONE OF THE FUTURE near the top, orbit rings and rays around the dial and speaker, a YEAR 2000 badge at the bottom left", "labels": ["TALK", "CLEAR", "MIC"]},
}
os.makedirs(os.path.join(HERE, "..", "mechanical"), exist_ok=True)
json.dump(m, open(os.path.join(HERE, "..", "mechanical", "interface.json"), "w"), indent=2)
print("wrote mechanical/interface.json")
