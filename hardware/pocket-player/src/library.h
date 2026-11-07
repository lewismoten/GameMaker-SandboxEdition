// Bounded optional library JSON and compact menu records. No game assets are opened to search.
#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <initializer_list>
namespace pk {
inline bool digit(char c) { return c>='0'&&c<='9'; }
inline bool alnum(char c) { return digit(c)||(c>='A'&&c<='Z')||(c>='a'&&c<='z'); }
constexpr int MAX_GAMES = 512, MAX_COLLECTIONS = 24;
struct Entry {
  char id[28], file[16];
  uint8_t uid[16];
  uint32_t pos;
  uint16_t len, course;
  uint8_t category, sub, score;
  bool sd, one, metadata, scored;
};
// Cache is disposable and separate from packages/personal data. Validate every row before reuse.
inline uint32_t crc32(const void* data,size_t n) {uint32_t c=0xffffffff;const uint8_t*p=(const uint8_t*)data;while(n--){c^=*p++;for(int i=0;i<8;i++)c=(c>>1)^((c&1)?0xedb88320:0);}return c^0xffffffff;}
struct Cached { Entry game; uint32_t size, modified, checksum; };
inline bool cached(const Cached&r,uint32_t size,uint32_t modified,const char*name) {
  return r.checksum==crc32(&r,offsetof(Cached,checksum))&&r.game.file[15]==0&&r.game.id[27]==0&&r.game.category<=6&&r.size==size&&r.modified==modified&&r.game.one&&r.game.sd&&!strcmp(r.game.file,name);
}
struct Collection { char slug[33], label[49]; };
struct Catalog { Entry games[MAX_GAMES]; uint16_t matches[MAX_GAMES]; Collection collections[MAX_COLLECTIONS]; };
static_assert(sizeof(Catalog) <= 48 * 1024, "menu budget");
constexpr int THUMB_RAW = 6284;
static_assert(THUMB_RAW + 144 * 2 < 8192, "preview scratch budget");
struct Meta {
  char uid[97] = "", title[129] = "", dos[9] = "", root[33] = "", sub[33] = "", label[49] = "", thumb[32] = "", crc[9] = "";
  int course = 0, score = 0;
  bool scored = false;
};
// Own small JSON reader: bounded input/depth, escaped Unicode decoded to UTF-8, unknown values skipped.
struct Json {
  const char* p; const char* end; bool ok = true;
  Json(const char* s, size_t n): p(s), end(s+n) {}
  void ws() { while (p < end && (*p==' ' || *p=='\r' || *p=='\n' || *p=='\t')) p++; }
  bool take(char c) { ws(); if (p < end && *p == c) { p++; return true; } return false; }
  int hex() { if (p==end) { ok=false; return 0; } char c=*p++; if(c>='0'&&c<='9')return c-'0'; if(c>='a'&&c<='f')return c-'a'+10;if(c>='A'&&c<='F')return c-'A'+10;ok=false;return 0; }
  unsigned code() { unsigned c=0; for(int i=0;i<4;i++)c=c*16+hex(); return c; }
  bool str(char* out, size_t cap) {
    if(!take('"'))return ok=false;
    size_t n=0;
    auto put=[&](char c){ if(out && !c)ok=false; if(out && n+1<cap)out[n]=c; n++; };
    while(p<end && *p!='"') {
      unsigned char c=*p++;
      if(c<32)return ok=false;
      if(c!='\\') { put(c); continue; }
      if(p==end)return ok=false;
      c=*p++;
      if(c=='u') {
        unsigned u=code();
        if(u>=0xd800&&u<=0xdbff) { if(end-p<6 || *p++!='\\' || *p++!='u')return ok=false; unsigned l=code(); if(l<0xdc00||l>0xdfff)return ok=false;u=0x10000+((u-0xd800)<<10)+(l-0xdc00); }
        else if(u>=0xdc00&&u<=0xdfff)return ok=false;
        if(u<128)put(u); else if(u<2048){put(0xc0|(u>>6));put(0x80|(u&63));} else if(u<65536){put(0xe0|(u>>12));put(0x80|((u>>6)&63));put(0x80|(u&63));}else{put(0xf0|(u>>18));put(0x80|((u>>12)&63));put(0x80|((u>>6)&63));put(0x80|(u&63));}
      } else if(c=='"'||c=='\\'||c=='/')put(c);
      else { const char* a="bfnrt";const char* q=strchr(a,c);if(!q)return ok=false;put("\b\f\n\r\t"[q-a]); }
    }
    if(p==end)return ok=false;p++;
    if(out){if(n>=cap)return ok=false;out[n]=0;}
    return ok;
  }
  bool skip(int depth=0) {
    if(depth>8)return ok=false;ws();if(p==end)return ok=false;
    if(*p=='"')return str(nullptr,0);
    if(take('{')){if(take('}'))return true;do{if(!str(nullptr,0)||!take(':')||!skip(depth+1))return ok=false;}while(take(','));return take('}')?ok:ok=false;}
    if(take('[')){if(take(']'))return true;do{if(!skip(depth+1))return false;}while(take(','));return take(']')?ok:ok=false;}
    for(const char* s:{"true","false","null"}){size_t n=strlen(s);if((size_t)(end-p)>=n&&!memcmp(p,s,n)){p+=n;return true;}}
    const char* a=p;if(p<end&&*p=='-')p++;if(p==end)return ok=false;
    if(*p=='0')p++;else{if(*p<'1'||*p>'9')return ok=false;while(p<end&&digit(*p))p++;}
    if(p<end&&*p=='.'){p++;const char* d=p;while(p<end&&digit(*p))p++;if(p==d)return ok=false;}
    if(p<end&&(*p=='e'||*p=='E')){p++;if(p<end&&(*p=='+'||*p=='-'))p++;const char*d=p;while(p<end&&digit(*p))p++;if(p==d)return ok=false;}
    return p>a;
  }
  bool integer(int& n) { ws();const char*a=p;if(!skip())return false;unsigned v=0;for(;a<p;a++){if(*a<'0'||*a>'9')return ok=false;v=v*10+(*a-'0');if(v>65535)return ok=false;}n=(int)v;return true; }
};
inline bool segment(const char* p) { size_t n=strlen(p);if(!n||n>32)return false;for(;*p;p++)if(!(*p>='a'&&*p<='z')&&!digit(*p)&&*p!='-')return false;return true; }
inline bool text(const char* p) { for(;*p;p++)if((unsigned char)*p<32)return false;return true; }
inline bool utf8(const char* s,size_t n) {
  for(size_t i=0;i<n;) {
    uint8_t c=(uint8_t)s[i++];if(c<128)continue;
    unsigned u;int more;
    if(c>=0xc2&&c<=0xdf){u=c&31;more=1;}else if(c>=0xe0&&c<=0xef){u=c&15;more=2;}else if(c>=0xf0&&c<=0xf4){u=c&7;more=3;}else return false;
    if(i+more>n)return false;for(int j=0;j<more;j++){c=s[i++];if((c&0xc0)!=0x80)return false;u=(u<<6)|(c&63);}
    if((more==2&&u<2048)||(more==3&&u<65536)||(u>=0xd800&&u<=0xdfff)||u>0x10ffff)return false;
  }return true;
}
inline bool metadata(const char* s,size_t n,Meta& m,bool index=false) {
  if(n>1024||!n||!utf8(s,n))return false;
  Json j(s,n);char schema[32]="";int version=0;unsigned seen=0;
  if(!j.take('{'))return false;
  do {
    char key[64];if(!j.str(key,sizeof key)||!j.take(':'))return false;
    const char* keys[]={"schema","version","uid","title","dosName","category","course","categoryLabel","thumbnail","gamCrc32","touchScore"};
    int k=0;while(k<11&&strcmp(key,keys[k]))k++;
    if(k<11){if(seen&(1u<<k))return false;seen|=1u<<k;}
    switch(k){
      case 0:j.str(schema,sizeof schema);break;case 1:j.integer(version);break;
      case 2:j.str(m.uid,sizeof m.uid);break;case 3:j.str(m.title,sizeof m.title);break;case 4:j.str(m.dos,sizeof m.dos);break;
      case 5:if(!j.take('[')||!j.str(m.root,sizeof m.root))return false;if(j.take(','))j.str(m.sub,sizeof m.sub);if(!j.take(']'))return false;break;
      case 6:j.integer(m.course);break;case 7:j.str(m.label,sizeof m.label);break;case 8:j.str(m.thumb,sizeof m.thumb);break;case 9:j.str(m.crc,sizeof m.crc);break;case 10:j.integer(m.score);m.scored=true;break;
      default:j.skip();break;
    }
    if(!j.ok)return false;
  }while(j.take(','));
  if(!j.take('}'))return false;j.ws();if(j.p!=j.end)return false;
  if(strcmp(schema,"gmp-library")||version!=1||!m.uid[0]||!m.title[0]||!text(m.title)||!text(m.label)||!segment(m.root)||(m.sub[0]&&!segment(m.sub))||m.score>100||strlen(m.crc)!=8)return false;
  for(const char*p=m.uid;*p;p++)if(*p<33||*p>126)return false;
  for(const char*p=m.crc;*p;p++)if(!digit(*p)&&!(*p>='A'&&*p<='F'))return false;
  if(!m.dos[0])return false;for(const char*p=m.dos;*p;p++)if(!strchr("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'()@^_`{}~-",*p))return false;
  if(!m.thumb[0]||!strcmp(m.thumb,"thumb.pth"))return true;
  size_t len=strlen(m.thumb);if(!index||len<5||strcmp(m.thumb+len-4,".pth"))return false;
  m.thumb[len-4]=0;bool valid=segment(m.thumb);m.thumb[len-4]='.';return valid;
}
inline int root(const char*s) { const char* names[]={"starter","sandbox","bizarre","mine","imported","cd"};for(int i=0;i<6;i++)if(!strcmp(s,names[i]))return i+1;return 5; }
inline bool indexHeader(const char* s,size_t n) {
  Json j(s,n);char schema[32]="";int version=0;unsigned seen=0;if(n>1024||!j.take('{'))return false;
  do{char key[64];if(!j.str(key,sizeof key)||!j.take(':'))return false;
    if(!strcmp(key,"schema")){if(seen&1)return false;seen|=1;j.str(schema,sizeof schema);}
    else if(!strcmp(key,"version")){if(seen&2)return false;seen|=2;j.integer(version);}else j.skip();if(!j.ok)return false;
  }while(j.take(','));
  if(!j.take('}'))return false;j.ws();return j.p==j.end&&version==1&&!strcmp(schema,"gmp-library-index");
}
inline bool gmp1(const char* data,size_t n) {return n>=6&&n<=256&&!memcmp(data,"GMP 1\n",6);}
inline bool belongs(const Entry&g,int category,int sub) { return !category||(category==7?g.score>=85:g.category==category&&(sub<0||g.sub==sub)); }
inline bool before(const Entry&a,const Entry&b,int category) {return category==7?a.score>b.score:category==1&&a.course&&(!b.course||a.course<b.course);}
inline int selection(const Entry*games,int count,const uint8_t*uid) {for(int i=0;i<count;i++)if(!memcmp(games[i].uid,uid,16))return i;return -1;}
inline int clampPage(int page,int count,bool discovering) {return !discovering&&page>=(count+5)/6?0:page;}
inline void categorize(Entry&g,const Meta&m) {
  g.category=root(m.root);g.course=m.course;g.score=m.score;g.scored=m.scored;g.sub=0;
  if(g.category==1){int stage=atoi(m.sub);g.sub=stage>=100&&stage<=600&&stage%100==0?stage/100:!strcmp(m.sub,"graduations")?7:8;}
  if(g.category==6)g.sub=!strcmp(m.sub,"shareware")?2:1;
}
inline bool thumb(const uint8_t* p,size_t n) { return n==THUMB_RAW&&!memcmp(p,"PTH1\x60\0\x3c\0\0\1\0\0",12); }
} // namespace pk
