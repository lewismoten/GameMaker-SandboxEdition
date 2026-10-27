// One frame of the cast page's stage: the backdrop, whoever is on in their pose (walking, in the
// light, or at their business), the costume on the boards, the needle, a helper (Teddy with the
// hat, the child for the loaf) and the snow. castStage.ts keeps the time and says who is where.
import type { CastMember } from './castData';
import type { CastSprite } from './castSprite';
import { backdrop, drawProps, drawSnow, FLOOR, type newFlakes, type Prop, type Sprite, type stagePut } from './castStageDraw';
import { goatFrames, needlePose, type StageGags } from './castStageGags';

// enter: walking on; back: Gwinn coming back; pre: business before hello (the hat); talk: hello;
// post: business after it (scream, loaf, needle); exit: off they go
export type Phase = 'enter' | 'back' | 'pre' | 'talk' | 'post' | 'exit';

/** Someone helping out in another's turn: Teddy with the hat, the child who takes the loaf. */
export interface Helper {
  id: string;
  x: number;
  /** Walking left (drawn turned round). */
  left: boolean;
  speed: number;
  /** What they carry, and whether it is still theirs to carry. */
  carry?: 'hat' | 'loaf';
}

/** Where things are on the stage now. */
interface SceneNow {
  m: CastMember | undefined;
  phase: Phase;
  /** When the phase began. */
  t0: number;
  x: number;
  hatOn: boolean;
  carried: boolean;
  props: Prop[];
  helper: Helper | undefined;
  snow: number;
  flakes: ReturnType<typeof newFlakes>;
  /** Reduced motion and paused: the first frame only. */
  frozen: boolean;
}

const cycle = (frames: HTMLCanvasElement[], now: number, ms: number) => frames[Math.floor(now / ms) % frames.length];

/** Draws the stage at `now`; what was drawn of the one on stage, for the sounds with the frames. */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  put: ReturnType<typeof stagePut>,
  sprites: Map<string, Sprite>,
  gags: StageGags,
  v: SceneNow,
  now: number,
): { n: number; moving: boolean; sprite: CastSprite } | undefined {
  const { isGwinn, loafGag, needleGag, needleX, eyeY } = gags;
  const { m, phase, x, props } = v;
  backdrop(ctx);
  const s = m && sprites.get(m.id);
  if (!s) return undefined;
  const t = now - v.t0;
  const moving = (phase === 'enter' || phase === 'back' || phase === 'exit') && s.sprite.walk;
  let left = phase === 'back' || (phase === 'exit' && needleGag(m));
  if (s.sprite.mirror) left = !left;
  let frames = moving ? s.walk : s.front;
  let ms = isGwinn(m) && moving ? 70 : s.sprite.ms;
  let squeeze = 1;
  let gone = false;
  // the business
  if (m.id === 'leo' && !v.hatOn) frames = moving ? s.acts.bareWalk : s.acts.bareSide;
  else if (m.id === 'leo' && phase === 'pre') frames = s.acts.side;
  if (m.id === 'goat' && phase === 'post') {
    frames = goatFrames(s, t);
    ms = 120;
  }
  // Brother Camel's needle: it stands at the right all through his turn; he tries its eye,
  // squeezing in behind it so he shows through the hole
  let behind = false;
  let up = 0;
  let drawNeedle = () => {};
  if (needleGag(m)) {
    const needle = sprites.get('prop:needle')!.walk[0];
    const alpha = phase === 'enter' ? Math.min(1, t / 700) : phase === 'exit' ? Math.max(0, 1 - t / 900) : 1;
    drawNeedle = () => {
      ctx.globalAlpha = alpha;
      put(needle, needleX());
      ctx.globalAlpha = 1;
    };
    if (phase === 'post') {
      // lifted so his middle is at the eye
      const reach = Math.max(0, FLOOR + 1 - s.sprite.h / 2 - eyeY());
      ({ frames, up, squeeze, behind } = needlePose(s, t, reach));
    }
    if (!behind) drawNeedle();
  }
  if (loafGag(m) && v.carried) gone = true;
  if (props.length) drawProps(ctx, props, phase === 'exit' ? Math.max(0, 1 - t / 700) : 1);
  const fade = !s.sprite.walk && (phase === 'enter' || phase === 'exit') ? Math.min(1, Math.max(0, t / 600)) : 1;
  const frame = v.frozen ? frames[0] : cycle(frames, now, ms);
  if (!gone) {
    ctx.globalAlpha = phase === 'exit' && !s.sprite.walk ? 1 - fade : fade;
    // a waddle for one who walks on in a single frame, a hop for the tin heart
    const lift = moving ? (s.sprite.hop ? Math.round(Math.abs(Math.sin((now / 260) * Math.PI)) * 7) : s.walk.length === 1 ? Math.floor(now / 160) % 2 : 0) : 0;
    const tilt = moving && s.sprite.wobble ? Math.sin(now / 140) * 0.28 : 0;
    const top = put(frame, x, lift + Math.round(up), left, squeeze, tilt);
    ctx.globalAlpha = 1;
    // Gwinn has Doc Leo's hat in her mouth, all the way off
    if (isGwinn(m)) {
      const hat = sprites.get('prop:hat')!.walk[0];
      if (moving) ctx.drawImage(hat, left ? Math.round(x) + s.sprite.w - 9 - hat.width : Math.round(x) + 9, top + 1);
      else ctx.drawImage(hat, Math.round(x), top + 8);
    }
  }
  if (behind) drawNeedle();
  drawHelper(ctx, put, sprites, v.helper, now);
  drawSnow(ctx, v.flakes, v.snow);
  return { n: frames.indexOf(frame) + (moving ? 0 : 100), moving: !!moving, sprite: s.sprite };
}

function drawHelper(
  ctx: CanvasRenderingContext2D,
  put: ReturnType<typeof stagePut>,
  sprites: Map<string, Sprite>,
  helper: Helper | undefined,
  now: number,
): void {
  if (!helper) return;
  const hs = sprites.get(helper.id === 'girl' ? 'prop:girl' : helper.id);
  if (!hs) return;
  const top = put(cycle(hs.walk, now, helper.id === 'teddy' ? 70 : hs.sprite.ms), helper.x, 0, helper.left);
  if (helper.carry === 'hat') {
    const hat = sprites.get('prop:hat')!.walk[0];
    ctx.drawImage(hat, Math.round(helper.x) + (helper.left ? -6 : 8), top - 1);
  } else if (helper.carry === 'loaf') {
    const loaf = sprites.get('loaf')!.front[0];
    ctx.drawImage(loaf, Math.round(helper.x) + 6, top + 10);
  }
}
