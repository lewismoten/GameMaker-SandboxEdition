# 2.02 → 3.00-xfer

Why this pair: control: 3.0 against the most common 2.x player.

Old: `archive:game-maker_arcade-ricky-2_shareware-games-galore.zip@a42b6b25e691302ac47811e9d1ed2153f78f05b5fdcf92309c0ccfaf09e8abf4!RICKY2.EXE` (sha256 `c57bd17579c48d86…`)
New: `cd/gm/xferplay.exe` (sha256 `404be3612012488e…`)

## Functions

| status | count |
| --- | --- |
| identical | 54 |
| relocated | 37 |
| calls-differ | 1 |
| data-moved | 0 |
| constants | 6 |
| changed | 263 |
| removed | 50 |
| added | 243 |

Matched 361 of 411 old and 604 new functions; 111 matches are low confidence (call-graph or order matches under 0.7 similarity).

Matched by stage: bytes 50, norm 38, strings 17, shape 6, callgraph 202, order 28, similarity 20.

Statuses: *identical* = same bytes with relocations masked and the same matched callees; *relocated* = same code once addresses, segments and string pointers are abstracted; *calls-differ* = same code but calling different (or unmatched) functions; *data-moved* = same instruction shape, and every differing immediate moved by an offset shift that at least three matched functions share (the data layout moved); *constants* = same instruction shape with other immediates or strings; *changed* = instructions differ (norm_sim is the share of matching normalized instructions). Full table: `functions.tsv`. The string hint is the rarest string the function appears to point at; an immediate can equal a string offset by coincidence.

### Changed functions (least similar first, up to 60)

