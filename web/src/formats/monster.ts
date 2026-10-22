// .mon files: 64 monstruct records of 300 bytes (see code/GM/MON.H).
import { Reader, Writer } from './binary';

export const LASTMON = 64;
export const LASTSL = 20;
export const MAXMARCH = 10;
export const MONSTER_SIZE = 300;
export const NORMALMOVEMENT = 0;
export const ATTACKMOVEMENT = 1;

export interface March {
  /** Block offset from the previous corner (first corner: from the start). */
  x: number;
  y: number;
  /** Speed (pixels per tick) to move toward this corner; 0 ends the path. */
  pic: number;
  /** Picture orientation (0-7) while moving to this corner. */
  orient: number;
}

export interface Monster {
  used: number;
  /** Non-zero: monster is not affected by gravity (unused by playgame). */
  fly: number;
  jump: number;
  stick: number;
  /** Higher power kills lower power; >= 100 (CHARPOWER) can't be killed by touching the character. */
  power: number;
  /** Non-zero: monster stops at solid blocks. */
  thru: number;
  /** Animation: [block number (>= 100 ends), ticks to show] x 21. */
  pic: [number, number][];
  lasttime: number;
  /** Monster this becomes when it dies (64 = none). */
  newmon: number;
  /** Score bonus when killed by the character's weapons. */
  upscore: number;
  xtra: Uint8Array;
  /** 0 no attack path, 1 attack path is absolute, 2 relative to the character. */
  activate: number;
  /** -2 never dies, -1 dies after path, 0 dies when killed, > 0 lifetime in ticks. */
  end: number;
  /** 0 follow path, 1..63 toward the character at this speed (negative: away), >= 64 random (speed = towards >> 6). */
  towards: number;
  close: [number, number];
  /** [normal path, attack path], 10 corners each. */
  march: [March[], March[]];
  cur: March;
}

function readMarch(r: Reader): March {
  return { x: r.i16(), y: r.i16(), pic: r.i16(), orient: r.i16() };
}

function writeMarch(w: Writer, m: March): void {
  w.i16(m.x).i16(m.y).i16(m.pic).i16(m.orient);
}

export function readMonster(r: Reader): Monster {
  const used = r.i16();
  const fly = r.i16();
  const jump = r.i16();
  const stick = r.i16();
  const power = r.u8();
  const thru = r.i8();
  const pic: [number, number][] = [];
  for (let i = 0; i <= LASTSL; i++) pic.push([r.i16(), r.i16()]);
  const lasttime = r.u32();
  const newmon = r.i8();
  const upscore = r.i16();
  const xtra = r.bytesOf(21);
  const activate = r.i16();
  const end = r.i16();
  const towards = r.i16();
  const close: [number, number] = [r.i16(), r.i16()];
  const march: [March[], March[]] = [[], []];
  for (let p = 0; p < 2; p++) for (let i = 0; i < MAXMARCH; i++) march[p].push(readMarch(r));
  const cur = readMarch(r);
  return { used, fly, jump, stick, power, thru, pic, lasttime, newmon, upscore, xtra, activate, end, towards, close, march, cur };
}

export function writeMonster(w: Writer, m: Monster): void {
  w.i16(m.used).i16(m.fly).i16(m.jump).i16(m.stick).u8(m.power).i8(m.thru);
  for (const [p, t] of m.pic) w.i16(p).i16(t);
  w.u32(m.lasttime).i8(m.newmon).i16(m.upscore).bytes(m.xtra, 21).i16(m.activate).i16(m.end).i16(m.towards).i16(m.close[0]).i16(m.close[1]);
  for (const path of m.march) for (const c of path) writeMarch(w, c);
  writeMarch(w, m.cur);
}

export function parseMonsters(bytes: Uint8Array): Monster[] {
  const r = new Reader(bytes);
  return Array.from({ length: LASTMON }, () => readMonster(r));
}

export function serializeMonsters(mons: Monster[]): Uint8Array {
  const w = new Writer(LASTMON * MONSTER_SIZE);
  for (const m of mons) writeMonster(w, m);
  return w.toBytes();
}

export function emptyMonster(): Monster {
  const pic: [number, number][] = Array.from({ length: LASTSL + 1 }, () => [100, 1] as [number, number]);
  const path = () => Array.from({ length: MAXMARCH }, () => ({ x: 0, y: 0, pic: 0, orient: 0 }));
  return {
    used: 0,
    fly: 0,
    jump: 0,
    stick: 0,
    power: 1,
    thru: 1,
    pic,
    lasttime: 0,
    newmon: LASTMON,
    upscore: 0,
    xtra: new Uint8Array(21),
    activate: 0,
    end: 0,
    towards: 0,
    close: [0, 0],
    march: [path(), path()],
    cur: { x: 0, y: 0, pic: 0, orient: 0 },
  };
}

export function newMonsterSet(): Monster[] {
  return Array.from({ length: LASTMON }, () => emptyMonster());
}
