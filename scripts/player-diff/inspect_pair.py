#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["capstone==5.0.7"]
# ///
"""Look closer at one pair after `gmpdiff.py diff`: side-by-side functions, the bytes outside
functions, address mapping, raw disassembly.

  uv run scripts/player-diff/inspect_pair.py side OLD NEW OLD_ADDR NEW_ADDR [--context N]
  uv run scripts/player-diff/inspect_pair.py gaps OLD NEW
  uv run scripts/player-diff/inspect_pair.py maps OLD NEW OLD_SEG:OFF=NEW_SEG:OFF ...
  uv run scripts/player-diff/inspect_pair.py dgroup OLD NEW OLD_OFF=NEW_OFF ...
  uv run scripts/player-diff/inspect_pair.py dis BUILD SEG:OFF END_OFF

side  aligns the normalized instructions of a matched function pair and prints both addresses,
      with each call's target resolved through functions.tsv (old|new address and name).
gaps  compares the code-region bytes that no discovered function covers (switch-case bodies
      reached only through tables the discovery could not bound, jump tables, interrupt
      handlers, padding). Each gap is paired by the matched function before it; a gap is
      RELOC-ONLY when every difference is a relocated word or a code address that maps old->new,
      else RESIDUAL with an instruction and byte diff to read by hand. Gaps that could not be
      paired this way are listed last (UNPAIRED); read them by hand too. A gap paired with the
      wrong partner shows up as one large RESIDUAL plus an UNPAIRED gap on each side.
maps  checks that each old address maps to the given new one (a code pointer constant moved
      with its target rather than changing).
dgroup checks that each old DGROUP offset (hex) maps to the given new one: inside the
      initialized data by a byte alignment of the two data segments (relocations masked), past
      it (BSS) by the growth of the initialized data. Runs of zero bytes align arbitrarily, so a
      zero-initialized variable can fail here and need other evidence. Prints the string there.
dis   linear disassembly of a load-image range of a build's canonical copy.

Reads the work folder of gmpdiff.py (--work or $GMPD_WORK, default ~/.cache/gm-player-diff)
and the committed functions.tsv. Only reads binaries. Written by Claude Opus 5.5 for Lewis Moten.
"""

from __future__ import annotations

import argparse
import difflib
import json
import os
import re
import struct
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
sys.path.insert(0, str(HERE))

from capstone import CS_ARCH_X86, CS_MODE_16, Cs
from gmpd import disasm

MD = Cs(CS_ARCH_X86, CS_MODE_16)
NUM = re.compile(r"0x[0-9a-f]+|\d+")


def lin_of(a: str) -> int:
    s, o = a.split(":")
    return int(s, 16) * 16 + int(o, 16)


class Pair:
    def __init__(self, work: Path, old: str, new: str):
        canon = json.loads((work / "canonical.json").read_text())
        self.po = disasm.analyze((work / canon[old]["cached"]).read_bytes())
        self.pn = disasm.analyze((work / canon[new]["cached"]).read_bytes())
        self.rows = []
        tsv = REPO / "docs/analysis/player-diff/pairs" / f"{old}__{new}" / "functions.tsv"
        for row in tsv.read_text().splitlines()[1:]:
            self.rows.append(row.split("\t"))
        self.pairs = {int(c[2], 16): int(c[5], 16) for c in self.rows if c[1] and c[4]}
        self.label_o = {int(c[2], 16): (c[1], c[4], c[10] or c[11]) for c in self.rows if c[1]}
        self.label_n = {int(c[5], 16): (c[1], c[4], c[10] or c[11]) for c in self.rows if c[4]}
        self.amap: dict[int, int] = {}
        self._map_functions()
        self.go, self.gn = gaps(self.po), gaps(self.pn)
        self.paired = self._pair_gaps()
        self._map_gaps()

    def _map_functions(self) -> None:
        for o, n in self.pairs.items():
            fo, fn = self.po.funcs[o], self.pn.funcs[n]
            sm = difflib.SequenceMatcher(None, [i.norm for i in fo.insns], [i.norm for i in fn.insns], autojunk=False)
            for tag, i1, i2, j1, j2 in sm.get_opcodes():
                if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
                    for k in range(i2 - i1):
                        self.amap[fo.insns[i1 + k].lin] = fn.insns[j1 + k].lin

    def _pair_gaps(self):
        out = []
        for a, b in self.go:
            fo = owner(self.po, a)
            if fo not in self.pairs:
                continue
            k = sum(1 for x, _ in self.go if owner(self.po, x) == fo and x < a)
            after = [x for x in self.gn if owner(self.pn, x[0]) == self.pairs[fo]]
            if len(after) > k:
                out.append(((a, b), after[k]))
        return out

    def _map_gaps(self) -> None:
        for (a, b), (na, nb) in self.paired:
            if b - a == nb - na:
                for d in range(b - a):
                    self.amap.setdefault(a + d, na + d)
                continue
            io, inn = decode(self.po, a, b), decode(self.pn, na, nb)
            sm = difflib.SequenceMatcher(None, [i.mnemonic for _, i in io], [i.mnemonic for _, i in inn], autojunk=False)
            for tag, i1, i2, j1, j2 in sm.get_opcodes():
                if tag == "equal":
                    for k in range(i2 - i1):
                        self.amap.setdefault(io[i1 + k][0], inn[j1 + k][0])


