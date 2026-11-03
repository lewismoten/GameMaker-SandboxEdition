// Which rubber chicken the site shows: Sir Reginald (the default) or, once a player has gotten
// past the egg in Tune-Up, Lady Regina (the same bird with a tiara). One small localStorage key,
// so a preferences backup carries it (backup/inventory.ts, the eggs section). No DOM beyond
// window events, and nothing else imported, so any page may load it.
export const CHICKEN_KEY = 'gm-chicken';
/** Fired on window whenever the state changes here (other tabs: the browser's `storage` event). */
export const CHICKEN_CHANGED = 'gm-chicken-changed';

export type Chicken = 'sir' | 'lady';

/** Who the chicken is now. Anything unreadable means Sir Reginald. */
export function chickenNow(): Chicken {
  try {
    return localStorage.getItem(CHICKEN_KEY) === 'lady' ? 'lady' : 'sir';
  } catch {
    return 'sir';
  }
}

/** Sets who the chicken is. True when that changed something. */
export function setChicken(c: Chicken): boolean {
  if (chickenNow() === c) return false;
  try {
    if (c === 'lady') localStorage.setItem(CHICKEN_KEY, 'lady');
    else localStorage.removeItem(CHICKEN_KEY);
  } catch {
    return false;
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHICKEN_CHANGED));
  return true;
}

/** Calls f when the chicken changes (here or in another tab). Returns the way to stop. */
export function onChicken(f: (c: Chicken) => void): () => void {
  const here = () => f(chickenNow());
  const there = (e: StorageEvent) => {
    if (e.key === CHICKEN_KEY || e.key === null) here();
  };
  window.addEventListener(CHICKEN_CHANGED, here);
  window.addEventListener('storage', there);
  return () => {
    window.removeEventListener(CHICKEN_CHANGED, here);
    window.removeEventListener('storage', there);
  };
}
