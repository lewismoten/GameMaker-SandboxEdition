// What a key's button should show besides its name: the picture of what the key throws or uses.
// The engine decides it the way PLAYGAME does (gmcore.h simKeyPress): a character sequence is tied to a
// key (seqKey) and, when it needs an inventory object, to that object's block (seqBloc; enabled in
// seqon while the object is carried). A frame whose second picture is MONBL fires monster `pic1` (a
// shot, a star, a bomb); that monster's first picture is what is thrown. Pure code, tested on the Mac.
#pragma once
#include "gmcore.h"

namespace gm {

struct BtnIcon {
  const uint8_t* px = nullptr;  // 20 x 20 palette indices (255 = see-through), or null: no picture
  int sig = 0;                  // changes when the picture does (0: none)
};

inline BtnIcon iconForKey(const World& w, int scan) {
  BtnIcon r;
  if (!w.chr) return r;
  int q = -1;
  for (int s = 0; s < MAXSEQ; s++) {  // the sequence a press would start: the first enabled one with meter left
    if ((w.seqKey(s) >> 8) != scan || !w.seqon[s]) continue;
    if (q < 0) q = s;
    if (w.meter[s] > 0) { q = s; break; }
  }
  if (q < 0) return r;
  const uint8_t* sq = w.seqRaw(q);
  for (int f = 0; f < MAXFRAME; f++) {
    const uint8_t* p = sq + f * FRAME_BYTES;
    if (u16(p + 8) != MONBL) continue;
    const uint8_t* mo = w.monAt(u16(p + 6) & 0xff);
    if (!mo || !w.mbl) break;
    for (int i = 0; i < LASTSL; i++) {
      int pic = mon::pic(mo, i);
      if (pic >= 0 && pic < MONBL && pic < w.nmbl) {
        r.px = w.mbl + pic * BLOCK_BYTES;
        r.sig = 0x10000 + (u16(p + 6) & 0xff) * 64 + i + 1;
        return r;
      }
    }
    break;
  }
  int b = w.seqBloc(q);
  if (b != BACKBL && b >= 0 && b < w.nbl && w.bbl) {
    r.px = w.bbl + b * BLOCK_BYTES;
    r.sig = 0x20000 + b;
  }
  return r;
}

}  // namespace gm
