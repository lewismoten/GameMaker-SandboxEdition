"""Per-pair reports: function match table plus header, data, string, embedded-blob and
DOS-service ("import") differences. Small text goes to the committed output folder; full
listings and per-function diffs go to the work folder only.
"""

from __future__ import annotations

import difflib
import re
from collections import Counter
from pathlib import Path

from . import collect, mz as mzlib

ADDRESSY = re.compile(
    r"(\(?\d{3}\)?[-. ]\d{3}[-.]\d{4}|P\.? ?O\.? ?Box|\bBox \d+|\b\d{2,5} [A-Z][a-z]+ (St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Lane|Ln|Ct|Court|Way|Pike|Hwy)\b|\b[A-Z]{2},? \d{5}\b)",
    re.I,
)


def redact(s: str) -> str:
    """Committed reports never carry a street address or phone number found in a binary."""
    return "[redacted: address or phone]" if ADDRESSY.search(s) else s


def cell(s: str, n: int = 60) -> str:
    s = redact(s).replace("\t", " ").replace("\n", "\\n").replace("\r", "\\r").replace("|", "\\|")
    return s if len(s) <= n else s[: n - 1] + "…"


_REFS: dict[int, Counter] = {}


def hint(f) -> str:
    """The function's rarest referenced string: a common one is often a coincidence (an
    immediate such as 0x3DA, the VGA status port, that equals a string's offset)."""
    if not f.strings:
        return ""
    refs = _REFS.get(id(f), Counter())
    return min(f.strings, key=lambda s: (refs.get(s, 0), f.strings.index(s)))


def index_strings(prog) -> None:
    c = Counter(s for f in prog.funcs.values() for s in set(f.strings))
    for f in prog.funcs.values():
        _REFS[id(f)] = c


def confidence(m) -> str:
    if m.method in ("bytes", "norm", "strings", "shape"):
        return "high"
    return "medium" if m.sim >= 0.7 else "low"


def function_rows(matches, removed, added) -> list[list[str]]:
    rows = []
    for m in matches:
        rows.append(
            [
                m.status, m.a.addr, f"{m.a.start:05X}", str(m.a.size), m.b.addr, f"{m.b.start:05X}", str(m.b.size),
                f"{m.sim:.3f}", m.method, confidence(m), m.b.name or m.a.name, cell(hint(m.b) or hint(m.a), 50),
            ]
        )
    for f in removed:
        rows.append(["removed", f.addr, f"{f.start:05X}", str(f.size), "", "", "", "", "", "", f.name, cell(hint(f), 50)])
    for f in added:
        rows.append(["added", "", "", "", f.addr, f"{f.start:05X}", str(f.size), "", "", "", f.name, cell(hint(f), 50)])
    return rows


FN_HEADER = ["status", "old_addr", "old_lin", "old_size", "new_addr", "new_lin", "new_size", "norm_sim", "method", "confidence", "name", "string_hint"]


def write_tsv(path: Path, header: list[str], rows: list[list[str]]) -> None:
    path.write_text("\t".join(header) + "\n" + "".join("\t".join(r) + "\n" for r in rows))


# --- non-code differences -------------------------------------------------------------------

def header_rows(ca: dict, cb: dict) -> list[tuple[str, str, str]]:
    keys = ["file_size", "image_size", "header_bytes", "relocations", "entry_cs_ip", "stack_ss_sp", "min_max_alloc_paras", "overlay_bytes", "header_0x1c", "linker", "compiler", "version_string", "stamp_slot", "packer"]
    return [(k, str(ca.get(k, "")), str(cb.get(k, ""))) for k in keys]


def layout_rows(pa, pb) -> list[tuple[str, str, str]]:
    def cov(p):
        return sum(f.size for f in p.funcs.values())

    return [
        ("DGROUP paragraph", f"{pa.dgroup:04X}", f"{pb.dgroup:04X}"),
        ("code region bytes (before DGROUP)", str(pa.code_end), str(pb.code_end)),
        ("code segments referenced by relocations", str(len(pa.code_segs)), str(len(pb.code_segs))),
        ("functions found", str(len(pa.funcs)), str(len(pb.funcs))),
        ("bytes inside functions", str(cov(pa)), str(cov(pb))),
        ("code-region bytes outside functions (far data, tables, padding, missed code)", str(pa.code_end - cov(pa)), str(pb.code_end - cov(pb))),
        ("data bytes from DGROUP to image end", str(len(pa.image) - pa.code_end), str(len(pb.image) - pb.code_end)),
    ]


def counter_diff(ca: Counter, cb: Counter) -> list[tuple[str, int, int]]:
    keys = sorted(set(ca) | set(cb))
    return [(k, ca.get(k, 0), cb.get(k, 0)) for k in keys if ca.get(k, 0) != cb.get(k, 0)]


def services(p) -> Counter:
    return Counter(s for f in p.funcs.values() for s in f.services)


def ports(p) -> Counter:
    return Counter(s for f in p.funcs.values() for s in f.ports)


