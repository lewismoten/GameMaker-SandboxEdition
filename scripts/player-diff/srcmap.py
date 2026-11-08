# /// script
# requires-python = ">=3.11"
# ///
"""Attribute one module's functions to source functions, for both builds of a pair.

attribute.py says which module a function lives in; for a module whose source exists in
two revisions (code/GM/PLAYGAME.BAK, an early-1994 PLAYGAME.C, and PLAYGAME.C, the 3.0 one)
this says which source function each binary function is, and whether that function's
source changed between the revisions:

    python3 scripts/player-diff/srcmap.py docs/analysis/player-diff-3.0/functions.tsv \\
        --module PLAYGAME_TEXT --old 2.04 code/GM/PLAYGAME.BAK --new 3.00-xfer code/GM/PLAYGAME.C \\
        --out docs/analysis/player-diff-3.0/playgame-source.tsv

Method. Borland C++ emits a module's functions in definition order, so: (1) anchors are
binary functions whose referenced strings point at one source function's literals more
than any other's, or whose MAP name equals a source function's name; (2) the anchors that
keep address order and source order together (a longest increasing subsequence) are kept;
(3) between two anchors, binary and source functions pair one to one when their counts are
equal, else the binary functions are listed with the candidate source names. A function
defined inside a class body is emitted elsewhere, so counts can differ; out-of-line copies
of such inline members are why "one of" rows appear. Leads, not proof: check the listing.

The source-change column compares the two revisions' bodies of the attributed function
with comments and whitespace removed: "same", "+a/-b" (lines added/removed), "new" (only in
the new revision) or "?" (attribution ambiguous). Same source with changed machine code
points at the compiler, a header (struct layout, a macro) or another build.
"""

from __future__ import annotations

import argparse
import bisect
import csv
import difflib
import itertools
import re
from pathlib import Path

DEF = re.compile(r"^[A-Za-z_][A-Za-z0-9_ \*&:<>]*[ \*&]([A-Za-z_][A-Za-z0-9_:~]*)\s*\([^;]*$")
NOT_DEF = re.compile(r"^(if|while|for|switch|return|else|typedef|extern)\b")
LIT = re.compile(r'"((?:[^"\\\n]|\\.)*)"')


def src_funcs(path: Path) -> list[dict]:
    """Top-level function definitions in file order: name, line, literals, normalized body."""
    lines = path.read_text(encoding="latin-1").replace("\r", "").split("\n")
    defs = [(i, DEF.match(ln).group(1)) for i, ln in enumerate(lines) if DEF.match(ln) and not NOT_DEF.match(ln)]
    out = []
    for k, (i, name) in enumerate(defs):
        j = defs[k + 1][0] if k + 1 < len(defs) else len(lines)
        text = re.sub(r"//[^\n]*", "", "\n".join(lines[i:j]))
        text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
        lits = {m.group(1).encode("latin-1").decode("unicode_escape", errors="ignore").strip() for m in LIT.finditer(text)}
        body = [re.sub(r"\s+", "", ln) for ln in text.split("\n")]
        out.append({"name": name, "line": i + 1, "lits": {x for x in lits if len(x) >= 3}, "body": [b for b in body if b]})
    return out


def bin_funcs(rows: list[dict], side: str, module: str) -> list[dict]:
    out = [dict(r) for r in rows if r["side"] == side and r["module"] == module]
    for r in out:
        r["strs"] = {s.strip().replace("\\|", "|").rstrip("…") for s in r["strings"].split(" \\| ") if s.strip()}
    return out