| old | new | sizes | sim | method | name | string hint |
| --- | --- | --- | --- | --- | --- | --- |
| 03B4:53BD | 0826:718D | 166→120 | 0.16 changed | similarity |  |  |
| 03B4:1A0C | 0826:3AB7 | 548→580 | 0.18 changed | similarity |  |       G A M E - M A K E R |
| 03B4:6AA8 | 0826:86D7 | 188→165 | 0.26 changed | order |  |  |
| 1344:052D | 1AE9:0490 | 272→308 | 0.27 changed | order |  |  |
| 12B3:039B | 1A5A:0396 | 96→78 | 0.27 changed | strings |  | NotInit |
| 101C:0121 | 0826:BD21 | 27→50 | 0.31 changed | similarity |  |  |
| 122B:000F | 19BF:0223 | 817→639 | 0.32 changed | order |  | Congratulations! |
| 1344:035D | 1AE9:038F | 278→257 | 0.33 changed | callgraph |  |  |
| 11B0:0558 | 1953:055E | 205→253 | 0.34 changed | strings |  | ATI ULTRA |
| 03B4:7A8C | 0826:BF8A | 115→81 | 0.35 changed | callgraph |  |  |
| 0003:1B4D | 0000:20F6 | 28→45 | 0.36 changed | callgraph |  |  |
| 0003:19F9 | 0000:7EAC | 41→32 | 0.36 changed | similarity |  |  |
| 03B4:1F9C | 0826:4056 | 537→559 | 0.36 changed | strings |  | Missing File: |
| 1344:04C3 | 1AE9:0060 | 106→111 | 0.36 changed | callgraph |  |  |
| 03B4:51B6 | 0826:6F22 | 519→499 | 0.37 changed | similarity |  |  |
| 0DDC:05AA | 1546:05E3 | 33→31 | 0.37 changed | callgraph |  |  |
| 1344:0006 | 1AE9:00CF | 549→612 | 0.37 changed | callgraph |  |  |
| 11B0:0443 | 1953:0436 | 86→105 | 0.38 changed | strings |  | VGA= |
| 105B:07B9 | 17F8:07D5 | 467→493 | 0.38 changed | order |  | Error Opening Bkd %s! |
| 03B4:2F71 | 0826:4F56 | 1873→1651 | 0.40 changed | callgraph |  |  |
| 03B4:8877 | 0826:A8B1 | 31→50 | 0.41 changed | order |  |  |
| 105B:0790 | 17F8:07A5 | 41→48 | 0.44 changed | order |  |  |
| 03B4:396D | 0826:5AE9 | 662→627 | 0.44 changed | callgraph |  |  |
| 03B4:5463 | 0826:7205 | 189→228 | 0.45 changed | callgraph |  |  |
| 0003:057D | 0000:060D | 57→62 | 0.45 changed | callgraph |  |  |
| 03B4:5520 | 0826:72E9 | 532→355 | 0.47 changed | similarity |  |  |
| 0003:24D9 | 0000:2DFD | 88→225 | 0.47 changed | callgraph |  |  |
| 101C:0157 | 1781:041E | 187→142 | 0.47 changed | callgraph |  |  |
| 03B4:2D3F | 0826:4D49 | 130→81 | 0.47 changed | callgraph |  |  |
| 03B4:29CF | 0826:4A98 | 39→41 | 0.47 changed | callgraph |  |  |
| 03B4:21B5 | 0826:4285 | 792→778 | 0.47 changed | callgraph |  | This machine does not have a  |
| 03B4:7565 | 0826:91F8 | 177→181 | 0.47 changed | similarity |  |   (Q)uit |
| 03B4:2525 | 0826:4603 | 187→218 | 0.49 changed | callgraph |  |  |
| 03B4:7BF5 | 0826:9CAF | 116→140 | 0.49 changed | callgraph |  |  |
| 0E63:0F96 | 15BE:0EE9 | 675→727 | 0.50 changed | callgraph |  |  |
| 0003:0555 | 0000:74A8 | 9→15 | 0.50 changed | similarity |  |  |
| 03B4:17FE | 0826:3709 | 526→942 | 0.50 changed | callgraph |  | Save Game |
| 0003:17A3 | 0000:1EC7 | 118→142 | 0.51 changed | callgraph |  |  |
| 0DDC:0265 | 1546:0246 | 386→406 | 0.51 changed | callgraph |  | .voc |
| 03B4:000E | 0826:0347 | 675→931 | 0.51 changed | callgraph |  | ShowVideoMemory |
| 0003:1DFF | 0000:269E | 203→209 | 0.51 changed | callgraph |  |  |
| 1344:0473 | 1AE9:000D | 80→83 | 0.51 changed | callgraph |  |  |
| 0E63:1696 | 15BE:1636 | 127→130 | 0.52 changed | callgraph |  |  |
| 105B:070E | 17F8:071E | 130→135 | 0.52 changed | callgraph |  |  |
| 0E63:184E | 15BE:1808 | 175→227 | 0.52 changed | callgraph |  | Can't Find file! |
| 03B4:5E2C | 0826:7A74 | 95→115 | 0.52 changed | callgraph |  |  |
| 03B4:24CD | 0826:458F | 88→116 | 0.53 changed | callgraph |  |  |
| 03B4:7AFF | 0826:9BDF | 113→99 | 0.53 changed | similarity |  |  |
| 105B:01F9 | 17F8:01F8 | 461→457 | 0.53 changed | callgraph |  |  |
| 0DDC:05CB | 1546:0602 | 223→267 | 0.53 changed | callgraph |  | Can't Find file! |
| 03B4:7CBE | 0826:9D90 | 458→440 | 0.53 changed | callgraph |  |  |
| 03B4:25E0 | 0826:46DD | 989→937 | 0.53 changed | callgraph |  | Choose object to drop |
| 125F:021E | 1A0C:022D | 22→22 | 0.53 changed | callgraph |  |  |
| 0D6D:013C | 1BA8:083D | 11→21 | 0.53 changed | similarity |  |  |
| 0003:391E | 0000:41C0 | 335→358 | 0.54 changed | callgraph |  |  |
| 03B4:7B70 | 0826:9B10 | 133→118 | 0.54 changed | similarity |  |  |
| 0D6D:00FD | 14D6:00EB | 63→65 | 0.54 changed | callgraph |  |  |
| 03B4:8C1A | 0826:AC35 | 3272→3364 | 0.54 changed | callgraph |  | config.hlp |
| 03B4:2DC1 | 0826:4D9A | 432→444 | 0.54 changed | callgraph |  |  |
| 03B4:0852 | 0826:13AC | 138→140 | 0.54 changed | callgraph |  |  |

