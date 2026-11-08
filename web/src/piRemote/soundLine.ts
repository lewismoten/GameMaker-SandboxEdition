// Game-Maker OS's sound events: the Pi has no audio driver, so each sound a game plays comes
// over the USB log as one "SND ..." line (gamemaker-os src/sound.h and docs/play.md, "Sound
// events"), which the kernel sends as "LOG OS: SND ...":
//   SND game <DIR> <GAM>          a game starts: its /sd/GAMES folder and .GAM file
//   SND music start <DIR>/<CMF>   PlaySong (the title's, a level's, won or lost)
//   SND music stop                a slot with no song
//   SND voc <DIR>/<NAME>.VOC      an effect with a Sound Blaster clip
//   SND beep <DIR>/<SND> <n>      an effect on the PC speaker: tune n of that .SND file
//   SND stopall, SND end          the game is over
// A folder of "-" means the Pi did not say.

export type SoundEvent =
  | { kind: 'game'; dir: string; gam: string }
  | { kind: 'music'; file: string }
  | { kind: 'musicStop' }
  | { kind: 'voc'; file: string }
  | { kind: 'beep'; file: string; effect: number }
  | { kind: 'stopAll' }
  | { kind: 'end' };

/** The .snd table's effects (formats/sound.ts LASTSND). */
const EFFECTS = 30;
/** A DOS file name as the Pi writes it (upper case 8.3; anything else is not a file this page fetches). */
const FILE = /^[A-Z0-9_$~!#%&'(){}^@`-]{1,8}(\.[A-Z0-9_$~!#%&'(){}^@`-]{1,3})?$/;

/** "<DIR>/<FILE>" to its file name, or undefined. */
function fileOf(path: string | undefined): string | undefined {
  const slash = path?.indexOf('/') ?? -1;
  if (!path || slash < 1) return undefined;
  const file = path.slice(slash + 1);
  return FILE.test(file) ? file : undefined;
}

/**
 * The sound event of one Pi line: the log text after "LOG " ("OS: SND voc ...") or the bare
 * "SND ..." line; undefined for any other line, or one this page does not know.
 */
export function parseSoundLine(text: string): SoundEvent | undefined {
  const body = text.startsWith('OS: ') ? text.slice(4) : text;
  if (!body.startsWith('SND ')) return undefined;
  const [what, ...rest] = body.slice(4).trim().split(/\s+/);
  switch (what) {
    case 'game': {
      const [dir, gam] = rest;
      return dir && gam && rest.length === 2 && FILE.test(gam) ? { kind: 'game', dir: dir === '-' ? '' : dir, gam } : undefined;
    }
    case 'music': {
      if (rest[0] === 'stop' && rest.length === 1) return { kind: 'musicStop' };
      const file = rest[0] === 'start' && rest.length === 2 ? fileOf(rest[1]) : undefined;
      return file ? { kind: 'music', file } : undefined;
    }
    case 'voc': {
      const file = rest.length === 1 ? fileOf(rest[0]) : undefined;
      return file ? { kind: 'voc', file } : undefined;
    }
    case 'beep': {
      const file = rest.length === 2 ? fileOf(rest[0]) : undefined;
      const effect = /^\d{1,2}$/.test(rest[1] ?? '') ? Number(rest[1]) : -1;
      return file && effect >= 0 && effect < EFFECTS ? { kind: 'beep', file, effect } : undefined;
    }
    case 'stopall':
      return rest.length ? undefined : { kind: 'stopAll' };
    case 'end':
      return rest.length ? undefined : { kind: 'end' };
  }
  return undefined;
}
