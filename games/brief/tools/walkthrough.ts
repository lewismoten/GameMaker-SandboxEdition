// Writes games/brief/walkthrough.json: the bot plays the whole game as check.ts does
// (tools/play.ts: chapter by chapter, every wing and book, each chapter's stamp desk past the
// Reserve Stacks' gates, the thirty-third book),
// one key segment each time play enters a scene, and games/kit/walkthrough.ts checks the
// whole run on the real engine (title, story, the library, the ending, the credits).
//   cd web && npx vite-node ../games/brief/tools/walkthrough.ts
import { sceneIds } from '../src/game';
import { WINGS } from '../src/stories';
import { CHAPTERS } from '../src/chapters';
import { encodeKeys, keysAt, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { playThrough } from './play';

const { bot } = await playThrough(undefined, false);
const id = sceneIds();
// The bot's Sim seeds every scene's monsters with 1, as the walkthrough does (rand below).
// A key the bot pressed at tick t of a scene (t ticks already played) is pending on tick t + 1.
const segments: WalkSegment[] = bot.entries.map((e, i) => {
  const keys = bot.keys.slice(e.key, bot.entries[i + 1]?.key ?? bot.keys.length);
  return { scene: e.scene, keys: encodeKeys(keysAt(keys.map((k) => ({ tick: k.tick - e.base + 1, key: k.key })))) };
});
const chapters: WalkChapterMark[] = [
  ...CHAPTERS.flatMap((ch, k) => [
    ...ch.wings.map((i) => ({ scene: id.hall(i), title: `Chapter ${ch.n}: ${WINGS[i].name}` })),
    ...(k < CHAPTERS.length - 1 ? [{ scene: id.chapterDone(k), title: `Chapter ${ch.n} done` }] : []),
  ]),
  { scene: id.card33, title: 'The thirty-third book' },
];
const r = await writeWalkthrough('brief', { rand: { seed: 1, per: 'scene' }, segments, chapters });
// The engine must enter the scenes just as the bot did.
const want = [...segments.map((s) => s.scene), 1].join(' ');
if (r.scenes.join(' ') !== want || r.keysLeft) throw new Error(`the engine went ${r.scenes.join(' ')} (the bot ${want}), ${r.keysLeft} keys unplayed`);
