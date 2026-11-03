#!/usr/bin/env python3
"""A small PIC16F84A instruction simulator and a test of phone.asm's behavior.

Runs the assembled phone.hex at 894886 cycles per second, drives the pins like the board would
(dial switches, MT8870 outputs, TALK), watches the tone pins and the MAX7219 bit-banging, and
checks: start-up display, a dialed digit (normal and fast pulses), the tone pair's frequencies
(Goertzel on the summed square waves), 10 pulses = 0, a received digit, TALK mutes the receiver.
usage: picsim.py path/to/phone.hex        exits 1 on a failed check.
Not a cycle-exact model of every PIC feature (no interrupts, timers or EEPROM): only what phone.asm uses.
"""
import math
import sys

FCY = 3579545 / 4


class Pic:
    def __init__(self, hexfile):
        self.prog = [0x3FFF] * 1024
        ext = 0
        for ln in open(hexfile):
            ln = ln.strip()
            if not ln.startswith(":"):
                continue
            n = int(ln[1:3], 16)
            a = int(ln[3:7], 16)
            t = int(ln[7:9], 16)
            d = bytes.fromhex(ln[9:9 + 2 * n])
            if t == 4:
                ext = int.from_bytes(d, "big") << 16
            if t == 0:
                for k in range(0, n, 2):
                    addr = (ext + a + k) // 2
                    if addr < 1024:
                        self.prog[addr] = d[k] | (d[k + 1] << 8)
        self.ram = [0] * 256
        self.w = 0
        self.pc = 0
        self.stack = []
        self.cycles = 0
        self.tris_a = 0x1F
        self.tris_b = 0xFF
        self.latch_a = 0
        self.latch_b = 0
        self.ext_a = 0   # external levels for input pins
        self.ext_b = 0xFF
        self.status = 0x18
        self.fsr = 0
        self.pclath = 0
        self.option = 0xFF
        self.on_port = lambda: None
        self.skip = False

    # register file with the two banks and the mapped registers
    def rd(self, f):
        f &= 0x7F
        if f == 0:
            return self.rd(self.fsr)
        if f == 2:
            return self.pc & 0xFF
        if f == 3:
            return self.status
        if f == 4:
            return self.fsr
        bank1 = self.status & 0x20
        if f == 5:
            if bank1:
                return self.tris_a
            return (self.latch_a & ~self.tris_a | self.ext_a & self.tris_a) & 0x1F
        if f == 6:
            if bank1:
                return self.tris_b
            return (self.latch_b & ~self.tris_b | self.ext_b & self.tris_b) & 0xFF
        if f == 0x0A:
            return self.pclath
        if f == 1 and bank1:
            return self.option
        return self.ram[f]

    def wr(self, f, v):
        f &= 0x7F
        v &= 0xFF
        if f == 0:
            return self.wr(self.fsr, v)
        if f == 2:
            self.pc = ((self.pclath & 0x1F) << 8) | v
            self.skip_inc = False
            self.pcw = True
            return
        if f == 3:
            self.status = v
            return
        if f == 4:
            self.fsr = v
            return
        bank1 = self.status & 0x20
        if f == 5:
            if bank1:
                self.tris_a = v & 0x1F
            else:
                self.latch_a = v & 0x1F
                self.on_port()
            return
        if f == 6:
            if bank1:
                self.tris_b = v
            else:
                self.latch_b = v
                self.on_port()
            return
        if f == 0x0A:
            self.pclath = v
            return
        if f == 1 and bank1:
            self.option = v
            return
        self.ram[f] = v

    def flags(self, z=None, c=None, dc=None):
        if z is not None:
            self.status = (self.status & ~4) | (4 if z else 0)
        if c is not None:
            self.status = (self.status & ~1) | (1 if c else 0)

    def step(self):
        op = self.prog[self.pc]
        self.pc = (self.pc + 1) & 0x7FF
        self.pcw = False
        cyc = 1
        if self.skip:
            self.skip = False
            self.cycles += 1
            return
        hi = op >> 8
        f = op & 0x7F
        d = (op >> 7) & 1
        W = self.w

        def put(v):
            v &= 0xFF
            if d:
                self.wr(f, v)
            else:
                self.w = v

        top = op >> 11
        if op >> 12 == 0:
            sub = (op >> 8) & 0x3F
            if op & 0x3F80 == 0x0080:
                self.wr(f, W)
            elif op & 0x3F80 == 0x0100:
                self.w = 0
                self.flags(z=True)
            elif op & 0x3F80 == 0x0180:
                self.wr(f, 0)
                self.flags(z=True)
            elif op == 0x0008:
                v = self.stack.pop()
                self.pc = v
                cyc = 2
            elif op == 0x0009 or op == 0x0063 or op == 0x0064 or op == 0:
                pass
            elif hi & 0x3F == 0x02:   # SUBWF
                a = self.rd(f)
                r = a - W
                put(r)
                self.flags(z=(r & 0xFF) == 0, c=a >= W)
            elif hi & 0x3F == 0x03:   # DECF
                r = self.rd(f) - 1
                put(r)
                self.flags(z=(r & 0xFF) == 0)
            elif hi & 0x3F == 0x04:   # IORWF
                r = self.rd(f) | W
                put(r)
                self.flags(z=r == 0)
            elif hi & 0x3F == 0x05:   # ANDWF
                r = self.rd(f) & W
                put(r)
                self.flags(z=r == 0)
            elif hi & 0x3F == 0x06:   # XORWF
                r = self.rd(f) ^ W
                put(r)
                self.flags(z=r == 0)
            elif hi & 0x3F == 0x07:   # ADDWF
                a = self.rd(f)
                r = a + W
                put(r)
                self.flags(z=(r & 0xFF) == 0, c=r > 255)
            elif hi & 0x3F == 0x08:   # MOVF
                r = self.rd(f)
                put(r)
                self.flags(z=r == 0)
            elif hi & 0x3F == 0x09:   # COMF
                r = ~self.rd(f) & 0xFF
                put(r)
                self.flags(z=r == 0)
            elif hi & 0x3F == 0x0A:   # INCF
                r = self.rd(f) + 1
                put(r)
                self.flags(z=(r & 0xFF) == 0)
            elif hi & 0x3F == 0x0B:   # DECFSZ
                r = (self.rd(f) - 1) & 0xFF
                put(r)
                if r == 0:
                    self.skip = True
            elif hi & 0x3F == 0x0C:   # RRF
                a = self.rd(f)
                c = self.status & 1
                put((a >> 1) | (c << 7))
                self.flags(c=a & 1)
            elif hi & 0x3F == 0x0D:   # RLF
                a = self.rd(f)
                c = self.status & 1
                put(((a << 1) | c) & 0xFF)
                self.flags(c=a & 0x80)
            elif hi & 0x3F == 0x0E:   # SWAPF
                a = self.rd(f)
                put((a >> 4) | (a << 4))
            elif hi & 0x3F == 0x0F:   # INCFSZ
                r = (self.rd(f) + 1) & 0xFF
                put(r)
                if r == 0:
                    self.skip = True
            else:
                raise SystemExit(f"unknown op {op:04x} at {self.pc - 1:03x}")
        elif op >> 12 == 1:
            b = (op >> 7) & 7
            k = op >> 10 & 3
            if k == 0:
                self.wr(f, self.rd(f) & ~(1 << b))
            elif k == 1:
                self.wr(f, self.rd(f) | (1 << b))
            elif k == 2:
                if not (self.rd(f) >> b) & 1:
                    self.skip = True
            else:
                if (self.rd(f) >> b) & 1:
                    self.skip = True
        elif op >> 11 == 0b100:   # CALL
            self.stack.append(self.pc)
            self.pc = (op & 0x7FF)
            cyc = 2
        elif op >> 11 == 0b101:   # GOTO
            self.pc = op & 0x7FF
            cyc = 2
        else:
            k = op & 0xFF
            t = op >> 8
            if t >> 2 == 0b1100:
                self.w = k
            elif t >> 2 == 0b1101:
                self.w = k
                self.pc = self.stack.pop()
                cyc = 2
            elif t == 0b111000:
                self.w = W | k
                self.flags(z=self.w == 0)
            elif t == 0b111001:
                self.w = W & k
                self.flags(z=self.w == 0)
            elif t == 0b111010:
                self.w = W ^ k
                self.flags(z=self.w == 0)
            elif t >> 1 == 0b11110:
                r = k - W
                self.w = r & 0xFF
                self.flags(z=self.w == 0, c=k >= W)
            elif t >> 1 == 0b11111:
                r = k + W
                self.w = r & 0xFF
                self.flags(z=self.w == 0, c=r > 255)
            else:
                raise SystemExit(f"unknown op {op:04x}")
        if self.pcw:
            cyc = 2
        self.cycles += cyc