### Removed functions (old only) (50, largest first, up to 60)

| addr | size | name | string hint |
| --- | --- | --- | --- |
| 03B4:4042 | 3791 |  |  |
| 0E63:000E | 2231 |  | (E)xit. |
| 03B4:12A9 | 1365 |  | You have not saved a game! |
| 03B4:7616 | 992 |  | map\ |
| 03B4:0C4C | 972 |  |  |
| 03B4:02B1 | 879 |  | GMtitle.gif |
| 03B4:2714 | 767 |  | Choose object to drop |
| 10FD:00CF | 699 |  |  |
| 03B4:099C | 688 |  | .txt |
| 03B4:1CF1 | 683 |  | Score:     %ld |
| 03B4:4F11 | 675 |  |  |
| 10FD:038A | 666 |  |  |
| 03B4:1024 | 625 |  |  |
| 03B4:3E05 | 573 |  |  |
| 03B4:7374 | 497 |  |  |
| 03B4:3719 | 479 |  |  |
| 03B4:2B63 | 476 |  |  |
| 0DDC:06AA | 468 |  | (C)ontinue save    (D)o not save |
| 0E63:18FD | 441 |  | (C)ontinue save    (D)o not save |
| 03B4:99BA | 383 |  |  |
| 125F:025B | 378 |  |  |
| 0E63:0C08 | 343 |  | %s*.* |
| 03B4:5734 | 340 |  |  |
| 03B4:5888 | 337 |  |  |
| 0DDC:02D3 | 281 |  |  |
| 0E63:0D5F | 275 |  |  |
| 11B0:06C6 | 249 |  |  |
| 0DDC:030D | 223 |  |  |
| 10FD:0000 | 207 |  |  |
| 03B4:1C30 | 193 |  | gmhelp |
| 03B4:69F6 | 178 |  |  |
| 101C:008D | 148 |  |  |
| 0DAF:0009 | 144 |  |  |
| 0DDC:0009 | 127 |  | SOUND |
| 0DAF:0152 | 112 |  |  |
| 03B4:83F3 | 104 |  |  |
| 03B4:9B39 | 100 |  |  |
| 0DAF:00ED | 99 |  |  |
| 101C:0008 | 89 |  |  |
| 0DAF:0099 | 84 |  |  |
| 0003:0534 | 33 |  |  |
| 101C:013C | 27 |  |  |
| 12FF:000D | 25 |  |  |
| 0DDC:03E7 | 12 |  |  |
| 0003:055E | 11 |  |  |
| 0003:0572 | 11 |  |  |
| 125F:0234 | 10 |  |  |
| 125F:023E | 10 |  |  |
| 0003:0569 | 9 |  |  |
| 0003:12D4 | 1 |  |  |

### Added functions (new only) (243, largest first, up to 60)

