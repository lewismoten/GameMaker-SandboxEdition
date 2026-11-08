// Render the firmware pad at every size, hand, pressed state and software orientation; optional PPM montage.
#include <algorithm>
#include <assert.h>
#include <stdio.h>
#include <vector>
#include "paddraw.h"
#include "softgfx.h"

struct Frame {
  int mode = 0;
  int originX = 0, originY = 0, width = scr::W, height = scr::H;
  std::vector<uint16_t> px = std::vector<uint16_t>(scr::W * scr::H, 0x2104);
  void drawPixel(int x, int y, uint16_t c) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    x += originX; y += originY;
    assert(x >= 0 && x < scr::W && y >= 0 && y < scr::H);
    sg::Xf xf; xf.mode = mode;
    int a, b; xf.pt(x, y, a, b);
    px[b * (mode ? 240 : scr::W) + a] = c;
  }
  uint16_t at(int x, int y) const {
    sg::Xf xf; xf.mode = mode;
    int a, b; xf.pt(x, y, a, b);
    return px[b * (mode ? 240 : scr::W) + a];
  }
  void drawLine(int x, int y, int x1, int y1, uint16_t c) {
    int dx = abs(x1-x), sx = x < x1 ? 1 : -1, dy = -abs(y1-y), sy = y < y1 ? 1 : -1, e = dx+dy;
    for (;;) { drawPixel(x,y,c); if (x == x1 && y == y1) break; int e2 = 2*e; if (e2 >= dy) { e += dy; x += sx; } if (e2 <= dx) { e += dx; y += sy; } }
  }
  void drawTriangle(int a, int b, int c, int d, int e, int f, uint16_t col) {
    drawLine(a,b,c,d,col); drawLine(c,d,e,f,col); drawLine(e,f,a,b,col);
  }
  void fillTriangle(int a, int b, int c, int d, int e, int f, uint16_t col) {
    auto cross = [](int x, int y, int u, int v, int p, int q) { return (u-x)*(q-y)-(v-y)*(p-x); };
    for (int y = std::min({b,d,f}); y <= std::max({b,d,f}); y++) for (int x = std::min({a,c,e}); x <= std::max({a,c,e}); x++) {
      int s = cross(a,b,c,d,x,y), t = cross(c,d,e,f,x,y), u = cross(e,f,a,b,x,y);
      if ((s >= 0 && t >= 0 && u >= 0) || (s <= 0 && t <= 0 && u <= 0)) drawPixel(x,y,col);
    }
  }
  void drawCircle(int x, int y, int r, uint16_t c) {
    for (int j = -r; j <= r; j++) for (int i = -r; i <= r; i++) {
      int d = i*i+j*j;
      if (d <= r*r && d > (r-1)*(r-1)) drawPixel(x+i,y+j,c);
    }
  }
};

int main(int argc, char** argv) {
  const int mw = scr::W * 4, mh = scr::VIEW_H * 3;
  std::vector<unsigned char> montage(mw * mh * 3, 0);
  uint32_t hash = 2166136261u;
  for (int size = 0; size < 3; size++) for (int hand = 0; hand < 2; hand++) for (int pressed = 0; pressed < 2; pressed++) {
    ctl::Settings s; s.padSize = size; s.lefty = hand; s.arcs = 1;
    ctl::Need n; n.left = n.right = n.up = n.down = n.jump = true;
    auto l = ctl::makeLayout(s,n);
    Frame base; paddraw::pad(base,l,n,pressed ? 5 : 0);
    for (auto p : base.px) { hash = (hash ^ (p & 255)) * 16777619u; hash = (hash ^ (p >> 8)) * 16777619u; }
    // The firmware clips each sprite band; composing offset bands must match a full render.
    Frame bands;
    bands.width = scr::W / 2; bands.height = 10;
    for (int by = 0; by < scr::H; by += bands.height) for (int bx = 0; bx < scr::W; bx += bands.width) {
      bands.originX = bx; bands.originY = by;
      paddraw::pad(bands,l,n,pressed ? 5 : 0,bx,by);
    }
    assert(bands.px == base.px);
#ifdef POCKET_CYD28
    for (int mode : {1,2}) {
      Frame rotated; rotated.mode = mode; paddraw::pad(rotated,l,n,pressed ? 5 : 0);
      for (int y = 0; y < scr::H; y++) for (int x = 0; x < scr::W; x++) assert(rotated.at(x,y) == base.at(x,y));
    }
    // Both arcs mirror exactly, retain a raised crest and an outer landing arrow.
    for (int side : {-1,1}) {
      Frame arc; int cx = l.pad.cx + side*l.pad.r/2, cy = l.pad.cy-l.pad.r/2;
      paddraw::jumpArc(arc,cx,cy,side,10,pressed);
      assert(arc.at(cx+side*1,cy-6) == (pressed ? paddraw::C_BLACK : paddraw::C_WHITE));  // the crest's outline
      assert(arc.at(cx+side*5,cy+5) == (pressed ? 0xff2a : paddraw::C_FILL) || arc.at(cx+side*5,cy+5) == paddraw::C_WHITE || arc.at(cx+side*5,cy+5) == paddraw::C_BLACK);  // the arrowhead is there
      assert(arc.at(cx,cy+2) == 0x2104);  // open air under the ring, unlike a straight arrow
      assert(arc.at(cx,cy-5) == (pressed ? 0xff2a : paddraw::C_FILL));  // a solid body, not an outline
    }
#endif
    for (int y = 0; y < scr::VIEW_H; y++) for (int x = 0; x < scr::W; x++) {
      auto p = base.at(x,y); size_t o = ((size * scr::VIEW_H+y)*mw+(hand*2+pressed)*scr::W+x)*3;
      montage[o] = (p>>11)*255/31; montage[o+1] = ((p>>5)&63)*255/63; montage[o+2] = (p&31)*255/31;
    }
  }
  if (argc > 1) { FILE* f = fopen(argv[1],"wb"); assert(f); fprintf(f,"P6\n%d %d\n255\n",mw,mh); fwrite(montage.data(),1,montage.size(),f); fclose(f); }
#ifdef POCKET_CYD28
  assert(hash == 0x5bbdbe5du);
#else
  assert(hash == 0x51007735u);
#endif
  printf("pad %dx%d snapshot %08x: sizes, hands, states, origins and orientations ok\n",scr::W,scr::H,hash);
}
