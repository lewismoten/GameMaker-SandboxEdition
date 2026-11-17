// Repository policy over the portable disk writer: stamp about.json's version and a Starter's course number, and honor audit output.
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { Disk as NativeDisk, dosText } from '@lewismoten/gamemaker-sandbox-tools/kit/disk';
import { stampMenuVersion, type MenuVersionSpot } from '@lewismoten/gamemaker-sandbox-tools/kit/menuVersion';
import { stampCourseNumber } from './courseStamp';
import { selectiveVoc } from './vocRates';
export class Disk extends NativeDisk {
  menuVersion: MenuVersionSpot = {};
  private reducedVoc = false;
  override put(name: string, bytes: Uint8Array | string): void {
    if (/\.voc$/i.test(name) && typeof bytes !== 'string') {
      const selected = selectiveVoc(basename(dirname(this.dir)), name, bytes);
      if (selected !== bytes) this.reducedVoc = true;
      bytes = selected;
    }
    super.put(name, bytes);
  }
  override write(): number {
    const license = this.files.get('license.txt');
    if (this.reducedVoc && license && !new TextDecoder().decode(license).includes('VOC RATE SELECTION')) {
      const credit = dosText(
        [
          'VOC RATE SELECTION',
          '',
          'OpenAI Codex (GPT-6.1 Sol)',
          'directed by Lewis Moten.',
          '',
          'Spectral checks and filtered',
          'rates for generated effects.',
          ...Array<string>(9).fill(''),
        ].join('\n'),
      );
      const joined = new Uint8Array(license.length + 2 + credit.length);
      joined.set(license);
      joined.set([13, 10], license.length);
      joined.set(credit, license.length + 2);
      this.files.set('license.txt', joined);
    }
    const about = join(this.dir, '..', 'about.json');
    if (existsSync(about)) {
      const { version } = JSON.parse(readFileSync(about, 'utf8')) as { version?: string };
      if (version) stampMenuVersion(this.files, version, this.menuVersion);
    }
    stampCourseNumber(this.files, basename(dirname(this.dir)));
    const dir = process.env.GAME_DISK_OUT || this.dir;
    const total = super.write(dir);
    console.log(`${this.files.size} files, ${total.toLocaleString()} bytes -> ${dir}`);
    return total;
  }
}