| addr | size | name | string hint |
| --- | --- | --- | --- |
| 15BE:00AF | 3118 |  | (E)xit. |
| 0826:6283 | 2731 |  |  |
| 0826:2D40 | 2505 |  | Load Game |
| 0826:92AD | 2147 |  | I am missing these game files: |
| 0826:2117 | 1721 |  | Sorry...Out of Memory! |
| 0826:1548 | 1489 |  | %sdata%d.rec |
| 0826:1B4B | 1484 |  | .gif |
| 0000:59CC | 1142 |  |  |
| 0826:09E1 | 1009 |  |  |
| 0000:6FC8 | 1003 |  |  |
| 0000:54BE | 806 |  |  |
| 0826:5F7B | 776 |  |  |
| 0000:6B4A | 715 |  |  |
| 0000:6150 | 678 |  |  |
| 0826:27DC | 676 |  |  |
| 189D:014A | 621 |  | MicroChannel Bus Detected!\n |
| 1B4D:0008 | 599 |  |  |
| 189D:03B7 | 588 |  | MicroChannel Bus Detected!\n |
| 0000:7647 | 582 |  |  |
| 19BF:0005 | 542 |  | Top Ten Scores |
| 0000:0FF6 | 510 |  |  |
| 0826:07EA | 503 |  |  |
| 0826:6D2E | 500 |  |  |
| 0826:900C | 492 |  |  |
| 15BE:18EB | 491 |  | (C)ontinue save    (D)o not save |
| 0826:57D1 | 459 |  |  |
| 0826:5614 | 445 |  |  |
| 1CCC:0819 | 445 | TStringRef::splice(unsigned int,unsigned int,const char far*,unsigned int) |  |
| 0826:2B96 | 426 |  | .dat |
| 0826:BB00 | 400 |  |  |
| 0000:667F | 398 |  |  |
| 15BE:1437 | 381 |  |  |
| 189D:0758 | 378 |  |  |
| 0000:4BD1 | 372 |  |  |
| 0000:788D | 357 |  |  |
| 15BE:0CDD | 356 |  |  |
| 1BA8:03BA | 354 |  |  |
| 0000:4A7E | 339 |  |  |
| 1C63:000A | 331 |  |  |
| 0826:C1F2 | 320 |  |  |
| 1C63:0155 | 294 |  |  |
| 0826:BFF7 | 290 |  |  |
| 0826:BDD0 | 288 |  |  |
| 1B4D:025F | 278 |  |  |
| 0826:4C39 | 272 |  |  |
| 1BA8:0102 | 264 |  | MicroChannel Bus Detected!\n |
| 1B4D:0375 | 263 |  |  |
| 0000:6E15 | 258 |  |  |
| 0826:2A94 | 258 |  | .dat |
| 1BA8:02C7 | 243 |  |  |
| 1BA8:051C | 239 |  | New Frame: %d Size:%5lu Chunks:%u\n |
| 0826:7584 | 233 |  |  |
| 0826:599C | 231 |  |  |
| 1CCC:056E | 224 | TStringRef::TStringRef(const char far*,unsigned int,const char far*,unsigned int,unsigned int) |  |
| 1BA8:0852 | 211 |  |  |
| 0826:74B2 | 210 |  |  |
| 0826:C76B | 210 |  |  |
| 0826:3CFB | 205 |  | No game-specific help included. |
| 0000:6001 | 204 |  |  |
| 1781:000C | 204 |  | gm.cfg |

## Header and layout

| field | old | new |
| --- | --- | --- |
| file_size | 155156 | 160598 **≠** |
| image_size | 149012 | 152406 **≠** |
| header_bytes | 6144 | 8192 **≠** |
| relocations | 1105 | 1465 **≠** |
| entry_cs_ip | 0003:0004 | 0000:0000 **≠** |
| stack_ss_sp | 246B:0080 | 2C6E:0080 **≠** |
| min_max_alloc_paras | 18/65535 | 1857/65535 **≠** |
| overlay_bytes | 0 | 0 |
| header_0x1c | 0100fb50 | 0100fb50 |
| linker | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) |
| compiler | Borland C++ - Copyright 1991 Borland Intl. | Borland C++ - Copyright 1991 Borland Intl. |
| version_string | 2.02 | 3.00 **≠** |
| stamp_slot | stamped (contents masked) | none **≠** |
| packer |  |  |
| DGROUP paragraph | 14A9 | 232C **≠** |
| code region bytes (before DGROUP) | 84624 | 144064 **≠** |
| code segments referenced by relocations | 22 | 29 **≠** |
| functions found | 411 | 604 **≠** |
| bytes inside functions | 80140 | 112663 **≠** |
| code-region bytes outside functions (far data, tables, padding, missed code) | 4484 | 31401 **≠** |
| data bytes from DGROUP to image end | 64388 | 8342 **≠** |

MZ has no linker timestamp, import table or resource section. The closest analogues follow: DOS and BIOS services called, I/O ports touched, and recognizable embedded files.

## DOS/BIOS services (int, with AH when set just before)

| service | old uses | new uses |
| --- | --- | --- |
| int 10h | 2 | 3 |
| int 15h AH=C0h | 0 | 1 |
| int 33h AH=00h | 0 | 7 |

## I/O ports (in/out)

| service | old uses | new uses |
| --- | --- | --- |
| in 3D5h | 6 | 5 |
| in 3DAh | 3 | 10 |
| in dx(variable) | 14 | 8 |
| out 21h | 2 | 4 |
| out 3C5h | 1 | 2 |
| out 3C8h | 5 | 11 |
| out 3D4h | 11 | 10 |
| out dx(variable) | 26 | 18 |

