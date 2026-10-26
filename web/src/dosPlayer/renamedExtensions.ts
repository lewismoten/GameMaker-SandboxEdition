// File extensions a hand-edited XFERPLAY.EXE asks for in place of the CD's. Acord Games' shared
// player renamed every one (.gam to .z0g, .gif to .z0n…) and the games' files to match, so
// Game-Maker could not open them; Virtual Mario blanked .gam. The customizer never offers this,
// but an import can map such files back (project/importPlayer.ts).

/** Where XFERPLAY 3.00 keeps each extension it asks for (the file.* entries of the patch map). */
const EXTENSIONS: [offset: number, ext: string][] = [
  [0x256b6, '.gam'],
  [0x256fb, '.rec'],
  [0x257b2, '.gif'],
  [0x257b7, '.bkd'],
  [0x257bc, '.fli'],
  [0x257c1, '.txt'],
  [0x257fb, '.sav'],
  [0x268c3, '.his'],
];

/** The CD's extension -> the one this player asks for instead ('' when blanked), lower case. */
export function renamedExtensions(exe: Uint8Array): Record<string, string> {
  const out: Record<string, string> = {};
  if (exe.length !== 160_598) return out;
  for (const [offset, ext] of EXTENSIONS) {
    let now = '';
    for (let i = 0; i < 4 && exe[offset + i]; i++) now += String.fromCharCode(exe[offset + i]);
    now = now.trim().toLowerCase();
    if (now !== ext) out[ext] = now === '.' ? '' : now;
  }
  return out;
}
