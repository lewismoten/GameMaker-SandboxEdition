# 2.04 → 3.00-xfer

Why this pair: required: what 3.0 changed (2.04 is the newest earlier player held).

Old: `archive:game-maker_breakout-the-rescue.zip@54f896c5b6b4f27d8ebaa5a0094d5fd9fb36e1e4c7fb066b128aefd14663213a!brkoutsw.exe` (sha256 `e91bfe75bb25a808…`)
New: `cd/gm/xferplay.exe` (sha256 `404be3612012488e…`)

## Functions

| status | count |
| --- | --- |
| identical | 111 |
| relocated | 179 |
| calls-differ | 1 |
| data-moved | 15 |
| constants | 32 |
| changed | 67 |
| removed | 8 |
| added | 199 |

Matched 405 of 413 old and 604 new functions; 17 matches are low confidence (call-graph or order matches under 0.7 similarity).

Matched by stage: bytes 105, norm 176, strings 12, shape 40, callgraph 68, order 4, similarity 0.

Statuses: *identical* = same bytes with relocations masked and the same matched callees; *relocated* = same code once addresses, segments and string pointers are abstracted; *calls-differ* = same code but calling different (or unmatched) functions; *data-moved* = same instruction shape, and every differing immediate moved by an offset shift that at least three matched functions share (the data layout moved); *constants* = same instruction shape with other immediates or strings; *changed* = instructions differ (norm_sim is the share of matching normalized instructions). Full table: `functions.tsv`. The string hint is the rarest string the function appears to point at; an immediate can equal a string offset by coincidence.

### Changed functions (least similar first, up to 60)