def attribute(src: list[dict], bins: list[dict], fixed: dict[str, int] | None = None) -> None:
    """Fill b["src"] and b["how"] for every binary function. `fixed` maps an address to a
    source index known from the other build (a matched partner's attribution)."""
    fixed = fixed or {}
    for b in bins:
        best, score, tie = None, 0, False
        for k, s in enumerate(src):
            n = sum(1 for x in b["strs"] if x and any(lit.startswith(x) for lit in s["lits"]))
            if n > score:
                best, score, tie = k, n, False
            elif n == score and n:
                tie = True
        b["anchor"], b["how"] = (best, f"strings({score})") if score and not tie else (None, "")
        name = b["name"].split("(")[0].lstrip("_").lower()
        hits = [k for k, s in enumerate(src) if s["name"].lower() == name]
        if name and len(hits) == 1:
            b["anchor"], b["how"] = hits[0], "mapname"
        if b["anchor"] is None and b["addr"] in fixed:
            b["anchor"], b["how"] = fixed[b["addr"]], "partner"
    # keep the anchors that agree on order (longest increasing subsequence)
    idx = [(i, b["anchor"]) for i, b in enumerate(bins) if b["anchor"] is not None]
    tails: list[tuple[int, int]] = []
    prev: dict[int, int | None] = {}
    for i, a in idx:
        p = bisect.bisect_left([t[1] for t in tails], a)
        if p == len(tails):
            tails.append((i, a))
        else:
            tails[p] = (i, a)
        prev[i] = tails[p - 1][0] if p else None
    keep, cur = set(), (tails[-1][0] if tails else None)
    while cur is not None:
        keep.add(cur)
        cur = prev[cur]
    for i, b in enumerate(bins):
        if i not in keep:
            b["anchor"], b["how"] = None, ""
    anchors = [(-1, -1)] + [(i, b["anchor"]) for i, b in enumerate(bins) if b["anchor"] is not None] + [(len(bins), len(src))]
    for (i0, s0), (i1, s1) in itertools.pairwise(anchors):
        nb, ns = i1 - i0 - 1, s1 - s0 - 1
        for k in range(nb):
            b = bins[i0 + 1 + k]
            if nb == ns:
                b["src"], b["how"] = src[s0 + 1 + k]["name"], "order(1:1)"
            else:
                cands = [x["name"] for x in src[s0 + 1 : s1]]
                b["src"] = "one of: " + ", ".join(cands) if cands else ""
                b["how"] = f"order({nb} binary/{ns} source)"
    for b in bins:
        if b["anchor"] is not None:
            b["src"] = src[b["anchor"]]["name"]


def source_change(name: str, old: dict, new: dict) -> str:
    if not name or name.startswith("one of"):
        return "?"
    a, b = old.get(name), new.get(name)
    if b is None:
        return "?"
    if a is None:
        return "new"
    if a == b:
        return "same"
    d = [ln for ln in difflib.unified_diff(a, b, lineterm="", n=0) if ln[:1] in "+-" and ln[:3] not in ("+++", "---")]
    return f"+{sum(1 for x in d if x[0] == '+')}/-{sum(1 for x in d if x[0] == '-')}"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("functions", type=Path, help="functions.tsv written by attribute.py")
    ap.add_argument("--module", required=True)
    ap.add_argument("--old", nargs=2, required=True, metavar=("BUILD", "SOURCE"))
    ap.add_argument("--new", nargs=2, required=True, metavar=("BUILD", "SOURCE"))
    ap.add_argument("--out", type=Path, required=True)
    a = ap.parse_args()
    rows = list(csv.DictReader(a.functions.open(), delimiter="\t"))
    so, sn = src_funcs(Path(a.old[1])), src_funcs(Path(a.new[1]))
    bo, bn = bin_funcs(rows, a.old[0], a.module), bin_funcs(rows, a.new[0], a.module)
    attribute(so, bo)
    attribute(sn, bn)
    # second pass: a function attributed on one side anchors its matched partner on the other
    for this, other, src in ((bn, bo, sn), (bo, bn, so)):
        by = {b["addr"]: b for b in other}
        idx: dict[str, list[int]] = {}
        for k, x in enumerate(src):
            idx.setdefault(x["name"], []).append(k)
        fixed = {}
        for b in this:
            p = by.get(b["partner"]) if b["partner"] else None
            name = p.get("src", "") if p else ""
            if name and not name.startswith("one of") and len(idx.get(name, [])) == 1:
                fixed[b["addr"]] = idx[name][0]
        attribute(src, this, fixed)
    body_o = {}
    for s in so:
        body_o.setdefault(s["name"], s["body"])
    body_n = {}
    for s in sn:
        body_n.setdefault(s["name"], s["body"])
    by_new = {b["addr"]: b for b in bn}
    out = ["old\tnew\told_size\tnew_size\tstatus\tsim\told_source\told_how\tnew_source\tnew_how\tsource_change"]
    for b in bo:
        p = by_new.get(b["partner"]) if b["partner"] else None
        name = b.get("src", "")
        if (not name or name.startswith("one of")) and p is not None:
            name = p.get("src", "")
        out.append("\t".join([b["addr"], b["partner"], b["size"], p["size"] if p else "", b["status"], b["sim"], b.get("src", ""), b.get("how", ""), p.get("src", "") if p else "", p.get("how", "") if p else "", source_change(name, body_o, body_n) if p else ("gone" if name and name not in body_n else "?")]))
    for p in bn:
        if p["status"] == "added":
            out.append("\t".join(["", p["addr"], "", p["size"], "added", "", "", "", p.get("src", ""), p.get("how", ""), source_change(p.get("src", ""), body_o, body_n)]))
    a.out.write_text("\n".join(out) + "\n")
    print(f"wrote {a.out}: {len(bo)} {a.old[0]} and {len(bn)} {a.new[0]} functions in {a.module}")


if __name__ == "__main__":
    main()
