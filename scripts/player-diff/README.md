# Player machine-code diff

Research tooling for one question: what did each Game-Maker player build change in its
machine code? It finds every player copy held, files it by build, disassembles the
canonical copy of each build, matches functions across builds and writes per-pair reports.
It only reads binaries; it never runs them and never commits them.

Results: [`docs/analysis/player-diff/`](../../docs/analysis/player-diff/README.md).

## Run it

```sh
uv run scripts/player-diff/gmpdiff.py all          # inventory, then every pair in builds.toml
uv run scripts/player-diff/gmpdiff.py inventory    # only find, unpack and file the copies
uv run scripts/player-diff/gmpdiff.py diff         # only the pairs (needs a prior inventory)
uv run scripts/player-diff/gmpdiff.py diff --pair 2.00 2.02   # one pair; build ids from builds.toml
uv run --with capstone==5.0.7 python -m unittest discover -s scripts/player-diff/tests   # self-test
```

`uv` reads the dependency (Capstone 5.0.7, pinned in the script header) and runs Python 3.11+.
The run takes about 30 seconds.

Options:

- `--reference <dir>`: optional local corpus containing `reference/archive/`.
  Supply it explicitly; no private folder is discovered automatically. Without it only
  repository players (`cd/gm/`, `runtime/run/GM/`) are found. Earlier builds remain missing.
- `--work <dir>` (or `$GMPD_WORK`): cache for the extracted binaries, full listings and
  per-function diffs. Default `~/.cache/gm-player-diff`. Never inside the repository.
- `--out <dir>`: the committed text outputs. Default `docs/analysis/player-diff/`.
- `--deark <path>` (or `$DEARK`, or `deark` on `PATH`): unpacks PKLITE, EXEPACK and LZEXE
  copies. Optional; without it packed copies are listed but not compared. Tested with
  Deark 1.7.3 (commit `b26a76468ed2b66e29de07239c0067e0fba21186`):
  `git clone https://github.com/jsummers/deark && make -C deark`.

## What it writes

Committed (`--out`, small text only):

| file                               | what                                                                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `inventory.md`, `inventory.tsv`    | one row per build: canonical copy, SHA-256, sizes, MZ header fields, linker mark, compiler banner, packer, owner-slot state, predecessor; pairs; what is missing         |
| `copies.tsv`                       | every copy found, with its relation to its build's canonical copy                                                                                                        |
| `pairs.md`                         | function counts for every pair                                                                                                                                           |
| `pairs/<old>__<new>/summary.md`    | functions by status, the least-similar changed functions, added and removed functions, header and layout, DOS services, I/O ports, embedded files, data regions, strings |
| `pairs/<old>__<new>/functions.tsv` | the full match table                                                                                                                                                     |

Work folder only (not committed): `bin/<build>/*.exe` (extracted copies), `copies.json`,
`canonical.json`, `listings/<build>.lst` (every function, with address, bytes, instruction and
its normalized form) and `pairs/<old>__<new>/<oldlin>_<newlin>.diff` (a unified diff of the
normalized instructions of each changed function).

Look closer at one pair with `inspect_pair.py` (same work folder):

```sh
uv run scripts/player-diff/inspect_pair.py side 2.00 2.02 03B4:124F 03B4:12A9
uv run scripts/player-diff/inspect_pair.py gaps 2.00 2.02
uv run scripts/player-diff/inspect_pair.py maps 2.00 2.02 03B4:7DE4=03B4:7E88
uv run scripts/player-diff/inspect_pair.py dgroup 1.00-xfer 1.04 F42=10B0
uv run scripts/player-diff/inspect_pair.py dis 2.02 03B4:05A0 0848
```

`gaps` includes switch-case bodies, sparse switch tables, interrupt handlers and padding
outside discovered functions. Gaps pair by the k-th gap after the same matched function;
mis-decoded owning functions can give a wrong partner. Large RESIDUAL and UNPAIRED gaps
need manual inspection. `dgroup` checks data offsets as `maps` checks code addresses;
zero-filled variables align arbitrarily and need other evidence, such as reference counts.

