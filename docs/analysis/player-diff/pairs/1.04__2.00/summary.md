# 1.04 → 2.00

Why this pair: chain.

Old: `archive:game-maker_msdos-barracuda-secret-mission-1-1992.zip@764f625e79bd85cef101ec063e67351725d0ccd433c29e15870b20a3e1798867!baraSM1%2FBCUDA1SW.EXE` (sha256 `8e9f2e663531adf8…`)
New: `archive:game-maker_blinky-2.zip@1dcea7c24df8edca1f96ff9341f40bdadc6788a0ca9563595ac5cb52e98b22c8!BLINKY2.EXE` (sha256 `48375bfed6986342…`)

## Functions

| status | count |
| --- | --- |
| identical | 61 |
| relocated | 28 |
| calls-differ | 0 |
| data-moved | 0 |
| constants | 11 |
| changed | 167 |
| removed | 92 |
| added | 144 |

Matched 267 of 359 old and 411 new functions; 72 matches are low confidence (call-graph or order matches under 0.7 similarity).

Matched by stage: bytes 57, norm 26, strings 9, shape 11, callgraph 125, order 3, similarity 36.

Statuses: *identical* = same bytes with relocations masked and the same matched callees; *relocated* = same code once addresses, segments and string pointers are abstracted; *calls-differ* = same code but calling different (or unmatched) functions; *data-moved* = same instruction shape, and every differing immediate moved by an offset shift that at least three matched functions share (the data layout moved); *constants* = same instruction shape with other immediates or strings; *changed* = instructions differ (norm_sim is the share of matching normalized instructions). Full table: `functions.tsv`. The string hint is the rarest string the function appears to point at; an immediate can equal a string offset by coincidence.

### Changed functions (least similar first, up to 60)

