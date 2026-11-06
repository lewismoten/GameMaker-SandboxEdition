"""Match functions between an older and a newer player build.

Stages, each pairing only functions that are unique on the key used, so one ambiguous
function never steals another's partner:
  1. exact bytes (relocation words masked)          -> method "bytes"
  2. normalized text (addresses abstracted)         -> "norm"
  3. the set of string literals referenced          -> "strings"
  4. instruction shape (constants abstracted)       -> "shape"
  5. call-graph neighbours of matched functions     -> "callgraph" (callees, then callers)
  6. address-order gaps between matched anchors     -> "order"
  7. best mutual similarity of whatever is left     -> "similarity"
Each match is then graded: identical, relocated (same code, things moved), calls-differ,
data-moved (every differing immediate moved by a shift that at least three
matched functions share: the data layout moved), constants (same shape, other numbers or strings) or changed, with a similarity ratio.
"""

from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .disasm import Function


@dataclass
class Match:
    a: Function  # in the old build
    b: Function  # in the new build
    method: str
    status: str = ""
    sim: float = 1.0


class Matcher:
    def __init__(self, old, new):
        self.A, self.B = old, new  # disasm.Program
        self.ab: dict[int, int] = {}
        self.ba: dict[int, int] = {}
        self.method: dict[int, str] = {}
        self.callersA = _callers(old)
        self.callersB = _callers(new)
        self._bags: dict[tuple[int, int], Counter] = {}

    def pair(self, a: int, b: int, method: str) -> bool:
        if a in self.ab or b in self.ba:
            return False
        self.ab[a], self.ba[b], self.method[a] = b, a, method
        return True

    def free(self):
        return [k for k in self.A.funcs if k not in self.ab], [k for k in self.B.funcs if k not in self.ba]

    def by_key(self, key, method: str, min_size: int = 0) -> int:
        fa, fb = self.free()
        ka, kb = {}, {}
        for k in fa:
            f = self.A.funcs[k]
            if f.size >= min_size and (v := key(f)) is not None:
                ka.setdefault(v, []).append(k)
        for k in fb:
            f = self.B.funcs[k]
            if f.size >= min_size and (v := key(f)) is not None:
                kb.setdefault(v, []).append(k)
        n = 0
        for v, la in ka.items():
            lb = kb.get(v)
            if lb and len(la) == 1 and len(lb) == 1:
                n += self.pair(la[0], lb[0], method)
        return n

    def sim(self, a: int, b: int) -> float:
        fa, fb = self.A.funcs[a], self.B.funcs[b]
        sa, sb = [i.shape for i in fa.insns], [i.shape for i in fb.insns]
        m = SequenceMatcher(None, sa, sb, autojunk=False)
        if m.real_quick_ratio() < 0.4 or m.quick_ratio() < 0.4:
            return 0.0
        return m.ratio()

    def neighbours(self, edgesA, edgesB, method: str, floor: float) -> int:
        n = 0
        for a, b in list(self.ab.items()):
            la, lb = _dedupe(edgesA(a)), _dedupe(edgesB(b))
            ua = [x for x in la if x in self.A.funcs and x not in self.ab]
            ub = [x for x in lb if x in self.B.funcs and x not in self.ba]
            if not ua or not ub:
                continue
            labA = [f"M{self.ab[x]}" if x in self.ab else "U" for x in la]
            labB = [f"M{x}" if x in self.ba else "U" for x in lb]
            for tag, i1, i2, j1, j2 in SequenceMatcher(None, labA, labB, autojunk=False).get_opcodes():
                if tag == "equal":
                    rng = zip(range(i1, i2), range(j1, j2))
                elif tag == "replace" and i2 - i1 == j2 - j1:
                    rng = zip(range(i1, i2), range(j1, j2))
                else:
                    continue
                for i, j in rng:
                    x, y = la[i], lb[j]
                    if x in self.A.funcs and y in self.B.funcs and x not in self.ab and y not in self.ba:
                        if self.sim(x, y) >= floor:
                            n += self.pair(x, y, method)
        return n

    def order_gaps(self, floor: float) -> int:
        anchors = sorted(self.ab.items())
        n = 0
        for (a0, b0), (a1, b1) in zip(anchors, anchors[1:]):
            if b1 <= b0:
                continue
            ga = [k for k in self.A.funcs if a0 < k < a1 and k not in self.ab]
            gb = [k for k in self.B.funcs if b0 < k < b1 and k not in self.ba]
            if ga and len(ga) == len(gb):
                for x, y in zip(sorted(ga), sorted(gb)):
                    if self.sim(x, y) >= floor:
                        n += self.pair(x, y, "order")
        return n

    def _bag(self, prog, k: int) -> Counter:
        key = (id(prog), k)
        if key not in self._bags:
            self._bags[key] = Counter(i.shape for i in prog.funcs[k].insns)
        return self._bags[key]

    def leftovers(self, floor: float, keep: int = 4) -> int:
        """Mutual best similarity. A token-bag overlap (an upper bound of the ratio) picks
        each function's few best candidates before the quadratic sequence comparison."""
        fa, fb = self.free()
        best_a, best_b = {}, {}
        cand: dict[int, list[int]] = {}
        for a in fa:
            sa = self.A.funcs[a].size
            ba, na = self._bag(self.A, a), len(self.A.funcs[a].insns)
            scored = []
            for b in fb:
                sb = self.B.funcs[b].size
                if not sa or not sb or not 0.5 <= sa / sb <= 2.0:
                    continue
                bb, nb = self._bag(self.B, b), len(self.B.funcs[b].insns)
                small, big = (ba, bb) if len(ba) < len(bb) else (bb, ba)
                ub = 2 * sum(min(v, big.get(t, 0)) for t, v in small.items()) / (na + nb)
                if ub >= floor:
                    scored.append((ub, b))
            cand[a] = [b for _, b in sorted(scored, reverse=True)[:keep]]
        for a, bs in cand.items():
            for b in bs:
                s = self.sim(a, b)
                if s >= floor:
                    if s > best_a.get(a, (0, None))[0]:
                        best_a[a] = (s, b)
                    if s > best_b.get(b, (0, None))[0]:
                        best_b[b] = (s, a)
        n = 0
        for a, (s, b) in best_a.items():
            if best_b.get(b, (0, None))[1] == a:
                n += self.pair(a, b, "similarity")
        return n

    def run(self) -> dict[str, int]:
        A, B = self.A, self.B
        counts = {
            "bytes": self.by_key(lambda f: f.exact, "bytes"),
            "norm": self.by_key(lambda f: f.normh, "norm") + self.by_key(lambda f: f.rawnormh, "norm"),
            "strings": self.by_key(lambda f: tuple(sorted(set(f.strings))) or None, "strings", 8),
            "shape": self.by_key(lambda f: f.shapeh, "shape", 8),
        }
        counts["callgraph"] = 0
        for _ in range(10):
            n = self.neighbours(lambda a: A.funcs[a].callees, lambda b: B.funcs[b].callees, "callgraph", 0.5)
            n += self.neighbours(lambda a: self.callersA.get(a, []), lambda b: self.callersB.get(b, []), "callgraph", 0.5)
            n += self.by_key(lambda f: f.normh, "norm") + self.by_key(lambda f: f.shapeh, "shape", 8)
            counts["callgraph"] += n
            if not n:
                break
        counts["order"] = self.order_gaps(0.4)
        counts["similarity"] = self.leftovers(0.5)
        return counts

    def results(self) -> tuple[list[Match], list, list]:
        out = []
        shape_pairs = [(self.A.funcs[a], self.B.funcs[b]) for a, b in self.ab.items()]
        shifts = self.data_shifts([(x, y) for x, y in shape_pairs if x.shapeh == y.shapeh and x.rawnormh != y.rawnormh])
        for a, b in sorted(self.ab.items()):
            fa, fb = self.A.funcs[a], self.B.funcs[b]
            m = Match(fa, fb, self.method[a])
            mapped = [self.ab.get(c, ("?", c)) for c in fa.callees]
            calls_same = mapped == list(fb.callees)
            same_norm = fa.normh == fb.normh or fa.rawnormh == fb.rawnormh
            if fa.exact == fb.exact and same_norm and calls_same:
                m.status = "identical"
            elif same_norm:
                m.status = "relocated" if calls_same else "calls-differ"
            elif fa.shapeh == fb.shapeh:
                d = self._imm_deltas(fa, fb)
                m.status = "data-moved" if d and set(d) <= shifts else "constants"
            else:
                m.status = "changed"
            if m.status not in ("identical", "relocated"):
                na, nb = [i.norm for i in fa.insns], [i.norm for i in fb.insns]
                m.sim = round(SequenceMatcher(None, na, nb, autojunk=False).ratio(), 3)
            out.append(m)
        fa, fb = self.free()
        return out, [self.A.funcs[k] for k in sorted(fa)], [self.B.funcs[k] for k in sorted(fb)]


    def _imm_deltas(self, fa, fb) -> list[int] | None:
        """(new - old) for each differing immediate of two same-shape functions, or None
        when the differences are not all immediates."""
        out = []
        for x, y in zip(fa.insns, fb.insns):
            if x.rawnorm == y.rawnorm:
                continue
            ta, tb = _imms(x.rawnorm), _imms(y.rawnorm)
            if len(ta) != len(tb) or _imm_re.sub("#", x.rawnorm) != _imm_re.sub("#", y.rawnorm):
                return None
            out += [(vb - va) & 0xFFFF for va, vb in zip(ta, tb) if va != vb and va >= 0x100]
            if any(va != vb and va < 0x100 for va, vb in zip(ta, tb)):
                return None
        return out

    def data_shifts(self, pairs) -> set[int]:
        """The DGROUP layout shifts of this pair: deltas shared by many same-shape matches."""
        c = Counter()
        for fa, fb in pairs:
            d = self._imm_deltas(fa, fb)
            if d:
                c.update(set(d))
        return {k for k, v in c.items() if v >= 3}


_imm_re = re.compile(r"(?<![\w\[+-])0x[0-9a-f]+")


def _imms(text: str) -> list[int]:
    return [int(t, 16) for t in _imm_re.findall(text)]


def _callers(prog) -> dict[int, list[int]]:
    out: dict[int, list[int]] = {}
    for k in sorted(prog.funcs):
        for c in prog.funcs[k].callees:
            out.setdefault(c, []).append(k)
    return out


def _dedupe(xs):
    seen, out = set(), []
    for x in xs:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out