| old | new | sizes | sim | method | name | string hint |
| --- | --- | --- | --- | --- | --- | --- |
| 03EF:1B05 | 0826:3AB7 | 612→580 | 0.20 changed | callgraph |  |       G A M E - M A K E R |
| 03EF:71F8 | 0826:92AD | 1079→2147 | 0.34 changed | order |  | I am missing these game files: |
| 0E7C:0B5E | 1C63:000A | 407→331 | 0.42 changed | callgraph |  | %s*.* |
| 124D:0006 | 19BF:0223 | 896→639 | 0.44 changed | callgraph |  | Congratulations! |
| 1128:000D | 189D:0005 | 142→179 | 0.45 changed | callgraph |  |  |
| 0E7C:000B | 15BE:00AF | 2668→3118 | 0.45 changed | callgraph |  | (E)xit. |
| 03EF:20FE | 0826:4056 | 617→559 | 0.47 changed | strings |  | Missing File: |
| 1086:07DD | 17F8:07D5 | 445→493 | 0.47 changed | callgraph |  | Error Opening Bkd %s! |
| 03EF:0D85 | 0826:2117 | 861→1721 | 0.48 changed | callgraph |  | Sorry...Out of Memory! |
| 03EF:18EF | 0826:3709 | 534→942 | 0.53 changed | callgraph |  | Save Game |
| 03EF:10EE | 0826:27DC | 593→676 | 0.54 changed | callgraph |  |  |
| 03EF:000E | 0826:0347 | 718→931 | 0.59 changed | callgraph |  | ShowVideoMemory |
| 03EF:975D | 0826:BD21 | 36→50 | 0.61 changed | callgraph |  |  |
| 03EF:2367 | 0826:4285 | 738→778 | 0.63 changed | callgraph |  | This machine does not have a  |
| 0E7C:1938 | 15BE:18EB | 599→491 | 0.63 changed | callgraph |  | (C)ontinue save    (D)o not save |
| 03EF:773A | 0826:9BDF | 117→99 | 0.64 changed | callgraph |  |  |
| 1044:0189 | 1781:041E | 208→142 | 0.65 changed | callgraph |  |  |
| 03EF:4F99 | 0826:6F22 | 405→499 | 0.65 changed | callgraph |  |  |
| 03EF:2787 | 0826:46DD | 944→937 | 0.71 changed | strings |  | Choose object to drop |
| 1044:000A | 1781:019B | 102→160 | 0.73 changed | callgraph |  |  |
| 0DE5:000B | 1546:0005 | 188→108 | 0.73 changed | callgraph |  | sndblast.drv |
| 03EF:7FA9 | 0826:A456 | 97→103 | 0.74 changed | callgraph |  |  |
| 03EF:76C3 | 0826:9B86 | 119→89 | 0.75 changed | callgraph |  |  |
| 03EF:7150 | 0826:91F8 | 168→181 | 0.76 changed | callgraph |  |   (Q)uit |
| 03EF:1E3B | 0826:3DC8 | 707→654 | 0.77 changed | strings |  | Score:     %ld |
| 03EF:762F | 0826:9B10 | 148→118 | 0.78 changed | callgraph |  |  |
| 0003:0187 | 0000:0183 | 19→19 | 0.78 constants | shape |  |  |
| 03EF:2FFF | 0826:4F56 | 1765→1651 | 0.79 changed | callgraph |  |  |
| 03EF:77AF | 0826:9C42 | 139→109 | 0.79 changed | callgraph |  |  |
| 0E7C:0CF5 | 15BE:0CDD | 409→356 | 0.81 changed | callgraph |  |  |
| 03EF:6E9D | 0826:8F2B | 207→225 | 0.81 changed | callgraph |  |  |
| 03EF:5806 | 0826:77FA | 571→634 | 0.83 changed | callgraph |  |  |
| 11D3:000C | 1953:000B | 134→134 | 0.85 constants | strings |  | Standard |
| 03EF:091D | 0826:1438 | 174→139 | 0.85 changed | strings |  | Play |
| 03EF:2649 | 0826:458F | 102→116 | 0.85 changed | callgraph |  |  |
| 03EF:870D | 0826:AC35 | 3238→3364 | 0.86 changed | callgraph |  | config.hlp |
| 03EF:4043 | 0826:5F7B | 756→776 | 0.87 changed | callgraph |  |  |
| 03EF:3BDF | 0826:5AE9 | 590→627 | 0.87 changed | callgraph |  |  |
| 0DE5:0430 | 1546:03DC | 12→19 | 0.88 changed | callgraph |  |  |
| 03EF:78CF | 0826:9D3B | 81→85 | 0.88 changed | callgraph |  |  |
| 0003:2BA9 | 0000:3593 | 31→31 | 0.89 data-moved | shape |  |  |
| 03EF:7F83 | 0826:A428 | 18→22 | 0.89 changed | order |  |  |
| 03EF:800A | 0826:A4BD | 760→892 | 0.89 changed | callgraph |  |  |
| 0DE5:029D | 1546:0246 | 403→406 | 0.89 changed | callgraph |  | .voc |
| 03EF:7F95 | 0826:A43E | 20→24 | 0.90 changed | order |  |  |
| 03EF:9781 | 0826:BD53 | 64→62 | 0.90 changed | callgraph |  |  |
| 03EF:66A4 | 0826:86D7 | 165→165 | 0.91 constants | shape |  |  |
| 1044:0070 | 1781:0261 | 46→48 | 0.91 changed | strings |  | %s%s%s |
| 1086:07AD | 17F8:07A5 | 48→48 | 0.91 constants | shape |  |  |
| 0003:2B18 | 0000:3502 | 145→145 | 0.91 data-moved | strings |  | Unknown error |
| 0E7C:1B8F | 15BE:1B3E | 186→189 | 0.91 constants | strings |  | Are you sure you want to delete %s |
| 03EF:5686 | 0826:766D | 53→57 | 0.92 changed | callgraph |  |  |
| 03EF:7D8B | 0826:A1FD | 41→45 | 0.92 changed | callgraph |  |  |
| 03EF:3B7E | 0826:5A83 | 97→102 | 0.93 changed | callgraph |  |  |
| 03EF:8302 | 0826:A839 | 121→120 | 0.93 changed | callgraph |  |  |
| 0E7C:1855 | 15BE:1808 | 227→227 | 0.93 constants | shape |  | Can't Find file! |
| 0003:2D73 | 0000:375D | 24→24 | 0.93 data-moved | shape |  |  |
| 03EF:83AD | 0826:A8E3 | 864→850 | 0.94 changed | callgraph |  | VGA Chip Type |
| 03EF:3E2D | 0826:5D5C | 534→543 | 0.94 changed | callgraph |  |  |
| 0003:215D | 0000:2AA8 | 77→77 | 0.94 data-moved | shape |  |  |

