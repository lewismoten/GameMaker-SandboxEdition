// VPIC.EXE: the picture viewer in C:\COMM, for GIFs and JPEGs downloaded from the BBS into
// C:\IMAGES. "VPIC FILE.GIF" shows one; plain "VPIC" lists the pictures in the current folder
// to pick from. JPEGs are shown as 1994 viewers on a 256-color card did: grays as VGA's 64
// shades, color dithered to a color cube. The picture is shown in 320x200 VGA if it fits
// there, otherwise 640x400, centered and (if bigger than that) shrunk to fit; any key goes back.
import type { RetroHost } from '../host';
import type { DosNode } from '../dos/vfs';
import { commas, resolvePath } from '../dos/vfs';
import { attr, COLS, ROWS } from '../text/textScreen';
import { modeFor } from './picture';
import { decodePicture, paintPicture } from '../bbs/gallery';
import { toCp437 } from '../text/cp437';

const TITLE = 'VPIC  GIF/JPEG viewer';

export async function runVpic(h: RetroHost, args: string[]): Promise<void> {
  const s = h.screen;
  const wd = h.workDir();
  const cwdOf = (d: string) => (d === wd.drive ? wd.parts : []);
  const name = args.find((a) => !a.startsWith('/'));
  if (name) {
    const { drive, parts } = resolvePath(name, wd.drive, cwdOf);
    const node = await h.fs.find(drive, parts);
    if (!node || node.dir || !node.read) {
      s.print(`${TITLE}\nFile not found - ${name.toUpperCase()}\n`);
      return;
    }
    const err = await show(h, node);
    if (err) s.print(`${TITLE}\n${err}\n`);
    return;
  }
  const files = ((await h.fs.listDir(wd.drive, wd.parts)) ?? []).filter((n) => !n.dir && /\.(GIF|JPG)$/.test(n.name));
  if (!files.length) {
    s.print(`${TITLE}\nUsage: VPIC [d:][path]filename.GIF (or .JPG)\nNo .GIF or .JPG files in ${wd.drive}:\\${wd.parts.join('\\')}\n`);
    return;
  }
  await picker(h, files, `${wd.drive}:\\${wd.parts.join('\\')}`);
}

/** Shows a GIF or JPEG until a key is pressed; an error message if it isn't one. */
async function show(h: RetroHost, node: DosNode): Promise<string | undefined> {
  const bytes = await node.read!();
  const pic = decodePicture(bytes);
  if (!pic || !pic.width || !pic.height) return `${node.name} is not a GIF or JPEG file`;
  const [w, hh] = modeFor(pic.width, pic.height);
  const scr = h.pictureMode(w, hh);
  try {
    paintPicture(scr, pic);
    await scr.key();
  } finally {
    h.leavePictureMode();
  }
  return undefined;
}

/** A list of the folder's pictures: arrows to choose, Enter to view, Esc to quit. */
async function picker(h: RetroHost, files: DosNode[], where: string): Promise<void> {
  const s = h.screen;
  const top = 3;
  const rows = ROWS - top - 3;
  let at = 0;
  let message = '';
  const draw = () => {
    s.cursorVisible = false;
    s.clear(attr(7, 1));
    s.fill(0, 0, COLS - 1, 0, attr(0, 3));
    s.write(1, 0, attr(0, 3), `${TITLE}   ${where}`);
    s.write(1, 2, attr(14, 1), 'Name           Size');
    const first = Math.max(0, Math.min(at - rows + 1, files.length - rows));
    files.slice(first, first + rows).forEach((f, i) => {
      const sel = first + i === at;
      s.write(1, top + i, sel ? attr(0, 7) : attr(15, 1), ` ${f.name.padEnd(12)} ${commas(f.size).padStart(9)} `);
    });
    s.fill(0, ROWS - 1, COLS - 1, ROWS - 1, attr(0, 3));
    s.write(1, ROWS - 1, attr(0, 3), toCp437(`↑↓ choose   Enter view   Esc quit${message ? `   ${message}` : ''}`));
  };
  for (;;) {
    draw();
    const k = (await h.keys.next()).key;
    message = '';
    if (k === 'Escape' || k === 'q' || k === 'Q') break;
    else if (k === 'ArrowUp') at = Math.max(0, at - 1);
    else if (k === 'ArrowDown') at = Math.min(files.length - 1, at + 1);
    else if (k === 'Home') at = 0;
    else if (k === 'End') at = files.length - 1;
    else if (k === 'Enter') message = (await show(h, files[at])) ?? '';
  }
  s.clear(attr(7, 0));
  s.cursorVisible = true;
}
