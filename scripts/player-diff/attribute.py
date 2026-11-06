# /// script
# requires-python = ">=3.11"
# dependencies = ["capstone==5.0.7"]
# ///
"""Attribute one pair's functions to link modules, using the Borland MAP files in code/GM.

gmpdiff.py matches functions; this adds *where* each function lives. A Borland large-model
program gives every source module its own code segment, in link order, so the binary's
segment list (the relocated segment words) lines up one to one with a MAP's code segments
when both come from the same link script. The MAP lengths are then checked against the
binary's segment spans, and MAP public names are put on functions only where a whole run
of publics lands exactly on discovered function starts (see fit_names).

    uv run scripts/player-diff/attribute.py --pair 2.04 3.00-xfer \\
        --old-map code/GM/XFERPLAY.MAP --new-map code/GM/PLAYGAME.MAP \\
        --out docs/analysis/player-diff-3.0

Needs a prior `gmpdiff.py inventory` (the work folder's canonical.json and bin/).
Writes <out>/modules.tsv (one row per module and build side), <out>/functions.tsv (every
function of both builds with its module, MAP name, match status, other-side gap and
referenced strings) and <out>/gaps.tsv (every code-region run outside functions, classified;
see gaps()). Deterministic: two runs give the same bytes.
"""

from __future__ import annotations

import argparse
import json
import os
import struct
import sys
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
REPO = HERE.parent.parent

from gmpd import disasm, mapfile, match, report  # noqa: E402


def map_modules(map_path: Path) -> tuple[list[dict], list[tuple[int, int, str]], list[dict]]:
    """Code and far-data segments of a MAP (link order), its publics, and its detailed
    per-object entries (start, length, segment name, object name)."""
    segs, pubs = mapfile.read_map(map_path)
    mods = [s for s in segs if s["class"] in ("CODE", "FAR_DATA") and s["length"] > 0 and s["name"] != "AAAA"]
    objs = []
    for line in map_path.read_text(encoding="latin-1").replace("\r", "").split("\n"):
        p = line.split()
        if len(p) >= 6 and ":" in p[0] and p[2].startswith("C=") and p[3].startswith("S="):
            fs, fo = (int(x, 16) for x in p[0].split(":"))
            obj = next((x[2:] for x in p if x.startswith("M=")), "")
            objs.append({"start": fs * 16 + fo, "length": int(p[1], 16), "seg": p[3][2:], "obj": obj})
    return mods, pubs, objs


def layout(prog, map_path: Path) -> list[dict]:
    """Pair the binary's segments with the MAP's, in order. A function belongs to the
    module whose segment frame its own address uses (the disassembler keeps each function's
    segment), not to whichever span its linear address falls in: a module's last bytes can
    sit past the next module's frame base."""
    mods, pubs, objs = map_modules(map_path)
    segs = list(prog.code_segs)
    out = []
    for i, bs in enumerate(segs):
        end = segs[i + 1] * 16 if i + 1 < len(segs) else prog.code_end
        m = mods[i] if i < len(mods) else {"name": "?", "start": 0, "length": 0}
        mpubs = [(fs * 16 + fo - m["start"], name) for fs, fo, name in pubs if m["start"] <= fs * 16 + fo < m["start"] + m["length"]]
        mobjs = [dict(o, rel=o["start"] - m["start"]) for o in objs if o["seg"] == m["name"] and m["start"] <= o["start"] < m["start"] + m["length"]]
        out.append({"seg": bs, "lin": bs * 16, "end": end, "span": end - bs * 16, "module": m["name"], "map_len": m["length"], "pubs": mpubs, "objs": mobjs})
    return out


