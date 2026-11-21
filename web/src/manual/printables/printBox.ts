// Name the print job for the sheets the box viewer is sending to the browser.
import { titleForPrint } from '../printTitle';
import type { BoxItem } from './viewer';

export type PrintMode = 'item' | 'booklet' | 'all';

export function printBox(mode: PrintMode, title: string, item?: Pick<BoxItem, 'title' | 'pages'>): void {
  const printsItem = mode === 'item' || (mode === 'booklet' && item?.pages);
  titleForPrint(printsItem && item ? item.title : title);
  window.print();
}