# ---------------------------------------------------------------------------------------------
class Board:
    """The pins around the PIC: MAX7219 shift register, tone pins, dial switches, MT8870."""

    def __init__(self, hexfile):
        self.p = Pic(hexfile)
        self.p.on_port = self.port
        self.regs = {}
        self.shift = 0
        self.nbits = 0
        self.prev_a = 0
        self.edges = []     # (cycle, pins) on RB2/RB3
        self.prev_tone = 0
        self.talk = False

    def port(self):
        p = self.p
        a = p.latch_a
        if (a & 4) and not (self.prev_a & 4):      # CLK rising
            self.shift = ((self.shift << 1) | ((a >> 1) & 1)) & 0xFFFF
            self.nbits += 1
        if (a & 8) and not (self.prev_a & 8):      # LOAD rising: latch
            if self.nbits >= 16:
                self.regs[(self.shift >> 8) & 0x0F] = self.shift & 0xFF
            self.nbits = 0
        if not (a & 8) and (self.prev_a & 8):
            self.nbits = 0
        self.prev_a = a
        tone = (p.latch_b >> 2) & 3
        if tone != self.prev_tone:
            self.edges.append((p.cycles, tone))
            self.prev_tone = tone

    def run(self, seconds):
        end = self.p.cycles + int(seconds * FCY)
        while self.p.cycles < end:
            self.p.step()

    def set_pulse(self, closed):
        self.p.ext_b = (self.p.ext_b & ~1) | (0 if closed else 1)

    def set_off(self, off_rest_displaced):
        self.p.ext_b = (self.p.ext_b & ~2) | (2 if not off_rest_displaced else 0)

    def set_mt(self, std, q):
        a = self.p.ext_a
        self.p.ext_a = (a & ~0x10) | (0x10 if std else 0)
        self.p.ext_b = (self.p.ext_b & 0x0F) | (q << 4)

    def set_talk(self, on):
        self.p.ext_a = (self.p.ext_a & ~1) | (1 if on else 0)

    def dial(self, n, pulse_ms=33, gap_ms=67):
        self.set_off(True)
        self.run(0.3)
        for _ in range(n):
            self.set_pulse(True)
            self.run(pulse_ms / 1000)
            self.set_pulse(False)
            self.run(gap_ms / 1000)
        self.set_off(False)

    def display(self):
        return [self.regs.get(r, None) for r in range(8, 0, -1)]


