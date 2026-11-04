// Which recorded clips (public/phone/voice/<caller>/<id>.ogg) say a phone line. Each fixed line is
// cut at sentence ends into clips (one per sentence, so a caption piece plays the clips of its
// sentences). The two lines that carry numbers are spliced, as real talking clocks are: the time
// (hour, minute and seconds clips) and the hint line's pretend bill (dollars and cents clips, up to
// $99.99; above that the sentence has no clips and the caller falls back to speech). Pure, no audio.
import { BILL_LEAD, SCRIPT, TIME_LEAD } from './phoneScript';

/** A clip's path under the voice folder, without ".ogg": "mom/mom-work-2". */
export type ClipPath = string;

/** Sentences of `text`; a fragment with no words ("…") stays with the sentence before it. */
export function sentences(text: string): string[] {
  const out: string[] = [];
  for (const s of text.split(/(?<=[.!?…])\s+/).filter(Boolean)) {
    if (out.length && !/[\p{L}\p{N}]/u.test(s)) out[out.length - 1] += ` ${s}`;
    else out.push(s);
  }
  return out;
}

export interface Part {
  cast: string;
  id: string;
  /** The words of the clip, as written. */
  text: string;
}

/** Every sentence of the fixed lines as a clip (a sentence two callers share is told apart by caller). */
export const SENTENCE_PARTS: Part[] = [];
const bySentence = new Map<string, Part>();
for (const line of SCRIPT) {
  const list = sentences(line.text);
  list.forEach((text, i) => {
    const key = `${line.voice}|${text}`;
    if (bySentence.has(key)) return;
    const part = { cast: line.voice, id: list.length === 1 ? line.id : `${line.id}-${i + 1}`, text };
    bySentence.set(key, part);
    SENTENCE_PARTS.push(part);
  });
}

const path = (p: Pick<Part, 'cast' | 'id'>): ClipPath => `${p.cast}/${p.id}`;

// the time of day, said by the time lady: "At the tone, the time will be" + hour + minute + seconds
export const TIME_TONE = 'At the tone, the time will be';
export const tlId = {
  tone: 'tl-tone',
  n: (n: number) => `tl-n${n}`,
  oh: (n: number) => `tl-oh-${n}`,
  oclock: 'tl-oclock',
  sec: (n: number) => `tl-sec-${n}`,
  exactly: 'tl-exactly',
};
const TIME = /^At the tone, the time will be (\d+) (?:(o’clock)|oh (\d)|(\d+))(?: and (\d+) seconds|(, exactly))\.$/;

function timeClips(s: string): ClipPath[] | undefined {
  const m = TIME.exec(s);
  if (!m) return undefined;
  const ids = [tlId.tone, tlId.n(Number(m[1])), m[2] ? tlId.oclock : m[3] ? tlId.oh(Number(m[3])) : tlId.n(Number(m[4]))];
  ids.push(m[6] ? tlId.exactly : tlId.sec(Number(m[5])));
  return ids.map((id) => path({ cast: 'time-lady', id }));
}

// the pretend bill, said by the Hint Giant: lead-in + dollars + cents ("$1.99": one dollar and ninety-nine cents)
export const tbId = {
  lead: 'tb-lead',
  n: (n: number) => `tb-n${n}`,
  dollar: 'tb-dollar',
  dollars: 'tb-dollars',
  and: 'tb-and',
  cent: 'tb-cent',
  cents: 'tb-cents',
};
const BILL = new RegExp(`^${BILL_LEAD.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\$(\\d+)\\.(\\d\\d)\\.$`);

function billClips(s: string): ClipPath[] | undefined {
  const m = BILL.exec(s);
  if (!m) return undefined;
  const dollars = Number(m[1]);
  const cents = Number(m[2]);
  if (dollars > 99) return undefined;
  const ids: string[] = [tbId.lead];
  if (dollars || !cents) ids.push(tbId.n(dollars), dollars === 1 ? tbId.dollar : tbId.dollars);
  if (cents) ids.push(...(dollars ? [tbId.and] : []), tbId.n(cents), cents === 1 ? tbId.cent : tbId.cents);
  return ids.map((id) => path({ cast: 'giant', id }));
}

/** Who plays a whole line: the caller of the fixed line, or of a spliced one. */
export function castOf(text: string): string | undefined {
  const line = SCRIPT.find((l) => l.text === text);
  if (line) return line.voice;
  const first = sentences(text)[0] ?? '';
  if (first === TIME_LEAD || TIME.test(first)) return 'time-lady';
  if (first.startsWith(`${BILL_LEAD} $`)) return 'giant';
  // a line made of fixed sentences (a hint and the choices after it): its first sentence names the caller
  return SCRIPT.find((l) => sentences(l.text)[0] === first)?.voice;
}

/**
 * The clips that say `piece` (a caption piece: whole sentences of `whole`, a line as `say` was handed it),
 * in order; undefined when any sentence has no clip, so the caller can speak it instead.
 */
export function clipsFor(piece: string, whole: string): ClipPath[] | undefined {
  const cast = castOf(whole);
  if (!cast) return undefined;
  const out: ClipPath[] = [];
  for (const s of sentences(piece)) {
    const part = bySentence.get(`${cast}|${s}`);
    const found = part ? [path(part)] : (timeClips(s) ?? billClips(s));
    if (!found) return undefined;
    out.push(...found);
  }
  return out;
}
