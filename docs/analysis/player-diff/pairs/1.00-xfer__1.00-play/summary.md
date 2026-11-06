# 1.00-xfer → 1.00-play

Why this pair: control: the two 1.00 programs.

Old: `archive:game-maker_big-bobs-drive-in_ia-2.zip@c7585bd21fdfdec0f931f6339266a76b8a1237d8553b782dfb2146e897025158!DRIVEIN.EXE` (sha256 `9325207c11129a12…`)
New: `archive:game-maker_gm-1.00-editor-sample-nebula_games1993-cd.zip@2cef756f75c983a9c2987d6440ae6907c72b433aa36614fa82e6ab8d3719f4f4!PLAYGAME.EXE` (sha256 `6a2f44ab09f7a8c9…`)

## Functions

| status | count |
| --- | --- |
| identical | 156 |
| relocated | 125 |
| calls-differ | 0 |
| data-moved | 64 |
| constants | 6 |
| changed | 3 |
| removed | 1 |
| added | 2 |

Matched 354 of 355 old and 356 new functions; 1 matches are low confidence (call-graph or order matches under 0.7 similarity).

Matched by stage: bytes 154, norm 125, strings 19, shape 47, callgraph 9, order 0, similarity 0.

Statuses: *identical* = same bytes with relocations masked and the same matched callees; *relocated* = same code once addresses, segments and string pointers are abstracted; *calls-differ* = same code but calling different (or unmatched) functions; *data-moved* = same instruction shape, and every differing immediate moved by an offset shift that at least three matched functions share (the data layout moved); *constants* = same instruction shape with other immediates or strings; *changed* = instructions differ (norm_sim is the share of matching normalized instructions). Full table: `functions.tsv`. The string hint is the rarest string the function appears to point at; an immediate can equal a string offset by coincidence.

### Changed functions (least similar first, up to 60)

