#!/usr/bin/env python3
"""Writes kicad/phone.kicad_sch from design.py.

Every pin gets a short wire stub that ends in a net label or a power symbol, so the sheet reads
as blocks of parts joined by named nets. Symbols come from the KiCad stock libraries (copied
into the sheet) plus two local symbols (MT8870 and the 4-digit display) drawn here.
Designed by Claude Sonnet 5.5 under Lewis Moten's direction, with KiCad.
"""
import math
import os
import re
import sys
import uuid

sys.path.insert(0, os.path.dirname(__file__))
from design import parts, GND, V5  # noqa: E402
from footprints import NAMES  # noqa: E402
import json  # noqa: E402
netlist = {}

KICAD = "/Applications/KiCad/KiCad.app/Contents/SharedSupport"
SYM = os.environ.get("KICAD_SYMBOLS", KICAD + "/symbols")
OUT = os.path.join(os.path.dirname(__file__), "..", "kicad", "phone.kicad_sch")
ROOT = str(uuid.uuid5(uuid.NAMESPACE_DNS, "phone-of-the-future"))
_n = [0]


def uid():
    _n[0] += 1
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"potf-{_n[0]}"))


# ---- tiny s-expression reader ---------------------------------------------------------------
def tok(s):
    return re.findall(r'"(?:\\.|[^"\\])*"|\(|\)|[^\s()"]+', s)


def parse(s):
    t = tok(s)
    i = 0

    def rd():
        nonlocal i
        if t[i] == "(":
            i += 1
            out = []
            while t[i] != ")":
                out.append(rd())
            i += 1
            return out
        v = t[i]
        i += 1
        return v[1:-1] if v.startswith('"') else v

    return rd()


def block(path, name):
    s = open(path).read()
    i = s.find('\t(symbol "%s"\n' % name)
    if i < 0:
        raise SystemExit(f"symbol {name} not in {path}")
    d = 0
    j = i
    while True:
        c = s[j]
        if c == "(":
            d += 1
        elif c == ")":
            d -= 1
            if d == 0:
                return s[i:j + 1]
        j += 1


# ---- local symbols ---------------------------------------------------------------------------
def local_symbol(name, ref, left, right, title):
    """Box symbol. left/right: lists of (number, name, type)."""
    h = max(len(left), len(right))
    top = (h - 1) * 1.27 + 2.54
    pins = []
    for side, lst, x, ang in (("l", left, -12.7, 0), ("r", right, 12.7, 180)):
        for k, (num, pn, ty) in enumerate(lst):
            y = top - 2.54 - k * 2.54
            pins.append(f'''(pin {ty} line (at {x} {y:.2f} {ang}) (length 2.54)
        (name "{pn}" (effects (font (size 1.27 1.27))))
        (number "{num}" (effects (font (size 1.27 1.27)))))''')
    return f'''(symbol "Local:{name}" (pin_names (offset 1.016)) (exclude_from_sim no) (in_bom yes) (on_board yes)
    (property "Reference" "{ref}" (at 0 {top + 2.54:.2f} 0) (effects (font (size 1.27 1.27))))
    (property "Value" "{name}" (at 0 {-top - 2.54:.2f} 0) (effects (font (size 1.27 1.27))))
    (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
    (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
    (property "Description" "{title}" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
    (symbol "{name}_0_1" (rectangle (start -10.16 {top:.2f}) (end 10.16 {-top:.2f})
      (stroke (width 0.254) (type default)) (fill (type background))))
    (symbol "{name}_1_1"
      {chr(10).join(pins)}))'''


