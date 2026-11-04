#!/usr/bin/env python3
"""Writes bom.csv and PARTS.md from design.py (one row per distinct part).

Example part numbers are suggestions. "checked" means a web search found a distributor listing
(date and wording in the status column); "unchecked" means none was looked up. Nothing here was
bought or built. Designed by Claude Sonnet 5.5 under Lewis Moten's direction.
"""
import csv
import os
import sys
from collections import OrderedDict

sys.path.insert(0, os.path.dirname(__file__))
from design import parts  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), "..")
UN = "unchecked"
D = "2026-11-03"
MPN = {
    "U1": ("Microchip PIC16F628A-I/P (18-pin DIP; PIC16F627A-I/P also works but has half the flash; 18-pin socket)", "Futurlec PIC16F628A $2.20; Digi-Key PIC16F628A-I/P-ND $2.88; Mouser $2.87",
           f"checked {D}: Futurlec price read; Digi-Key and Mouser prices and stock read from search results (about 8,700 in stock each)"),
    "U2": ("Zarlink/Microchip MT8870DE (or California Micro Devices CM8870P, Holtek HT9170B: same 18-DIP pinout, pins 5 and 6 to ground; 18-pin socket)",
           "Futurlec MT8870DE $1.45 / HT9170B $0.50 (Holtek lists the HT9170B as phased out)",
           f"checked {D}: Futurlec prices read, stock not shown"),
    "U3": ("HGSEMI MAX7219N (DIP-24 clone of the MAX7219CNG; LCSC C492111). Genuine MAX7219CNG+ is pin-compatible",
           "LCSC C492111 (about $1; the page showed no price when fetched, a search snippet said from $0.96); genuine: Jameco MAX7219CNG $7.95, Futurlec MAX7219CNG $8.50",
           f"checked {D}: genuine prices read; the clone's price is from a search snippet only, so confirm it at LCSC"),
    "U4": ("LM358N (TI, onsemi or ST: any 8-pin DIP LM358)", "Futurlec LM358N $0.22", f"checked {D}: Futurlec price read"),
    "U5": ("LM386N-3 (or LM386N-1: same pinout; either works at 5 V)", "Futurlec LM386N-3 $0.55; Digi-Key LM386N-1/NOPB $1.18", f"checked {D}: Futurlec price read, supply range 4 to 12 V"),
    "U6": ("Microchip MCP1702-5002E/TO (TO-92, 250 mA; pins 1 GND, 2 IN, 3 OUT)", "Digi-Key MCP1702-5002E/TO $0.65",
           f"checked {D}: Digi-Key price and stock (2,783) read for the Rev B sheet the same day; pin order and 1 to 22 uF output capacitor from the datasheet"),
    "Q": ("2N3904 (TO-92, pins E B C)", "Futurlec 2N3904 $0.06", f"checked {D}: Futurlec price read"),
    "X1": ("3.579545 MHz crystal, HC-49/U (any load capacitance: the MT8870 oscillator is built for it)", "Futurlec CRY3579545 $0.30", f"checked {D}: Futurlec price read"),
    "D2": ("IR LED 940 nm, 5 mm clear (any)", "Futurlec INF5940 $0.16", f"checked {D}: Futurlec price read"),
    "D1": ("IR photodiode 940 nm, 5 mm (Futurlec INFD5940DIODE; a PIN photodiode, not a phototransistor)", "Futurlec INFD5940DIODE $0.25", f"checked {D}: Futurlec price read; sensitivity and speed not checked"),
    "DS": ("4-digit 0.36 in common-cathode red module, 12 pins (3641AS pinout)", "Futurlec 7FR3641AS $1.20",
           f"checked {D}: pinout, 10.16 mm row spacing and 30 x 14 x 7.2 mm from the GNQ-3641 datasheet in Rev B; the retailer unit was not seen"),
    "RV1": ("100k side thumbwheel potentiometer, right-angle, 3 pins 2.54 mm apart, wheel about 10 mm across", "Digi-Key / Mouser 'thumbwheel potentiometer 100k' (about $1 to $2 each; price not confirmed)", UN),
    "MK1": ("Electret capsule with solder pads (Futurlec KEB6538TF, 4.5 V, over 1 k; size not shown on the page)", "Futurlec KEB6538TF $0.45", f"checked {D}: Futurlec price read; diameter not confirmed (any capsule with two pads fits, the mechanical file assumes 9.7 mm)"),
    "LS1": ("8 ohm speaker, 28 mm, about 4.5 mm thick (Adafruit 1890)", "Adafruit 1890 $1.95; Jameco 2507231", "checked 2026-11-03 (Rev B sheet): Adafruit listed it out of stock; Jameco price not read"),
    "SW2": ("6 x 6 mm tactile switch, through-hole, 4 pins (Futurlec TACT001 small black)", "Futurlec TACT001 $0.25", f"checked {D}: Futurlec price read; height and pin spacing not shown, standard 6 x 6 mm switches use 6.5 x 4.5 mm"),
    "BT1": ("4 x AAA holder with cover, ON/OFF switch and 6 in leads (Parts Express 142-254)", "Parts Express 142-254 $1.93; Tayda A-8634 4 x AA with cover and switch $0.69 (bigger: AA)",
            f"checked {D}: prices from search snippets (Parts Express 2 in stock); the pages themselves returned 403"),
    "J1": ("1 x 6 pin header, 2.54 mm (break off a long strip)", "any maker-shop strip of 40 pins, about $0.10 for 6", "estimate"),
}
GEN = {
    "R": ("1/4 W 5% carbon film resistor, {v} (axial)", "Futurlec 1/4 W pack of 10, $0.10 per value", f"checked {D}: Futurlec resistor page, all seven values listed in stock"),
    "C0": ("Ceramic capacitor {v} (radial, 5.08 mm leads; 50 V)", "Futurlec C100UC (0.1 uF 50 V) $0.10", f"checked {D}: Futurlec price for 100 nF; 1 uF not priced"),
    "CE": ("Radial electrolytic {v} (16 V or more; 2.5 mm lead spacing)", "Futurlec C010U16E (10 uF 16 V) $0.05; C100U25E (100 uF 25 V) $0.08", f"checked {D}: Futurlec prices read (1 uF not priced; same family as the 10 uF)"),
}


