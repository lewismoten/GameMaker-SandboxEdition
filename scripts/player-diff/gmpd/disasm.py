"""Recursive-descent disassembly of a Borland large-model DOS player into functions.

Functions are found from the entry point, near and far call targets, far pointers stored in
data, and Borland prologues (push bp / mov bp,sp; enter) in code not yet claimed. Each
instruction is rendered three ways for matching:

  exact  raw bytes with relocated segment words zeroed
  norm   text with addresses abstracted: call targets -> F, relocated segments -> SEG:C/SEG:D,
         absolute data addresses -> [G], string pointers -> S"text", jumps -> local labels
  shape  mnemonic and operand kinds only (immediates -> I)

A 16-bit immediate that happens to equal a string's DGROUP offset (0x3DA, the VGA status
port, often does) is read as a string pointer in norm; rawnorm keeps it as a number, and a
match counts as relocated when either form agrees.

Two functions with equal norm differ only by where things moved; equal shape means only
constants changed.
"""

from __future__ import annotations

import hashlib
import struct
from bisect import bisect_right
from dataclasses import dataclass, field

import capstone
from capstone import x86

from . import mz as mzlib

CF_BRANCH = {"jmp", "ljmp", "call", "lcall", "loop", "loope", "loopne", "jcxz", "jecxz"}
STOP = {"ret", "retf", "iret", "hlt"}
PRINTABLE = set(range(0x20, 0x7F)) | {9, 10, 13}


@dataclass
class Insn:
    lin: int
    off: int
    size: int
    raw: bytes
    text: str
    norm: str = ""
    shape: str = ""
    rawnorm: str = ""  # norm with string pointers left as numbers


@dataclass
class Function:
    start: int
    seg: int
    off: int
    insns: list[Insn] = field(default_factory=list)
    callees: list[int] = field(default_factory=list)
    strings: list[str] = field(default_factory=list)
    services: list[str] = field(default_factory=list)
    ports: list[str] = field(default_factory=list)
    name: str = ""
    name_source: str = ""
    exact: str = ""
    normh: str = ""
    rawnormh: str = ""
    shapeh: str = ""

    @property
    def size(self) -> int:
        return sum(i.size for i in self.insns)

    @property
    def addr(self) -> str:
        return f"{self.seg:04X}:{self.off:04X}"


