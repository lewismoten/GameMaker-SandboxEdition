# 2.02 → 2.04

Why this pair: chain.

Old: `archive:game-maker_arcade-ricky-2_shareware-games-galore.zip@a42b6b25e691302ac47811e9d1ed2153f78f05b5fdcf92309c0ccfaf09e8abf4!RICKY2.EXE` (sha256 `c57bd17579c48d86…`)
New: `archive:game-maker_breakout-the-rescue.zip@54f896c5b6b4f27d8ebaa5a0094d5fd9fb36e1e4c7fb066b128aefd14663213a!brkoutsw.exe` (sha256 `e91bfe75bb25a808…`)

## Functions

| status | count |
| --- | --- |
| identical | 55 |
| relocated | 37 |
| calls-differ | 1 |
| data-moved | 0 |
| constants | 6 |
| changed | 271 |
| removed | 41 |
| added | 43 |

Matched 370 of 411 old and 413 new functions; 107 matches are low confidence (call-graph or order matches under 0.7 similarity).

Matched by stage: bytes 53, norm 38, strings 27, shape 6, callgraph 221, order 19, similarity 6.

Statuses: *identical* = same bytes with relocations masked and the same matched callees; *relocated* = same code once addresses, segments and string pointers are abstracted; *calls-differ* = same code but calling different (or unmatched) functions; *data-moved* = same instruction shape, and every differing immediate moved by an offset shift that at least three matched functions share (the data layout moved); *constants* = same instruction shape with other immediates or strings; *changed* = instructions differ (norm_sim is the share of matching normalized instructions). Full table: `functions.tsv`. The string hint is the rarest string the function appears to point at; an immediate can equal a string offset by coincidence.

### Changed functions (least similar first, up to 60)

