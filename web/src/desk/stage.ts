// On a computer screen the whole desk fits the window, like a photo of it: the scene is
// laid out at one size (STAGE_W x STAGE_H) and scaled to fit, so nothing scrolls and the
// props keep their places. Narrow (phone) screens stack the props instead (desk.css).
export const STAGE_W = 1560;
export const STAGE_H = 860;

export function fitStage(desk: HTMLElement): () => void {
  const fit = () => {
    const bar = desk.querySelector<HTMLElement>('.desk-bar')?.offsetHeight ?? 0;
    const scale = Math.min(innerWidth / STAGE_W, (innerHeight - bar) / STAGE_H);
    desk.style.setProperty('--stage-scale', String(Math.max(0.3, scale)));
    desk.style.setProperty('--bar-h', `${bar}px`);
  };
  fit();
  addEventListener('resize', fit);
  return () => removeEventListener('resize', fit);
}
