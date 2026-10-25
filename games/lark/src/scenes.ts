// The scene builder every chapter adds itself to: its places (a scene each: map, palette, block
// set, monsters, hero, song, intro picture) and the links between them, with helpers for the
// game's three kinds of link: a door (walk onto a cell, arrive at another), a talk (walk onto a
// friend: a pass scene whose intro is the conversation, which gives its gift and comes straight
// back) and a pass (a chapter card or a cartoon on the way somewhere).
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game, type Link, type Scene } from '../../../web/src/formats/game';
import type { Light } from './art/pal';
import type { Bestiary, BlockSet } from './blocks/sets';
import { giftCell, type Gift } from './levels/pass';
import type { Stamped } from './levels/stamp';
import { TITLE } from './screens/text';

export type Cell = { x: number; y: number };

export interface Place {
  scene: number;
  desc: string;
  /** Base name of its .pal, .map and (if it has monsters) .mon. */
  file: string;
  light: Light;
  /** Its background block set's name (<set>.bbl). */
  set: string;
  hero: 'hero' | 'side';
  song: string;
  stamped: Stamped;
  mons?: Bestiary;
  intro?: string;
}

export const below = (p: Cell): Cell => ({ x: p.x, y: p.y + 1 });

export class Scenes {
  readonly places: Place[] = [];
  private readonly links: { scene: number; link: Link }[] = [];

  constructor(
    readonly sets: Record<string, BlockSet>,
    readonly mb: BlockSet,
    readonly pass: Stamped,
  ) {}

  add(p: Place): Place {
    if (this.places.some((q) => q.scene === p.scene)) throw new Error(`scene ${p.scene} twice`);
    if (!this.sets[p.set]) throw new Error(`${p.desc}: no block set ${p.set}`);
    this.places.push(p);
    return p;
  }

  /** A one-tick scene on the pass map, its intro the point. */
  passPlace(scene: number, desc: string, song: string, intro: string): Place {
    return this.add({ scene, desc, file: 'pass', light: 'black', set: 'town', hero: 'hero', song, stamped: this.pass, intro });
  }

  /** Walking onto `from` in `scene` goes to `toScene`, arriving at `to`. */
  door(scene: number, from: Cell, toScene: number, to: Cell): void {
    this.links.push({ scene, link: { toScene, from, to } });
  }

  /** A talk: walking onto `at` in `scene` goes to the pass scene `talkScene`, which gives `gift` and comes back to `back`. */
  talk(scene: number, at: Cell, talkScene: number, gift: Gift, back: Cell): void {
    const cell = giftCell(this.pass, gift);
    this.door(scene, at, talkScene, cell);
    this.door(talkScene, cell, scene, back);
  }

  /** A pass scene's way on (its intro shown first). */
  passOn(passScene: number, toScene: number, to: Cell, gift: Gift = 'none'): void {
    this.door(passScene, giftCell(this.pass, gift), toScene, to);
  }

  /** The cell a pass scene is entered on. */
  passCell(gift: Gift = 'none'): Cell {
    return giftCell(this.pass, gift);
  }

  /** The .GAM: the title and end scenes, then a scene for every place, numbered as they say. */
  game(start: { scene: number; at: Cell }): Game {
    const game = newGame(TITLE);
    const [title, end] = game.scenes;
    title.files = [
      'title.lst',
      'title.cmf',
      'menu.gif',
      'menu.cmf',
      'story.lst',
      'story.cmf',
      'help.lst',
      'credits.lst',
      'scores.gif',
      'loadgame.gif',
      'savegame.gif',
      'demo.rec',
      ...new Array(8).fill(''),
    ];
    end.desc = 'The Road Goes On';
    end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];
    const top = Math.max(...this.places.map((p) => p.scene));
    for (let s = 2; s <= top; s++) {
      const p = this.places.find((q) => q.scene === s);
      if (!p) throw new Error(`no place for scene ${s}`);
      const sc: Scene = emptyScene(ADVTYPE);
      sc.desc = p.desc.slice(0, 19);
      sc.pos = { x: 20 + ((s - 2) % 6) * 48, y: 30 + (Math.floor((s - 2) / 6) % 4) * 40 };
      sc.files = [
        `${p.file}.pal`,
        `${p.file}.map`,
        `${p.set}.bbl`,
        p.mons ? `${p.file}.mon` : '',
        p.mons ? 'lark.mbl' : '',
        `${p.hero}.chr`,
        `${p.hero}.cbl`,
        'lark.snd',
        `${p.song}.cmf`,
        p.intro ?? '',
        '',
        ...new Array(9).fill(''),
      ];
      sc.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
      game.scenes.push(sc);
    }
    const used = new Map<number, number>();
    for (const { scene, link } of this.links) {
      const i = used.get(scene) ?? 0;
      if (i >= MAXSCENELINKS) throw new Error(`scene ${scene} has too many links`);
      used.set(scene, i + 1);
      game.scenes[scene].links[i] = link;
    }
    title.links[0] = { toScene: start.scene, from: { x: 0, y: 0 }, to: start.at };
    return game;
  }
}
