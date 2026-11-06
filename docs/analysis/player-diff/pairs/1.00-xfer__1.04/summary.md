# 1.00-xfer → 1.04

Why this pair: required: what 1.04 changed (no 1.01-1.03 held).

Old: `archive:game-maker_big-bobs-drive-in_ia-2.zip@c7585bd21fdfdec0f931f6339266a76b8a1237d8553b782dfb2146e897025158!DRIVEIN.EXE` (sha256 `9325207c11129a12…`)
New: `archive:game-maker_msdos-barracuda-secret-mission-1-1992.zip@764f625e79bd85cef101ec063e67351725d0ccd433c29e15870b20a3e1798867!baraSM1%2FBCUDA1SW.EXE` (sha256 `8e9f2e663531adf8…`)

## Functions

| status | count |
| --- | --- |
| identical | 120 |
| relocated | 132 |
| calls-differ | 0 |
| data-moved | 43 |
| constants | 9 |
| changed | 47 |
| removed | 4 |
| added | 8 |

Matched 351 of 355 old and 359 new functions; 8 matches are low confidence (call-graph or order matches under 0.7 similarity).

Matched by stage: bytes 118, norm 132, strings 15, shape 41, callgraph 43, order 0, similarity 2.

Statuses: *identical* = same bytes with relocations masked and the same matched callees; *relocated* = same code once addresses, segments and string pointers are abstracted; *calls-differ* = same code but calling different (or unmatched) functions; *data-moved* = same instruction shape, and every differing immediate moved by an offset shift that at least three matched functions share (the data layout moved); *constants* = same instruction shape with other immediates or strings; *changed* = instructions differ (norm_sim is the share of matching normalized instructions). Full table: `functions.tsv`. The string hint is the rarest string the function appears to point at; an immediate can equal a string offset by coincidence.

### Changed functions (least similar first, up to 60)

