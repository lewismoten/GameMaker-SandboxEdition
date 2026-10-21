// On a computer screen the whole desk fits the window, like a photo of it: the scene is
// laid out at one size (STAGE_W x STAGE_H) and scaled to fit, so nothing scrolls and the
// props keep their places. Narrow (phone) screens stack the props instead (desk.css).
export const STAGE_W = 1440;
export const STAGE_H = 880;

export function fitStage(desk: HTMLElement): () => void {
  const fit = () => {
    const bar = desk.querySelector<HTMLElement>(".desk-bar")?.offsetHeight ?? 0;
    const scale = Math.min(innerWidth / STAGE_W, (innerHeight - bar) / STAGE_H);
    desk.style.setProperty("--stage-scale", String(Math.max(0.3, scale)));
    desk.style.setProperty("--bar-h", `${bar}px`);
    // wall to spare left of the desk: room for the clock that hangs there (wallClock.ts)
    desk.classList.toggle(
      "wide-wall",
      (innerWidth - STAGE_W * scale) / 2 >= 250 * scale,
    );
  };
  fit();
  addEventListener("resize", fit);
  return () => removeEventListener("resize", fit);
}