def fit_names(prog, mod: dict, min_run: int = 3) -> dict[int, tuple[str, int]]:
    """Put MAP publics on function starts. Code inserted or removed earlier in a module
    moves everything after it by one shift, so for each candidate shift (binary offset minus
    MAP offset) the publics that land exactly on a discovered function start are found, and
    only *runs* of at least `min_run` consecutive publics (in MAP order) that all land are
    accepted. A lone coincidental landing never names anything. Longer runs win; a public
    and a function are named once. Returns {function start: (name, run length, shift)}."""
    starts = sorted(f.start for f in prog.funcs.values() if f.seg == mod["seg"])
    size = {f.start: f.size for f in prog.funcs.values()}
    sset = set(starts)
    pubs = sorted(set(mod["pubs"]))
    offs = sorted({r for r, _ in pubs}) + [mod["map_len"]]
    gap = {r: offs[i + 1] - r for i, r in enumerate(offs[:-1])}
    deltas = {s - mod["lin"] - r for r, _ in pubs for s in starts}
    runs = []
    for d in deltas:
        cur: list[tuple[int, str, int, int]] = []
        for r, name in pubs + [(None, None)]:
            # a landing counts only when the function also fits before the next public
            s = mod["lin"] + r + d if r is not None else -1
            if r is not None and s in sset and size[s] <= gap[r]:
                cur.append((s, name, d, r))
                continue
            # the run's last public is not confirmed by the next one landing, so it must
            # fill its MAP slot (within 16 bytes) to count; otherwise it is dropped
            while cur and size[cur[-1][0]] < gap[cur[-1][3]] - 16:
                cur.pop()
            if len(cur) >= min_run:
                runs.append([(s_, n_, d_) for s_, n_, d_, _ in cur])
            cur = []
    named: dict[int, tuple[str, int, int]] = {}
    used = set()
    # First, a module that kept its layout (MAP length within 16 bytes of the binary span):
    # one shift on which at least half of its publics, and at least 2, land. Small modules
    # have too few publics for a run of min_run.
    votes = {}
    for d in (deltas if abs(mod["map_len"] - mod["span"]) < 16 else ()):
        hits = [(mod["lin"] + r + d, name) for r, name in pubs if mod["lin"] + r + d in sset and size[mod["lin"] + r + d] <= gap[r]]
        if len(hits) >= 2 and len(hits) * 2 >= len(pubs):
            votes[d] = hits
    if votes:
        d, hits = max(votes.items(), key=lambda kv: (len(kv[1]), -abs(kv[0])))
        if sum(1 for v in votes.values() if len(v) == len(hits)) == 1:  # an unambiguous best
            for s, nm in hits:
                named[s] = (nm, len(hits), d)
                used.add(nm)
    for run in sorted(runs, key=lambda x: (-len(x), x[0][0])):
        if any(s in named or nm in used for s, nm, _ in run):
            continue
        for s, nm, d in run:
            named[s] = (nm, len(run), d)
            used.add(nm)
    return named


def module_of(lay: list[dict], seg: int) -> dict:
    return next(m for m in lay if m["seg"] == seg)