def gaps(p) -> list[tuple[int, int]]:
    cov = bytearray(p.code_end)
    for f in p.funcs.values():
        for i in f.insns:
            cov[i.lin : i.lin + i.size] = b"\1" * i.size
    out, i = [], 0
    while i < p.code_end:
        if cov[i]:
            i += 1
            continue
        j = i
        while j < p.code_end and not cov[j]:
            j += 1
        out.append((i, j))
        i = j
    return out


def owner(p, lin: int) -> int | None:
    return max((s for s in p.funcs if s <= lin), default=None)


def masked(p, a: int, b: int) -> bytes:
    m = bytearray(p.image[a:b])
    for r in range(a - 1, b):
        if r in p.relocs:
            for k in (r, r + 1):
                if a <= k < b:
                    m[k - a] = 0
    return bytes(m)


def decode(p, a: int, b: int):
    seg = p.seg_for(a)
    return [(seg * 16 + i.address, i) for i in MD.disasm(bytes(p.image[a:b]), a - seg * 16)]


def addr(p, lin: int) -> str:
    s = p.seg_for(lin)
    return f"{s:04X}:{lin - s * 16:04X}"


# --- side ------------------------------------------------------------------------------------

def call_label(pr: Pair, newside: bool, ins) -> str:
    p, labels = (pr.pn, pr.label_n) if newside else (pr.po, pr.label_o)
    raw = ins.raw
    if raw[0] == 0x9A and ins.size == 5:
        o, s = struct.unpack_from("<HH", raw, 1)
        lin = s * 16 + o
    elif raw[0] == 0xE8 and ins.size == 3:
        lin = p.seg_for(ins.lin) * 16 + ((ins.off + 3 + struct.unpack_from("<h", raw, 1)[0]) & 0xFFFF)
    else:
        return ""
    t = labels.get(lin)
    return f"   -> {t[0] or '-'}|{t[1] or '-'} {t[2]}".rstrip() if t else f"   -> lin {lin:05X}"


def cmd_side(pr: Pair, a: argparse.Namespace) -> None:
    fo, fn = pr.po.funcs[lin_of(a.old_addr)], pr.pn.funcs[lin_of(a.new_addr)]
    sm = difflib.SequenceMatcher(None, [i.norm for i in fo.insns], [i.norm for i in fn.insns], autojunk=False)
    for grp in sm.get_grouped_opcodes(a.context):
        print("@@")
        for tag, i1, i2, j1, j2 in grp:
            if tag == "equal":
                for x, y in zip(fo.insns[i1:i2], fn.insns[j1:j2]):
                    print(f"  {addr(pr.po, x.lin)} {addr(pr.pn, y.lin)}  {y.text:<40}{call_label(pr, True, y)}".rstrip())
                continue
            for x in fo.insns[i1:i2]:
                print(f"- {addr(pr.po, x.lin)}            {x.text:<40}{call_label(pr, False, x)}".rstrip())
            for y in fn.insns[j1:j2]:
                print(f"+           {addr(pr.pn, y.lin)}  {y.text:<40}{call_label(pr, True, y)}".rstrip())


# --- gaps ------------------------------------------------------------------------------------

