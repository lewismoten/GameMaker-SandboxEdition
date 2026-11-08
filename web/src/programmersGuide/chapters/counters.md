# Counters and effects

## 9.1 The thirty counters

`meter[MAXSEQ+10]` = **30** signed 16-bit integers, once in the file (`chrstruct.meter`, `CHAR.H:50`) and once live (`cinfo.meter`, `PG:171`). A block's `effect` byte names which one it changes (`BLOC.H:51`).

| Index | Name                         | What the player does with it                                                    | Evidence                             |
| ----: | ---------------------------- | ------------------------------------------------------------------------------- | ------------------------------------ |
|     0 | hit points                   | the starting value; copied to `ci.hitpts` when that is -1 (new game)            | `PG:4679`                            |
|     1 | lives                        | the starting value; copied to `ci.lives` when that is -1                        | `PG:4680`                            |
|     2 | (unused)                     | copied, never changed by a block (`effect > 2` test)                            | `PG:3478`                            |
|     3 | money                        | refusable counter; **displayed as `meter[3] - 1`** and hidden when it is 32,767 | `PG:1976-1980`, `PG:3441`            |
|     4 | (free counter)               | a plain counter, no display                                                     | `PG:3478`                            |
|  5-19 | uses left for sequences 5-19 | decremented when that sequence starts and on each repeat; 0 means "can't start" | `PG:2380-2381, 2431`; `PG:4390-4400` |
| 20-29 | free counters, refusable     | a touch is refused if it would leave one at 0 or below                          | `PG:3440-3443`                       |

Block `effect` values, as `DoBlockTouchChar` reads them (`PG:3438-3506`): **0** nothing, **1** add `eamt` to lives (separate from the array: `ci.lives`), **2** nothing, **3-29** add `eamt` to that counter. Hit points and score are **not** an `effect`:
they have their own block fields `chhitpt` and `scorepts` (chapter 5).

### The +1 offset

A touch is refused when `meter[effect] + eamt <= 0` for effect 3 and effects 20-29 (`PG:3440-3443`), so a counter can go down to **1** but never to 0. The counter's visible value is therefore one less than the stored value:
money shows `meter[3] - 1` (`PG:1974-1976`). For a key-style counter (effect 20-29, `eamt` = -1) the hero needs a stored value of **2 or more**, i.e. one key held, to pass. A raw starting value of 0 needs **two** accepted +1 pickups before that spend, not a permanently locked gate (`PG:3440-3442`, `PG:3478-3499`). CHAREDIT initializes special counters to stored 1 and resets them to 1 after loading (`code/GM/CHAREDIT.C:113-119`, `code/GM/CHAREDIT.C:198-200`, `code/GM/CHAREDIT.C:1504-1506`). Do not assume a generic editor starting-value field: if a tool displays stored minus one, a shown 0 means stored 1, not raw 0.

Counters 4-19 are **not** refusable: only 3 and 20-29 are. A use counter of 5-19 is protected by the sequence-start test instead.

## 9.2 Range and wrap guards

- Infinite = **32,767** (`INF_REPEAT`, `CHAR.H:14`): a counter at that value is never changed by a touch (`PG:3478`), and for sequence uses it never counts down (`PG:2380`).
- Upper clamp: if `(unsigned)(meter + eamt)` is not below 32,767 the counter is set to **32,766** (`PG:3495-3499`). The cast makes a negative sum look huge, so a negative result is caught by the second guard.
- Lower clamp: the counter never goes below **-32,639** (= -(32,767 - 128), `PG:3496-3497`).
- Hit points: there is **no infinite-hit-point sentinel**. Initial hit points are copied verbatim (`PG:4679`); a hand-edited starting 32,767 is finite and falls with damage. Positive healing is limited to 32,766, even if that lowers a starting 32,767 (`PG:3444-3467`). The port uses the same rules (`engine/engine/scene.ts:327-328`, `engine/engine/touch.ts:91-112`).
- Score is a 32-bit `long` (`PG:151`) with **no** guard; `scorepts` is a 16-bit int per touch.
- A block `ntime` of 32,767 ticks is about 30 minutes at the nominal tick rate, not an exact wall-clock duration. A sequence use counter at 32,767 is **unlimited**, not a 30-minute countdown (`PG:2380-2381`).

## 9.3 What a refused touch does

If the guard fails, `DoBlockTouchChar` returns FALSE **before anything else**: no score, no hit points, no sound, and `really_checktouch` skips the `touchbl` swap (`PG:3524-3547`). So a key door is "a block that costs a counter": the swap to an open door (`touchbl`)
happens only on the touches that were paid for. A refused touch changes nothing and repeats every tick: the hero keeps being refused with no side effects.

## 9.4 Sounds come from counters, not blocks