| old | new | sizes | sim | method | name | string hint |
| --- | --- | --- | --- | --- | --- | --- |
| 04A1:0069 | 04A1:0069 | 419→634 | 0.60 changed | callgraph |  |   (Q)uit |
| 0000:0107 | 0000:0107 | 32→32 | 0.80 constants | shape |  |  |
| 0E94:0003 | 0EA2:000C | 44→46 | 0.83 changed | callgraph |  |  |
| 0000:313C | 0000:313C | 416→416 | 0.91 data-moved | strings |  | PATH |
| 0000:0E47 | 0000:0E47 | 62→62 | 0.91 data-moved | shape |  |  |
| 04A1:1493 | 04A1:156A | 349→349 | 0.92 data-moved | strings |  | .sav |
| 04A1:77FC | 04A1:78D3 | 125→143 | 0.93 changed | callgraph |  | gm.exe |
| 0000:151F | 0000:151F | 27→27 | 0.93 data-moved | shape |  |  |
| 0000:16B0 | 0000:16B0 | 23→23 | 0.93 data-moved | shape |  |  |
| 04A1:080B | 04A1:08E2 | 450→450 | 0.93 data-moved | strings |  | .txt |
| 1073:00E9 | 1082:00E4 | 186→186 | 0.94 constants | strings |  | No super Vga card detected! Assuming st… |
| 04A1:70AD | 04A1:7184 | 132→132 | 0.94 data-moved | shape |  |  |
| 04A1:1801 | 04A1:18D8 | 175→175 | 0.94 data-moved | shape |  | gam\gmhelp.txt |
| 04A1:6DD8 | 04A1:6EAF | 491→491 | 0.94 data-moved | strings |  | map\ |
| 0000:20F2 | 0000:20F2 | 102→102 | 0.95 data-moved | strings |  | .$$$ |
| 04A1:63F0 | 04A1:64C7 | 221→221 | 0.95 data-moved | shape |  |  |
| 0E94:0C9B | 0EA2:0CA6 | 49→49 | 0.95 data-moved | callgraph |  |  |
| 0E94:0CCC | 0EA2:0CD7 | 49→49 | 0.95 data-moved | callgraph |  |  |
| 0000:22F9 | 0000:22F9 | 58→58 | 0.96 data-moved | shape |  |  |
| 0000:2333 | 0000:2333 | 58→58 | 0.96 data-moved | shape |  |  |
| 04A1:020C | 04A1:02E3 | 486→486 | 0.96 data-moved | strings |  | GMtitle.gif |
| 0000:0000 | 0000:0000 | 289→289 | 0.96 constants | shape |  |  |
| 0CC3:1A74 | 0CD1:1A7D | 447→447 | 0.96 data-moved | strings |  | (C)ontinue save    (D)o not save |
| 0000:2788 | 0000:2788 | 64→64 | 0.96 data-moved | shape |  |  |
| 04A1:0E9C | 04A1:0F73 | 1524→1524 | 0.96 data-moved | strings |  | .sav |
| 0000:09B8 | 0000:09B8 | 67→67 | 0.97 data-moved | shape |  |  |
| 04A1:71A0 | 04A1:7277 | 176→176 | 0.97 data-moved | shape |  |  |
| 1109:02E4 | 1118:02DF | 83→83 | 0.97 data-moved | callgraph |  | gamemake.opt |
| 1109:0337 | 1118:0332 | 83→83 | 0.97 data-moved | callgraph |  | gamemake.opt |
| 0CC3:19C7 | 0CD1:19D0 | 173→173 | 0.97 data-moved | strings |  | Can't Find file! |
| 04A1:60E4 | 04A1:61BB | 576→576 | 0.97 data-moved | shape |  |  |
| 04A1:075E | 04A1:0835 | 173→173 | 0.97 data-moved | strings |  | Play |
| 0F63:000D | 0F72:0008 | 533→533 | 0.97 data-moved | strings |  | (R)eturn to Menu |
| 1073:0008 | 1082:0003 | 225→225 | 0.97 constants | strings |  | Standard |
| 04A1:5F2B | 04A1:6002 | 441→441 | 0.98 data-moved | shape |  |  |
| 0F63:0888 | 0F72:0883 | 467→467 | 0.98 data-moved | strings |  | .bkd |
| 04A1:0CF2 | 04A1:0DC9 | 406→406 | 0.98 data-moved | shape |  |  |
| 04A1:6FC3 | 04A1:709A | 118→118 | 0.98 data-moved | shape |  |  |
| 04A1:7039 | 04A1:7110 | 116→116 | 0.98 data-moved | shape |  |  |
| 0E94:0B20 | 0EA2:0B2B | 110→110 | 0.98 data-moved | shape |  |  |
| 04A1:09CD | 04A1:0AA4 | 793→793 | 0.98 data-moved | shape |  |  |
| 04A1:1B73 | 04A1:1C4A | 352→352 | 0.98 data-moved | shape |  | The file %s is |
| 0000:1AE8 | 0000:1AE8 | 287→287 | 0.98 data-moved | shape |  |  |
| 04A1:250F | 04A1:25E6 | 270→270 | 0.98 data-moved | shape |  |  |
| 10D4:0004 | 10E2:000F | 851→851 | 0.98 data-moved | shape |  | .his |
| 0F63:0A5B | 0F72:0A56 | 148→148 | 0.98 data-moved | shape |  |  |
| 04A1:2B05 | 04A1:2BDC | 1610→1610 | 0.98 data-moved | shape |  |  |
| 04A1:7131 | 04A1:7208 | 111→111 | 0.98 data-moved | shape |  |  |
| 04A1:6B17 | 04A1:6BEE | 145→145 | 0.98 data-moved | shape |  |  |
| 04A1:6BA8 | 04A1:6C7F | 145→145 | 0.98 data-moved | shape |  |  |
| 0000:1558 | 0000:1558 | 344→344 | 0.98 data-moved | shape |  |  |
| 0000:237B | 0000:237B | 117→117 | 0.98 data-moved | shape |  |  |
| 04A1:7975 | 04A1:7A5E | 1666→1666 | 0.99 data-moved | shape |  | Enter Your Name:  |
| 0E94:02CD | 0EA2:02D8 | 185→185 | 0.99 data-moved | shape |  |  |
| 0CC3:1C33 | 0CD1:1C3C | 160→160 | 0.99 data-moved | strings |  | Are you sure you want to delete %s |
| 04A1:20C7 | 04A1:219E | 1034→1034 | 0.99 data-moved | strings |  | Choose object to drop |
| 0000:285A | 0000:285A | 230→230 | 0.99 data-moved | shape |  |  |
| 0000:34B0 | 0000:34B0 | 492→492 | 0.99 data-moved | shape |  | EST |
| 0CC3:0EB5 | 0CD1:0EBE | 216→216 | 0.99 constants | shape |  |  |
| 04A1:1CD3 | 04A1:1DAA | 757→757 | 0.99 data-moved | strings |  | This machine does not have a   |

