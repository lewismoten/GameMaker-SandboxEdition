#!/usr/bin/env python3
"""Profiler coverage/determinism checks on the real two-level onboard fixture."""
import csv
import io
import math
import os
from pathlib import Path
import subprocess
import tempfile

host = Path(__file__).resolve().parent
with tempfile.TemporaryDirectory(prefix="pocket-profile-test-", dir=os.environ.get("TMPDIR")) as work:
    exe = Path(work) / "profile"
    subprocess.run(["c++", "-std=c++17", "-O1", "-Wall", "-Wextra", "-I" + str(host.parent / "src"), str(host / "frameprofile.cpp"), "-lz", "-o", str(exe)], check=True)
    cmd = [str(exe), str(host.parent / "data"), "first-steps", "60", "2"]
    runs = [list(csv.DictReader(io.StringIO(subprocess.check_output(cmd, text=True, timeout=15)))) for _ in range(2)]
    stable = lambda rows: [{k:v for k,v in r.items() if not k.endswith("_us")} for r in rows]
    assert stable(runs[0]) == stable(runs[1]), "seed/input/state must reproduce independently of timings"
    assert len(runs[0]) == 240
    for level in range(2):
        for rep in range(2):
            rows = [r for r in runs[0] if int(r["level"]) == level and int(r["repeat"]) == rep]
            assert [int(r["sample"]) for r in rows] == list(range(60))
            for r in rows:
                assert all(math.isfinite(float(v)) and float(v) >= 0 for k,v in r.items() if k.endswith("_us"))
                assert abs(float(r["frame_us"]) - float(r["tick_us"]) - float(r["render_us"])) < .002
    assert subprocess.run([str(exe), work, "missing"], stdout=subprocess.DEVNULL, timeout=5).returncode == 3
    assert subprocess.run(cmd[:3] + ["0"], stdout=subprocess.DEVNULL, timeout=5).returncode == 2
print("PASS profiler: two levels, two repetitions, exact samples, stable checksums, finite timing, rejected invalid input")
