# 3.00-xfer → 3.00-aj

Why this pair: control: the second 3.00 build.

Old: `cd/gm/xferplay.exe` (sha256 `404be3612012488e…`)
New: `archive:game-maker_a-js-quest_gcw-more-wacky-1995.zip@c3d93c372e01564a1206085f39cfbbf1d4493566745fcfaf4c6a0167fb47e2c5!A-J.EXE` (sha256 `467c1960a42271b5…`)

## Functions

| status       | count |
| ------------ | ----- |
| identical    | 229   |
| relocated    | 218   |
| calls-differ | 1     |
| data-moved   | 54    |
| constants    | 43    |
| changed      | 49    |
| removed      | 10    |
| added        | 4     |

Matched 594 of 604 old and 598 new functions; 9 matches are low confidence (call-graph or order matches under 0.7 similarity).

Matched by stage: bytes 221, norm 212, strings 23, shape 82, callgraph 49, order 5, similarity 2.

Statuses: _identical_ = same bytes with relocations masked and the same matched callees; _relocated_ = same code once addresses, segments and string pointers are abstracted; _calls-differ_ = same code but calling different (or unmatched) functions; _data-moved_ = same instruction shape, and every differing immediate moved by an offset shift that at least three matched functions share (the data layout moved); _constants_ = same instruction shape with other immediates or strings; _changed_ = instructions differ (norm_sim is the share of matching normalized instructions). Full table: `functions.tsv`. The string hint is the rarest string the function appears to point at; an immediate can equal a string offset by coincidence.

### Changed functions (least similar first, up to 60)

