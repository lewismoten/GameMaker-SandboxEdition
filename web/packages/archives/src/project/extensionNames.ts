// Renaming a game's file extensions, both ways: the DOS export gives them the extensions a
// customized player asks for (export/exportDos.ts, dosPlayer/fileExtensions.ts), and an import
// renames a folder's back to Game-Maker's own (importPlayer.ts). The names inside the .gam, slide
// lists and backdrops are rewritten in place, keeping their length and case.

const escape = (s: string) => s.replace(/[\\^$.*+?()[\]{}|-]/g, '\\$&');

/** `name` with its extension swapped by `map` (lower case, no dots), keeping its case; unchanged when the map has none for it. */
export function swapExtension(name: string, map: Map<string, string>): string {
  const m = /\.([^.]*)$/.exec(name);
  const to = m ? map.get(m[1].toLowerCase()) : undefined;
  if (!m || to === undefined) return name;
  const upper = /[A-Z]/.test(m[1]) && m[1] === m[1].toUpperCase();
  return name.slice(0, m.index + 1) + (upper ? to.toUpperCase() : to);
}

/** Rewrites every file name with an extension in `map` inside `bytes` (a .gam, slide list or backdrop), in place, keeping its case. */
export function rewriteNames(bytes: Uint8Array, map: Map<string, string>): Uint8Array {
  const out = bytes.slice();
  const text = Array.from(out, (b) => String.fromCharCode(b))
    .join('')
    .toLowerCase();
  const exts = [...map.keys()].filter((e) => e && e.length === map.get(e)!.length);
  if (!exts.length) return out;
  for (const m of text.matchAll(new RegExp(`[a-z0-9_~!@#$%^&()-]\\.(${exts.map(escape).join('|')})(?![a-z0-9])`, 'g'))) {
    const at = m.index + 2;
    const to = map.get(m[1])!;
    const upper = out[at] >= 0x41 && out[at] <= 0x5a;
    for (let i = 0; i < to.length; i++) out[at + i] = (upper ? to[i].toUpperCase() : to[i]).charCodeAt(0);
  }
  return out;
}