Read a changed function with its diff, then the two listings:

```sh
W=~/.cache/gm-player-diff
less $W/pairs/2.00__2.02/03DF1_03DF1.diff      # <old_lin>_<new_lin> columns of functions.tsv
grep -n -A60 '^; ---- 03B4:02B1' $W/listings/2.02.lst
```

## How it works

| module            | job                                                                                                                                                                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `builds.toml`     | the known builds (by MZ load-image size) and the pairs, in name-propagation order                                                                                                                                                                                                                                      |
| `gmpd/collect.py` | walks the roots, opens zips (nested one level; PKZIP 1.x Implode/Shrink through Info-ZIP `unzip`), unpacks with Deark, files each copy, picks a canonical copy per build                                                                                                                                               |
| `gmpd/mz.py`      | MZ header, load image, relocations, packer signatures, TLINK mark, owner slot                                                                                                                                                                                                                                          |
| `gmpd/disasm.py`  | function discovery and normalization (below)                                                                                                                                                                                                                                                                           |
| `gmpd/mapfile.py` | reads Borland `.MAP` files and applies names only where they verifiably fit                                                                                                                                                                                                                                            |
| `gmpd/match.py`   | function matching across two builds                                                                                                                                                                                                                                                                                    |
| `gmpd/report.py`  | the per-pair reports, data/string/service diffs, redaction                                                                                                                                                                                                                                                             |
| `inspect_pair.py` | after a run: side-by-side functions, gaps, pointer mapping, raw disassembly                                                                                                                                                                                                                                            |
| `attribute.py`    | one pair, after `gmpdiff.py diff`: which link module (source file) each function is in, by pairing the binary's code segments with two `.MAP` files' segment lists; MAP names on both sides; every byte outside functions classified; added/removed functions that are undiscovered code on the other side (see below) |
| `srcmap.py`       | one module of one pair: each function attributed to a source function of two source revisions (string anchors, MAP names and definition order), and whether that function's source changed                                                                                                                             |

**Builds and canonical copies.** A build is recognized by its load-image size, a "Version"
string is recorded as a cross-check. Copies that differ only in the 52-byte owner slot at
load-image offset 0 (`code/GM/REGSPACE.ASM`) are the same build; the slot is zeroed before any
comparison and its contents (1990s buyers' names and serials) are never printed. The canonical
copy is the repository file where one exists (3.00), else the largest group of identical
copies.

**Disassembly.** 16-bit real mode, Capstone. The players are Borland C++ large-model programs:
the entry's `mov dx, DGROUP` (a relocated word) gives the data segment, everything below it is
the code region, and every relocated word names a segment. Functions are found by recursive
descent from the entry, near calls, far calls (`9A`), far code pointers stored in data, and
Borland prologues (`push bp; mov bp,sp`, `enter`) in code nothing else reached; switch jump
tables (`jmp cs:[bx+table]`) are followed when a preceding `cmp` bounds them. A second pass
cuts every body at the final set of function starts.

**Normalization.** Each instruction gets three forms. _exact_: raw bytes with relocated words
zeroed. _norm_: call targets become `F`, relocated segments `SEG:C` or `SEG:D`, absolute data
addresses `[G]`, immediates that point at a string in DGROUP become the string's text,
in-function jumps become relative instruction labels; other constants stay. _shape_: mnemonic
and operand kinds only.

**Matching** (old → new), each stage pairing only functions unique on its key: exact bytes,
norm text, the set of referenced strings, shape, then call-graph neighbours of matched pairs
(callees and callers, aligned in call order), then functions in the same address gap between
two matched anchors, then the best mutual similarity of what is left. A match is graded
_identical_, _relocated_ (same code, things moved), _calls-differ_, _data-moved_ (same shape;
every differing immediate moved by a shift that at least three matched functions share, so
the data layout moved),
_constants_ (same shape, other numbers or strings) or _changed_, with `norm_sim` (the share of matching normalized
instructions). Matches from the first four stages are high confidence; call-graph, order and
similarity matches are medium at 0.7 or more, otherwise low. Treat low ones as leads.

**Non-code differences.** MZ has no import table, resources or linker timestamp, so the
reports give the closest analogues: DOS/BIOS interrupts with the AH value set just before,
I/O ports, recognizable embedded files (BGI drivers and fonts, VOC, GIF, CMF, MIDI), the MZ
header and layout, the data region (DGROUP to the end of the image) aligned on NUL-ended and
content-defined runs with relocations masked, and text-like strings as a multiset difference.

**Names.** `code/GM/PLAYGAME.MAP` (2014 source release) does not describe the CD's
`playgame.exe` byte for byte, so a MAP frame's names are applied only when at least 60% (and
3+) of its public offsets land on discovered function starts in one segment. Names then move
to other builds through high- and medium-confidence matches, in `builds.toml` pair order.

