// Where PLAYGAME writes its own words over the title scene's pictures, as boxes for the templates
// (TMENU.GIF, TSCORES.GIF, TSAVE.GIF, TLOAD.GIF). Every number comes from the engine's stock look
// (web/packages/engine/src/engine/playerLook.ts and patchTable.ts), which match code/GM:
//   menu        GameMenu and GVertMenu(70, 121, 8, 6, ...) in PLAYGAME.C (engine/menus.ts drawMenu, menuMarker)
//   high scores ShowHighScores in HISCOREL.C (menus.ts drawHighScores)
//   save, load  SelectGameToSave / SelectGameToLoad, SaveGame, LoadGame in PLAYGAME.C
//               (engine/funcKeys.ts drawSaveSlots, pickSaveSlot; engine/scene.ts save and load)
// GWrite draws 8 by 8 cells (GRAPHC.C GPutChar), so a line of n letters at (x, y) covers x..x+8n-1,
// y..y+7. A box is the most a slot can hold: the longest string the engine writes there.
// Menus and these pictures use the whole 320 by 200 screen (UnCropScreen), unlike play (312 by 196).
import { STOCK_LOOK as look } from '@lewismoten/gamemaker-sandbox-engine/engine/playerLook';
import { SCENEDESCLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/game';

/** The color PLAYGAME picks for the words: the palette entry nearest to it. */
export type Ink = 'BLUE' | 'RED' | 'YELLOW';

/** A label's lines and where its top-left sits (its top-right when `right`). */
export interface Label {
  x: number;
  y: number;
  lines: string[];
  right?: boolean;
}

export interface TextBox {
  x: number;
  y: number;
  w: number;
  h: number;
  ink: Ink;
  /** What goes there, for the label. */
  what: string;
  /** Lines of the label (coordinates first). */
  label: Label;
  /** A second label, when one place has no room. */
  more?: Label;
  /** Extra rows inside the box that the engine writes one by one (their top y), for hatching row by row. */
  rows?: number[];
}

export interface Template {
  /** The 8.3 file on the disk (the plain version adds P). */
  file: string;
  /** The slot it is for, and the file this game puts there. */
  slot: string;
  boxes: TextBox[];
}

const CELL = 8;
const cells = (s: string) => s.length * CELL;
const n = (id: string) => look.num(id);
const longest = (...ids: string[]) => Math.max(...ids.map((id) => cells(look.text(id))));

/** A box's label: its top-left (X, Y) and its width and height (W, H), in pixels. */
export const size = (b: { x: number; y: number; w: number; h: number }) => `${at(b)} ${dims(b)}`;
const at = (b: { x: number; y: number }) => `X${b.x} Y${b.y}`;
const dims = (b: { w: number; h: number }) => `W${b.w} H${b.h}`;

/** The main menu: the game's name (the start scene's description, up to SCENEDESCLEN - 1 letters), six choices, the marker, and the "No game-specific ..." line. */
function menu(): Template {
  const choices = ['play', 'instructions', 'storyline', 'credits', 'highScores', 'quit'];
  const x = n('layout.menu.play.x');
  const y = n('layout.menu.play.y');
  const lastY = n('layout.menu.quit.y');
  const m = { x: n('layout.menu.markerX'), y: n('layout.menu.firstY'), dy: n('layout.menu.spacing'), w: n('border.marker.width') };
  // GVertMenu fills x..x+w, y-8+c*dy .. +4 for rows c = 1..6
  const markTop = m.y - 8 + m.dy;
  const markBottom = m.y - 8 + 6 * m.dy + 4;
  const name = { x: n('layout.menu.titleX'), y: n('layout.menu.titleY'), w: (SCENEDESCLEN - 1) * CELL, h: CELL };
  const nofile = {
    x: n('layout.menu.noFile.x'),
    y: n('layout.menu.noFile.y'),
    w: longest('str.menu.noInstructions', 'str.menu.noStoryline', 'str.menu.noCredits'),
    h: CELL,
  };
  const list = { x, y, w: longest(...choices.map((c) => `str.menu.${c}`)), h: lastY + CELL - y };
  const mark = { x: m.x, y: markTop, w: m.w + 1, h: markBottom - markTop + 1 };
  return {
    file: 'TMENU',
    slot: 'MENU GRAPHIC',
    boxes: [
      { ...nofile, ink: 'RED', what: 'NOTE', label: { x: nofile.x, y: nofile.y - 8, lines: [`${size(nofile)}  ONLY IF A PAGE IS MISSING (RED)`] } },
      { ...name, ink: 'BLUE', what: 'NAME', label: { x: name.x, y: name.y - 8, lines: [`${size(name)}  GAME NAME (BLUE)`] } },
      {
        ...list,
        ink: 'BLUE',
        what: 'CHOICES',
        rows: choices.map((c) => n(`layout.menu.${c}.y`)),
        label: { x: list.x + list.w + 6, y: list.y + 2, lines: [at(list), dims(list), 'SIX CHOICES', '(BLUE)'] },
      },
      {
        ...mark,
        ink: 'BLUE',
        what: 'MARKER',
        label: { x: mark.x - 5, y: mark.y + 1, right: true, lines: [at(mark), dims(mark), 'MARKER (BLUE)', 'ONE COLOR HERE'] },
      },
    ],
  };
}

/** The high scores: the title, ten rows of a 10-digit score, a space and a name of up to 22 letters (CheckHighScores' GGet), "Your Latest Score", and "Hit any key". */
function scores(): Template {
  const title = { x: n('layout.hiscore.title.x'), y: n('layout.hiscore.title.y'), w: cells(look.text('str.hiscore.title')), h: CELL };
  const rows: number[] = [];
  let space = n('layout.hiscore.rowSpacing');
  let y = n('layout.hiscore.firstRowY');
  for (let j = 0; j < n('layout.hiscore.rows'); j++) {
    rows.push(y);
    y += space;
    if (j % 2 === 0) space--;
    space--;
  }
  const latestY = y;
  const rowW = (10 + 1 + 22) * CELL;
  const list = { x: 20, y: rows[0], w: rowW, h: rows[rows.length - 1] + CELL - rows[0] };
  const latest = { x: 20, y: latestY, w: cells(look.format('str.hiscore.latest', 0)), h: CELL };
  const key = { x: n('layout.hiscore.anyKey.x'), y: n('layout.hiscore.anyKey.y'), w: cells(look.text('str.hiscore.anyKey')), h: CELL };
  return {
    file: 'TSCORES',
    slot: 'HIGH SCORE BACKDROP',
    boxes: [
      { ...title, ink: 'RED', what: 'TITLE', label: { x: title.x + title.w + 6, y: 1, lines: [size(title), 'TOP TEN SCORES (RED)'] } },
      {
        ...list,
        ink: 'BLUE',
        what: 'SCORES',
        rows,
        label: { x: 26, y: rows[0] + CELL + 4, lines: [`${size(list)}  TEN SCORES AND NAMES (BLUE)`] },
        more: { x: 26, y: rows[1] + CELL + 4, lines: [`ROWS AT Y ${rows.join(' ')}`] },
      },
      { ...latest, ink: 'BLUE', what: 'LATEST', label: { x: latest.x + latest.w + 5, y: latest.y + 1, lines: [size(latest), 'YOUR LATEST', 'SCORE (BLUE)'] } },
      { ...key, ink: 'RED', what: 'KEY', label: { x: key.x - 6, y: key.y - 5, right: true, lines: ['HIT ANY KEY (RED)', size(key)] } },
    ],
  };
}

/** The save or load list: ten names of up to 20 letters at (80, 40 + 14i), the marker (GVertMenu(60, 35, 14, 10)), and the line at y 185. */
function slots(saving: boolean): Template {
  const rows = Array.from({ length: 10 }, (_, i) => 40 + i * 14);
  const names = { x: 80, y: rows[0], w: 20 * CELL, h: rows[9] + CELL - rows[0] };
  const w = n('border.marker.width');
  const mark = { x: 60, y: 35 - 8 + 14, w: w + 1, h: 35 - 8 + 10 * 14 + 4 - (35 - 8 + 14) + 1 };
  // the line under the list: SaveGame's "I cannot save your game!" / "Game Saved!"; LoadGame's "This game has not been saved!", the port's "This saved game is damaged!" and "Old Game Loaded!"
  const end = (x: number, s: string) => x + cells(s);
  const right = saving
    ? Math.max(end(40, 'I cannot save your game!'), end(112, look.text('str.save.done')))
    : Math.max(end(40, look.text('str.load.empty')), end(40, 'This saved game is damaged!'), end(88, look.text('str.load.done')));
  const line = { x: 40, y: 185, w: right - 40, h: CELL };
  return {
    file: saving ? 'TSAVE' : 'TLOAD',
    slot: saving ? 'SAVE GAME BACKGROUND' : 'LOAD GAME BACKGROUND',
    boxes: [
      {
        ...names,
        ink: 'YELLOW',
        what: 'NAMES',
        rows,
        label: {
          x: names.x + names.w + 6,
          y: names.y + 1,
          lines: [at(names), dims(names), 'TEN NAMES', 'A ROW EVERY 14', '(YELLOW: KEEP', 'THEM DARK)', saving ? 'ONE COLOR A ROW' : ''].filter(Boolean),
        },
      },
      { ...mark, ink: 'RED', what: 'MARKER', label: { x: mark.x - 5, y: mark.y + 1, right: true, lines: [at(mark), dims(mark), 'MARKER', '(RED)'] } },
      { ...line, ink: 'BLUE', what: 'MESSAGE', label: { x: line.x, y: line.y - 8, lines: [`${size(line)}  MESSAGE (BLUE)`] } },
    ],
  };
}

/** The four templates, in the order the title scene lists their slots. */
export const TEMPLATES: Template[] = [menu(), scores(), slots(false), slots(true)];
