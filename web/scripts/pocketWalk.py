#!/usr/bin/env python3
"""Walk a Pocket Player (CYD) board through a steps file: banners, made-up taps, serial lines, expected replies and
a Ghost Jack camera picture per step, without resetting the board.

  ~/.platformio/penv/bin/python web/scripts/pocketWalk.py --board B web/scripts/pocket-walks/first-run.txt \
      [--out dir] [--no-camera] [--crop x,y,w,h] [--width 1920] [--expect-timeout 5]

Needs pyserial (the PlatformIO python has it). The camera step runs `npm run look` at the repo root and needs the
Ghost Jack bridge (cd ~/dev/ghostjack && npm start). --board is a letter (A, B, C; pocketStatus.port_for) or a serial
port path. Steps file, one per line, # starts a comment:
  banner <text>          big banner on the board (S2, ASCII, 21 characters on a 320 px board)
  tap <x> <y> [ms]       held finger (I x y) for ms (default 400), then I off
  hold <x> <y>           put a finger down and leave it (release with `release`)
  release                I off
  wait <ms>
  send <raw line>        a serial line as is (FIRST reset, L, S st ...)
  expect <text>          wait for a reply line containing text (fails the walk after the timeout)
  shot <name> [crop]     camera picture <out>/<NN>-<name>.jpg; crop is x,y,w,h as fractions of the picture
  screen <name>          the firmware has no serial screenshot command, so this is skipped and noted
Writes summary.md in the out dir (each step, reply lines, picture links). Exit 1 if an expect or the camera failed."""
import argparse
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
ARGS = {"banner": (1, None), "tap": (2, 3), "hold": (2, 2), "release": (0, 0), "wait": (1, 1), "send": (1, None),
        "expect": (1, None), "shot": (1, 2), "screen": (1, 1)}
REST = {"banner", "send", "expect"}  # the whole rest of the line is one argument


def parse_steps(text):
    """Steps text to [(lineno, command, [args])]; raises ValueError('line N: ...') on a bad line."""
    steps = []
    for n, raw in enumerate(text.splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        cmd, _, rest = line.partition(" ")
        cmd, rest = cmd.lower(), rest.strip()
        if cmd not in ARGS:
            raise ValueError(f"line {n}: unknown step '{cmd}'")
        args = ([rest] if rest else []) if cmd in REST else rest.split()
        lo, hi = ARGS[cmd]
        if len(args) < lo or (hi is not None and len(args) > hi):
            raise ValueError(f"line {n}: '{cmd}' has the wrong number of arguments")
        try:
            if cmd in ("tap", "hold", "wait"):
                [int(a) for a in args]
            if cmd == "shot" and len(args) == 2 and len([float(c) for c in args[1].split(",")]) != 4:
                raise ValueError
        except ValueError:
            raise ValueError(f"line {n}: bad number in '{cmd}'") from None
        steps.append((n, cmd, args))
    return steps


class Walk:
    def __init__(self, port, out, camera, crop, width, timeout):
        sys.path.insert(0, str(HERE))
        from pocketStatus import open_port
        self.s = open_port(port)
        self.s.reset_input_buffer()
        self.out, self.camera, self.crop, self.width, self.timeout = out, camera, crop, width, timeout
        self.buf = ""
        self.num = 0
        self.failed = False

    def tx(self, line, pause=0.3):
        self.s.write((line + "\n").encode())
        self.s.flush()
        time.sleep(pause)

    def lines(self):
        """New complete serial lines since the last call."""
        if self.s.in_waiting:
            self.buf += self.s.read(self.s.in_waiting).decode("utf8", "replace")
        *done, self.buf = self.buf.split("\n")
        return [x.strip() for x in done if x.strip()]

    def run(self, cmd, args):
        """Runs one step; returns (note, reply lines, picture or None)."""
        if cmd == "banner":
            self.tx("S2 " + args[0], 0.6)
        elif cmd == "tap":
            self.tx(f"I {args[0]} {args[1]}", int(args[2] if len(args) > 2 else 400) / 1000)
            self.tx("I off", 0.7)
        elif cmd == "hold":
            self.tx(f"I {args[0]} {args[1]}", 0.8)
        elif cmd == "release":
            self.tx("I off", 0.6)
        elif cmd == "wait":
            time.sleep(int(args[0]) / 1000)
        elif cmd == "send":
            self.tx(args[0], 0.8)
        elif cmd == "expect":
            end, got = time.time() + self.timeout, []
            while time.time() < end:
                got += self.lines()
                if any(args[0] in g for g in got):
                    return "found", got, None
                time.sleep(0.1)
            self.failed = True
            return f"NOT FOUND within {self.timeout:g} s", got, None
        elif cmd == "screen":
            return "skipped: no serial screenshot command in the firmware", [], None
        elif cmd == "shot":
            if not self.camera:
                return "skipped (--no-camera)", [], None
            pic = f"{self.num:02d}-{args[0]}.jpg"
            crop = args[1] if len(args) > 1 else self.crop
            c = ["npm", "run", "-s", "look", "--", "5", "--width", str(self.width), "--out", str(self.out / pic)]
            if crop:
                c += ["--crop", crop]
            r = subprocess.run(c, cwd=REPO, capture_output=True, text=True)
            if r.returncode:
                self.failed = True
                return "camera failed: " + (r.stderr or r.stdout).strip()[-200:], [], None
            return "ok", [], pic
        return "ok", [], None


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("steps")
    p.add_argument("--board", required=True, help="A, B, C or a serial port path")
    p.add_argument("--out", default=None)
    p.add_argument("--no-camera", action="store_true")
    p.add_argument("--crop", default=None, help="x,y,w,h fractions for every shot")
    p.add_argument("--width", type=int, default=1920)
    p.add_argument("--expect-timeout", type=float, default=5)
    a = p.parse_args(argv)
    steps = parse_steps(Path(a.steps).read_text())
    port = a.board
    if len(port) == 1:
        sys.path.insert(0, str(HERE))
        from pocketStatus import port_for
        port = port_for(port.upper())
        if not port:
            sys.exit(f"board {a.board} not found")
    out = Path(a.out or f"pocket-walk-{time.strftime('%Y%m%d-%H%M%S')}")
    out.mkdir(parents=True, exist_ok=True)
    w = Walk(port, out, not a.no_camera, a.crop, a.width, a.expect_timeout)
    rows = [f"# Pocket walk: {Path(a.steps).name}", "", f"Board {a.board} ({port}), {time.strftime('%Y-%m-%d %H:%M')}", ""]
    try:
        for n, cmd, args in steps:
            w.num += 1
            note, got, pic = w.run(cmd, args)
            got += w.lines()
            rows.append(f"{w.num}. `{cmd} {' '.join(args)}` (line {n}): {note}")
            rows += [f"   - reply: `{g[:160]}`" for g in got[-6:]]
            if pic:
                rows.append(f"   - ![{pic}]({pic})")
            print(w.num, cmd, note)
    finally:
        w.s.close()
        (out / "summary.md").write_text("\n".join(rows) + "\n")
    print("summary:", out / "summary.md", "FAILED" if w.failed else "ok")
    return 1 if w.failed else 0


if __name__ == "__main__":
    sys.exit(main())
