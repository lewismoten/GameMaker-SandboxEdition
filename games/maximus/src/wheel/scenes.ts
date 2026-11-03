// The Star Wheel's puzzle in printables.json names the scenes where the 1994 desk lays the wheel
// beside the monitor (the engine's scene numbers). This checks them against the built game: the
// pod bay, and the clerk's form its window leads to; and that each page scene shows its slide show
// and sends Max back to the pod bay, and each wrong hatch and the window really link to them.
import { readFileSync } from 'node:fs';
import type { Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { SCENE } from '../universe';
import { WHEEL_SCENES } from './wheel';

/** Throws when the box's wheel puzzle or the gate's scenes are not what the game builds. */
export function checkWheelScenes(game: Game, printables: string): void {
  const items = (JSON.parse(readFileSync(printables, 'utf8')) as { items: { kind: string; puzzles?: { scenes: number[] }[] }[] }).items;
  const puzzles = items.find((i) => i.kind === 'codewheel')?.puzzles ?? [];
  const want = [SCENE.home, WHEEL_SCENES.form].sort((a, b) => a - b).join();
  const got = [...(puzzles[0]?.scenes ?? [])].sort((a, b) => a - b).join();
  if (want !== got) throw new Error(`printables.json: the Star Wheel's puzzle should list scenes [${want}], not [${got}]`);
  const lists = ['clear.lst', 'wrong1.lst', 'wrong2.lst'];
  [WHEEL_SCENES.form, ...WHEEL_SCENES.wrong].forEach((n, k) => {
    const sc = game.scenes[n];
    if (sc.files[9] !== lists[k]) throw new Error(`scene ${n} should show ${lists[k]}, not "${sc.files[9]}"`);
    if (sc.links[0].toScene !== SCENE.home) throw new Error(`scene ${n} does not lead back to the pod bay`);
    if (!game.scenes[SCENE.home].links.some((l) => l.toScene === n)) throw new Error(`nothing in the pod bay leads to scene ${n}`);
  });
}
