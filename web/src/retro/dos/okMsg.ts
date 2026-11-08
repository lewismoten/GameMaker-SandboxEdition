// OKMSG: the secret word GM.EXE puts on the command line of MENU, PLAYGAME and IMAGE
// (code/GM/GMGEN.H:24, GM.ASM:40). The tools compare it with strcmp, so the case matters.
// Typed at the prompt it makes a tool act as if GM.EXE had started it (MENU.C:38,
// PLAYGAME.C:596, IMAGE.C:99).
export const OKMSG = 'cOoL';

/**
 * Whether the command line carries OKMSG as the first word, with at least `argc` words
 * counted as C does (the program's own name is word one). MENU wants argc >= 3, the
 * others argc >= 2.
 */
export function hasOkMsg(args: string[], argc: number): boolean {
  return args.length + 1 >= argc && args[0] === OKMSG;
}

/** MENU.C:39, written straight to the screen (writestr(19,20,14,...): column 19, row 20). */
export const MENU_REFUSAL = { x: 19, y: 20, color: 14, text: 'This program must be run under Game-Maker!' };
