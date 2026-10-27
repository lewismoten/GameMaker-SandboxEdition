// Node only (shotFrames.ts, shotFrames.test.ts): which games' pictures ask for gameplay frames
// (src/gfx/shotFrame.ts), and each frame drawn as the site's PNG by replaying the game's
// walkthrough on the real engine (src/walkthrough/frames.ts). Secret games are never listed
// (their boxes draw map views), so no file outside their folders names them.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { GameFiles } from '../src/project/files';
import { replayFrames } from '../src/walkthrough/frames';
import { framePath, wantedFrames, type WantedFrame } from '../src/gfx/shotFrame';
import type { Walkthrough } from '../src/walkthrough/format';
import { encodeIndexedPng } from './gameShots';
import { readDisk } from './levelViewsScan';

export const gamesDir = resolve(__dirname, '../../games');

export interface FrameGame {
  id: string;
  wants: WantedFrame[];
}

/** The games whose pictures ask for frames (none secret), or only `ids`. */
export function frameGames(ids: readonly string[] = []): FrameGame[] {
  return readdirSync(gamesDir)
    .filter((id) => existsSync(join(gamesDir, id, 'about.json')) && (!ids.length || ids.includes(id)))
    .flatMap((id) => {
      const about = JSON.parse(readFileSync(join(gamesDir, id, 'about.json'), 'utf8')) as { secret?: boolean; box?: { shots?: unknown[][] } };
      if (about.secret) return [];
      const manualFile = join(gamesDir, id, 'manual.json');
      const pages = existsSync(manualFile) ? ((JSON.parse(readFileSync(manualFile, 'utf8')) as { pages?: { html: string }[] }).pages ?? []) : [];
      const wants = wantedFrames(
        about.box,
        pages.map((p) => p.html),
      );
      return wants.length ? [{ id, wants }] : [];
    });
}

/** A game's frames as PNGs by site path (frames/…): undefined for one its walkthrough never reaches. */
export async function drawFrames(g: FrameGame): Promise<Map<string, Uint8Array | undefined>> {
  const dir = join(gamesDir, g.id);
  const disk = readDisk(join(dir, 'disk'));
  if (!disk) throw new Error(`${g.id}: no disk`);
  const walk = JSON.parse(readFileSync(join(dir, 'walkthrough.json'), 'utf8')) as Walkthrough;
  const files = new GameFiles();
  for (const [n, b] of disk.files) files.set(n, b);
  const gam = [...disk.files.keys()].find((n) => n.endsWith('.gam'))!;
  const pics = await replayFrames(disk.game, files, gam, walk, g.wants);
  return new Map(
    g.wants.map((f) => {
      const pic = pics.get(f);
      return [framePath(g.id, f), pic && encodeIndexedPng(pic)];
    }),
  );
}