### Removed functions (old only) (1, largest first, up to 60)

| addr | size | name | string hint |
| --- | --- | --- | --- |
| 0CC3:0339 | 1897 |  | (R)eenter name (E)xit |

### Added functions (new only) (2, largest first, up to 60)

| addr | size | name | string hint |
| --- | --- | --- | --- |
| 04A1:69C3 | 372 |  |  |
| 04A1:6A16 | 370 |  |  |

## Header and layout

| field | old | new |
| --- | --- | --- |
| file_size | 82803 | 83092 **≠** |
| image_size | 78194 | 78484 **≠** |
| header_bytes | 4608 | 4608 |
| relocations | 1035 | 1045 **≠** |
| entry_cs_ip | 0000:0000 | 0000:0000 |
| stack_ss_sp | 2158:0080 | 216A:0080 **≠** |
| min_max_alloc_paras | 3657/65535 | 3657/65535 |
| overlay_bytes | 1 | 0 **≠** |
| header_0x1c | 0100fb30 | 0100fb30 |
| linker | Borland TLINK (0x1E=FB, version byte 0x30 = 3.0 by TLINK's convention) | Borland TLINK (0x1E=FB, version byte 0x30 = 3.0 by TLINK's convention) |
| compiler | Borland C++ - Copyright 1991 Borland Intl. | Borland C++ - Copyright 1991 Borland Intl. |
| version_string | 1.0 | 1.0 |
| stamp_slot | none | none |
| packer |  |  |
| DGROUP paragraph | 11DF | 11EE **≠** |
| code region bytes (before DGROUP) | 73200 | 73440 **≠** |
| code segments referenced by relocations | 14 | 14 |
| functions found | 355 | 356 **≠** |
| bytes inside functions | 71228 | 70308 **≠** |
| code-region bytes outside functions (far data, tables, padding, missed code) | 1972 | 3132 **≠** |
| data bytes from DGROUP to image end | 4994 | 5044 **≠** |

MZ has no linker timestamp, import table or resource section. The closest analogues follow: DOS and BIOS services called, I/O ports touched, and recognizable embedded files.

## DOS/BIOS services (int, with AH when set just before)

No difference (89 uses in each).

## I/O ports (in/out)

| service | old uses | new uses |
| --- | --- | --- |
| out 1197h | 2 | 0 |
| out 11A5h | 0 | 2 |

## Embedded files

Old: none found.
New: none found.

## Data (DGROUP to end of image, relocations masked, aligned on NUL-ended and content-defined runs)

equal_bytes 4710, insert 1, new_bytes_changed 334, old_bytes_changed 284, replace 24