def same_but_moved(pr: Pair, x, y, sega: int, segb: int) -> tuple[bool, str]:
    if x.mnemonic != y.mnemonic:
        return False, "mnemonic"
    if x.op_str == y.op_str:
        return True, ""
    la, lb = sega * 16 + x.address, segb * 16 + y.address
    if x.size == y.size and masked(pr.po, la, la + x.size) == masked(pr.pn, lb, lb + y.size):
        return True, "relocated word"
    ra, rb = bytes(x.bytes), bytes(y.bytes)
    if ra[0] == 0x9A and rb[0] == 0x9A:
        oa, sa = struct.unpack_from("<HH", ra, 1)
        ob, sb = struct.unpack_from("<HH", rb, 1)
        return pr.amap.get(sa * 16 + oa) == sb * 16 + ob, "far call target"
    na, nb = NUM.findall(x.op_str), NUM.findall(y.op_str)
    if x.mnemonic.startswith("j") or x.mnemonic in ("call", "loop"):
        return pr.amap.get(sega * 16 + int(na[-1], 0)) == segb * 16 + int(nb[-1], 0), "near target"
    if NUM.sub("N", x.op_str) != NUM.sub("N", y.op_str):
        return False, "operand form"
    return False, "constant " + ", ".join(f"{u}->{v}" for u, v in zip(na, nb) if u != v)


def cmd_gaps(pr: Pair, _a: argparse.Namespace) -> None:
    po, pn = pr.po, pr.pn
    print(f"gaps: old {len(pr.go)} ({sum(b - a for a, b in pr.go)} B), new {len(pr.gn)} ({sum(b - a for a, b in pr.gn)} B); paired {len(pr.paired)}")
    same = 0
    for (a, b), (na, nb) in pr.paired:
        if masked(po, a, b) == masked(pn, na, nb):
            same += 1
            continue
        sega, segb = po.seg_for(a), pn.seg_for(na)
        head = f"gap {addr(po, a)} ({b - a} B) -> {addr(pn, na)} ({nb - na} B) after {po.funcs[owner(po, a)].addr}->{pn.funcs[owner(pn, na)].addr}"
        if (b - a) % 2 == 0 and b - a == nb - na and b - a <= 64:
            wa = struct.unpack_from(f"<{(b - a) // 2}H", po.image, a)
            wb = struct.unpack_from(f"<{(nb - na) // 2}H", pn.image, na)
            if all(pr.amap.get(sega * 16 + x) == segb * 16 + y for x, y in zip(wa, wb)):
                print(f"RELOC-ONLY table  {head}: {len(wa)} near targets, all map old->new")
                continue
        io, inn = decode(po, a, b), decode(pn, na, nb)
        key = lambda i: i.mnemonic + " " + NUM.sub("N", i.op_str)
        sm = difflib.SequenceMatcher(None, [key(i) for _, i in io], [key(i) for _, i in inn], autojunk=False)
        res = []
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag == "equal":
                for (_, x), (_, y) in zip(io[i1:i2], inn[j1:j2]):
                    ok, why = same_but_moved(pr, x, y, sega, segb)
                    if not ok:
                        res.append(f"  ~ {sega:04X}:{x.address:04X} {x.mnemonic} {x.op_str:<28} | {segb:04X}:{y.address:04X} {y.mnemonic} {y.op_str}   [{why}]")
                continue
            res += [f"  - {sega:04X}:{x.address:04X} {x.mnemonic} {x.op_str}" for _, x in io[i1:i2]]
            res += [f"  + {segb:04X}:{y.address:04X} {y.mnemonic} {y.op_str}" for _, y in inn[j1:j2]]
        if not res:
            print(f"RELOC-ONLY code   {head}: {len(io)} instructions, only relocated words and mapped targets differ")
            continue
        print(f"RESIDUAL          {head}")
        print("\n".join(res))
        bo, bn = masked(po, a, b), masked(pn, na, nb)
        for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, bo, bn, autojunk=False).get_opcodes():
            if tag != "equal":
                print(f"    bytes {tag} old +{i1:04X} [{bo[max(0, i1 - 4):i2 + 4].hex(' ')}]  new +{j1:04X} [{bn[max(0, j1 - 4):j2 + 4].hex(' ')}]")
    print(f"paired gaps with equal masked bytes: {same}")
    used = ({a for (a, _), _ in pr.paired}, {na for _, (na, _) in pr.paired})
    for side, p, gl, done in (("old", po, pr.go, used[0]), ("new", pn, pr.gn, used[1])):
        for a, b in gl:
            if a in done:
                continue
            fo = owner(p, a)
            head = f"UNPAIRED {side} gap {addr(p, a)} ({b - a} B) after {p.funcs[fo].addr if fo is not None else '-'}"
            # the owner slot (load-image bytes 0-51) is masked; never print it
            body = "owner slot (masked)" if a < 52 else masked(p, a, min(b, a + 16)).hex(" ") + (" ..." if b - a > 16 else "")
            print(f"{head}: {body}")


