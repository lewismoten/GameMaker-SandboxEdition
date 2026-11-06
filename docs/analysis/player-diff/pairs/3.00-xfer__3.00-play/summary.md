# 3.00-xfer → 3.00-play

Why this pair: control: the two 3.00 programs; carries MAP names from PLAYGAME to XFERPLAY.

Old: `cd/gm/xferplay.exe` (sha256 `404be3612012488e…`)
New: `cd/gm/playgame.exe` (sha256 `49ed1c7898b05cd1…`)

## Functions

| status | count |
| --- | --- |
| identical | 196 |
| relocated | 276 |
| calls-differ | 2 |
| data-moved | 115 |
| constants | 6 |
| changed | 6 |
| removed | 3 |
| added | 11 |

Matched 601 of 604 old and 612 new functions; 3 matches are low confidence (call-graph or order matches under 0.7 similarity).

Matched by stage: bytes 188, norm 263, strings 19, shape 102, callgraph 23, order 5, similarity 1.

Statuses: *identical* = same bytes with relocations masked and the same matched callees; *relocated* = same code once addresses, segments and string pointers are abstracted; *calls-differ* = same code but calling different (or unmatched) functions; *data-moved* = same instruction shape, and every differing immediate moved by an offset shift that at least three matched functions share (the data layout moved); *constants* = same instruction shape with other immediates or strings; *changed* = instructions differ (norm_sim is the share of matching normalized instructions). Full table: `functions.tsv`. The string hint is the rarest string the function appears to point at; an immediate can equal a string offset by coincidence.

### Changed functions (least similar first, up to 60)

