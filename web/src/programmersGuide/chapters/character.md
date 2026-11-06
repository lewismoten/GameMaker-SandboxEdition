# The character and its sequences

## 7.1 The record: 3,784 bytes (`CHAR.H:18-51`)

| Part          | Layout                                                                                                                                |     Bytes |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------: |
| **frame**     | `x` 2, `y` 2, `orient` 2, `pic1` 2, `pic2` 2, `pause` 2, `extra[5]`                                                                   |    **17** |
| **sequence**  | 10 frames (170) + `key` 2, `sound` 1, `on` 1, `bloc` 1, `ground` 1, `jstk_but` 1, `jstk_mov` 1, `norepeat` 1, `Momentum` 1, `xtra[5]` |   **185** |
| **character** | 20 sequences (3,700) + `x[3]` 6, `y[3]` 6, `cframe` 1, `cseq` 1, `inv[10]` 10, `meter[30]` 60                                         | **3,784** |

3,700 + 6 + 6 + 1 + 1 + 10 + 60 = 3,784, matching the port's `CHR_RECORD_SIZE` (`engine/formats/character.ts:10`). A `.chr` file holds **two** records (7,568 bytes, `MAXPLAY 2`, `CHAR.H:6`); PLAYGAME reads only the first
(`PG:4252`, one `sizeof(chrstruct)`). The second is leftover from a two-player plan. [design]

## 7.2 Limits

| Limit                | Value                                                                                                  | Where                       | Tag          |
| -------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------- | ------------ |
| Sequences            | 20 (`MAXSEQ`)                                                                                          | `CHAR.H:7`                  | [design]     |
| Frames per sequence  | 10 (`MAXFRAME`)                                                                                        | `CHAR.H:8`                  | [design]     |
| Reserved sequences   | 0 idle, 1 die, 2 hurt, 3 pick up, 4 drop                                                               | `CHAR.H:9-13`               | [design]     |
| Usable key sequences | 15 (5..19) plus the optional replacement of 3 and 4                                                    | derived                     |              |
| Hero blocks          | 50 (`CHARBL`); 50 = "no picture", **51 = end of sequence**                                             | `BLOC.H:8`, `PG:2409, 2432` | [64K]        |
| Inventory            | 10 slots (`MAXINV`)                                                                                    | `CHAR.H:16`                 | [design]     |
| Movement per tick    | 11 pixels each way (`MAXGRAV`)                                                                         | `PG:65, 2484-2487`          | [design]     |
| Repeat count         | 32,767 = unlimited (`INF_REPEAT`)                                                                      | `CHAR.H:14`                 | [16-bit]     |
| Keys held at once    | 20 (`MAXKEYS`, "every finger and toe")                                                                 | `PG:64, 318`                | [design]     |
| Key code             | `int`: scan code in the high byte, ASCII in the low; the held-key table has 128 entries (`keydn[128]`) | `CHAR.H:31`, `PG:340`       | [file] [DOS] |

**Why 20 x 10.** 20 sequences x 185 = 3,700; one record fits a 4 KB sector's worth and sits comfortably in `DGROUP` (`chr` and the live copy are both near data, `PG:290-291`). [inference] Both numbers are round; the record size is a consequence, not a goal.
**Why 11 pixels.** A block is 20 pixels. Capping a step at 11 (one pixel over half a block) means the hero can never cross a whole block between two touch tests, so a 1-cell wall always gets tested. [inference; the source says only `MAXGRAV 11`, `PG:65`]

## 7.3 What a frame does (`movechars`, `PG:2358-2470`)

On the first frame after a key (`cframe == -1`): the use counter drops (`meter[cseq]--` if `cseq > 4`, `PG:2380-2381`), pick up and drop actually run (`PG:2385-2398`) and the sequence's `sound` plays (`PG:2403`).
Then frames advance: `cframe++` and the scan **skips any frame whose `pic2 > CHARBL`** (`PG:2468`, the loop condition):

| `pic2`          | Meaning                                                                                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0..49           | bottom block; `pic1` is the top block (50 or more on the top = draw nothing there)                                                                                                        |
| 51 (`CHARBL+1`) | end of sequence (also reached after frame 10)                                                                                                                                             |
| 100 (`MONBL`)   | **fire a monster**: `pic1` is the monster number, born in the hero's column, row = `y/20 - 1` from the hero (`PG:2442-2445`, `CharBirthMon` `PG:3356`); the hero does not move that frame |

