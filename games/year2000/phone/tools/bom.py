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
R_ = "CFR-12JB-52-{v} (Yageo 1/8 W carbon film; Digi-Key/Mouser/Jameco carry the family)"
MPN = {
    "U1": ("Microchip PIC16F84A-04/P", "Digi-Key PIC16F84A-04/P-ND",
           "checked 2026-11-03: Digi-Key regional pages (bg, th, au) showed it in stock; the US page was not read"),
    "U2": ("Microchip MT8870DE1 (or CM8870P / HT9170B equivalents)", "Digi-Key MT8870DE1-ND",
           "checked 2026-11-03: Digi-Key lists it OBSOLETE; some brokers list stock. Replacement choice is an open question"),
    "U3": ("Maxim/Analog Devices MAX7219CNG+", "Jameco 312160 (MAX7219CNG)",
           "checked 2026-11-03: Jameco listing found, stock not read; Digi-Key lists it obsolete"),
    "U4": ("TI LM358N (LM358P)", "Digi-Key LM358N/NOPB", UN),
    "U5": ("TI LM386N-1", "Digi-Key LM386N-1/NOPB", UN),
    "U6": ("TI LM2940CT-5.0/NOPB", "Digi-Key LM2940CT-5.0/NOPB", UN),
    "Q": ("onsemi 2N3904 (TO-92)", "Jameco / Digi-Key 2N3904", UN),
    "X1": ("Abracon ABL-3.579545MHZ-B2 (HC-49/US)", "Digi-Key 535-9099-ND (verify)", UN),
    "D2": ("Vishay TSAL6200 (940 nm, 5 mm)", "Digi-Key / Mouser TSAL6200", UN),
    "D1": ("Vishay BPW34 (PIN photodiode)", "Digi-Key / Mouser BPW34", UN),
    "DS": ("4-digit 0.36 in common-cathode red module, 12 pins (5641AS-style pinout)", "Mouser/Digi-Key: choose by pinout; verify pin rows vs footprint", UN),
    "MK1": ("Electret capsule 9.7 mm, e.g. CUI CMC-9745 series", "Digi-Key / Mouser CUI CMC-97", UN),
    "LS1": ("8 ohm 0.25 W speaker, about 28 mm", "Jameco / Digi-Key (any 28 mm 8 ohm)", UN),
    "SW2": ("Omron SS-5GL2 (verify terminals)", "Digi-Key / Mouser SS-5GL2", UN),
    "SW4": ("Omron B3F-1000 (6 mm tactile)", "Digi-Key / Mouser B3F-1000", UN),
    "BT1": ("Keystone 2481 (4 x AAA, PC pins)", "Digi-Key / Mouser 2481 (Newark lists it as through hole)",
            "checked 2026-11-03: Newark listing found; Digi-Key page not found"),
    "SW1": ("C&K OS102011MA1QN1 slide switch", "Digi-Key / Mouser OS102011MA1QN1", UN),
}
GEN = {
    "R": ("CFR-12JB-52-{v} (Yageo 1/8 W, 5%)", "Digi-Key CFR-12JB-52-{v}", UN),
    "C0": ("Vishay K104K15X7RF5TL2 style 5.08 mm ceramic ({v})", "Mouser 594-K104K15X7RF5TL2 (100 nF); other values similar", UN),
    "CE": ("Panasonic EEU-FR radial electrolytic ({v})", "Digi-Key / Mouser EEU-FR1A (10 V)", UN),
    "CT": ("Kemet T350 radial tantalum ({v})", "Digi-Key / Mouser T350E476K010AT", UN),
}


def key(p):
    r = p["ref"]
    if r[0] in "RC":
        return (r[0] + ("E" if p["sym"].endswith("Polarized") else "0") if r[0] == "C" else "R", p["value"], p["fp"])
    if r.startswith("SW"):
        return ("SW", p["fp"], "")
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
            tpl = GEN["CT"] if "tant" in p0["value"] else GEN["CE"]
        else:
            tpl = GEN["C0"]
        v = p0["value"].replace(" ", "").replace("k", "K").replace("uF", "uF")
        mpn, ord_, st = tpl[0].format(v=v), tpl[1].format(v=v), tpl[2]
    else:
        m = MPN.get(r0) or MPN.get(r0.rstrip("0123456789")) or MPN.get(r0[0])
        if r0.startswith("SW") and r0 not in MPN:
            m = MPN["SW2"] if p0["fp"] == "usw" else MPN["SW4"]
        mpn, ord_, st = m
    out.append(dict(Refs=refs, Qty=len(ps), Value=" / ".join(dict.fromkeys(q["value"] for q in ps)), Description=("; ".join(dict.fromkeys(q["desc"] for q in ps)) if len(ps) < 6 or not r0.startswith(("R", "C")) else {"R": "resistors, see the schematic for each one's job", "C": "capacitors, see the schematic for each one's job"}[r0[0]]), Footprint=p0["fp"],
                    Side="back" if p0["side"] == "B" else "front", MPN=mpn, Order_at=ord_, Stock_status=st))

with open(os.path.join(OUT, "bom.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(out[0]))
    w.writeheader()
    w.writerows(out)

total = sum(r["Qty"] for r in out)
md = ["# Parts list: THE PHONE OF THE FUTURE (rev A)", "",
      "Untested design. Part numbers are examples to start a search; check each one's drawing against the footprint before buying.",
      f"{total} parts on the board, {len(out)} different lines. Generated by `tools/bom.py` from `tools/design.py`.", "",
      "| Refs | Qty | Value | Description | Side | Example part | Order at | Stock status |", "|---|---|---|---|---|---|---|---|"]
for r in out:
    md.append(f"| {r['Refs']} | {r['Qty']} | {r['Value']} | {r['Description']} | {r['Side']} | {r['MPN']} | {r['Order_at']} | {r['Stock_status']} |")
open(os.path.join(OUT, "PARTS.md"), "w").write("\n".join(md) + "\n")
print(total, "parts,", len(out), "lines")