A block has no sound field. The sound chosen is determined by what changed first, in this order: hit points up (help sound), hurt (a hurt sequence sound), lives up, money up or down, other counter up or down, score up or down (`PG:3437-3506`, sound numbers `SOUND.H:17-25`).
Only the **first** category that fires sounds (`Snded`). Per-key sounds belong to sequences (chapter 7). To give one pickup its own sound, give it its own counter.

## 9.5 Out-of-range effect (a layout-based hazard)

The code indexes `ci.meter[blk->effect]` with an unsigned byte (0-255) and no bounds check (`PG:3440, 3478-3500`). In the linked data layout `ci` is **135 bytes** (`PLAYGAME.MAP`: `_ci` at 22C4:3797, `_chr` at 22C4:381E, difference 0x87 = 135, which matches my sum of the
fields: 4 + 4 + 4 + 5 + 12 + 2 + 2 + 4 + 4 + 4 + 10 + 60 + 20), so memory after `meter` is:

| `effect`  | Addressed memory under this layout                                      | Possible result if written                |
| --------- | ----------------------------------------------------------------------- | ----------------------------------------- |
| 30-39     | `seqon[0..19]` (`cinfo.seqon`, 20 bytes = 10 ints, right after `meter`) | turns sequences on or off in bit patterns |
| 40 and up | the **character record** `chr`, starting at `chr.sq[0].fr[0].x`         | rewrites the hero's own frame data        |

(The refusal test also reads through the invalid index.) These address calculations use the declared `cinfo` fields (`PG:150-172`) and the supplied link map's adjacent `_ci`/`_chr` symbols (`PLAYGAME.MAP:726-727`); they do not prove what every build does with an out-of-bounds access. A write is conditional on touch acceptance and contents not equal to `INF_REPEAT` (`PG:3440-3442`, `PG:3478-3499`), not a guaranteed corruption. **[not yet checked in DOSBox]** An exact-build test must check the packed layout and linker order. The web port bounds the counter write instead of corrupting adjacent objects (`engine/engine/touch.ts:120-133`).
None of the editors offers an effect above 29, so only a hand-edited `.bbl` can do it.

## 9.6 Starting values and the -1 / -20000 markers

`StartGameInits` sets every `ci.meter[]` to **-1** (`PG:4639`) and `ci.hitpts`, `ci.lives` to -1 (`PG:4635-4636`). `StartSceneInits` sees `ci.meter[0] == -1` ("impossible, would be dead") and copies 0-4, 20-29 and the used sequences' counters
from the character file; **an unused sequence (key 0) gets -20000** (`PG:4663-4671`). A later scene with a different character copies a counter in only if it is still -20000 (`PG:4656`), which lets a character swap leave the uses alone.

## 9.7 Tips

- A "key" is a counter 20-29 with a pickup of +1 and a door of -1. The hero shows nothing on screen for it: draw the key in the hero's inventory or make a block that shows it (the on-demand inventory screen lists only money, `PG:1975-1980`).
- Counters 5-19 are ammunition: set the starting value and add refills with blocks (effect = the sequence number).
- Money is the only counter that can be shown. Use it when the player must see a number.
- Start an ordinary key counter at stored 1: raw 0 needs two +1 pickups before a -1 door will open.

## 9.8 Hazards

- Effect 30 or above.
- Counter 2 does nothing; effect 2 does nothing.
- Do not confuse raw stored 0 with a displayed 0 from a stored-minus-one field (stored 1).
- 32,767 means "never changes"; not a big number.

## A paid touch, with actual stored values

There are **30 counters**. The first few are special (hit points to start, lives to start, money). Counters 5 through 19 count the uses of sequences 5 through 19. Counters 20 through 29 are free for your own use:
keys, coins, fuel, anything you like. A block changes a counter by an amount you choose when the hero touches it. A block that would take a money counter or one of counters 20 to 29 down to nothing is **refused**:
the touch is refused before its score, hit points, sound or replacement block takes effect. A suitable solid door can therefore act as a lock; refusal alone does not add solidity.

Money is displayed as stored value minus one: stored 1 shows 0, stored 2 shows 1. A cost of -1 succeeds from stored 2 (leaving 1, shown 0), but fails from stored 1 because the result would be 0. The same refusal test applies to counters 20 through 29. Counters 4 through 19 do not refuse a touch on that basis; sequence-use counters have a separate check before starting a sequence. Ordinary accepted counter changes are capped at 32,766; 32,767 means _never changes_.

The refusal guard and its early return are `code/GM/PLAYGAME.C:3440-3443`; the money display subtracts one at `code/GM/PLAYGAME.C:1976`. This is why “nothing is refused” was ambiguous: effects 4–19 do not use that refusal guard, while a rejected touch for 3 or 20–29 stops all its effects. Counter selection and signed amount are bytes 417 and 418–419 of the block (`code/GM/BLOC.H:51-52`, `engine/formats/blocks.ts:89-90`).