def obj_of(mod: dict, rel: int, shifts: list[tuple[int, int]]) -> str:
    """The MAP object (source file) a module offset falls in, after undoing the shift of
    the nearest MAP-named function at or before it (none: the shift is taken as 0)."""
    d = 0
    for at, shift in shifts:
        if at <= rel:
            d = shift
    best = ""
    for o in mod["objs"]:
        if o["rel"] <= rel - d:
            best = o["obj"]
    return best


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--pair", nargs=2, required=True, metavar=("OLD", "NEW"))
    ap.add_argument("--old-map", type=Path, required=True)
    ap.add_argument("--new-map", type=Path, required=True)
    ap.add_argument("--work", type=Path, default=Path(os.environ.get("GMPD_WORK", Path.home() / ".cache/gm-player-diff")))
    ap.add_argument("--out", type=Path, required=True)
    a = ap.parse_args()
    canon = json.loads((a.work / "canonical.json").read_text())
    old_id, new_id = a.pair
    P = {k: disasm.analyze((a.work / canon[k]["cached"]).read_bytes()) for k in (old_id, new_id)}
    L = {old_id: layout(P[old_id], REPO / a.old_map), new_id: layout(P[new_id], REPO / a.new_map)}
    names: dict[str, dict[int, tuple[str, str]]] = {k: {} for k in P}
    shifts: dict[tuple[str, int], list[tuple[int, int]]] = {}
    for k in P:
        for mod in L[k]:
            fitted = fit_names(P[k], mod)
            shifts[(k, mod["seg"])] = sorted((s - mod["lin"], d) for s, (_, _, d) in fitted.items())
            for s, (nm, v, _) in fitted.items():
                names[k][s] = (nm, f"map:{v}")
    m = match.Matcher(P[old_id], P[new_id])
    m.run()
    ms, rem, add = m.results()
    for p in P.values():
        report.index_strings(p)
    status = {old_id: {}, new_id: {}}
    agree = Counter()
    for x in ms:
        conf = report.confidence(x)
        status[old_id][x.a.start] = (x.status, x.b, x.sim, x.method, conf)
        status[new_id][x.b.start] = (x.status, x.a, x.sim, x.method, conf)
        if conf != "low":  # carry names across confident matches only
            na, nb = names[old_id].get(x.a.start), names[new_id].get(x.b.start)
            if na and not nb:
                names[new_id][x.b.start] = (na[0], f"via {old_id}")
            elif nb and not na:
                names[old_id][x.a.start] = (nb[0], f"via {new_id}")
            elif na and nb:
                agree[na[0] == nb[0]] += 1
                if na[0] != nb[0]:
                    print(f"  name conflict: {x.a.addr} {na[0]} vs {x.b.addr} {nb[0]}")
    for f in rem:
        status[old_id][f.start] = ("removed", None, 0.0, "", "")
    for f in add:
        status[new_id][f.start] = ("added", None, 0.0, "", "")

    a.out.mkdir(parents=True, exist_ok=True)
    cover = {k: coverage(P[k]) for k in P}
    G = {k: gaps(P[k], L[k], cover[k]) for k in P}
    segmod = {k: {m["seg"]: m["module"] for m in L[k]} for k in P}
    twin = gap_twins(P, status, G, (old_id, new_id), segmod)

    rows = ["side\tsegment\tmodule\tmap_len\tspan\tfunctions\tspan_bytes_in_functions\tspan_bytes_outside\tmap_names\t" + "\t".join(STATUSES) + "\t" + "\t".join(f"gap_{g}" for g in GAP_KINDS)]
    for k in P:
        for mod in L[k]:
            fs = [f for f in P[k].funcs.values() if f.seg == mod["seg"]]
            inb = sum(cover[k][mod["lin"] : mod["end"]])
            c = Counter(status[k][f.start][0] for f in fs)
            g = Counter()
            for x in G[k]:
                if x["seg"] == mod["seg"]:
                    g[x["kind"]] += x["bytes"]
            nn = sum(1 for f in fs if names[k].get(f.start, ("", ""))[1].startswith("map"))
            rows.append("\t".join([k, f"{mod['seg']:04X}", mod["module"], str(mod["map_len"]), str(mod["span"]), str(len(fs)), str(inb), str(mod["span"] - inb), str(nn)] + [str(c.get(s, 0)) for s in STATUSES] + [str(g.get(x, 0)) for x in GAP_KINDS]))
    (a.out / "modules.tsv").write_text("\n".join(rows) + "\n")

    fr = ["side\taddr\tlin\tsize\tmodule\tobject\tname\tname_source\tstatus\tpartner\tsim\tmethod\tconfidence\tother_side_gap\tstrings"]
    for k in P:
        for f in sorted(P[k].funcs.values(), key=lambda f: f.start):
            mod = module_of(L[k], f.seg)
            st, partner, sim, meth, conf = status[k][f.start]
            nm, src = names[k].get(f.start, ("", ""))
            strs = " | ".join(report.cell(s, 40) for s in dict.fromkeys(f.strings))
            fr.append("\t".join([k, f.addr, f"{f.start:05X}", str(f.size), mod["module"], obj_of(mod, f.start - mod["lin"], shifts[(k, mod["seg"])]), nm, src, st, partner.addr if partner else "", f"{sim:.3f}" if partner else "", meth, conf, twin.get((k, f.start), ""), report.cell(strs, 300)]))
    (a.out / "functions.tsv").write_text("\n".join(fr) + "\n")

    gr = ["side\tmodule\tstart\tbytes\tkind\tafter_function\tfirst_bytes"]
    for k in P:
        for x in G[k]:
            gr.append("\t".join([k, x["module"], x["addr"], str(x["bytes"]), x["kind"], x["after"], x["head"]]))
    (a.out / "gaps.tsv").write_text("\n".join(gr) + "\n")
    print(f"MAP names on both sides of a confident match: {agree[True]} agree, {agree[False]} conflict")
    print(f"added/removed functions found as undiscovered code on the other side: {len(twin)}")
    print(f"wrote modules.tsv, functions.tsv and gaps.tsv in {a.out}")


def coverage(prog) -> bytearray:
    """1 for every code-region byte some discovered function's instructions occupy."""
    cover = bytearray(prog.code_end)
    for f in prog.funcs.values():
        for i in f.insns:
            cover[i.lin : i.lin + i.size] = b"\1" * i.size
    return cover


GAP_KINDS = ["zero", "jumptable", "switch-body", "prologue", "eh-table", "text", "other"]