| old       | new       | sizes     | sim             | method    | name                              | string hint                     |
| --------- | --------- | --------- | --------------- | --------- | --------------------------------- | ------------------------------- |
| 0826:2117 | 082A:21BF | 1721→1146 | 0.55 changed    | callgraph |                                   | Sorry...Out of Memory!          |
| 0826:C119 | 082A:BF7D | 135→61    | 0.59 changed    | callgraph |                                   |                                 |
| 0826:C628 | 082A:C3FD | 173→99    | 0.60 changed    | callgraph |                                   |                                 |
| 0826:A2D3 | 082A:A08B | 193→179   | 0.61 changed    | callgraph |                                   |                                 |
| 1B4D:0375 | 1B59:0375 | 263→198   | 0.62 changed    | callgraph |                                   |                                 |
| 0826:BDD0 | 082A:BB0F | 288→522   | 0.63 changed    | callgraph |                                   |                                 |
| 15BE:18EB | 15B7:19BD | 491→599   | 0.63 changed    | callgraph |                                   | (C)ontinue save (D)o not save   |
| 1781:041E | 1788:0349 | 142→208   | 0.66 changed    | callgraph |                                   |                                 |
| 0826:000E | 082A:014B | 145→156   | 0.69 changed    | callgraph |                                   |                                 |
| 0826:27DC | 082A:2645 | 676→559   | 0.70 changed    | callgraph |                                   |                                 |
| 1546:0005 | 1520:0009 | 108→188   | 0.73 changed    | callgraph |                                   | SOUND                           |
| 0826:2D40 | 082A:2B25 | 2505→2492 | 0.73 changed    | callgraph |                                   | Load Game                       |
| 0826:1B4B | 082A:1B54 | 1484→1643 | 0.75 changed    | strings   |                                   | .gif                            |
| 0000:0183 | 0003:0187 | 19→19     | 0.78 data-moved | shape     |                                   |                                 |
| 15BE:0CDD | 15B7:0D7A | 356→409   | 0.81 changed    | callgraph |                                   |                                 |
| 0826:14EE | 082A:152F | 45→58     | 0.81 changed    | callgraph |                                   | Trident 8900                    |
| 0826:74B2 | 082A:72CC | 210→242   | 0.82 changed    | callgraph |                                   |                                 |
| 1781:00D8 | 1788:00CE | 195→154   | 0.82 changed    | callgraph |                                   | gm.cfg                          |
| 0826:4F56 | 082A:4CE6 | 1651→1789 | 0.82 changed    | callgraph |                                   |                                 |
| 0826:2B96 | 082A:2973 | 426→434   | 0.82 changed    | callgraph |                                   | Empty                           |
| 0826:4056 | 082A:3DFF | 559→533   | 0.82 changed    | strings   |                                   | Missing File:                   |
| 0826:C1F2 | 082A:C00C | 320→262   | 0.84 changed    | callgraph |                                   |                                 |
| 1BA8:020A | 1BAF:0210 | 189→175   | 0.84 changed    | order     |                                   |                                 |
| 1953:000B | 1951:0008 | 134→134   | 0.85 constants  | strings   |                                   | Standard                        |
| 0826:0347 | 082A:0340 | 931→1034  | 0.85 changed    | callgraph |                                   | ShowVideoMemory                 |
| 0826:3709 | 082A:34E1 | 942→876   | 0.86 changed    | strings   |                                   | Save Game                       |
| 1BA8:0102 | 1BAF:0111 | 264→255   | 0.86 changed    | callgraph |                                   | MicroChannel Bus Detected!\n    |
| 0826:07EA | 082A:084A | 503→493   | 0.87 changed    | callgraph |                                   |                                 |
| 1546:03DC | 1520:0430 | 19→12     | 0.88 changed    | callgraph |                                   |                                 |
| 0826:9BDF | 082A:999A | 99→87     | 0.88 changed    | callgraph |                                   |                                 |
| 0826:C9CF | 082A:C75A | 100→80    | 0.88 changed    | callgraph |                                   |                                 |
| 0000:3593 | 0003:3597 | 31→31     | 0.89 data-moved | shape     |                                   |                                 |
| 0826:2A94 | 082A:2888 | 258→235   | 0.89 changed    | callgraph |                                   | .dat                            |
| 1781:06F7 | 1788:0664 | 46→46     | 0.90 constants  | shape     |                                   |                                 |
| 1546:0430 | 1520:043C | 119→107   | 0.90 changed    | callgraph |                                   |                                 |
| 0826:BD21 | 082A:BA60 | 50→50     | 0.91 constants  | shape     |                                   |                                 |
| 17F8:07A5 | 17F6:07A2 | 48→48     | 0.91 data-moved | shape     |                                   |                                 |
| 0826:1548 | 082A:1569 | 1489→1465 | 0.91 changed    | strings   |                                   | %sdata%d.rec                    |
| 0000:3502 | 0003:3506 | 145→145   | 0.91 data-moved | strings   |                                   | Unknown error                   |
| 0826:A4BD | 082A:A267 | 892→788   | 0.92 changed    | callgraph |                                   |                                 |
| 0826:9B10 | 082A:98CB | 118→118   | 0.92 constants  | shape     |                                   |                                 |
| 0826:0758 | 082A:07B8 | 146→146   | 0.92 constants  | strings   |                                   | data*.rec                       |
| 0826:91F8 | 082A:8FD7 | 181→144   | 0.92 changed    | callgraph |                                   |                                 |
| 0826:09E1 | 082A:0A37 | 1009→1017 | 0.92 changed    | callgraph |                                   |                                 |
| 0000:081F | 0003:0823 | 101→101   | 0.93 constants  | shape     |                                   |                                 |
| 0826:3CFB | 082A:3AA4 | 205→205   | 0.93 data-moved | strings   |                                   | No game-specific help included. |
| 0826:AC35 | 082A:A985 | 3364→3351 | 0.93 changed    | callgraph |                                   | config.hlp                      |
| 0826:BFF7 | 082A:BE6A | 290→275   | 0.93 changed    | callgraph |                                   |                                 |
| 0000:375D | 0003:3761 | 24→24     | 0.93 data-moved | shape     |                                   |                                 |
| 0826:A8E3 | 082A:A625 | 850→864   | 0.94 changed    | callgraph |                                   | Auto-Detect                     |
| 0826:9D3B | 082A:9AF3 | 85→85     | 0.94 data-moved | shape     |                                   |                                 |
| 0000:47CB | 0003:47CF | 83→83     | 0.94 constants  | shape     |                                   |                                 |
| 0826:C516 | 082A:C2F6 | 150→139   | 0.94 changed    | callgraph |                                   |                                 |
| 0000:2AA8 | 0003:2AAC | 77→77     | 0.94 data-moved | shape     |                                   |                                 |
| 0826:BF8A | 082A:BD19 | 81→81     | 0.94 constants  | shape     |                                   |                                 |
| 1BA8:080E | 1BAF:0806 | 47→47     | 0.94 constants  | shape     |                                   |                                 |
| 0000:0219 | 0003:021D | 87→87     | 0.94 data-moved | shape     |                                   |                                 |
| 0826:0111 | 082A:0074 | 135→129   | 0.94 changed    | callgraph |                                   |                                 |
| 0826:92AD | 082A:9067 | 2147→2148 | 0.94 changed    | strings   |                                   | I am missing these game files:  |
| 1CCC:077B | 1CCC:0780 | 97→97     | 0.95 constants  | shape     | TStringRef::grow_to(unsigned int) |                                 |

