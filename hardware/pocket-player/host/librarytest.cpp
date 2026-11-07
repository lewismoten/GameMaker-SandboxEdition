// Real picker renders plus metadata, touch-gap, partial-page and RAM budget regressions.
#include "framebuffer.h"
#include "library.h"
#include "picker_draw.h"
#include "splash.h"
#include "cardmsg.h"
#include "gmsmall.h"
namespace textdatum_t { constexpr int middle_center = 4, top_left = 0; }  // the names LovyanGFX has on the board (pressrect.h includes overlaydraw.h)
#include "pressrect.h"
#include <assert.h>
#include <string>
#include <vector>
#include <fstream>
#include <zlib.h>
static bool readAt(void*u,uint32_t off,void*b,uint32_t n){FILE*f=(FILE*)u;return !fseek(f,off,SEEK_SET)&&fread(b,1,n,f)==n;}
static void save(const Phys&fb,const std::string&path){FILE*f=fopen(path.c_str(),"wb");assert(f);fprintf(f,"P6\n%d %d\n255\n",fb.W,fb.H);for(int i=0;i<fb.W*fb.H;i++){uint16_t c=fb.px[i];unsigned char rgb[]={(unsigned char)((c>>11)*255/31),(unsigned char)(((c>>5)&63)*255/63),(unsigned char)((c&31)*255/31)};fwrite(rgb,1,3,f);}fclose(f);}
int main(int argc,char**argv) {
  assert(pk::gmp1("GMP 1\n",6));assert(!pk::gmp1("GMP 2\n",6));assert(!pk::gmp1("GMP 1",5));assert(!pk::gmp1("GMP 1\n",257));
  assert(argc==3);
  pk::Cached cache={};strcpy(cache.game.file,"GAME.GMP");cache.game.sd=cache.game.one=true;cache.size=100;cache.modified=123;
  cache.checksum=pk::crc32(&cache,offsetof(pk::Cached,checksum));
  assert(pk::cached(cache,100,123,"GAME.GMP"));assert(!pk::cached(cache,101,123,"GAME.GMP"));assert(!pk::cached(cache,100,124,"GAME.GMP"));assert(!pk::cached(cache,100,123,"OTHER.GMP"));
  cache.game.pos++;assert(!pk::cached(cache,100,123,"GAME.GMP"));
  assert(pk::crc32("123456789",9)==0xcbf43926);
  {  // Hold to repeat (page arrows, Backspace): nothing until 400 ms, then every 125 ms; lifting after a repeat is no extra tap; sliding off stops it.
    prs::Press p;bool on=true;auto look=[&](int,int,prs::Rect&r){r=prs::Rect(0,0,48,32);return on;};
    assert(p.update(1000,true,10,10,look)==prs::PRESS);p.makeRepeatable();
    assert(!p.repeatDue(1399)&&p.repeatDue(1400)&&!p.repeatDue(1524)&&p.repeatDue(1525)&&p.repeatDue(1650));
    assert(!p.repeatDue(1700));assert(p.repeatDue(1775));  // a late poll does not fire a burst
    assert(p.update(1800,false,0,0,look)==prs::NONE);  // the lift after repeating acts on nothing more
    assert(p.update(2000,true,10,10,look)==prs::PRESS);  // a plain tap still acts on lift
    assert(!p.repeatDue(5000));  // not repeatable: never
    assert(p.update(2100,false,0,0,look)==prs::ACT);
    assert(p.update(3000,true,10,10,look)==prs::PRESS);p.makeRepeatable();assert(p.update(3100,true,200,200,look)==prs::CANCEL&&!p.repeatDue(4000));
  }
  std::string data=argv[1],out=argv[2];
  std::ifstream index(data+"/library.jsonl");std::string line;std::getline(index,line);
  std::vector<pk::Meta> records;
  while(std::getline(index,line)){pk::Meta m;assert(pk::metadata(line.c_str(),line.size(),m,true));records.push_back(m);}
  records.erase(std::remove_if(records.begin(),records.end(),[](const pk::Meta&m){return strcmp(m.root,"starter")||strcmp(m.sub,"100");}),records.end());
  std::sort(records.begin(),records.end(),[](const pk::Meta&a,const pk::Meta&b){return a.course<b.course;});
  assert(records.size()>6);
  for(int capacity:{128,512}) {
    std::vector<pk::Entry> games(capacity);for(int i=0;i<capacity;i++){games[i].uid[0]=i&255;games[i].uid[1]=i>>8;games[i].category=1;games[i].sub=i%6+1;games[i].course=100*games[i].sub+i%80+1;games[i].score=i%101;}
    assert(pk::selection(games.data(),capacity,games.back().uid)==capacity-1);
    auto last=games.back();std::reverse(games.begin(),games.end());assert(pk::selection(games.data(),capacity,last.uid)==0);
    int friendly=0;for(auto&g:games){assert(pk::belongs(g,1,-1));assert(!pk::belongs(g,2,-1));assert(pk::belongs(g,1,g.sub));if(pk::belongs(g,7,-1))friendly++;}assert(friendly>0);
    std::stable_sort(games.begin(),games.end(),[](const pk::Entry&a,const pk::Entry&b){return pk::before(a,b,7);});for(int i=1;i<capacity;i++)assert(games[i-1].score>=games[i].score);
    std::stable_sort(games.begin(),games.end(),[](const pk::Entry&a,const pk::Entry&b){return pk::before(a,b,1);});for(int i=1;i<capacity;i++)assert(games[i-1].course<=games[i].course);
  }
  assert(pk::clampPage(20,1,true)==20);assert(pk::clampPage(20,1,false)==0);assert(pk::clampPage(1,7,false)==1);assert(pk::clampPage(0,0,false)==0);
  for(auto&m:records){pk::Entry g={};pk::categorize(g,m);assert(g.category==1&&g.sub==1&&g.course==m.course);}
  for(const char*name:{"sandbox","bizarre","mine","imported","cd"}){pk::Meta m;strcpy(m.root,name);strcpy(m.sub,"shareware");pk::Entry g={};pk::categorize(g,m);assert(g.category==pk::root(name));if(g.category==6)assert(g.sub==2);}
  const char*indexHead=" {\"version\":1,\"schema\":\"gmp-library-index\"} ";assert(pk::indexHeader(indexHead,strlen(indexHead)));
  pk::Meta graduation;strcpy(graduation.root,"starter");strcpy(graduation.sub,"graduations");pk::Entry grad={};pk::categorize(grad,graduation);assert(grad.category==1&&grad.sub==7&&grad.course==0);
  const char* good="{\"schema\":\"gmp-library\",\"version\":1,\"uid\":\"project:abc\",\"title\":\"A long human title, not a filename\",\"dosName\":\"ABCDEFGH\",\"category\":[\"imported\",\"unsorted\"],\"gamCrc32\":\"1234ABCD\",\"unknown\":{\"a\":[true,false,null,1.2e3]}}";
  pk::Meta parsed;assert(pk::metadata(good,strlen(good),parsed));
  std::string spaced=std::string(" ")+good+" ";pk::Meta spacedMeta;assert(pk::metadata(spaced.data(),spaced.size(),spacedMeta));
  std::string invalid=good;invalid[1]=(char)0xff;pk::Meta invalidMeta;assert(!pk::metadata(invalid.data(),invalid.size(),invalidMeta));assert(pk::matches(parsed.title,"HUMAN TITLE"));assert(!pk::matches(parsed.title,"ABCDEFGH"));
  for(std::string bad:{std::string(good)+"!",std::string(good).substr(0,90),std::string(1025,'x'),std::string("\xef\xbb\xbf")+good}){pk::Meta m;assert(!pk::metadata(bad.data(),bad.size(),m));}
  for(auto pair:{std::make_pair(std::string("\"version\":1"),std::string("\"version\":2")),std::make_pair(std::string("\"dosName\":\"ABCDEFGH\""),std::string("\"dosName\":\"ABCDEFGHI\"")),std::make_pair(std::string("\"category\":[\"imported\",\"unsorted\"]"),std::string("\"category\":[\"../escape\"]"))}){std::string b=good;b.replace(b.find(pair.first),pair.first.size(),pair.second);pk::Meta m;assert(!pk::metadata(b.data(),b.size(),m));}
  FILE*bad=tmpfile();assert(bad);uint8_t table[48]={};memcpy(table,"GMS1",4);table[4]=1;table[8]='x';table[40]=7;fwrite(table,1,sizeof table,bad);fflush(bad);
  gm::SmallPak badPak;badPak.user=bad;badPak.readAt=readAt;badPak.size=sizeof table;assert(badPak.begin());uint32_t badOff,badLen;assert(!badPak.find("x",&badOff,&badLen));badPak.size=8;assert(!badPak.begin());fclose(bad);
  FILE*f=fopen((data+"/thumbs.pak").c_str(),"rb");assert(f);gm::SmallPak pak;pak.user=f;pak.readAt=readAt;fseek(f,0,SEEK_END);pak.size=ftell(f);assert(pak.begin());
  for(int W:{320,480}) {
    static Phys fb, fresh;fb.W=fresh.W=W;fb.H=fresh.H=W==320?240:320;
    const char* labels[]={"Starters","Sandbox","Bizarre","My games","Imported","CD"};
    pk::clearTiles(fb,W);pk::libraryFrame(fb,W,fb.H,"Pocket Player",0,2,nullptr,false);pk::drawCardChip(fb,W,pk::CARD_READY,104);const int rootIcons[]={6,9,10,11,12,13};pk::continueTile(fb,W,0,nullptr,2,false);for(int i=1;i<6;i++)pk::tileLabel(fb,W,i,labels[i-1],false,rootIcons[i-1]);
    assert(!fb.clipped);save(fb,out+"/categories-"+std::to_string(W)+".ppm");
    {  // pressed looks: a tile, then the gear and the next-page button (each drawn over the idle page; the frame sits inside the button)
      static Phys base;base=fb;
      prs::Rect t=prs::tileRect(W,1);prs::drawPressed(fb,t);assert(!fb.clipped);save(fb,out+"/pressed-tile-"+std::to_string(W)+".ppm");
      fb=base;prs::Ctx c;c.W=W;c.H=fb.H;c.next=true;prs::Rect g,n;assert(prs::under(c,W-10,10,g)&&g.x1==W&&g.y1==32);assert(prs::under(c,60,fb.H-5,n)&&n.x0==50);assert(!prs::under(c,20,fb.H-5,n));  // Previous is off on the first page
prs::drawPressed(fb,g);prs::drawPressed(fb,n);assert(!fb.clipped);save(fb,out+"/pressed-gear-next-"+std::to_string(W)+".ppm");
      fb=base;
    }
    pk::clearTiles(fb,W);pk::libraryFrame(fb,W,fb.H,"Starters",0,2,nullptr);
    const char* stages[]={"1** First Steps","2** Moving and Pushing","3** Heroes and Foes","4** Story and Finish","5** Wiring and Worlds","6** Blocks and Showcase"};
    for(int i=0;i<6;i++)pk::tileLabel(fb,W,i,stages[i],i==1,i+1);
    assert(!fb.clipped);save(fb,out+"/stages-"+std::to_string(W)+".ppm");
    pk::clearTiles(fb,W);pk::libraryFrame(fb,W,fb.H,"Pocket Player",1,2,nullptr,false);
    const char* more[]={"Good on touch","Graduations","Other","Gameware","Shareware","Unsorted"};const int moreIcons[]={16,7,8,14,15,8};
    for(int i=0;i<6;i++)pk::tileLabel(fb,W,i,more[i],false,moreIcons[i]);
    assert(!fb.clipped);save(fb,out+"/more-"+std::to_string(W)+".ppm");
    pk::tileLabel(fb,W,0,"A collection name of four lines",false,18);assert(!fb.clipped);
    for(int i=0;i<pk::ICON_COUNT;i++){pk::tileLabel(fb,W,0,"All games",false,i);assert(!fb.clipped);}
    {static Phys sp;sp.W=W;sp.H=fb.H;pk::drawSplash(sp,W,sp.H);assert(!sp.clipped);save(sp,out+"/splash-"+std::to_string(W)+".ppm");}
    pk::clearTiles(fb,W);pk::libraryFrame(fb,W,fb.H,"Starters / 1** First Steps",0,18,"Details");
    for(int i=0;i<6;i++) {
      auto r=pk::tile(W,i);assert(pk::hitTile(W,r.x,r.y)==i);assert(pk::hitTile(W,r.x+r.w,r.y)==-1);assert(pk::hitTile(W,r.x,r.y+r.h)==-1);
      auto&m=records[i];uint32_t off,len;assert(pak.find(m.thumb,&off,&len));std::vector<uint8_t>b(len),raw(pk::THUMB_RAW);assert(readAt(f,off,b.data(),len));
      z_stream z={};assert(inflateInit2(&z,-15)==Z_OK);z.next_in=b.data()+4;z.avail_in=len-4;z.next_out=raw.data();z.avail_out=raw.size();assert(inflate(&z,Z_FINISH)==Z_STREAM_END&&z.total_out==pk::THUMB_RAW);inflateEnd(&z);assert(pk::thumb(raw.data(),raw.size()));
      pk::thumbnail(fb,W,i,raw.data(),m.dos,i==0,false,false,m.title,m.course);  // Starters carry a text caption (main.cpp)
    }
    assert(!fb.clipped);save(fb,out+"/thumbnails-"+std::to_string(W)+".ppm");
    // The hand mark (a score of 85 or more) sits top left of a tile, beside the favorite star top right; both are drawn over the picture.
    for(int i=0;i<6;i++) {
      auto&m=records[i];uint32_t off,len;assert(pak.find(m.thumb,&off,&len));std::vector<uint8_t>b(len),raw(pk::THUMB_RAW);assert(readAt(f,off,b.data(),len));
      z_stream z={};assert(inflateInit2(&z,-15)==Z_OK);z.next_in=b.data()+4;z.avail_in=len-4;z.next_out=raw.data();z.avail_out=raw.size();assert(inflate(&z,Z_FINISH)==Z_STREAM_END);inflateEnd(&z);
      pk::thumbnail(fb,W,i,raw.data(),m.dos,false,false,i==1,i==2?m.title:nullptr,i==2?m.course:0,i%2==0);
    }
    assert(!fb.clipped);save(fb,out+"/touch-marks-"+std::to_string(W)+".ppm");
    for(int i:{0,2,4}){auto r=pk::tile(W,i);bool marked=true;for(int sy=0;sy<16;sy++)for(int sx=0;sx<16;sx++){uint8_t v=pk::ICONS[16][sy*16+sx];if(v&&fb.px[(r.y+3+sy)*W+r.x+3+sx]!=pk::ICON_PALETTE[v])marked=false;}assert(marked);}  // the hand's own colors, drawn over the picture
    {auto r=pk::tile(W,3);bool same=true;for(int sy=0;sy<16;sy++)for(int sx=0;sx<16;sx++){uint8_t v=pk::ICONS[16][sy*16+sx];if(v&&fb.px[(r.y+3+sy)*W+r.x+3+sx]!=pk::ICON_PALETTE[v])same=false;}assert(!same);}  // an unmarked tile has no hand
    // Details: the plain-words touch line (what main.cpp's drawDetails adds under the title).
    for(const char*t:{"Plays well on touch","Needs quick, exact jumps"}){
      fb.clear();pk::clearTiles(fb,W);fb.fillRect(0,0,W,fb.H,pk::C_BLACK);
      pk::detailsTouch(fb,W,68,t);pk::detailsPages(fb,W,fb.H,7);pk::detailsFooter(fb,W,fb.H,false);assert(!fb.clipped);
      save(fb,out+(t[0]=='P'?"/details-touch-good-":"/details-touch-quick-")+std::to_string(W)+".ppm");
    }
    // The home page with Continue first (main.cpp CONTINUE_SLOT): the game's picture and level, then the card-out state.
    for(int cardOut=0;cardOut<2;cardOut++) {
      auto&m=records[2];uint32_t off,len;assert(pak.find(m.thumb,&off,&len));std::vector<uint8_t>b(len),raw(pk::THUMB_RAW);assert(readAt(f,off,b.data(),len));
      z_stream z={};assert(inflateInit2(&z,-15)==Z_OK);z.next_in=b.data()+4;z.avail_in=len-4;z.next_out=raw.data();z.avail_out=raw.size();assert(inflate(&z,Z_FINISH)==Z_STREAM_END);inflateEnd(&z);
      pk::clearTiles(fb,W);pk::libraryFrame(fb,W,fb.H,"Pocket Player",0,2,"Rescan");
      pk::continueTile(fb,W,0,cardOut?nullptr:raw.data(),2,cardOut);
      for(int i=1;i<6;i++)pk::tileLabel(fb,W,i,labels[i-1],false,rootIcons[i-1]);
      assert(!fb.clipped);save(fb,out+(cardOut?"/continue-card-out-":"/continue-")+std::to_string(W)+".ppm");
    }
    pk::clearTiles(fb,W);pk::continueTile(fb,W,0,nullptr,11,false);assert(!fb.clipped);
    for(int count:{1,6,0,6}) {
      pk::clearTiles(fb,W);fresh.clear();pk::clearTiles(fresh,W);
      for(int i=0;i<count;i++){pk::tileLabel(fb,W,i,"Graduation: Blocks and Showcase");pk::tileLabel(fresh,W,i,"Graduation: Blocks and Showcase");}
      for(int y=32;y<pk::footer(W);y++)assert(!memcmp(fb.px+y*W,fresh.px+y*W,W*2));
    }
    for(int i=0;i<6;i++)pk::thumbnail(fb,W,i,nullptr,"MALFORMED-LONG-NAME",false);
    assert(!fb.clipped);
    // Card messages: the home page with each card state, the empty-page notices, loading, and each failure card.
    {
      using namespace pk;
      const int footerY=footer(W);
      struct Fake { const char*name;CardState s;int cardGamesFound;int flash; } fakes[]={
        {"reading",CARD_READING,37,4},{"ready",CARD_READY,123,4},{"nocard",CARD_NONE,0,4},{"unreadable",CARD_UNREADABLE,0,4},{"nofolder",CARD_NOFOLDER,0,4},
        {"empty-reading",CARD_READING,0,0},{"empty-nocard",CARD_NONE,0,0},{"empty-unreadable",CARD_UNREADABLE,0,0},{"empty-nofolder",CARD_NOFOLDER,0,0},{"empty-ready",CARD_READY,0,0}};
      for(auto&k:fakes) {
        pk::clearTiles(fb,W);libraryFrame(fb,W,fb.H,"Pocket Player",0,1,nullptr,false);
        drawCardChip(fb,W,k.s,k.cardGamesFound);
        if(k.flash) for(int i=0;i<6;i++)tileLabel(fb,W,i,labels[i],false,rootIcons[i]);
        else assert(drawEmptyNotice(fb,W,k.s,k.cardGamesFound)>0&&drawEmptyNotice(fb,W,k.s,k.cardGamesFound)<=footerY);
        assert(!fb.clipped);save(fb,out+"/card-"+k.name+"-"+std::to_string(W)+".ppm");
        // no back arrow on the root page: the top-left 32x32 is plain title bar
        for(int y=0;y<32;y++)assert(fb.px[y*W]!=C_WHITE);  // the arrow button's outline is not there
      }
      // the chip text, long counts included, never reaches the Search button
      for(CardState s:{CARD_READING,CARD_READY,CARD_NONE,CARD_UNREADABLE,CARD_NOFOLDER}){char t[32];cardChipText(s,512,t,sizeof t);assert(t[0]&&strlen(t)<26);}
      pk::clearTiles(fb,W);libraryFrame(fb,W,fb.H,"Starters",0,2,"Details");for(int y=0;y<32;y++)assert(fb.px[y*W]==C_WHITE);  // deeper pages keep their back arrow
      const char*title="Moving and Pushing, a rather long game title that needs an ellipsis";
      for(int step:{0,1,2,3}){drawLoading(fb,W,fb.H,title,step,3);assert(!fb.clipped);save(fb,out+"/loading"+std::to_string(step)+"-"+std::to_string(W)+".ppm");}
      struct Failure { const char*name;LoadFail want;bool onCard,cardThere,missing;uint32_t largest; } failures[]={
        {"memory",FAIL_MEMORY,false,true,true,30000},{"file",FAIL_FILE,true,true,true,150000},{"card",FAIL_CARD,true,false,false,150000},{"file-flash",FAIL_FILE,false,true,false,40000}};
      for(auto&k:failures) {
        assert(whyFailed(k.onCard,k.cardThere,k.missing,k.largest)==k.want);
        drawFailCard(fb,W,fb.H,title,k.want);assert(!fb.clipped);
        auto b=failButton(W,fb.H);assert(inFailButton(W,fb.H,b.x+1,b.y+1)&&!inFailButton(W,fb.H,b.x-1,b.y)&&b.x>=0&&b.x+b.w<=W&&b.y+b.h<=fb.H&&b.h>=44);
        save(fb,out+"/failure-"+k.name+"-"+std::to_string(W)+".ppm");
      }
      drawFailCard(fb,W,fb.H,"",FAIL_FILE);assert(!fb.clipped);
      {static Phys sp;sp.W=W;sp.H=fb.H;drawSplash(sp,W,sp.H);splashLine(sp,W,sp.H,"Looking for games");assert(!sp.clipped);save(sp,out+"/splash-line-"+std::to_string(W)+".ppm");}
    }
  }
  // what the boot scan makes of a card: the fakes behind each message
  assert(pk::cardStateAfterMount(false,false,false)==pk::CARD_NONE);assert(pk::cardStateAfterMount(true,false,false)==pk::CARD_UNREADABLE);
  assert(pk::cardStateAfterMount(true,true,false)==pk::CARD_NOFOLDER);assert(pk::cardStateAfterMount(true,true,true)==pk::CARD_READING);
  fclose(f);printf("librarytest: passed; entry=%zu catalog512=%zu scratch=%d bytes\n",sizeof(pk::Entry),sizeof(pk::Catalog),pk::THUMB_RAW+288);
}