### Removed functions (old only) (8, largest first, up to 60)

| addr | size | name | string hint |
| --- | --- | --- | --- |
| 03EF:1353 | 1436 |  | You have not saved a game! |
| 03EF:0CB5 | 1069 |  |  |
| 03EF:02DC | 906 |  | GMtitle.gif |
| 03EF:09F6 | 703 |  | .txt |
| 0DE5:070C | 623 |  | (C)ontinue save    (D)o not save |
| 11D3:06C4 | 226 |  | Paradise |
| 03EF:1D69 | 210 |  | gmhelp |
| 0003:05EB | 33 |  |  |

### Added functions (new only) (199, largest first, up to 60)

| addr | size | name | string hint |
| --- | --- | --- | --- |
| 0826:2D40 | 2505 |  | Load Game |
| 0826:1548 | 1489 |  | %sdata%d.rec |
| 0826:1B4B | 1484 |  | .gif |
| 0000:59CC | 1142 |  |  |
| 0826:09E1 | 1009 |  |  |
| 0000:6FC8 | 1003 |  |  |
| 0000:54BE | 806 |  |  |
| 0000:6B4A | 715 |  |  |
| 0000:6150 | 678 |  |  |
| 1B4D:0008 | 599 |  |  |
| 0000:7647 | 582 |  |  |
| 19BF:0005 | 542 |  | Top Ten Scores |
| 0000:0FF6 | 510 |  |  |
| 0826:07EA | 503 |  |  |
| 1CCC:0819 | 445 | TStringRef::splice(unsigned int,unsigned int,const char far*,unsigned int) |  |
| 0826:2B96 | 426 |  | .dat |
| 0000:667F | 398 |  |  |
| 0000:4BD1 | 372 |  |  |
| 0000:788D | 357 |  |  |
| 1BA8:03BA | 354 |  |  |
| 0000:4A7E | 339 |  |  |
| 0826:C1F2 | 320 |  |  |
| 1C63:0155 | 294 |  |  |
| 0826:BFF7 | 290 |  |  |
| 0826:BDD0 | 288 |  |  |
| 1B4D:025F | 278 |  |  |
| 1BA8:0102 | 264 |  | MicroChannel Bus Detected!\n |
| 1B4D:0375 | 263 |  |  |
| 0000:6E15 | 258 |  |  |
| 0826:2A94 | 258 |  | .dat |
| 1BA8:02C7 | 243 |  |  |
| 1BA8:051C | 239 |  | New Frame: %d Size:%5lu Chunks:%u\n |
| 1CCC:056E | 224 | TStringRef::TStringRef(const char far*,unsigned int,const char far*,unsigned int,unsigned int) |  |
| 1BA8:0852 | 211 |  |  |
| 0826:C76B | 210 |  |  |
| 0826:3CFB | 205 |  | No game-specific help included. |
| 0000:6001 | 204 |  |  |
| 1781:000C | 204 |  | gm.cfg |
| 0000:5EC8 | 203 |  |  |
| 1781:00D8 | 195 |  | gm.cfg |
| 0826:A2D3 | 193 |  |  |
| 0826:01EE | 192 |  |  |
| 0826:C912 | 189 |  |  |
| 1BA8:020A | 189 |  |  |
| 1CCC:00E2 | 188 | string::string(const char far*) |  |
| 0000:539F | 185 |  |  |
| 0826:C3AE | 183 |  | UnTitled |
| 0000:63F6 | 178 |  |  |
| 0000:6F17 | 177 |  |  |
| 0826:C628 | 173 |  |  |
| 1CCC:036A | 173 | string::assert_element(unsigned int) const | String reference out of range |
| 1CCC:0417 | 173 | string::assert_index(unsigned int) const | String reference out of range |
| 0000:5851 | 170 |  |  |
| 1CCC:04C4 | 170 | TSubString::assert_element(unsigned int) const | String reference out of range |
| 0000:4842 | 169 |  |  |
| 15BE:000B | 164 |  | *.* |
| 1781:0343 | 162 |  |  |
| 0000:46CD | 158 |  |  |
| 0000:4DE8 | 156 |  |  |
| 0000:460F | 154 |  |  |