LOCALS = {
    "Local:MT8870": local_symbol("MT8870", "U", [
        ("1", "IN+", "input"), ("2", "IN-", "input"), ("3", "GS", "output"), ("4", "VRef", "output"),
        ("5", "INH", "input"), ("6", "PWDN", "input"), ("7", "OSC1", "input"), ("8", "OSC2", "output"),
        ("9", "VSS", "power_in")],
        [("18", "VDD", "power_in"), ("17", "St/GT", "bidirectional"), ("16", "ESt", "output"),
         ("15", "StD", "output"), ("14", "Q4", "tri_state"), ("13", "Q3", "tri_state"),
         ("12", "Q2", "tri_state"), ("11", "Q1", "tri_state"), ("10", "TOE", "input")],
        "DTMF decoder (Mitel/Microchip MT8870 or equivalent)"),
    "Local:DISPLAY_4DIGIT_CC": local_symbol("DISPLAY_4DIGIT_CC", "DS", [
        ("11", "A", "passive"), ("7", "B", "passive"), ("4", "C", "passive"), ("2", "D", "passive"),
        ("1", "E", "passive"), ("10", "F", "passive"), ("5", "G", "passive"), ("3", "DP", "passive")],
        [("12", "D1", "passive"), ("9", "D2", "passive"), ("8", "D3", "passive"), ("6", "D4", "passive")],
        "4-digit 7-segment module, common cathode (digit pins are the cathodes)"),
}


class Sym:
    def __init__(self, lib_id):
        self.lib_id = lib_id
        lib, name = lib_id.split(":")
        if lib_id in LOCALS:
            txt = LOCALS[lib_id]
        else:
            txt = block(f"{SYM}/{lib}.kicad_sym", name).replace('(symbol "%s"' % name, '(symbol "%s"' % lib_id, 1)
        self.text = txt
        tree = parse(txt)
        self.units = {}  # unit -> list of pins
        self.pins_by_unit = {}
        for sub in tree:
            if isinstance(sub, list) and sub and sub[0] == "symbol":
                m = re.match(r".*_(\d+)_(\d+)$", sub[1])
                u = int(m.group(1))
                for p in sub:
                    if isinstance(p, list) and p and p[0] == "pin":
                        d = {x[0]: x for x in p if isinstance(x, list)}
                        at = d["at"]
                        self.pins_by_unit.setdefault(u, []).append(dict(
                            num=d["number"][1], name=d["name"][1], x=float(at[1]), y=float(at[2]),
                            ang=int(float(at[3])), type=p[1]))
        self.nunits = max(max(self.pins_by_unit), 1)
        self.allpins = [p for u in self.pins_by_unit for p in self.pins_by_unit[u]]

    def unit_pins(self, u):
        return self.pins_by_unit.get(0, []) + self.pins_by_unit.get(u, [])


_syms = {}


def sym(lib_id):
    if lib_id not in _syms:
        _syms[lib_id] = Sym(lib_id)
    return _syms[lib_id]


def snap(v):
    return round(v / 1.27) * 1.27


out_items = []
power_n = [0]
flag_n = [0]


def f(v):
    return ("%.3f" % v).rstrip("0").rstrip(".")


def label(net, x, y, ang):
    j = "left bottom" if ang in (0, 90) else "right bottom"
    out_items.append(f'(label "{net}" (at {f(x)} {f(y)} {ang}) (effects (font (size 1.27 1.27)) (justify {j})) (uuid "{uid()}"))')


def wire(x1, y1, x2, y2):
    out_items.append(f'(wire (pts (xy {f(x1)} {f(y1)}) (xy {f(x2)} {f(y2)})) (stroke (width 0) (type default)) (uuid "{uid()}"))')


def power(netname, x, y):
    power_n[0] += 1
    lib = {"+5V": "power:+5V", GND: "power:GND"}[netname]
    out_items.append(f'''(symbol (lib_id "{lib}") (at {f(x)} {f(y)} 0) (unit 1) (exclude_from_sim no) (in_bom no) (on_board yes) (dnp no) (uuid "{uid()}")
    (property "Reference" "#PWR{power_n[0]:02d}" (at {f(x)} {f(y)} 0) (effects (font (size 1.27 1.27)) hide))
    (property "Value" "{netname}" (at {f(x)} {f(y + (2.54 if netname == GND else -3.5))} 0) (effects (font (size 1.27 1.27))))
    (property "Footprint" "" (at {f(x)} {f(y)} 0) (effects (font (size 1.27 1.27)) hide))
    (property "Datasheet" "" (at {f(x)} {f(y)} 0) (effects (font (size 1.27 1.27)) hide))
    (pin "1" (uuid "{uid()}"))
    (instances (project "phone" (path "/{ROOT}" (reference "#PWR{power_n[0]:02d}") (unit 1)))))''')


