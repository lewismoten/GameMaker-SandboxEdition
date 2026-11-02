# `palette/`: palette editor

The Palette editor changes DOS VGA `.PAL` files. `palette.ts` is the editor; `paletteTools.ts`
offers ramps, glowing colors and relit variants. `paletteReservations.ts` keeps editor-only
character, monster and background ranges in the companion file; `paletteRoleDetect.ts` suggests
only colors exclusively used by each matching block-set kind, and `paletteRoleCopy.ts` copies
these reservations from another saved project. Reservations are optional and never enforced: colors in no range are global, 0 is the background color and 255 transparency. The Level check's color roles suggestion (`check/checks/colorRoles.ts`) and the block editors' color note (`blocks/blockColorRole.ts`) use them to point out a block drawn with another kind's colors. `vision*.ts` checks palette contrast and offers
safe fixes across every level that uses the palette (`visionFallback.ts` supplies indexed
artwork when the level preview is empty). `colorPicker.ts` stages an HSV color choice;
`paletteCopy.ts` copies a color range into the open palette; `paletteReservationFields.ts` edits
shared reservations; `pictureColors.ts` reduces a GIF's pixels to a chosen color budget.