| kind | old offset | old bytes | new offset | new bytes | old preview | new preview |
| --- | --- | --- | --- | --- | --- | --- |
| replace | 000AA | 53 | 000AA | 53 | 67 89 81 44 7c 96 a8 aa b4 b1 b6 b0 … | 56 87 84 96 92 91 94 a6 5d 95 b6 b2 … |
| insert | 00116 | 0 | 00116 | 21 |  | (text: see the strings section) |
| replace | 0011B | 57 | 00130 | 79 | (text: see the strings section) | (text: see the strings section) |
| replace | 008A1 | 9 | 008CC | 16 | (text: see the strings section) | (text: see the strings section) |
| replace | 0106A | 4 | 0109C | 4 | 58 10 00 00 | 8a 10 00 00 |
| replace | 0107E | 4 | 010B0 | 4 | 6c 10 00 00 | 9e 10 00 00 |
| replace | 01092 | 4 | 010C4 | 4 | 80 10 00 00 | b2 10 00 00 |
| replace | 010A6 | 4 | 010D8 | 4 | 94 10 00 00 | c6 10 00 00 |
| replace | 010BA | 6 | 010EC | 6 | a8 10 00 00 00 00 | da 10 00 00 00 00 |
| replace | 010CE | 6 | 01100 | 6 | bc 10 00 00 00 00 | ee 10 00 00 00 00 |
| replace | 010E2 | 6 | 01114 | 6 | d0 10 00 00 00 00 | 02 11 00 00 00 00 |
| replace | 010F6 | 6 | 01128 | 6 | e4 10 00 00 00 00 | 16 11 00 00 00 00 |
| replace | 0110A | 6 | 0113C | 6 | f8 10 00 00 00 00 | (text: see the strings section) |
| replace | 0111E | 6 | 01150 | 6 | 0c 11 00 00 00 00 | (text: see the strings section) |
| replace | 01132 | 6 | 01164 | 6 | (text: see the strings section) | (text: see the strings section) |
| replace | 01146 | 6 | 01178 | 6 | (text: see the strings section) | (text: see the strings section) |
| replace | 0115A | 6 | 0118C | 6 | (text: see the strings section) | (text: see the strings section) |
| replace | 0116E | 6 | 011A0 | 6 | (text: see the strings section) | 8e 11 00 00 00 00 |
| replace | 01182 | 6 | 011B4 | 6 | (text: see the strings section) | a2 11 00 00 00 00 |
| replace | 01196 | 6 | 011C8 | 6 | 84 11 00 00 00 00 | b6 11 00 00 00 00 |
| replace | 011AA | 6 | 011DC | 6 | 98 11 00 00 00 00 | ca 11 00 00 00 00 |
| replace | 011BE | 6 | 011F0 | 6 | ac 11 00 00 00 00 | de 11 00 00 00 00 |
| replace | 011D2 | 6 | 01204 | 6 | c0 11 00 00 00 00 | f2 11 00 00 00 00 |
| replace | 011E6 | 43 | 01218 | 43 | d4 11 01 20 02 20 02 20 04 a0 02 a0 … | 06 12 01 20 02 20 02 20 04 a0 02 a0 … |
| replace | 012CE | 16 | 01300 | 16 | 11 01 30 01 4e 01 6d 01 86 f7 00 00 … | 11 01 30 01 4e 01 6d 01 b8 f7 00 00 … |

## Strings (text-like printable runs of 4+ bytes in the whole image, owner stamp masked)

2 only in old, 12 only in new (a multiset difference, so a repeated string can appear once). Runs that look like machine code (no three letters in a row or a format specifier) are left out. Addresses and phone numbers are redacted.

### Only in old (up to 150)

```text
=ijklmnopqrstuvwxyz
You are missing %s.gam!  I can't do anything without it!
```

### Only in new (up to 150)

```text
  By Andy Stone  
 Play a Game!
 Quit
8ijklmnopqrstuvwxyz
Copyright(C) 1990
Enter game to play: 
PLAYGAME     V1.0
gam\
gm.exe
hsuj 
hsuj 
hsuj 
```
