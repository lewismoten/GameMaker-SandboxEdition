// Writes games/sleuth/walkthrough.json: the bot plays the whole case on the built disk
// (tools/whole.ts, every question asked, the right accusation, no fireplace), one key segment
// for the whole run as the simulator plays it, and games/kit/walkthrough.ts checks it on the
// real engine.
//   cd web && npx vite-node ../games/sleuth/tools/walkthrough.ts
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { loadDisk, playWhole, sceneIndex } from './whole';

const ix = sceneIndex();
const bot = await playWhole(loadDisk());
const s = bot.sim;
const first = s.trail[0];
await writeWalkthrough('sleuth', {
  // GameSim draws every scene's monsters from one rng(7)
  rand: { seed: 7, per: 'game' },
  // the case files are dense: give each text page time to be read
  hold: 15,
  segments: [{ scene: first, keys: encodeKeys(s.keys) }],
  chapters: [
    { scene: ix.act1, title: 'Act One: The Paragon Theatre' },
    { scene: ix.gr1a, title: 'The Green Room, Midnight' },
    { scene: ix.act2, title: 'Act Two: The Theatre at Night' },
    { scene: ix.gr2a, title: 'The Green Room, 2 AM' },
    { scene: ix.acca, title: 'Dawn: The Accusation' },
  ],
});
