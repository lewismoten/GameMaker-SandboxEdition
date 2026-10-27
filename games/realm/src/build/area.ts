// A map shared by two towns (or a dungeon): its block set, map, monsters and palette, the
// scenes that play it (each with its own arrival spot), every conversation in it and the
// pass-through scenes that play them.
import { serializeBlocks, type Block } from '../../../../web/src/formats/blocks';
import { serializeMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import { serializeMonsters } from '../../../../web/src/formats/monster';
import { serializePalette } from '../../../../web/src/formats/palette';
import type { BlockBook } from '../blocks/book';
import type { MonBook } from '../characters/monbook';
import type { Plan, Pt } from '../levels/plan';
import { giftCell, talkFiles, talkScene, type Talk } from '../levels/talk';
import { TALK } from '../levels/script';
import type { SceneSpec, LinkSpec } from '../game';
import type { AreaFile } from './world';
import { noteWays } from './walkPaths';

interface AreaScene {
  id: string;
  desc: string;
  cmf?: string;
  intro?: string;
  /** Which of the plan's links belong to this scene (by where they start). */
  owns: (at: Pt) => boolean;
  /** Links out of the map (to the world...). */
  extra?: LinkSpec[];
}

interface Area {
  files: AreaFile[];
  scenes: SceneSpec[];
  map: GameMap;
  blocks: Block[];
  mons: MonBook;
}

export function buildArea(o: {
  name: string;
  plan: Plan;
  book: BlockBook;
  mons: MonBook;
  layers: string[];
  base: (x: number, y: number) => string;
  scenes: AreaScene[];
  fullVariants?: Record<string, number>;
  /** The monster block set (default PEOPLE.MBL). */
  mbl?: string;
}): Area {
  const { plan, book, mons } = o;
  const map = plan.build(book, { layers: o.layers, base: o.base, fullVariants: o.fullVariants });
  const blocks = book.finish();
  noteWays(`${o.name}.bbl`, book);
  let slot = 0;
  for (const n of plan.npcs) map.monsters[slot++] = { monnum: n.mon, status: 0, xtra: 0, curx: n.at[0], cury: n.at[1], extra: 0 };
  reindexMonsters(map);
  const talks = new Map<string, Talk>(Object.values(TALK).map((t) => [t.id, t]));
  const files: AreaFile[] = [
    { name: `${o.name}.bbl`, bytes: serializeBlocks(blocks) },
    { name: `${o.name}.pal`, bytes: serializePalette(book.pal!.vga) },
    { name: `${o.name}.map`, bytes: serializeMap(map) },
  ];
  const scenes: SceneSpec[] = [];
  const done = new Set<string>();
  for (const sc of o.scenes) {
    const links: LinkSpec[] = [];
    for (const l of plan.links) {
      if (!sc.owns(l.from)) continue;
      const talk = talks.get(l.to);
      if (talk) {
        links.push({ from: l.from, to: talk.id, at: giftCell(talk.gift ?? 'none') });
        if (!done.has(talk.id)) {
          done.add(talk.id);
          // back where Pip stood: the npc's back spot, else one block below the link
          const npc = plan.npcs.find((n) => n.talk?.id === talk.id && n.at[0] === l.from[0] && n.at[1] === l.from[1]);
          const back = npc?.back ?? (l.at[0] || l.at[1] ? l.at : [l.from[0], l.from[1] + 1]);
          files.push(...talkFiles(talk));
          scenes.push(talkScene(talk, sc.id, back as Pt));
        }
      } else links.push(l);
    }
    links.push(...(sc.extra ?? []));
    scenes.unshift({
      id: sc.id,
      desc: sc.desc,
      files: {
        pal: `${o.name}.pal`,
        map: `${o.name}.map`,
        bbl: `${o.name}.bbl`,
        mon: `${o.name}.mon`,
        mbl: o.mbl ?? 'people.mbl',
        cmf: sc.cmf,
        intro: sc.intro,
      },
      links,
    });
  }
  files.push({ name: `${o.name}.mon`, bytes: serializeMonsters(mons.finish()) });
  return { files, scenes, map, blocks, mons };
}