| old | new | sizes | sim | method | name | string hint |
| --- | --- | --- | --- | --- | --- | --- |
| 04A5:6E92 | 03B4:72DE | 415→497 | 0.32 changed | similarity |  |  |
| 04A5:0EC9 | 03B4:124F | 1529→1363 | 0.36 changed | order |  | You have not saved a game! |
| 0000:267F | 0003:1310 | 65→97 | 0.37 changed | callgraph |  |  |
| 0000:2158 | 0003:0701 | 71→87 | 0.38 changed | similarity |  |  |
| 0000:48C9 | 0003:05B6 | 36→18 | 0.39 changed | similarity |  |  |
| 0000:21CB | 0003:391E | 300→335 | 0.40 changed | callgraph |  |  |
| 04A5:05BF | 03B4:0822 | 434→138 | 0.40 changed | order |  | You are missing %s.gam!  I can't do any… |
| 04A5:82D2 | 03B4:87D3 | 29→31 | 0.40 changed | callgraph |  |  |
| 0000:09FB | 03B4:6ACE | 87→61 | 0.41 changed | similarity |  |  |
| 0D04:000A | 0E59:0008 | 2509→2231 | 0.41 changed | callgraph |  | (E)xit. |
| 04A5:0771 | 03B4:08AC | 173→192 | 0.41 changed | strings |  | Play |
| 04A5:72FE | 0DD2:05C5 | 132→223 | 0.42 changed | callgraph |  | Can't Find file! |
| 0000:2C57 | 0003:065B | 47→32 | 0.42 changed | callgraph |  |  |
| 04A5:386F | 03B4:3D6F | 625→573 | 0.42 changed | similarity |  | OH NO! |
| 0000:0F32 | 0003:2255 | 243→244 | 0.42 changed | callgraph |  |  |
| 04A5:74A1 | 03B4:7C1A | 456→458 | 0.43 changed | callgraph |  |  |
| 0EC6:0468 | 1339:0357 | 288→278 | 0.43 changed | callgraph |  |  |
| 04A5:289C | 03B4:2CA9 | 196→130 | 0.43 changed | similarity |  |  |
| 105E:0373 | 11A5:0493 | 99→71 | 0.45 changed | similarity |  | Trident 8800 VGA chip detected!\n |
| 0000:027F | 0003:1C97 | 45→40 | 0.45 changed | callgraph |  |  |
| 04A5:6D70 | 03B4:7164 | 145→138 | 0.46 changed | similarity |  |  |
| 0000:01B2 | 0003:01EE | 67→87 | 0.46 changed | callgraph |  |  |
| 1192:0295 | 139D:0008 | 102→62 | 0.46 changed | similarity |  | You are missing %s.gam!  I can't do any… |
| 0D04:1734 | 0E59:1680 | 95→127 | 0.47 changed | callgraph |  |  |
| 0EC6:0036 | 1011:0087 | 140→148 | 0.49 changed | callgraph |  |  |
| 04A5:266C | 03B4:2A6C | 89→97 | 0.50 changed | similarity |  |  |
| 04A5:5574 | 03B4:5978 | 314→375 | 0.50 changed | similarity |  |  |
| 0000:0CAE | 0003:204B | 204→188 | 0.50 changed | callgraph |  |  |
| 04A5:2049 | 03B4:249D | 205→187 | 0.51 changed | callgraph |  |  |
| 04A5:0D1F | 03B4:0FD8 | 406→611 | 0.51 changed | callgraph |  |  |
| 04A5:081E | 03B4:096C | 476→674 | 0.52 changed | callgraph |  | .txt |
| 04A5:3176 | 03B4:362C | 100→87 | 0.53 changed | similarity |  |  |
| 1106:0383 | 12A8:03F5 | 126→59 | 0.53 changed | callgraph |  | joysetup.exe |
| 04A5:14C2 | 03B4:17A2 | 349→482 | 0.54 changed | callgraph |  | I cannot save your game! |
| 04A5:3604 | 03B4:3B6D | 619→514 | 0.54 changed | similarity |  |  |
| 04A5:0215 | 03B4:02B1 | 496→837 | 0.54 changed | callgraph |  | GMtitle.gif |
| 04A5:2017 | 03B4:2445 | 50→88 | 0.55 changed | callgraph |  |  |
| 04A5:7382 | 03B4:7B51 | 111→116 | 0.55 changed | callgraph |  |  |
| 0D04:1011 | 0E59:0F90 | 567→675 | 0.56 changed | callgraph |  |  |
| 0FFD:04E3 | 10F1:062E | 314→318 | 0.56 changed | similarity |  |  |
| 0000:16C7 | 0003:2C24 | 418→506 | 0.56 changed | callgraph |  |  |
| 105E:019F | 11A5:017E | 265→200 | 0.56 changed | callgraph |  | 761295520 |
| 0000:12C1 | 0003:18E6 | 80→73 | 0.57 changed | callgraph |  |  |
| 04A5:56AE | 03B4:5AEF | 576→679 | 0.57 changed | similarity |  |  |
| 04A5:2116 | 03B4:2558 | 1034→975 | 0.59 changed | callgraph |  | Choose object to drop |
| 04A5:5EC2 | 03B4:6316 | 416→376 | 0.60 changed | similarity |  |  |
| 04A5:1D22 | 03B4:212D | 757→792 | 0.61 changed | callgraph |  | This machine does not have a   |
| 04A5:5A59 | 03B4:5EEA | 98→102 | 0.61 changed | similarity |  |  |
| 04A5:6171 | 03B4:65B6 | 441→418 | 0.61 changed | callgraph |  |  |
| 0000:0913 | 0003:1ECC | 165→156 | 0.62 changed | callgraph |  |  |
| 0000:0D7A | 0003:2107 | 205→207 | 0.62 changed | callgraph |  |  |
| 04A5:0009 | 03B4:000E | 524→675 | 0.62 changed | callgraph |  | ShowVideoMemory |
| 04A5:1BB5 | 03B4:1F14 | 365→537 | 0.62 changed | callgraph |  | Missing File: |
| 0000:236D | 13DE:0299 | 14→19 | 0.62 changed | similarity | _sbfd_instrument |  |
| 0000:066D | 0003:17A3 | 128→118 | 0.63 changed | callgraph |  |  |
| 04A5:5965 | 03B4:5DF5 | 241→242 | 0.63 changed | similarity |  |  |
| 04A5:1843 | 03B4:1BA8 | 175→193 | 0.64 changed | callgraph |  | gmhelp |
| 04A5:255E | 03B4:2960 | 270→268 | 0.64 changed | similarity |  |  |
| 0000:2D61 | 0003:2888 | 332→367 | 0.64 changed | callgraph |  |  |
| 04A5:656A | 03B4:6960 | 204→178 | 0.64 changed | similarity |  |  |

