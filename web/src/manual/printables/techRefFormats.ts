// Byte-layout plates for the Technical Reference. Offsets are decimal and record-relative unless
// the caption says otherwise; the cited source audit lives in programmersGuide/chapters/formats.md.
import { h } from '../../editor/core/ui';
import type { Diagrams } from './markdownBlocks';

type Row = [offset: string, bytes: string, type: string, field: string];

/** A print-sized layout plate, with equal-height rows rather than misleading byte-scaled fields. */
function layout(title: string, rows: Row[], caption: string): HTMLElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  const height = 88 + rows.length * 21;
  svg.setAttribute('viewBox', `0 0 460 ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${title}. ${rows.map((r) => `${r[0]}: ${r[1]} bytes, ${r[2]}, ${r[3]}`).join('; ')}`);
  const rect = document.createElementNS(ns, 'rect');
  for (const [k, v] of Object.entries({ width: '460', height: String(height), fill: '#fff', stroke: '#14304a' })) rect.setAttribute(k, v);
  svg.append(rect);
  const text = (x: number, y: number, words: string, bold = false) => {
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
  text(9, 17, title, true);
  const columns = [9, 91, 152, 225];
  ['Offset', 'Bytes', 'Type', 'Contents'].forEach((s, i) => text(columns[i], 38, s, true));
  rows.forEach((r, i) => {
    const y = 43 + i * 21;
    const rule = document.createElementNS(ns, 'path');
    rule.setAttribute('d', `M0 ${y} H460`);
    rule.setAttribute('stroke', '#14304a');
    rule.setAttribute('stroke-width', '.4');
    svg.append(rule);
    r.forEach((s, j) => text(columns[j], y + 15, s));
  });
  const by = 53 + rows.length * 21;
  text(9, by, 'Byte bits:');
  for (let bit = 7; bit >= 0; bit--) {
    const box = document.createElementNS(ns, 'rect');
    for (const [key, value] of Object.entries({
      x: String(85 + (7 - bit) * 19),
      y: String(by - 12),
      width: '19',
      height: '16',
      fill: '#fff',
      stroke: '#14304a',
      'stroke-width': '.5',
    }))
      box.setAttribute(key, value);
    svg.append(box);
    text(90 + (7 - bit) * 19, by, String(bit));
  }
  text(245, by, 'u8: 8 bits; u16: 16; u32: 32');
  text(9, by + 20, 'Words: low byte first. Signed values: two’s complement.');
  return h('figure', { class: 'tr-fig' }, svg, h('figcaption', null, caption));
}

