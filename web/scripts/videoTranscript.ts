// Turns a Library video's YouTube automatic captions (the rolling .en-orig.vtt that yt-dlp
// saves) into its readable transcript, public/videos/<id>.transcript.json: [{ t, text }], one
// paragraph of about 30 to 60 seconds each, t its start in whole seconds. The rolling repeats go,
// and the names the captions mishear are spelled right (FIXES); nothing else Lewis said changes.
// A sentence naming a secret game is left out (and printed). Run from web/:
//   npx vite-node scripts/videoTranscript.ts <path>/<id>.en-orig.vtt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

/** Paragraphs end at a sentence once this long, and anywhere once MAX long (seconds). */
const MIN = 30;
const MAX = 60;

/** The names the captions get wrong, and how they are spelled. */
const FIXES: [RegExp, string][] = [
  [/\b[Gg]ame[ -]?[Mm]aker\b/g, 'Game-Maker'],
  // the other company's GameMaker keeps its own spelling
  [/\bbrand of of Game-Maker\b/g, 'brand of of GameMaker'],
  [/\b(Gwen|Gwyn)\b/g, 'Gwinn'],
  [/\b(Dr\.?|doc) Leo\b/gi, 'Doc Leo'],
  [/\bthe Chez\b/gi, 'THE CHEZ'],
  [/\bcity car\b/gi, 'CitiCar'],
  [/\bturbo button\b/gi, 'TURBO BUTTON'],
  [/\bsound ?blaster\b/gi, 'Sound Blaster'],
  [/\bsound ?b(oa|oo)ster(s?)\b/gi, 'Sound Boaster$2'],
  [/\bvirus ?blaster\b/gi, 'Virus Blaster'],
  [/\bmaximus\b/gi, 'Maximus'],
  [/\bkeep it brief\b[!.]*/gi, 'KEEP IT BRIEF!'],
  [/\bsandbox edition\b/gi, 'Sandbox Edition'],
  [/\bsandbox scoop/gi, 'Sandbox Scoop'],
  [/\bmystery robot Joe\b/gi, 'Mystery Robot Joe'],
  // the games' titles (games/*/about.json)
  [/\bin the year 2000\b/gi, 'In the Year 2000'],
  [/\bsnowbound\b/gi, 'Snowbound'],
  [/\bdepth perception\b/gi, 'Depth Perception'],
  [/\bsand ?castle knight\b/gi, 'Sandcastle Knight'],
  [/\bquest for the round to it\b/gi, 'Quest for the Round Tuit'],
  [/\bround to it\b/gi, 'round tuit'],
  [/\b(the )?(bard of bizarre|bart bazaar|bartazar|ba bazaar|ba bazar)\b/gi, 'the Bard of Bizarre'],
  [/\bBizaar\b/g, 'Bizarre'],
  [/\bthird goat from the left\b/gi, 'Third Goat from the Left'],
  [/\bShakespeare('s| in| and) sweatpants\b/gi, 'Shakespeare in Sweatpants'],
  [/\bfly name(d)? Carl\b/gi, 'Fly Named Carl'],
  [/\bgreat dairy reckoning of 3:17 a\.m\./gi, 'Great Dairy Reckoning of 3:17 A.M.'],
  [/\bI screamed,? she smirked\b/gi, 'I Screamed, She Smirked'],
  [/\bcleanse me,? (aloffa|a loofah|o loofah),? but leave my soul\b/gi, 'Cleanse Me, O Loofah, But Leave My Soul'],
  [/\bVinnie Vidy Rizzy,?/g, 'Veni, Vidi, Risi!'],
  [/\bBrother Cattle\b/g, 'Brother Camel'],
];

const ROOT = resolve(__dirname, '../..');

/** Each secret game's id and title, as words to look for. */
function secretWords(): string[] {
  const words: string[] = [];
  for (const id of readdirSync(join(ROOT, 'games'))) {
    let about: { secret?: boolean; title?: string };
    try {
      about = JSON.parse(readFileSync(join(ROOT, 'games', id, 'about.json'), 'utf8')) as typeof about;
    } catch {
      continue;
    }
    if (about.secret) words.push(id, ...(about.title ? [about.title, about.title.split(':')[0]] : []));
  }
  return words;
}

function seconds(stamp: string): number {
  const [h, m, s] = stamp.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

interface Word {
  t: number;
  text: string;
}

/** The captions' words, each once, with when it is said. */
function words(vtt: string): Word[] {
  const out: Word[] = [];
  let last = '';
  for (const cue of vtt.replace(/\r/g, '').split(/\n\n+/)) {
    const lines = cue.split('\n');
    const at = lines.findIndex((l) => l.includes('-->'));
    if (at < 0) continue;
    const line = lines[lines.length - 1].trim();
    const plain = line.replace(/<[^>]*>/g, '').trim();
    if (!plain || plain === last || lines.length - at < 2) continue;
    last = plain;
    let t = seconds(lines[at].split(' ')[0]);
    // "word<00:00:01.439><c> next</c>": a word's time comes before it
    for (const part of line.split(/(<\d\d:\d\d:\d\d\.\d+>)/)) {
      const stamp = /^<(\d[^>]*)>$/.exec(part);
      if (stamp) {
        t = seconds(stamp[1]);
        continue;
      }
      for (const w of part.replace(/<[^>]*>/g, '').split(/\s+/)) if (w) out.push({ t, text: w });
    }
  }
  return out;
}

function paragraphs(all: Word[]): { t: number; text: string }[] {
  const out: { t: number; text: string }[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) out.push({ t: Math.floor(cur[0].t), text: cur.map((w) => w.text).join(' ') });
    cur = [];
  };
  for (const w of all) {
    if (cur.length && w.t - cur[0].t >= MAX) flush();
    cur.push(w);
    if (w.t - cur[0].t >= MIN && /[.?!]$/.test(w.text)) flush();
  }
  flush();
  return out;
}

function tidy(text: string, secrets: string[]): string {
  let s = text;
  for (const [find, put] of FIXES) s = s.replace(find, put);
  s = s.replace(/^./, (c) => c.toUpperCase());
  const named = (sentence: string) => secrets.some((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(sentence));
  const kept = s.split(/(?<=[.?!])\s+/).filter((sentence) => {
    if (!named(sentence)) return true;
    console.log(`left out (names a secret game): ${sentence}`);
    return false;
  });
  return kept.join(' ');
}

const path = process.argv[2];
if (!path) throw new Error('Give the .vtt path: npx vite-node scripts/videoTranscript.ts <id>.en-orig.vtt');
const id = basename(path).split('.')[0];
const secrets = secretWords();
const out = paragraphs(words(readFileSync(path, 'utf8')))
  .map((p) => ({ t: p.t, text: tidy(p.text, secrets) }))
  .filter((p) => p.text);
const file = join(__dirname, '../public/videos', `${id}.transcript.json`);
writeFileSync(file, `${JSON.stringify(out)}\n`);
console.log(`${file}: ${out.length} paragraphs`);
