// Picker rows, icons and title-search keyboard, rendered by both firmware and host/setupshots.cpp.
#pragma once
#include <stdint.h>
#include "picker.h"
namespace pk {
constexpr uint16_t C_WHITE = 0xFFFF, C_BLACK = 0, C_YELLOW = 0xFF2A, C_GRAY = 0x7BEF, C_DARK = 0x2104;
template <class G> void drawButton(G& g, int x0, int y0, int x1, int y1, const char* label) {
  g.fillRoundRect(x0, y0, x1 - x0, y1 - y0, 6, C_DARK);
  g.drawRoundRect(x0, y0, x1 - x0, y1 - y0, 6, C_WHITE);
  g.setTextSize(2); g.setTextColor(C_WHITE, C_DARK);
  g.setCursor((x0 + x1) / 2 - (int)strlen(label) * 6, (y0 + y1) / 2 - 8); g.print(label);
}
// Icon buttons are 44 pixels wide or larger on both boards.
template <class G> void drawIcon(G& tft, int slot, int W, int H, int footer) {
  int x0 = 6 + slot * (W / 4), x1 = x0 + W / 4 - 12;
  int cy = (footer + H) / 2, cx = (x0 + x1) / 2;
  drawButton(tft, x0, footer + 2, x1, H - 2, "");
  if (slot < 2) {
    int d = slot ? 1 : -1;
    tft.fillRect(cx - 12, cy - 2, 24, 4, C_WHITE);
    tft.fillTriangle(cx + d * 14, cy, cx, cy - 10, cx, cy + 10, C_WHITE);
  } else if (slot == 2) {
    // A three-pixel ring and a short 45-degree handle, centered as one silhouette.
    tft.fillCircle(cx - 3, cy - 3, 10, C_WHITE);
    tft.fillCircle(cx - 3, cy - 3, 7, C_DARK);
    for (int d = 4; d <= 11; d++) tft.fillRect(cx + d - 1, cy + d - 1, 3, 3, C_WHITE);
  } else {
    for (int i = -1; i <= 1; i += 2) {
      tft.fillRect(cx - 3, cy + i * 10 - 3, 6, 6, C_WHITE);
      tft.fillRect(cx + i * 10 - 3, cy - 3, 6, 6, C_WHITE);
      for (int j = -1; j <= 1; j += 2) tft.fillRect(cx + i * 7 - 2, cy + j * 7 - 2, 4, 4, C_WHITE);
    }
    tft.fillCircle(cx, cy, 10, C_WHITE); tft.fillCircle(cx, cy, 4, C_DARK);
  }
}
template <class G> void drawRow(G& tft, const char* text, bool sd, int W, int y, int height) {
    char l[96];
    pk::ellipsize(text, l, sizeof l, (W - 32 - (sd ? 36 : 0)) / 12);
    tft.fillRoundRect(6, y, W - 12, height, 6, C_DARK);
    tft.drawRoundRect(6, y, W - 12, height, 6, C_GRAY);
    tft.setTextColor(C_WHITE, C_DARK); tft.setTextSize(2);
    tft.setCursor(16, y + (height - 16) / 2); tft.print(l);
    if (sd) {
      tft.setTextColor(C_YELLOW, C_DARK);
      tft.setCursor(W - 40, y + (height - 16) / 2); tft.print("SD");
    }
}
// Repaint directly on the dark backing; only an empty slot needs erasing.
template <class G> void drawPageRow(G& tft, const char* text, bool sd, int W, int y, int height) {
  if (text) drawRow(tft, text, sd, W, y, height);
  else tft.fillRect(6, y, W - 12, height, C_BLACK);
}
// Preserve the common prefix and erase only the edited suffix and old caret. The keyboard
// and title are painted once on entry; even Clear never clears beyond this 16-pixel line.
template <class G> void drawSearchText(G& tft, int titleH, const char* text, const char* previous = nullptr) {
  if (previous && !strcmp(text, previous)) return;
  const char* shown = text[0] ? text : "Type a title";
  const char* old = previous && previous[0] ? previous : "Type a title";
  size_t prefix = 0;
  if (previous && text[0] && previous[0])
    while (text[prefix] && text[prefix] == previous[prefix]) prefix++;
  size_t width = strlen(shown), oldWidth = strlen(old);
  if (oldWidth > width) width = oldWidth;
  tft.fillRect(8 + prefix * 12, titleH + 4, (width - prefix) * 12 + 2, 16, C_BLACK);
  tft.setTextSize(2); tft.setTextColor(C_WHITE, C_BLACK);
  tft.setCursor(8 + prefix * 12, titleH + 4); tft.print(shown + prefix);
  tft.fillRect(8 + strlen(shown) * 12, titleH + 4, 2, 16, C_WHITE);
}
template <class G> void drawKeyboard(G& tft, int W, int H, int titleH, const char* text) {
  drawSearchText(tft, titleH, text);
  const char* keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  int top = titleH + 26, step = (H - top - 38) / 4;
  for (int i = 0; i < 36; i++) {
    char label[2] = {keys[i], 0};
    drawButton(tft, i % 9 * W / 9 + 2, top + i / 9 * step, (i % 9 + 1) * W / 9 - 2, top + (i / 9 + 1) * step - 2, label);
  }
  for (int i = 0; i < 4; i++) drawButton(tft, i * W / 4 + 2, H - 36, (i + 1) * W / 4 - 2, H - 2, i == 0 ? "Space" : i == 1 ? "Del" : i == 2 ? "Clear" : "Done");
}
}  // namespace pk

