// The Face Dial's colors: for each face in faces.ts, twelve rows of twelve letters laid over its '#'/'.' picture
// (the ink outline stays, so a gray print still reads). A letter is a color from FILL_COLORS drawn under the cell;
// '.' is none; a CAPITAL letter paints over an ink cell too (a red nose, a green feather, a beak). Rows 0 to 5 are
// the top half (big disc), rows 6 to 11 the bottom half (small disc), so a joined face is one colored picture.
// printables.json carries a copy (web/src/manual/printables/teddyDecoder.test.ts checks they match).

export const FILL_COLORS: Record<string, string> = {
  r: '#e0262b', // clown red: noses, mouths
  p: '#f58fb8', // rouge pink
  y: '#ffd23a',
  o: '#f28a1e',
  g: '#35ad55',
  b: '#2f6fd6',
  u: '#8a52c8',
  c: '#bfe6ff', // glass blue
  w: '#ffffff', // face paint white
  s: '#f4c9a0', // skin
  a: '#e39a4c', // corgi tan
  m: '#fff4dc', // corgi cream
  n: '#9a7048', // Gwinn's shaggy brown
  d: '#6a3f1e', // hat brown
  f: '#e6e9ee', // goose feathers
};

export const FACE_FILLS: Record<string, string[]> = {
  Teddy: [
    '............',
    '.aa.amma.aa.',
    '.aaa....aaa.',
    '.aaaammaaaa.',
    '.a..ammma.a.',
    '.aaaammmmaa.',
    '..mmm..mmm..',
    '..mm....mm..',
    '...m.pp.m...',
    '...m.pp.m...',
    '............',
    '.....pp.....',
  ],
  Gwinn: [
    '.n.nn.n.....',
    '..n.n.n.n...',
    '..nn...nn.n.',
    '.nnnnnnnnnn.',
    '.nn..nn..nn.',
    '.nnnnnnnnnn.',
    '..nnn..nnn..',
    '..nn....nn..',
    '...n.rr.n...',
    '...nn..nn...',
    '....rrrr....',
    '............',
  ],
  'Doc Leo': [
    '.....YY.....',
    '............',
    '....b..b....',
    '...bb..bb...',
    '............',
    '.wwwwwwwwww.',
    '.w..wwww..w.',
    '.wwwwwwwwww.',
    '..ppRRRRpp..',
    '..wwwRRwww..',
    '...w....w...',
    '............',
  ],
  Juggles: [
    'o.g.b..u.r.o',
    '.r.y.gg.b.u.',
    '.oooooooooo.',
    '.oo.wwww.oo.',
    '.o.wwwwww.o.',
    '.owwwwwwwwo.',
    '..o......o..',
    '..ppRRRRpp..',
    '...wwwwww...',
    '...w....w...',
    '....rrrr....',
    '............',
  ],
  Honker: [
    '.....rr.....',
    '..rrr..rrr..',
    '..rrr..rrr..',
    '............',
    '..ssssssss..',
    '.ssssssssss.',
    '.s..ssss..s.',
    '.ssssssssss.',
    '.s........s.',
    '............',
    '...ssssss...',
    '............',
  ],
  Pratfall: [
    '............',
    '............',
    '...bbbbbb...',
    '............',
    '.ssssssssss.',
    '.s...ss...s.',
    '.s.c.ss.c.s.',
    '.s...ss...s.',
    '.ssssssssss.',
    '..s..rr..s..',
    '...ssssss...',
    '............',
  ],
  Crier: [
    '............',
    '.....GG.....',
    '.....GG.....',
    '............',
    '............',
    '.ssssssssss.',
    '.s..ssss..s.',
    '.ssssrrssss.',
    '.ss.ssss.ss.',
    '.s........s.',
    '..w.w..w.w..',
    '...w.ww.w...',
  ],
  Goose: [
    '.....ff.....',
    '..fff..fff..',
    '.ffff..ffff.',
    '.ff..ff..ff.',
    '.f.f.ff.f.f.',
    '.f.ffffff.f.',
    '.f.f....f.f.',
    '....fOOf....',
    '..ffOOOOff..',
    '..fffOOfff..',
    '...ffOOff...',
    '............',
  ],
  Poodle: [
    '.....pp.....',
    '...pp..pp...',
    '..p..pp..p..',
    '.pp.pppp.pp.',
    '..pppppppp..',
    '..p..pp..p..',
    '..pppppppp..',
    '..ww....ww..',
    '...w.ww.w...',
    '...w.rr.w...',
    '.pp......pp.',
    '....pppp....',
  ],
};
