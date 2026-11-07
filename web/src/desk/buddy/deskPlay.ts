// The event deskPc.ts sends the room about the PC's game, so the desk buddy (deskBuddy.ts) can
// follow it without the PC loading the buddy: a title as a game starts, each scene it enters
// (with whether a demo is playing it), and its end.

export const DESK_PLAY = 'gm-desk-play';
export type DeskPlay = { title: string } | { scene: number; demo: boolean } | { stop: true };

export function tellDesk(d: DeskPlay): void {
  window.dispatchEvent(new CustomEvent<DeskPlay>(DESK_PLAY, { detail: d }));
}