| old | new | sizes | sim | method | name | string hint |
| --- | --- | --- | --- | --- | --- | --- |
| 1073:00E9 | 105E:0126 | 186→121 | 0.45 changed | callgraph |  | No super Vga card detected! Assuming st… |
| 0CA0:0007 | 0CDA:0003 | 79→149 | 0.46 changed | callgraph |  |  |
| 1073:02F9 | 105E:0425 | 122→69 | 0.49 changed | similarity |  | ATI Super VGA chip Detected!\n |
| 1073:0008 | 105E:000F | 225→259 | 0.53 changed | callgraph |  | Standard |
| 0E94:0C18 | 0EC6:0796 | 131→138 | 0.58 changed | callgraph |  |  |
| 04A1:63F0 | 04A5:6636 | 221→240 | 0.60 changed | callgraph |  |  |
| 1073:01A3 | 105E:0317 | 135→92 | 0.61 changed | strings |  | VGA= |
| 0CC3:1088 | 0D04:1011 | 561→567 | 0.65 changed | callgraph |  |  |
| 1073:0264 | 105E:02B8 | 149→95 | 0.67 changed | similarity |  | Tseng Super VGA chip detected!\n |
| 1073:022A | 105E:0373 | 58→99 | 0.71 changed | callgraph |  | Trident 8800 VGA chip detected!\n |
| 04A1:080B | 04A5:081E | 450→476 | 0.73 changed | callgraph |  | .txt |
| 0E94:0A94 | 0EC6:0588 | 70→139 | 0.74 changed | callgraph |  |  |
| 0E94:0ADA | 0EC6:0613 | 70→139 | 0.74 changed | callgraph |  |  |
| 0000:0107 | 0000:0107 | 32→32 | 0.80 constants | shape |  |  |
| 04A1:0069 | 04A5:0009 | 419→524 | 0.81 changed | callgraph |  | ShowVideoMemory |
| 1157:01A4 | 1154:019C | 359→337 | 0.81 changed | callgraph |  |  |
| 0CA0:00AA | 0CDA:00EC | 59→83 | 0.81 changed | callgraph |  |  |
| 0CA0:00E5 | 0CDA:013F | 74→86 | 0.83 changed | callgraph |  |  |
| 04A1:3AB9 | 04A5:3AE0 | 3460→4003 | 0.86 changed | callgraph |  |  |
| 0CC3:12B9 | 0D04:1248 | 602→538 | 0.87 changed | callgraph |  |  |
| 0E94:0003 | 0EC6:000A | 44→44 | 0.89 data-moved | shape |  |  |
| 1197:02EE | 1192:0300 | 200→208 | 0.89 changed | callgraph | _SetPage |  |
| 1073:0373 | 105E:0480 | 93→89 | 0.89 changed | callgraph |  |  |
| 04A1:15F0 | 04A5:161F | 529→548 | 0.90 changed | callgraph |  |       G A M E - M A K E R |
| 04A1:020C | 04A5:0215 | 486→496 | 0.90 changed | callgraph |  | GMtitle.gif |
| 0CA0:012F | 0CDA:0195 | 157→177 | 0.91 changed | callgraph |  |  |
| 0CC3:1A74 | 0D04:1982 | 447→453 | 0.91 changed | strings |  | (C)ontinue save    (D)o not save |
| 0000:313C | 0000:313C | 416→416 | 0.91 data-moved | strings |  | PATH |
| 04A1:77FC | 04A5:7A4D | 125→138 | 0.91 changed | callgraph |  |  |
| 1197:007C | 1192:007E | 212→220 | 0.91 changed | callgraph |  | You are missing %s.gam!  I can't do any… |
| 0000:0E47 | 0000:0E47 | 62→62 | 0.91 data-moved | shape |  |  |
| 0F63:0888 | 0F4E:0886 | 467→476 | 0.92 changed | callgraph |  | .bkd |
| 04A1:1493 | 04A5:14C2 | 349→349 | 0.92 constants | strings |  | .sav |
| 0F63:000D | 0F4E:0002 | 533→542 | 0.92 changed | strings |  | (R)eturn to Menu |
| 1197:0154 | 1192:015E | 212→220 | 0.92 changed | callgraph |  | You are missing %s.gam!  I can't do any… |
| 0CC3:19C7 | 0D04:18D2 | 173→176 | 0.92 changed | strings |  | Can't Find file! |
| 0CC3:1513 | 0D04:1462 | 568→534 | 0.92 changed | callgraph |  |  |
| 04A1:7975 | 04A5:7BD3 | 1666→1686 | 0.93 changed | callgraph |  |  |
| 0000:151F | 0000:151F | 27→27 | 0.93 data-moved | shape |  |  |
| 0000:16B0 | 0000:16B0 | 23→23 | 0.93 data-moved | shape |  |  |
| 1197:03BC | 1192:03D6 | 60→71 | 0.93 changed | callgraph | _SetTridentStart |  |
| 0CC3:0339 | 0D04:0BD3 | 1897→1814 | 0.94 changed | callgraph |  | (R)eenter name (E)xit |
| 04A1:70AD | 04A5:72FE | 132→132 | 0.94 data-moved | shape |  |  |
| 04A1:6FC3 | 04A5:721C | 118→114 | 0.94 changed | callgraph |  |  |
| 04A1:7039 | 04A5:728E | 116→112 | 0.94 changed | callgraph |  |  |
| 04A1:1801 | 04A5:1843 | 175→175 | 0.94 data-moved | shape |  | gam\gmhelp.txt |
| 04A1:6DD8 | 04A5:7031 | 491→491 | 0.94 data-moved | strings |  | map\ |
| 1073:03D0 | 105E:04D9 | 266→279 | 0.94 changed | callgraph |  |  |
| 04A1:2B05 | 04A5:2B54 | 1610→1570 | 0.95 changed | callgraph |  |  |
| 0000:20F2 | 0000:20F2 | 102→102 | 0.95 data-moved | strings |  | .$$$ |
| 04A1:1B73 | 04A5:1BB5 | 352→365 | 0.95 changed | callgraph |  | Missing File: |
| 0CC3:18AF | 0D04:17CE | 84→82 | 0.95 constants | shape |  |  |
| 0000:1C07 | 0000:1C07 | 81→81 | 0.95 constants | shape |  |  |
| 0CC3:0000 | 0D04:000A | 2602→2509 | 0.95 changed | strings |  |                                |
| 04A1:0E9C | 04A5:0EC9 | 1524→1529 | 0.95 changed | strings |  | .sav |
| 0CC3:1C33 | 0D04:1B47 | 160→163 | 0.95 changed | strings |  | Are you sure you want to delete %s |
| 0E94:0C9B | 0EC6:0820 | 49→49 | 0.95 data-moved | callgraph |  |  |
| 0E94:0CCC | 0EC6:0851 | 49→49 | 0.95 data-moved | callgraph |  |  |
| 0000:22F9 | 0000:22F9 | 58→58 | 0.96 data-moved | shape |  |  |
| 0000:2333 | 0000:2333 | 58→58 | 0.96 data-moved | shape |  |  |

### Removed functions (old only) (4, largest first, up to 60)

| addr | size | name | string hint |
| --- | --- | --- | --- |
| 0E94:06C9 | 971 |  |  |
| 0000:3EDB | 512 |  |  |
| 0E94:0386 | 169 |  | COPYRIGHTED and may be copied  |
| 0E94:042F | 159 |  |  |

### Added functions (new only) (8, largest first, up to 60)

