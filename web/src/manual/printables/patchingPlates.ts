// Original byte-layout plates for patching1994.md. The values come from the CD's XFERPLAY
// and PLAYGAME.C; cells show stored bytes, not the distance between separated operands.
import './techRefDiagrams.css';
import { h } from '../../editor/core/ui';
import type { Diagrams } from './markdownBlocks';

function plate(title: string, rows: [string, string, string][], caption: string): HTMLElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 460 ${55 + rows.length * 30}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${title}. ${rows.map((r) => r.join(': ')).join('; ')}`);
  const label = (x: number, y: number, words: string, bold = false) => {
    const t = document.createElementNS(ns, 'text');
    for (const [k, v] of Object.entries({
      x: String(x),
      y: String(y),
      fill: '#18150f',
      'font-family': 'Helvetica, Arial, sans-serif',
      'font-size': '12',
      'font-weight': bold ? '700' : '400',
    }))
      t.setAttribute(k, v);
    t.textContent = words;
    svg.append(t);
  };
  label(8, 18, title, true);
  rows.forEach(([offset, bytes, meaning], i) => {
    const y = 32 + i * 30;
    const box = document.createElementNS(ns, 'rect');
    for (const [k, v] of Object.entries({ x: '95', y: String(y), width: '125', height: '24', fill: '#fff', stroke: '#14304a' })) box.setAttribute(k, v);
    svg.append(box);
    label(8, y + 16, offset);
    label(103, y + 16, bytes, true);
    label(230, y + 16, meaning);
  });
  return h('figure', { class: 'tr-fig' }, svg, h('figcaption', null, caption));
}

export const PATCHING_DIAGRAMS: Diagrams = {
  fileOffsets: () =>
    plate(
      'File offsets start at zero',
      [
        ['00000h', '4D 5A', 'MZ header begins here'],
        ['0B6BEh', '50', 'Menu x operand = 80'],
        ['2575Bh', '50 6C 61 79', 'Play: four text bytes'],
        ['2575Fh', '00', 'NULL: leave in place'],
      ],
      'Figure 1. These are positions in the disk file, including its executable header.',
    ),
  operands: () =>
    plate(
      'One-byte and two-byte instruction operands',
      [
        ['0B6BDh', '6A | 50', 'Push byte: x = 80'],
        ['0E049h', '68 | 36 01', 'Push word: right = 310'],
        ['Example', 'FF', 'Signed byte = -1'],
        ['Example', 'F7 FF', 'Signed word = -9'],
      ],
      'Figure 2. Left of the divider is the opcode; overwrite only the operand to its right. 0136h = 1 × 256 + 54 = 310.',
    ),
  textSlot: () =>
    plate(
      'The menu string and its neighbor',
      [
        ['2575Bh', '50 6C 61 79', 'Stock: P l a y'],
        ['2575Bh', '47 6F 20 20', 'Replacement: Go + spaces'],
        ['2575Fh', '00', 'Fixed NULL terminator'],
        ['25760h', '52 65 61 64', 'Next string: Read...'],
      ],
      'Figure 3. Four bytes may change. A fifth letter would destroy the terminator.',
    ),
  colors: () =>
    plate(
      'RGB components are separate operands',
      [
        ['16354h', '0A', 'Red = 10; bits 00001010'],
        ['16359h', '0A', 'Green = 10'],
        ['1635Eh', '3F', 'Blue = 63; bits 00111111'],
        ['0AF84h', '75 02', 'Selector word = 0275h'],
      ],
      'Figure 4. Each RGB byte has bits 00rrrrrr, 00gggggg or 00bbbbbb. Only the low six bits carry a level. The selector is a different kind of value.',
    ),
  frame: () =>
    plate(
      'F2 outer frame: argument order, not file order',
      [
        ['0E04Fh', '0A', 'Left = 10; byte'],
        ['0E04Dh', '0A', 'Top = 10; byte'],
        ['0E04Ah', '36 01', 'Right = 310; word'],
        ['0E047h', 'BE 00', 'Bottom = 190; word'],
      ],
      'Figure 5. Box(left, top, right, bottom). Every edge has its own operand width; contents do not move with the box.',
    ),
  keyJump: () =>
    plate(
      'F5 jump-table word',
      [
        ['0CCE8h', 'B8 28', 'On: save handler 28B8h'],
        ['0CCE8h', 'F9 28', 'Off: no-action target 28F9h'],
      ],
      'Figure 6. Both alternatives occupy exactly two bytes. This word is a code destination, not the key number.',
    ),
  clamp: () =>
    plate(
      'A speed ceiling of 9 needs positive and negative copies',
      [
        ['0F507h', '09', 'Compare +9; one byte'],
        ['0F50Dh', '09 00', 'Assign +9; two bytes'],
        ['0F512h', 'F7', 'Compare -9; one byte'],
        ['0F518h', 'F7 FF', 'Assign -9; two bytes'],
      ],
      'Figure 7. These four operands serve one axis. Repeat the pattern at F51Dh, F523h, F528h and F52Eh for the other axis. Negative values use two’s complement.',
    ),
  extension: () =>
    plate(
      'GAM extension field',
      [
        ['256B6h', '2E', 'Dot: keep it'],
        ['256B7h', '67 61 6D', 'g a m: three letters'],
        ['256BAh', '00', 'NULL: keep it'],
      ],
      'Figure 8. Extension-directory offsets point to the dot. The three writable bytes begin one byte later.',
    ),
};
