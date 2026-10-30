// Reference scan lookup for this repository; reusable JPEG and color operations live in tools.
import { readScan, type Scan } from '@lewismoten/gamemaker-sandbox-tools/kit/photo';
export function loadScan(name: string): Scan {
  return readScan(new URL(`./scans/${name}.jpg`, import.meta.url));
}