def pwr_flag(x, y, net):
    flag_n[0] += 1
    r = f"#FLG{flag_n[0]:02d}"
    out_items.append(f'''(symbol (lib_id "power:PWR_FLAG") (at {f(x)} {f(y)} 0) (unit 1) (exclude_from_sim no) (in_bom no) (on_board yes) (dnp no) (uuid "{uid()}")
    (property "Reference" "{r}" (at {f(x)} {f(y + 2.5)} 0) (effects (font (size 1.27 1.27)) hide))
    (property "Value" "PWR_FLAG" (at {f(x)} {f(y + 2.5)} 0) (effects (font (size 1.27 1.27)) hide))
    (property "Footprint" "" (at {f(x)} {f(y)} 0) (effects (font (size 1.27 1.27)) hide))
    (property "Datasheet" "" (at {f(x)} {f(y)} 0) (effects (font (size 1.27 1.27)) hide))
    (pin "1" (uuid "{uid()}"))
    (instances (project "phone" (path "/{ROOT}" (reference "{r}") (unit 1)))))''')
    label(net, x, y, 0)


def bbox(s, units):
    xs, ys = [], []
    for u in units:
        for p in s.unit_pins(u):
            xs.append(p["x"])
            ys.append(p["y"])
    return min(xs) - 3, max(xs) + 3, min(ys) - 3, max(ys) + 3


def resolve(part, s, p):
    """Net for symbol pin p of this part (by number, else by name)."""
    pins = part["pins"]
    if p["num"] in pins:
        return pins[p["num"]]
    if p["name"] in pins:
        return pins[p["name"]]
    raise SystemExit(f"{part['ref']}: no net for pin {p['num']} {p['name']}")


# ---- layout ----------------------------------------------------------------------------------
PAPER = (841, 594)
X0, Y0, MAXX = 25.4, 25.4, 800
cx, cy, rowh = X0, Y0, 0
ORDER = ["U1", "U2", "U3", "U4", "U5", "U6", "Q1", "Q2", "X1", "DS1", "DS2", "D1", "D2", "MK1", "LS1",
         "SW1", "SW2", "SW3", "SW4", "SW5", "BT1"]
parts_sorted = sorted(parts, key=lambda p: (ORDER.index(p["ref"]) if p["ref"] in ORDER else 99, int(re.sub(r"\D", "", p["ref"]) or 0)))
lib_used = {}
for part in parts_sorted:
    s = sym(part["sym"])
    lib_used[part["sym"]] = s
    units = range(1, s.nunits + 1)
    first_ref_done = False
    for u in units:
        x1, x2, y1, y2 = bbox(s, [u])
        w = x2 - x1 + 2 * 38
        h = y2 - y1 + 12
        if cx + w > MAXX:
            cx, cy, rowh = X0, cy + rowh + 8, 0
        ox = snap(cx + 38 - x1)
        oy = snap(cy + 8 - y1 + 0)
        if len(units) > 1 and False:
            pass
        rowh = max(rowh, h)
        cx += w
        ref = part["ref"]
        value = part["value"]
        fpk = part["fp"]
        unit_n = u
        props = f'''(property "Reference" "{ref}" (at {f(ox + x1 + 3)} {f(oy - y2 - 2.5)} 0) (effects (font (size 1.27 1.27)) (justify left)))
    (property "Value" "{value}" (at {f(ox + x1 + 3)} {f(oy - y1 + 2.5)} 0) (effects (font (size 1.27 1.27)) (justify left)))
    (property "Footprint" "phone:{NAMES[fpk]}" (at {f(ox)} {f(oy)} 0) (effects (font (size 1.27 1.27)) hide))
    (property "Datasheet" "" (at {f(ox)} {f(oy)} 0) (effects (font (size 1.27 1.27)) hide))
    (property "Description" "{part['desc']}" (at {f(ox)} {f(oy)} 0) (effects (font (size 1.27 1.27)) hide))'''
        pin_uuids = "\n    ".join(f'(pin "{p["num"]}" (uuid "{uid()}"))' for p in s.unit_pins(u))
        out_items.append(f'''(symbol (lib_id "{part['sym']}") (at {f(ox)} {f(oy)} 0) (unit {unit_n}) (exclude_from_sim no) (in_bom yes) (on_board yes) (dnp no) (uuid "{uid()}")
    {props}
    {pin_uuids}
    (instances (project "phone" (path "/{ROOT}" (reference "{ref}") (unit {unit_n})))))''')
        for p in s.unit_pins(u):
            net = resolve(part, s, p)
            netlist.setdefault(ref, {})[p['num']] = net
            px, py = ox + p["x"], oy - p["y"]
            if net is None:
                out_items.append(f'(no_connect (at {f(px)} {f(py)}) (uuid "{uid()}"))')
                continue
            a = (p["ang"] + 180) % 360  # outward, library (y up)
            dx, dy = math.cos(math.radians(a)), -math.sin(math.radians(a))
            ex, ey = px + dx * 5.08, py + dy * 5.08
            wire(px, py, ex, ey)
            if net in (GND, V5):
                power(net, ex, ey)
            else:
                label(net, ex, ey, {0: 0, 90: 90, 180: 180, 270: 270}[round(math.degrees(math.atan2(-dy, dx))) % 360])