TEXTY = re.compile(r"[A-Za-z]{3}|%[-0-9.]*[sdlxuc]")
TEXT_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:;!?'\"()%-/\\*=+<>[]_#@&$")


def texty(s: str) -> bool:
    """Keep words and format strings; drop printable-looking runs of machine code."""
    t = s.strip()
    return bool(TEXTY.search(t)) and sum(c in TEXT_CHARS for c in t) >= 0.85 * len(t)


def string_diff(pa, pb) -> tuple[list[str], list[str]]:
    sa = Counter(s for _, s in pa.image_strings() if texty(s))
    sb = Counter(s for _, s in pb.image_strings() if texty(s))
    removed = sorted((sa - sb).elements())
    added = sorted((sb - sa).elements())
    return removed, added


def _data_tokens(p) -> list[tuple[int, bytes]]:
    """Split DGROUP-to-end into tokens (cut after NUL runs and at content-defined points),
    with relocated words zeroed."""
    img = bytearray(p.image)
    for r in p.relocs:
        if r >= p.code_end:
            img[r : r + 2] = b"\0\0"
    out, start, i, n = [], p.code_end, p.code_end, len(img)
    while i < n:
        if img[i] == 0:  # a token ends at its NUL, and a run of NULs joins it
            while i + 1 < n and img[i + 1] == 0:
                i += 1
            out.append((start, bytes(img[start : i + 1])))
            start = i + 1
        elif i - start >= 127 or (i > start and (img[i - 1] * 131 + img[i]) & 31 == 0):
            # content-defined cut: the same bytes cut the same way however far they moved
            out.append((start, bytes(img[start : i + 1])))
            start = i + 1
        i += 1
    if start < n:
        out.append((start, bytes(img[start:])))
    return out


def data_diff(pa, pb) -> tuple[dict, list[tuple]]:
    ta, tb = _data_tokens(pa), _data_tokens(pb)
    sm = difflib.SequenceMatcher(None, [t for _, t in ta], [t for _, t in tb], autojunk=False)
    stats = Counter()
    regions = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            stats["equal_bytes"] += sum(len(t) for _, t in ta[i1:i2])
            continue
        old = b"".join(t for _, t in ta[i1:i2])
        new = b"".join(t for _, t in tb[j1:j2])
        stats[tag] += 1
        stats["old_bytes_changed"] += len(old)
        stats["new_bytes_changed"] += len(new)
        oa = ta[i1][0] - pa.code_end if i1 < len(ta) else len(pa.image) - pa.code_end
        ob = tb[j1][0] - pb.code_end if j1 < len(tb) else len(pb.image) - pb.code_end
        regions.append((tag, oa, len(old), ob, len(new), _preview(old), _preview(new)))
    return dict(stats), regions


def _preview(b: bytes) -> str:
    from . import disasm
    if not b:
        return ""
    printable = sum(1 for x in b if x in disasm.PRINTABLE or x == 0)
    if printable / len(b) > 0.8:
        return "(text: see the strings section)"
    return b[:12].hex(" ") + (" …" if len(b) > 12 else "")


# --- writers -------------------------------------------------------------------------------

