#!/usr/bin/env python3
"""Pocket Player showcase: a choreographed demo on all three of Lewis's boards at once, for filming. One command:

  ~/.platformio/penv/bin/python web/scripts/pocketShowcase.py [--minutes 4] [--countdown 5] [--dry-run] [--boards A,B,C]

Takes the three boards' lock folders (below), then runs one thread per board so that the three screens always look different:
  A (3.5")  board check: the firmware plays game after game by itself (`T n`), now and then with every card shown
  B (2.8")  touch test: starts a game and plays it with made-up fingers on the pad (walking, jumping), then back to the list
  C (2.8")  SD card: loads games from the card, plays them with touches, a level-cards check in between
Each board shows a big banner (`S2`, double-size text, with its letter as the badge) saying what it is doing, refreshed every 20 s so
the 2 minute idle timeout never hits. At the end each board shows "All tests passed" (or how many checks failed), then the banner
goes off, the finger is lifted and the locks are released, also on Ctrl-C or an error. A live three-column status prints in the
terminal (so the Mac screen can be in the shot). Never writes to a card, never touches the saved display setup (no NVS, no `S forget`).
--dry-run prints the plan without opening a port. --countdown N shows "Starting in N..." on all three first.
"""
import argparse, os, random, sys, threading, time

SCRATCH = "/private/tmp/claude-501/-Users-lewismoten-dev-GameMaker/abcc4d80-e3bd-43cb-8228-cbfe3453cb89/scratchpad"
# letter: port (None: found at start by asking each board `FW`, pocketStatus.find_ports),  lock folder, screen size, pad centre / Space / MENU chip / "Back to list" button (screen pixels, default controls)
BOARDS = {
    "A": dict(port=None, lock="board-A.lock", w=480, pad=(86, 216), space=(434, 256), menu=(34, 30), back=(240, 188), r=34),
    "B": dict(port=None, lock="board-B.lock", w=320, pad=(56, 144), space=(288, 168), menu=(24, 19), back=(160, 120), r=30),
    "C": dict(port=None, lock="board-C.lock", w=320, pad=(56, 144), space=(288, 168), menu=(24, 19), back=(160, 120), r=30),
}
DIRS = {"Up": (0, -1), "Down": (0, 1), "Left": (-1, 0), "Right": (1, 0), "Up-Right": (1, -1), "Up-Left": (-1, -1), "Down-Right": (1, 1)}
REFRESH = 20  # seconds between banner re-sends


class Stop(Exception):
    pass