**Privacy.** Public provenance uses repository-relative paths, or
`archive:<basename>@<archive-sha256>!<escaped-member>` (including nested archive members).
Identical archives in different folders share a label; different archives with the same
name are distinguished by their full hash. Loose corpus files use build and file checksum.
Local directory hierarchies stay in work-only caches, never exported.
Committed text never carries an owner stamp; any string that looks like a street
address or phone number is replaced by `[redacted: address or phone]`.

## Module and source attribution

`gmpdiff.py` matches functions but does not say what source file they come from. For a pair
whose link maps are held, two more scripts do; the 3.0 analysis
([`docs/analysis/player-diff-3.0.md`](../../docs/analysis/player-diff-3.0.md)) is built on
them:

```sh
uv run scripts/player-diff/attribute.py --pair 2.04 3.00-xfer \
    --old-map code/GM/XFERPLAY.MAP --new-map code/GM/PLAYGAME.MAP --out docs/analysis/player-diff-3.0
python3 scripts/player-diff/srcmap.py docs/analysis/player-diff-3.0/functions.tsv \
    --module PLAYGAME_TEXT --old 2.04 code/GM/PLAYGAME.BAK --new 3.00-xfer code/GM/PLAYGAME.C \
    --out docs/analysis/player-diff-3.0/playgame-source.tsv
```

`attribute.py` writes `modules.tsv` (each module on each side: segment, MAP length, span,
functions by status, bytes outside functions by kind), `functions.tsv` (every function with
its module, MAP object, name and its origin, match, and `other_side_gap`) and `gaps.tsv`
(every run of code-region bytes no decoded instruction covers, with a kind: zero,
jumptable, switch-body, prologue, eh-table, text, other). A MAP name is placed only when a
run of 3+ publics lands on function starts at one shift, or, in a module whose MAP length
matches the binary, when half its publics do. Publics come from `gmpd/mapfile.read_map`,
which keeps C++ names whose argument lists contain a space (`movewindow(unsigned char)`).
`other_side_gap` is a lead: the best byte similarity (0.4+) between an added or removed
function and a same-sized gap on the other side.

`srcmap.py` needs no Capstone. Its "one of" rows are runs where the binary and source
counts differ; read the listing to settle them.

## Limits

- Function discovery misses code only reached through computed jumps it cannot bound, and
  the prologue scan can start a "function" inside far data (3.0's `PLAYGAME5_DATA` sits
  before DGROUP). The layout table in each summary gives the bytes outside functions.
- Small functions with many look-alikes stay unmatched unless the call graph places them.
- The strings section is a multiset difference of printable runs; a string that moved but
  did not change does not appear.
- Statuses compare machine code. A function graded _relocated_ behaves the same only if the
  data it reads did not change; check the data section too.

The scripts and original analyses were written by Claude Opus 5.5 (Anthropic) for Lewis Moten.
Public-output integration and optional-dependency tests: Hermes, OpenAI Codex GPT-6.1 Sol.

Without Capstone, tests still exercise parsing, owner masking, redaction and provenance;
only disassembly-dependent tests are skipped. Inventory and `srcmap.py` do not need Capstone.
Disassembly commands use the pinned dependency through `uv run`.
