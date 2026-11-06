// Two flat rooms, no combat. Three one-shot copies of each effect; the door resets the course.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL } from '../../starter/book';
import { addStarterBlocks } from '../../starter/blocks';
import { Grid } from '../../starter/grid';
import { StarterMap } from '../../starter/map';
import { buildStarterPalette, skyOf } from '../../starter/palette';
import { addSign } from '../../starter/sign';
import { EFFECTS } from './effects';

export function buildRooms() {
  const pal = buildStarterPalette();
  const rooms = ['Full band', 'Band + effects'].map((title, room) => {
    const book = new Book('bbl');
    addStarterBlocks(book, pal);
    const g = new Grid(64, 14);
    g.row(10, 0, 63, 'G').fill(0, 11, 64, 3, 'D');
    g.col(0, 0, 9, 'X').col(63, 0, 9, 'X');
    g.put(3, 8, 's').put(3, 9, 'S').put(62, 8, 'e').put(62, 9, 'E');
    const map = new StarterMap(book, g.rows());
    const sign = (x: number, text: string, height = 3) => {
      const board = addSign(book, pal, `s${x}`, text, 4, height);
      map.sign(x, 9 - height, board);
    };
    if (room === 0) {
      sign(5, 'FULL BAND NINE FM VOICES AT ONCE.');
      sign(13, 'PIANO BASS STRINGS BRASS');
      sign(21, 'LEAD BELL ORGAN PAD PLUCK');
      sign(29, '32 BARS. FAST NOTES. WAIT TO HEAR IT LOOP.');
      sign(39, 'OPL2: 9 MELODIC OR 6 PLUS 5 DRUMS.', 4);
      sign(49, 'THIS SONG: 9 MELODIC. NO DRUM MODE.', 4);
      sign(57, 'NEXT: BAND + EFFECTS', 2);
    } else {
      sign(5, 'SAME BAND. WALK ON PADS. F1: NOTES.', 4);
      EFFECTS.forEach((effect, i) => {
        const x = 12 + i * 10;
        sign(x, effect.label + (i === 3 ? ' DOS BOUNDARY NOT SAFE' : ' THREE PADS'), 4);
        const pic = new Pixels(20, 20, skyOf(pal));
        pic.rect(2, 9, 16, 10, pal.c('gold', 3)).frame(2, 9, 16, 10, pal.c('ink', 0));
        book.add(effect.name, pic, { grav: PULL.down, effect: effect.effect, eamt: effect.amount, touch: `${effect.name}.used` });
        book.add(
          `${effect.name}.used`,
          pic.map((_x, _y, c) => (c === pal.c('gold', 3) ? pal.c('stone', 2) : c)),
          { grav: PULL.down },
        );
        for (const column of [x, x + 2, x + 4]) map.set(column, 9, effect.name);
      });
      sign(52, 'SCORE PAD. THEN DOOR: RESET ALL.', 4);
      const pic = new Pixels(20, 20, skyOf(pal)).rect(2, 9, 16, 10, pal.c('green', 3));
      book.add('score', pic, { grav: PULL.down, score: 1, touch: 'sky' });
      map.set(38, 9, 'score').set(56, 9, 'score');
      sign(37, 'SCORE', 1);
    }
    return { title, file: room ? 'effects' : 'band', book, map };
  });
  return { pal, rooms };
}
