"""Borland TLINK .MAP reader, and a guarded way to put its public names on a binary.

The MAP files in code/GM come from the 2014 source release and do not describe the CD's
executables byte for byte (segment sizes differ). So names are only applied per code frame
when most of that frame's public offsets land exactly on discovered function starts in one
binary segment; everything else stays unnamed rather than guessed.
"""

from __future__ import annotations

import re
from pathlib import Path

# The name runs to the end of the line: C++ publics keep their argument lists, which may
# contain spaces ("movewindow(unsigned char)").
PUB = re.compile(r"^\s*([0-9A-F]{4}):([0-9A-F]{4})\s+(?:(idle|Abs)\s+)?(\S.*?)\s*$")
SEG = re.compile(r"^\s*([0-9A-F]{5})H\s+([0-9A-F]{5})H\s+([0-9A-F]{5})H\s+(\S+)\s+(\S+)\s*$")


def read_map(path: Path) -> tuple[list[dict], list[tuple[int, int, str]]]:
    text = path.read_text(encoding="latin-1").replace("\r", "")
    segs, pubs, in_pubs = [], [], False
    for line in text.split("\n"):
        if "Publics by Value" in line:
            in_pubs = True
            continue
        if "Publics by Name" in line or "Program entry point" in line:
            in_pubs = False
            continue
        m = SEG.match(line)
        if m and not in_pubs:
            segs.append(
                {"start": int(m[1], 16), "length": int(m[3], 16), "name": m[4], "class": m[5]}
            )
            continue
        if in_pubs:
            m = PUB.match(line)
            if m and m[3] != "Abs":
                pubs.append((int(m[1], 16), int(m[2], 16), m[4]))
    return segs, pubs


def apply_names(prog, map_path: Path, min_share: float = 0.6) -> dict:
    """Name functions in `prog` (a disasm.Program) from the MAP; returns a summary."""
    segs, pubs = read_map(map_path)
    code_limit = max((s["start"] + s["length"] for s in segs if s["class"] == "CODE"), default=0)
    frames: dict[int, list[tuple[int, str]]] = {}
    for fs, fo, name in pubs:
        if fs * 16 + fo < code_limit:
            frames.setdefault(fs, []).append((fo, name))
    starts = set(prog.funcs)
    summary = {"map": str(map_path), "frames": len(frames), "frames_applied": 0, "named": 0, "publics": 0, "rows": []}
    for fs, items in sorted(frames.items()):
        summary["publics"] += len(items)
        best, best_hits = None, 0
        for bs in prog.code_segs:
            hits = sum(1 for fo, _ in items if bs * 16 + fo in starts)
            if hits > best_hits:
                best, best_hits = bs, hits
        share = best_hits / len(items)
        applied = best is not None and share >= min_share and best_hits >= 3
        summary["rows"].append((f"{fs:04X}", f"{best:04X}" if best is not None else "-", len(items), best_hits, applied))
        if not applied:
            continue
        summary["frames_applied"] += 1
        for fo, name in items:
            f = prog.funcs.get(best * 16 + fo)
            if f and not f.name:
                f.name, f.name_source = name, "map"
                summary["named"] += 1
    return summary
