// The seven graduations' approved micro plaques; preserve their themed art and gameplay cells.
import { Book } from '../../kit/starter/book';
import type { Graduation } from '../../kit/starter/graduationConfig';
import type { buildLevels } from '../../kit/starter/graduationLevel';
import { StarterMap, ORIGIN } from '../../kit/starter/map';
import { addMicroPlaques, stampTiledSign, type MicroPlaqueText } from '../../kit/starter/microPlaque';

const BANNERS: Record<string, string[]> = {
  'graduation-basics': ['FIRST', 'STEPS'],
  'graduation-blocks': ['BLOCKS &', 'SHOWCASE'],
  'graduation-diploma': ['SANDBOX', 'DIPLOMA'],
  'graduation-heroes': ['HEROES &', 'FOES'],
  'graduation-moving': ['MOVING &', 'PUSHING'],
  'graduation-story': ['STORY &', 'FINISH'],
  'graduation-wiring': ['WIRING &', 'WORLDS'],
};
const COURSES: Record<string, string[]> = {
  ladder: ['101', 'LADDER'],
  keyGate: ['102', 'KEYS'],
  coins: ['105', 'COINS'],
  crates: ['106', 'CRATES'],
  heart: ['205', 'HEART'],
  ice: ['208', 'ICE'],
  wind: ['211', 'WIND'],
  hop: ['302', 'HOPS'],
  bug: ['306', 'BIG BUG'],
  flock: ['313', 'FLOCK'],
  say: ['401', 'HI!'],
  pads: ['404', 'PADS'],
  countdown: ['412', 'ZERO'],
  lever: ['501', 'LEVER'],
  tokens: ['502', 'TOKENS'],
  fakeWall: ['504', 'SECRET'],
  shore: ['602', 'WATER'],
  stars: ['603', 'STARS'],
  popups: ['610', 'POP-UPS'],
};
const oldSign = (name: string) => name.startsWith('sign.') || name.startsWith('signPost');

/** The original map has already extended its scenery and indexed its monsters. */
class CeremonyMap extends StarterMap {
  override done() {
    return this.map;
  }
}

/** Rebuild only the sign inventory; retain names and rules for every gameplay block. */
export function microSigns(built: ReturnType<typeof buildLevels>, cfg: Graduation): ReturnType<typeof buildLevels> {
  const diploma = cfg.id === 'graduation-diploma';
  const banner = BANNERS[cfg.id];
  if (!banner) throw new Error(`No graduation plaque plan for ${cfg.id}`);
  const levels = built.levels.map((level) => {
    const old = level.book;
    const names = [...old.index.keys()];
    const book = new Book('bbl');
    for (const name of names) if (!oldSign(name)) book.add(name, old.pics.get(name)!, old.rulesOf(name));
    const texts: Record<string, MicroPlaqueText> = {
      start: { lines: ['THIS', 'WAY→'] },
      helpers: { lines: diploma ? ['YAY', 'YOU!'] : ['FRIENDS', 'ARE HERE'], post: !diploma },
      cheer: { lines: diploma ? ['TEDDY &', 'GWINN'] : ['YAY', 'YOU!'], post: false },
      doc: { lines: ['DOC', 'LEO'] },
      scroll: { lines: ['YOUR', diploma ? 'DIPLOMA' : 'SCROLL'] },
      banner: { lines: banner, post: false },
      hallBanner: { lines: banner, post: false },
      welcome: {
        lines: diploma ? ['LAST', 'WALK'] : cfg.id === 'graduation-basics' ? ['WELCOME', 'GRADS'] : ['THIS', 'WAY→'],
        post: cfg.id === 'graduation-basics' ? false : undefined,
      },
      bubble: { lines: ['HI!'], post: false },
    };
    for (const id of cfg.arrive.nods) texts[`nod.${id}`] = { lines: COURSES[id], post: false };
    ['STEPS', 'PUSHING', 'HEROES', 'STORY', 'WIRING', 'BLOCKS'].forEach((word, i) => {
      texts[`stage${i}`] = { lines: [word], post: false };
    });
    const groups = new Map<string, { x: number; y: number }>();
    const raw = structuredClone(level.map.done());
    // Find the original boards before translating their numeric block references.
    for (let y = 0; y < level.map.height; y++)
      for (let x = 0; x < level.map.width; x++) {
        const name = names[raw.blocks[(y + ORIGIN) * 100 + x + ORIGIN]];
        const match = /^sign\.(.+)\.\d\d$/.exec(name);
        if (match && !groups.has(match[1])) groups.set(match[1], { x, y });
      }
    const used: Record<string, MicroPlaqueText> = Object.fromEntries(
      [...groups.keys()].flatMap((name) =>
        name === 'doc'
          ? [
              [name, texts[name]],
              ['scroll', texts.scroll],
            ]
          : [[name, texts[name]]],
      ),
    );
    const plaques = addMicroPlaques(book, built.pal, used);
    const rows = Array.from({ length: level.map.height }, (_, y) => (y === 0 ? 'S' : ' ') + ' '.repeat(level.map.width - 1));
    const map = new CeremonyMap(book, rows);
    Object.assign(map.map, raw);
    map.start = [...level.map.start];
    map.exits.push(...level.map.exits);
    const hall = level.file === 'hall';
    const hallX = groups.get('hallBanner')?.x;
    for (let i = 0; i < raw.blocks.length; i++) {
      const name = names[raw.blocks[i]];
      let replacement = name;
      if (oldSign(name)) {
        const x = (i % 100) - ORIGIN;
        const y = Math.floor(i / 100) - ORIGIN;
        replacement = 'sky';
        // Restore the ceremony trim or facade behind the smaller hanging banner.
        if (hall && y === 4) replacement = 'valance';
        if (hall && y === 5) replacement = x % 2 ? 'bunting0' : 'bunting1';
        if (!hall && name.startsWith('sign.hallBanner.') && hallX !== undefined) replacement = [1, 3].includes(x - hallX) ? 'hallColumn' : 'hallWall';
      }
      raw.blocks[i] = book.n(replacement);
    }
    for (const [name, at] of groups) {
      const stack = name === 'doc' ? [plaques.doc, plaques.scroll] : [plaques[name]];
      const posted = used[name].post !== false;
      // The lower board is row 8 and its only post meets the floor at row 10.
      const y = posted ? 9 - stack.length : at.y;
      const target = {
        set(x: number, row: number, block: string) {
          const current = names[level.map.map.blocks[(row + ORIGIN) * 100 + x + ORIGIN]];
          if (!oldSign(current) && current !== 'sky') throw new Error(`${cfg.id}/${level.file}: plaque ${name} overlaps ${current} at ${x},${row}`);
          map.set(x, row, block);
        },
      };
      const x = name === 'helpers' && !diploma ? 7 : at.x;
      // The Doc Leo board is narrower; only the lower board carries their shared post.
      stack.forEach((plaque, i) => stampTiledSign(target, x, y + i, plaque, posted && i === stack.length - 1 ? 1 : 0));
    }
    return { ...level, book, map };
  });
  return { ...built, levels, book: levels.find((l) => l.file === 'hall')!.book };
}