def write_pair(out: Path, work: Path, old_id: str, new_id: str, ca: dict, cb: dict, pa, pb, matches, removed, added, counts, why: str) -> dict:
    from . import disasm
    out.mkdir(parents=True, exist_ok=True)
    index_strings(pa)
    index_strings(pb)
    rows = function_rows(matches, removed, added)
    write_tsv(out / "functions.tsv", FN_HEADER, rows)
    status = Counter(m.status for m in matches)
    summary = {
        "old": old_id, "new": new_id, "why": why,
        "old_funcs": len(pa.funcs), "new_funcs": len(pb.funcs),
        **{k: status.get(k, 0) for k in ("identical", "relocated", "calls-differ", "data-moved", "constants", "changed")},
        "removed": len(removed), "added": len(added),
        "low_confidence": sum(1 for m in matches if confidence(m) == "low"),
    }
    L = [f"# {old_id} → {new_id}", "", f"Why this pair: {why}.", ""]
    L += [f"Old: `{collect.public_source(ca)}` (sha256 `{ca['file_sha256'][:16]}…`)", f"New: `{collect.public_source(cb)}` (sha256 `{cb['file_sha256'][:16]}…`)", ""]
    L += ["## Functions", "", "| status | count |", "| --- | --- |"]
    for k in ("identical", "relocated", "calls-differ", "data-moved", "constants", "changed", "removed", "added"):
        L.append(f"| {k} | {summary[k]} |")
    L += ["", f"Matched {len(matches)} of {len(pa.funcs)} old and {len(pb.funcs)} new functions; {summary['low_confidence']} matches are low confidence (call-graph or order matches under 0.7 similarity).", ""]
    L += ["Matched by stage: " + ", ".join(f"{k} {v}" for k, v in counts.items()) + ".", ""]
    L += [
        "Statuses: *identical* = same bytes with relocations masked and the same matched callees; *relocated* = same code once addresses, segments and string pointers are abstracted; *calls-differ* = same code but calling different (or unmatched) functions; *data-moved* = same instruction shape, and every differing immediate moved by an offset shift that at least three matched functions share (the data layout moved); *constants* = same instruction shape with other immediates or strings; *changed* = instructions differ (norm_sim is the share of matching normalized instructions). Full table: `functions.tsv`. The string hint is the rarest string the function appears to point at; an immediate can equal a string offset by coincidence.",
        "",
    ]
    changed = sorted((m for m in matches if m.status in ("changed", "constants", "calls-differ", "data-moved")), key=lambda m: (m.sim, -m.b.size))
    if changed:
        L += ["### Changed functions (least similar first, up to 60)", "", "| old | new | sizes | sim | method | name | string hint |", "| --- | --- | --- | --- | --- | --- | --- |"]
        for m in changed[:60]:
            L.append(f"| {m.a.addr} | {m.b.addr} | {m.a.size}→{m.b.size} | {m.sim:.2f} {m.status} | {m.method} | {m.b.name or m.a.name} | {cell(hint(m.b) or hint(m.a), 40)} |")
        L.append("")
    for title, fs in (("Removed functions (old only)", removed), ("Added functions (new only)", added)):
        if fs:
            L += [f"### {title} ({len(fs)}, largest first, up to 60)", "", "| addr | size | name | string hint |", "| --- | --- | --- | --- |"]
            for f in sorted(fs, key=lambda f: -f.size)[:60]:
                L.append(f"| {f.addr} | {f.size} | {f.name} | {cell(hint(f), 40)} |")
            L.append("")
    L += ["## Header and layout", "", "| field | old | new |", "| --- | --- | --- |"]
    for k, a, b in header_rows(ca, cb) + layout_rows(pa, pb):
        mark = "" if a == b else " **≠**"
        L.append(f"| {k} | {cell(a, 70)} | {cell(b, 70)}{mark} |")
    L += ["", "MZ has no linker timestamp, import table or resource section. The closest analogues follow: DOS and BIOS services called, I/O ports touched, and recognizable embedded files.", ""]
    for title, ca_, cb_ in (("DOS/BIOS services (int, with AH when set just before)", services(pa), services(pb)), ("I/O ports (in/out)", ports(pa), ports(pb))):
        d = counter_diff(ca_, cb_)
        L += [f"## {title}", ""]
        if d:
            L += ["| service | old uses | new uses |", "| --- | --- | --- |"] + [f"| {k} | {x} | {y} |" for k, x, y in d]
        else:
            L.append(f"No difference ({sum(ca_.values())} uses in each).")
        L.append("")
    ea, eb = disasm.embedded_blobs(pa.image), disasm.embedded_blobs(pb.image)
    L += ["## Embedded files", "", f"Old: {', '.join(f'{w} at {o:05X}' for o, w in ea) or 'none found'}.", f"New: {', '.join(f'{w} at {o:05X}' for o, w in eb) or 'none found'}.", ""]
    stats, regions = data_diff(pa, pb)
    L += ["## Data (DGROUP to end of image, relocations masked, aligned on NUL-ended and content-defined runs)", ""]
    L.append(", ".join(f"{k} {v}" for k, v in sorted(stats.items())) or "identical")
    L.append("")
    if regions:
        L += ["| kind | old offset | old bytes | new offset | new bytes | old preview | new preview |", "| --- | --- | --- | --- | --- | --- | --- |"]
        for r in regions[:80]:
            L.append(f"| {r[0]} | {r[1]:05X} | {r[2]} | {r[3]:05X} | {r[4]} | {r[5]} | {r[6]} |")
        if len(regions) > 80:
            L.append(f"| … | | | | | {len(regions) - 80} more regions | |")
        L.append("")
    rem, add = string_diff(pa, pb)
    L += ["## Strings (text-like printable runs of 4+ bytes in the whole image, owner stamp masked)", "", f"{len(rem)} only in old, {len(add)} only in new (a multiset difference, so a repeated string can appear once). Runs that look like machine code (no three letters in a row or a format specifier) are left out. Addresses and phone numbers are redacted.", ""]
    for title, ss in (("Only in old", rem), ("Only in new", add)):
        if ss:
            L += [f"### {title} (up to 150)", "", "```text"] + [cell(s, 100) for s in ss[:150]] + ["```", ""]
    (out / "summary.md").write_text("\n".join(L))
    # work-only artifacts: per-function normalized diffs
    dd = work / "pairs" / f"{old_id}__{new_id}"
    dd.mkdir(parents=True, exist_ok=True)
    for m in changed:
        a = [f"{i.norm}" for i in m.a.insns]
        b = [f"{i.norm}" for i in m.b.insns]
        txt = "\n".join(difflib.unified_diff(a, b, f"{old_id} {m.a.addr}", f"{new_id} {m.b.addr}", lineterm="", n=2))
        (dd / f"{m.a.start:05X}_{m.b.start:05X}.diff").write_text(txt + "\n")
    return summary