class Board(threading.Thread):
    def __init__(self, letter, cfg, ctx):
        super().__init__(daemon=True)
        self.letter, self.cfg, self.ctx = letter, cfg, ctx
        self.s = None
        self.text = ""
        self.sent = 0
        self.checks = 0
        self.bad = 0
        self.act = "starting"
        self.games = []  # (index, id, on card)
        self.error = None

    # -- serial helpers
    def banner(self, text):
        from pocketStatus import show
        self.text = text
        self.ctx.status(self.letter, text)
        show(self.s, text, big=True)
        self.sent = time.time()

    def lines(self):
        out = []
        while self.s.in_waiting:
            l = self.s.readline().decode("utf-8", "replace").strip()
            if l:
                out.append(l)
        return out

    def wait(self, secs, text=None):
        """Sleeps `secs` seconds, refreshing the banner and noticing a stop request."""
        if text:
            self.banner(text)
        end = time.time() + secs
        while time.time() < end:
            if self.ctx.stop.is_set():
                raise Stop()
            if time.time() - self.sent > REFRESH:
                self.banner(self.text)
            time.sleep(min(0.25, max(0, end - time.time())))
            self.lines()

    def send(self, cmd):
        self.s.write((cmd + "\n").encode())
        self.s.flush()

    def read_until(self, prefix, timeout):
        end = time.time() + timeout
        got = []
        while time.time() < end:
            if self.ctx.stop.is_set():
                raise Stop()
            l = self.s.readline().decode("utf-8", "replace").strip()
            if l:
                got.append(l)
                if l.startswith(prefix):
                    return l, got
            if time.time() - self.sent > REFRESH:
                self.banner(self.text)
        return None, got

    def load_list(self):
        quiet, end = time.time(), time.time() + 240  # a self-test (`T all`) from an earlier run may still be going: wait until it is quiet
        while time.time() - quiet < 3 and time.time() < end:
            if self.ctx.stop.is_set():
                raise Stop()
            if self.s.readline():
                quiet = time.time()
        got = []
        for _ in range(5):  # opening the port can reset the board: it may still be starting
            self.s.reset_input_buffer()
            self.send("L")
            _, got = self.read_until("L done", 6)
            if any(l.startswith("L done") for l in got):
                break
        self.games = [(int(p[1]), p[2], p[3] == "1") for p in (l.split() for l in got) if len(p) == 4 and p[0] == "L" and p[1].isdigit()]
        if not self.games:
            raise RuntimeError("no game list: is the board on its game list, with the new firmware?")

    # -- activities
    def touch(self, x, y):
        self.send(f"I {int(x)} {int(y)}")

    def lift(self):
        self.send("I off")

    def hold(self, direction, secs):
        dx, dy = DIRS[direction]
        cx, cy = self.cfg["pad"]
        r = self.cfg["r"] * (0.75 if dx and dy else 1)
        self.touch(cx + dx * r, cy + dy * r)
        self.wait(secs)
        self.lift()

    def jump(self):
        self.lift(); self.wait(0.2)
        self.touch(*self.cfg["space"]); self.wait(0.25); self.lift(); self.wait(0.2)

    def to_list(self):
        """Back to the game list from a game: MENU chip, release, 'Back to list', release."""
        self.lift(); self.wait(0.3)
        self.touch(*self.cfg["menu"]); self.wait(0.3); self.lift(); self.wait(0.6)
        self.touch(*self.cfg["back"]); self.wait(0.3); self.lift(); self.wait(1.0)

    def start_game(self, g):
        for attempt in range(3):
            self.s.reset_input_buffer()
            self.send(f"G {g}")
            l, _ = self.read_until("G ", 8)
            if l and l.endswith("playing"):
                self.wait(1.5)
                return True
            if l and l.endswith("failed"):
                return False
            self.to_list()  # no answer: still in a game or a menu
        return False

    def check(self, ok):
        self.checks += 1
        self.bad += 0 if ok else 1
        self.ctx.status(self.letter, self.text)

    def run_check(self, g, ticks, cards=False):
        """The firmware's own self-test of one game (it draws the game running for `ticks` ticks)."""
        self.s.reset_input_buffer()
        self.send(f"T {g} {ticks}{' cards' if cards else ''}")
        l, got = self.read_until("ST done", 60 if cards else 20)
        row = next((x for x in got if x.startswith("ST id=")), "")
        self.check(bool(l) and " ok=1 " in row + " ")
        return row

    def name(self, g):
        return next((i for k, i, _ in self.games if k == g), str(g)).replace("_", " ").replace("-", " ").title()[:11]

    def plan(self):
        raise NotImplementedError

    def run(self):
        try:
            from pocketStatus import open_port
            self.s = open_port(self.cfg["port"], 0.3)
            time.sleep(0.4)
            self.ctx.ready.wait()
            time.sleep(self.ctx.stagger[self.letter])
            self.load_list()
            self.banner("Showcase starting")
            self.wait(1)
            self.script()
            self.banner("All tests passed" if not self.bad else f"{self.bad} checks need a look")
            self.act = "done"
            self.wait(6)
        except Stop:
            pass
        except Exception as e:  # noqa: BLE001
            self.error = e
            self.ctx.status(self.letter, f"error: {e}")
        finally:
            self.cleanup()

    def cleanup(self):
        try:
            from pocketStatus import clear
            self.lift()
            clear(self.s)
            time.sleep(0.2)
            self.s.close()
        except Exception:
            pass

    def remaining(self):
        return self.ctx.deadline - time.time()


class BoardA(Board):
    def script(self):
        n = len(self.games)
        order = list(range(n))
        random.Random(1).shuffle(order)
        k = 0
        while self.remaining() > 8:
            g = order[k % n]
            k += 1
            cards = k % 6 == 0
            self.banner(f"{'Cards' if cards else 'Board check'} {g + 1}/{n} {self.name(g)}"[:34])
            self.act = f"game {g + 1}/{n}"
            self.run_check(g, 150 if not cards else 40, cards)


class BoardB(Board):
    def script(self):
        gl = [g for g, _, sd in self.games if not sd] or [g for g, _, _ in self.games]
        random.Random(2).shuffle(gl)
        moves = ["Up-Right", "Right", "Up-Left", "Left", "Right", "Up-Right", "Down-Right"]
        k = 0
        while self.remaining() > 12:
            g = gl[k % len(gl)]
            k += 1
            self.banner(f"Loading {self.name(g)}"[:21])
            ok = self.start_game(g)
            self.check(ok)
            if not ok:
                continue
            for m in moves:
                if self.remaining() < 6:
                    break
                self.act = m
                self.banner(f"Touch: holding {m}"[:21])
                self.hold(m, 3.5)
                if m.startswith("Up"):
                    self.jump()
            self.banner("Back to the list"[:21])
            self.to_list()


class BoardC(Board):
    def script(self):
        sd = [g for g, _, c in self.games if c] or [g for g, _, _ in self.games]
        random.Random(3).shuffle(sd)
        k = 0
        while self.remaining() > 12:
            g = sd[k % len(sd)]
            k += 1
            self.banner(f"SD card: {self.name(g)}"[:21])
            ok = self.start_game(g)
            self.check(ok)
            if not ok:
                continue
            for m in ["Right", "Up-Right", "Right", "Left"]:
                if self.remaining() < 6:
                    break
                self.banner(f"Playing {self.name(g)}"[:21])
                self.hold(m, 3)
                self.jump()
            self.to_list()
            if self.remaining() > 20:
                self.banner(f"Level cards: {self.name(g)}"[:21])
                self.run_check(g, 30, cards=True)