## Header and layout

| field | old | new |
| --- | --- | --- |
| file_size | 119074 | 160598 **≠** |
| image_size | 112930 | 152406 **≠** |
| header_bytes | 6144 | 8192 **≠** |
| relocations | 1108 | 1465 **≠** |
| entry_cs_ip | 0003:0004 | 0000:0000 **≠** |
| stack_ss_sp | 232F:0080 | 2C6E:0080 **≠** |
| min_max_alloc_paras | 1957/65535 | 1857/65535 **≠** |
| overlay_bytes | 0 | 0 |
| header_0x1c | 0100fb50 | 0100fb50 |
| linker | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) |
| compiler | Borland C++ - Copyright 1991 Borland Intl. | Borland C++ - Copyright 1991 Borland Intl. |
| version_string | 2.04 | 3.00 **≠** |
| stamp_slot | stamped (contents masked) | none **≠** |
| packer |  |  |
| DGROUP paragraph | 14BC | 232C **≠** |
| code region bytes (before DGROUP) | 84928 | 144064 **≠** |
| code segments referenced by relocations | 23 | 29 **≠** |
| functions found | 413 | 604 **≠** |
| bytes inside functions | 80349 | 112663 **≠** |
| code-region bytes outside functions (far data, tables, padding, missed code) | 4579 | 31401 **≠** |
| data bytes from DGROUP to image end | 28002 | 8342 **≠** |

MZ has no linker timestamp, import table or resource section. The closest analogues follow: DOS and BIOS services called, I/O ports touched, and recognizable embedded files.

## DOS/BIOS services (int, with AH when set just before)

| service | old uses | new uses |
| --- | --- | --- |
| int 10h | 2 | 3 |
| int 16h AH=03h | 0 | 2 |

## I/O ports (in/out)

| service | old uses | new uses |
| --- | --- | --- |
| in 3D5h | 7 | 5 |
| in 3DAh | 6 | 10 |
| out 21h | 2 | 4 |
| out 3C5h | 1 | 2 |
| out 3C8h | 5 | 11 |
| out 3D4h | 14 | 10 |
| out 3D5h | 11 | 7 |
| out dx(variable) | 17 | 18 |

## Embedded files

Old: none found.
New: none found.

## Data (DGROUP to end of image, relocations masked, aligned on NUL-ended and content-defined runs)

delete 5, equal_bytes 4984, insert 6, new_bytes_changed 3358, old_bytes_changed 23018, replace 48