### Removed functions (old only) (10, largest first, up to 60)

| addr      | size | name            | string hint                  |
| --------- | ---- | --------------- | ---------------------------- |
| 1781:0343 | 162  |                 |                              |
| 0826:BEF0 | 154  |                 |                              |
| 1546:070D | 126  |                 |                              |
| 15BE:1AD6 | 104  |                 |                              |
| 1C8A:00B7 | 99   | _SoftwareScroll | MicroChannel Bus Detected!\n |
| 1546:03EF | 65   |                 |                              |
| 0826:151B | 45   |                 |                              |
| 1CCC:0A67 | 13   |                 |                              |
| 14C9:0004 | 11   |                 |                              |
| 14C9:000F | 11   |                 |                              |

### Added functions (new only) (4, largest first, up to 60)

| addr      | size | name | string hint                   |
| --------- | ---- | ---- | ----------------------------- |
| 1520:070D | 623  |      | (C)ontinue save (D)o not save |
| 082A:BD6A | 228  |      |                               |
| 1951:06C0 | 226  |      | Trident 8900                  |
| 0003:04D0 | 3    |      |                               |

## Header and layout

| field                                                                        | old                                                                    | new                                                                    |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| file_size                                                                    | 160598                                                                 | 160784 **≠**                                                           |
| image_size                                                                   | 152406                                                                 | 152592 **≠**                                                           |
| header_bytes                                                                 | 8192                                                                   | 8192                                                                   |
| relocations                                                                  | 1465                                                                   | 1472 **≠**                                                             |
| entry_cs_ip                                                                  | 0000:0000                                                              | 0003:0004 **≠**                                                        |
| stack_ss_sp                                                                  | 2C6E:0080                                                              | 2CF8:0080 **≠**                                                        |
| min_max_alloc_paras                                                          | 1857/65535                                                             | 1983/65535 **≠**                                                       |
| overlay_bytes                                                                | 0                                                                      | 0                                                                      |
| header_0x1c                                                                  | 0100fb50                                                               | 0100fb50                                                               |
| linker                                                                       | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) |
| compiler                                                                     | Borland C++ - Copyright 1991 Borland Intl.                             | Borland C++ - Copyright 1991 Borland Intl.                             |
| version_string                                                               | 3.00                                                                   | 3.00                                                                   |
| stamp_slot                                                                   | none                                                                   | blank placeholder **≠**                                                |
| packer                                                                       |                                                                        |                                                                        |
| DGROUP paragraph                                                             | 232C                                                                   | 1E4A **≠**                                                             |
| code region bytes (before DGROUP)                                            | 144064                                                                 | 124064 **≠**                                                           |
| code segments referenced by relocations                                      | 29                                                                     | 28 **≠**                                                               |
| functions found                                                              | 604                                                                    | 598 **≠**                                                              |
| bytes inside functions                                                       | 112663                                                                 | 112409 **≠**                                                           |
| code-region bytes outside functions (far data, tables, padding, missed code) | 31401                                                                  | 11655 **≠**                                                            |
| data bytes from DGROUP to image end                                          | 8342                                                                   | 28528 **≠**                                                            |

