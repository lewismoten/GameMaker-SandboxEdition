// Two bits of business on the cast page's stage, as poses over time after hello: the goat's
// scream and faint (Third Goat from the Left), and Brother Camel squeezing through the eye of the
// needle (Thread the Needle, Brother Camel), and who has which business. No drawing here:
// castStageScene.ts draws the pose.
import type { CastMember } from './castData';
import { FLOOR, W, type Sprite } from './castStageDraw';

/** The goat `t` ms after hello: screams, faints, lies there a beat and gets up. */
export function goatFrames(s: Sprite, t: number): HTMLCanvasElement[] {
  const scream = s.acts.scream ?? s.front;
  const faint = s.acts.faint ?? s.front;
  if (t < 900) return scream;
  if (t < 1300) return [faint[Math.min(faint.length - 1, Math.floor((t - 900) / 140))]];
  if (t < 2800) return [faint[faint.length - 1]];
  return s.front;
}

/**
 * Brother Camel `t` ms after hello, `reach` pixels below the needle's eye: lifted to it, thinner
 * and thinner with a wobble behind the needle (so he shows through the hole), then pop! back out.
 */
export function needlePose(s: Sprite, t: number, reach: number): { frames: HTMLCanvasElement[]; up: number; squeeze: number; behind: boolean } {
  if (t < 1600) {
    const k = Math.max(0, (t - 1200) / 400);
    return { frames: s.walk, up: reach * k, squeeze: 1 - 0.4 * k, behind: k > 0.4 };
  }
  if (t < 2900)
    return {
      frames: s.walk,
      up: reach,
      // thinner and thinner, with a wobble
      squeeze: 0.6 - 0.34 * Math.min(1, (t - 1600) / 900) + (Math.floor(t / 90) % 2) * 0.05,
      behind: true,
    };
  // pop! back out
  if (t < 3200) return { frames: s.front, up: reach * (1 - (t - 2900) / 300), squeeze: 1.2, behind: false };
  return { frames: s.front, up: 0, squeeze: 1, behind: false };
}

/** Which business a cast member has, by the props that loaded (sprites.json may lack one). */
export function stageGags(sprites: Map<string, Sprite>) {
  const has = (...ids: string[]) => ids.every((id) => sprites.has(id));
  const needleX = () => W - 20 - (sprites.get('prop:needle')?.sprite.w ?? 0);
  return {
    /** Gwinn's zoomies with Doc Leo's hat. */
    isGwinn: (m: CastMember) => m.id === 'gwinn' && has('prop:hat'),
    /** Doc Leo without his hat, until Teddy brings it. */
    hatGag: (m: CastMember) => m.id === 'leo' && has('teddy', 'prop:hat') && !!sprites.get(m.id)?.acts.bareWalk,
    /** Loaf #13 carried home. */
    loafGag: (m: CastMember) => m.id === 'loaf' && has('prop:girl'),
    /** Brother Camel and the needle. */
    needleGag: (m: CastMember) => m.id === 'camel' && has('prop:needle'),
    needleX,
    /** The needle's eye on the stage (castNeedle.ts NEEDLE_EYE: 8 across, 14 down its picture). */
    eyeX: () => needleX() + 8,
    eyeY: () => FLOOR + 1 - (sprites.get('prop:needle')?.sprite.h ?? 0) + 14,
  };
}

export type StageGags = ReturnType<typeof stageGags>;