| old | new | sizes | sim | method | name | string hint |
| --- | --- | --- | --- | --- | --- | --- |
| 03B4:53BD | 03EF:51A6 | 166→120 | 0.16 changed | similarity |  |  |
| 03B4:6AA8 | 03EF:66A4 | 188→165 | 0.26 changed | order |  |  |
| 1344:052D | 1362:0492 | 272→308 | 0.27 changed | order |  |  |
| 03B4:7374 | 03EF:6F6C | 497→484 | 0.28 changed | order |  |  |
| 12B3:039B | 12D3:0398 | 96→78 | 0.30 changed | strings |  | NotInit |
| 1344:035D | 1362:0391 | 278→257 | 0.33 changed | callgraph |  |  |
| 11B0:0558 | 11D3:055D | 205→253 | 0.34 changed | strings |  | ATI ULTRA |
| 0E63:0D5F | 0E7C:0CF5 | 275→409 | 0.35 changed | order |  |  |
| 1344:04C3 | 1362:0062 | 106→111 | 0.36 changed | callgraph |  |  |
| 1344:0006 | 1362:00D1 | 549→612 | 0.37 changed | callgraph |  |  |
| 11B0:0443 | 11D3:0435 | 86→105 | 0.38 changed | strings |  | VGA= |
| 03B4:8877 | 03EF:837B | 31→50 | 0.41 changed | order |  |  |
| 0DDC:0009 | 0DE5:000B | 127→188 | 0.41 changed | strings |  | SOUND |
| 101C:008D | 1044:009E | 148→178 | 0.42 changed | order |  |  |
| 105B:0790 | 1086:07AD | 41→48 | 0.44 changed | order |  |  |
| 03B4:5463 | 03EF:521E | 189→228 | 0.45 changed | callgraph |  |  |
| 0003:057D | 0003:060C | 57→62 | 0.45 changed | callgraph |  |  |
| 0E63:000E | 0E7C:000B | 2231→2668 | 0.47 changed | callgraph |  | (E)xit. |
| 0E63:18FD | 0E7C:1938 | 441→599 | 0.47 changed | callgraph |  | (C)ontinue save    (D)o not save |
| 03B4:5520 | 03EF:5302 | 532→355 | 0.47 changed | callgraph |  |  |
| 0003:24D9 | 0003:24B2 | 88→225 | 0.47 changed | callgraph |  |  |
| 03B4:2D3F | 03EF:2DF2 | 130→81 | 0.47 changed | callgraph |  |  |
| 03B4:29CF | 03EF:2B49 | 39→41 | 0.47 changed | callgraph |  |  |
| 03B4:2F71 | 03EF:2FFF | 1873→1765 | 0.47 changed | callgraph |  |  |
| 0DDC:06AA | 0DE5:070C | 468→623 | 0.48 changed | callgraph |  | (C)ontinue save    (D)o not save |
| 03B4:396D | 03EF:3BDF | 662→590 | 0.49 changed | callgraph |  |  |
| 03B4:51B6 | 03EF:4F99 | 519→405 | 0.49 changed | similarity |  |  |
| 03B4:2525 | 03EF:26AF | 187→216 | 0.49 changed | callgraph |  |  |
| 03B4:8C1A | 03EF:870D | 3272→3238 | 0.49 changed | callgraph |  | config.hlp |
| 03B4:83F3 | 03EF:7FA9 | 104→97 | 0.49 changed | order |  |  |
| 0E63:0C08 | 0E7C:0B5E | 343→407 | 0.50 changed | callgraph |  | %s*.* |
| 0E63:0F96 | 0E7C:0F36 | 675→727 | 0.51 changed | callgraph |  |  |
| 0003:17A3 | 0003:157C | 118→142 | 0.51 changed | callgraph |  |  |
| 0003:1DFF | 0003:1D53 | 203→209 | 0.51 changed | callgraph |  |  |
| 1344:0473 | 1362:000F | 80→83 | 0.51 changed | callgraph |  |  |
| 0E63:1696 | 0E7C:1683 | 127→130 | 0.52 changed | callgraph |  |  |
| 105B:070E | 1086:0726 | 130→135 | 0.52 changed | callgraph |  |  |
| 03B4:5E2C | 03EF:5A41 | 95→115 | 0.52 changed | callgraph |  |  |
| 03B4:5B85 | 03EF:5806 | 679→571 | 0.52 changed | callgraph |  |  |
| 105B:01F9 | 1086:0200 | 461→457 | 0.53 changed | callgraph |  |  |
| 03B4:7CBE | 03EF:7920 | 458→440 | 0.53 changed | callgraph |  |  |
| 125F:021E | 1285:022F | 22→22 | 0.53 changed | callgraph |  |  |
| 0003:391E | 0003:37A6 | 335→358 | 0.54 changed | callgraph |  |  |
| 03B4:7BF5 | 03EF:783A | 116→149 | 0.54 changed | callgraph |  |  |
| 03B4:2DC1 | 03EF:2E43 | 432→444 | 0.54 changed | callgraph |  |  |
| 0E63:184E | 0E7C:1855 | 175→227 | 0.54 changed | callgraph |  | Can't Find file! |
| 101C:0008 | 1044:000A | 89→102 | 0.54 changed | callgraph |  |  |
| 03B4:0852 | 03EF:0891 | 138→140 | 0.54 changed | callgraph |  |  |
| 0E63:1715 | 0E7C:1705 | 106→114 | 0.55 changed | callgraph |  |  |
| 03B4:0C4C | 03EF:0CB5 | 972→1069 | 0.55 changed | callgraph |  |  |
| 0DDC:05CB | 0DE5:0601 | 223→267 | 0.55 changed | callgraph |  | Can't Find file! |
| 11B0:065A | 11D3:065A | 22→20 | 0.56 changed | callgraph |  |  |
| 0DDC:0088 | 0DE5:00C7 | 436→425 | 0.56 changed | callgraph |  |  |
| 0D6D:0221 | 0D77:0213 | 38→49 | 0.56 changed | callgraph |  |  |
| 11B0:0184 | 11D3:017C | 200→217 | 0.57 changed | strings |  | 761295520 |
| 0D6D:00FD | 0D77:00E3 | 63→69 | 0.57 changed | callgraph |  |  |
| 03B4:36C2 | 03EF:36E4 | 87→75 | 0.57 changed | similarity |  |  |
| 03B4:7C69 | 03EF:78CF | 85→81 | 0.57 changed | callgraph |  |  |
| 03B4:8160 | 03EF:7D2E | 93→93 | 0.57 changed | callgraph |  |  |
| 105B:0414 | 1086:0421 | 122→118 | 0.58 changed | callgraph |  |  |

### Removed functions (old only) (41, largest first, up to 60)

| addr | size | name | string hint |
| --- | --- | --- | --- |
| 03B4:4042 | 3791 |  |  |
| 03B4:2714 | 767 |  | Choose object to drop |
| 10FD:00CF | 699 |  |  |
| 03B4:4F11 | 675 |  |  |
| 10FD:038A | 666 |  |  |
| 03B4:1D6E | 633 |  | Score:     %ld |
| 03B4:3E05 | 573 |  |  |
| 03B4:3719 | 479 |  |  |
| 03B4:2B63 | 476 |  |  |
| 03B4:99BA | 383 |  |  |
| 125F:025B | 378 |  |  |
| 03B4:5734 | 340 |  |  |
| 03B4:5888 | 337 |  |  |
| 0DDC:02D3 | 281 |  |  |
| 0DDC:030D | 223 |  |  |
| 10FD:0000 | 207 |  |  |
| 03B4:69F6 | 178 |  |  |
| 03B4:828E | 172 |  |  |
| 0DAF:0009 | 144 |  |  |
| 0DAF:0152 | 112 |  |  |
| 0DDC:03F3 | 110 |  |  |
| 03B4:9B39 | 100 |  |  |
| 0DAF:00ED | 99 |  |  |
| 0DAF:0099 | 84 |  |  |
| 0003:3111 | 48 |  |  |
| 0D6D:0188 | 36 |  |  |
| 0DDC:05AA | 33 |  |  |
| 101C:0121 | 27 |  |  |
| 101C:013C | 27 |  |  |
| 12FF:000D | 25 |  |  |
| 03B4:833A | 14 |  |  |
| 03B4:8348 | 14 |  |  |
| 0DDC:03E7 | 12 |  |  |
| 0003:055E | 11 |  |  |
| 0003:0572 | 11 |  |  |
| 0D6D:013C | 11 |  |  |
| 125F:0234 | 10 |  |  |
| 125F:023E | 10 |  |  |
| 0003:0555 | 9 |  |  |
| 0003:0569 | 9 |  |  |
| 0003:12D4 | 1 |  |  |

