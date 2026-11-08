# 2.00 → 2.02

Why this pair: required: what 2.02 changed (2.00 is the only earlier 2.x held; no 2.01).

Old: `archive:game-maker_blinky-2.zip@1dcea7c24df8edca1f96ff9341f40bdadc6788a0ca9563595ac5cb52e98b22c8!BLINKY2.EXE` (sha256 `48375bfed6986342…`)
New: `archive:game-maker_arcade-ricky-2_shareware-games-galore.zip@a42b6b25e691302ac47811e9d1ed2153f78f05b5fdcf92309c0ccfaf09e8abf4!RICKY2.EXE` (sha256 `c57bd17579c48d86…`)

## Functions

| status       | count |
| ------------ | ----- |
| identical    | 298   |
| relocated    | 94    |
| calls-differ | 0     |
| data-moved   | 5     |
| constants    | 4     |
| changed      | 10    |
| removed      | 0     |
| added        | 0     |

Matched 411 of 411 old and 411 new functions; 0 matches are low confidence (call-graph or order matches under 0.7 similarity).

Matched by stage: bytes 292, norm 92, strings 9, shape 5, callgraph 11, order 2, similarity 0.

Statuses: _identical_ = same bytes with relocations masked and the same matched callees; _relocated_ = same code once addresses, segments and string pointers are abstracted; _calls-differ_ = same code but calling different (or unmatched) functions; _data-moved_ = same instruction shape, and every differing immediate moved by an offset shift that at least three matched functions share (the data layout moved); _constants_ = same instruction shape with other immediates or strings; _changed_ = instructions differ (norm_sim is the share of matching normalized instructions). Full table: `functions.tsv`. The string hint is the rarest string the function appears to point at; an immediate can equal a string offset by coincidence.

### Changed functions (least similar first, up to 60)

| old       | new       | sizes     | sim             | method    | name | string hint                |
| --------- | --------- | --------- | --------------- | --------- | ---- | -------------------------- |
| 03B4:02B1 | 03B4:02B1 | 837→879   | 0.91 changed    | strings   |      | GMtitle.gif                |
| 03B4:17A2 | 03B4:17FE | 482→526   | 0.95 changed    | strings   |      | I cannot save your game!   |
| 0E59:13F9 | 0E63:13FF | 506→518   | 0.96 changed    | callgraph |      |                            |
| 03B4:124F | 03B4:12A9 | 1363→1365 | 0.97 changed    | strings   |      | You have not saved a game! |
| 13DE:01A3 | 13E9:01A9 | 125→125   | 0.98 data-moved | shape     |      |                            |
| 03B4:0FD8 | 03B4:1024 | 611→625   | 0.98 changed    | callgraph |      |                            |
| 11A5:0552 | 11B0:0558 | 205→205   | 0.99 data-moved | strings   |      | ATI ULTRA                  |
| 03B4:0C0E | 03B4:0C4C | 958→972   | 0.99 changed    | callgraph |      |                            |
| 03B4:2558 | 03B4:25E0 | 975→989   | 0.99 changed    | callgraph |      | Choose object to drop      |
| 0E59:0D59 | 0E63:0D5F | 275→275   | 0.99 data-moved | shape     |      |                            |
| 03B4:7580 | 03B4:7616 | 978→992   | 0.99 changed    | strings   |      | map\                       |
| 03B4:096C | 03B4:099C | 674→688   | 0.99 changed    | strings   |      | .txt                       |
| 1253:0265 | 125F:025B | 378→378   | 0.99 constants  | shape     |      |                            |
| 0E59:0C02 | 0E63:0C08 | 343→343   | 0.99 constants  | strings   |      | %s*.*                      |
| 0D87:0004 | 0D91:0008 | 189→191   | 0.99 changed    | callgraph |      |                            |
| 03B4:000E | 03B4:000E | 675→675   | 1.00 constants  | strings   |      | ShowVideoMemory            |
| 1339:0000 | 1344:0006 | 549→549   | 1.00 data-moved | shape     |      |                            |
| 03B4:267E | 03B4:2714 | 767→767   | 1.00 constants  | shape     |      | Choose object to drop      |
| 0E59:0008 | 0E63:000E | 2231→2231 | 1.00 data-moved | strings   |      | (E)xit.                    |

## Header and layout

| field                                                                        | old                                                                    | new                                                                    |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| file_size                                                                    | 154980                                                                 | 155156 **≠**                                                           |
| image_size                                                                   | 148836                                                                 | 149012 **≠**                                                           |
| header_bytes                                                                 | 6144                                                                   | 6144                                                                   |
| relocations                                                                  | 1094                                                                   | 1105 **≠**                                                             |
| entry_cs_ip                                                                  | 0003:0004                                                              | 0003:0004                                                              |
| stack_ss_sp                                                                  | 2460:0080                                                              | 246B:0080 **≠**                                                        |
| min_max_alloc_paras                                                          | 18/65535                                                               | 18/65535                                                               |
| overlay_bytes                                                                | 0                                                                      | 0                                                                      |
| header_0x1c                                                                  | 0100fb50                                                               | 0100fb50                                                               |
| linker                                                                       | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) |
| compiler                                                                     | Borland C++ - Copyright 1991 Borland Intl.                             | Borland C++ - Copyright 1991 Borland Intl.                             |
| version_string                                                               | 2.00                                                                   | 2.02 **≠**                                                             |
| stamp_slot                                                                   | stamped (contents masked)                                              | stamped (contents masked)                                              |
| packer                                                                       |                                                                        |                                                                        |
| DGROUP paragraph                                                             | 149E                                                                   | 14A9 **≠**                                                             |
| code region bytes (before DGROUP)                                            | 84448                                                                  | 84624 **≠**                                                            |
| code segments referenced by relocations                                      | 22                                                                     | 22                                                                     |
| functions found                                                              | 411                                                                    | 411                                                                    |
| bytes inside functions                                                       | 79968                                                                  | 80140 **≠**                                                            |
| code-region bytes outside functions (far data, tables, padding, missed code) | 4480                                                                   | 4484 **≠**                                                             |
| data bytes from DGROUP to image end                                          | 64388                                                                  | 64388                                                                  |

MZ has no linker timestamp, import table or resource section. The closest analogues follow: DOS and BIOS services called, I/O ports touched, and recognizable embedded files.

## DOS/BIOS services (int, with AH when set just before)

No difference (70 uses in each).

## I/O ports (in/out)

No difference (129 uses in each).

## Embedded files

Old: none found.
New: none found.

## Data (DGROUP to end of image, relocations masked, aligned on NUL-ended and content-defined runs)

equal_bytes 64374, new_bytes_changed 14, old_bytes_changed 14, replace 1

| kind    | old offset | old bytes | new offset | new bytes | old preview                     | new preview                     |
| ------- | ---------- | --------- | ---------- | --------- | ------------------------------- | ------------------------------- |
| replace | 0977B      | 14        | 0977B      | 14        | (text: see the strings section) | (text: see the strings section) |

## Strings (text-like printable runs of 4+ bytes in the whole image, owner stamp masked)

3 only in old, 3 only in new (a multiset difference, so a repeated string can appear once). Runs that look like machine code (no three letters in a row or a format specifier) are left out. Addresses and phone numbers are redacted.

### Only in old (up to 150)

```text
          Version 2.00
-NYj
]EYW
```

### Only in new (up to 150)

```text
          Version 2.02
gNYj
kEYW
```