## Embedded files

Old: none found.
New: none found.

## Data (DGROUP to end of image, relocations masked, aligned on NUL-ended and content-defined runs)

delete 6, equal_bytes 3504, insert 5, new_bytes_changed 4838, old_bytes_changed 60884, replace 40

| kind | old offset | old bytes | new offset | new bytes | old preview | new preview |
| --- | --- | --- | --- | --- | --- | --- |
| replace | 0002F | 36661 | 0002F | 606 | (text: see the strings section) | (text: see the strings section) |
| insert | 08F68 | 0 | 00291 | 238 |  | (text: see the strings section) |
| replace | 08F6A | 1396 | 00381 | 6 | (text: see the strings section) | (text: see the strings section) |
| insert | 0950A | 0 | 003B3 | 24 |  | (text: see the strings section) |
| insert | 09519 | 0 | 003DA | 28 |  | (text: see the strings section) |
| replace | 0951E | 25 | 003FB | 21 | (text: see the strings section) | (text: see the strings section) |
| replace | 09557 | 213 | 00430 | 107 | (text: see the strings section) | (text: see the strings section) |
| replace | 09676 | 15 | 004E5 | 28 | (text: see the strings section) | (text: see the strings section) |
| replace | 0968A | 15 | 00506 | 42 | (text: see the strings section) | (text: see the strings section) |
| replace | 0969C | 147 | 00533 | 120 | (text: see the strings section) | (text: see the strings section) |
| replace | 0977B | 14 | 005F7 | 14 | (text: see the strings section) | (text: see the strings section) |
| replace | 09964 | 8 | 007E0 | 8 | (text: see the strings section) | (text: see the strings section) |
| delete | 09980 | 31 | 007FC | 0 | (text: see the strings section) |  |
| replace | 099FF | 58 | 0085C | 32 | (text: see the strings section) | (text: see the strings section) |
| replace | 09ADD | 31 | 00920 | 30 | (text: see the strings section) | (text: see the strings section) |
| replace | 09B14 | 6 | 00956 | 35 | (text: see the strings section) | (text: see the strings section) |
| replace | 09B1B | 29 | 0097A | 28 | (text: see the strings section) | (text: see the strings section) |
| delete | 09B3A | 31 | 00998 | 0 | (text: see the strings section) |  |
| replace | 09B76 | 2 | 009B5 | 1 | (text: see the strings section) | (text: see the strings section) |
| replace | 09CE0 | 103 | 00B1E | 9 | (text: see the strings section) | (text: see the strings section) |
| replace | 09D66 | 33 | 00B46 | 15 | (text: see the strings section) | (text: see the strings section) |
| insert | 09D93 | 0 | 00B61 | 110 |  | (text: see the strings section) |
| replace | 09E6F | 1045 | 00CAB | 175 | (text: see the strings section) | (text: see the strings section) |
| replace | 0A28A | 103 | 00D60 | 37 | (text: see the strings section) | (text: see the strings section) |
| delete | 0A2F4 | 5 | 00D88 | 0 | (text: see the strings section) |  |
| replace | 0A31A | 186 | 00DA9 | 49 | (text: see the strings section) | (text: see the strings section) |
| replace | 0A3F0 | 2045 | 00DF6 | 6 | (text: see the strings section) | (text: see the strings section) |
| replace | 0AC04 | 30 | 00E13 | 18 | 2a 25 73 00 bb 20 c4 c4 c4 c4 c4 c4 … | bb 20 c4 c4 c4 c4 c4 c4 c4 c4 c4 c4 … |
| replace | 0AC5B | 150 | 00E5E | 22 | (text: see the strings section) | 2e 2e 5c 00 bb 20 c4 c4 c4 c4 c4 c4 … |
| replace | 0AD88 | 11 | 00F0B | 20 | (text: see the strings section) | (text: see the strings section) |
| replace | 0ADDE | 2 | 00F6A | 75 | 03 00 | (text: see the strings section) |
| replace | 0ADEA | 17062 | 00FBF | 29 | (text: see the strings section) | (text: see the strings section) |
| delete | 0F142 | 10 | 0108E | 0 | (text: see the strings section) |  |
| replace | 0F14F | 29 | 01091 | 34 | (text: see the strings section) | (text: see the strings section) |
| replace | 0F16F | 18 | 010B6 | 22 | (text: see the strings section) | (text: see the strings section) |
| replace | 0F1A4 | 111 | 010EF | 210 | (text: see the strings section) | (text: see the strings section) |
| replace | 0F21E | 10 | 011CC | 30 | (text: see the strings section) | (text: see the strings section) |
| replace | 0F233 | 10 | 011F5 | 30 | (text: see the strings section) | (text: see the strings section) |
| replace | 0F245 | 13 | 0121B | 33 | (text: see the strings section) | (text: see the strings section) |
| replace | 0F25A | 76 | 01244 | 197 | (text: see the strings section) | (text: see the strings section) |
| replace | 0F57A | 28 | 015DD | 38 | (text: see the strings section) | (text: see the strings section) |
| delete | 0F59E | 152 | 0160B | 0 | (text: see the strings section) |  |
| replace | 0F645 | 108 | 0161A | 145 | (text: see the strings section) | (text: see the strings section) |
| replace | 0F6F2 | 23 | 016EC | 949 | (text: see the strings section) | (text: see the strings section) |
| replace | 0F729 | 3 | 01AC1 | 3 | 01 40 40 | 81 40 40 |
| replace | 0F738 | 13 | 01AD0 | 13 | 40 02 02 02 02 02 02 02 02 02 02 40 … | 40 12 12 12 12 12 12 12 12 12 12 40 … |
| delete | 0F80A | 564 | 01BA2 | 0 | d2 02 00 00 d2 02 00 00 d2 02 00 00 … |  |
| replace | 0FA57 | 199 | 01BBB | 863 | 05 05 05 05 05 05 05 05 14 14 14 14 … | 05 05 05 05 05 05 05 05 14 14 14 14 … |
| replace | 0FB2E | 16 | 01F2A | 16 | 11 01 30 01 4e 01 6d 01 1a fc 00 00 … | 11 01 30 01 4e 01 6d 01 ec 93 00 00 … |
| insert | 0FB50 | 0 | 01F4C | 218 |  | (text: see the strings section) |
| replace | 0FB58 | 44 | 0202E | 104 | b5 12 ba 12 ba 12 ba 12 00 02 25 0a … | 5c 7c 61 7c 61 7c 61 7c 01 20 f7 bf … |