MZ has no linker timestamp, import table or resource section. The closest analogues follow: DOS and BIOS services called, I/O ports touched, and recognizable embedded files.

## DOS/BIOS services (int, with AH when set just before)

No difference (79 uses in each).

## I/O ports (in/out)

| service  | old uses | new uses |
| -------- | -------- | -------- |
| in 3D5h  | 5        | 7        |
| in 3DAh  | 10       | 6        |
| out 21h  | 4        | 2        |
| out 3D4h | 10       | 14       |
| out 3D5h | 7        | 11       |

## Embedded files

Old: none found.
New: none found.

## Data (DGROUP to end of image, relocations masked, aligned on NUL-ended and content-defined runs)

delete 3, equal_bytes 6281, insert 3, new_bytes_changed 22247, old_bytes_changed 2061, replace 32

| kind    | old offset | old bytes | new offset | new bytes | old preview                           | new preview                           |
| ------- | ---------- | --------- | ---------- | --------- | ------------------------------------- | ------------------------------------- |
| replace | 00246      | 53        | 00246      | 48        | (text: see the strings section)       | (text: see the strings section)       |
| replace | 0027F      | 7         | 0027A      | 11        | 2c 01 b4 00 00 00 00                  | (text: see the strings section)       |
| replace | 00291      | 127       | 00290      | 129       | (text: see the strings section)       | (text: see the strings section)       |
| replace | 0031D      | 98        | 0031E      | 294       | (text: see the strings section)       | (text: see the strings section)       |
| replace | 003FB      | 21        | 004C0      | 25        | (text: see the strings section)       | (text: see the strings section)       |
| delete  | 0050B      | 23        | 005D4      | 0         | (text: see the strings section)       |                                       |
| insert  | 00551      | 0         | 00603      | 6         |                                       | (text: see the strings section)       |
| replace | 0056E      | 30        | 00626      | 30        | (text: see the strings section)       | (text: see the strings section)       |
| delete  | 005A9      | 2         | 00661      | 0         | (text: see the strings section)       |                                       |
| replace | 007E0      | 8         | 00896      | 8         | (text: see the strings section)       | (text: see the strings section)       |
| insert  | 007FC      | 0         | 008B2      | 31        |                                       | (text: see the strings section)       |
| delete  | 00B61      | 110       | 00C36      | 0         | (text: see the strings section)       |                                       |
| replace | 00CBF      | 6         | 00D26      | 5         | (text: see the strings section)       | (text: see the strings section)       |
| replace | 00D0B      | 16        | 00D71      | 144       | (text: see the strings section)       | 13 19 15 2d 17 35 18 2b 14 1a 16 11 … |
| replace | 00D60      | 37        | 00E46      | 43        | (text: see the strings section)       | (text: see the strings section)       |
| replace | 00DA9      | 46        | 00E95      | 182       | (text: see the strings section)       | (text: see the strings section)       |
| insert  | 00E74      | 0         | 00FE8      | 99        |                                       | (text: see the strings section)       |
| replace | 00F0B      | 20        | 010E2      | 11        | (text: see the strings section)       | (text: see the strings section)       |
| replace | 00F6A      | 55        | 01138      | 53        | (text: see the strings section)       | (text: see the strings section)       |
| replace | 010F4      | 205       | 012C0      | 105       | (text: see the strings section)       | (text: see the strings section)       |
| replace | 011CC      | 30        | 01334      | 10        | (text: see the strings section)       | (text: see the strings section)       |
| replace | 011F5      | 30        | 01349      | 10        | (text: see the strings section)       | (text: see the strings section)       |
| replace | 0121B      | 33        | 0135B      | 13        | (text: see the strings section)       | (text: see the strings section)       |
| replace | 01244      | 197       | 01370      | 76        | (text: see the strings section)       | (text: see the strings section)       |
| replace | 015DD      | 38        | 01690      | 37        | (text: see the strings section)       | (text: see the strings section)       |
| replace | 01784      | 88        | 01836      | 88        | (text: see the strings section)       | (text: see the strings section)       |
| replace | 017ED      | 89        | 0189F      | 89        | (text: see the strings section)       | (text: see the strings section)       |
| replace | 01854      | 14        | 01906      | 14        | 8a 03 00 00 8a 03 00 00 8a 03 00 00 … | 8e 03 00 00 8e 03 00 00 8e 03 00 00 … |
| replace | 01872      | 4         | 01924      | 4         | 60 18 00 00                           | 12 19 00 00                           |
| replace | 01886      | 4         | 01938      | 4         | 74 18 00 00                           | 26 19 00 00                           |
| replace | 0189A      | 4         | 0194C      | 4         | 88 18 00 00                           | 3a 19 00 00                           |
| replace | 018AE      | 4         | 01960      | 4         | 9c 18 00 00                           | 4e 19 00 00                           |
| replace | 018C2      | 302       | 01974      | 302       | (text: see the strings section)       | (text: see the strings section)       |
| replace | 01A8A      | 4         | 01B3C      | 4         | 1f 08 00 00                           | 23 08 00 00                           |
| replace | 01C14      | 68        | 01CC6      | 216       | e1 17 00 00 c2 18 00 00 00 00 00 00 … | e5 17 00 00 c6 18 00 00 00 00 00 00 … |
| replace | 01C5A      | 168       | 01DA0      | 20        | 73 1d 00 00 83 1d 00 00 98 1d 00 00 … | ac 1f 00 00 ad 1f 00 00 ae 1f 00 00 … |
| replace | 01F2A      | 16        | 01FDC      | 16        | 11 01 30 01 4e 01 6d 01 ec 93 00 00 … | 11 01 30 01 4e 01 6d 01 ac ea 00 00 … |
| replace | 0202E      | 104       | 020E0      | 20112     | 5c 7c 61 7c 61 7c 61 7c 01 20 f7 bf … | (text: see the strings section)       |