| old | new | sizes | sim | method | name | string hint |
| --- | --- | --- | --- | --- | --- | --- |
| 0000:0197 | 0000:015A | 62→30 | 0.41 changed | order |  | Divide error\r\n |
| 0826:0347 | 086C:0341 | 931→1464 | 0.60 changed | callgraph |  | cOoL |
| 0000:0219 | 0000:022C | 87→65 | 0.65 changed | callgraph |  |  |
| 0000:0000 | 0000:0000 | 414→326 | 0.70 changed | callgraph |  |  |
| 0826:3CFB | 086C:4094 | 205→326 | 0.73 changed | callgraph |  | gmhelp |
| 0000:0183 | 0000:0146 | 19→19 | 0.78 data-moved | shape |  |  |
| 0826:1548 | 086C:1757 | 1489→1883 | 0.85 changed | callgraph |  |    Although you correctly drew links be… |
| 0000:3593 | 0000:39ED | 31→31 | 0.89 data-moved | shape |  |  |
| 1781:06F7 | 1808:06F9 | 46→46 | 0.90 data-moved | shape |  |  |
| 0000:2F77 | 0000:33D1 | 69→69 | 0.90 data-moved | shape |  |  Copyright(C) 1994   |
| 0826:BD21 | 086C:C133 | 50→50 | 0.91 constants | shape |  |  |
| 0000:081F | 0000:083D | 101→101 | 0.91 data-moved | shape |  | Borland C++ - Copyright 1994 Borland In… |
| 17F8:07A5 | 187F:07A7 | 48→48 | 0.91 data-moved | shape |  |  |
| 0000:3502 | 0000:395C | 145→145 | 0.91 data-moved | strings |  | Unknown error |
| 0000:47CB | 0000:4C25 | 83→83 | 0.92 data-moved | shape |  | Borland C++ - Copyright 1994 Borland In… |
| 0826:9B10 | 086C:9F22 | 118→118 | 0.92 data-moved | shape |  |  |
| 0826:0758 | 086C:0967 | 146→146 | 0.92 constants | strings |  | data*.rec |
| 0000:447B | 0000:48D5 | 114→114 | 0.93 data-moved | shape |  | Borland C++ - Copyright 1994 Borland In… |
| 0000:375D | 0000:3BB7 | 24→24 | 0.93 data-moved | shape |  |  |
| 0826:9D3B | 086C:A14D | 85→85 | 0.94 data-moved | shape |  |  |
| 0826:3709 | 086C:3AA2 | 942→942 | 0.94 data-moved | strings |  | Save Game |
| 0000:2AA8 | 0000:2F02 | 77→77 | 0.94 data-moved | shape |  |  |
| 0826:BF8A | 086C:C39C | 81→81 | 0.94 data-moved | shape |  |  |
| 1BA8:080E | 1C2F:0810 | 47→47 | 0.94 data-moved | shape |  |  |
| 0826:09E1 | 086C:0BF0 | 1009→1009 | 0.94 data-moved | shape |  |  |
| 0000:743A | 0000:7894 | 110→110 | 0.94 data-moved | shape |  | Borland C++ - Copyright 1994 Borland In… |
| 1CCC:077B | 1D53:077D | 97→97 | 0.95 data-moved | shape | TStringRef::grow_to(unsigned int) |  |
| 0826:2D40 | 086C:30D9 | 2505→2505 | 0.95 data-moved | shape |  | Load Game |
| 0826:92AD | 086C:96BF | 2147→2147 | 0.95 data-moved | shape |  | I am missing these game files: |
| 0000:3BDE | 0000:4038 | 37→37 | 0.95 data-moved | shape |  |  |
| 1CCC:04C4 | 1D53:04C6 | 170→170 | 0.95 data-moved | shape | TSubString::assert_element(unsigned int) const | String reference out of range |
| 0826:2A94 | 086C:2E2D | 258→258 | 0.95 data-moved | shape |  | .dat |
| 1781:00D8 | 1808:00DA | 195→195 | 0.95 data-moved | shape |  | gm.cfg |
| 1CCC:036A | 1D53:036C | 173→173 | 0.95 data-moved | shape | string::assert_element(unsigned int) const | String reference out of range |
| 1CCC:0417 | 1D53:0419 | 173→173 | 0.95 data-moved | shape | string::assert_index(unsigned int) const | String reference out of range |
| 0000:75C4 | 0000:7A1E | 131→131 | 0.95 data-moved | shape |  | Borland C++ - Copyright 1994 Borland In… |
| 0826:A456 | 086C:A868 | 103→103 | 0.95 data-moved | shape |  |  |
| 0000:3BB8 | 0000:4012 | 38→38 | 0.95 data-moved | shape |  |  |
| 0826:BFF7 | 086C:C409 | 290→290 | 0.95 data-moved | shape |  |  |
| 0826:9C42 | 086C:A054 | 109→109 | 0.95 data-moved | shape |  |  |
| 0000:0966 | 0000:0984 | 90→90 | 0.95 data-moved | strings |  | Out of memory |
| 0000:1787 | 0000:17A5 | 90→90 | 0.96 data-moved | shape |  |  |
| 0000:01A9 | 0000:0178 | 67→67 | 0.96 constants | shape |  |  |
| 0000:74B7 | 0000:7911 | 52→52 | 0.96 data-moved | shape |  |  |
| 1A0C:0004 | 1A93:0006 | 61→61 | 0.96 data-moved | shape |  |  |
| 1CCC:07DC | 1D53:07DE | 61→61 | 0.96 data-moved | shape | TStringRef::round_capacity(unsigned int) |  |
| 17F8:07D5 | 187F:07D7 | 493→493 | 0.96 data-moved | strings |  | Error Opening Bkd %s! |
| 0826:2B96 | 086C:2F2F | 426→426 | 0.96 data-moved | shape |  | .dat |
| 19BF:0005 | 1A46:0007 | 542→542 | 0.96 data-moved | shape |  | Top Ten Scores |
| 15BE:18EB | 1645:18ED | 491→491 | 0.96 constants | shape |  | (C)ontinue save    (D)o not save |
| 1781:000C | 1808:000E | 204→204 | 0.96 data-moved | shape |  | gm.cfg |
| 0000:43C3 | 0000:481D | 63→63 | 0.96 data-moved | shape |  |  |
| 1953:049F | 19DA:04A1 | 70→70 | 0.97 data-moved | shape |  | See Credits |
| 0000:5E79 | 0000:62D3 | 69→69 | 0.97 data-moved | shape |  |  |
| 0000:4381 | 0000:47DB | 66→66 | 0.97 data-moved | shape |  |  |
| 0826:070A | 086C:0919 | 78→78 | 0.97 data-moved | shape |  |  |
| 0000:3A52 | 0000:3EAC | 289→289 | 0.97 data-moved | shape |  |  |
| 0000:3DE9 | 0000:4243 | 175→175 | 0.97 data-moved | shape |  |  |
| 0000:6A5E | 0000:6EB8 | 89→89 | 0.97 data-moved | shape |  |  |
| 1CCC:064E | 1D53:0650 | 89→89 | 0.97 data-moved | shape | TStringRef::~TStringRef() |  |

