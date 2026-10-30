// Repository policy over the portable disk writer: stamp about.json's version and honor audit output.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Disk as NativeDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/disk';
import { stampMenuVersion, type MenuVersionSpot } from '@lewismoten/gamemaker-sandbox-tools/kit/menuVersion';
export class Disk extends NativeDisk {
  menuVersion: MenuVersionSpot = {};
  override write(): number {
    const about = join(this.dir, '..', 'about.json');
    if (existsSync(about)) {
      const { version } = JSON.parse(readFileSync(about, 'utf8')) as { version?: string };
      if (version) stampMenuVersion(this.files, version, this.menuVersion);
    }
    const dir = process.env.GAME_DISK_OUT || this.dir;
    const total = super.write(dir);
    console.log(`${this.files.size} files, ${total.toLocaleString()} bytes -> ${dir}`);
    return total;
  }
}