## Strings (text-like printable runs of 4+ bytes in the whole image, owner stamp masked)

19 only in old, 37 only in new (a multiset difference, so a repeated string can appear once). Runs that look like machine code (no three letters in a row or a format specifier) are left out. Addresses and phone numbers are redacted.

### Only in old (up to 150)

```text
&;Glr
(A)bort Save    (R)etry
2IVIVI8IVIIIVIVI2IU
GAB;
O*OBOQO`OtO
ObPbPbPbP
P+P:PNPU
PkQkQkQkQ
Q#Q5Q@QKQ[Q
RhShShShS
S*S8SCSNS[SU
Simulate
Sorry...Out of Memory!
T;TFT'T1T;TFT
This game has not been saved!
VWh&
You are missing %s!  I can't do anything without it!
\RjRxR
be simulated in Software
```

### Only in new (up to 150)

```text
[redacted: address or phone]
[redacted: address or phone]
(C)ontinue save    (D)o not save
(E)xit (R)etry
(E)xit (R)etry
(R)etry (A)bort
6roS
ASDFGHJKL:"~
ATI Wonder
Auto-Detect
Empty
I can't access the disk!
I can't access the disk!  Did you remember to insert one?
O\nP!P/P>PRPU
O.OFOUOdOxO
OfPfPfPfP
PSQR
Paradise
PoQoQoQoQ
Q'Q9QDQOQ_Q
RlSlSlSlS
S S.S<SGSRS_SU
SOUND
Standard VGA
T#T?TJT+T5T?TJT
This file already exists! Saving now will destroy the old file!
Trident 8800
Trident 8900
Tseng ET3000
Tseng ET4000
Unable to Save!
You are missing %s.gam!  I can't do anything without it!
You have not saved this game!
htoj
jXj(
tFj<j
\|ZXCVBNM<>?
```
