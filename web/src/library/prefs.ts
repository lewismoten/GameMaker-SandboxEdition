// What the Library remembers per browser (libraryPage.ts): the sort, and the one game or kind of
// paper picked for each sort. Kept in localStorage; with none (a private window) the address
// still holds them.
import { isShelfOrder, type ShelfOrder } from './shelf';

const ORDER_KEY = 'gm-library-by';
const onlyKey = (order: ShelfOrder) => `gm-library-only-${order}`;

function read(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, value: string | undefined): void {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* private mode: the address still has it */
  }
}

export function savedOrder(): ShelfOrder | undefined {
  const v = read(ORDER_KEY);
  return isShelfOrder(v) ? v : undefined;
}

export const rememberOrder = (order: ShelfOrder): void => write(ORDER_KEY, order);

/** The game (its id, or "other") or kind picked for `order`; undefined for all of them. */
export const savedOnly = (order: ShelfOrder): string | undefined => read(onlyKey(order));

export const rememberOnly = (order: ShelfOrder, only: string | undefined): void => write(onlyKey(order), only);
