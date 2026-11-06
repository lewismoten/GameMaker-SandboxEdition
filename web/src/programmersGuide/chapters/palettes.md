# Palettes and fades

## 11.1 The palette

| Fact             | Value                                                          | Where                                                             | Tag      |
| ---------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- | -------- |
| Colors on screen | 256 (mode 0x13: one byte per pixel)                            | `GRAPH.H:15-16`                                                   | [VGA]    |
| Each color       | 3 components, **6 bits** each (0..63)                          | `RGBdata::Set` masks with 63, `PH:13-14`                          | [VGA]    |
| Colors possible  | 64 x 64 x 64 = **262,144**                                     | arithmetic                                                        | [VGA]    |
| File             | 256 x 3 = **768 bytes**, red, green, blue per entry            | `PG:4244-4246` loads `sizeof(RGBdata) * 256`; port `palette.ts:3` | [file]   |
| Per scene        | one palette in file slot 0; every picture in a scene shares it | `PG:4244`                                                         | [design] |
| Transparent      | **255** (`TRANSCOL`) in sprite drawing and in the hit test     | `PG:58, 2850-2950`                                                | [design] |

Palette components are meant to be 0..63. `RGBdata::Set` masks constructor/setter inputs with 63 (`PH:13-17`), but the scene loader reads raw bytes (`PG:4245`) and `SetAllPal` sends them straight to the DAC (`PALA.ASM:98-117`). That setter is not proof of how a DOS palette file with high bits behaves: the DAC's handling of those invalid values is **[not yet checked in DOSBox]**. The web display explicitly masks with 63 (`engine/formats/palette.ts:18-28`).

### Why 255 is the transparent color

The source states the number (`#define TRANSCOL 255`, `PG:58`) and the comment "the value that is transparent in `_pic` fns" and nothing else. **[inference]** the last entry may have seemed a convenient color to reserve; the source says nothing about palette-editor usage or the authors' motive. Screen clears use index 0, which need not be black; fades use the separate true-black value `Black(0,0,0)` (`PG:287`, `PG:1591`, `PG:1533`).
The price is exactly one of the 256 colors: **255 usable colors** in a hero or monster picture. Three consequences that follow from the code:

- **Background blocks draw all 400 pixels, including 255**: it is a real color there (whatever entry 255 holds, often black), not a hole. Only sprite drawing (`BufDrawSpBlk`, `PG:2300-2310`) and the hit test skip 255.
- A hero or monster pixel at 255 never touches anything (chapter 8): an all-255 frame is immune.
- GIF pixels at 255 become holes **when used in hero or monster sprites**, not in background blocks or full-screen pictures. The released IMAGE path decodes the GIF and copies selected blocks without a 255-specific warning or remap (`IMAGE.C:224-249`, `IMAGE.C:368-385`, `IMAGE.C:387-484`; sprite sentinel `PG:58`). This is a source reading, not a live editor test.

## 11.2 Fades (`FadeTo`, `PC:62-117`)

`FadeTo(dest, time = 65)` (`PH:65`) walks all 256 entries from the current palette to `dest` in **65 iterations** (`PC:94-113`). Per iteration, a Bresenham accumulator advances each component; its `while` can take multiple level changes if a shorter time is supplied (`PC:100-106`). It then waits until **vertical retrace is active** and writes the palette (`PC:111-112`). It does not first wait for a new retrace edge, so the source does not guarantee 65 distinct retraces.

- Duration **[estimate]**: if each iteration reaches a separate retrace, 65 / 70.09 Hz = **0.93 s** in mode 0x13; at 60 Hz it is **1.08 s**. Those are conditional figures, not measured DOS durations. The web deliberately uses `steps / 70` seconds (`engine/engine/machine.ts:254-275`).
- Why 65 and not 63: with valid six-bit endpoints, the largest component change is 63, so 65 iterations give at most one level change per iteration (`PC:94-107`). **[inference]** smoothness may explain the choice; neither the number's historical reason nor a "fastest smooth fade" is established.
- Cost per step: one index-port write followed by 768 byte outputs to DAC data port 0x3C9 (`PALA.ASM:98-117`). At roughly 1 µs per ISA I/O write that is **0.8-1.5 ms on a 286**, and the vertical blanking interval of mode 0x13 is about 1.4-1.6 ms. **[estimate]** On a slow machine the last colors of each step can be written after the picture has started again: a faint shimmer in the fade. **[not yet checked in DOSBox]**
- Memory: `FadeTo` takes `256 x 12 + 256 x 3` = 3,840 bytes from the far heap (`PC:75-76`); if that fails it sets the palette at once (`PC:78`), a hard cut instead of a fade. A scene that fills memory cuts instead of fades. [64K] [DOS]
- Every scene start: all colors set to black (`SetAllPalTo(&Black)`, `PG:1354`), the map is drawn **while black**, then `FadeTo(colors)` fades it in (`PG:1397-1399`). The roughly **1 second** is the retrace-based estimate above, not a guaranteed scene delay. Ending: `FadeAllTo(Black)` (`PG:1533`).
- `FadeAllTo(color)` is the same loop toward a single color (`PC:119-`).

### Black-palette cut scenes

A scene whose palette file is entirely black draws a picture nobody can see, and every `FadeTo(colors)` fades to black: the classic "pass-through" scene. Its intro or message screen uses its own palette (`ShowGraphic`, `PG:1258-1320`: GIF/FLI screens load their own palette and fade to it, `PG:1263, 1279`) and then returns.
The black game screen adds no visible color change, but `FadeTo` still runs its iteration and retrace-wait loop even when the endpoints match (`PC:94-116`). Do not budget it as a free fade. The message's two visible fades have the same unmeasured timing caveat.

## 11.3 The menu colors are matched, not fixed

The inventory screen, the load screen and the error boxes ask for "blue" or "yellow" by value (`RGBBlue(10,10,63)`, `RGBYellow(63,63,0)`, `RGBRed(63,10,10)`, `PG:287-290`) and then **find the nearest entry in the scene's own palette** (`RGBdata::Match`, `PC:16`).
So a scene with no blue in its palette shows its inventory box in whatever is nearest. A game maker who wants the inventory legible must put a clear blue, a yellow and a red in every scene's palette. [design]

Text pages work the same way: a `.txt` page prints in `RGBPurple(50,10,50)` (`PG:291`) matched to the palette of the picture shown before it, or the scene's when there is none (`PG:1300-1305`). A palette without that purple prints the page in its nearest color.

Screens without a picture are filled with **color 0 of the palette that is up**, not with black: the F2 status screen (`PG:1591`), the load screen (`PG:1753`), the start of play (`PG:1121`), a text page's clear (`PG:2038`) and the high score table, drawn in the scene's colors (`HISCOREL.C:52`). Scene fades still go to true black (`FadeAllTo(Black)`). So pick color 0 with care: everything on those screens is read against it.

## 11.4 Tips

- Reserve entry 255 for transparency from the start; keep entry 0 black.
- Put a clear blue, red and yellow in each scene's palette (inventory, error boxes).
- For a "lights out" scene change the palette, not the blocks: the fade does the same palette work whatever is on screen; 0.93 s is a conditional estimate, not a guaranteed DOS duration.
- The fade is tied to the display refresh, so a **timed** event cannot be counted in fade frames; count it in ticks.
- Shorter fades are not available from a game file: the time is the C default (65). Changing it needs a different PLAYGAME.

## 11.5 Hazards

- A palette that is not 768 bytes is a bad file.
- Keep components in 0..63; high-bit file values are invalid, and their DOS display behavior still needs a VGA check.
- A scene on a nearly full heap cuts instead of fading.
