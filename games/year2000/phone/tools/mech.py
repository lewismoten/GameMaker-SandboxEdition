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
W, H = 68.58, 160.02
DIAL = (34.29, 92.71)


def at(ref):
    return [pl[ref]["x"], pl[ref]["y"]]


def toward(ref, c):
    x, y = at(ref)
    dx, dy = c[0] - x, c[1] - y
    n = math.hypot(dx, dy)
    return [round(dx / n, 3), round(dy / n, 3)]


m = {
    "about": "THE PHONE OF THE FUTURE board, rev A. Untested design. Units mm; origin top-left seen from the front; +x right, +y down.",
    "board": {"width": W, "height": H, "thickness": 1.6, "corner_radius": 3.0,
              "outline": "rounded rectangle, 4 corner radius arcs of 3 mm",
              "mounting_holes": [{"x": x, "y": y, "drill": 3.2, "keepout_diameter": 7.2} for x, y in
                                 ((3.81, 3.81), (64.77, 3.81), (3.81, 156.21), (64.77, 156.21))]},
    "front": {
        "note": "Everything the user sees or touches is on the front. Solder tails of the front parts stick out of the back.",
        "antenna_end": "top edge (y = 0)",
        "ir_led": {"ref": "D2", "center": at("D2"), "dome_points": [0, -1], "dome_diameter": 5.0, "axis_height_above_board": 3.5,
                   "note": "5 mm LED with leads bent 90 degrees, dome beyond the top edge; pin 1 (square pad) is the cathode"},
        "ir_receiver": {"ref": "D1", "center": at("D1"), "faces": [0, -1], "body": [5.4, 4.3], "axis_height_above_board": 3.0,
                        "note": "BPW34-style photodiode bent to face the top edge; its package needs a clear IR window about 6 x 5 mm"},
        "display": {"refs": ["DS1", "DS2"], "centers": [at("DS1"), at("DS2")], "module_body": [30.0, 14.0], "module_height": 7.0,
                    "window_rect": {"x": 2.78, "y": 20.94, "w": 63.02, "h": 14.0},
                    "note": "two 4-digit modules side by side; ASSUMED 30 x 14 mm bodies and 7 mm height: confirm with the module bought"},
        "speaker": {"ref": "LS1", "center": at("LS1"), "diameter": 28.0, "thickness": 4.0, "faces": "front (grille holes over the cone)",
                    "solder_pads": [pl["LS1"]["pads"]["1"], pl["LS1"]["pads"]["2"]]},
        "microphone": {"ref": "MK1", "center": at("MK1"), "diameter": 9.7, "height": 6.5, "faces": "front, bottom end (mouth end)",
                       "solder_pads": [pl["MK1"]["pads"]["1"], pl["MK1"]["pads"]["2"]]},
        "buttons": {
            "TALK": {"ref": "SW4", "center": at("SW4"), "body": [6.0, 6.0], "height_above_board": 4.3, "stem_diameter": 3.5, "cap_travel": 0.25},
            "CLEAR": {"ref": "SW5", "center": at("SW5"), "body": [6.0, 6.0], "height_above_board": 4.3, "stem_diameter": 3.5, "cap_travel": 0.25,
                      "note": "also the hang-up button: it resets the PIC and clears the display"}},
    },
    "dial": {
        "center": list(DIAL), "radius": 28.5, "number_ring_radius": 20.32, "suggested_finger_hole_diameter": 9.5,
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
        "keep_clear": "the front surface inside the dial radius carries only silkscreen, the two microswitches and the TALK/CLEAR clear zone below it: the dial can sit 11 mm above the board",
    },
    "back": {
        "note": "Electronics and the battery holder are on the back. Back parts are mirrored footprints.",
        "max_part_height": 16.0,
        "battery_holder": {"ref": "BT1", "center": at("BT1"), "body": [50.0, 47.0], "height": 15.0, "pads": [pl["BT1"]["pads"]["1"], pl["BT1"]["pads"]["2"]],
                           "note": "4 x AAA side by side, long axis along x; pad positions are placeholders until the holder's drawing is checked"},
        "power_switch": {"ref": "SW1", "center": at("SW1"), "handle_direction": [1, 0], "body": [10.0, 6.0], "height": 6.0,
                         "note": "slide switch near the right edge; the shell needs a slot there"},
        "regulator": {"ref": "U6", "center": at("U6"), "height": 4.6},
        "tallest_parts": ["BT1 15 mm", "C21 220 uF electrolytic 12 mm", "X1 crystal 4.7 mm lying down", "ICs 5 mm"],
    },
    "silkscreen": {"front_title": "THE PHONE OF THE FUTURE at y = 14.6", "labels": ["TALK", "CLEAR", "MIC"]},
}
os.makedirs(os.path.join(HERE, "..", "mechanical"), exist_ok=True)
json.dump(m, open(os.path.join(HERE, "..", "mechanical", "interface.json"), "w"), indent=2)
print("wrote mechanical/interface.json")
