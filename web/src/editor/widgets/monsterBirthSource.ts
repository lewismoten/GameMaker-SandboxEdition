// Birth previews follow a background or character file's scene MON/MBL pair before unbound fallbacks.
import { ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { BLEN, MONBL, TRANSPARENT, parseBlocks, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { normalize, type GameFiles } from '../../project/files';
import type { Project } from '../core/project';

export interface BirthSource {
  id: string;
  label: string;
  mon: string;
  mbl: string;
}

export function monsterBirthSources(project: Pick<Project, 'game' | 'files'>, file: string, slot: 2 | 5 = 2): BirthSource[] {
  const out: BirthSource[] = [];
  const add = (mon: string, mbl: string, label: string) => {
    mon = normalize(mon);
    mbl = normalize(mbl);
    const id = `${mon}|${mbl}`;
    if (project.files.has(mon) && project.files.has(mbl) && !out.some((item) => item.id === id))
      out.push({ id, label: `${label} · ${mon.toUpperCase()} / ${mbl.toUpperCase()}`, mon, mbl });
  };
  let bound = false;
  for (const [i, scene] of project.game().scenes.entries()) {
    if (scene.gametype !== ADVTYPE || normalize(scene.files[slot]) !== normalize(file)) continue;
    bound = true;
    add(scene.files[3], scene.files[4], scene.desc.trim() || `Scene ${i}`);
  }
  if (bound) return out;
  const blockSets = project.files.byExtension('mbl');
  for (const mon of project.files.byExtension('mon')) {
    const paired = mon.replace(/\.mon$/i, '.mbl');
    const mbl = project.files.has(paired) ? paired : blockSets.length === 1 ? blockSets[0] : undefined;
    if (mbl) add(mon, mbl, 'Project monsters');
  }
  return out;
}

/** Pictures are indexed by monster number; a monster's first frame chooses its MBL picture. */
export function monsterBirthPictures(files: Pick<GameFiles, 'get'>, source: BirthSource): { pictures: Block[]; used: boolean[] } | undefined {
  try {
    const mon = files.get(source.mon),
      mbl = files.get(source.mbl);
    if (!mon || !mbl) return undefined;
    const monsters = parseMonsters(mon),
      blocks = parseBlocks(mbl, MONBL);
    const blank = { ...blocks[0], pixels: new Uint8Array(BLEN * BLEN).fill(TRANSPARENT) };
    return { pictures: monsters.map((monster) => blocks[monster.pic[0][0]] ?? blank), used: monsters.map((monster) => Boolean(monster.used)) };
  } catch {
    return undefined;
  }
}
