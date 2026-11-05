// A block set's roles, kept in the project's companion file ("roles" section of the .bbl), never in
// the .bbl itself, so DOS, native and web-page exports do not carry them (project/companion.ts).
import { cleanRoles, packRoles, type RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';

const SECTION = 'roles';

interface ExtrasStore {
  extras<T>(file: string, section: string, fallback: T): T;
  setExtras(file: string, section: string, value: unknown): void;
}

/** The set's roles (blocks numbered 0..count-1). */
export function readRoles(store: ExtrasStore, file: string, count: number): RoleMap {
  return cleanRoles(store.extras<unknown>(file, SECTION, undefined), count);
}

export function writeRoles(store: ExtrasStore, file: string, map: RoleMap): void {
  store.setExtras(file, SECTION, packRoles(map));
}
