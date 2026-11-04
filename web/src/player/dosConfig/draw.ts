// The drawing of PLAYGAME's Configure screen: DrawConfigScrn, DrawSurf and CuteBox (PLAYGAME.C 4790-4843,
// 5103-5133) on the 320 x 200 screen, with the same coordinates, palette entries and draw order.
import type { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { type ConfigState, INTX, INTY, INT_C, PORTX, PORTY, PORT_C, SNDCARDX, SNDCARDY, VCARD_C, VGACARDSEP, VGACARDX, VGACARDY, VGA_TYPES } from './model';

type Canvas = Pick<Screen, 'boxFill' | 'box' | 'line' | 'point' | 'write'>;

/** CuteBox: a rounded two-color frame around one choice (col1 inside edge, col2 the glow outside it). */
export function cuteBox(s: Canvas, x: number, y: number, x1: number, y1: number, col1: number, col2: number): void {
  s.line(x + 1, y, x1 - 1, y, col1);
  s.line(x + 1, y - 1, x1 - 1, y - 1, col2);
  s.line(x + 1, y1, x1 - 1, y1, col1);
  s.line(x + 1, y1 + 1, x1 - 1, y1 + 1, col2);
  s.line(x, y + 1, x, y1 - 1, col1);
  s.line(x - 1, y + 1, x - 1, y1 - 1, col2);
  s.line(x1, y + 1, x1, y1 - 1, col1);
  s.line(x1 + 1, y + 1, x1 + 1, y1 - 1, col2);
  s.point(x + 1, y + 1, col1);
  s.point(x + 1, y1 - 1, col1);
  s.point(x1 - 1, y + 1, col1);
  s.point(x1 - 1, y1 - 1, col1);
  s.point(x, y, col2);
  s.point(x, y1, col2);
  s.point(x1, y, col2);
  s.point(x1, y1, col2);
}

/** DrawSurf: a panel of color 4 with a three-step bevel (colors 1, 2, 3 from the outside in). */
function drawSurf(s: Canvas, x: number, y: number, xlen: number, ylen: number): void {
  s.boxFill(x, y, x + xlen, y + ylen, 4);
  for (let l = 3; l > 0; l--) s.box(x - l, y - l, x + xlen + l, y + ylen + l, 4 - l);
}

/** Which group of the four a cursor stop belongs to, for the yellow rectangles. */
type Group = 'vga' | 'int' | 'port' | 'sound';
const groupOf = (cursor: number): Group => (cursor >= VCARD_C ? 'vga' : cursor >= INT_C ? 'int' : cursor >= PORT_C ? 'port' : 'sound');

/** The rectangle around the chosen item of one group (the four calls that end DrawConfigScrn). */
export function markChoice(s: Canvas, st: ConfigState, group: Group, col1: number, col2: number): void {
  if (group === 'port') cuteBox(s, PORTX - 3, PORTY - 3 + (st.port - 0x220), PORTX + 25, PORTY + 9 + (st.port - 0x220), col1, col2);
  else if (group === 'int') cuteBox(s, INTX - 3, INTY - 3 + (st.irq - 1) * 8, INTX + 18, INTY + 9 + (st.irq - 1) * 8, col1, col2);
  else if (group === 'vga') cuteBox(s, VGACARDX - 3, VGACARDY - 3 + st.vga * VGACARDSEP, VGACARDX + 12 * 8 + 3, VGACARDY + 9 + st.vga * VGACARDSEP, col1, col2);
  else cuteBox(s, SNDCARDX - 3, SNDCARDY - 3 + st.sound * 16, SNDCARDX + 13 * 8 + 3, SNDCARDY + 9 + st.sound * 16, col1, col2);
}

/** Enter on a choice: the old rectangle is painted over in the panel color, the new one drawn (5051-5066). */
export function moveMark(s: Canvas, before: ConfigState, after: ConfigState, cursor: number): void {
  const g = groupOf(cursor);
  markChoice(s, before, g, 4, 4);
  markChoice(s, after, g, 8, 9);
}

/** DrawConfigScrn: the four panels, every label in its own palette entry (50 + its cursor stop) and the yellow rectangles. */
export function drawConfigScreen(s: Canvas, st: ConfigState): void {
  drawSurf(s, 5, 5, 150, 190); // Sound and Music background
  drawSurf(s, 170, 5, 140, 160); // VGA Card background
  drawSurf(s, 170, 180, 40, 10); // the left button, labeled Help (the C's comment says Done)
  drawSurf(s, 220, 180, 40, 10); // the right button, labeled Done (the C's comment says Help)

  s.write(190, 8, 7, 'VGA Chip Type');
  s.write(20, 8, 7, 'Sound And Music');
  s.write(20, 60, 7, 'Port  Interrupt');
  s.write(20, 155, 7, 'Sound Driver');
  s.boxFill(9, 169, 150, 178, 3);
  s.line(9, 169, 150, 169, 1);
  s.line(9, 169, 9, 178, 1);
  s.boxFill(9, 181, 150, 190, 3);
  s.line(9, 181, 150, 181, 1);
  s.line(9, 181, 9, 190, 1);

  let ink = 50;
  s.write(SNDCARDX, SNDCARDY, ink++, 'None');
  s.write(SNDCARDX, SNDCARDY + 16, ink++, 'Sound Blaster');
  for (let l = 0; l < 5; l++, ink++) s.write(PORTX, PORTY + l * 0x10, ink, (l * 0x10 + 0x220).toString(16));
  s.write(10, 170, ink++, st.driverName);
  s.write(10, 182, ink++, st.driverPath);
  s.write(INTX, INTY, ink++, '2');
  let l = 0;
  for (; l < 3; l++, ink++) s.write(INTX, INTY + (l + 1) * 0x10, ink, String(l * 2 + 3));
  s.write(INTX, INTY + (l + 1) * 0x10, ink++, '10');
  for (let v = 0; v < 10; v++, ink++) s.write(VGACARDX, VGACARDY + v * VGACARDSEP, ink, VGA_TYPES[v]);
  s.write(171, 181, ink++, 'Help');
  s.write(221, 181, ink, 'Done');

  for (const g of ['port', 'int', 'vga', 'sound'] as const) markChoice(s, st, g, 8, 9);
}

/** The five frames of colors 0 to 4 around the Help text (5024-5031 of the Enter-on-Help case). */
export function drawHelpFrame(s: Canvas): void {
  s.boxFill(0, 0, 320, 200, 0);
  for (let l = 0; l < 5; l++) s.box(40 - 25 - l, 100 - 64 - l, 280 + 25 + l, 180 + 12 + l, l);
}