### Removed functions (old only) (3, largest first, up to 60)

| addr | size | name | string hint |
| --- | --- | --- | --- |
| 0000:0278 | 51 |  |  |
| 1CCC:0A67 | 13 |  |  |
| 0000:0270 | 8 |  |  |

### Added functions (new only) (11, largest first, up to 60)

| addr | size | name | string hint |
| --- | --- | --- | --- |
| 1A93:0437 | 455 |  |  |
| 1645:1A7E | 368 |  | (C)ontinue save    (D)o not save |
| 0000:23B8 | 302 |  |  |
| 0000:1850 | 152 |  |  |
| 0000:24E6 | 151 |  |  |
| 0000:01E8 | 68 |  |  |
| 0000:1A1A | 61 |  |  |
| 0000:037F | 41 |  |  |
| 0000:2393 | 37 |  |  |
| 0000:0271 | 27 |  | Abnormal program termination\r\n |
| 0000:02C9 | 20 |  |  |

## Header and layout

| field | old | new |
| --- | --- | --- |
| file_size | 160598 | 163130 **≠** |
| image_size | 152406 | 154938 **≠** |
| header_bytes | 8192 | 8192 |
| relocations | 1465 | 1519 **≠** |
| entry_cs_ip | 0000:0000 | 0000:0000 |
| stack_ss_sp | 2C6E:0080 | 2D0D:0080 **≠** |
| min_max_alloc_paras | 1857/65535 | 1858/65535 **≠** |
| overlay_bytes | 0 | 0 |
| header_0x1c | 0100fb50 | 0100fb50 |
| linker | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) |
| compiler | Borland C++ - Copyright 1991 Borland Intl. | Borland C++ - Copyright 1994 Borland Intl. **≠** |
| version_string | 3.00 | 3.00 |
| stamp_slot | none | none |
| packer |  |  |
| DGROUP paragraph | 232C | 23B3 **≠** |
| code region bytes (before DGROUP) | 144064 | 146224 **≠** |
| code segments referenced by relocations | 29 | 29 |
| functions found | 604 | 612 **≠** |
| bytes inside functions | 112663 | 115179 **≠** |
| code-region bytes outside functions (far data, tables, padding, missed code) | 31401 | 31045 **≠** |
| data bytes from DGROUP to image end | 8342 | 8714 **≠** |

MZ has no linker timestamp, import table or resource section. The closest analogues follow: DOS and BIOS services called, I/O ports touched, and recognizable embedded files.

## DOS/BIOS services (int, with AH when set just before)

| service | old uses | new uses |
| --- | --- | --- |
| int 1Ah AH=00h | 1 | 0 |
| int 21h AH=40h | 3 | 2 |
| int 21h AH=4Ch | 1 | 2 |
| int 23h | 0 | 1 |

## I/O ports (in/out)

| service | old uses | new uses |
| --- | --- | --- |
| in dx(variable) | 8 | 9 |

## Embedded files

Old: none found.
New: none found.

## Data (DGROUP to end of image, relocations masked, aligned on NUL-ended and content-defined runs)

equal_bytes 6673, insert 2, new_bytes_changed 2041, old_bytes_changed 1669, replace 17