class Context:
    def __init__(self, boards, minutes):
        self.stop, self.ready = threading.Event(), threading.Event()
        self.deadline = 0
        self.minutes = minutes
        self.lines = {b: "" for b in boards}
        self.stagger = {b: i * 4.0 for i, b in enumerate(boards)}  # B and C start a few seconds after A: the screens never change together
        self.lock = threading.Lock()
        self.boards = {}
        self.t0 = time.time()

    def status(self, letter, text):
        with self.lock:
            self.lines[letter] = text

    def render(self, first=False):
        """Three columns, rewritten in place on a terminal."""
        with self.lock:
            cols = []
            for l, b in self.boards.items():
                cols.append([f"Board {l}", (self.lines[l] or "-")[:30], f"{b.checks} checks, {b.bad} failed"])
        left = max(0, int(self.deadline - time.time()))
        out = []
        for row in range(3):
            out.append("  ".join(f"{c[row]:<32}" for c in cols))
        out.append(f"time left {left // 60}:{left % 60:02d}")
        if sys.stdout.isatty():
            if not first:
                sys.stdout.write(f"\x1b[{len(out)}A")
            sys.stdout.write("".join(f"\x1b[2K{l}\n" for l in out))
        else:
            sys.stdout.write(" | ".join(out) + "\n")
        sys.stdout.flush()


def take_locks(letters):
    got = []
    for l in letters:
        path = os.path.join(SCRATCH, BOARDS[l]["lock"])
        try:
            os.mkdir(path)
            got.append(path)
        except FileExistsError:
            for p in got:
                os.rmdir(p)
            sys.exit(f"Board {l} is locked ({path}): someone is using it. Nothing was touched.")
    return got


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--minutes", type=float, default=4)
    ap.add_argument("--countdown", type=int, default=0)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--boards", default="A,B,C")
    a = ap.parse_args()
    letters = [x for x in a.boards.upper().split(",") if x in BOARDS]
    found = {} if a.dry_run else __import__("pocketStatus").find_ports()
    for l in letters:
        BOARDS[l]["port"] = found.get(l)
        if not BOARDS[l]["port"] and not a.dry_run:
            sys.exit(f"Board {l} not found; boards answering: {found or 'none'} (name one with `ID set {l}`)")
    if a.dry_run:
        print(f"Plan: {a.minutes:g} minutes on boards {', '.join(letters)}; locks {', '.join(BOARDS[l]['lock'] for l in letters)}")
        if a.countdown:
            print(f"  all: banner 'Starting in {a.countdown}...' counting down")
        for l in letters:
            print(f"  {l} ({BOARDS[l]['port']}, starts {letters.index(l) * 4} s in):")
            print({
                "A": "    game by game self-test (T n 150), every 6th with all cards; banner 'Board check 12/88 Carl'",
                "B": "    start a game (G n), hold Up-Right, Right, Up-Left... on the pad with made-up fingers, jump, back to the list; banner 'Touch: holding Up-Right'",
                "C": "    SD card games: load, walk and jump, back to the list, then a level-cards check; banners 'SD card: Maximus', 'Level cards: ...'",
            }[l])
        print("  end: banner 'All tests passed' for 6 s, banner off, locks released")
        return
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    locks = take_locks(letters)
    ctx = Context(letters, a.minutes)
    kinds = {"A": BoardA, "B": BoardB, "C": BoardC}
    try:
        for l in letters:
            ctx.boards[l] = kinds[l](l, BOARDS[l], ctx)
        for b in ctx.boards.values():
            b.start()
        if a.countdown:
            time.sleep(0.8)
            for n in range(a.countdown, 0, -1):
                for b in ctx.boards.values():
                    if b.s:
                        b.banner(f"Starting in {n}...")
                ctx.render(n == a.countdown)
                time.sleep(1)
        ctx.deadline = time.time() + a.minutes * 60
        ctx.ready.set()
        first = True
        while any(b.is_alive() for b in ctx.boards.values()):
            ctx.render(first and not a.countdown)
            first = False
            time.sleep(1)
        ctx.render()
    except KeyboardInterrupt:
        print("\nStopping...")
        ctx.stop.set()
    finally:
        ctx.stop.set()
        for b in ctx.boards.values():
            b.join(timeout=15)
        for p in locks:
            try:
                os.rmdir(p)
            except OSError:
                pass
    bad = [l for l, b in ctx.boards.items() if b.error or b.bad]
    for l, b in ctx.boards.items():
        print(f"Board {l}: {b.checks} checks, {b.bad} failed{', error: ' + str(b.error) if b.error else ''}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
