// Makes the page's AudioContext while the desk sits idle, so the first click on a box or the PC
// does not pay for it (the constructor opens the audio device: 170 to 190 ms at 4x CPU, inside
// the click). The context starts suspended; the engine's gesture listeners resume it on the
// first tap or click (iOS needs that resume inside a gesture, not the construction).
export function warmDeskAudio(): () => void {
  let id: ReturnType<typeof setTimeout> | undefined = setTimeout(() => {
    id = undefined;
    const make = () => void import('@lewismoten/gamemaker-sandbox-engine/audio/context').then((m) => m.audioContext());
    'requestIdleCallback' in window ? requestIdleCallback(make, { timeout: 2000 }) : make();
  }, 1500);
  return () => {
    if (id !== undefined) clearTimeout(id);
  };
}