### Added functions (new only) (43, largest first, up to 60)

| addr | size | name | string hint |
| --- | --- | --- | --- |
| 03EF:4337 | 2670 |  |  |
| 03EF:0D85 | 861 |  |  |
| 03EF:4043 | 756 |  |  |
| 1128:009B | 621 |  |  |
| 1128:0308 | 588 |  |  |
| 03EF:4DA5 | 500 |  |  |
| 03EF:38E0 | 445 |  |  |
| 03EF:372F | 433 |  |  |
| 03EF:953C | 400 |  |  |
| 0E7C:1484 | 381 |  |  |
| 1128:06A9 | 378 |  |  |
| 03EF:2CE2 | 272 |  |  |
| 03EF:559D | 233 |  |  |
| 03EF:3A9D | 225 |  |  |
| 03EF:54CB | 210 |  |  |
| 0D9B:0004 | 177 |  |  |
| 03EF:65F9 | 171 |  |  |
| 0003:2B18 | 145 |  | Unknown error |
| 03EF:96CC | 145 |  |  |
| 1128:000D | 142 |  |  |
| 03EF:512E | 120 |  |  |
| 03EF:5465 | 102 |  |  |
| 0003:21E3 | 85 |  |  |
| 0DC6:0008 | 67 |  |  |
| 0DC6:004B | 55 |  |  |
| 0DC6:00B1 | 53 |  |  |
| 0003:3C0C | 49 |  |  |
| 0DC6:0082 | 47 |  |  |
| 03EF:09CB | 43 |  | Paradise |
| 0D9B:0263 | 41 |  |  |
| 03EF:975D | 36 |  |  |
| 0003:349B | 35 |  |  |
| 1044:016A | 31 |  |  |
| 0003:394B | 28 |  |  |
| 1044:0150 | 26 |  |  |
| 0003:2AFF | 25 |  |  |
| 0D6B:00B0 | 19 |  |  |
| 0003:1C05 | 17 |  |  |
| 0DE5:0430 | 12 |  |  |
| 0D77:0128 | 11 |  |  |
| 1285:0245 | 10 |  |  |
| 1285:024F | 10 |  |  |
| 0003:3BE9 | 5 |  |  |

## Header and layout

| field | old | new |
| --- | --- | --- |
| file_size | 155156 | 119074 **≠** |
| image_size | 149012 | 112930 **≠** |
| header_bytes | 6144 | 6144 |
| relocations | 1105 | 1108 **≠** |
| entry_cs_ip | 0003:0004 | 0003:0004 |
| stack_ss_sp | 246B:0080 | 232F:0080 **≠** |
| min_max_alloc_paras | 18/65535 | 1957/65535 **≠** |
| overlay_bytes | 0 | 0 |
| header_0x1c | 0100fb50 | 0100fb50 |
| linker | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) |
| compiler | Borland C++ - Copyright 1991 Borland Intl. | Borland C++ - Copyright 1991 Borland Intl. |
| version_string | 2.02 | 2.04 **≠** |
| stamp_slot | stamped (contents masked) | stamped (contents masked) |
| packer |  |  |
| DGROUP paragraph | 14A9 | 14BC **≠** |
| code region bytes (before DGROUP) | 84624 | 84928 **≠** |
| code segments referenced by relocations | 22 | 23 **≠** |
| functions found | 411 | 413 **≠** |
| bytes inside functions | 80140 | 80349 **≠** |
| code-region bytes outside functions (far data, tables, padding, missed code) | 4484 | 4579 **≠** |
| data bytes from DGROUP to image end | 64388 | 28002 **≠** |

MZ has no linker timestamp, import table or resource section. The closest analogues follow: DOS and BIOS services called, I/O ports touched, and recognizable embedded files.

## DOS/BIOS services (int, with AH when set just before)

