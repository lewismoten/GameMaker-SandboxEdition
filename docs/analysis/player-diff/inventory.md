# Game-Maker player binaries: inventory

Written by `scripts/player-diff/gmpdiff.py inventory`; do not edit by hand. Binaries are read, never run, and never committed: the canonical copies live in the tool's work folder. Hashes are of the files as found (or as unpacked).

A build is recognized by its MZ load-image size (`scripts/player-diff/builds.toml`). Copies of one build that differ only in the 52-byte owner slot at load-image offset 0 (`code/GM/REGSPACE.ASM`) count as the same build; the slot's contents are never printed. Every copy is listed in `copies.tsv`.

Sources scanned: `cd/gm/`, `runtime/run/GM/`, and an optional local archive corpus (zips, nested zips one level deep). Packed copies were unpacked with Deark.

## Builds

| build     | version | program                       | canonical copy                                                                                                                                         | file bytes | image bytes | relocs | entry     | sha256 (file)       | copies                                                                    | predecessor |
| --------- | ------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ----------- | ------ | --------- | ------------------- | ------------------------------------------------------------------------- | ----------- |
| 1.00-xfer | 1.0     | stand-alone player (XFERPLAY) | `archive:game-maker_big-bobs-drive-in_ia-2.zip@c7585bd21fdfdec0f931f6339266a76b8a1237d8553b782dfb2146e897025158!DRIVEIN.EXE`                           | 82803      | 78194       | 1035   | 0000:0000 | `9325207c11129a12…` | 1 canonical, 4 edited, 7 identical image                                  | —           |
| 1.00-play | 1.0     | editor's PLAYGAME             | `archive:game-maker_gm-1.00-editor-sample-nebula_games1993-cd.zip@2cef756f75c983a9c2987d6440ae6907c72b433aa36614fa82e6ab8d3719f4f4!PLAYGAME.EXE`       | 83092      | 78484       | 1045   | 0000:0000 | `6a2f44ab09f7a8c9…` | 1 canonical, 1 identical image                                            | —           |
| 1.04      | 1.04    | stand-alone player (XFERPLAY) | `archive:game-maker_msdos-barracuda-secret-mission-1-1992.zip@764f625e79bd85cef101ec063e67351725d0ccd433c29e15870b20a3e1798867!baraSM1%2FBCUDA1SW.EXE` | 83136      | 78528       | 1063   | 0000:0000 | `8e9f2e663531adf8…` | 1 canonical, 1 edited, 2 identical image                                  | 1.00-xfer   |
| 2.00      | 2.00    | stand-alone player (XFERPLAY) | `archive:game-maker_blinky-2.zip@1dcea7c24df8edca1f96ff9341f40bdadc6788a0ca9563595ac5cb52e98b22c8!BLINKY2.EXE`                                         | 154980     | 148836      | 1094   | 0003:0004 | `48375bfed6986342…` | 1 canonical, 8 identical except owner stamp                               | 1.04        |
| 2.02      | 2.02    | stand-alone player (XFERPLAY) | `archive:game-maker_arcade-ricky-2_shareware-games-galore.zip@a42b6b25e691302ac47811e9d1ed2153f78f05b5fdcf92309c0ccfaf09e8abf4!RICKY2.EXE`             | 155156     | 149012      | 1105   | 0003:0004 | `c57bd17579c48d86…` | 1 canonical, 4 edited, 20 identical except owner stamp, 1 identical image | 2.00        |
| 2.04      | 2.04    | stand-alone player (XFERPLAY) | `archive:game-maker_breakout-the-rescue.zip@54f896c5b6b4f27d8ebaa5a0094d5fd9fb36e1e4c7fb066b128aefd14663213a!brkoutsw.exe`                             | 119074     | 112930      | 1108   | 0003:0004 | `e91bfe75bb25a808…` | 1 canonical, 1 identical image                                            | 2.02        |
| 3.00-xfer | 3.00    | stand-alone player (XFERPLAY) | `cd/gm/xferplay.exe`                                                                                                                                   | 160598     | 152406      | 1465   | 0000:0000 | `404be3612012488e…` | 1 canonical, 27 edited, 343 identical image                               | 2.04        |
| 3.00-play | 3.00    | editor's PLAYGAME             | `cd/gm/playgame.exe`                                                                                                                                   | 163130     | 154938      | 1519   | 0000:0000 | `49ed1c7898b05cd1…` | 1 canonical, 2 identical image                                            | —           |
| 3.00-aj   | 3.00    | stand-alone player (XFERPLAY) | `archive:game-maker_a-js-quest_gcw-more-wacky-1995.zip@c3d93c372e01564a1206085f39cfbbf1d4493566745fcfaf4c6a0167fb47e2c5!A-J.EXE`                       | 160784     | 152592      | 1472   | 0003:0004 | `467c1960a42271b5…` | 1 canonical                                                               | —           |

