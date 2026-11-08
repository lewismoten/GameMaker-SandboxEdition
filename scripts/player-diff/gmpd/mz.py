"""DOS MZ executable parsing: header fields, load image, relocations, packer and linker clues.

Game-Maker players are 16-bit real-mode DOS programs linked by Borland TLINK. MZ has no
PE-style linker timestamp, import table or resource section; this module reports what the
format does carry and leaves the closest analogues (DOS services, ports, embedded blobs) to
the disassembler.
"""

from __future__ import annotations

import hashlib
import struct
from dataclasses import dataclass, field


@dataclass
class MZ:
    raw: bytes
    header_bytes: int  # e_cparhdr * 16
    image: bytes  # the load module (what DOS copies into memory)
    overlay: bytes  # bytes after the declared file size
    relocs: list[tuple[int, int]]  # (segment, offset) pairs as stored
    reloc_offsets: set[int] = field(default_factory=set)  # linear image offsets of fixed-up words
    cs: int = 0
    ip: int = 0
    ss: int = 0
    sp: int = 0
    min_alloc: int = 0
    max_alloc: int = 0
    checksum: int = 0
    reloc_table_offset: int = 0
    overlay_number: int = 0
    header_extra: bytes = b""  # bytes 0x1C..0x20 (linker marks live here)

    @property
    def entry(self) -> int:
        return self.cs * 16 + self.ip


class NotMZ(ValueError):
    pass


def parse(raw: bytes) -> MZ:
    if len(raw) < 28 or raw[:2] not in (b"MZ", b"ZM"):
        raise NotMZ("not an MZ executable")
    (cblp, cp, crlc, cparhdr, minalloc, maxalloc, ss, sp, csum, ip, cs, lfarlc, ovno) = struct.unpack_from(
        "<13H", raw, 2
    )
    file_size = (cp - 1) * 512 + (cblp if cblp else 512) if cp else 0
    hdr = cparhdr * 16
    image = raw[hdr:file_size]
    overlay = raw[file_size:]
    relocs = []
    for i in range(crlc):
        o = lfarlc + 4 * i
        if o + 4 > len(raw):
            break
        off, seg = struct.unpack_from("<HH", raw, o)
        relocs.append((seg, off))
    mz = MZ(
        raw=raw,
        header_bytes=hdr,
        image=image,
        overlay=overlay,
        relocs=relocs,
        cs=cs,
        ip=ip,
        ss=ss,
        sp=sp,
        min_alloc=minalloc,
        max_alloc=maxalloc,
        checksum=csum,
        reloc_table_offset=lfarlc,
        overlay_number=ovno,
        header_extra=raw[0x1C:0x20],
    )
    mz.reloc_offsets = {seg * 16 + off for seg, off in relocs}
    return mz


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


# --- packers -------------------------------------------------------------------------------

def detect_packer(mz: MZ) -> str | None:
    """Name the executable compressor, if any. Signatures from the packers' own stubs."""
    raw = mz.raw
    head = raw[:0x200]
    if b"PKLITE" in head or raw[0x1E:0x20] == b"PK" or b"PKlite" in head:
        return "PKLITE"
    if raw[0x1C:0x1E] == b"LZ" and raw[0x1E:0x20] in (b"09", b"91"):
        return "LZEXE " + raw[0x1C:0x20].decode()
    if b"Packed file is corrupt" in raw:
        return "EXEPACK"
    if b"diet" in head.lower() and b"dlz" in raw.lower()[:0x80]:
        return "DIET"
    if b"UPX!" in raw[:0x400]:
        return "UPX"
    return None


# --- linker / compiler ---------------------------------------------------------------------

def linker_mark(mz: MZ) -> str:
    """Borland TLINK writes 0xFB at header offset 0x1E and a version byte at 0x1F."""
    b = mz.raw
    if len(b) > 0x1F and b[0x1E] == 0xFB:
        v = b[0x1F]
        return f"Borland TLINK (0x1E=FB, version byte 0x{v:02X} = {v >> 4}.{v & 15} by TLINK's convention)"
    return "unknown (no TLINK FB mark at 0x1E)"


def compiler_banner(data: bytes) -> str | None:
    import re

    m = re.search(rb"(?:Borland C\+\+|Turbo C\+\+|Turbo-C|Turbo C) - Copyright \d{4} Borland Intl\.", data)
    return m.group(0).decode("latin-1") if m else None


# --- owner stamp ---------------------------------------------------------------------------

STAMP_LEN = 52


def stamp_slot(image: bytes) -> str:
    """Describe the 52-byte owner slot at load-image offset 0 (code/GM/REGSPACE.ASM).

    Never returns the owner's name or serial: buyers' real names live there.
    """
    if len(image) < STAMP_LEN:
        return "none"
    slot = image[:STAMP_LEN]
    if slot[:26] == b"abcdefghijklmnopqrstuvwxyz":
        return "blank placeholder"
    if slot[0] == 0xDC and slot[29] == 0 and slot[34:] == b"ijklmnopqrstuvwxyz":
        return "stamped (contents masked)"
    return "none"


def mask_stamp(image: bytes) -> bytes:
    """Zero the owner slot so stamped copies of one build compare equal."""
    if stamp_slot(image) == "none":
        return image
    return bytes(STAMP_LEN) + image[STAMP_LEN:]
