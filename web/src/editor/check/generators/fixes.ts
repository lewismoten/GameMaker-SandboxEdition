// The level check's one-click fixes: for a finding, the generator that helps (generators/*.ts)
// set up to change the project's files. Each writes ordinary Game-Maker data, and the panel
// keeps the files as they were so the fix can be undone.
import { BACKBL, MONBL, SOLTOP, parseBlocks, serializeBlocks } from '../../../formats/blocks';
import { serializeGame } from '../../../formats/game';
import { parseMap, serializeMap } from '../../../formats/map';
import { parseMonsters, serializeMonsters } from '../../../formats/monster';
import { scanName } from '../../../input/scancodes';
import type { Project } from '../../core/project';
import { gameKeyMap } from '../../keymap/keyMap';
import { blockCycle, skyColors, WAIT_TICKS } from '../checks/blockChecks';
import { mentions, gameText } from '../checks/gameChecks';
import { marchTicks, pictures } from '../checks/monsterChecks';
import type { Finding } from '../findings';
import { blockUse, scenesOf, topColors, type SceneData } from '../sceneData';
import { contrastColor, fillHazard, outline } from './blockArt';
import { airBlock, ladderBlock, ladderCells, landmarkBlocks, placeLandmarks } from './mapFixes';
import { findMazes } from '../checks/mazeCheck';

interface Fix {
  label: string;
  /** What it will do, for its button's tooltip. */
  detail: string;
  /** Files it may change (kept beforehand, for Undo). */
  files: string[];
  /** Makes the change; returns the files it changed. */
  apply(): string[];
}

const sceneFor = (project: Project, scene: number | undefined): SceneData | undefined =>
  scene === undefined ? undefined : scenesOf(project.game(), project.files).find((d) => d.scene === scene);

export function fixFor(f: Finding, project: Project): Fix | undefined {
  try {
    return make(f, project);
  } catch {
    return undefined;
  }
}

