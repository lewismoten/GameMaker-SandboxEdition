"""Find every Game-Maker player copy in the given roots, unpack it if needed, and file it by build.

Roots may hold loose .EXE files or zips (nested zips are opened one level deep). Nothing is
run; files are only read. Copies are cached under <work>/bin/ so later stages never touch the
reference folders again. Owner stamps are described, never printed.
"""

from __future__ import annotations

import io
import json
import os
import re
import shutil
import subprocess
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

from . import mz as mzlib

MIN_SIZE = 40_000  # every player is far larger; skips launchers and utilities quickly
PLAYER_MARKERS = (b"Choose object to drop",)  # in every player build, not in the editors


def _iter_files(root: Path):
    """Yield (display_path, bytes, dos_datetime, archive_metadata) for each input."""
    paths = [root] if root.is_file() else sorted(p for p in root.rglob("*") if p.is_file())
    for p in paths:
        if any(part in ("node_modules", ".git", ".stversions") for part in p.parts):
            continue
        name = p.name.lower()
        if name.endswith(".zip"):
            try:
                with zipfile.ZipFile(p) as z:
                    metadata = {"archive_name": p.name, "archive_sha256": mzlib.sha256(p.read_bytes())}
                    yield from _iter_zip(z, str(p), path=p, metadata=metadata)
            except (zipfile.BadZipFile, OSError):
                continue
        elif p.stat().st_size >= MIN_SIZE:
            with open(p, "rb") as f:
                head = f.read(2)
            if head in (b"MZ", b"ZM"):
                yield str(p), p.read_bytes(), None, {}


def _read_member(z: zipfile.ZipFile, info: zipfile.ZipInfo, path: Path | None) -> bytes | None:
    """zipfile cannot read PKZIP 1.x Implode/Shrink members; Info-ZIP's unzip can."""
    try:
        return z.read(info)
    except (NotImplementedError, RuntimeError, zipfile.BadZipFile):
        pass
    if shutil.which("unzip") is None:
        return None
    with tempfile.TemporaryDirectory() as td:
        src = path
        if src is None:  # a nested zip: write it out first
            src = Path(td, "inner.zip")
            src.write_bytes(z.fp.getvalue() if hasattr(z.fp, "getvalue") else b"")  # type: ignore[union-attr]
        r = subprocess.run(["unzip", "-p", "-C", str(src), _glob_escape(info.filename)], capture_output=True)
        return r.stdout if r.returncode == 0 and len(r.stdout) == info.file_size else None


def _glob_escape(name: str) -> str:
    return re.sub(r"([\\[\]*?])", r"\\\1", name)


def _iter_zip(z: zipfile.ZipFile, label: str, depth: int = 0, path: Path | None = None, metadata: dict | None = None, members: tuple[str, ...] = ()):
    for info in z.infolist():
        if info.is_dir() or info.file_size < 2:
            continue
        lname = info.filename.lower()
        try:
            when = datetime(*info.date_time).isoformat(sep=" ")
        except ValueError:
            when = "invalid DOS date " + "-".join(map(str, info.date_time))
        if lname.endswith(".zip") and depth == 0:
            blob = _read_member(z, info, path)
            if blob is None:
                continue
            try:
                with zipfile.ZipFile(io.BytesIO(blob)) as inner:
                    yield from _iter_zip(inner, f"{label}!{info.filename}", depth + 1,
                                         metadata=metadata, members=members + (info.filename,))
            except (zipfile.BadZipFile, NotImplementedError, RuntimeError):
                pass
            continue
        if info.file_size < MIN_SIZE:
            continue
        data = _read_member(z, info, path)
        if data is None:
            continue
        if data[:2] in (b"MZ", b"ZM"):
            yield f"{label}!{info.filename}", data, when, {**(metadata or {}), "source_members": list(members + (info.filename,))}


def find_deark(explicit: str | None) -> str | None:
    for cand in (explicit, os.environ.get("DEARK"), shutil.which("deark")):
        if cand and Path(cand).is_file():
            return cand
    return None


def unpack(raw: bytes, deark: str | None) -> tuple[bytes | None, str]:
    """Decompress a packed EXE with Deark (-opt execomp). Returns (bytes or None, note)."""
    if not deark:
        return None, "not unpacked: Deark not found (set --deark or $DEARK)"
    with tempfile.TemporaryDirectory() as td:
        src = Path(td, "in.exe")
        src.write_bytes(raw)
        r = subprocess.run(
            [deark, "-q", "-opt", "execomp", "-od", td, "-o", "out", str(src)],
            capture_output=True,
            text=True,
        )
        outs = sorted(Path(td).glob("out.*.exe"))
        if not outs:
            return None, f"Deark could not unpack ({r.stderr.strip()[:80] or 'no output'})"
        return outs[0].read_bytes(), "unpacked with Deark -opt execomp"


def describe(raw: bytes) -> dict:
    m = mzlib.parse(raw)
    vs = re.findall(rb"Version (\d+\.\d+[a-z]?)", m.image)
    return {
        "file_size": len(raw),
        "file_sha256": mzlib.sha256(raw),
        "header_bytes": m.header_bytes,
        "image_size": len(m.image),
        "image_sha256": mzlib.sha256(m.image),
        "masked_sha256": mzlib.sha256(mzlib.mask_stamp(m.image)),
        "overlay_bytes": len(m.overlay),
        "relocations": len(m.relocs),
        "entry_cs_ip": f"{m.cs:04X}:{m.ip:04X}",
        "stack_ss_sp": f"{m.ss:04X}:{m.sp:04X}",
        "min_max_alloc_paras": f"{m.min_alloc}/{m.max_alloc}",
        "header_0x1c": m.header_extra.hex(),
        "linker": mzlib.linker_mark(m),
        "compiler": mzlib.compiler_banner(m.image) or "",
        "version_string": vs[0].decode() if vs else "",
        "stamp_slot": mzlib.stamp_slot(m.image),
    }