### Removed functions (old only) (92, largest first, up to 60)

| addr | size | name | string hint |
| --- | --- | --- | --- |
| 04A5:3AE0 | 4003 |  |  |
| 0D04:02BF | 1816 |  | (R)eenter name (E)xit |
| 0D04:0AE9 | 1814 |  | (R)eenter name (E)xit |
| 0D04:0BD3 | 1814 |  | (R)eenter name (E)xit |
| 04A5:7BD3 | 1686 |  |  |
| 04A5:2B54 | 1570 |  |  |
| 04A5:4A83 | 901 |  |  |
| 04A5:09FA | 793 |  |  |
| 0FFD:00E9 | 741 |  |  |
| 04A5:52C2 | 637 |  |  |
| 04A5:6ABE | 588 |  | You are missing %s.gam!  I can't do any… |
| 0000:3F0F | 528 |  |  |
| 04A5:2960 | 500 |  |  |
| 04A5:7031 | 491 |  | map\ |
| 04A5:26C5 | 471 |  |  |
| 04A5:3451 | 435 |  |  |
| 04A5:5117 | 427 |  |  |
| 0000:313C | 416 |  | PATH |
| 0EC6:0110 | 398 |  |  |
| 0000:48ED | 364 |  |  |
| 04A5:5ABB | 359 |  |  |
| 04A5:5C22 | 336 |  |  |
| 04A5:5D72 | 336 |  |  |
| 0000:04FC | 331 |  |  |
| 04A5:697E | 320 |  |  |
| 04A5:557E | 304 |  |  |
| 0000:3015 | 295 |  |  |
| 0000:02AC | 292 |  |  |
| 105E:05F0 | 287 |  |  |
| 04A5:6062 | 271 |  |  |
| 04A5:500F | 264 |  |  |
| 105E:000F | 259 |  | Standard |
| 0000:03FA | 258 |  |  |
| 04A5:6636 | 240 |  |  |
| 0FFD:03FF | 228 |  |  |
| 0FFD:0006 | 227 |  |  |
| 1192:007E | 220 |  | You are missing %s.gam!  I can't do any… |
| 1192:015E | 220 |  | You are missing %s.gam!  I can't do any… |
| 0000:13AA | 207 |  |  |
| 0000:1924 | 202 |  |  |
| 04A5:7983 | 202 |  |  |
| 0F4E:0448 | 199 |  |  |
| 0000:0AB0 | 196 |  |  |
| 0000:4818 | 177 |  |  |
| 04A5:73F1 | 176 |  |  |
| 0000:1479 | 166 |  |  |
| 0EC6:03CF | 153 |  |  |
| 04A5:6E01 | 145 |  | You are missing %s.gam!  I can't do any… |
| 0EC6:0796 | 138 |  |  |
| 04A5:33D5 | 122 |  |  |
| 0000:3CE4 | 121 |  |  |
| 105E:0126 | 121 |  | No super Vga card detected! Assuming st… |
| 04A5:58EE | 119 |  |  |
| 04A5:6726 | 113 |  |  |
| 0000:20F2 | 102 |  | .$$$ |
| 04A5:6D0A | 102 |  |  |
| 0EC6:0730 | 102 |  |  |
| 0000:1311 | 87 |  |  |
| 1192:023E | 86 |  | You are missing %s.gam!  I can't do any… |
| 0000:1C07 | 81 |  |  |

### Added functions (new only) (144, largest first, up to 60)

