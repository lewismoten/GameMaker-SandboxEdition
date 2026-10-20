// getfname with folders: Game-Maker's file picker let you type a path, and listed the
// sub-directories ("SAMPLE\") along with matching files, so you could move between
// game areas. Picking a folder enters it; picking (or typing) a file returns it.
import { attr } from './textScreen';
import { CURATTR, MENUATTR, SHADATTR, errorBox, type Ui } from './textUi';
import type { FileSystem } from './vfs';

export interface Picked {
  drive: string;
  /** The folder the file is in. */
  parts: string[];
  /** File name (upper case); may not exist yet if the user typed a new name. */
  name: string;
  exists: boolean;
}

export async function browseFile(
  ui: Ui,
  fs: FileSystem,
  question: string,
  exts: string[],
  start: { drive: string; parts: string[] },
  opts: { allowNew?: boolean } = {},
): Promise<Picked | null> {
  const s = ui.screen;
  const x = 5;
  const y = 5;
  let drive = start.drive;
  let parts = [...start.parts];
  const want = exts.map((e) => `.${e.toUpperCase()}`);
  /** A file name typed with its path (D:\GAMES\SHIP.GIF): picked once its folder is listed. */
  let typedFile = '';
  for (;;) {
    const list = await fs.listDir(drive, parts);
    if (list === null) {
      typedFile = '';
      const r = await errorBox(ui, `I can't access drive ${drive}:!  Did you remember to insert a disk?`, '(R)etry (A)bort');
      if (r === 'R') continue;
      if (drive === 'C') return null;
      drive = 'C';
      parts = ['GM'];
      continue;
    }
    if (typedFile) {
      const name = typedFile;
      typedFile = '';
      const node = list?.find((n) => n.name === name);
      if (node && !node.dir) return { drive, parts, name, exists: true };
      if (!node && opts.allowNew) return { drive, parts, name, exists: false };
      await errorBox(ui, 'Sorry, the file does not exist!', '(C)ontinue');
    }
    const entries = [
      ...(parts.length ? ['..\\'] : []),
      ...(list ?? []).filter((n) => n.dir).map((n) => `${n.name}\\`),
      ...(list ?? []).filter((n) => !n.dir && want.some((w) => n.name.endsWith(w))).map((n) => n.name),
    ];
    const path = `${drive}:\\${parts.map((p) => `${p}\\`).join('')}`;
    const lenq = question.length + 2;
    const maxa = Math.min(40, 76 - lenq - x);
    const widf = Math.max(1, Math.min(14, entries.length));
    const xf = Math.min(x + lenq + Math.min(path.length, maxa - 14), 62);
    const savedQ = s.window(x, y, lenq + maxa + 1, 1, MENUATTR, SHADATTR);
    const savedF = entries.length ? s.window(xf - 1, y + 2, 15, widf, MENUATTR, SHADATTR) : undefined;
    let typed = '';
    let num = Math.min(entries.findIndex((e) => !e.endsWith('\\')) >= 0 ? entries.findIndex((e) => !e.endsWith('\\')) : 0, Math.max(0, entries.length - 1));
    let top = Math.max(0, num - widf + 1);
    const draw = () => {
      s.write(x + 1, y, attr(14, 1), question);
      const shown = (path + typed).slice(-maxa);
      s.write(x + lenq, y, attr(15, 1), shown.padEnd(maxa));
      s.cursorX = Math.min(79, x + lenq + shown.length);
      s.cursorY = y;
      for (let l = 0; l < widf; l++) s.write(xf - 1, y + 2 + l, attr(11, 1), ` ${(entries[top + l] ?? '').padEnd(13)} `);
      if (entries.length) s.paint(xf - 1, y + 2 + (num - top), xf + 13, y + 2 + (num - top), CURATTR);
    };
    s.cursorVisible = true;
    let next: { drive: string; parts: string[] } | 'stay' | Picked | null = 'stay';
    try {
      while (next === 'stay') {
        draw();
        const k = await ui.keys.next();
        if (k.key === 'Escape') next = null;
        else if (k.key === 'ArrowDown' && num < entries.length - 1) {
          num++;
          if (num > top + widf - 1) top++;
          typed = '';
        } else if (k.key === 'ArrowUp' && num > 0) {
          num--;
          if (num < top) top--;
          typed = '';
        } else if (k.key === 'Backspace') typed = typed.slice(0, -1);
        else if (k.key.length === 1 && typed.length < 40 && /[\w.~!@#$%^&()\\:-]/.test(k.key)) typed += k.key.toUpperCase();
        else if (k.key === 'Enter') {
          const choice = typed || entries[num] || '';
          if (!choice) continue;
          if (typed.includes(':') || typed.includes('\\')) {
            // A drive or path typed in full, as DOS allowed: D:  D:\GAMEWARE\  A:\SHIP.GIF
            const m = /^(?:([A-Z]):)?(\\)?(.*)$/.exec(typed)!;
            const segs = m[3].split('\\').filter(Boolean);
            const last = segs[segs.length - 1] ?? '';
            if (last.includes('.')) typedFile = segs.pop()!;
            // A drive or a leading \ starts at the root; otherwise the path is below this folder.
            const to = m[1] || m[2] ? [] : [...parts];
            for (const seg of segs)
              if (seg === '..') to.pop();
              else if (seg !== '.') to.push(seg);
            next = { drive: m[1] ?? drive, parts: to };
          } else if (choice === '..\\') next = { drive, parts: parts.slice(0, -1) };
          else if (choice.endsWith('\\')) next = { drive, parts: [...parts, choice.slice(0, -1)] };
          else {
            let name = choice;
            if (!name.includes('.') && want.length) name += want[0];
            const node = list?.find((n) => n.name === name);
            if (node?.dir) next = { drive, parts: [...parts, name] };
            else if (node) next = { drive, parts, name, exists: true };
            else if (opts.allowNew) next = { drive, parts, name, exists: false };
            else {
              const r = await errorBox(ui, 'Sorry, the file does not exist!', '(R)eenter name (E)xit');
              if (r === 'E') next = null;
              typed = '';
            }
          }
        }
      }
    } finally {
      s.cursorVisible = false;
      if (savedF) s.restore(savedF);
      s.restore(savedQ);
    }
    if (next === null) return null;
    if ('name' in next) return next;
    drive = next.drive;
    parts = next.parts;
  }
}
