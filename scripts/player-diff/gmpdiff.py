#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["capstone==5.0.7"]
# ///
"""Game-Maker player machine-code diff: inventory, disassembly, function matching, reports.

  uv run scripts/player-diff/gmpdiff.py all          # inventory + every pair in builds.toml
  uv run scripts/player-diff/gmpdiff.py inventory    # only find and file the player copies
  uv run scripts/player-diff/gmpdiff.py diff [--pair OLD NEW]

See scripts/player-diff/README.md. Nothing is executed; binaries are only read.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import tomllib
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from gmpd import collect, mapfile, match, report  # noqa: E402

REPO = HERE.parent.parent


def load_config() -> dict:
    return tomllib.loads((HERE / "builds.toml").read_text())


def predecessors(cfg: dict) -> dict[str, str]:
    return {p["new"]: p["old"] for p in cfg["pair"] if not p["why"].startswith("control")}


# --- inventory ---------------------------------------------------------------------------------

def cmd_inventory(args, cfg) -> None:
    ref = args.reference
    roots = [REPO / "cd" / "gm", REPO / "runtime" / "run" / "GM"]
    labels = {str(REPO) + "/": ""}
    if ref:
        roots.append(ref / "reference" / "archive")
        labels[str(ref) + "/"] = "local-corpus/"
    else:
        print("warning: no optional archive corpus supplied; only repository players are available")
    deark = collect.find_deark(args.deark)
    print(f"scanning {len(roots)} roots; Deark: {deark or 'not found'}")
    copies = collect.collect(roots, cfg["build"], args.work, deark, labels)
    canon = collect.choose_canonical(copies, cfg["build"])
    collect.save(copies, args.work)
    (args.work / "canonical.json").write_text(json.dumps({k: v for k, v in canon.items()}, indent=1))
    write_inventory(args.out, cfg, copies, canon, deark, ref is not None)
    print(f"{len(copies)} player copies; canonical builds: {', '.join(canon)}")


def write_inventory(out: Path, cfg: dict, copies: list[dict], canon: dict, deark: str | None, have_ref: bool) -> None:
    copies = [{**c, "source": collect.public_source(c)} for c in copies]
    canon = {k: {**c, "source": collect.public_source(c)} for k, c in canon.items()}
    out.mkdir(parents=True, exist_ok=True)
    pred = predecessors(cfg)
    cols = ["build", "version", "lineage", "source", "member_date", "file_size", "file_sha256", "image_size", "image_sha256", "header_bytes", "relocations", "entry_cs_ip", "stack_ss_sp", "overlay_bytes", "linker", "compiler", "version_string", "packer", "stamp_slot", "predecessor"]
    rows = []
    for b in cfg["build"]:
        c = canon.get(b["id"])
        if not c:
            rows.append([b["id"], b["version"], b["lineage"], "MISSING"] + [""] * (len(cols) - 5) + [pred.get(b["id"], "")])
            continue
        rows.append([b["id"], b["version"], b["lineage"]] + [str(c.get(k, "")) for k in cols[3:-1]] + [pred.get(b["id"], "")])
    report.write_tsv(out / "inventory.tsv", cols, rows)
    ccols = ["build", "relation", "source", "member_date", "file_size", "file_sha256", "image_size", "masked_sha256", "packer", "packed_size", "version_string", "stamp_slot", "player", "note"]
    crow = [[str(c.get(k, "")) for k in ccols] for c in sorted(copies, key=lambda c: (c.get("build") or "~", c["source"]))]
    report.write_tsv(out / "copies.tsv", ccols, crow)

    L = ["# Game-Maker player binaries: inventory", ""]
    L += [
        "Written by `scripts/player-diff/gmpdiff.py inventory`; do not edit by hand. Binaries are read, never run, and never committed: the canonical copies live in the tool's work folder. Hashes are of the files as found (or as unpacked).",
        "",
        "A build is recognized by its MZ load-image size (`scripts/player-diff/builds.toml`). Copies of one build that differ only in the 52-byte owner slot at load-image offset 0 (`code/GM/REGSPACE.ASM`) count as the same build; the slot's contents are never printed. Every copy is listed in `copies.tsv`.",
        "",
        f"Sources scanned: `cd/gm/`, `runtime/run/GM/`{', and an optional local archive corpus (zips, nested zips one level deep)' if have_ref else ' (no optional archive corpus supplied)'}. Packed copies were unpacked with Deark{'' if deark else ' (not available on this run, so packed copies are listed but not compared)'}.",
        "",
        "## Builds",
        "",
        "| build | version | program | canonical copy | file bytes | image bytes | relocs | entry | sha256 (file) | copies | predecessor |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    for b in cfg["build"]:
        c = canon.get(b["id"])
        n = Counter(x["relation"].split(":")[0] for x in copies if x.get("build") == b["id"])
        ncopies = ", ".join(f"{v} {k}" for k, v in sorted(n.items()))
        prog = {"xfer": "stand-alone player (XFERPLAY)", "play": "editor's PLAYGAME"}[b["lineage"]]
        if not c:
            L.append(f"| {b['id']} | {b['version']} | {prog} | **missing** | | {b['image_size']} | | | | 0 | {pred.get(b['id'], '')} |")
            continue
        L.append(f"| {b['id']} | {b['version']} | {prog} | `{c['source']}` | {c['file_size']} | {c['image_size']} | {c['relocations']} | {c['entry_cs_ip']} | `{c['file_sha256'][:16]}…` | {ncopies} | {pred.get(b['id'], '—')} |")
    L += ["", "## Format details of each canonical copy", ""]
    L += ["| build | header bytes | stack SS:SP | min/max alloc (paras) | overlay bytes | linker mark | compiler banner | \"Version\" string | packer | owner slot | archive member date |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for b in cfg["build"]:
        c = canon.get(b["id"])
        if c:
            L.append(f"| {b['id']} | {c['header_bytes']} | {c['stack_ss_sp']} | {c['min_max_alloc_paras']} | {c['overlay_bytes']} | {c['linker']} | {c['compiler']} | {c['version_string']} | {c['packer'] or 'none'} | {c['stamp_slot']} | {c['member_date'] or '(repository file)'} |")
    L += [
        "",
        "Every build is a 16-bit DOS MZ executable. MZ has no linker timestamp field (that is a PE/COFF feature), so the table gives the archive member's DOS date where the copy came from a zip; it dates the copy, not necessarily the link. The linker mark is TLINK's byte pair at header offset 0x1E.",
        "",
        "## Comparison pairs",
        "",
        "| old | new | why |",
        "| --- | --- | --- |",
    ]
    for p in cfg["pair"]:
        ok = p["old"] in canon and p["new"] in canon
        L.append(f"| {p['old']} | {p['new']} | {p['why']}{'' if ok else ' — **cannot run: a build is missing**'} |")
    L += [
        "",
        "## What is missing",
        "",
        "- No player between 1.0 and 1.04 (1.01-1.03) and no 2.01 or 2.03 has been found, so 1.04 is compared with 1.0 and 2.02 with 2.00; each diff therefore covers every change since the previous build held, not necessarily one release.",
        "- 3.0's predecessor here is 2.04, the newest pre-3.0 player held (one game, Breakout: The Rescue). 2.04 is about 36 KB smaller than 2.02, so `2.02 → 3.00-xfer` is also reported as a control.",
        "- No Game-Maker editor package other than 1.00 and the 3.0 CD is held, so only the 1.00 and 3.00 PLAYGAME builds are available.",
    ]
    for b in cfg["build"]:
        if b["id"] not in canon:
            L.append(f"- **{b['id']}: no copy found in the scanned sources.**")
    other = [c for c in copies if not c.get("build")]
    if other:
        L += ["", "## Player copies of no known build", "", "| source | image bytes | Version string | note |", "| --- | --- | --- | --- |"]
        for c in other:
            L.append(f"| `{c['source']}` | {c.get('image_size', '')} | {c.get('version_string', '')} | {c.get('note') or c.get('player', '')} |")
    packed = [c for c in copies if c.get("packer")]
    if packed:
        L += ["", "## Packed copies", "", "| source | packer | packed bytes | unpacked to build | relation to canonical |", "| --- | --- | --- | --- | --- |"]
        for c in packed:
            L.append(f"| `{c['source']}` | {c['packer']} | {c.get('packed_size', '')} | {c.get('build') or '—'} | {c.get('relation', c.get('note', ''))} |")
    edited = [c for c in copies if c.get("relation", "").startswith("edited")]
    if edited:
        L += ["", "## Edited copies (bytes differ from the canonical copy beyond the owner slot)", "", "| build | source | difference |", "| --- | --- | --- |"]
        for c in edited:
            L.append(f"| {c['build']} | `{c['source']}` | {c['relation'].split(': ', 1)[1]} |")
    (out / "inventory.md").write_text("\n".join(L) + "\n")


# --- diff ------------------------------------------------------------------------------------

def cmd_diff(args, cfg) -> None:
    from gmpd import disasm
    canon = json.loads((args.work / "canonical.json").read_text())
    pairs = cfg["pair"]
    if args.pair:
        pairs = [p for p in pairs if (p["old"], p["new"]) == tuple(args.pair)] or [{"old": args.pair[0], "new": args.pair[1], "why": "requested"}]
    need = {x for p in pairs for x in (p["old"], p["new"])}
    progs = {}
    listing_dir = args.work / "listings"
    listing_dir.mkdir(parents=True, exist_ok=True)
    map_notes = []
    for b in cfg["build"]:
        if b["id"] not in need:
            continue
        if b["id"] not in canon:
            print(f"  {b['id']}: missing, pairs using it are skipped")
            continue
        t = time.time()
        p = disasm.analyze((args.work / canon[b["id"]]["cached"]).read_bytes())
        if b.get("map") and (REPO / b["map"]).exists():
            s = mapfile.apply_names(p, REPO / b["map"])
            map_notes.append((b["id"], s))
        progs[b["id"]] = p
        print(f"  {b['id']}: {len(p.funcs)} functions ({time.time() - t:.1f}s)")
    results = []
    for p in pairs:
        if p["old"] not in progs or p["new"] not in progs:
            continue
        m = match.Matcher(progs[p["old"]], progs[p["new"]])
        counts = m.run()
        ms, rem, add = m.results()
        for x in ms:
            if report.confidence(x) == "low":
                continue
            if x.b.name and not x.a.name:
                x.a.name, x.a.name_source = x.b.name, f"via {p['new']}"
            elif x.a.name and not x.b.name:
                x.b.name, x.b.name_source = x.a.name, f"via {p['old']}"
        results.append((p, ms, rem, add, counts))
    summaries = []
    for p, ms, rem, add, counts in results:
        d = args.out / "pairs" / f"{p['old']}__{p['new']}"
        s = report.write_pair(d, args.work, p["old"], p["new"], canon[p["old"]], canon[p["new"]], progs[p["old"]], progs[p["new"]], ms, rem, add, counts, p["why"])
        s["required"] = bool(p.get("required"))
        summaries.append(s)
        print(f"  {p['old']} -> {p['new']}: " + ", ".join(f"{k} {s[k]}" for k in ("identical", "relocated", "calls-differ", "data-moved", "constants", "changed", "removed", "added")))
    for bid, prog in progs.items():
        (listing_dir / f"{bid}.lst").write_text(prog.listing())
    if not args.pair:
        write_pair_index(args.out, summaries, map_notes)


def write_pair_index(out: Path, summaries: list[dict], map_notes) -> None:
    L = ["# Function-match summary for every pair", "", "Written by `scripts/player-diff/gmpdiff.py diff`. Counts are functions; see each pair's `summary.md` and `functions.tsv`.", ""]
    L += ["| pair | required | old fns | new fns | identical | relocated | calls-differ | data-moved | constants | changed | removed | added | low-confidence matches |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for s in summaries:
        link = f"[{s['old']} → {s['new']}](pairs/{s['old']}__{s['new']}/summary.md)"
        L.append(f"| {link} | {'yes' if s['required'] else ''} | {s['old_funcs']} | {s['new_funcs']} | {s['identical']} | {s['relocated']} | {s['calls-differ']} | {s['data-moved']} | {s['constants']} | {s['changed']} | {s['removed']} | {s['added']} | {s['low_confidence']} |")
    for bid, s in map_notes:
        L += ["", f"## Names from `{Path(s['map']).name}` on {bid}", ""]
        L.append(f"The MAP is from the 2014 source release and its segment sizes differ from the CD's {bid}, so names were applied only for code frames where at least 60% (and 3+) of the public offsets land on discovered function starts in one segment: {s['frames_applied']} of {s['frames']} frames, {s['named']} of {s['publics']} code publics. Names then spread to other builds through high- and medium-confidence matches.")
    (out / "pairs.md").write_text("\n".join(L) + "\n")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["inventory", "diff", "all"])
    ap.add_argument("--reference", type=Path, default=None, help="optional local corpus directory containing reference/archive/ (no automatic discovery)")
    ap.add_argument("--work", type=Path, default=Path(os.environ.get("GMPD_WORK", Path.home() / ".cache" / "gm-player-diff")), help="cache for binaries, listings, per-function diffs (never committed)")
    ap.add_argument("--out", type=Path, default=REPO / "docs" / "analysis" / "player-diff", help="committed text outputs")
    ap.add_argument("--deark", default=None, help="path to the deark binary (unpacks PKLITE/EXEPACK/LZEXE)")
    ap.add_argument("--pair", nargs=2, metavar=("OLD", "NEW"), help="diff only this pair (writes its folder, not pairs.md)")
    args = ap.parse_args()
    if args.reference:
        args.reference = args.reference.resolve()
        if not (args.reference / "reference" / "archive").is_dir():
            ap.error("--reference must contain a reference/archive directory")
    args.work.mkdir(parents=True, exist_ok=True)
    os.environ["GMPD_WORK"] = str(args.work)
    cfg = load_config()
    if args.command in ("inventory", "all"):
        cmd_inventory(args, cfg)
    if args.command in ("diff", "all"):
        cmd_diff(args, cfg)


if __name__ == "__main__":
    main()