| kind | old offset | old bytes | new offset | new bytes | old preview | new preview |
| --- | --- | --- | --- | --- | --- | --- |
| replace | 00246 | 37 | 00246 | 53 | (text: see the strings section) | (text: see the strings section) |
| replace | 00276 | 11 | 00286 | 7 | (text: see the strings section) | (text: see the strings section) |
| insert | 00285 | 0 | 00291 | 238 |  | (text: see the strings section) |
| replace | 00287 | 475 | 00381 | 6 | (text: see the strings section) | (text: see the strings section) |
| insert | 0048E | 0 | 003B3 | 24 |  | (text: see the strings section) |
| replace | 004BE | 25 | 003FB | 21 | (text: see the strings section) | (text: see the strings section) |
| replace | 004F7 | 213 | 00430 | 107 | (text: see the strings section) | (text: see the strings section) |
| replace | 00616 | 15 | 004E5 | 28 | (text: see the strings section) | (text: see the strings section) |
| replace | 0062A | 15 | 00506 | 42 | (text: see the strings section) | (text: see the strings section) |
| replace | 0063C | 147 | 00533 | 120 | (text: see the strings section) | (text: see the strings section) |
| replace | 0071B | 14 | 005F7 | 14 | (text: see the strings section) | (text: see the strings section) |
| replace | 00904 | 8 | 007E0 | 8 | (text: see the strings section) | (text: see the strings section) |
| delete | 00920 | 31 | 007FC | 0 | (text: see the strings section) |  |
| replace | 0099F | 58 | 0085C | 32 | (text: see the strings section) | (text: see the strings section) |
| replace | 00A7D | 31 | 00920 | 30 | (text: see the strings section) | (text: see the strings section) |
| replace | 00AB4 | 6 | 00956 | 35 | (text: see the strings section) | (text: see the strings section) |
| replace | 00ABB | 29 | 0097A | 28 | (text: see the strings section) | (text: see the strings section) |
| delete | 00ADA | 31 | 00998 | 0 | (text: see the strings section) |  |
| replace | 00B16 | 2 | 009B5 | 1 | (text: see the strings section) | (text: see the strings section) |
| replace | 00C80 | 103 | 00B1E | 9 | (text: see the strings section) | (text: see the strings section) |
| replace | 00D06 | 33 | 00B46 | 15 | (text: see the strings section) | (text: see the strings section) |
| insert | 00D33 | 0 | 00B61 | 110 |  | (text: see the strings section) |
| replace | 00E0F | 27 | 00CAB | 175 | (text: see the strings section) | (text: see the strings section) |
| replace | 00E30 | 42 | 00D60 | 37 | (text: see the strings section) | (text: see the strings section) |
| delete | 00E5D | 5 | 00D88 | 0 | (text: see the strings section) |  |
| replace | 00E83 | 182 | 00DA9 | 46 | (text: see the strings section) | (text: see the strings section) |
| insert | 00F5A | 0 | 00DF8 | 4 |  | (text: see the strings section) |
| replace | 00F71 | 30 | 00E13 | 18 | 2a 25 73 00 bb 20 c4 c4 c4 c4 c4 c4 … | bb 20 c4 c4 c4 c4 c4 c4 c4 c4 c4 c4 … |
| replace | 00FC8 | 150 | 00E5E | 22 | (text: see the strings section) | 2e 2e 5c 00 bb 20 c4 c4 c4 c4 c4 c4 … |
| replace | 010F5 | 11 | 00F0B | 20 | (text: see the strings section) | (text: see the strings section) |
| replace | 01144 | 10 | 00F63 | 82 | (text: see the strings section) | (text: see the strings section) |
| replace | 01158 | 8 | 00FBF | 7 | (text: see the strings section) | (text: see the strings section) |
| delete | 01228 | 10 | 0108E | 0 | (text: see the strings section) |  |
| replace | 01235 | 29 | 01091 | 34 | (text: see the strings section) | (text: see the strings section) |
| replace | 01255 | 18 | 010B6 | 22 | (text: see the strings section) | (text: see the strings section) |
| replace | 0128A | 111 | 010EF | 210 | (text: see the strings section) | (text: see the strings section) |
| replace | 01304 | 10 | 011CC | 30 | (text: see the strings section) | (text: see the strings section) |
| replace | 01319 | 10 | 011F5 | 30 | (text: see the strings section) | (text: see the strings section) |
| replace | 0132B | 13 | 0121B | 33 | (text: see the strings section) | (text: see the strings section) |
| replace | 01340 | 76 | 01244 | 197 | (text: see the strings section) | (text: see the strings section) |
| replace | 01660 | 28 | 015DD | 38 | (text: see the strings section) | (text: see the strings section) |
| delete | 01684 | 152 | 0160B | 0 | (text: see the strings section) |  |
| replace | 0172B | 108 | 0161A | 145 | (text: see the strings section) | (text: see the strings section) |
| insert | 017DE | 0 | 016F2 | 342 |  | (text: see the strings section) |
| replace | 017EA | 14 | 01854 | 14 | 62 03 00 00 62 03 00 00 62 03 00 00 … | 8a 03 00 00 8a 03 00 00 8a 03 00 00 … |
| replace | 01808 | 4 | 01872 | 4 | f6 17 00 00 | 60 18 00 00 |
| replace | 0181C | 4 | 01886 | 4 | 0a 18 00 00 | 74 18 00 00 |
| replace | 01830 | 4 | 0189A | 4 | 1e 18 00 00 | 88 18 00 00 |
| replace | 01844 | 4 | 018AE | 4 | 32 18 00 00 | 9c 18 00 00 |
| replace | 01858 | 302 | 018C2 | 302 | (text: see the strings section) | (text: see the strings section) |
| replace | 01A14 | 6 | 01A7E | 30 | (text: see the strings section) | (text: see the strings section) |
| replace | 01B39 | 127 | 01BBB | 157 | 05 05 05 05 05 05 05 05 14 14 14 14 … | 05 05 05 05 05 05 05 05 14 14 14 14 … |
| replace | 01BBA | 76 | 01C5A | 28 | fe 1c 00 00 1b 1d 00 00 2f 1d 00 00 … | 73 1d 00 00 83 1d 00 00 98 1d 00 00 … |
| replace | 01C0A | 30 | 01C7A | 102 | ff 1d 00 00 00 1e 00 00 01 1e 00 00 … | 0b 1e 00 00 0c 1e 00 00 1b 1e 00 00 … |
| replace | 01C2A | 44 | 01CE2 | 32 | 48 1e 00 00 49 1e 00 00 4a 1e 00 00 … | f7 1e 00 00 f8 1e 00 00 f9 1e 00 00 … |
| replace | 01E7E | 16 | 01F2A | 16 | 11 01 30 01 4e 01 6d 01 1c e7 00 00 … | 11 01 30 01 4e 01 6d 01 ec 93 00 00 … |
| replace | 01E9E | 17 | 01F4A | 35 | (text: see the strings section) | (text: see the strings section) |
| insert | 01F02 | 0 | 01FC0 | 102 |  | (text: see the strings section) |
| replace | 01F0A | 20056 | 0202E | 104 | (text: see the strings section) | 5c 7c 61 7c 61 7c 61 7c 01 20 f7 bf … |