| addr | size | name | string hint |
| --- | --- | --- | --- |
| 03B4:3FAC | 3791 |  |  |
| 03B4:8B76 | 3272 |  | config.hlp |
| 03B4:2EDB | 1873 |  |  |
| 03B4:6C8F | 1094 |  |  |
| 03B4:7580 | 978 |  | map\ |
| 03B4:0C0E | 958 |  |  |
| 03B4:83B7 | 949 |  |  |
| 03B4:87F2 | 900 |  | Auto-Detect |
| 03B4:267E | 767 |  | Choose object to drop |
| 10F1:00D9 | 699 |  |  |
| 03B4:4E7B | 675 |  |  |
| 10F1:0394 | 666 |  |  |
| 03B4:38D7 | 662 |  |  |
| 03B4:1CE6 | 633 |  | Score:     %ld |
| 1339:0000 | 549 |  |  |
| 03B4:548A | 532 |  |  |
| 03B4:2ACD | 476 |  |  |
| 0DD2:06A4 | 468 |  | (C)ontinue save    (D)o not save |
| 03B4:7EFA | 450 |  |  |
| 0DD2:0082 | 436 |  |  |
| 03B4:2D2B | 432 |  |  |
| 0003:0839 | 418 |  |  |
| 1253:0079 | 394 |  |  |
| 03B4:6B0B | 388 |  |  |
| 0DD2:025F | 386 |  | .voc |
| 03B4:9916 | 383 |  |  |
| 1253:0265 | 378 |  |  |
| 10F1:08C3 | 370 |  |  |
| 03B4:608B | 342 |  |  |
| 10F1:076E | 341 |  |  |
| 03B4:569E | 340 |  |  |
| 03B4:57F2 | 337 |  |  |
| 0DD2:045B | 329 |  | BLASTER |
| 03B4:5F50 | 315 |  |  |
| 03B4:61E1 | 309 |  |  |
| 03B4:648E | 296 |  |  |
| 0DD2:02CD | 281 |  |  |
| 1339:0527 | 272 |  |  |
| 03B4:71EE | 240 |  |  |
| 11A5:009A | 228 |  | Paradise Super VGA detected!\n |
| 0DD2:0307 | 223 |  |  |
| 10F1:0A6F | 216 |  |  |
| 10F1:000A | 207 |  |  |
| 11A5:0552 | 205 |  | ATI ULTRA |
| 13A5:00B6 | 201 | _SvgaBufToScrn |  |
| 03B4:53CD | 189 |  |  |
| 0D87:0004 | 189 |  |  |
| 03B4:6A12 | 188 |  |  |
| 0D63:0009 | 181 |  |  |
| 0003:3271 | 180 |  |  |
| 03B4:74CF | 177 |  |   (Q)uit |
| 03B4:5327 | 166 |  |  |
| 03B4:814E | 156 |  |  |
| 13DE:00E8 | 154 | _sbc_check_card |  |
| 13A5:000E | 151 |  |  |
| 03B4:7952 | 150 |  |  |
| 11A5:0007 | 147 |  | Standard |
| 03B4:70D5 | 143 |  |  |
| 1253:04C9 | 137 |  |  |
| 0DD2:0003 | 127 |  | SOUND |

## Header and layout

