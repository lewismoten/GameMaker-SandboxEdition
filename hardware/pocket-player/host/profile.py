#!/usr/bin/env python3
"""Build and profile every indexed Pocket game/level; write raw samples and audited summaries.

Usage: profile.py --data hardware/pocket-player/data --card CARD/pocket --out OUTPUT
Outputs are private measurement artifacts, not source-controlled golden timings.
"""
import argparse
import csv
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import subprocess


def percentile(values, q):
    return sorted(values)[max(0, math.ceil(len(values) * q) - 1)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--card", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--samples", type=int, default=180)
    parser.add_argument("--repeats", type=int, default=3)
    parser.add_argument("--expected-games", type=int, default=121)
    parser.add_argument("--cpu", type=int)
    args = parser.parse_args()
    if not 1 <= args.samples <= 100000 or not 1 <= args.repeats <= 100:
        parser.error("samples/repeats outside bounded range")
    args.out.mkdir(parents=True, exist_ok=True)
    if args.cpu is not None:
        os.sched_setaffinity(0, {args.cpu})
    host = Path(__file__).resolve().parent
    src = host.parent / "src"
    command = ["c++", "-std=c++17", "-O1", "-Wall", "-Wextra", "-I" + str(src), str(host / "frameprofile.cpp"), "-lz", "-o", str(args.out.resolve() / "frameprofile")]
    subprocess.run(command, check=True)
    inventory = []
    for storage, root in [("onboard", args.data), ("microSD", args.card)]:
        if root is None:
            continue
        for line in (root / "games.txt").read_text().splitlines():
            fields = line.split("|")
            if len(fields) not in (3, 4):
                raise ValueError("invalid index line")
            inventory.append(dict(id=fields[0], title=fields[1], levels=int(fields[2]), cfg=fields[3] if len(fields) == 4 else fields[0], storage=storage, data=str(root.resolve())))
    assert len({g["id"] for g in inventory}) == len(inventory), "duplicate game id"
    assert len(inventory) == args.expected_games, (len(inventory), args.expected_games)
    (args.out / "inventory.json").write_text(json.dumps(inventory, indent=2) + "\n")
    env = dict(started=datetime.now(timezone.utc).isoformat(), platform=platform.platform(), machine=platform.machine(), python=platform.python_version(), compiler=subprocess.check_output(["c++", "--version"], text=True).splitlines()[0], build=command, affinity=sorted(os.sched_getaffinity(0)), load_start=os.getloadavg(), samples=args.samples, repeats=args.repeats, warmup=30, seed=12345, revision=subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=host, text=True).strip(), source_sha256=hashlib.sha256((host / "frameprofile.cpp").read_bytes()).hexdigest())
    cpuinfo = Path("/proc/cpuinfo")
    env["cpu_model"] = next((x.split(":", 1)[1].strip() for x in cpuinfo.read_text().splitlines() if x.startswith("model name")), "unknown") if cpuinfo.exists() else "unknown"
    all_values, summary, failures = [], [], []
    for game in inventory:
        output = args.out / (game["id"] + ".csv")
        cmd = [str(args.out.resolve() / "frameprofile"), game["data"], game["id"], str(args.samples), str(args.repeats), game["cfg"]]
        with output.open("w") as target:
            try:
                run = subprocess.run(cmd, stdout=target, stderr=subprocess.PIPE, text=True, timeout=120)
            except subprocess.TimeoutExpired:
                failures.append(dict(id=game["id"], error="120-second timeout"))
                continue
        if run.returncode:
            failures.append(dict(id=game["id"], exit=run.returncode, error=run.stderr))
            continue
        rows = list(csv.DictReader(output.open()))
        expected = game["levels"] * args.samples * args.repeats
        assert len(rows) == expected, (game["id"], len(rows), expected)
        for level in range(game["levels"]):
            level_rows = [r for r in rows if int(r["level"]) == level]
            assert len(level_rows) == args.samples * args.repeats
            for rep in range(args.repeats):
                samples = [int(r["sample"]) for r in level_rows if int(r["repeat"]) == rep]
                assert samples == list(range(args.samples))
            values = [float(r["frame_us"]) for r in level_rows]
            cpu_values = [float(r["cpu_us"]) for r in level_rows]
            all_values.extend(values)
            summary.append(dict(id=game["id"], storage=game["storage"], level=level, samples=len(values), p50_us=percentile(values,.5), p95_us=percentile(values,.95), p99_us=percentile(values,.99), max_us=max(values), mean_us=sum(values)/len(values), cpu_p50_us=percentile(cpu_values,.5), cpu_p95_us=percentile(cpu_values,.95), cpu_max_us=max(cpu_values), resets=sum(r["event"] != "-" for r in level_rows)))
        print(f"ok {game['id']} levels={game['levels']} samples={len(rows)}", flush=True)
    env.update(finished=datetime.now(timezone.utc).isoformat(), load_end=os.getloadavg())
    result = dict(environment=env, games=len(inventory), completed_games=len(inventory)-len(failures), levels=len(summary), samples=len(all_values), failures=failures, distribution={"p50_us":percentile(all_values,.5), "p95_us":percentile(all_values,.95), "p99_us":percentile(all_values,.99), "max_us":max(all_values)} if all_values else {}, worst_max=sorted(summary, key=lambda r:r["max_us"], reverse=True)[:10], worst_p95=sorted(summary,key=lambda r:r["p95_us"],reverse=True)[:10])
    (args.out / "summary.json").write_text(json.dumps(result,indent=2) + "\n")
    with (args.out / "levels.csv").open("w") as target:
        writer = csv.DictWriter(target, fieldnames=list(summary[0]) if summary else ["id"])
        writer.writeheader(); writer.writerows(summary)
    print(json.dumps({k:v for k,v in result.items() if k not in ("environment","worst_max","worst_p95")}, indent=2))
    return bool(failures)


if __name__ == "__main__":
    raise SystemExit(main())
