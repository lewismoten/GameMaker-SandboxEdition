// The character's key/sequence stack: SimKeyPress, PushKey, PopKey and CleanKeyStk
// from code/GM/PLAYGAME.C. Pressing a sequence key pushes the running sequence; releasing
// it returns to whatever was running before.
//
// Keys are PC keyboard scan codes as the int 9 handler saw them: below 0x80 a press,
// with the high bit set a release. A sequence's key keeps the scan code in its high
// byte (bioskey style), hence `key >> 8`. 0xff marks a stack entry whose key was let go.
import { DIESEQ, IDLESEQ, type Frame, type Sequence } from '../formats/character';
import { MAXKEYS, MAXSEQ, type World } from './world';

export function chrSeq(w: World): Sequence {
  return w.chr.sequences[w.chr.cseq] ?? w.chr.sequences[0];
}

/** CHRFRAME. cframe can be -1 between sequences; the original then read stray memory. */
export function chrFrame(w: World): Frame {
  const s = chrSeq(w);
  return s.frames[Math.max(0, Math.min(s.frames.length - 1, w.chr.cframe))];
}

/**
 * SimKeyPress. A press starts the matching sequence only if the character isn't dying,
 * the running sequence can be interrupted (not `ground`), the sequence still has uses
 * (meter > 0) and is turned on (seqon, e.g. its inventory block is carried).
 */
export function simKeyPress(w: World, key: number): void {
  const { chr, ci } = w;
  if (key < 0x80) {
    if (w.keydn[key] === 0) {
      for (let loop = 0; loop < MAXSEQ; loop++) {
        if (chr.sequences[loop].key >> 8 !== key) continue;
        if (chr.cseq !== DIESEQ && !chrSeq(w).ground && ci.meter[loop] > 0 && ci.seqon[loop] && w.keystkptr < MAXKEYS) {
          w.keystack[w.keystkptr] = { key: w.curkey, seq: chr.cseq, frame: chr.cframe };
          w.keystkptr++;
          if (w.keystkptr >= MAXKEYS) cleanKeyStack(w);
          chr.cseq = loop;
          chr.cframe = -1;
          ci.nextAni = w.clock;
          w.curkey = key;
          break;
        }
      }
      w.keydn[key] = 1;
    }
    return;
  }
  key &= 127;
  if (w.keydn[key] === 0) return;
  w.keydn[key] = 0;
  for (let i = 0; i < w.keystkptr; i++) if (w.keystack[i].key === key) w.keystack[i].key = 0xff;
  // Releasing the key of the running sequence resumes the newest entry still held.
  // The keystkptr > 0 guards are the port's: the C loop could run below the stack.
  if (key === w.curkey && w.keystkptr > 0 && !chrSeq(w).ground) {
    while (w.keystkptr > 0 && w.keystack[w.keystkptr - 1].key === 0xff) w.keystkptr--;
    const top = w.keystack[Math.max(0, w.keystkptr - 1)];
    w.curkey = top.key;
    chr.cseq = top.seq;
    chr.cframe = top.frame;
    ci.update = true;
    ci.nextAni = w.clock;
    w.keystkptr = Math.max(0, w.keystkptr - 1);
  }
  // The C calls this a "kludge to restart the idle seq every time 'cause users wanted it".
  if (chr.cseq === IDLESEQ) chr.cframe = 0; // restart the idle sequence
}

/** CleanKeyStk: squeeze out released (0xff) entries, keeping the order. */
function cleanKeyStack(w: World): void {
  let to = 0;
  for (let from = 0; from < w.keystkptr; from++) {
    if (w.keystack[from].key !== 0xff) w.keystack[to++] = { ...w.keystack[from] };
  }
  w.keystkptr = to;
}

/** PushKey. The overflow handling is the port's; the C pushed without a bounds check. */
export function pushKey(w: World): void {
  if (w.keystkptr >= w.keystack.length) cleanKeyStack(w);
  if (w.keystkptr >= w.keystack.length) w.keystkptr = w.keystack.length - 1;
  w.keystack[w.keystkptr] = { key: w.curkey, seq: w.chr.cseq, frame: w.chr.cframe };
  w.keystkptr++;
}

/** PopKey: drop `key` from the stack and resume what is under it, or idle when empty. */
export function popKey(w: World, key: number): void {
  const { chr, ci } = w;
  for (let i = 0; i < w.keystkptr; i++) if (w.keystack[i].key === key) w.keystack[i].key = 0xff;
  while (w.keystkptr > 0 && w.keystack[w.keystkptr - 1].key === 0xff) w.keystkptr--;
  if (w.keystkptr === 0) {
    w.curkey = 0;
    chr.cseq = IDLESEQ;
    chr.cframe = 0;
  } else {
    const top = w.keystack[w.keystkptr - 1];
    w.curkey = top.key;
    chr.cseq = top.seq;
    chr.cframe = top.frame;
    w.keystkptr--;
    if (chr.cseq === IDLESEQ) chr.cframe = 0;
  }
  ci.update = true;
  ci.nextAni = w.clock;
}

/** The key down and key stack reset at the end of StartSceneInits (also used after F-keys). */
export function resetKeys(w: World): void {
  w.keydn.fill(0);
  for (const k of w.keystack) {
    k.seq = 0;
    k.frame = 0;
    k.key = 0xff;
  }
  w.keystkptr = 0;
  w.curkey = 0;
}