| addr | size | name | string hint |
| --- | --- | --- | --- |
| 0D04:02BF | 1816 |  | (R)eenter name (E)xit |
| 0D04:0AE9 | 1814 |  | (R)eenter name (E)xit |
| 105E:019F | 265 |  | 761295520 |
| 04A5:8269 | 105 |  |  |
| 105E:03D6 | 79 |  | Game-Maker software, documen-  |
| 0000:34B0 | 68 |  |  |
| 04A5:82D2 | 29 |  |  |
| 105E:046A | 22 |  |  |

## Header and layout

| field | old | new |
| --- | --- | --- |
| file_size | 82803 | 83136 **≠** |
| image_size | 78194 | 78528 **≠** |
| header_bytes | 4608 | 4608 |
| relocations | 1035 | 1063 **≠** |
| entry_cs_ip | 0000:0000 | 0000:0000 |
| stack_ss_sp | 2158:0080 | 216D:0080 **≠** |
| min_max_alloc_paras | 3657/65535 | 3657/65535 |
| overlay_bytes | 1 | 0 **≠** |
| header_0x1c | 0100fb30 | 0100fb30 |
| linker | Borland TLINK (0x1E=FB, version byte 0x30 = 3.0 by TLINK's convention) | Borland TLINK (0x1E=FB, version byte 0x30 = 3.0 by TLINK's convention) |
| compiler | Borland C++ - Copyright 1991 Borland Intl. | Borland C++ - Copyright 1991 Borland Intl. |
| version_string | 1.0 | 1.04 **≠** |
| stamp_slot | none | none |
| packer |  |  |
| DGROUP paragraph | 11DF | 11DD **≠** |
| code region bytes (before DGROUP) | 73200 | 73168 **≠** |
| code segments referenced by relocations | 14 | 14 |
| functions found | 355 | 359 **≠** |
| bytes inside functions | 71228 | 74241 **≠** |
| code-region bytes outside functions (far data, tables, padding, missed code) | 1972 | -1073 **≠** |
| data bytes from DGROUP to image end | 4994 | 5360 **≠** |

MZ has no linker timestamp, import table or resource section. The closest analogues follow: DOS and BIOS services called, I/O ports touched, and recognizable embedded files.

## DOS/BIOS services (int, with AH when set just before)

| service | old uses | new uses |
| --- | --- | --- |
| int 21h AH=29h | 6 | 4 |
| int 21h AH=3Eh | 5 | 3 |
| int 21h AH=3Fh | 3 | 2 |
| int 21h AH=42h | 6 | 5 |
| int 21h AH=48h | 2 | 1 |
| int 21h AH=49h | 2 | 1 |
| int 21h AH=4Ah | 6 | 4 |

## I/O ports (in/out)

| service | old uses | new uses |
| --- | --- | --- |
| in dx(variable) | 18 | 11 |
| out 1197h | 2 | 0 |
| out dx(variable) | 32 | 14 |

## Embedded files

Old: none found.
New: none found.

## Data (DGROUP to end of image, relocations masked, aligned on NUL-ended and content-defined runs)

delete 2, equal_bytes 4226, insert 5, new_bytes_changed 1134, old_bytes_changed 768, replace 32

