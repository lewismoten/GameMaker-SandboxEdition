// Keys entries in the XFERPLAY.EXE patch map; assembled by patchTable.ts.
import type { PatchEntry } from './patchTable';

export const KEYS_PATCHES: PatchEntry[] = [
  { id: 'table.fkeys.F5', group: 'keys', screen: 'play', label: 'F5 saves', safety: 'caution', web: true, kind: 'fkey', key: 5, offset: 0xcce8, stock: 0x28b8 },
  { id: 'table.fkeys.F6', group: 'keys', screen: 'play', label: 'F6 loads', safety: 'caution', web: true, kind: 'fkey', key: 6, offset: 0xccea, stock: 0x28ca },
  {
    id: 'table.fkeys.F9',
    group: 'keys',
    screen: 'play',
    label: 'F9 joystick setup',
    safety: 'caution',
    web: true,
    kind: 'fkey',
    key: 9,
    offset: 0xccf0,
    stock: 0x28e4,
  },
];