def gaps(prog, lay: list[dict], cover: bytearray) -> list[dict]:
    """Every run of code-region bytes no discovered function covers, classified:
    zero (NUL/NOP padding, or a zero-filled far array); jumptable (words that all point at
    covered code in the module); switch-body (the instruction just before is an indirect
    jmp, so this is case code the disassembler could not follow); prologue (starts like a
    function or an interrupt handler: push bp/mov bp,sp, enter, or pushes of ax,bx,... so
    reached only through a pointer); eh-table (Borland C++ exception/destructor tables: a
    word 0x0026 then 0xFFFF in the first 8 bytes, emitted after functions with C++
    objects); text; other (data, tables or code without a prologue)."""
    last = {}
    for f in prog.funcs.values():
        for i in f.insns:
            last[i.lin + i.size] = (i, f)
    out, img = [], prog.image
    for m in lay:
        i = m["lin"]
        while i < m["end"]:
            if cover[i]:
                i += 1
                continue
            j = i
            while j < m["end"] and not cover[j]:
                j += 1
            chunk, n = img[i:j], j - i
            prev = last.get(i)
            words = struct.unpack(f"<{n // 2}H", chunk[: n - n % 2]) if n >= 4 and n % 2 == 0 else ()
            if all(c in (0, 0x90) for c in chunk):
                kind = "zero"
            elif words and all(m["lin"] + w < m["end"] and cover[m["lin"] + w] for w in words):
                kind = "jumptable"
            elif prev and prev[0].text.startswith("jmp word ptr"):
                kind = "switch-body"
            elif chunk[:3] == b"\x55\x8b\xec" or chunk[:1] == b"\xc8" or chunk[:4] in (b"\x50\x53\x51\x52", b"\x50\x53\x51\x1e", b"\x1e\x50\xb8\xbc", b"\x1e\x50\xb8\x2c"):
                kind = "prologue"
            elif b"\x26\x00\xff\xff" in chunk[:8]:
                kind = "eh-table"
            elif sum(32 <= c < 127 for c in chunk) > 0.8 * n:
                kind = "text"
            else:
                kind = "other"
            out.append({"seg": m["seg"], "module": m["module"], "addr": f"{m['seg']:04X}:{i - m['lin']:04X}", "lin": i, "bytes": n, "kind": kind, "after": prev[1].addr if prev else "", "head": chunk[:12].hex()})
            i = j
    return out


def masked(prog, lin: int, n: int) -> bytes:
    b = bytearray(prog.image[lin : lin + n])
    for o in range(lin, lin + n):
        if o in prog.relocs:
            b[o - lin : o - lin + 2] = b"\0\0"
    return bytes(b)


def gap_twins(P: dict, status: dict, G: dict, ids: tuple[str, str], segmod: dict, floor: float = 0.4) -> dict:
    """An added (or removed) function may have been on the other side all along, as code the
    disassembler never reached there. Compare its masked bytes with every other-side gap of
    16+ bytes in the same module and of similar size (0.7x to 1.6x+32); report the best at
    `floor` or above as "<gap addr>+<bytes> <similarity>". A lead, not proof: read both."""
    cands = []
    for k in ids:
        o = ids[1] if k == ids[0] else ids[0]
        p, q = P[k], P[o]
        for f in p.funcs.values():
            if status[k][f.start][0] not in ("added", "removed") or f.size < 24:
                continue  # tiny functions resemble any short run of code
            a = masked(p, f.start, f.size)
            for g in G[o]:
                if g["bytes"] < 16 or g["kind"] in ("zero", "jumptable", "eh-table") or g["module"] != segmod[k][f.seg]:
                    continue
                if not (0.7 * len(a) <= g["bytes"] <= 1.6 * len(a) + 32):
                    continue
                r = SequenceMatcher(None, a, masked(q, g["lin"], g["bytes"]), autojunk=False).ratio()
                if r >= floor:
                    cands.append((r, k, f.start, o, g))
    out, used = {}, set()
    for r, k, start, o, g in sorted(cands, key=lambda c: -c[0]):  # each gap pairs once, best first
        if (k, start) in out or (o, g["lin"]) in used:
            continue
        out[(k, start)] = f"{g['addr']}+{g['bytes']} {r:.2f}"
        used.add((o, g["lin"]))
    return out


STATUSES = ["identical", "relocated", "calls-differ", "data-moved", "constants", "changed", "removed", "added"]

if __name__ == "__main__":
    main()
