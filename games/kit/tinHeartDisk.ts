// The tin hearts on the built disks (see TIN-HEARTS.md): every game's about.json, where its
// heart is on its disk, whether the block there really is the heart, and the real engine's
// touch run headless on it. Used by tinHearts.ts (the command) and the web's tests.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDisk } from './gameSim';
import { looksLikeTinHeart } from './tinHeart';
import { loadScene } from '../../web/src/engine/scene';
import { checkTouch } from '../../web/src/engine/touch';
import { BACKBL, parseBlocks } from '../../web/src/formats/blocks';
import { parseGame, type Game } from '../../web/src/formats/game';
import { MLEN, parseMap } from '../../web/src/formats/map';
import { isHeartAt, type AboutForHearts, type HeartPlace } from '../../web/src/tinHearts/manifest';

const here = dirname(fileURLToPath(import.meta.url));
export const gamesDir = join(here, '..');
export const manifestPath = join(here, '../../web/src/tinHearts/hearts.json');

/** Every game's about.json, by id. */
export function readAbouts(): Record<string, AboutForHearts> {
  const out: Record<string, AboutForHearts> = {};
  for (const id of readdirSync(gamesDir).sort()) {
    const p = join(gamesDir, id, 'about.json');
    if (existsSync(p)) out[id] = JSON.parse(readFileSync(p, 'utf8'));
  }
  return out;
}

/** A game's built disk and its .gam. */
export function gameDisk(id: string): { disk: Map<string, Uint8Array>; game: Game } {
  const disk = readDisk(join(gamesDir, id, 'disk'));
  const gam = [...disk.keys()].find((n) => n.endsWith('.gam'));
  if (!gam) throw new Error(`games/${id}/disk has no .gam`);
  return { disk, game: parseGame(disk.get(gam)!) };
}

/** The scenes that play a map file, with their block set. */
function scenesOf(game: Game, map: string): { scene: number; bbl?: string }[] {
  return game.scenes.flatMap((s, scene) => (s.files[1]?.toLowerCase() === map ? [{ scene, bbl: s.files[2]?.toLowerCase() || undefined }] : []));
}

/**
 * What is wrong with a declared heart on the disk, or [] when it is right: some scene plays the
 * map, the block at the place shows the tin heart, gives points and changes when touched.
 */
export function heartProblems(id: string, place: HeartPlace): string[] {
  const { disk, game } = gameDisk(id);
  const mapBytes = disk.get(place.map);
  if (!mapBytes) return [`${place.map} is not on the disk`];
  const scenes = scenesOf(game, place.map);
  if (!scenes.length) return [`no scene plays ${place.map}`];
  const b = parseMap(mapBytes).blocks[place.at[1] * MLEN + place.at[0]];
  const problems: string[] = [];
  for (const s of scenes) {
    const bbl = s.bbl && disk.get(s.bbl);
    if (!bbl) continue; // a scene that keeps the last level's blocks
    const blk = parseBlocks(bbl, BACKBL)[b];
    const where = `scene ${s.scene} (${s.bbl}), ${place.map} at ${place.at.join(',')}: block ${b}`;
    if (!blk || !looksLikeTinHeart(blk.pixels)) problems.push(`${where} does not show the tin heart`);
    else if (blk.touchBl === b && !blk.obj) problems.push(`${where} never changes when touched (give it a touch block)`);
    else if (blk.scorePts <= 0) problems.push(`${where} gives no points`);
    else return [];
  }
  return problems.length ? problems : [`no scene playing ${place.map} has its own block set`];
}

/**
 * Plays the touch on the real engine: loads the scene as PLAYGAME would, stands the hero on the
 * heart's cell and runs CheckTouch, with the web's hook listening. True when the hook reported
 * the touch at the heart's place and the cell changed.
 */
export function touchHeadless(id: string, place: HeartPlace): boolean {
  const { disk, game } = gameDisk(id);
  for (const { scene } of scenesOf(game, place.map)) {
    let heard = false;
    const s = {
      game,
      rand: () => () => 0.5,
      m: { files: { get: (n: string) => disk.get(n.toLowerCase()) } },
      onTouched: (sc: number, x: number, y: number) => void (heard ||= isHeartAt(place, game.scenes[sc].files[1], x, y)),
    };
    const loaded = loadScene(s, scene);
    if (Array.isArray(loaded)) continue;
    const w = loaded.world;
    const [x, y] = place.at;
    const before = w.map[y * MLEN + x];
    w.blkmap = new Uint8Array(256).map((_, i) => i);
    w.chr.x = [x, 0];
    w.chr.y = [y, 0];
    w.mx = Math.max(0, x - 5);
    w.my = Math.max(0, y - 4);
    w.scroll.nx = w.scroll.ny = 0;
    w.ci.topthere = false;
    checkTouch(w);
    if (heard && w.map[y * MLEN + x] !== before) return true;
  }
  return false;
}

/** Map cells on a game's disk whose block shows the tin heart, as about.json entries. */
export function findHearts(id: string): { scene: number; place: HeartPlace; block: number }[] {
  const { disk, game } = gameDisk(id);
  const out: { scene: number; place: HeartPlace; block: number }[] = [];
  const seen = new Set<string>();
  game.scenes.forEach((s, scene) => {
    const map = s.files[1]?.toLowerCase();
    const bbl = s.files[2]?.toLowerCase();
    if (!map || !bbl || !disk.get(map) || !disk.get(bbl)) return;
    const blocks = parseBlocks(disk.get(bbl)!, BACKBL);
    parseMap(disk.get(map)!).blocks.forEach((b, c) => {
      const key = `${map}:${c}`;
      if (seen.has(key) || !blocks[b] || !looksLikeTinHeart(blocks[b].pixels)) return;
      seen.add(key);
      out.push({ scene, place: { map, at: [c % MLEN, Math.floor(c / MLEN)] }, block: b });
    });
  });
  return out;
}
