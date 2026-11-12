import{c as f}from"./colors-B4pnRhW2.js";const g=`
000000 404040 6c6c6c 909090 b0b0b0 c8c8c8 dcdcdc ececec
444400 646410 848424 a0a034 b8b840 d0d050 e8e85c fcfc68
702800 844414 985c28 ac783c bc8c4c cca05c dcb468 e8cc7c
841800 983418 ac5030 c06848 d0805c e09470 eca880 fcbc94
880000 9c2020 b03c3c c05858 d07070 e08888 eca0a0 fcb4b4
78005c 8c2074 a03c88 b0589c c070b0 d084c0 dc9cd0 ecb0e0
480078 602090 783ca4 8c58b8 a070cc b484dc c49cec d4b0fc
140084 302098 4c3cac 6858c0 7c70d0 9488e0 a8a0ec bcb4fc
000088 1c209c 3840b0 505cc0 6874d0 7c8ce0 90a4ec a4b8fc
00187c 1c3890 3854a8 5070bc 6888cc 7c9cdc 90b4ec a4c8fc
002c5c 1c4c78 386890 5084ac 689cc0 7cb4d4 90cce8 a4e0fc
00402c 1c5c48 387c64 509c80 68b494 7cd0ac 90e4c0 a4fcd4
003c00 205c20 407c40 5c9c5c 74b474 8cd08c a4e4a4 b8fcb8
143800 345c1c 507c38 6c9850 84b468 9ccc7c b4e490 c8fca4
2c3000 4c501c 687034 848c4c 9ca864 b4c078 ccd488 e0ec9c
442800 644818 846830 a08444 b89c58 d0b46c e8cc7c fce08c
`,h=`
000000 404040 6c6c6c 909090 b0b0b0 c8c8c8 dcdcdc ececec
805800 947020 a8843c bc9c58 ccac70 dcc084 ecd09c fce0b0
445c00 5c7820 74903c 8cac58 a0c070 b0d484 c0e89c d4fcb0
703400 885020 a0683c b48458 c89870 dcac84 ecc09c fcd4b0
006414 208034 3c9850 58b06c 70c484 84d89c 9ce8b4 b0fcc8
700014 882034 a03c50 b4586c c87084 dc849c ec9cb4 fcb0c8
005c5c 207474 3c8c8c 58a4a4 70b8b8 84c8c8 9cdcdc b0ecec
70005c 842074 943c88 a8589c b470b0 c484c0 d09cd0 e0b0e0
003c70 1c5888 3874a0 508cb4 68a4c8 7cb8dc 90ccec a4e0fc
580070 6c2088 803ca0 9458b4 a470c8 b484dc c49cec d4b0fc
002070 1c3c88 3858a0 5074b4 6888c8 7ca0dc 90b4ec a4c8fc
3c0080 542094 6c3ca8 8058bc 9470cc a884dc b89cec c8b0fc
000088 20209c 3c3cb0 5858c0 7070d0 8484e0 9c9cec b0b0fc
`,p=`
575757 000c8e 0800a6 340096 550061 630015 5a0000 3c0e00
112800 003b00 004200 003a05 002652 000000 a5a5a5 0041d9
2f1eff 6704f2 9400b4 aa0057 a31800 803900 4b5b00 137600
008100 007923 006288 ffffff 4a9fff 797eff af63ff dd55ff
f757c2 f76a63 dc8810 aea900 78c400 4ad211 2fcf64 2fbdc4
414141 b9ddff cad1ff dec6ff f0c0ff fcc0ee fdc6ca f5d0aa
e4dd95 d0e892 bdeea2 b2eec0 b0e8e3 b3b3b3
`,A=`
000000 ffffff fa3200 1de0ff a84bcc 68ba51 004ad0 ffe94d
ff5b00 c13e00 ff723e 605e62 8c937f b2ff90 458aff c3b8d7
`,n=c=>c.trim().split(/\s+/).map(e=>[0,2,4].map(r=>parseInt(e.slice(r,r+2),16))),l=c=>f(c,[0,0,0],[255,255,255]),o=()=>Array.from({length:16},(c,e)=>e===6?[170,85,0]:[4,2,1].map(r=>(e&r?170:0)+(e&8?85:0))),a=(c,e,r,s,d,b)=>({id:c,name:e,stem:r,entries:s,description:d,colors:b}),G=()=>[a("amber","Monochrome amber","monoamb",32,"32 shades from black to warm amber.",()=>f(32,[0,0,0],[255,184,48])),a("green","Monochrome green","monogrn",32,"32 shades from black to phosphor green.",()=>f(32,[0,0,0],[64,255,96])),a("white","Monochrome white","monowht",32,"32 shades from black to white.",()=>l(32)),a("atari-ntsc","Atari 2600 NTSC","atntsc",128,"128 TIA color slots, using Ricardo Cancho Niemietz’s RGB reference approximation.",()=>n(g)),a("atari-pal","Atari 2600 PAL","atpal",104,"104 colors after removing repeated gray columns from the PAL reference.",()=>n(h)),a("nes","NES · 54 colors","nes54",54,"Persune’s unemphasized 2C02G US reference, adapted to VGA.",()=>n(p)),a("cga-cyan","CGA cyan / magenta","cga0",4,"Black, bright cyan, bright magenta and white.",()=>[o()[0],o()[11],o()[13],o()[15]]),a("cga-green","CGA green / red / brown","cga1",4,"Black, green, red and orange-brown, with the RGBI brown correction.",()=>[o()[0],o()[2],o()[4],o()[6]]),a("ega","EGA · 16 colors","ega16",16,"The standard 16 RGBI colors, with brown corrected.",o),a("ega-skin","EGA + skin tones & hair","egaskin",28,"The 16 EGA colors plus three project-designed four-color skin and hair ramps.",()=>[...o(),...f(4,[92,48,28],[255,226,194]),...f(4,[46,26,22],[163,107,74]),...f(4,[20,15,15],[158,123,60])]),a("gameboy","Game Boy greens","gbgreen",5,"Four project-designed LCD greens, plus black at index 0 for menus.",()=>f(4,[20,52,20],[188,212,96])),a("sega","Sega Master System · 64 colors","sms64",64,"SMS2 RGB colors: two bits per channel.",()=>Array.from({length:64},(c,e)=>[(e&3)*85,(e>>2&3)*85,(e>>4&3)*85])),a("c64","Commodore 64 · 16 colors","c64ntsc",16,"Groepaz’s NTSC CXA2025 reference, with menu black normalized.",()=>n(A)),a("websafe","Web-safe · 216 colors","websafe",216,"The six-level RGB cube, rounded to VGA’s channel levels.",()=>Array.from({length:216},(c,e)=>[Math.floor(e/36)*51,Math.floor(e/6)%6*51,e%6*51])),...[4,8,16,32,64,128].map(c=>a(`gray-${c}`,`Grayscale · ${c} steps`,`gray${c}`,c,c===128?"128 steps; VGA can represent 64 distinct gray shades, so adjacent steps repeat.":`${c} evenly spaced gray shades.`,()=>l(c)))];let w;const i=()=>w??=G(),y=()=>Object.freeze(i().map(({colors:c,...e})=>Object.freeze(e))),k=y();function S(c){const e=i().find(b=>b.id===c);if(!e)throw new RangeError(`Unknown palette preset: ${c}`);const r=[...e.colors()],s=r.findIndex(b=>b.every(t=>t===0));s>=0&&r.splice(s,1),r.unshift([0,0,0]);const d=new Uint8Array(768);return r.slice(0,255).forEach((b,t)=>d.set(b.map(m=>Math.round(m*63/255)),t*3)),d}export{k as PALETTE_PRESETS,S as createPalettePreset};