## Format details of each canonical copy

| build     | header bytes | stack SS:SP | min/max alloc (paras) | overlay bytes | linker mark                                                            | compiler banner                            | "Version" string | packer | owner slot                | archive member date |
| --------- | ------------ | ----------- | --------------------- | ------------- | ---------------------------------------------------------------------- | ------------------------------------------ | ---------------- | ------ | ------------------------- | ------------------- |
| 1.00-xfer | 4608         | 2158:0080   | 3657/65535            | 1             | Borland TLINK (0x1E=FB, version byte 0x30 = 3.0 by TLINK's convention) | Borland C++ - Copyright 1991 Borland Intl. | 1.0              | none   | none                      | 1993-04-14 01:42:38 |
| 1.00-play | 4608         | 216A:0080   | 3657/65535            | 0             | Borland TLINK (0x1E=FB, version byte 0x30 = 3.0 by TLINK's convention) | Borland C++ - Copyright 1991 Borland Intl. | 1.0              | none   | none                      | 1992-04-22 13:59:06 |
| 1.04      | 4608         | 216D:0080   | 3657/65535            | 0             | Borland TLINK (0x1E=FB, version byte 0x30 = 3.0 by TLINK's convention) | Borland C++ - Copyright 1991 Borland Intl. | 1.04             | none   | none                      | 1996-12-24 23:32:00 |
| 2.00      | 6144         | 2460:0080   | 18/65535              | 0             | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) | Borland C++ - Copyright 1991 Borland Intl. | 2.00             | none   | stamped (contents masked) | 1994-12-07 19:33:26 |
| 2.02      | 6144         | 246B:0080   | 18/65535              | 0             | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) | Borland C++ - Copyright 1991 Borland Intl. | 2.02             | none   | stamped (contents masked) | 2026-11-02 01:25:04 |
| 2.04      | 6144         | 232F:0080   | 1957/65535            | 0             | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) | Borland C++ - Copyright 1991 Borland Intl. | 2.04             | none   | stamped (contents masked) | 2001-03-10 22:47:42 |
| 3.00-xfer | 8192         | 2C6E:0080   | 1857/65535            | 0             | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) | Borland C++ - Copyright 1991 Borland Intl. | 3.00             | none   | none                      | (repository file)   |
| 3.00-play | 8192         | 2D0D:0080   | 1858/65535            | 0             | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) | Borland C++ - Copyright 1994 Borland Intl. | 3.00             | none   | none                      | (repository file)   |
| 3.00-aj   | 8192         | 2CF8:0080   | 1983/65535            | 0             | Borland TLINK (0x1E=FB, version byte 0x50 = 5.0 by TLINK's convention) | Borland C++ - Copyright 1991 Borland Intl. | 3.00             | none   | blank placeholder         | 2026-11-02 02:53:42 |

Every build is a 16-bit DOS MZ executable. MZ has no linker timestamp field (that is a PE/COFF feature), so the table gives the archive member's DOS date where the copy came from a zip; it dates the copy, not necessarily the link. The linker mark is TLINK's byte pair at header offset 0x1E.

## Comparison pairs

| old       | new       | why                                                                         |
| --------- | --------- | --------------------------------------------------------------------------- |
| 3.00-xfer | 3.00-play | control: the two 3.00 programs; carries MAP names from PLAYGAME to XFERPLAY |
| 3.00-xfer | 3.00-aj   | control: the second 3.00 build                                              |
| 2.04      | 3.00-xfer | required: what 3.0 changed (2.04 is the newest earlier player held)         |
| 2.02      | 2.04      | chain                                                                       |
| 2.00      | 2.02      | required: what 2.02 changed (2.00 is the only earlier 2.x held; no 2.01)    |
| 2.02      | 3.00-xfer | control: 3.0 against the most common 2.x player                             |
| 1.04      | 2.00      | chain                                                                       |
| 1.00-xfer | 1.04      | required: what 1.04 changed (no 1.01-1.03 held)                             |
| 1.00-xfer | 1.00-play | control: the two 1.00 programs                                              |

## What is missing

- No player between 1.0 and 1.04 (1.01-1.03) and no 2.01 or 2.03 has been found, so 1.04 is compared with 1.0 and 2.02 with 2.00; each diff therefore covers every change since the previous build held, not necessarily one release.
- 3.0's predecessor here is 2.04, the newest pre-3.0 player held (one game, Breakout: The Rescue). 2.04 is about 36 KB smaller than 2.02, so `2.02 → 3.00-xfer` is also reported as a control.
- No Game-Maker editor package other than 1.00 and the 3.0 CD is held, so only the 1.00 and 3.00 PLAYGAME builds are available.

## Packed copies

| source                                                                                                                                              | packer | packed bytes | unpacked to build | relation to canonical                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------ | ----------------- | ---------------------------------------------------------------------- |
| `archive:game-maker_jet-driver.zip@d23ab397877546a3c2361e309cbfb6ef1abae2aa6a0609a52ddb4ee1efd55533!JETDRIVE.EXE`                                   | PKLITE | 50454        | 2.02              | edited: 286 bytes differ from canonical (stamp masked), group 083d46c0 |
| `archive:game-maker_jet-driver_aderack.zip@97fdfd7e2909504aba7d37116c9e60fa8c03f422b933191afbd389496bb6e9af!jetdrive%2F%21JETDRIV.ZIP!JETDRIVE.EXE` | PKLITE | 50454        | 2.02              | edited: 286 bytes differ from canonical (stamp masked), group 083d46c0 |
| `archive:game-maker_space-cadet-1-v1.2_microforum-1000-games.zip@9d8043dec84ef008218cec2100c8aea246bd9e005ecc5f48a08e6dc7a40f0337!SPACE.EXE`        | PKLITE | 50554        | 2.00              | identical except owner stamp                                           |

## Edited copies (bytes differ from the canonical copy beyond the owner slot)

| build     | source                                                                                                                                              | difference                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1.00-xfer | `archive:game-maker_crystal-quest_microforum-1000-games.zip@aad5e69c9a09471db2e2a49a52064e22436fdf19bb72dabbaad905b2fc100b51!CQ.EXE`                | 676 bytes differ from canonical (stamp masked), group f9d17afe |
| 1.00-xfer | `archive:game-maker_crystal-quest_original.zip@04be3579e15ff0dab64cb02c62c84deae8551b409a6c526c25b3facf4e15af2c!CQ.EXE`                             | 676 bytes differ from canonical (stamp masked), group f9d17afe |
| 1.00-xfer | `archive:game-maker_gm-1.00-editor-sample-nebula_games1993-cd.zip@2cef756f75c983a9c2987d6440ae6907c72b433aa36614fa82e6ab8d3719f4f4!XFERPLAY.EXE`    | 30 bytes differ from canonical (stamp masked), group 23efccee  |
| 1.04      | `archive:game-maker_capn-zapn_more-dosgames-2.zip@6c64b1a8fc4840cc151736559054cf11630dace64169678a48d32e8d16098bb0!CAPZAP.EXE`                      | 685 bytes differ from canonical (stamp masked), group 23a94822 |
| 3.00-xfer | `archive:game-maker_anyworld.zip@4ab7acc0dfb6c035b0dec572c821a17bc56b481c3dcacb1d38fdaffdb1556a28!ANYWORLD.EXE`                                     | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 2.02      | `archive:game-maker_ballie-d-plumber-episode-1-ballie-in-d-pipes.zip@66fa83cef2b64dcc58854c8b09ab11d1356dfdfbca5852ff92dbaaa3932f5704!BALLIE.DAT`   | 599 bytes differ from canonical (stamp masked), group c9a06e38 |
| 2.02      | `archive:game-maker_ballie-in-d-pipes.zip@a6ef4b679afec4e8294556ca5ee086110acf8da224aa7daa1d8ff977c4ffa6c1!BALLIE.DAT`                              | 599 bytes differ from canonical (stamp masked), group c9a06e38 |
| 3.00-xfer | `archive:game-maker_builder.zip@7ed1adbf4c2ddfedcf4c4e3c259e41d683ec138786396697c5762818a91824d5!BUILDER.EXE`                                       | 84 bytes differ from canonical (stamp masked), group be3bcc44  |
| 3.00-xfer | `archive:game-maker_builder_ia.zip@cfda0c9d1fcfce139c2e5ea50cbc416e8b58e0b4cb4dfa9c0a8c4a1c1bea3b76!BUILDER.EXE`                                    | 84 bytes differ from canonical (stamp masked), group be3bcc44  |
| 3.00-xfer | `archive:game-maker_capn-zapn.zip@a09d2a185563150f9b00670ea2035b3473eb99874bb64c7d5046f4981c0200e6!CAPZAP.EXE`                                      | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_dogs-1.zip@7e65f4defab7b341b05843953a55f6895170cb8ce1e0bc9aa0f023898e13653b!dogs%2FDOGS.EXE`                                    | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_dogs.zip@c19b4b9a20c4e8bef20eb621582321d81869f557f3db194521bb5ab4a023c245!DOGS.EXE`                                             | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_icemare-with-sgt-super.zip@926b5fc9308e93577608efdcc1107ef00481aa3f62020f6f59443276625c38b6!ICEMARE.EXE`                        | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_jaxon-zoose.zip@e0d30cca974e6f9d88031b7e507469b58fd2dbdf865208510f8b44897c86a2ac!ZOOSE.EXE`                                     | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_major-marvel.zip@e843ff1b60c5e79d7bcf2ef4065fb58be24367924948d9abc80411cbf238ab2d!MARVEL.EXE`                                   | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_pakdream.zip@5e5252aa702d0760ab303caed851c509b632bec8da3e9fd5cbe42816662ac5bf!PAKDREAM.EXE`                                     | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_pakmon.zip@8a342021c73318733144ac78b19e0e3b8733cc3f56cda5efb0102967b66bba87!PAKMON.EXE`                                         | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_pakmon_aderack-wiki.zip@1738d1d2462fb3bbd06abeea43adf0bf41eaf83dbcc143326c6852811d0095aa!pakmon%2FPAKMON.EXE`                   | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_rodip-river-of-the-deep.zip@39b4300d740f016dfbf58eb6d445587c31d1770bfa8cede97b725e5bc03f7346!rover.exe`                         | 40 bytes differ from canonical (stamp masked), group 0a93ddfc  |
| 3.00-xfer | `archive:game-maker_spacecraft.zip@4d3ad1eeff71580c9d6d82df26d38a6c834cfe112877353a14aea19b83438652!SPACE.EXE`                                      | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_street-wolf.zip@4d180807f68c91101795e7f982cc77e6d762eddcc3dcdc14692df5630d050457!STRWOLF.EXE`                                   | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_superheroes.zip@d1ed4bf01370c7c0059d4c23017ea39bf70d6ec1d4a5576e8a4c0860505035d8!SUPER.EXE`                                     | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_the-head.zip@53e7e613e66255bc4368f5fe4d597917fdf39a104ea260a2efd46062bd3ad3ac!HEAD.EXE`                                         | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_ultimare.zip@420fe118278ae8111ffd75f7d2fce4ef6c2048e38ea67f3e2d6ec95603ca3eb9!ULTIMARE.EXE`                                     | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_virtual-mario.zip@ba1380923753d43a836b2585515f31418dad6c47060e241e4ab2e18c3962169c!fullgame.exe`                                | 427 bytes differ from canonical (stamp masked), group c55ca0eb |
| 3.00-xfer | `archive:game-maker_virtual-mario.zip@ba1380923753d43a836b2585515f31418dad6c47060e241e4ab2e18c3962169c!SHAREWARE.EXE`                               | 427 bytes differ from canonical (stamp masked), group c55ca0eb |
| 3.00-xfer | `archive:game-maker_virtual-mario.zip@ba1380923753d43a836b2585515f31418dad6c47060e241e4ab2e18c3962169c!thegame.exe`                                 | 427 bytes differ from canonical (stamp masked), group c55ca0eb |
| 3.00-xfer | `archive:game-maker_zapak.zip@15adf5c1de9bf5d93128ab92abffb99a786fb492bd77dd1aab76c004431d9967!ZAPAK.EXE`                                           | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_zapman.zip@52b59fbe85903084699dc2884a9180f75f8ba9ba8a42350487ae905f18969e3d!ZAPMAN.EXE`                                         | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_zapper-4-b-holy-neverwhere.zip@44042b60bf0d79d1e164753751940585d619cef723319f5f3eb33630cced4eaf!NEVER.EXE`                      | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_zapper-4-b-holy-neverwhere.zip@44042b60bf0d79d1e164753751940585d619cef723319f5f3eb33630cced4eaf!NEVER1B.EXE`                    | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_zapper-4-escape-from-neverwhere.zip@44042b60bf0d79d1e164753751940585d619cef723319f5f3eb33630cced4eaf!NEVER.EXE`                 | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 3.00-xfer | `archive:game-maker_zapper-4-escape-from-neverwhere.zip@44042b60bf0d79d1e164753751940585d619cef723319f5f3eb33630cced4eaf!NEVER1B.EXE`               | 543 bytes differ from canonical (stamp masked), group a0995daf |
| 1.00-xfer | `archive:GAMEMKR1.ZIP@2cef756f75c983a9c2987d6440ae6907c72b433aa36614fa82e6ab8d3719f4f4!XFERPLAY.EXE`                                                | 30 bytes differ from canonical (stamp masked), group 23efccee  |
| 2.02      | `archive:game-maker_jet-driver.zip@d23ab397877546a3c2361e309cbfb6ef1abae2aa6a0609a52ddb4ee1efd55533!JETDRIVE.EXE`                                   | 286 bytes differ from canonical (stamp masked), group 083d46c0 |
| 2.02      | `archive:game-maker_jet-driver_aderack.zip@97fdfd7e2909504aba7d37116c9e60fa8c03f422b933191afbd389496bb6e9af!jetdrive%2F%21JETDRIV.ZIP!JETDRIVE.EXE` | 286 bytes differ from canonical (stamp masked), group 083d46c0 |
