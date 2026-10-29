// On a computer screen the whole desk fits the window, like a photo of it: the scene is
// laid out at one size (STAGE_W x STAGE_H) and scaled to fit, so nothing scrolls and the
// props keep their places. Narrow (phone) screens stack the props instead (desk.css). While a
// guided tour plays (tour/, its 'gm-tour' events), the room leaves its caption bar room at the
// bottom, so the keyboard and the game pad aren't under it.
const STAGE_W = 1440;
const STAGE_H = 880;
/** The wall clock's width at full size (wallClock.css). */
const CLOCK_W = 180;
/** Room kept for the guided tour's caption bar (its usual height; a longer caption may grow it a little). */
const TOUR_BAR_H = 88;

/** The guided tour's caption bar along the bottom, if a tour is playing. */
const tourBar = (): number => {
  const bar = document.querySelector<HTMLElement>('.tour-bar');
  return bar ? Math.max(bar.offsetHeight, TOUR_BAR_H) : 0;
};

export function fitStage(desk: HTMLElement): () => void {
  const fit = () => {
    const bar = desk.querySelector<HTMLElement>('.desk-bar')?.offsetHeight ?? 0;
    const scale = Math.min(innerWidth / STAGE_W, (innerHeight - bar - tourBar()) / STAGE_H);
    desk.style.setProperty('--stage-scale', String(Math.max(0.3, scale)));
    desk.style.setProperty('--bar-h', `${bar}px`);
    // wall to spare left of the desk, in stage pixels: the clock hangs there (wallClock.ts),
    // as big as fits (up to full size), centered in the space
    // it may use the strip of wall left of the poster too (stage x < 16)
    const room = (innerWidth / Math.max(0.3, scale) - STAGE_W) / 2;
    const space = room + 8;
    const size = Math.min(1, space / CLOCK_W);
    desk.classList.toggle('wide-wall', size >= 0.3);
    desk.style.setProperty('--clock-size', size.toFixed(3));
    desk.style.setProperty('--clock-left', `${(-room + 8 + (space - CLOCK_W * size) / 2).toFixed(1)}px`);
  };
  fit();
  addEventListener('resize', fit);
  addEventListener('gm-tour', fit);
  return () => {
    removeEventListener('resize', fit);
    removeEventListener('gm-tour', fit);
  };
}
