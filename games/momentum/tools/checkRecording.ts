// Checks the lessons shown before Escape in a Momentum title recording.
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { runHeadless } from '../../kit/cdDemos/headless';
import { ORIGIN } from '../../kit/starter/map';
import { diskFiles } from '../../kit/walkthrough';
import { L2 } from '../src/levels';

export async function checkRecording(recording: Uint8Array): Promise<void> {
  const files = diskFiles('momentum');
  const gam = [...files.names()].find((name) => name.endsWith('.gam'))!;
  const keys = parseRecording(recording);
  const escapeTick = keys.slice(0, -1).reduce((tick, key) => tick + key.delta, 0);
  const scenes: number[] = [];
  let entryScore = 0;
  let furthestGroundColumn = -1;
  let playedToEscape = false;
  await runHeadless(files, gam, {
    playback: recording,
    maxTicks: escapeTick + 1,
    onFrame(world, session) {
      if (session.rec.tick >= escapeTick && world.keydn[1]) playedToEscape = true;
      if (scenes.at(-1) !== 3) return;
      const { x, y } = world.chr;
      if (y[0] - ORIGIN === L2.ground - 1 && y[1] === 0) {
        furthestGroundColumn = Math.max(furthestGroundColumn, x[0] - ORIGIN);
      }
    },
    onSession(session) {
      session.onScene = (scene) => {
        if (scene === 3) entryScore = session.ci.score;
        scenes.push(scene);
      };
    },
  });
  if (scenes.join(' ') !== '2 3' || !playedToEscape) throw new Error('Expected scenes 2 3 through the recorded Escape');
  if (entryScore < 70) throw new Error(`Expected all seven glide coins, got ${entryScore} points`);
  if (furthestGroundColumn <= L2.pits[2][1]) throw new Error(`Expected a landing beyond the last gap; reached ground column ${furthestGroundColumn}`);
  console.log(`demoCheck ok: entered Run-Up with ${entryScore} points and reached ground column ${furthestGroundColumn}`);
}
