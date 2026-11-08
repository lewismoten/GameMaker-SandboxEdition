"""Public output must identify inputs without disclosing local corpus paths."""
import sys
import json
import io
import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from gmpd import collect


class PublicSourceTests(unittest.TestCase):
    def test_nested_archive_ingestion_preserves_literal_delimiters(self):
        inner = io.BytesIO()
        with zipfile.ZipFile(inner, "w") as archive:
            archive.writestr("GM/PLAYER!.EXE", b"MZ" + bytes(40000))
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "outer!.zip"
            with zipfile.ZipFile(path, "w") as archive:
                archive.writestr("disk!.zip", inner.getvalue())
            records = list(collect._iter_files(path))
            self.assertEqual(len(records), 1)
            source, _, _, metadata = records[0]
            self.assertEqual(metadata["source_members"], ["disk!.zip", "GM/PLAYER!.EXE"])
            label = collect.public_source({"source": source, **metadata})
            self.assertTrue(label.startswith("archive:outer%21.zip@"))
            self.assertTrue(label.endswith("!disk%21.zip!GM%2FPLAYER%21.EXE"))
            self.assertNotIn(tmp, label)

    def test_literal_archive_delimiters_are_not_nested_members(self):
        record = {"source": "/private/sample.zip!disk.zip!GM/PLAYER!.EXE",
                  "source_members": ["disk.zip", "GM/PLAYER!.EXE"],
                  "archive_name": "sample.zip", "archive_sha256": "a" * 64}
        self.assertEqual(collect.public_source(record),
                         "archive:sample.zip@" + "a" * 64 + "!disk.zip!GM%2FPLAYER%21.EXE")

    def test_repository_only_inventory_exports_no_local_paths(self):
        script = Path(__file__).resolve().parent.parent / "gmpdiff.py"
        with tempfile.TemporaryDirectory() as tmp:
            work, out = Path(tmp) / "work", Path(tmp) / "out"
            result = subprocess.run([sys.executable, "-S", str(script), "inventory",
                                     "--work", str(work), "--out", str(out)],
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            canon = json.loads((work / "canonical.json").read_text())
            self.assertEqual(set(canon), {"3.00-xfer", "3.00-play"})
            for path in out.iterdir():
                text = path.read_text()
                self.assertNotIn(str(script.parents[2]), text)
                self.assertNotIn(tmp, text)
                self.assertNotIn(".for-" + "lewis", text)
            self.assertIn("MISSING", (out / "inventory.tsv").read_text())

    def test_archive_labels_hide_local_hierarchy_and_keep_nested_members(self):
        record = {"source": "/private/corpus/version/sample.zip!disk.zip!GM/PLAYER.EXE",
                  "archive_sha256": "a" * 64, "file_sha256": "b" * 64, "build": "1.04"}
        label = collect.public_source(record)
        self.assertEqual(label, "archive:sample.zip@" + "a" * 64 + "!disk.zip!GM%2FPLAYER.EXE")
        record["source"] = "/another/machine/sample.zip!disk.zip!GM/PLAYER.EXE"
        self.assertEqual(collect.public_source(record), label)
        record["archive_sha256"] = "c" * 64
        self.assertNotEqual(collect.public_source(record), label)

    def test_loose_files_use_build_and_hash_not_private_filenames(self):
        record = {"source": "/private/operator/owner/player.exe", "build": "1.04", "file_sha256": "a" * 64}
        self.assertEqual(collect.public_source(record), "build:1.04@sha256:" + "a" * 64)

    def test_repository_provenance_remains_relative(self):
        self.assertEqual(collect.public_source({"source": "cd/gm/playgame.exe"}), "cd/gm/playgame.exe")


if __name__ == "__main__":
    unittest.main()