/** Fixed layouts and nested record details, placed by the booklet's diagram markers. */
export const FORMAT_DIAGRAMS: Diagrams = {
  pal: () =>
    layout(
      'PAL: 768 bytes; no header',
      [
        ['3c', '1', 'u8', 'Red, 0 to 63'],
        ['3c + 1', '1', 'u8', 'Green, 0 to 63'],
        ['3c + 2', '1', 'u8', 'Blue, 0 to 63'],
      ],
      'Color c runs from 0 through 255. A block pixel selects c; it stores no RGB value.',
    ),
  map: () =>
    layout(
      'MAP: 22,000 bytes; no header',
      [
        ['0', '20,000', 'bytes', '100 × 100 cells, row first'],
        ['20,000', '2,000', 'records', '200 placed monsters × 10'],
        ['Cell +0', '1', 'u8', 'BBL block index'],
        ['Cell +1', '1', 'u8', 'Placed slot; 200 = none'],
        ['Slot +0', '1', 'u8', 'MON type; 64 = none'],
        ['Slot +1', '2', 'i16', 'Status (reserved)'],
        ['Slot +3', '1', 'u8', 'Reserved'],
        ['Slot +4', '2', 'i16', 'Map column x'],
        ['Slot +6', '2', 'i16', 'Map row y'],
        ['Slot +8', '2', 'i16', 'Reserved'],
      ],
      'Cell (x,y) starts at 2 × (100y + x). Placed slot m starts at 20,000 + 10m.',
    ),
  block: () =>
    layout(
      'Block record: 420 bytes; no header',
      [
        ['0', '400', 'u8[400]', '20 × 20 palette indexes'],
        ['400', '1', 'u8', 'Birth monster (MON index)'],
        ['401', '2', 'i16', 'Birth interval'],
        ['403', '2', 'bytes', 'Reserved'],
        ['405', '1', 'u8 bits', 'Solid sides'],
        ['406', '1', 'u8 bits', 'Hurt sides (reserved)'],
        ['407', '2', 'i16', 'Score change'],
        ['409', '2', 'i16', 'Hit-point change'],
        ['411', '1', 'u8', 'Next block index'],
        ['412', '2', 'i16', 'Animation interval'],
        ['414', '1', 'u8', 'Touched block index'],
        ['415', '1', 'i8 bits', 'Gravity direction'],
        ['416', '1', 'u8', 'Can be carried'],
        ['417', '1', 'u8', 'Counter index'],
        ['418', '2', 'i16', 'Counter change'],
      ],
      'Record b starts at 420b. Pixel (x,y) is byte 20y + x within that record. Masks 1,2,4,8 mean top,right,bottom,left.',
    ),
  sprites: () =>
    layout(
      'CBL and MBL: the same block record',
      [
        ['CBL 0', '21,000', '50 × 420', 'Character pictures 0 to 49'],
        ['MBL 0', '42,000', '100 × 420', 'Monster pictures 0 to 99'],
        ['Record 0', '400', 'u8[400]', 'Palette indexes; 255 clear'],
        ['Record 400', '20', 'fields', 'Same tail as BBL'],
      ],
      'No count or palette is embedded. CHR selects CBL pictures; MON selects MBL pictures. The scene supplies the palette.',
    ),
  chr: () =>
    layout(
      'CHR: two 3,784-byte character records',
      [
        ['0', '3,784', 'record', 'Character used by player'],
        ['3,784', '3,784', 'record', 'Second character storage'],
        ['Char +0', '3,700', '20 × 185', 'Sequences'],
        ['+3700', '6', 'i16[3]', 'x: cell, pixel, momentum'],
        ['+3706', '6', 'i16[3]', 'y: cell, pixel, momentum'],
        ['+3712', '1', 'i8', 'Current frame'],
        ['+3713', '1', 'i8', 'Current sequence'],
        ['+3714', '10', 'u8[10]', 'Inventory BBL indexes'],
        ['+3724', '60', 'i16[30]', 'Repetition counters'],
      ],
      'No header. Sequence s begins at character base + 185s. Only the first character record is loaded for play.',
    ),
  sequence: () =>
    layout(
      'Sequence: 185 bytes',
      [
        ['0', '170', '10 × 17', 'Frames'],
        ['170', '2', 'i16 bits', 'Key: scan high, ASCII low'],
        ['172', '1', 'i8', 'SND effect index'],
        ['173', '1', 'i8', 'Enabled flag'],
        ['174', '1', 'u8', 'Required BBL inventory item'],
        ['175', '1', 'i8', 'Cannot interrupt flag'],
        ['176', '1', 'i8', 'Joystick button'],
        ['177', '1', 'i8', 'Joystick direction'],
        ['178', '1', 'i8', 'Once per key press'],
        ['179', '1', 'i8', 'Momentum flag'],
        ['180', '5', 'bytes', 'Reserved'],
      ],
      'Sound 30 means no effect; required block 150 means no inventory tie. Sequence 0 is idle, 1 die, 2 hurt, 3 pick up, 4 drop.',
    ),
  frame: () =>
    layout(
      'Character frame: 17 bytes',
      [
        ['0', '2', 'i16', 'x movement in pixels'],
        ['2', '2', 'i16', 'y movement in pixels'],
        ['4', '2', 'u16 bits', 'Top / bottom orientations'],
        ['6', '2', 'u16', 'Top CBL picture index'],
        ['8', '2', 'u16', 'Bottom CBL picture index'],
        ['10', '2', 'u16', 'Pause in game ticks'],
        ['12', '5', 'bytes', 'Reserved'],
      ],
      'Frame f begins at sequence base + 17f. Picture 50 is absent, bottom 51 ends, bottom 100 fires the MON type named by the top field.',
    ),
  mon: () =>
    layout(
      'MON: 64 records of 300 bytes',
      [
        ['0,2,4,6', '8', '4 × i16', 'Used, fly, jump, stick'],
        ['8', '1', 'u8', 'Power'],
        ['9', '1', 'i8', 'Thru (reserved in player)'],
        ['10', '84', '21 pairs', 'MBL picture / ticks: i16s'],
        ['94', '4', 'u32', 'Preview clock'],
        ['98', '1', 'i8', 'Becomes MON type; 64 none'],
        ['99', '2', 'i16', 'Score bonus'],
        ['101', '21', 'bytes', 'Reserved'],
        ['122', '2', 'i16', 'Attack path mode'],
        ['124', '2', 'i16', 'Lifetime / end mode'],
        ['126', '2', 'i16', 'Chase / flee / wander'],
        ['128', '4', 'i16[2]', 'Close (reserved in player)'],
        ['132', '160', '2 × 10 × 8', 'Normal then attack path'],
        ['292', '8', 'corner', 'Preview cursor'],
      ],
      'Type t starts at 300t, no header. Only 20 animation pairs play. A corner is x,y,speed,orientation: four i16s at +0,+2,+4,+6.',
    ),
  gam: () =>
    layout(
      'GAM 3.00: header, scenes, names',
      [
        ['0', '2', 'ASCII', 'GM signature'],
        ['2', '2', 'i16', 'Version: 300'],
        ['4', '1', 'u8', 'Encryption flag'],
        ['5', '1', 'u8', 'File type: 8'],
        ['6', '250', 'bytes', 'Reserved: 52 53 44 repeated'],
        ['256', '2', 'i16', 'Number of scenes N'],
        ['258', '2', 'i16', 'Files per scene: 20'],
        ['260', '2', 'i16', 'Links per scene: 20'],
        ['262', '283N', 'records', 'Scenes in index order'],
        ['P', '2', 'u16', 'Name-pool length L'],
        ['P + 2', 'L', 'strings', 'NULL-terminated file names'],
      ],
      'P = 262 + 283N. File pointers are offsets from P + 2, not from the start of the GAM. Pool byte 0 is an empty name.',
    ),
  scene: () =>
    layout(
      'Scene: 283 bytes',
      [
        ['0', '2', 'u16', 'Kind: 1 start, 2 end, 10 play'],
        ['2', '4', 'i16[2]', 'Integrator diagram x,y'],
        ['6', '4', 'u8[4]', 'Scroll up,down,left,right'],
        ['10', '1', 'u8', 'Scroll style'],
        ['11', '11', 'bytes', 'Reserved'],
        ['22', '1', 'u8', 'Link count'],
        ['23', '20', 'chars', 'Description'],
        ['43', '40', 'u16[20]', 'File-name pool offsets'],
        ['83', '200', '20 × 10', 'Links'],
        ['Link +0', '2', 'u16', 'Destination scene index'],
        ['Link +2', '4', 'i16[2]', 'Source map cell x,y'],
        ['Link +6', '4', 'i16[2]', 'Destination map cell x,y'],
      ],
      'Scene s starts at 262 + 283s; link k at scene + 83 + 10k. Destination 65535 means unused. Diagram coordinates are not map cells.',
    ),
  snd: () =>
    layout(
      'SND: 2,430 bytes; no header',
      [
        ['0', '2,160', '30 × 72', 'Speaker frequency rows'],
        ['2,160', '270', '30 × 9', 'Digital sound stems'],
        ['72e + 2t', '2', 'u16', 'Effect e, step t: hertz'],
        ['2160+9e', '9', 'chars', 'Effect e: VOC stem + NULL'],
      ],
      'e = 0 to 29; t = 0 to 35. A zero frequency is silence. The effect number addresses both tables; the VOC bytes live in another file.',
    ),
  voc: () =>
    layout(
      'VOC: standard header and block stream',
      [
        ['0', '20', 'bytes', 'Voice signature + Ctrl-Z'],
        ['20', '2', 'u16', 'First block offset B'],
        ['22', '2', 'u16', 'Version'],
        ['24', '2', 'u16', 'Version check'],
        ['B', '1', 'u8', 'Block type; 0 ends file'],
        ['B + 1', '3', 'u24', 'Payload length (nonzero type)'],
        ['B + 4', 'length', 'bytes', 'Payload'],
        ['Type 1 +0', '1', 'u8', 'Time constant'],
        ['Type 1 +1', '1', 'u8', 'Codec; 0 = unsigned PCM'],
        ['Type 1 +2', 'rest', 'u8[]', 'Samples; 128 near center'],
      ],
      'Type 1 offsets are relative to its payload. The next block follows the payload. DOS hands blocks to the voice driver.',
    ),
  cmf: () =>
    layout(
      'CMF 1.1: 40-byte header',
      [
        ['0', '4', 'ASCII', 'CTMF signature'],
        ['4', '2', 'u16', 'Version: 0101h'],
        ['6', '2', 'u16', 'Instrument block offset I'],
        ['8', '2', 'u16', 'Music block offset M'],
        ['10', '2', 'u16', 'Ticks per beat'],
        ['12', '2', 'u16', 'Ticks per second: 146'],
        ['14,16,18', '6', '3 × u16', 'Title,composer,remark offsets'],
        ['20', '16', 'u8[16]', 'Channels used'],
        ['36', '2', 'u16', 'Instrument count K'],
        ['38', '2', 'u16', 'Basic tempo'],
        ['I', '16K', 'records', 'FM instrument definitions'],
        ['M', 'to EOF', 'events', 'Delta-time / MIDI commands'],
      ],
      'Instrument p begins at I + 16p. Program-change events select instruments by index. Offsets are absolute file positions.',
    ),
  bkd: () =>
    layout(
      'BKD: IMAGE writes 44 bytes',
      [
        ['0', '2', 'i16', 'Left edge of GIF window'],
        ['2', '2', 'i16', 'Top edge of GIF window'],
        ['4', '40', 'chars', 'GIF name, LF, NULL, tail'],
      ],
      'No signature. The player reads two words, then at most 39 name bytes. Shorter name-only tails also occur in shipped files.',
    ),
  scripts: () =>
    layout(
      'LST and TXT: text bytes, no header',
      [
        ['LST 0', 'variable', 'chars', 'File name [space seconds]'],
        ['Next', '2', 'bytes', 'CR LF ends each line'],
        ['Next line', 'variable', 'chars', 'Another graphic file name'],
        ['TXT 0', 'variable', 'CP437', 'Text with CR LF lines'],
        ['EOF', '0 or 1', 'byte', 'Optional Ctrl-Z EOF (1Ah)'],
      ],
      'LST names select GIF, FLI, BKD, TXT or another list. These are author-supplied text, not binary Scene or FileEntry objects.',
    ),
  rec: () =>
    layout(
      'REC and HIS: no headers',
      [
        ['REC 3e', '2', 'u16', 'Elapsed game ticks'],
        ['3e + 2', '1', 'u8 bits', 'Scan code; bit 7 releases'],
        ['HIS 34r', '4', 'i32', 'Score for rank r'],
        ['34r + 4', '30', 'chars', 'Name, NULL, unused tail'],
      ],
      'REC holds at most 1,000 events (3,000 bytes). HIS always has ten ranks (340 bytes). Neither embeds a game file name.',
    ),
  config: () =>
    layout(
      'Configuration: no headers',
      [
        ['GM.CFG 0', '51', 'chars', 'Working directory + NULL'],
        ['DAT 0', '10', 'i16[5]', 'Joystick x calibration'],
        ['10', '10', 'i16[5]', 'Joystick y calibration'],
        ['20', '2', 'enum16', 'Video selection'],
        ['22', '2', 'enum16', 'Sound selection'],
        ['24', '2', 'u16', 'Sound interrupt'],
        ['26', '2', 'u16', 'Sound I/O port'],
        ['28', '41', 'chars', 'Driver path + NULL'],
        ['69', '431', 'bytes', 'Reserved; total 500'],
      ],
      'DAT means CONFIG.DAT here. Enum sizes follow the shipped 500-byte file and the 16-bit build.',
    ),
  saves: () =>
    layout(
      'DOS saves: fixed prefix, compiler objects',
      [
        ['0', '1', 'u8', 'Active block spawner count'],
        ['1,3,5', '6', '3 × i16', 'Previous scene, scene, link'],
        ['7', '4', 'u32', 'Fast sound clock (≈146 Hz)'],
        ['11', '600', 'u32[150]', 'Block animation times'],
        ['611', '150', 'u8[150]', 'Block index remapping'],
        ['761', 'compiler', 'objects', 'Hero state, CHR, viewport'],
        ['Then', 'compiler', 'objects', '200 live + placed monsters'],
        ['Then', '20,000', 'cells', 'Live MAP grid'],
        ['Then', 'variable', 'objects', 'Flag, spawners, recorder'],
        ['Names 21s', '21', 'chars', 'SAVNAMES.DAT slot label'],
      ],
      'Only the prefix offsets are portable under the 16-bit packed layout. Later offsets depend on compiler objects and far pointers. Names has ten slots, 210 bytes.',
    ),
  transfer: () =>
    layout(
      'Transfer output: copied EXE and CONFIG.BAT',
      [
        ['EXE 0', '2', 'ASCII', 'MZ executable signature'],
        ['EXE 8', '2', 'u16', 'Header size in paragraphs'],
        ['EXE 24', '2', 'u16', 'Relocation table offset'],
        ['EXE H×16', 'to EOF', 'bytes', 'Copied player load image'],
        ['BAT 0', 'variable', 'chars', 'Game stem + space'],
        ['Then', '9', 'ASCII', 'configure'],
        ['Then', '2', 'bytes', 'CR LF'],
      ],
      'UTILITY copies XFERPLAY.EXE under the game name and writes CONFIG.BAT. A DOS paragraph is 16 bytes; the EXE is a program, not a scene container.',
    ),
};