| kind | old offset | old bytes | new offset | new bytes | old preview | new preview |
| --- | --- | --- | --- | --- | --- | --- |
| replace | 00004 | 631 | 00004 | 173 | (text: see the strings section) | (text: see the strings section) |
| replace | 0031D | 98 | 00153 | 98 | (text: see the strings section) | 8d 0c 00 00 99 0c 00 00 a6 0c 00 00 … |
| insert | 00387 | 0 | 001BD | 5 |  | (text: see the strings section) |
| replace | 003F6 | 58 | 00231 | 259 | (text: see the strings section) | (text: see the strings section) |
| insert | 004E5 | 0 | 003E9 | 539 |  | (text: see the strings section) |
| replace | 0085B | 1 | 0097A | 14 | (text: see the strings section) | (text: see the strings section) |
| replace | 01784 | 88 | 018B0 | 88 | (text: see the strings section) | (text: see the strings section) |
| replace | 017ED | 89 | 01919 | 89 | (text: see the strings section) | (text: see the strings section) |
| replace | 01848 | 26 | 01974 | 58 | 01 00 00 00 00 00 00 00 00 00 00 00 … | (text: see the strings section) |
| replace | 01872 | 4 | 019BE | 4 | 60 18 00 00 | ac 19 00 00 |
| replace | 01886 | 4 | 019D2 | 4 | 74 18 00 00 | c0 19 00 00 |
| replace | 0189A | 4 | 019E6 | 4 | 88 18 00 00 | d4 19 00 00 |
| replace | 018AE | 4 | 019FA | 4 | 9c 18 00 00 | e8 19 00 00 |
| replace | 018C2 | 302 | 01A0E | 302 | (text: see the strings section) | (text: see the strings section) |
| replace | 01A8A | 4 | 01BD6 | 4 | 1f 08 00 00 | 3d 08 00 00 |
| replace | 01C14 | 68 | 01D60 | 208 | e1 17 00 00 c2 18 00 00 00 00 00 00 … | ff 17 00 00 e0 18 00 00 00 00 00 00 … |
| replace | 01C5A | 168 | 01E32 | 68 | 73 1d 00 00 83 1d 00 00 98 1d 00 00 … | (text: see the strings section) |
| replace | 01F2A | 16 | 0209E | 16 | 11 01 30 01 4e 01 6d 01 ec 93 00 00 … | 11 01 30 01 4e 01 6d 01 6c 95 00 00 … |
| replace | 0202E | 104 | 021A2 | 104 | 5c 7c 61 7c 61 7c 61 7c 01 20 f7 bf … | b6 80 bb 80 bb 80 bb 80 01 20 09 c4 … |

## Strings (text-like printable runs of 4+ bytes in the whole image, owner stamp masked)

20 only in old, 49 only in new (a multiset difference, so a repeated string can appear once). Runs that look like machine code (no three letters in a row or a format specifier) are left out. Addresses and phone numbers are redacted.

### Only in old (up to 150)

```text
.gam
2IVIVI8IVIIIVIVI2IU
Borland C++ - Copyright 1991 Borland Intl.
GAB;
GM:Abnormal program termination.\r\n                                                               …
GM:Bad Environment.\r\n
GM:Data seg must be < 64k.\r\n
GM:Heap must be < 64k.\r\n
GM:Not enough memory.\r\n-GM:Memory allocation strategy error (Last).\r\n.GM:Memory allocation stra…
O*OBOQO`OtO
ObPbPbPbP
P+P:PNPU
PkQkQkQkQ
Q#Q5Q@QKQ[Q
RhShShShS
S*S8SCSNS[SU
T;TFT'T1T;TFT
VWh&
You are missing %s!  I can't do anything without it!
\RjRxR
```

### Only in new (up to 150)

```text
              (fourth from the last paragraph)         
   Although you correctly drew links between the various
  By Gregory Stone  
 Configure
 Copyright(C) 1994  
 PLAYGAME     V3.00 
 Play a Game!
 Quit
&;GUt
&;GWt
*.gam
.txt
2Lhl
9IAB;
=YYP
Abnormal program termination\r\n
Borland C++ - Copyright 1994 Borland Intl.
DMhMhMJMhM[MhMhMDMU
Enter game to play: 
FnUm
GIP3
GXPXYXdXqXyX
Incorrect Data File Version (You are running Game-Maker Version 3.00).
NULL CHECK
PSQR
PSQR
PSQR
PSQR
PSQR
Still Confused?  Read the Owner's Manual Section 4.8.2.
T*T8TIT`TwT
To correct, load this game into the integrator, and then save it.
U,U5UDU
U5UDU
ULS^SpS
USU_UkU}U
VWhl
W&W4WBWPW
W^WjWvW
cOoL
game before he even starts playing.  I'm going to change
gmhelp
integrator and fix the problem.
mOlFnFn
result, the starting place and the game won place are in
scenes, you forgot to specify EXACTLY where in a scene
the game won link temporarily, but you should go to the 
the same position!  This means that player will win the
you want the character to start and end (ie.win).  As a
```