function make(f: Finding, project: Project): Fix | undefined {
  const files = project.files;
  const d = sceneFor(project, f.where.scene);
  switch (f.fix) {
    case 'fill-hazard': {
      const b = f.where.block;
      if (!d || !b?.file || !files.has(b.file)) return undefined;
      return {
        label: 'Stretch the art to fill the cell',
        detail: `Redraws block ${b.n} so its drawing covers all 20 × 20 pixels, as far as it hurts.`,
        files: [b.file],
        apply: () => {
          const bbl = parseBlocks(files.get(b.file)!, BACKBL);
          const px = fillHazard(bbl[b.n].pixels, skyColors(d));
          if (!px) return [];
          bbl[b.n].pixels = px;
          files.set(b.file, serializeBlocks(bbl));
          return [b.file];
        },
      };
    }
    case 'outline-monster': {
      const m = f.where.monster;
      const mblName = d?.names.mbl;
      if (!d || !m || !mblName || !files.has(mblName)) return undefined;
      const pics = pictures(d.mon[m.n]);
      const cell = f.where.cell ?? 0;
      const behind = topColors(d.bbl[d.map.blocks[cell]].pixels, 1)[0] ?? 0;
      const color = contrastColor(d.palette, behind);
      return {
        label: 'Outline it in a standout color',
        detail: `Adds a one-pixel rim in palette color ${color} round monster ${m.n}’s pictures (blocks ${pics.join(', ')}).`,
        files: [mblName],
        apply: () => {
          const mbl = parseBlocks(files.get(mblName)!, MONBL);
          for (const p of new Set(pics)) mbl[p].pixels = outline(mbl[p].pixels, color);
          files.set(mblName, serializeBlocks(mbl));
          return [mblName];
        },
      };
    }
    case 'no-soltop': {
      const m = f.where.monster;
      const mblName = d?.names.mbl;
      if (!d || !m || !mblName || !files.has(mblName)) return undefined;
      const pics = [...new Set(pictures(d.mon[m.n]))].filter((p) => d.mbl[p] && d.mbl[p].solid & SOLTOP && d.mbl[p].chHitPt < 0);
      if (!pics.length) return undefined;
      return {
        label: 'Leave out its solid top',
        detail: `Clears SOLTOP on monster ${m.n}’s hurting pictures (blocks ${pics.join(', ')}), keeping SOLBOT and the sides: the hero still stands on its back and is pushed off its sides.`,
        files: [mblName],
        apply: () => {
          const mbl = parseBlocks(files.get(mblName)!, MONBL);
          for (const p of pics) mbl[p].solid &= ~SOLTOP;
          files.set(mblName, serializeBlocks(mbl));
          return [mblName];
        },
      };
    }
    case 'ladder': {
      const mapName = d?.names.map;
      const bblName = d?.names.bbl;
      if (!d || !mapName || !bblName || f.where.cell === undefined) return undefined;
      // from the lowest stuck cell up
      const cells = f.where.cells ?? [f.where.cell];
      const low = cells.reduce((a, b) => (Math.floor(b / 100) > Math.floor(a / 100) ? b : a));
      const column = ladderCells(d.map.blocks, d.bbl, low);
      const use = blockUse(d.map);
      const rung = ladderBlock(d.bbl, use, airBlock(d.bbl, use));
      if (!column || !rung) return undefined;
      return {
        label: `Add a ladder (${column.length} blocks)`,
        detail: `A column of block ${rung.n}${rung.make ? ' (a new up-pulling ladder block)' : ''} from the bottom of the pit to the floor beside its rim.`,
        files: rung.make ? [mapName, bblName] : [mapName],
        apply: () => {
          const map = parseMap(files.get(mapName)!);
          for (const c of column) map.blocks[c] = rung.n;
          files.set(mapName, serializeMap(map));
          if (rung.make) {
            const bbl = parseBlocks(files.get(bblName)!, BACKBL);
            bbl[rung.n] = rung.make;
            files.set(bblName, serializeBlocks(bbl));
            return [mapName, bblName];
          }
          return [mapName];
        },
      };
    }
    case 'open-gap': {
      const mapName = d?.names.map;
      if (!d || !mapName || f.where.cell === undefined) return undefined;
      // the lock or wall beside the stuck area: the first solid cell next to it
      const cells = f.where.cells ?? [f.where.cell];
      const wall = cells.flatMap((c) => [c - 1, c + 1, c - 100]).find((c) => c >= 0 && c < 10000 && d.bbl[d.map.blocks[c]].solid === 15 && !cells.includes(c));
      if (wall === undefined) return undefined;
      const air = airBlock(d.bbl, blockUse(d.map));
      return {
        label: 'Open a one-block gap',
        detail: `Turns the wall at (${wall % 100}, ${Math.floor(wall / 100)}) into block ${air}, the scene’s plain air.`,
        files: [mapName],
        apply: () => {
          const map = parseMap(files.get(mapName)!);
          map.blocks[wall] = air;
          files.set(mapName, serializeMap(map));
          return [mapName];
        },
      };
    }
    case 'shorten-cycle': {
      if (f.where.block && d && files.has(f.where.block.file)) {
        const name = f.where.block.file;
        const n = f.where.block.n;
        return {
          label: 'Shorten the cycle to about 3 s',
          detail: `Scales block ${n}’s animation times so its shut part lasts about 3 seconds.`,
          files: [name],
          apply: () => {
            const bbl = parseBlocks(files.get(name)!, BACKBL);
            const cycle = blockCycle(bbl, n);
            const shut = cycle.filter((c) => bbl[c.n].solid || bbl[c.n].chHitPt < 0).reduce((s, c) => s + c.ticks, 0);
            const k = WAIT_TICKS / Math.max(1, shut);
            for (const c of cycle) bbl[c.n].ntime = Math.max(1, Math.round(bbl[c.n].ntime * k));
            files.set(name, serializeBlocks(bbl));
            return [name];
          },
        };
      }
      const m = f.where.monster;
      if (m && files.has(m.file))
        return {
          label: 'Speed the lift up to a 6 s round',
          detail: `Raises monster ${m.n}’s path speeds so a round takes about 6 seconds.`,
          files: [m.file],
          apply: () => {
            const mons = parseMonsters(files.get(m.file)!);
            const k = Math.ceil(marchTicks(mons[m.n]) / (WAIT_TICKS * 2));
            for (const c of mons[m.n].march[0]) if (c.pic) c.pic = Math.min(11, c.pic * k);
            files.set(m.file, serializeMonsters(mons));
            return [m.file];
          },
        };
      return undefined;
    }
    case 'key-sign': {
      const game = project.game();
      const keys = gameKeyMap(files).keys.filter((k) => ![72, 75, 77, 80].includes(k.scan) && !mentions(gameText(files), k.scan));
      if (!keys.length) return undefined;
      const current = game.scenes[0].files[6];
      const txt = current && /\.txt$/i.test(current) ? current : current ? undefined : project.freeName('keys', 'txt');
      if (!txt) return undefined;
      const lines = keys.map((k) => `  ${scanName(k.scan).padEnd(8)} ${k.uses.map((u) => u.action.title).join(', ')}`);
      return {
        label: current ? 'Add the keys to the instructions' : 'Make an instructions screen with the keys',
        detail: `Writes ${keys.length} key${keys.length === 1 ? '' : 's'} into ${txt}, the screen F1 and the menu show.`,
        files: current ? [txt] : [txt, project.gam],
        apply: () => {
          const before = files.get(txt) ? new TextDecoder('latin1').decode(files.get(txt)).replace(/\x1a[\s\S]*$/, '') : '';
          const text = `${before.replace(/\s*$/, '')}${before ? '\r\n\r\n' : ''}KEYS\r\n${lines.join('\r\n')}\r\n`;
          files.set(
            txt,
            Uint8Array.from(text, (c) => c.charCodeAt(0) & 0xff),
          );
          if (current) return [txt];
          game.scenes[0].files[6] = txt;
          files.set(project.gam, serializeGame(game));
          return [txt, project.gam];
        },
      };
    }
    case 'landmark': {
      const mapName = d?.names.map;
      if (!d || !mapName || f.where.cell === undefined) return undefined;
      const maze = findMazes(d.map.blocks, d.bbl).find((m) => m.cells.includes(f.where.cell!));
      if (!maze) return undefined;
      const marks = landmarkBlocks(d.map.blocks, d.bbl, new Set(maze.cells.map((c) => d.map.blocks[c])));
      const place = placeLandmarks(maze.junctions, marks);
      if (!marks.length || !place.length) return undefined;
      return {
        label: `Put ${place.length} landmarks at the crossroads`,
        detail: `Paints blocks ${[...new Set(place.map(([, b]) => b))].join(', ')} (already on this map) at crossroads at least 6 blocks apart.`,
        files: [mapName],
        apply: () => {
          const map = parseMap(files.get(mapName)!);
          for (const [c, b] of place) map.blocks[c] = b;
          files.set(mapName, serializeMap(map));
          return [mapName];
        },
      };
    }
    case 'spread-healing': {
      const scenes = scenesOf(project.game(), files);
      const half = scenes.slice(Math.ceil(scenes.length / 2));
      const early = new Set(scenes.slice(0, Math.ceil(scenes.length / 2)).map((s) => s.names.bbl));
      const sets = [...new Set(half.map((s) => s.names.bbl).filter((n): n is string => !!n && !early.has(n) && files.has(n)))];
      if (!sets.length) return undefined;
      return {
        label: 'Halve the healing in the second half',
        detail: `Halves the hit points every healing block gives in ${sets.join(', ')} (block sets only the later levels use).`,
        files: sets,
        apply: () => {
          for (const n of sets) {
            const bbl = parseBlocks(files.get(n)!, BACKBL);
            for (const b of bbl) if (b.chHitPt > 1) b.chHitPt = Math.ceil(b.chHitPt / 2);
            files.set(n, serializeBlocks(bbl));
          }
          return sets;
        },
      };
    }
    default:
      return undefined;
  }
}