// Shared six-slot layout and clipped bitmap text: no font wrapping or page framebuffer.
#include "softfont.h"
#include "icons_data.h"
#include "favorites.h"
namespace pk {
struct Tile { int x,y,w,h,pw,ph; };
inline Tile tile(int W,int i) { bool s=W==320;return {(s?12:16)+i%3*(s?100:152),(s?36:40)+i/3*(s?84:120),s?96:144,s?80:112,s?96:144,s?60:90}; }
inline int footer(int W) {return W==320?208:280;}
inline int hitTile(int W,int x,int y) {for(int i=0;i<6;i++){auto r=tile(W,i);if(x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)return i;}return -1;}
template<class G> void clippedText(G&g,const Tile&r,const char*s,int x,int y,int scale,uint16_t color) {
  for(;*s;s++,x+=6*scale)for(int yy=0;yy<8;yy++)for(int xx=0;xx<6;xx++)if(((unsigned char)*s>=32&&(unsigned char)*s<=126&&(SOFT_FONT[(unsigned char)*s-32][yy]&(1<<xx))))
    for(int dy=0;dy<scale;dy++)for(int dx=0;dx<scale;dx++){int px=x+xx*scale+dx,py=y+yy*scale+dy;if(px>=r.x&&px<r.x+r.w&&py>=r.y&&py<r.y+r.h)g.fillRect(px,py,1,1,color);}
}
// A category icon (icons_data.h) at 2x, centered on cx, top at y; transparent pixels take the tile color. panelOrder swaps bytes for the panel.
template<class G> void drawTileIcon(G&g,int icon,int cx,int y,bool panelOrder=false) {
  uint16_t row[32];
  for(int sy=0;sy<16;sy++) {
    for(int sx=0;sx<16;sx++){uint8_t v=ICONS[icon][sy*16+sx];uint16_t c=v?ICON_PALETTE[v]:C_DARK;if(panelOrder)c=(c<<8)|(c>>8);row[sx*2]=row[sx*2+1]=c;}
    g.pushImage(cx-16,y+sy*2,32,1,row);g.pushImage(cx-16,y+sy*2+1,32,1,row);
  }
}
// The same icon at 1x on the dark button backing, top left at x, y.
template<class G> void drawSmallIcon(G&g,int icon,int x,int y,bool panelOrder=false) {
  uint16_t row[16];
  for(int sy=0;sy<16;sy++){for(int sx=0;sx<16;sx++){uint8_t v=ICONS[icon][sy*16+sx];uint16_t c=v?ICON_PALETTE[v]:C_DARK;if(panelOrder)c=(c<<8)|(c>>8);row[sx]=c;}g.pushImage(x,y+sy,16,1,row);}
}
// icon < 0: the name alone. The icon is dropped when the name needs its room.
template<class G> void tileLabel(G&g,int W,int i,const char*label,bool selected=false,int icon=-1,bool panelOrder=false) {
  auto r=tile(W,i);g.fillRect(r.x,r.y,r.w,r.h,C_DARK);g.drawRect(r.x,r.y,r.w,r.h,selected?C_YELLOW:C_GRAY);
  int scale=W==320?1:2,cols=(r.w-8)/(6*scale),count=0;size_t at=0,len=strlen(label);char lines[4][25];
  while(count<4&&at<len) {size_t n=len-at<(size_t)cols?len-at:cols;
    if(at+n<len){size_t word=n;while(word&&label[at+word]!=' ')word--;if(word)n=word;}
    memcpy(lines[count],label+at,n);lines[count][n]=0;count++;at+=n;while(label[at]==' ')at++;
  }
  int text=count*10*scale,icons=icon>=0&&icon<ICON_COUNT&&text+36<=r.h-4?36:0;
  int y=r.y+(r.h-text-icons)/2;
  if(icons){drawTileIcon(g,icon,r.x+r.w/2,y,panelOrder);y+=icons;}
  for(int line=0;line<count;line++,y+=10*scale)clippedText(g,r,lines[line],r.x+(r.w-(int)strlen(lines[line])*6*scale)/2,y,scale,C_WHITE);
}
template<class G> void clearTiles(G&g,int W) {g.fillRect(0,32,W,footer(W)-32,C_BLACK);}
// A favorite's mark: a yellow star with a dark ring in the tile's top-right corner (over the picture's sky, never its middle).
template<class G> void starMark(G&g,int W,int i) {auto r=tile(W,i);int R=W==320?7:9;drawStar(g,r.x+r.w-R-3,r.y+R+3,R+2,C_BLACK);drawStar(g,r.x+r.w-R-3,r.y+R+3,R,C_YELLOW);}
// A Starter's caption under its picture: the course number in yellow, then the title in white, word-wrapped onto two lines
// of the 6 x 8 font, doubled on the 3.5 inch board's wider tiles (the title picture's own lettering is too small to read at tile size). Lines are cut with "..." to fit.
template<class G> void tileCaption(G&g,const Tile&r,int y,const char*title,int course) {
  int k2=r.w>=144?2:1,cols=(r.w-4)/(6*k2),x=r.x+2;char num[8]="";if(course>0)snprintf(num,sizeof num,"%d ",course);
  int used=(int)strlen(num);clippedText(g,r,num,x,y,k2,C_YELLOW);
  const char*t=title;while(*t==' ')t++;int len=(int)strlen(t),first=cols-used;
  if(first<1)first=1;
  int cut=len<=first?len:first;  // the first line breaks at the last space that fits
  if(len>first){for(int k=first;k>0;k--)if(t[k]==' '){cut=k;break;}}
  char a[64];int n=cut<(int)sizeof a-1?cut:(int)sizeof a-1;memcpy(a,t,n);a[n]=0;
  clippedText(g,r,a,x+used*6*k2,y,k2,C_WHITE);
  const char*rest=t+cut;while(*rest==' ')rest++;
  if(*rest){char b[64];ellipsize(rest,b,sizeof b,(size_t)cols);clippedText(g,r,b,x,y+9*k2,k2,C_WHITE);}
}
// caption: a Starter's title (with its course number, 0 for none) drawn as text under the picture, which then sits at the top.
template<class G> void thumbnail(G&g,int W,int i,const uint8_t*raw,const char*dos,bool selected,bool panelOrder=false,bool pinned=false,
                                 const char*caption=nullptr,int course=0) {
  auto r=tile(W,i);g.fillRect(r.x,r.y,r.w,r.h,C_DARK);int y0=raw&&caption?r.y+1:r.y+(r.h-r.ph)/2;
  int shown=caption?r.ph*5/6:r.ph;  // a caption covers the picture's bottom sixth (a Starter's own "COURSE nnn" band)
  if(raw){uint16_t row[144];for(int y=0;y<shown;y++){
    for(int x=0;x<r.pw;x++){int idx=raw[524+(y*60/r.ph)*96+x*96/r.pw];uint16_t c=raw[12+idx*2]|(raw[13+idx*2]<<8);row[x]=panelOrder?(c<<8)|(c>>8):c;}
    g.pushImage(r.x,y0+y,r.pw,1,row);
  }if(caption)tileCaption(g,r,y0+shown+(r.w>=144?2:3),caption,course);
  }else clippedText(g,r,dos,r.x+(r.w-(int)strlen(dos)*6)/2,r.y+r.h/2-4,1,C_WHITE);  // no title picture: the DOS name; a picture is shown whole
  g.drawRect(r.x,r.y,r.w,r.h,selected?C_YELLOW:C_GRAY);
  if(pinned)starMark(g,W,i);
}
// Details' footer: Back, the Favorite star (a toggle: outlined, or filled when the game is a favorite) and Play, in thirds.
inline int detailsButton(int W,int x) {return x<W/3?0:x<2*W/3?1:2;}
template<class G> void detailsFooter(G&g,int W,int H,bool pinned) {
  int y0=H-38;drawButton(g,0,y0,W/3-2,H,"Back");drawButton(g,2*W/3,y0,W,H,"Play");drawButton(g,W/3,y0,2*W/3-2,H,"");
  bool s=W==320;int scale=s?1:2,R=s?9:11,tw=8*6*scale,x=W/3+(W/3-2-(2*R+6+tw))/2,cy=(y0+H)/2;
  drawStar(g,x+R,cy,R,C_YELLOW,!pinned,C_DARK);
  Tile clip={W/3,y0,W/3-2,38,0,0};clippedText(g,clip,"Favorite",x+2*R+6,cy-4*scale,scale,pinned?C_YELLOW:C_WHITE);
}
// An empty Favorites page: how to star a game, or (hidden) that the starred games are on a card that is not in.
template<class G> void emptyFavorites(G&g,int W,bool hidden) {
  Tile clip={8,40,W-16,80,0,0};int scale=W==320?1:2;
  drawStar(g,24,64,12,C_YELLOW,true,C_BLACK);
  clippedText(g,clip,hidden?"Your favorites are on a card":"No favorites yet.",44,48,scale,C_WHITE);
  clippedText(g,clip,hidden?"that is not in right now.":"Open a game's Details",44,48+10*scale,scale,C_WHITE);
  if(!hidden)clippedText(g,clip,"and tap the star.",44,48+20*scale,scale,C_WHITE);
}
// Details: the buttons for the game's own pages (picker.h detailsPageSpan). Text is 6 by 8 on the small board, 12 by 16 on the large.
template<class G> void detailsPages(G&g,int W,int H,int mask) {
  int y0=detailsPagesTop(H),y1=detailsPagesBottom(H),scale=W==320?1:2;
  for(int k=0,x0,x1;k<DETAILS_PAGES;k++){if(!detailsPageSpan(W,mask,k,x0,x1))continue;
    g.fillRoundRect(x0,y0,x1-x0,y1-y0,6,C_DARK);g.drawRoundRect(x0,y0,x1-x0,y1-y0,6,C_WHITE);
    const char*l=detailsPageLabel(k);g.setTextSize(scale);g.setTextColor(C_WHITE,C_DARK);
    g.setCursor((x0+x1)/2-(int)strlen(l)*3*scale,(y0+y1)/2-4*scale);g.print(l);}
}
// A line under the title in Details: whether the game is a favorite, or that the list is full.
template<class G> void detailsNote(G&g,int W,int H,const char*note) {
  Tile clip={8,H-58,W-16,16,0,0};g.fillRect(8,H-58,W-16,16,C_BLACK);clippedText(g,clip,note,8,H-54,1,C_YELLOW);
}
// The home page's first tile, Continue: the game's title picture (raw: its thumbnail, or null), "Continue" and the level
// (0 based). cardOut: the game is on a card that is not in, so the tile says to put it back instead.
template<class G> void continueTile(G&g,int W,int i,const uint8_t*raw,int level,bool cardOut,bool panelOrder=false) {
  if(cardOut){tileLabel(g,W,i,"Put the card back to continue",false,-1,panelOrder);return;}
  auto r=tile(W,i);bool s=W==320;int scale=s?1:2,pw=s?64:96,ph=s?40:60,px0=r.x+(r.w-pw)/2,y=r.y+4;
  g.fillRect(r.x,r.y,r.w,r.h,C_DARK);
  if(raw){uint16_t row[144];for(int yy=0;yy<ph;yy++){
    for(int x=0;x<pw;x++){int idx=raw[524+(yy*60/ph)*96+x*96/pw];uint16_t c=raw[12+idx*2]|(raw[13+idx*2]<<8);row[x]=panelOrder?(c<<8)|(c>>8):c;}
    g.pushImage(px0,y+yy,pw,1,row);
  }}else{int cx=r.x+r.w/2,cy=y+ph/2,h=ph/3;g.fillTriangle(cx-h/2,cy-h,cx-h/2,cy+h,cx+h,cy,C_WHITE);}  // no picture: a play sign
  g.drawRect(px0-1,y-1,pw+2,ph+2,C_GRAY);
  y+=ph+4;char lv[16];snprintf(lv,sizeof lv,"Level %d",level+1);
  clippedText(g,r,"Continue",r.x+(r.w-8*6*scale)/2,y,scale,C_YELLOW);
  clippedText(g,r,lv,r.x+(r.w-(int)strlen(lv)*6*scale)/2,y+10*scale,scale,C_WHITE);
  g.drawRect(r.x,r.y,r.w,r.h,C_GRAY);
}
// The title bar's Search and Settings icons, 20 x 20 one-bit pictures (bit 19 is the left column), the same on both boards:
// a magnifier (a round lens with a thick handle at 45 degrees) and a gear with eight teeth and a round hole.
constexpr uint32_t MAGNIFIER20[20] = {0x00000,0x07E00,0x1FF80,0x3C3C0,0x381C0,0x700E0,0x700E0,0x700E0,0x700E0,0x700E0,
  0x700E0,0x381C0,0x3C3C0,0x1FFF0,0x07E78,0x0003C,0x0001E,0x0000F,0x00007,0x00003};
constexpr uint32_t GEAR20[20] = {0x00F00,0x00F00,0x18F18,0x3CF3C,0x3FFFC,0x1FFF8,0x0FFF0,0x0F0F0,0xFE07F,0xFE07F,
  0xFE07F,0xFE07F,0x0F0F0,0x0FFF0,0x1FFF8,0x3FFFC,0x3CF3C,0x18F18,0x00F00,0x00F00};
template<class G> void drawBits20(G&g,int x0,int y0,const uint32_t*rows,uint16_t c=C_WHITE) {
  for(int y=0;y<20;y++)for(int x=0;x<20;){if(!(rows[y]>>(19-x)&1)){x++;continue;}int e=x;while(e<20&&(rows[y]>>(19-e)&1))e++;g.fillRect(x0+x,y0+y,e-x,1,c);x=e;}
}
template<class G> void libraryFrame(G&g,int W,int H,const char*breadcrumb,int page,int pages,const char*action,bool back=true) {
  // back=false on the root page (nothing above it); action=nullptr leaves the right-hand footer button off
  g.fillRect(0,0,W,32,C_DARK);if(back)drawButton(g,0,0,32,32,"<");
  int bx=back?36:8;Tile clip={bx,0,W-68-bx,32,0,0};clippedText(g,clip,breadcrumb,bx,12,1,C_WHITE);
  drawButton(g,W-64,0,W-32,32,"");drawButton(g,W-32,0,W,32,"");
  drawBits20(g,W-58,6,MAGNIFIER20);drawBits20(g,W-26,6,GEAR20);
  int f=footer(W);g.fillRect(0,f,W,H-f,C_BLACK);drawButton(g,0,f,48,H,"<");drawButton(g,50,f,98,H,">");
  char count[24];snprintf(count,sizeof count,"%d/%d",page+1,pages?pages:1);
  Tile c={102,f,W-204,H-f,0,0};clippedText(g,c,count,108,f+(H-f-8)/2,1,C_WHITE);if(action)drawButton(g,W-100,f,W,H,action);
}
} // namespace pk
