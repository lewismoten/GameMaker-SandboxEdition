// The level check's exits and music, from the scene file alone: a door drawn like the scene's
// links that leads nowhere (the same block where a link is, elsewhere with none), a level with
// no link out at all, and a level that plays in silence (no song, or a song PLAYGAME refuses
// because it isn't at the 146 ticks a second it needs, audio/cmfLoad.ts).
import { parseCmf } from '../../../formats/cmf';
import { MLEN } from '../../../formats/map';
import { NOSCENE, type Game } from '../../../formats/game';
import { at, type Finding } from '../findings';
import { blockUse, type SceneData } from '../sceneData';
import type { FileSource } from '../sim';

/** A block used this many times beside its links is the level's ground, not a door. */
const GROUND = 3;

/** Blocks drawn at a link (and the block above it: a door is two tall) that also stand where no link is. */
export function fakeExits(d: SceneData): Finding[] {
  if (!d.links.length) return [];
  const linkCells = new Set(d.links);
  const near = (c: number) => [c, c - MLEN, c + MLEN, c - 1, c + 1].some((n) => linkCells.has(n));
  const doors = new Set<number>();
  for (const c of d.links) doors.add(d.map.blocks[c]);
  const use = blockUse(d.map);
  const out: Finding[] = [];
  for (const n of doors) {
    const b = d.bbl[n];
    // open air or plain ground with a link on it isn't drawn as a door
    if (!b || use[n] > d.links.length * GROUND + 2 || !b.pixels.some((p) => p !== 255)) continue;
    const fake: number[] = [];
    d.map.blocks.forEach((v, i) => v === n && !near(i) && fake.push(i));
    if (!fake.length) continue;
    out.push({
      check: 'fake-exit',
      // a door drawn twice, once as scenery, is common and often fine: a note, not a warning
      severity: 'info',
      title: `Block ${n} is drawn where a link is, and ${fake.length === 1 ? 'once' : `${fake.length} times`} where none is, first at ${at(fake[0])}`,
      detail:
        'It looks like a way out but leads nowhere, and players who find it shut stop trusting every door. Give the dead ones a look of their own (boarded up, dark), or make them links.',
      where: { scene: d.scene, map: d.names.map, cell: fake[0], cells: fake, block: { file: d.names.bbl ?? '', n } },
    });
  }
  return out;
}

/** A level with no link to another scene: nobody can finish it. */
export function noWayOut(d: SceneData, game: Game): Finding[] {
  if (game.scenes[d.scene]?.links.some((l) => l.toScene !== NOSCENE)) return [];
  return [
    {
      check: 'link-unreached',
      severity: 'error',
      title: `${d.name} has no link out`,
      detail: 'Touching a link is the only way to leave a level besides losing. Add a link to the next scene or to the game won scene.',
      where: { scene: d.scene, map: d.names.map },
    },
  ];
}

/** A level with no song, or a song DOS won't play. */
export function music(d: SceneData, game: Game, files: FileSource): Finding[] {
  const song = game.scenes[d.scene]?.files[8];
  if (!song)
    return [
      {
        check: 'music',
        severity: 'info',
        title: `${d.name} has no song`,
        detail: 'A level with no song plays in silence (a blank slot stops the music; it doesn’t keep the last level’s). Is the quiet meant?',
        where: { scene: d.scene },
      },
    ];
  const bytes = files.get(song);
  if (!bytes)
    return [
      {
        check: 'music',
        severity: 'warning',
        title: `${d.name}’s song, ${song}, isn’t in the game`,
        detail: /\./.test(song)
          ? 'PLAYGAME opens the song by the name the scene gives it, so this level plays in silence. Add the file, or choose another song.'
          : 'PLAYGAME opens the song by exactly the name the scene gives it, and adds no .CMF, so this level plays in silence. Name it with its extension.',
        where: { scene: d.scene, file: song },
      },
    ];
  let clock: number;
  try {
    clock = parseCmf(bytes).clockTicks;
  } catch {
    return [];
  }
  if (clock === 146) return [];
  return [
    {
      check: 'music',
      severity: 'warning',
      title: `${song} runs at ${clock} ticks a second, so PLAYGAME won’t play it`,
      detail:
        'Game-Maker plays only songs at 146 ticks a second, so this level is silent in DOS. Convert the song in the song editor, or save it again from the Song maker.',
      where: { scene: d.scene, file: song },
    },
  ];
}