class Program:
    def __init__(self, raw: bytes):
        self.mz = mzlib.parse(raw)
        self.image = mzlib.mask_stamp(self.mz.image)
        self.relocs = {o for o in self.mz.reloc_offsets if o + 2 <= len(self.image)}
        self.dgroup = self._dgroup()
        self.code_end = self.dgroup * 16
        vals = {self.word(o) for o in self.relocs}
        self.code_segs = sorted(v for v in vals if v * 16 < self.code_end)
        self.strings_at = self._string_starts()
        self.md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_16)
        self.md.detail = True
        self.funcs: dict[int, Function] = {}
        self._decoded: dict[int, Insn | None] = {}

    # --- layout ---------------------------------------------------------------------------

    def word(self, o: int) -> int:
        return struct.unpack_from("<H", self.image, o)[0]

    def _dgroup(self) -> int:
        e = self.mz.entry
        if self.image[e] == 0xBA and (e + 1) in self.mz.reloc_offsets:  # Borland c0: mov dx, DGROUP
            return self.word(e + 1)
        return self.mz.ss  # fallback: assume the stack lives in DGROUP

    def seg_for(self, lin: int) -> int:
        i = bisect_right(self.code_segs, lin // 16) - 1
        return self.code_segs[i] if i >= 0 else 0

    def _string_starts(self) -> dict[int, str]:
        """DGROUP offsets where a NUL-terminated text of 3+ printable bytes starts."""
        base, img, out = self.code_end, self.image, {}
        i = base
        while i < len(img):
            if img[i] in PRINTABLE and (i == base or img[i - 1] == 0):
                j = i
                while j < len(img) and img[j] in PRINTABLE:
                    j += 1
                if j < len(img) and img[j] == 0 and j - i >= 3:
                    out[i - base] = img[i:j].decode("latin-1")
                i = j + 1
            else:
                i += 1
        return out

    # --- decoding -------------------------------------------------------------------------

    def decode(self, seg: int, off: int) -> Insn | None:
        lin = seg * 16 + off
        if lin in self._decoded:
            return self._decoded[lin]
        ins = None
        if 0 <= lin < self.code_end:
            for c in self.md.disasm(self.image[lin : lin + 16], off, count=1):
                ins = c
        if ins is None or ins.mnemonic in ("(bad)",):
            self._decoded[lin] = None
            return None
        rec = Insn(lin, off, ins.size, bytes(ins.bytes), f"{ins.mnemonic} {ins.op_str}".strip())
        rec._cs = ins  # type: ignore[attr-defined]
        self._decoded[lin] = rec
        return rec

    def _far_target(self, ins: Insn) -> int | None:
        if ins.raw[0] in (0x9A, 0xEA) and ins.size == 5:
            off, seg = struct.unpack_from("<HH", ins.raw, 1)
            return seg * 16 + off
        return None

    def _near_target(self, ins: Insn) -> int | None:
        c = ins._cs  # type: ignore[attr-defined]
        if len(c.operands) == 1 and c.operands[0].type == x86.X86_OP_IMM and ins.raw[0] not in (0x9A, 0xEA):
            return c.operands[0].imm & 0xFFFF
        return None

    def _switch_table(self, seg: int, ins: Insn, prev: list[Insn]) -> list[int]:
        """jmp word ptr cs:[bx+table]: read entries; count from a preceding cmp reg, imm."""
        c = ins._cs  # type: ignore[attr-defined]
        if not c.operands or c.operands[0].type != x86.X86_OP_MEM:
            return []
        m = c.operands[0].mem
        if m.segment != x86.X86_REG_CS or m.base == 0 or m.disp == 0:
            return []
        count = 0
        for p in reversed(prev[-8:]):
            pc = p._cs  # type: ignore[attr-defined]
            if pc.mnemonic == "cmp" and len(pc.operands) == 2 and pc.operands[1].type == x86.X86_OP_IMM:
                count = (pc.operands[1].imm & 0xFFFF) + 1
                break
        if not 0 < count <= 256:
            return []
        out = []
        for k in range(count):
            o = seg * 16 + (m.disp & 0xFFFF) + 2 * k
            if o + 2 > self.code_end:
                break
            out.append(self.word(o))
        return out

    # --- function discovery ---------------------------------------------------------------

    def explore(self, seg: int, off: int) -> tuple[Function, list[tuple[int, int]]]:
        f = Function(seg * 16 + off, seg, off)
        seen: dict[int, Insn] = {}
        work = [off]
        found_calls: list[tuple[int, int]] = []
        while work:
            o = work.pop()
            prev: list[Insn] = []
            while True:
                lin = seg * 16 + o
                if lin in seen or (lin != f.start and lin in self.funcs):
                    break
                ins = self.decode(seg, o)
                if ins is None:
                    break
                seen[lin] = ins
                mn = ins._cs.mnemonic  # type: ignore[attr-defined]
                nxt = (o + ins.size) & 0xFFFF
                far = self._far_target(ins)
                if far is not None:
                    fo, fs = struct.unpack_from("<HH", ins.raw, 1)
                    found_calls.append((fs, fo))
                    if mn == "ljmp":
                        break
                elif mn in CF_BRANCH or mn.startswith("j"):
                    t = self._near_target(ins)
                    if mn == "call":
                        if t is not None:
                            found_calls.append((seg, t))
                    elif mn == "jmp":
                        if t is None:
                            for e in self._switch_table(seg, ins, prev):
                                work.append(e)
                            break
                        if seg * 16 + t in self.funcs and seg * 16 + t != f.start:
                            break  # tail call into another function
                        o = t
                        prev.append(ins)
                        continue
                    elif t is not None:
                        work.append(t)
                if mn in STOP or mn == "ljmp":
                    break
                prev.append(ins)
                o = nxt
        f.insns = [seen[k] for k in sorted(seen)]
        return f, found_calls

    def _data_far_pointers(self) -> list[tuple[int, int]]:
        """Far code pointers in data: a relocated code segment word preceded by an offset."""
        out = []
        for o in self.relocs:
            if o < self.code_end or o < 2:
                continue
            s = self.word(o)
            if s in set(self.code_segs):
                off = self.word(o - 2)
                lin = s * 16 + off
                if lin < self.code_end and self.image[lin : lin + 3] == b"\x55\x8b\xec":
                    out.append((s, off))
        return out

    def _prologue_seeds(self) -> list[tuple[int, int]]:
        covered = bytearray(self.code_end)
        for f in self.funcs.values():
            for i in f.insns:
                covered[i.lin : i.lin + i.size] = b"\x01" * i.size
        out = []
        img = self.image
        for pat in (b"\x55\x8b\xec", b"\xc8"):
            i = img.find(pat, 0, self.code_end)
            while i != -1:
                ok = not covered[i] and (pat != b"\xc8" or (i + 3 < self.code_end and img[i + 3] == 0))
                if ok:
                    s = self.seg_for(i)
                    if 0 <= i - s * 16 < 0x10000:
                        out.append((s, i - s * 16))
                i = img.find(pat, i + 1, self.code_end)
        return out

    def discover(self) -> None:
        seeds = [(self.mz.cs, self.mz.ip)] + self._data_far_pointers()
        for _round in range(4):
            queue = list(seeds)
            while queue:
                s, o = queue.pop()
                lin = s * 16 + o
                if lin in self.funcs or not (0 <= lin < self.code_end):
                    continue
                f, calls = self.explore(s, o)
                if not f.insns:
                    continue
                self.funcs[lin] = f
                queue.extend(calls)
            seeds = [x for x in self._prologue_seeds() if x[0] * 16 + x[1] not in self.funcs]
            if not seeds:
                break
        # second pass: bodies stop at every now-known function start
        starts = sorted(self.funcs)
        rebuilt = {}
        for lin in starts:
            f0 = self.funcs[lin]
            f, _ = self.explore(f0.seg, f0.off)
            rebuilt[lin] = f
        self.funcs = rebuilt

    # --- normalization --------------------------------------------------------------------

    def normalize(self) -> None:
        for f in self.funcs.values():
            index = {i.lin: k for k, i in enumerate(f.insns)}
            f.callees, f.strings, f.services, f.ports = [], [], [], []
            for k, ins in enumerate(f.insns):
                ins.norm, ins.shape, ins.rawnorm = self._norm(f, ins, index, k)
            f.exact = _h(b"".join(self._masked_bytes(i) for i in f.insns))
            f.normh = _h("\n".join(i.norm for i in f.insns).encode())
            f.rawnormh = _h("\n".join(i.rawnorm for i in f.insns).encode())
            f.shapeh = _h("\n".join(i.shape for i in f.insns).encode())

    def _masked_bytes(self, ins: Insn) -> bytes:
        b = bytearray(ins.raw)
        for r in range(ins.lin, ins.lin + ins.size - 1):
            if r in self.relocs:
                b[r - ins.lin : r - ins.lin + 2] = b"\0\0"
        return bytes(b)

    def _reloc_values(self, ins: Insn) -> set[int]:
        return {self.word(r) for r in range(ins.lin, ins.lin + ins.size - 1) if r in self.relocs}

    def _norm(self, f: Function, ins: Insn, index: dict[int, int], k: int) -> tuple[str, str, str]:
        c = ins._cs  # type: ignore[attr-defined]
        mn = c.mnemonic
        far = self._far_target(ins)
        if far is not None:
            f.callees.append(far)
            return f"{mn} F", f"{mn} F", f"{mn} F"
        rv = self._reloc_values(ins)
        nops, sops, rops = [], [], []
        for op in c.operands:
            if op.type == x86.X86_OP_REG:
                r = c.reg_name(op.reg)
                nops.append(r)
                sops.append(r)
                rops.append(r)
            elif op.type == x86.X86_OP_IMM:
                v = op.imm & 0xFFFF
                if mn in CF_BRANCH or mn.startswith("j"):
                    t = f.seg * 16 + v
                    if t in index:
                        nops.append(f"L{index[t] - k:+d}")
                    else:
                        nops.append("F")
                        if mn == "call" or t in self.funcs:
                            f.callees.append(t)
                    sops.append(nops[-1] if nops[-1] == "F" else "L")
                    rops.append(nops[-1])
                    continue
                if v in rv:
                    nops.append("SEG:D" if v == self.dgroup else "SEG:C")
                elif op.size == 2 and v in self.strings_at and v >= 0x10:
                    s = self.strings_at[v]
                    f.strings.append(s)
                    nops.append('S"' + s[:40].replace("\n", "\\n").replace("\r", "\\r") + '"')
                else:
                    nops.append(hex(v))
                rops.append(nops[-1] if nops[-1][0] != "S" else hex(v))
                sops.append("I")
            elif op.type == x86.X86_OP_MEM:
                m = op.mem
                seg = c.reg_name(m.segment) + ":" if m.segment else ""
                parts = [c.reg_name(r) for r in (m.base, m.index) if r]
                d = m.disp
                if not parts:
                    nd, sd = "G", "G"
                    if not m.segment and (d & 0xFFFF) in self.strings_at:
                        f.strings.append(self.strings_at[d & 0xFFFF])
                elif m.base == x86.X86_REG_BP or -0x80 <= d < 0x100:
                    nd, sd = (hex(d) if d else ""), ("d" if d else "")
                else:
                    nd, sd = "G", "G"
                body = "+".join(parts + ([nd] if nd else []))
                sbody = "+".join(parts + ([sd] if sd else []))
                w = {1: "b", 2: "w", 4: "d"}.get(op.size, "")
                nops.append(f"{w}[{seg}{body}]")
                sops.append(f"{w}[{seg}{sbody}]")
                rops.append(nops[-1])
        if mn == "int" and c.operands:
            f.services.append(self._service(f, k, c.operands[0].imm & 0xFF))
        if mn in ("in", "out"):
            f.ports.append(self._port(f, k, c))
        return f"{mn} {', '.join(nops)}".strip(), f"{mn} {', '.join(sops)}".strip(), f"{mn} {', '.join(rops)}".strip()

    def _service(self, f: Function, k: int, n: int) -> str:
        for p in reversed(f.insns[max(0, k - 6) : k]):
            pc = p._cs  # type: ignore[attr-defined]
            if pc.mnemonic == "mov" and len(pc.operands) == 2 and pc.operands[1].type == x86.X86_OP_IMM:
                r = pc.reg_name(pc.operands[0].reg) if pc.operands[0].type == x86.X86_OP_REG else ""
                v = pc.operands[1].imm & 0xFFFF
                if r == "ah":
                    return f"int {n:02X}h AH={v:02X}h"
                if r == "ax":
                    return f"int {n:02X}h AH={v >> 8:02X}h"
        return f"int {n:02X}h"

    def _port(self, f: Function, k: int, c) -> str:
        ops = c.operands
        for op in ops:
            if op.type == x86.X86_OP_IMM:
                return f"{c.mnemonic} {op.imm & 0xFF:02X}h"
        for p in reversed(f.insns[max(0, k - 8) : k]):
            pc = p._cs  # type: ignore[attr-defined]
            if (
                pc.mnemonic == "mov"
                and len(pc.operands) == 2
                and pc.operands[0].type == x86.X86_OP_REG
                and pc.reg_name(pc.operands[0].reg) == "dx"
                and pc.operands[1].type == x86.X86_OP_IMM
            ):
                return f"{c.mnemonic} {pc.operands[1].imm & 0xFFFF:03X}h"
        return f"{c.mnemonic} dx(variable)"

    # --- whole-image facts ----------------------------------------------------------------

    def image_strings(self, min_len: int = 4) -> list[tuple[int, str]]:
        out, img, i = [], self.image, 0
        while i < len(img):
            if img[i] in PRINTABLE and img[i] not in (9, 10, 13):
                j = i
                while j < len(img) and img[j] in PRINTABLE:
                    j += 1
                if j - i >= min_len:
                    out.append((i, img[i:j].decode("latin-1")))
                i = j
            else:
                i += 1
        return out

    def listing(self) -> str:
        lines = []
        for lin in sorted(self.funcs):
            f = self.funcs[lin]
            lines.append(f"\n; ---- {f.addr} (lin {lin:05X}) {f.name or ''} size {f.size} insns {len(f.insns)}")
            for i in f.insns:
                lines.append(f"{f.seg:04X}:{i.off:04X}  {i.raw.hex():<14} {i.text:<40} ; {i.norm}")
        return "\n".join(lines) + "\n"


EMBEDDED = {
    b"BGI Device Driver": "Borland BGI graphics driver",
    b"BGI Stroked Font": "Borland stroked font (.CHR)",
    b"Creative Voice File": "Creative Voice (.VOC) sample",
    b"GIF87a": "GIF image",
    b"GIF89a": "GIF image",
    b"CTMF": "Creative Music File",
    b"MThd": "MIDI file",
}


def embedded_blobs(image: bytes) -> list[tuple[int, str]]:
    out = []
    for sig, what in EMBEDDED.items():
        i = image.find(sig)
        while i != -1:
            out.append((i, what))
            i = image.find(sig, i + 1)
    return sorted(out)


def _h(b: bytes) -> str:
    return hashlib.sha1(b).hexdigest()[:16]


def analyze(raw: bytes) -> Program:
    p = Program(raw)
    p.discover()
    p.normalize()
    return p
