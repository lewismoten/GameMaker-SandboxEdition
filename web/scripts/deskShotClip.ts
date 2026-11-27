// Clip a desk prop's 20-pixel screenshot margin to the viewport.
export function deskShotClip(box: { x: number; y: number; width: number; height: number }, w: number, h: number) {
  const x = Math.max(0, box.x - 20);
  const y = Math.max(0, box.y - 20);
  const clip = { x, y, width: Math.min(w, box.x + box.width + 20) - x, height: Math.min(h, box.y + box.height + 20) - y };
  return clip.width <= 0 || clip.height <= 0 ? null : clip;
}