| kind | old offset | old bytes | new offset | new bytes | old preview | new preview |
| --- | --- | --- | --- | --- | --- | --- |
| replace | 0002F | 100 | 0002F | 104 | (text: see the strings section) | (text: see the strings section) |
| replace | 0009E | 65 | 000A2 | 71 | 01 00 00 00 00 00 00 00 00 00 00 00 … | 01 00 00 00 00 00 00 00 00 00 00 00 … |
| insert | 000FA | 0 | 00104 | 16 |  | (text: see the strings section) |
| insert | 00116 | 0 | 00130 | 11 |  | (text: see the strings section) |
| replace | 00160 | 44 | 00185 | 58 | (text: see the strings section) | (text: see the strings section) |
| replace | 002D5 | 16 | 00308 | 16 | (text: see the strings section) | (text: see the strings section) |
| replace | 00442 | 25 | 00475 | 25 | (text: see the strings section) | (text: see the strings section) |
| replace | 00461 | 28 | 00494 | 59 | (text: see the strings section) | (text: see the strings section) |
| replace | 004A7 | 3 | 004F9 | 6 | (text: see the strings section) | (text: see the strings section) |
| insert | 004B8 | 0 | 0050D | 59 |  | (text: see the strings section) |
| replace | 004BE | 25 | 0054E | 25 | (text: see the strings section) | (text: see the strings section) |
| delete | 004E5 | 10 | 00575 | 0 | (text: see the strings section) |  |
| insert | 004F3 | 0 | 00579 | 15 |  | (text: see the strings section) |
| replace | 004F5 | 69 | 0058A | 2 | (text: see the strings section) | (text: see the strings section) |
| replace | 008A1 | 50 | 008F3 | 58 | (text: see the strings section) | (text: see the strings section) |
| replace | 00C8F | 21 | 00CE9 | 42 | (text: see the strings section) | (text: see the strings section) |
| insert | 00CF8 | 0 | 00D67 | 168 |  | (text: see the strings section) |
| delete | 00CFD | 16 | 00E14 | 0 | (text: see the strings section) |  |
| replace | 00D54 | 53 | 00E5B | 61 | (text: see the strings section) | (text: see the strings section) |
| replace | 00DE9 | 31 | 00EF8 | 126 | (text: see the strings section) | (text: see the strings section) |
| replace | 0106A | 4 | 011D8 | 4 | 58 10 00 00 | c6 11 00 00 |
| replace | 0107E | 4 | 011EC | 4 | 6c 10 00 00 | da 11 00 00 |
| replace | 01092 | 4 | 01200 | 4 | 80 10 00 00 | ee 11 00 00 |
| replace | 010A6 | 4 | 01214 | 4 | 94 10 00 00 | 02 12 00 00 |
| replace | 010BA | 6 | 01228 | 6 | a8 10 00 00 00 00 | 16 12 00 00 00 00 |
| replace | 010CE | 6 | 0123C | 6 | bc 10 00 00 00 00 | (text: see the strings section) |
| replace | 010E2 | 2 | 01250 | 62 | d0 10 | (text: see the strings section) |
| replace | 010F6 | 6 | 012A0 | 6 | e4 10 00 00 00 00 | 8e 12 00 00 00 00 |
| replace | 0110A | 6 | 012B4 | 6 | f8 10 00 00 00 00 | a2 12 00 00 00 00 |
| replace | 0111E | 6 | 012C8 | 6 | 0c 11 00 00 00 00 | b6 12 00 00 00 00 |
| replace | 01132 | 6 | 012DC | 6 | (text: see the strings section) | ca 12 00 00 00 00 |
| replace | 01146 | 6 | 012F0 | 6 | (text: see the strings section) | de 12 00 00 00 00 |
| replace | 0115A | 6 | 01304 | 6 | (text: see the strings section) | f2 12 00 00 00 00 |
| replace | 0116E | 6 | 01318 | 6 | (text: see the strings section) | 06 13 00 00 00 00 |
| replace | 01182 | 6 | 0132C | 6 | (text: see the strings section) | 1a 13 00 00 00 00 |
| replace | 01196 | 6 | 01340 | 6 | 84 11 00 00 00 00 | (text: see the strings section) |
| replace | 011AA | 103 | 01354 | 43 | 98 11 00 00 00 00 ff 00 00 00 00 00 … | 42 13 01 20 02 20 02 20 04 a0 02 a0 … |
| replace | 012CE | 16 | 0143C | 16 | 11 01 30 01 4e 01 6d 01 86 f7 00 00 … | 11 01 30 01 4e 01 6d 01 f4 f8 00 00 … |
| replace | 01379 | 9 | 014E7 | 9 | 10 59 46 00 00 00 10 7e 47 | 10 9d 46 00 00 00 10 c2 47 |

## Strings (text-like printable runs of 4+ bytes in the whole image, owner stamp masked)

11 only in old, 34 only in new (a multiset difference, so a repeated string can appear once). Runs that look like machine code (no three letters in a row or a format specifier) are left out. Addresses and phone numbers are redacted.

### Only in old (up to 150)

```text
          Version 1.0    
         Visa/MC              
     plus   $4 shipping (USA) 
[redacted: address or phone]
[redacted: address or phone]
 KD Price:  $89 Game-Maker    
[redacted: address or phone]
=ijklmnopqrstuvwxyz
Order from KD Software:       
Trident VGA detected!\n
You are missing Game Maker's Title Screen!\n
```

### Only in new (up to 150)

```text
            Visa/MC           
            plus shipping     
          Version 1.04   
[redacted: address or phone]
 KD Price:  About $89         
 KD Software                  
[redacted: address or phone]
!AtD
!iJg
%APR
%ASP
%ASP
ChipTech
Digital
FIND_BOARD
Genoa
Order from your local         
Paradise
ShowVideoMemory
Trident 8800 VGA chip detected!\n
Trident 8900 VGA chip detected!\n
Trident ID - Unknown Hardware chip version - assuming 8900!\n
Trident8800
Trident8900
Video7
YYh0u
You are missing Game Maker's Title Screen (gmtitle.gif)!\n
computer store or:            
hivj
hivj
hivj
ijklmnopqrstuvwxyz
uuh0u
uzh0u
```