# power flags (a net needs one driven source for ERC): battery and ground
fx, fy = snap(X0 + 20), snap(cy + rowh + 20)
pwr_flag(fx, fy, "VBAT")
pwr_flag(snap(fx + 30), fy, "GND")
pwr_flag(snap(fx + 60), fy, "VBAT_RAW")

lib_syms = "\n  ".join(s.text for s in ([sym(k) for k in ("power:+5V", "power:GND", "power:PWR_FLAG")] + list(lib_used.values())) if False) if False else None
need = {}
for k in list(lib_used) + ["power:+5V", "power:GND", "power:PWR_FLAG"]:
    need[k] = sym(k)
lib_txt = "\n  ".join(s.text for s in need.values())

title = '''(title_block (title "THE PHONE OF THE FUTURE") (date "2026-11-03") (rev "A")
    (company "Game-Maker: Sandbox Edition. Untested design; designed by Claude Sonnet 5.5 under Lewis Moten's direction")
    (comment 1 "Half-duplex infrared voice and DTMF handset, PIC16F84A, MT8870, MAX7219")
    (comment 2 "References: DTMF frequencies (ITU-T Q.23), MT8870D and MAX7219 datasheets"))'''
doc = f'''(kicad_sch (version 20250114) (generator "eeschema") (generator_version "9.0")
  (uuid "{ROOT}")
  (paper "A1")
  {title}
  (lib_symbols
  {lib_txt}
  )
  {chr(10).join(out_items)}
  (sheet_instances (path "/" (page "1")))
  (embedded_fonts no)
)
'''
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w").write(doc)
print("wrote", os.path.normpath(OUT), len(parts), "parts")

D = os.path.dirname(OUT)
json.dump(netlist, open(os.path.join(D, "netlist.json"), "w"), indent=1)
# local symbol library and project library tables
loc = "\n".join(re.sub(r'\(symbol "Local:', '(symbol "', LOCALS[k], count=1) for k in LOCALS)
open(os.path.join(D, "phone.kicad_sym"), "w").write(
    '(kicad_symbol_lib (version 20241209) (generator "kicad_symbol_editor") (generator_version "9.0")\n' + loc + "\n)\n")
open(os.path.join(D, "sym-lib-table"), "w").write(
    '(sym_lib_table (version 7)\n  (lib (name "Local") (type "KiCad") (uri "${KIPRJMOD}/phone.kicad_sym") (options "") (descr "MT8870 and 4-digit display"))\n)\n')
open(os.path.join(D, "fp-lib-table"), "w").write(
    '(fp_lib_table (version 7)\n  (lib (name "phone") (type "KiCad") (uri "${KIPRJMOD}/phone.pretty") (options "") (descr "Big-pad footprints for the phone"))\n)\n')