def collect(roots: list[Path], builds: list[dict], work: Path, deark: str | None, rel_to: dict[str, str]) -> list[dict]:
    by_size = {b["image_size"]: b for b in builds}
    copies: list[dict] = []
    bindir = work / "bin"
    for root in roots:
        if not root.exists():
            print(f"  (skipped, missing) {root}")
            continue
        for path, raw, when, metadata in _iter_files(root):
            try:
                m = mzlib.parse(raw)
            except mzlib.NotMZ:
                continue
            packer = mzlib.detect_packer(m)
            rec = {"source": _display(path, rel_to), "member_date": when or "", "packer": packer or "", **metadata}
            body, note = raw, ""
            if packer:
                rec["packed_size"] = len(raw)
                rec["packed_sha256"] = mzlib.sha256(raw)
                body, note = unpack(raw, deark)
                if body is None:
                    rec.update(build="", note=note, player="unknown (packed)")
                    copies.append(rec)
                    continue
            try:
                info = describe(body)
            except mzlib.NotMZ:
                continue
            image = mzlib.parse(body).image
            build = by_size.get(info["image_size"])
            is_player = mzlib.compiler_banner(image) is not None and any(k in image for k in PLAYER_MARKERS)
            if not build and not is_player:
                continue
            rec.update(info)
            rec["build"] = build["id"] if build else ""
            rec["player"] = "yes" if is_player else "by size only (menu text edited)"
            rec["note"] = note
            dest = bindir / (rec["build"] or "unknown") / f"{info['file_sha256'][:16]}.exe"
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                dest.write_bytes(body)
            rec["cached"] = str(dest.relative_to(work))
            copies.append(rec)
    return copies


def _display(path: str, rel_to: dict[str, str]) -> str:
    for prefix, label in rel_to.items():
        if path.startswith(prefix):
            return label + path[len(prefix):]
    return path


def public_source(record: dict) -> str:
    """Serialize provenance, never an operator's local directory hierarchy.

    Identical archives in different folders intentionally share a label. Different
    archives with the same basename are distinguished by their full content hash.
    Nested member names are escaped independently, so delimiters cannot collide.
    """
    source = record["source"]
    if source.startswith(("cd/gm/", "runtime/run/GM/")) and ".." not in Path(source).parts:
        return source
    outer, *legacy_members = source.split("!")
    members = record.get("source_members", legacy_members)
    if members and record.get("archive_sha256"):
        name = record.get("archive_name", Path(outer).name)
        return "archive:" + quote(name, safe="") + "@" + record["archive_sha256"] + "!" + "!".join(quote(m, safe="") for m in members)
    digest = record.get("file_sha256") or record.get("packed_sha256")
    if not digest:
        raise ValueError("public provenance requires an input checksum")
    return f"build:{record.get('build') or 'unknown'}@sha256:{digest}"


def choose_canonical(copies: list[dict], builds: list[dict]) -> dict[str, dict]:
    """Pick one copy per build: the preferred repository file, else the largest group of
    copies that are identical once the owner stamp is masked."""
    canon: dict[str, dict] = {}
    for b in builds:
        mine = [c for c in copies if c.get("build") == b["id"] and not c.get("packer")]
        if not mine:
            continue
        pick = None
        if b.get("prefer"):
            pick = next((c for c in mine if c["source"].endswith(b["prefer"])), None)
        if pick is None:
            groups: dict[str, list[dict]] = {}
            for c in mine:
                groups.setdefault(c["masked_sha256"], []).append(c)
            best = max(groups.values(), key=lambda g: (len(g), -min(len(c["source"]) for c in g)))
            pick = sorted(best, key=lambda c: (not c["source"].lower().endswith(".exe"), c["stamp_slot"] != "blank placeholder", c["source"]))[0]
        canon[b["id"]] = pick
    for c in copies:
        k = canon.get(c.get("build", ""))
        if not k:
            c["relation"] = "no canonical copy" if c.get("build") else "unrecognized build"
        elif c is k:
            c["relation"] = "canonical"
        elif c["image_sha256"] == k["image_sha256"]:
            c["relation"] = "identical image"
        elif c["masked_sha256"] == k["masked_sha256"]:
            c["relation"] = "identical except owner stamp"
        else:
            c["relation"] = f"edited: {_diff_bytes(c, k)}"
    return canon


def _diff_bytes(a: dict, b: dict) -> str:
    # Both are cached under the same work dir; compare masked images byte by byte.
    work = Path(os.environ["GMPD_WORK"])
    ia = mzlib.mask_stamp(mzlib.parse((work / a["cached"]).read_bytes()).image)
    ib = mzlib.mask_stamp(mzlib.parse((work / b["cached"]).read_bytes()).image)
    if len(ia) != len(ib):
        return f"image size {len(ia)} vs {len(ib)}"
    n = sum(1 for x, y in zip(ia, ib) if x != y)
    return f"{n} bytes differ from canonical (stamp masked), group {a['masked_sha256'][:8]}"


def save(copies: list[dict], work: Path) -> None:
    (work / "copies.json").write_text(json.dumps(copies, indent=1))