## Strings (text-like printable runs of 4+ bytes in the whole image, owner stamp masked)

161 only in old, 145 only in new (a multiset difference, so a repeated string can appear once). Runs that look like machine code (no three letters in a row or a format specifier) are left out. Addresses and phone numbers are redacted.

### Only in old (up to 150)

```text
                Top Ten Scores
              Hit any key to exit
          Version 2.04   
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
%s*.*
(C)ontinue
(C)ontinue save    (D)o not save
(E)xit (R)etry
(E)xit (R)etry
(R)etry (A)bort
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
ATI Wonder
Auto-Detect
Enter Your Name: 
Error Opening %s!
Error Opening %s!
GMtitle.gif
Hit a key...
I can't access the disk!
I can't access the disk!  Did you remember to insert one?
NOT ENOUGH MEMORY!
NOT ENOUGH MEMORY!
No game-specific credits given
No game-specific help included
No game-specific instructions 
No game-specific storyline.   
PSQR
Paradise
PjUh
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
Bad_cast
Bad_typeid
ConfigData
Congratulations!
Debug
Enter Your Name:
Error Opening Bkd %s!
Error Opening Gif %s!
FileListClass
FileRead
GAB;
GameClass
Hit any key
Hit any key...
Load Game
New Frame: %d Size:%5lu Chunks:%u\n
No game-specific credits given.
No game-specific help included.
No game-specific instructions.
No game-specific storyline.
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
PkQkQkQkQ
Playback with %s.\n
Q#Q5Q@QKQ[Q
Recording
Recording *
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
Top Ten Scores
Type_info
Type_info *
UnTitled
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
jhj(
jpj(
jpj(
jpj(
jpj(
jxj(
jxj(
jxj(
jyjF
qwertyuiop[]\r
string
string
string
string *
string::lengtherror
string::lengtherror
string::outofrange
uZh0u
until you have installed a   
xalloc
xalloc
xalloc
xalloc
xalloc
xmsg
xmsg
xmsg
xmsg
xmsg
xmsg
```
