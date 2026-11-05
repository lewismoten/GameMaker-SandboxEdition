# The screen and the blocks

## The grid: 16 x 10, with nothing left over

`GRAPH.H:15-16` sets `SIZEX 320`, `SIZEY 200` ("graphics mode 0x13"). Blocks are 20 x 20 (`BLOC.H:4`), so the play field is
**320 / 20 = 16 columns** by **200 / 20 = 10 rows** (`SCRNBLEN 16`, `SCRNBWID 10`, `PG:66-67`). 16 x 10 x 400 = 64,000 bytes: exactly the whole screen.
There is **no status bar or border**: the score and inventory are drawn on demand over the picture (`Display_Invent`, `PG:1955-1985`, a box from (10,10) to (310,190)). The authors gave every pixel to the map.
Why 20 pixels: 320 and 200 are both multiples of 20 and of 40; 20 gives a 16-column grid which is a power of two for the shifts, and a hero two blocks tall (40 px) is 20% of the screen height.
**[inference]** 20 is the smallest size that still draws a recognizable face; 16 px would give 20 x 12.5 rows (not whole), and 25 px gives 12.8 columns (not whole).

## How the screen scrolls (why everything is 4 pixels)

PLAYGAME did not redraw the screen to scroll. It moved the VGA's **start address** and drew only the new strip.
`MoveViewScreen` (`SVGAA.ASM:60-166`) writes CRTC registers 0x0C/0x0D (start address high/low, `SVGAA.ASM:87-99`) after waiting out the retrace (`:70-76`), and then the attribute controller's pel-panning register 0x13 (`:139-166`, the pan value is doubled: `shl bl,1`).
Two granularities result:

- **Coarse** steps of 4 pixels (`Shift.x -= 4`, `scroll.zero += SIZEX`, `PG:4020-4030`), because the start address in this display organization counts four pixels per address unit. [inference from `PG:4034-4040` shifting `zero` left by 2 to get `zeroaddon`]
- **Fine** panning of 0 to 3 pixels (`LittleShiftx = movx & 3`, `PG:4030-4031`), done by the pan register.

New ground is drawn a strip at a time with `drawhorizside`/`drawvertside` (`PG:4046-4080`), 4 pixels per call.
Hence the engine's scroll speeds (`SCRSPDX/Y 40`, `SCROLLPERMOVE 6`, `PG:77-79`), the scroll bounds (`MaxX = SIZEX/3`, `PG:1384-1391`), and the port's remark that the original scrolled "in 4 pixel steps plus 0..3 pixel hardware panning" (`web/packages/engine/src/engine/scroll.ts:1-4`).

**The 64 KB ring.** Cards that cannot do all of this (`Vcard == SoftwareSim`, `SVGAA.ASM:51`) use `SoftwareScroll` (`SVGAA.ASM:182-248`): the whole virtual screen lives in the 64 KB scratch segment and is copied to A000 once per frame, starting at `zeroaddon` and **wrapping at 65,536**.
`cmp si,1536` (`:206`) is the literal 65,536 - 64,000 = **1,536**: the number of spare bytes at the end of the ring. When the start offset is above 1,536 the 64,000 bytes straddle the end, and the routine copies in two pieces (`:211-247`; the comment at `:233` says "Only copy 64000 not 64k"). Scrolling up or down by a row moves the start by `SIZEX` (320) bytes, and the segment wraps for free because offsets are 16-bit. That is the real reason the buffer is 64 KB and not 64,000. **[inference]** Given the `farmalloc(65570)` at `DIRTRECT.C:86` and the wrap-around code, the 16-bit offset wrap was being used as a free circular buffer.
Horizontally the ring is a single line of 320 bytes per row with no gap, so scrolling right by 4 means starting 4 bytes later: the wrap is invisible.

## Where monsters can and cannot be seen (the edge-block effect)

A monster is drawn only if its **map cell**, put on the screen, lies inside a box. The test is made on the cell, not on the monster's pixel (`CalcDraw`, `PG:2281-2290`): the cell's screen position is `(cell - view) x 20 - scroll offset`, and that is compared with the box

```
Coord2d ScrnLowBnd={1,1}, ScrnUpBnd={SIZEX-BLEN, SIZEY-BLEN};     // PG:294   -> {1,1} .. {300,180}
```

