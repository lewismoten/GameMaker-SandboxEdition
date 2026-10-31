# `palette/`: palette editor

The Palette editor changes DOS VGA `.PAL` files. `palette.ts` is the editor; `paletteTools.ts`
offers ramps, glowing colors and relit variants. `paletteReservations.ts` keeps editor-only
character, monster and background ranges in the companion file; `paletteRoleDetect.ts` suggests
only colors exclusively used by each matching block-set kind, and `paletteRoleCopy.ts` copies
these reservations from another saved project. `vision*.ts` checks palette contrast and offers
safe fixes across every level that uses the palette.
