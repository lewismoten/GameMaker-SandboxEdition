#!/usr/bin/env python3
"""Plain-python check of a KiCad s-expression file before any KiCad tool opens it.

Checks balanced parentheses, closed strings, the top-level header, and prints the set of
distinct child tokens so they can be compared with a file KiCad wrote itself.
usage: sexp_check.py file [--tokens]
"""
import re
import sys


def check(path, show=False):
    s = open(path).read()
    toks = re.findall(r'"(?:\\.|[^"\\])*"|\(|\)|[^\s()"]+', s)
    if s.count('"') - s.count('\\"') < 0:
        raise SystemExit("bad strings")
    depth, stack, seen = 0, [], {}
    for i, t in enumerate(toks):
        if t == "(":
            depth += 1
            stack.append(toks[i + 1] if i + 1 < len(toks) else "?")
            key = (stack[-2] if len(stack) > 1 else "", stack[-1])
            seen[key] = seen.get(key, 0) + 1
        elif t == ")":
            depth -= 1
            stack.pop()
            if depth < 0:
                raise SystemExit(f"unbalanced ) at token {i}")
    if depth:
        raise SystemExit(f"unbalanced: {depth} open")
    if not toks[1].startswith("kicad_"):
        raise SystemExit("bad header")
    print(f"{path}: ok, {len(toks)} tokens, header {toks[1]}")
    if show:
        for (p, c), n in sorted(seen.items()):
            print(f"  {p} > {c}: {n}")


if __name__ == "__main__":
    check(sys.argv[1], "--tokens" in sys.argv)