## Strings (text-like printable runs of 4+ bytes in the whole image, owner stamp masked)

141 only in old, 182 only in new (a multiset difference, so a repeated string can appear once). Runs that look like machine code (no three letters in a row or a format specifier) are left out. Addresses and phone numbers are redacted.

### Only in old (up to 150)

```text
                Top Ten Scores
              Hit any key to exit
          Version 2.02   
     Congratulations!
   on the Top Ten list!
  (E)xit
  (Q)uit
  (Q)uit
 %2d:%10ld 
[redacted: address or phone]
[redacted: address or phone]
 Problem writing Top Score File
 You have scored number %2d
"BFA
%s*.*
(C)ontinue
(C)ontinue save    (D)o not save
(E)xit (R)etry
(E)xit (R)etry
(R)etry (A)bort
*tduY
.bbl
.bbl
.bbl
.cbl
.cbl
.cbl
.chr
.chr
.cmf
.cmf
.cmf
.cmf
.cmf
.cmf
.map
.map
.mbl
.mbl
.mbl
.mon
.mon
.mon
.pal
.pal
.pal
.sav
.sav
.snd
.snd
.snd
.txt
.txt
.txt
.txt
.txt
.txt
?dtg
ATI Wonder
Auto-Detect
Divide error\r\nAbnormal program termination\r\n
Enter Your Name: 
Error Opening %s!
Error Opening %s!
GMtitle.gif
GbPV
Hit a key...
I can't access the disk!
I can't access the disk!  Did you remember to insert one?
NOT ENOUGH MEMORY!
NOT ENOUGH MEMORY!
No game-specific credits given
No game-specific help included
No game-specific instructions 
No game-specific storyline.   
PQSRWV
PSQR
PSQR
Paradise
PjUh
PjUh
PjxjP
SOUND
This directory doesn't exist!
This file already exists! Saving now will destroy the old file!
This machine does not have a  
Trident 8800
Trident 8900
Tseng ET3000
Tseng ET4000
Unable to Save!
You are missing %s.gam!  I can't do anything without it!
You are missing Game Maker's Title Screen (gmtitle.gif)!\n
You have not saved a game!
blk\
blk\
blk\
blk\
blk\
blk\
blk\
blk\
blk\
cannot configure a joystick   
chr\
chr\
gNYj
gam\
gam\
gam\
gam\
gam\
gam\
gam\
game port and joystick.       
game port installed!     You  
gif\
gmhelp
jdj(
jdj(
kEYW
map\
map\
mon\
mon\
mon\
pal\
pal\
pal\
snd\
snd\
snd\
snd\
snd\
snd\
snd\
snd\
snd\
snd\
unh0u
until you have installed a    
```