Both corners are inclusive (`COORD2D.HPP:33-36`, `>=` and `<=`). Only after the cell passes does `CalcDraw` add the monster's own pixel offset inside the cell. The same box is used when deciding to draw a monster (`minfo::Draw`, `PG:2297`), when deciding whether a map cell is "on screen" for births and block touches (`onscrn`, `PG:3815-3830`), and when deciding whether to erase a moved monster (`PG:4189`).

- **Upper bound 300 x 180** = 320-20, 200-20: the top-left pixel of a 20 x 20 sprite, so the whole sprite must fit on the screen. A monster half off the right or bottom edge is not drawn (there is no clipping code: the blitter writes straight to memory, so a partly-off sprite would wrap onto the next row).
- **Lower bound 1, not 0.** A commented-out line right below says what it replaced: `//return( (Ret->x >=0)&&(Ret->y>=0)&&(Ret->x<=SIZEX-BLEN)&&(Ret->y<=SIZEY-BLEN));` (`PG:3830`). So the lower bound was moved from 0 to 1 on purpose, later in development. [inference] The likely reason is the save-under: `BufGetBlkAddr(DrawAddr, save)` at `PG:2301` reads 20 x 20 bytes from the buffer address, and at x = 0 or y = 0 with the ring's wrap (and a 0 to 3 pixel pan), the first row or column of that rectangle can land on the previous wrapped line. This is a guess; no comment says so.
- **The hidden band is a whole cell, not one pixel.** Because the test runs on the cell, a cell at screen position 0 is below the lower bound of 1. With a still screen (scroll offset 0) the whole left column of cells and the whole top row are "off screen": a monster there is not drawn at any pixel offset. [not yet checked in DOSBox]
- **A hidden monster cannot hurt the hero.** The hit test skips off-screen cells too (`ChkMonChr`, `PG:2728`), so a monster in the band neither draws nor hurts, though it keeps moving along its path. [not yet checked in DOSBox]
- **The other edge is different.** A monster in the right-most allowed cell (screen position 300) with a pixel offset of 1 or more lands at 301 to 319, fails the draw test (`minfo::Draw`, `PG:2294`) but keeps a real position: it is invisible and can still hurt. [inference] [not yet checked in DOSBox]
- This fits the **Round and Round** fix better than a one-pixel rule: its car vanished at the top of the loop, and the fix moved the loop and path down one block (commit `03c724f6c`).

**Tip:** keep spawn cells and the ends of paths out of the left column and top row of every screen where they must be seen, and fully inside a 16 x 10 view at the right and bottom (x <= 300, y <= 180). Do not hide a hazard in the band on purpose; know why a monster in the top row did nothing.

## What changes block pictures (and the stale edge)

Animated blocks change in `changeblks` (`PG:2326-2351`): first the timer table, then a redraw of **only cells whose block number just changed**:

```
for (lx=mx+1; lx<mx+SCRNBLEN; lx++)     // PG:2344   columns mx+1 .. mx+15
  for (ly=my+1; ly<my+SCRNBWID; ly++)   // PG:2345   rows    my+1 .. my+9
```

The loops start at `+1` and stop one short, so they visit a **15 x 9** interior of the 16 x 10 grid: the **left column (mx), the top row (my) are never redrawn here**, and neither is the column/row that scrolling exposes on the right and bottom (mx+16, my+10) (they are only drawn when the scroll routine brings them in, which uses the current frame, `PG:4046-4080`).
**[inference]** consequence: an animated block (a ring) that sits in the left column or top row of a stationary view keeps the picture it had when it was last scrolled in, until the view scrolls. The touch code still uses the true frame (`GetTouchbl` reads `blkmap`, `PG:3789-3799`), so a block can _look_ like the old frame while acting as the new one. The port draws every cell with its current frame every frame (`render.ts:36-42`, `shownBlock`), so it does not show this. See fidelity notes.
**Tip:** keep animated hazards one block in from the left and top edges of a still screen.

## Scroll limits on the hero

The hero is also corralled by the screen (`PG:3405-3437`): with `tmx`/`tmy` the hero's cell relative to the screen's top-left, a left move is stopped when `tmx < 1` and a right move when `tmx > SCRNBLEN-2` (14); up when `tmy < 1`, down when `tmy > SCRNBWID-2` (8). So with a map region where scrolling is disabled (`ScrollInfo` 0, `GRATOR.H:67-70`), the hero cannot enter the extreme column 0 or row 0 and cannot walk past the 15th column. The map's 1-block margin, in other words, is part of the rules. **[inference]** that clamp is also a reason the hidden band rarely shows in play: the hero seldom stands where a monster would be hidden.
