// The real moon tonight, near enough for a window: how far it is through its month (from a
// known new moon, 6 January 2000 18:14 UTC, at the mean synodic month), how much of it is
// lit, and the phase's name.
import { deskNow } from "../../retro/dos/deskClock";

const MONTH = 29.530588853; // days
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export interface Moon {
  /** 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
  age: number;
  /** The share of the disc that is lit, 0 to 1. */
  lit: number;
  name: string;
}

const NAMES = [
  "a new moon",
  "a waxing crescent",
  "the first quarter",
  "a waxing gibbous moon",
  "a full moon",
  "a waning gibbous moon",
  "the last quarter",
  "a waning crescent",
];

export function moonPhase(when = deskNow()): Moon {
  const days = (when.getTime() - NEW_MOON) / 86_400_000;
  const age = (((days / MONTH) % 1) + 1) % 1;
  const lit = (1 - Math.cos(age * 2 * Math.PI)) / 2;
  return { age, lit, name: NAMES[Math.round(age * 8) % 8] };
}

/**
 * The lit part of a moon of radius r at (cx, cy) as a path, for the northern sky: waxing,
 * the right side is lit; waning, the left. The terminator is half an ellipse.
 */
export function moonPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  age: number,
): void {
  const waxing = age < 0.5;
  const side = waxing ? 1 : -1;
  const k = Math.cos(age * 2 * Math.PI); // 1 new, 0 quarter, -1 full
  ctx.beginPath();
  // the lit limb, top to bottom
  ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, !waxing);
  // the terminator, bottom back up to the top
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI;
    ctx.lineTo(cx + side * k * r * Math.sin(a), cy + r * Math.cos(a));
  }
  ctx.closePath();
}
