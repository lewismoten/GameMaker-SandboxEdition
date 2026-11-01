// Tells the author when a .VOC they bring in is over what PLAYGAME can load (audio/vocLimit.ts).
// It only warns: the web player plays the file, and the sample editor can cut it to fit.
import { toast } from '../core/ui';
import { vocLimitNote, vocTooBig } from '../../audio/vocLimit';

/** Warns about each .VOC in these added files that is over 64 KB. */
export function warnBigVocs(files: Iterable<[string, Uint8Array]>): void {
  for (const [name, bytes] of files) {
    if (/\.voc$/i.test(name) && vocTooBig(bytes.length))
      toast(`${vocLimitNote(name.toUpperCase(), bytes.length)} Open it in the sample editor and use Cut to fit.`, 'error');
  }
}