### Only in new (up to 150)

```text
          Version 3.00   
  New Chunk: Size:%5lu 
%10ld %s
%10ld Your Latest Score
%sdata%d.rec
%sgame%d.sav
%sgame%d.sav
&;Glr
&;Wnu#&;Glu
(A)bort Save    (R)etry
**BCCxh1
**BCCxh1U
.dat
.dat
.fli
.gif
.his
.lst
.rec
.rec
2IVIVI8IVIIIVIVI2IU
<notype>
?dtu
Arg list too big
Attempted to remove current directory
Bad file number
Bad_cast
Bad_typeid
ConfigData
Congratulations!
Cross-device link
Debug
Divide error\r\n
Enter Your Name:
Error 0
Error Opening Bkd %s!
Error Opening Gif %s!
Exec format error
File already exists
FileListClass
FileRead
GAB;
GM:Abnormal program termination.\r\n                                                               …
GM:Bad Environment.\r\n
GM:Data seg must be < 64k.\r\n
GM:Heap must be < 64k.\r\n
GM:Not enough memory.\r\n-GM:Memory allocation strategy error (Last).\r\n.GM:Memory allocation stra…
GameClass
Hit any key
Hit any key...
Invalid access code
Invalid argument
Invalid data
Invalid environment
Invalid format
Invalid function number
Invalid memory block address
Load Game
Math argument
Memory arena trashed
MicroChannel Bus Detected!\n
New Frame: %d Size:%5lu Chunks:%u\n
No game-specific credits given.
No game-specific help included.
No game-specific instructions.
No game-specific storyline.
No more files
No such device
No such file or directory
Not enough memory
Not same device
O*OBOQO`OtO
ObPbPbPbP
Out of memory
P+P:PNPU
PPPP
PPPP
PPPP
PPPP
PPPP
PPPP
PPPP
PQRSTUVW
PSQRW
Path not found
Permission denied
PkQkQkQkQ
Playback with %s.\n
Possible deadlock
Q#Q5Q@QKQ[Q
Recording
Recording *
Result too large
RhShShShS
S*S8SCSNS[SU
SavNames
SavNames
Save Game
SceneFiles
Simulate
Sorry...Out of Memory!
String reference out of range
String reference out of range
String reference out of range
T;TFT'T1T;TFT
TReference
TStringRef
TStringRef *
This game has not been saved!
This machine does not have a 
Too many open files
Top Ten Scores
Type_info
Type_info *
UnTitled
Unknown error
VWh&
Video Driver
WPSR
You are missing %s!  I can't do anything without it!
You scored number %2d on the Top Ten!
\RjRxR
\zxcvbnm,./
_^][[ZYX
asdfghjkl;'`
be simulated in Software
cannot configure a joystick  
data*.rec
fXf3
game port and joystick.      
game port installed!     You 
gm.cfg
gm.cfg
jHj(
jHj(
jPj(
jPj(
jPj(
jPj(
jPj(
jPj@
jPj@
jPj@
jXj(
jXj(
jXj(
jhj(
jhj(
jhj(
jhj(
```