def dgroup_map(pr: Pair) -> tuple[dict[int, int], int, int]:
    do = masked(pr.po, pr.po.code_end, len(pr.po.image))
    dn = masked(pr.pn, pr.pn.code_end, len(pr.pn.image))
    m: dict[int, int] = {}
    for tag, i1, i2, j1, _ in difflib.SequenceMatcher(None, do, dn, autojunk=False).get_opcodes():
        if tag == "equal":
            m.update((i1 + k, j1 + k) for k in range(i2 - i1))
    return m, len(do), len(dn)


def text_at(p, off: int) -> str:
    s = bytes(p.image[p.code_end + off : p.code_end + off + 48]).split(b"\0")[0]
    return repr(s.decode("latin-1")) if len(s) >= 3 and all(32 <= c < 127 for c in s) else ""


def cmd_dgroup(pr: Pair, a: argparse.Namespace) -> None:
    m, lo, ln = dgroup_map(pr)
    print(f"initialized data: old {lo} B, new {ln} B (BSS shift {ln - lo:+#x})")
    for spec in a.spec:
        o, n = (int(x, 16) for x in spec.split("="))
        if o < lo:
            got = m.get(o)
            verdict = "maps (initialized data)" if got == n else f"DOES NOT MAP (old aligns to {'none' if got is None else hex(got)})"
        else:
            verdict = "maps (BSS)" if n - o == ln - lo else f"DOES NOT MAP (BSS shift is {ln - lo:+#x})"
        print(f"{o:#06x} -> {n:#06x}: {verdict} {text_at(pr.po, o)}".rstrip())


def cmd_maps(pr: Pair, a: argparse.Namespace) -> None:
    for spec in a.spec:
        o, n = spec.split("=")
        got = pr.amap.get(lin_of(o))
        verdict = "maps" if got == lin_of(n) else f"DOES NOT MAP (old maps to {addr(pr.pn, got) if got is not None else 'nothing'})"
        print(f"{o} -> {n}: {verdict}")


def cmd_dis(work: Path, a: argparse.Namespace) -> None:
    canon = json.loads((work / "canonical.json").read_text())
    p = disasm.Program((work / canon[a.build]["cached"]).read_bytes())
    seg, off = (int(x, 16) for x in a.start.split(":"))
    for i in MD.disasm(bytes(p.image[seg * 16 + off : seg * 16 + int(a.end, 16)]), off):
        print(f"{seg:04X}:{i.address:04X}  {i.bytes.hex():<14} {i.mnemonic} {i.op_str}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--work", type=Path, default=Path(os.environ.get("GMPD_WORK", Path.home() / ".cache/gm-player-diff")))
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("side")
    s.add_argument("old"), s.add_argument("new"), s.add_argument("old_addr"), s.add_argument("new_addr")
    s.add_argument("--context", type=int, default=3)
    g = sub.add_parser("gaps")
    g.add_argument("old"), g.add_argument("new")
    m = sub.add_parser("maps")
    m.add_argument("old"), m.add_argument("new"), m.add_argument("spec", nargs="+")
    dg = sub.add_parser("dgroup")
    dg.add_argument("old"), dg.add_argument("new"), dg.add_argument("spec", nargs="+")
    d = sub.add_parser("dis")
    d.add_argument("build"), d.add_argument("start"), d.add_argument("end")
    a = ap.parse_args()
    if a.cmd == "dis":
        cmd_dis(a.work, a)
        return
    pr = Pair(a.work, a.old, a.new)
    {"side": cmd_side, "gaps": cmd_gaps, "maps": cmd_maps, "dgroup": cmd_dgroup}[a.cmd](pr, a)


if __name__ == "__main__":
    main()