| service | old uses | new uses |
| --- | --- | --- |
| int 15h AH=C0h | 0 | 1 |
| int 16h AH=03h | 2 | 0 |
| int 33h AH=00h | 0 | 7 |

## I/O ports (in/out)

| service | old uses | new uses |
| --- | --- | --- |
| in 3D5h | 6 | 7 |
| in 3DAh | 3 | 6 |
| in dx(variable) | 14 | 8 |
| out 3D4h | 11 | 14 |
| out 3D5h | 7 | 11 |
| out dx(variable) | 26 | 17 |

## Embedded files

Old: none found.
New: none found.

## Data (DGROUP to end of image, relocations masked, aligned on NUL-ended and content-defined runs)

delete 1, equal_bytes 5559, insert 2, new_bytes_changed 22443, old_bytes_changed 58829, replace 16

| kind | old offset | old bytes | new offset | new bytes | old preview | new preview |
| --- | --- | --- | --- | --- | --- | --- |
| replace | 0002F | 36661 | 0002F | 594 | (text: see the strings section) | (text: see the strings section) |
| replace | 08F6A | 1007 | 00287 | 84 | (text: see the strings section) | (text: see the strings section) |
| insert | 094DE | 0 | 00460 | 2 |  | 01 00 |
| insert | 09519 | 0 | 0049D | 28 |  | (text: see the strings section) |
| replace | 0977B | 14 | 0071B | 14 | (text: see the strings section) | (text: see the strings section) |
| replace | 09E6F | 1045 | 00E0F | 27 | (text: see the strings section) | (text: see the strings section) |
| replace | 0A28A | 80 | 00E30 | 19 | (text: see the strings section) | (text: see the strings section) |
| replace | 0A3A8 | 44 | 00F11 | 43 | (text: see the strings section) | (text: see the strings section) |
| replace | 0A3F0 | 2045 | 00F58 | 2 | (text: see the strings section) | (text: see the strings section) |
| replace | 0ADD7 | 7 | 01144 | 8 | (text: see the strings section) | (text: see the strings section) |
| replace | 0ADEA | 17062 | 01158 | 30 | (text: see the strings section) | (text: see the strings section) |
| replace | 0F6F2 | 23 | 017D8 | 583 | (text: see the strings section) | (text: see the strings section) |
| replace | 0F729 | 3 | 01A3F | 3 | 01 40 40 | 81 40 40 |
| replace | 0F738 | 13 | 01A4E | 13 | 40 02 02 02 02 02 02 02 02 02 02 40 … | 40 12 12 12 12 12 12 12 12 12 12 40 … |
| delete | 0F80A | 564 | 01B20 | 0 | d2 02 00 00 d2 02 00 00 d2 02 00 00 … |  |
| replace | 0FA57 | 199 | 01B39 | 821 | 05 05 05 05 05 05 05 05 14 14 14 14 … | (text: see the strings section) |
| replace | 0FB2E | 16 | 01E7E | 16 | 11 01 30 01 4e 01 6d 01 1a fc 00 00 … | 11 01 30 01 4e 01 6d 01 1c e7 00 00 … |
| replace | 0FB4E | 2 | 01E9E | 100 | (text: see the strings section) | (text: see the strings section) |
| replace | 0FB58 | 44 | 01F0A | 20056 | b5 12 ba 12 ba 12 ba 12 00 02 25 0a … | (text: see the strings section) |

## Strings (text-like printable runs of 4+ bytes in the whole image, owner stamp masked)

13 only in old, 70 only in new (a multiset difference, so a repeated string can appear once). Runs that look like machine code (no three letters in a row or a format specifier) are left out. Addresses and phone numbers are redacted.

### Only in old (up to 150)

```text
          Version 2.02   
"BFA
*tduY
?dtg
Divide error\r\nAbnormal program termination\r\n
GbPV
PQSRWV
PSQR
PjUh
PjxjP
gNYj
kEYW
unh0u
```

### Only in new (up to 150)

```text
          Version 2.04   
6dmh
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmP
6fmR
6fmR
6fmR
?dtu
Arg list too big
Attempted to remove current directory
Bad file number
Cross-device link
Divide error\r\n
Error 0
Exec format error
File already exists
GM:Abnormal program termination.\r\n                                                               …
GM:Bad Environment.\r\n
GM:Data seg must be < 64k.\r\n
GM:Heap must be < 64k.\r\n
GM:Not enough memory.\r\n-GM:Memory allocation strategy error (Last).\r\n.GM:Memory allocation stra…
Invalid access code
Invalid argument
Invalid data
Invalid environment
Invalid format
Invalid function number
Invalid memory block address
Math argument
Memory arena trashed
MicroChannel Bus Detected!\n
No more files
No such device
No such file or directory
Not enough memory
Not same device
Path not found
Permission denied
Possible deadlock
Result too large
Too many open files
Unknown error
jxjP
txjA
udh0u
uhj\r
```
