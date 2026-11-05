// Repository policy over the portable disk writer: stamp about.json's version and a Starter's course number, and honor audit output.
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { Disk as NativeDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/disk';
import { stampMenuVersion, type MenuVersionSpot } from '@lewismoten/gamemaker-sandbox-tools/kit/menuVersion';
import { stampCourseNumber } from './courseStamp';
export class Disk extends NativeDisk {
  menuVersion: MenuVersionSpot = {};
  override write(): number {
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