Hence "one key per row": the frame's `y` only picks the row the shot appears in.

`pause` is the number of ticks to wait before the next frame (`ci.NextAni = clock + pause`, `PG:2440`); tick = 54.9 ms (chapter 12).
A frame's `x`,`y` are pixels **added** to the hero's position this frame (limit 11 per tick after gravity); with `Momentum` they feed `gravx`/`gravy` instead, which then decay under the gravity timer (`PG:2450-2466`, `PG:3738-3764`).

## 7.4 Repeating, interrupting, counting

At the end of a sequence it **stops** (pops back to the previous one) if any of these holds (`PG:2413-2431`): the use counter is spent (`meter <= 0` and `cseq > 4`), it is hurt/drop/pick up, `norepeat` is set, the key was lifted
(`keydn[key>>8] == 0`), or it has looped twice without a frame to draw (`ZeroBefore > 1`, the guard against an endless empty loop). Otherwise it restarts at frame 0 and spends another use.

- **`ground`** is documented in the header as "actually, whether the sequence can be interrupted" (`CHAR.H:34-35`). A pending key waits while `ground` is set unless the sequence is on its first frame (`PG:1476`).
- **`bloc`** ties a sequence to an inventory block: `ci.seqon[i] = (bloc == BACKBL)` at scene start (150 = untied), and carrying that block turns it on (`PG:4655`; `checkseq_fortie`, `PG:2228`).
- **`meter[5..19]`** are the uses left for sequences 5..19. `-20000` means "no key on this sequence" (`PG:4668-4669`); `INF_REPEAT` means unlimited. Chapter 9.
- **Joystick** sequences search from 3 up (`PG:4391`): `jstk_mov` is a direction 1-8 (9 any), `jstk_but` 0 any, 4 none, else the button.
- **Sound per key**: a sequence's `sound` slot plays on its first frame (`PG:2403`).
- Key-stack: a key press pushes the previous sequence on a stack of 20 (`keystack`, `PG:4465-4469`, popped at `PG:4490-4493`), so releasing a key falls back to the previous held key's sequence. `CleanKeyStk` empties it if full.

## 7.5 The two-block body and the screen

The hero is a top and a bottom block (40 pixels tall). It is drawn into the buffer and saved under with `savetop`/`savebottom` (20 x 20 each, `PG:615-616`) and never clipped by the block-level bounds in chapter 3.
It is kept out of the screen's outer column and row by `chkscrnbounds` (`PG:3395-3437`) when the scene scrolls only partly (chapter 3). `chkmapbounds` wraps it around the 100 x 100 map (`PG:3386-3393`, chapter 4).

Position: `x[0]`,`y[0]` map cell; `x[1]`,`y[1]` pixel inside it 0..19; `x[2]`,`y[2]` the "add-on" of momentum (`CHAR.H:46`). The file's saved `x`,`y`,`cframe`,`cseq` are overwritten on scene entry (`PG:4673-4678`).

## 7.6 Inventory

`inv[10]`, entries are background block numbers; **150 means empty** (`BACKBL`). `PickupBloc` refuses when `inv[9] != BACKBL`, i.e. when the **last** slot is taken (`PG:2123`), then fills the first empty slot.
It looks through the 6 touched cells for a block with `obj != 0` and a **non-refused** touch effect (`PG:2124-2136`). `Display_Invent` draws the two rows of five with a test against 150 (`PG:1955-1966`), while `StartGameInits` fills the game's copy with **151**
(`PG:4638`) until a scene copies the character's own `inv` in (`PG:4649-4651`). Both markers mean "empty" in practice; mixing them is a source quirk the port keeps (chapter 14).

## 7.7 Tips

- Put the "fast" frame at 11 pixels and the "slow" at 5; anything above 11 is cut.
- To get a long jump, use `Momentum` with a gravity block below, and let `gravy` carry the arc.
- A sequence you want to be unusable until an item is carried: set `bloc` to the item's block number.
- `norepeat` makes a fire key one shot per press.
- Keep sequences 0-4 for the five jobs; do not bind a key to them unless the sequence is meant to replace the default (pick up/drop use 3 and 4 as the keys' targets).

## 7.8 Hazards

- A sequence with 10 frames and no 51 ends only after frame 10.
- `xtra`, `extra`, the second record, the saved position: ignored (chapter 14).
- A pickup is refused when slot 9 is full even if slot 3 is free (the empty test is on the last slot).
