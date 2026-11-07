// Real picker renders plus metadata, touch-gap, partial-page and RAM budget regressions.
#include "framebuffer.h"
#include "library.h"
#include "picker_draw.h"
#include "gmsmall.h"
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
    pk::clearTiles(fb,W);pk::libraryFrame(fb,W,fb.H,"Pocket Player",0,2,"Rescan");for(int i=0;i<6;i++)pk::tileLabel(fb,W,i,labels[i]);
    assert(!fb.clipped);save(fb,out+"/categories-"+std::to_string(W)+".ppm");
    pk::clearTiles(fb,W);pk::libraryFrame(fb,W,fb.H,"Starters / 1** First Steps",0,18,"Details");
    for(int i=0;i<6;i++) {
      auto r=pk::tile(W,i);assert(pk::hitTile(W,r.x,r.y)==i);assert(pk::hitTile(W,r.x+r.w,r.y)==-1);assert(pk::hitTile(W,r.x,r.y+r.h)==-1);
      auto&m=records[i];uint32_t off,len;assert(pak.find(m.thumb,&off,&len));std::vector<uint8_t>b(len),raw(pk::THUMB_RAW);assert(readAt(f,off,b.data(),len));
      z_stream z={};assert(inflateInit2(&z,-15)==Z_OK);z.next_in=b.data()+4;z.avail_in=len-4;z.next_out=raw.data();z.avail_out=raw.size();assert(inflate(&z,Z_FINISH)==Z_STREAM_END&&z.total_out==pk::THUMB_RAW);inflateEnd(&z);assert(pk::thumb(raw.data(),raw.size()));
      pk::thumbnail(fb,W,i,raw.data(),m.dos,i==0);
    }
    assert(!fb.clipped);save(fb,out+"/thumbnails-"+std::to_string(W)+".ppm");
    for(int count:{1,6,0,6}) {
      pk::clearTiles(fb,W);fresh.clear();pk::clearTiles(fresh,W);
      for(int i=0;i<count;i++){pk::tileLabel(fb,W,i,"Graduation: Blocks and Showcase");pk::tileLabel(fresh,W,i,"Graduation: Blocks and Showcase");}
      for(int y=32;y<pk::footer(W);y++)assert(!memcmp(fb.px+y*W,fresh.px+y*W,W*2));
    }
    for(int i=0;i<6;i++)pk::thumbnail(fb,W,i,nullptr,"MALFORMED-LONG-NAME",false);
    assert(!fb.clipped);
  }
  fclose(f);printf("librarytest: passed; entry=%zu catalog512=%zu scratch=%d bytes\n",sizeof(pk::Entry),sizeof(pk::Catalog),pk::THUMB_RAW+288);
}