def key(p):
    r = p["ref"]
    if r[0] in "RC":
        return (r[0] + ("E" if p["sym"].endswith("Polarized") else "0") if r[0] == "C" else "R", p["value"], p["fp"])
    if r.startswith("SW"):
        return ("SW", p["fp"], "")
    if r.startswith("RV"):
        return ("RV", p["fp"], "")
    if r.startswith("DS"):
        return ("DS", p["fp"], "")
    return (r, p["value"], p["fp"])


rows = OrderedDict()
for p in parts:
    k = key(p)
    rows.setdefault(k, []).append(p)


def sortkey(item):
    k, ps = item
    order = {"U": 0, "Q": 1, "X": 2, "D": 3, "M": 4, "L": 5, "S": 6, "B": 7, "R": 8, "C": 9}
    return (order.get(ps[0]["ref"][0], 9), ps[0]["ref"][0], int("".join(c for c in ps[0]["ref"] if c.isdigit()) or 0))


out = []
for k, ps in sorted(rows.items(), key=sortkey):
    refs = ",".join(sorted((p["ref"] for p in ps), key=lambda r: (r.rstrip("0123456789"), int("".join(c for c in r if c.isdigit())))))
    p0 = ps[0]
    r0 = p0["ref"]
    if r0.startswith(("R", "C")):
        if r0[0] == "R":
            tpl = GEN["R"]
        elif p0["sym"].endswith("Polarized"):
            tpl = GEN["CE"]
        else:
            tpl = GEN["C0"]
        v = p0["value"].replace(" ", "").replace("k", "K").replace("uF", "uF")
        mpn, ord_, st = tpl[0].format(v=v), tpl[1].format(v=v), tpl[2]
    else:
        m = MPN.get(r0) or MPN.get(r0.rstrip("0123456789")) or MPN.get(r0[0])
        if r0.startswith("SW"):
            m = MPN["SW2"]
        mpn, ord_, st = m
    out.append(dict(Refs=refs, Qty=len(ps), Value=" / ".join(dict.fromkeys(q["value"] for q in ps)), Description=("; ".join(dict.fromkeys(q["desc"] for q in ps)) if len(ps) < 6 or not r0.startswith(("R", "C")) else {"R": "resistors, see the schematic for each one's job", "C": "capacitors, see the schematic for each one's job"}[r0[0]]), Footprint=p0["fp"],
                    Side="back" if p0["side"] == "B" else "front", MPN=mpn, Order_at=ord_, Stock_status=st))

total = sum(r["Qty"] for r in out)

# Bought parts that are not on the board: the dial module's retention and the six case screws (estimated prices, not checked at a shop).
for refs, qty, value, desc, mpn, ord_ in (
    ("H1", 1, "M3 x 10 pan head", "Dial module screw: M3 x 10 mm pan-head thread-forming (self-tapping) screw into the post's 2.5 mm pilot (clamps the bushing; the plate turns on the post)", "any M3 x 10 pan-head screw, about $0.05", "hardware store or an M3 assortment"),
    ("H2", 1, "M3 fender washer 9 mm", "Dial module washer: M3 fender washer, 9 mm outside diameter (overlaps the plate's hub lip by 1.2 mm per side)", "any M3 x 9 mm OD fender washer, about $0.05", "hardware store or an M3 assortment"),
    ("H3", 6, "M3 x 30 pan head", "Case screws: M3 x 30 mm pan-head thread-forming (self-tapping) screws, heads on the back, into 2.5 mm pilot holes in the front cover's six bosses", "any M3 x 30 pan-head screw, about $0.06 each", "hardware store or an M3 assortment"),
):
    out.append(dict(Refs=refs, Qty=qty, Value=value, Description=desc, Footprint="-", Side="shell", MPN=mpn, Order_at=ord_, Stock_status="estimate, not checked at a shop"))

with open(os.path.join(OUT, "bom.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(out[0]))
    w.writeheader()
    w.writerows(out)

md = ["# Parts list: THE PHONE OF THE FUTURE (rev C)", "",
      "Untested design. Part numbers are examples to start a search; check each one's drawing against the footprint before buying. Prices and the full cost sheet: see the README.",
      f"{total} parts on the board, {len(out)} different lines (the last three, H1 to H3, are the shell's screws and washer: about $0.45 in all). Generated by `tools/bom.py` from `tools/design.py`.", "",
      "| Refs | Qty | Value | Description | Side | Example part | Order at | Stock status |", "|---|---|---|---|---|---|---|---|"]
for r in out:
    md.append(f"| {r['Refs']} | {r['Qty']} | {r['Value']} | {r['Description']} | {r['Side']} | {r['MPN']} | {r['Order_at']} | {r['Stock_status']} |")
open(os.path.join(OUT, "PARTS.md"), "w").write("\n".join(md) + "\n")
print(total, "parts,", len(out), "lines")
