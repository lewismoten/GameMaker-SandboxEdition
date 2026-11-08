"""Self-test on tiny synthetic MZ programs (no copyrighted binaries needed).

  uv run --with capstone==5.0.7 python -m unittest discover -s scripts/player-diff/tests
"""

from __future__ import annotations

import struct
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from gmpd import mapfile, match, mz, report  # noqa: E402

try:
    import capstone
except ModuleNotFoundError:
    capstone = None
else:
    from gmpd import disasm

DGROUP = 0x10  # paragraph of the data segment in these test images


def build_exe(constant: int, text: bytes = b"Hello", stamp: bytes = b"") -> bytes:
    """Entry: mov dx,DGROUP; call far helper; mov ax,4C00h; int 21h.
    helper (seg 0, off 0x20): push bp; mov bp,sp; mov ax,<string>; mov bx,<constant>; pop bp; retf.
    """
    code = bytearray(DGROUP * 16)
    relocs = []
    entry = stamp + b"\xBA" + struct.pack("<H", DGROUP)
    e0 = len(stamp)
    relocs.append(e0 + 1)
    entry += b"\x9A" + struct.pack("<HH", 0x20, 0)
    relocs.append(e0 + 6)
    entry += b"\xB8\x00\x4C\xCD\x21"
    code[: len(entry)] = entry
    helper = b"\x55\x8B\xEC\xB8" + struct.pack("<H", 0x10) + b"\xBB" + struct.pack("<H", constant) + b"\x5D\xCB"
    code[0x20 : 0x20 + len(helper)] = helper
    data = bytearray(64)
    data[0x10 : 0x10 + len(text) + 1] = text + b"\0"
    image = bytes(code) + bytes(data)
    hdr_paras = 4
    hdr = bytearray(hdr_paras * 16)
    total = len(hdr) + len(image)
    struct.pack_into("<2s13H", hdr, 0, b"MZ", total % 512, (total + 511) // 512, len(relocs), hdr_paras, 0, 0xFFFF, DGROUP, 0x80, 0, e0, 0, 0x20, 0)
    hdr[0x1E:0x20] = b"\xFB\x50"
    for k, r in enumerate(relocs):
        struct.pack_into("<HH", hdr, 0x20 + 4 * k, r, 0)
    return bytes(hdr) + image


class SyntheticTests(unittest.TestCase):
    def test_parse_and_linker(self):
        m = mz.parse(build_exe(1))
        self.assertEqual(m.header_bytes, 64)
        self.assertEqual(len(m.relocs), 2)
        self.assertIn("TLINK", mz.linker_mark(m))
        self.assertIsNone(mz.detect_packer(m))

    def test_stamp_is_masked(self):
        slot = bytes([0xDC]) + bytes(range(1, 29)) + b"\0" + b"\1\2\3\4" + b"ijklmnopqrstuvwxyz"
        self.assertEqual(mz.stamp_slot(slot + b"\0" * 8), "stamped (contents masked)")
        self.assertEqual(mz.mask_stamp(slot + b"x")[:52], bytes(52))

    @unittest.skipUnless(capstone, "optional Capstone dependency is not installed")
    def test_functions_strings_services(self):
        p = disasm.analyze(build_exe(1))
        self.assertEqual(p.dgroup, DGROUP)
        self.assertEqual(sorted(p.funcs), [0, 0x20])
        self.assertEqual(p.funcs[0x20].strings, ["Hello"])
        self.assertIn("int 21h AH=4Ch", p.funcs[0].services)
        self.assertIn("lcall F", [i.norm for i in p.funcs[0].insns])

    @unittest.skipUnless(capstone, "optional Capstone dependency is not installed")
    def test_match_grades(self):
        a = disasm.analyze(build_exe(1))
        same = disasm.analyze(build_exe(1))
        other = disasm.analyze(build_exe(2))
        texted = disasm.analyze(build_exe(1, b"Howdy"))
        # A string edited in place leaves the code identical; the strings section reports it.
        for b, want in ((same, "identical"), (other, "constants"), (texted, "identical")):
            m = match.Matcher(a, b)
            m.run()
            ms, rem, add = m.results()
            self.assertFalse(rem or add)
            helper = next(x for x in ms if x.a.start == 0x20)
            self.assertEqual(helper.status, want)
        self.assertEqual(texted.funcs[0x20].strings, ["Howdy"])

    def test_map_publics_keep_spaced_cpp_names(self):
        text = (
            " Start  Stop   Length Name               Class\r\n"
            " 00000H 0066FH 00670H _TEXT              CODE\r\n"
            "\r\n"
            "  Address         Publics by Name\r\n"
            "\r\n"
            " 11D6:0668       movewindow(unsigned char)\r\n"
            "\r\n"
            "  Address         Publics by Value\r\n"
            "\r\n"
            " 0000:0000  Abs  __setargv__\r\n"
            " 0000:0000 idle  __turboCrt\r\n"
            " 11D6:0668       movewindow(unsigned char)\r\n"
            " 11D6:06BE       viewwindow(unsigned long)  \r\n"
            " 11D6:0700       _main\r\n"
            "\r\n"
            "Program entry point at 0000:0000\r\n"
        )
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "T.MAP"
            path.write_bytes(text.encode("latin-1"))
            segs, pubs = mapfile.read_map(path)
        self.assertEqual([(s["name"], s["class"], s["length"]) for s in segs], [("_TEXT", "CODE", 0x670)])
        self.assertEqual(
            pubs,
            [
                (0, 0, "__turboCrt"),
                (0x11D6, 0x0668, "movewindow(unsigned char)"),
                (0x11D6, 0x06BE, "viewwindow(unsigned long)"),
                (0x11D6, 0x0700, "_main"),
            ],
        )

    def test_redaction(self):
        self.assertTrue(report.redact("Box 1163, Somewhere").startswith("[redacted"))
        self.assertTrue(report.redact("call (412) 555-0100").startswith("[redacted"))
        self.assertEqual(report.redact("Choose object to drop"), "Choose object to drop")


if __name__ == "__main__":
    unittest.main()