def goertzel(samples, fs, f):
    w = 2 * math.pi * f / fs
    c = 2 * math.cos(w)
    s1 = s2 = 0.0
    for x in samples:
        s = x + c * s1 - s2
        s2, s1 = s1, s
    return math.sqrt(s1 * s1 + s2 * s2 - c * s1 * s2) / len(samples)


def tone_spectrum(edges, c0, c1):
    """Sum of the two pins (equal resistors) sampled at 40 kHz between cycles c0 and c1."""
    fs = 40000
    n = int((c1 - c0) / FCY * fs)
    out = []
    j = 0
    state = 0
    for k in range(n):
        t = c0 + k * FCY / fs
        while j < len(edges) and edges[j][0] <= t:
            state = edges[j][1]
            j += 1
        out.append(((state & 1) + ((state >> 1) & 1)) / 2 - 0.5)
    res = {}
    for f in (697, 770, 852, 941, 1209, 1336, 1477, 1633):
        res[f] = goertzel(out, fs, f)
    return res


ok = True


def check(name, cond, info=""):
    global ok
    print(("PASS " if cond else "FAIL ") + name + (" " + str(info) if info else ""))
    ok = ok and cond


def main(hexfile):
    b = Board(hexfile)
    b.set_pulse(False)
    b.set_off(False)
    b.run(0.4)
    check("start-up: MAX7219 set up (normal, BCD, 8 digits)", b.regs.get(0xC) == 1 and b.regs.get(9) == 0xFF and b.regs.get(0xB) == 7, b.regs)
    check("start-up: dash at the left, other digits blank", b.display() == [0x0A] + [0x0F] * 7, b.display())

    for label, pulse, gap in (("normal dial", 33, 67), ("fast printed dial", 8, 14)):
        b2 = Board(hexfile)
        b2.set_pulse(False)
        b2.set_off(False)
        b2.run(0.4)
        e0 = len(b2.edges)
        b2.dial(3, pulse, gap)
        c_start = b2.p.cycles
        b2.run(0.5)
        check(f"{label}: 3 pulses show 3 on the left", b2.display()[0] == 3, b2.display())
        if label == "normal dial":
            ed = b2.edges[e0:]
            if ed:
                c0, c1 = ed[0][0], ed[-1][0]
                spec = tone_spectrum(ed, c0, c1)
                top = sorted(spec, key=spec.get, reverse=True)[:2]
                check("digit 3 tone is 697 + 1477 Hz", sorted(top) == [697, 1477], {k: round(v, 3) for k, v in spec.items()})
                check("tone lasts about 100 ms", 0.09 < (c1 - c0) / FCY < 0.12, round((c1 - c0) / FCY, 3))
            else:
                check("tone produced", False)

    # every digit's tone pair
    rows = {1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 1, 7: 2, 8: 2, 9: 2, 0: 3}
    cols = {1: 0, 2: 1, 3: 2, 4: 0, 5: 1, 6: 2, 7: 0, 8: 1, 9: 2, 0: 1}
    RF = [697, 770, 852, 941]
    CF = [1209, 1336, 1477, 1633]
    b3 = Board(hexfile)
    b3.set_pulse(False)
    b3.set_off(False)
    b3.run(0.4)
    good = 0
    for d in (1, 2, 4, 5, 6, 7, 8, 9, 0):
        e0 = len(b3.edges)
        b3.dial(d if d else 10)
        b3.run(0.4)
        ed = b3.edges[e0:]
        spec = tone_spectrum(ed, ed[0][0], ed[-1][0])
        top = sorted(sorted(spec, key=spec.get, reverse=True)[:2])
        if top == sorted([RF[rows[d]], CF[cols[d]]]):
            good += 1
        else:
            print("   digit", d, "got", top)
    check("every dialed digit sends the right DTMF pair (9 more digits)", good == 9, good)
    check("display shows 1 2 3 .. in order, 0 from 10 pulses", b3.display()[:9 - 1] == [1, 2, 4, 5, 6, 7, 8, 9], b3.display())

    # receiving a digit from the MT8870 (Q = 5)
    b4 = Board(hexfile)
    b4.set_pulse(False)
    b4.set_off(False)
    b4.run(0.4)
    b4.set_mt(True, 5)
    b4.run(0.1)
    b4.set_mt(False, 5)
    b4.run(0.1)
    b4.set_mt(True, 10)   # code 10 = digit 0
    b4.run(0.1)
    b4.set_mt(False, 10)
    b4.run(0.1)
    check("received 5 then 0 appear on the display", b4.display()[:2] == [5, 0], b4.display())
    # TALK held: receiver muted, decimal point on the left digit
    b4.set_talk(True)
    b4.run(0.05)
    b4.set_mt(True, 7)
    b4.run(0.1)
    b4.set_mt(False, 7)
    b4.run(0.05)
    check("TALK held: a received digit is ignored", b4.display()[:3] == [5 | 0x80, 0, 0x0F], b4.display())
    check("TALK held: decimal point on the left digit", b4.display()[0] & 0x80 != 0)
    b4.set_talk(False)
    b4.run(0.05)
    check("TALK released: decimal point off", b4.display()[0] == 5, b4.display())
    # junk: 11 pulses does nothing
    b5 = Board(hexfile)
    b5.set_pulse(False)
    b5.set_off(False)
    b5.run(0.4)
    b5.dial(11)
    b5.run(0.5)
    check("11 pulses is ignored", b5.display()[0] == 0x0A, b5.display())
    print("ALL PASSED" if ok else "SOME FAILED")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