| field | old | new |
| --- | --- | --- |
| file_size | 83136 | 154980 **≠** |
| image_size | 78528 | 148836 **≠** |
| header_bytes | 4608 | 6144 **≠** |
| relocations | 1063 | 1094 **≠** |
| entry_cs_ip | 0000:0000 | 0003:0004 **≠** |
| stack_ss_sp | 216D:0080 | 2460:0080 **≠** |
| min_max_alloc_paras | 3657/65535 | 18/65535 **≠** |
| overlay_bytes | 0 | 0 |
| header_0x1c | 0100fb30 | 0100fb50 **≠** |
| linker | Borland TLINK (0x1E=FB, version byte 0x30 = 3.0 by TLINK's convention) | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) **≠** |
| compiler | Borland C++ - Copyright 1991 Borland Intl. | Borland C++ - Copyright 1991 Borland Intl. |
| version_string | 1.04 | 2.00 **≠** |
| stamp_slot | none | stamped (contents masked) **≠** |
| packer |  |  |
| DGROUP paragraph | 11DD | 149E **≠** |
| code region bytes (before DGROUP) | 73168 | 84448 **≠** |
| code segments referenced by relocations | 14 | 22 **≠** |
| functions found | 359 | 411 **≠** |
| bytes inside functions | 74241 | 79968 **≠** |
| code-region bytes outside functions (far data, tables, padding, missed code) | -1073 | 4480 **≠** |
| data bytes from DGROUP to image end | 5360 | 64388 **≠** |

MZ has no linker timestamp, import table or resource section. The closest analogues follow: DOS and BIOS services called, I/O ports touched, and recognizable embedded files.

## DOS/BIOS services (int, with AH when set just before)

| service | old uses | new uses |
| --- | --- | --- |
| int 10h AH=11h | 1 | 2 |
| int 21h AH=07h | 1 | 0 |
| int 21h AH=0Eh | 1 | 0 |
| int 21h AH=19h | 1 | 0 |
| int 21h AH=29h | 4 | 0 |
| int 21h AH=3Bh | 1 | 0 |
| int 21h AH=3Dh | 2 | 1 |
| int 21h AH=3Eh | 3 | 1 |
| int 21h AH=3Fh | 2 | 1 |
| int 21h AH=42h | 5 | 7 |
| int 21h AH=43h | 1 | 3 |
| int 21h AH=47h | 1 | 0 |
| int 21h AH=4Ah | 4 | 2 |
| int 21h AH=4Bh | 1 | 0 |
| int 21h AH=4Dh | 1 | 0 |
| int 21h AH=58h | 0 | 2 |
| int 21h AH=67h | 0 | 1 |

## I/O ports (in/out)

| service | old uses | new uses |
| --- | --- | --- |
| in 20h | 1 | 0 |
| in 3D5h | 0 | 6 |
| in 3DAh | 4 | 3 |
| in dx(variable) | 11 | 14 |
| out 20h | 1 | 0 |
| out 3C0h | 0 | 2 |
| out 3C5h | 2 | 1 |
| out 3C8h | 4 | 5 |
| out 3C9h | 12 | 0 |
| out 3D4h | 2 | 11 |
| out 3D5h | 1 | 7 |
| out 40h | 0 | 2 |
| out 43h | 2 | 3 |
| out dx(variable) | 14 | 26 |

## Embedded files

Old: none found.
New: none found.

## Data (DGROUP to end of image, relocations masked, aligned on NUL-ended and content-defined runs)

delete 1, equal_bytes 3754, insert 12, new_bytes_changed 60634, old_bytes_changed 1606, replace 32

| kind | old offset | old bytes | new offset | new bytes | old preview | new preview |
| --- | --- | --- | --- | --- | --- | --- |
| replace | 0002F | 109 | 0002F | 36665 | (text: see the strings section) | (text: see the strings section) |
| replace | 0009E | 102 | 08F6A | 1396 | 1e 00 00 00 01 00 00 00 00 00 00 00 … | (text: see the strings section) |
| replace | 00130 | 11 | 0950A | 15 | (text: see the strings section) | (text: see the strings section) |
| insert | 001BF | 0 | 0959D | 20 |  | (text: see the strings section) |
| insert | 00284 | 0 | 09676 | 10 |  | (text: see the strings section) |
| insert | 002A0 | 0 | 0969C | 72 |  | (text: see the strings section) |
| insert | 002DC | 0 | 09720 | 10 |  | (text: see the strings section) |
| insert | 002E4 | 0 | 09732 | 37 |  | (text: see the strings section) |
| replace | 00308 | 14 | 0977B | 14 | (text: see the strings section) | (text: see the strings section) |
| replace | 0054E | 29 | 099C1 | 29 | (text: see the strings section) | (text: see the strings section) |
| delete | 00579 | 15 | 099EC | 0 | (text: see the strings section) |  |
| replace | 0058A | 28 | 099EE | 44 | (text: see the strings section) | (text: see the strings section) |
| replace | 00661 | 31 | 09AD5 | 8 | (text: see the strings section) | (text: see the strings section) |
| replace | 00778 | 31 | 09BD5 | 24 | (text: see the strings section) | (text: see the strings section) |
| replace | 007F4 | 31 | 09C4A | 24 | (text: see the strings section) | (text: see the strings section) |
| replace | 00896 | 7 | 09CE5 | 28 | (text: see the strings section) | (text: see the strings section) |
| insert | 008E3 | 0 | 09D47 | 44 |  | (text: see the strings section) |
| insert | 008ED | 0 | 09D7D | 10 |  | (text: see the strings section) |
| replace | 008F3 | 13 | 09D8D | 1271 | (text: see the strings section) | (text: see the strings section) |
| replace | 00906 | 39 | 0A28A | 330 | (text: see the strings section) | (text: see the strings section) |
| replace | 0094B | 5 | 0A3F2 | 2066 | (text: see the strings section) | (text: see the strings section) |
| replace | 00954 | 20 | 0AC08 | 26 | 20 20 20 20 20 20 20 00 bb 20 c4 c4 … | bb 20 c4 c4 c4 c4 c4 c4 c4 c4 20 c9 … |
| replace | 009A1 | 47 | 0AC5B | 83 | (text: see the strings section) | (text: see the strings section) |
| replace | 009D4 | 18 | 0ACB2 | 12 | (text: see the strings section) | (text: see the strings section) |
| replace | 00AFF | 108 | 0ADD7 | 16 | 25 73 25 73 00 00 00 00 00 00 00 1f … | (text: see the strings section) |
| replace | 00B6E | 13 | 0ADEA | 17062 | (text: see the strings section) | (text: see the strings section) |
| replace | 00C0E | 11 | 0F123 | 31 | (text: see the strings section) | (text: see the strings section) |
| replace | 00C7B | 5 | 0F1A4 | 6 | (text: see the strings section) | (text: see the strings section) |
| insert | 00D67 | 0 | 0F291 | 21 |  | (text: see the strings section) |
| insert | 00E0F | 0 | 0F34E | 21 |  | (text: see the strings section) |
| replace | 00E14 | 228 | 0F368 | 68 | (text: see the strings section) | (text: see the strings section) |
| insert | 00F58 | 0 | 0F40C | 91 |  | (text: see the strings section) |
| insert | 00F76 | 0 | 0F485 | 273 |  | (text: see the strings section) |
| replace | 0106B | 47 | 0F68B | 77 | (text: see the strings section) | (text: see the strings section) |
| insert | 0109D | 0 | 0F6DB | 11 |  | (text: see the strings section) |
| replace | 010A0 | 23 | 0F6E9 | 32 | (text: see the strings section) | (text: see the strings section) |
| replace | 011B8 | 16 | 0F80A | 14 | (text: see the strings section) | d2 02 00 00 d2 02 00 00 d2 02 00 00 … |
| replace | 011D8 | 4 | 0F828 | 4 | c6 11 00 00 | 16 f8 00 00 |
| replace | 011EC | 4 | 0F83C | 4 | da 11 00 00 | 2a f8 00 00 |
| replace | 01200 | 4 | 0F850 | 4 | ee 11 00 00 | 3e f8 00 00 |
| replace | 01214 | 4 | 0F864 | 4 | 02 12 00 00 | 52 f8 00 00 |
| replace | 01228 | 409 | 0F878 | 351 | 16 12 00 00 00 00 ff 00 00 00 00 00 … | (text: see the strings section) |
| replace | 0141A | 18 | 0FA30 | 238 | (text: see the strings section) | 54 4d 50 00 2e 24 24 24 00 00 01 00 … |
| replace | 0143C | 16 | 0FB2E | 16 | 11 01 30 01 4e 01 6d 01 f4 f8 00 00 … | 11 01 30 01 4e 01 6d 01 1a fc 00 00 … |
| replace | 0145E | 146 | 0FB50 | 52 | 28 6e 75 6c 6c 29 00 00 14 14 01 14 … | 20 02 00 00 00 00 00 00 b5 12 ba 12 … |

## Strings (text-like printable runs of 4+ bytes in the whole image, owner stamp masked)

51 only in old, 143 only in new (a multiset difference, so a repeated string can appear once). Runs that look like machine code (no three letters in a row or a format specifier) are left out. Addresses and phone numbers are redacted.

### Only in old (up to 150)

```text
                      MORE... 
            plus shipping     
          Version 1.04   
   Stick maximum (%3d,%3d)    
   Stick minimum (%3d,%3d)    
 KD Price:  About $89         
!AtD
!ZYr-3
!iJg
%APR
%ASP
%ASP
(R)eenter name (E)xit
.COM
.EXE
?dtu
Extension!
F\n@@PWV
F\n@@PWV
F\n@@PWV
F\n@@PWV
FIND_BOARD
Identified as the ET3000 chip!\n
Identified as the ET4000 chip!\n
LLVW
LLVW
LLVW
LLVW
PATH
PRWV
PRWV
PSRWV
Sorry, the file does not exist!
Tseng Super VGA chip detected!\n
Unknown VGA type!\n
XVW3
YYHP
YYPW
YYh0u
gam\%s.txt
gam\gmhelp.txt
gamemake.opt
gamemake.opt
hivj
hivj
hivj
ijklmnopqrstuvwxyz
joysetup.exe
uVO3
uuh0u
uzh0u
```

### Only in new (up to 150)

```text
          Version 2.00   
  (Q)uit
  (Q)uit
 !"#$%&'()*+0123456789:;@ABCDEFGHIJKPQRSTUVWXYZ[`abcdefghijkpqrstuvwxyz{pqrstuvwxyz{{{{{{{{{W
 Call for the latest price!   
"BFA
%s%s
(C)ontinue
(C)ontinue save    (D)o not save
(E)xit (R)etry
(E)xit.
(R)etry (A)bort
*tduY
-NYj
.bbl
.cbl
.chr
.cmf
.cmf
.cmf
.cmf
.cmf
.cmf
.map
.mbl
.mon
.pal
.snd
.txt
.txt
.voc
?dtg
ATI ULTRA
ATI VGA Wonder Detected!\n
ATI VGAWONDER
ATI Wonder
ATI Wonder
ATIWonder
Auto-Detect
Auto-Detect
BLASTER
Can't Find file!
Code Too LARGE, memory error 1
Done
Done
FM-Music Functions, Copyright (c) Creative Technology Pte Ltd, 1990.  All rights reserved.
Forcing Super VGA to %s.\n
GGIu
Game Saved!
GbPV
Help
Help
Hit a key...
I am missing these game files:
I can't access the disk!
I can't access the disk!  Did you remember to insert one?
I cannot save your game!
MORE...
NOT ENOUGH MEMORY!
NOT ENOUGH MEMORY!
None
None
NotInit
NotInit
NotInit
Old Game Loaded!
Out Of Memory!
PPPP&
PSQR
PSQRWV
PSQRWV
Paradise
Paradise
Paradise Super VGA detected!\n
Pixel Engineering
PjKjn
PjKjn
PjxjP
Port  Interrupt
Port  Interrupt
SOUND
SQRWVU
SQRWVU
Sound And Music
Sound And Music
Sound Blaster
Sound Blaster
Sound Blaster Found!\n
Sound Driver
Sound Driver
Standard VGA
Standard VGA
Stick maximum (%3d,%3d)
Stick minimum (%3d,%3d)
This file already exists! Saving now will destroy the old file!
Trident 8800
Trident 8800
Trident 8800 Super VGA chip detected!\n
Trident 8900
Trident 8900
Trident 8900 Super VGA chip detected!\n
Tseng ET3000
Tseng ET3000
Tseng ET3000 Super VGA chip detected!\n
Tseng ET4000
Tseng ET4000
Tseng ET4000 Super VGA chip detected!\n
Tseng ET4000 Super VGA chip detected!\n
Unable to Save!
VGA Chip Type
VGA Chip Type
YY<xtZ<XtV
You have not saved a game!
]EYW
blk\
blk\
blk\
chr\
config
config.dat
config.dat
config.hlp
gam\
gam\
gmhelp
jdj(
jdjd
jdjd
jdjd
map\
mon\
pal\
print scanf : floating point formats not linked\r\n
snd\
snd\
snd\
snd\
snd\
snd\
snd\
snd\
sndblast.drv
unh0u
```
