import{f as Q,i as ee,d as te}from"./shared-desk-web-play-dos-DOS3LiN4.js";import{a1 as ne,a2 as oe,a3 as re,a4 as se}from"./player-5jugG7jB.js";import{j as ie}from"./levelPicture-BaT01hw_.js";import{crc32 as D,createZip as ae}from"./zip-CAcGIfdl.js";import{S as ce}from"./main-BB4EUk5_.js";import{c as $,m as le}from"./macIcon-CuImaGex.js";import{t as de}from"./notices-CNF-s2WU.js";import"./watch-Ci1HG5Rl.js";/* empty css                   */import"./shared-desk-web-play-BFNwQnCp.js";import"./shared-desk-play-dos-BBnKOe_1.js";import"./shared-play-dos-DKEhd1gG.js";import"./shared-web-play-a_3GPAVY.js";import"./shared-desk-play--Ql-JTEr.js";import"./tinHearts-DJCrXItU.js";import"./modulepreload-polyfill-B5Qt9EMX.js";import"./tourButton-DXjuNPQS.js";const k=2048,E=new TextEncoder;function P(e,t,n){e.setUint16(t,n,!0),e.setUint16(t+2,n,!1)}function L(e,t,n){e.setUint32(t,n,!0),e.setUint32(t+4,n,!1)}function z(e,t){return e.toUpperCase().replace(/[^A-Z0-9_]+/g,"_").replace(/^_+|_+$/g,"").slice(0,t)||"X"}function ue(e){const t=new Set;for(const n of e){const o=n.name.lastIndexOf("."),r=z(o>0?n.name.slice(0,o):n.name,8),s=o>0&&!n.dir?z(n.name.slice(o+1),3):"";let i=r;for(let a=1;t.has(i+"."+s);a++)i=r.slice(0,8-String(a).length-1)+"~"+a;t.add(i+"."+s),n.isoName=n.dir?i:`${i}.${s};1`}}function R(e,t){return[e.charCodeAt(0),e.charCodeAt(1),4+t.length,1,...t]}function T(e){return[e&255,e>>>8&255,e>>>16&255,e>>>24,e>>>24,e>>>16&255,e>>>8&255,e&255]}function O(e,t){return R("PX",[...T(e),...T(t),...T(0),...T(0)])}function fe(e){return R("NM",[0,...E.encode(e)])}function he(e){const t=e.split("/"),n=[];return t.forEach((o,r)=>{if(o===""&&r===0)n.push(8,0);else if(o===".")n.push(2,0);else if(o==="..")n.push(4,0);else if(o!==""){const s=E.encode(o);n.push(0,s.length,...s)}}),R("SL",[0,...n])}const M=e=>R("RR",[e]),pe="RRIP_1991A",ye="THE ROCK RIDGE INTERCHANGE PROTOCOL PROVIDES SUPPORT FOR POSIX FILE SYSTEM SEMANTICS",me="PLEASE CONTACT DISC PUBLISHER FOR SPECIFICATION SOURCE";function W(){const[e,t,n]=[pe,ye,me].map(o=>[...E.encode(o)]);return R("ER",[e.length,t.length,n.length,1,...e,...t,...n])}function ge(e,t,n){return R("CE",[...T(e),...T(t),...T(n)])}function ke(e){return[e.getUTCFullYear()-1900,e.getUTCMonth()+1,e.getUTCDate(),e.getUTCHours(),e.getUTCMinutes(),e.getUTCSeconds(),0]}function F(e){const t=(o,r)=>String(o).padStart(r,"0"),n=`${t(e.getUTCFullYear(),4)}${t(e.getUTCMonth()+1,2)}${t(e.getUTCDate(),2)}${t(e.getUTCHours(),2)}${t(e.getUTCMinutes(),2)}${t(e.getUTCSeconds(),2)}00`;return Uint8Array.from([...E.encode(n),0])}function N(e,t,n,o,r,s){const i=33+e.length+(e.length%2===0?1:0),a=i+s.length+(i+s.length)%2;if(a>255)throw new Error("A name is too long for the disk image.");const c=new Uint8Array(a),l=new DataView(c.buffer);return c[0]=a,L(l,2,t),L(l,10,n),c.set(ke(r),18),c[25]=o,P(l,28,1),c[32]=e.length,c.set(e,33),c.set(s,i),c}function we(e){const t={name:"",isoName:"",dir:!0,mode:493,children:[],lba:0,size:0};for(const o of e){const r=o.path.split("/").filter(Boolean);let s=t;r.forEach((i,a)=>{const c=a===r.length-1;let l=s.children.find(d=>d.name===i);l||(l={name:i,isoName:"",dir:!c,mode:c?o.mode??(o.symlink!==void 0?493:420):493,children:[],parent:s,lba:0,size:0},s.children.push(l)),c&&(l.data=o.data,l.symlink=o.symlink,!o.data&&!o.symlink&&(l.dir=!0,l.mode=o.mode??493)),s=l})}const n=o=>{ue(o.children),o.children.sort((r,s)=>r.isoName<s.isoName?-1:r.isoName>s.isoName?1:0),o.children.filter(r=>r.dir).forEach(n)};return n(t),t}function Se(e){const t=[e];for(let n=0;n<t.length;n++)t.push(...t[n].children.filter(o=>o.dir));return t.forEach((n,o)=>n.number=o+1),t}function Ue(e){return e.symlink!==void 0?40960:e.dir?16384:32768}function be(e){const t=e.dir?2+e.children.filter(o=>o.dir).length:1,n=9|(e.symlink!==void 0?4:0);return[...M(n),...O(Ue(e)|e.mode,t),...fe(e.name),...e.symlink!==void 0?he(e.symlink):[]]}function V(e,t,n){const o=a=>2+a.children.filter(c=>c.dir).length,r=e.parent??e,s=e.parent?[...M(1),...O(16384|e.mode,o(e))]:[...R("SP",[190,239,0]),...M(1),...O(16384|e.mode,o(e)),...n!==void 0?ge(n,0,W().length):[]],i=[N(Uint8Array.of(0),e.lba,e.size,2,t,s),N(Uint8Array.of(1),r.lba,r.size,2,t,[...M(1),...O(16384|r.mode,o(r))])];for(const a of e.children){const c=a.dir?a.size:a.data?.length??0;i.push(N(E.encode(a.isoName),a.dir||a.data?.length?a.lba:0,c,a.dir?2:0,t,be(a)))}return i}function Ce(e){let t=1,n=0;for(const o of e)n+o.length>k&&(t++,n=0),n+=o.length;return t}function x(e,t){const n=[];for(const o of e){const r=o.parent?E.encode(o.isoName):Uint8Array.of(0),s=new Uint8Array(8+r.length+r.length%2),i=new DataView(s.buffer);s[0]=r.length,i.setUint32(2,o.lba,t),i.setUint16(6,(o.parent??o).number,t),s.set(r,8),n.push(...s)}return Uint8Array.from(n)}function A(e,t){const n=new Uint8Array(t).fill(32);return n.set(E.encode(e).subarray(0,t)),n}function Ee(e,t){const n=t.date??new Date,o=we(e),r=Se(o),s=[],i=g=>g.children.forEach(S=>S.dir?i(S):S.data?.length&&s.push(S));i(o);for(const g of r)g.size=k*Ce(V(g,n,0));const a=x(r,!0).length,c=Math.ceil(a/k);let l=18;const d=l;l+=c;const y=l;l+=c;const f=l++;for(const g of r)g.lba=l,l+=g.size/k;for(const g of s)g.lba=l,l+=Math.ceil(g.data.length/k);const h=l,u=new Uint8Array(h*k),p=new DataView(u.buffer,16*k,k),m=16*k;u[m]=1,u.set(E.encode("CD001"),m+1),u[m+6]=1,u.set(A("",32),m+8),u.set(A(t.volume.slice(0,32),32),m+40),L(p,80,h),P(p,120,1),P(p,124,1),P(p,128,k),L(p,132,a),p.setUint32(140,d,!0),p.setUint32(148,y,!1),u.set(N(Uint8Array.of(0),o.lba,o.size,2,n,[]),m+156),u.set(A("",128),m+190),u.set(A("",128),m+318),u.set(A("",128),m+446),u.set(A(t.application??"",128),m+574),u.set(A("",37),m+702),u.set(A("",37),m+739),u.set(A("",37),m+776),u.set(F(n),m+813),u.set(F(n),m+830),u.set(E.encode("0000000000000000"),m+847),u.set(F(n),m+864),u[m+881]=1;const b=17*k;u[b]=255,u.set(E.encode("CD001"),b+1),u[b+6]=1,u.set(x(r,!0),d*k),u.set(x(r,!1),y*k),u.set(W(),f*k);for(const g of r){let S=g.lba*k,C=0;for(const U of V(g,n,g.parent?void 0:f))C+U.length>k&&(S+=k-C,C=0),u.set(U,S),S+=U.length,C+=U.length}for(const g of s)u.set(g.data,g.lba*k);return u}const I=512,j=2048,Ae=2147483653,Te=2,Re=1,Ie=4294967295,De=2;async function $e(e){const t=new Blob([e]).stream().pipeThrough(new CompressionStream("deflate"));return new Uint8Array(await new Response(t).arrayBuffer())}function w(e,t,n){e.setUint32(t,Math.floor(n/2**32)),e.setUint32(t+4,n>>>0)}function _(e,t,n){e.setUint32(t,De),e.setUint32(t+4,32),e.setUint32(t+8,n)}const Pe=e=>{let t="";for(let n=0;n<e.length;n+=32768)t+=String.fromCharCode(...e.subarray(n,n+32768));return btoa(t)};async function Oe(e,t="whole disk (Apple_ISO : 0)"){const n=e.length%I?$([e,new Uint8Array(I-e.length%I)]):e,o=n.length/I,r=[],s=[];let i=0;for(let p=0;p<o;p+=j){const m=Math.min(j,o-p),b=n.subarray(p*I,(p+m)*I);if(b.every(U=>U===0)){s.push([Te,p,m,i,0]);continue}const g=await $e(b),[S,C]=g.length<b.length?[Ae,g]:[Re,b];s.push([S,p,m,i,C.length]),r.push(C),i+=C.length}s.push([Ie,o,0,i,0]);const a=$(r),c=D(n),l=new Uint8Array(204+40*s.length),d=new DataView(l.buffer);l.set([109,105,115,104]),d.setUint32(4,1),w(d,8,0),w(d,16,o),w(d,24,0),d.setUint32(32,2056),d.setUint32(36,4294967294),_(d,64,c),d.setUint32(200,s.length),s.forEach(([p,m,b,g,S],C)=>{const U=204+C*40;d.setUint32(U,p),w(d,U+8,m),w(d,U+16,b),w(d,U+24,g),w(d,U+32,S)});const y=new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>resource-fork</key>
	<dict>
		<key>blkx</key>
		<array>
			<dict>
				<key>Attributes</key>
				<string>0x0050</string>
				<key>CFName</key>
				<string>${t}</string>
				<key>Data</key>
				<data>${Pe(l)}</data>
				<key>ID</key>
				<string>0</string>
				<key>Name</key>
				<string>${t}</string>
			</dict>
		</array>
	</dict>
</dict>
</plist>
`),f=new Uint8Array(512),h=new DataView(f.buffer);f.set([107,111,108,121]),h.setUint32(4,4),h.setUint32(8,512),h.setUint32(12,1),w(h,16,0),w(h,24,0),w(h,32,a.length),w(h,40,0),w(h,48,0),h.setUint32(56,1),h.setUint32(60,1);for(let p=0;p<4;p++)h.setUint32(64+p*4,D($([a.subarray(0,4096),Uint8Array.of(p)])));_(h,80,D(a)),w(h,216,a.length),w(h,224,y.length);const u=new Uint8Array(4);return new DataView(u.buffer).setUint32(0,c),_(h,352,D(u)),h.setUint32(488,2),w(h,492,o),$([a,y,f])}function H(e){const t=[],n=c=>{const l=t.length;t.push([]);let d;if(typeof c=="boolean")d=[c?9:8];else if(typeof c=="number"){if(!Number.isInteger(c)||c<0||c>4294967295)throw new Error("bplist: unsupported integer");d=c<256?[16,c]:c<65536?[17,c>>8,c&255]:[18,c>>>24,c>>>16&255,c>>>8&255,c&255]}else if(typeof c=="string"){const y=[...c].map(f=>f.charCodeAt(0));if(y.some(f=>f>127))throw new Error("bplist: ASCII strings only");d=[...y.length<15?[80|y.length]:[95,16,y.length],...y]}else if("real"in c&&typeof c.real=="number"){const y=new DataView(new ArrayBuffer(8));y.setFloat64(0,c.real),d=[35,...new Uint8Array(y.buffer)]}else{const y=Object.keys(c).sort(),f=y.map(u=>n(u)),h=y.map(u=>n(c[u]));d=[...y.length<15?[208|y.length]:[223,16,y.length],...f,...h]}return t[l]=d,l};if(n(e),t.length>255)throw new Error("bplist: too many objects");const o=[...new TextEncoder().encode("bplist00")],r=[];for(const c of t)r.push(o.length),o.push(...c);const s=o.length,i=s<256?1:2;for(const c of r)o.push(...i===1?[c]:[c>>8,c&255]);const a=new DataView(new ArrayBuffer(32));return a.setUint8(6,i),a.setUint8(7,1),a.setUint32(12,t.length),a.setUint32(20,0),a.setUint32(28,s),Uint8Array.from([...o,...new Uint8Array(a.buffer)])}function Me(e){const t=[],n=r=>t.push(r>>>24,r>>>16&255,r>>>8&255,r&255),o=r=>t.push(...[...r].map(s=>s.charCodeAt(0)));n(e.name.length);for(let r=0;r<e.name.length;r++){const s=e.name.charCodeAt(r);t.push(s>>8,s&255)}if(o(e.code),o(e.type),e.type==="blob"){const r=e.value;n(r.length),t.push(...r)}else e.type==="long"?n(e.value):e.type==="type"?o(e.value):t.push(e.value?1:0);return t}function Ne(e){const t=H({ContainerShowSidebar:!1,ShowSidebar:!1,ShowStatusBar:!1,ShowTabView:!1,ShowToolbar:!1,ShowPathbar:!1,SidebarWidth:0,WindowBounds:`{{${e.x}, ${e.y}}, {${e.width}, ${e.height}}}`}),n=H({arrangeBy:"none",backgroundType:0,backgroundColorRed:{real:1},backgroundColorGreen:{real:1},backgroundColorBlue:{real:1},gridOffsetX:{real:0},gridOffsetY:{real:0},gridSpacing:{real:100},iconSize:{real:e.iconSize},labelOnBottom:!0,showIconPreview:!0,showItemInfo:!1,textSize:{real:13},viewOptionsVersion:1}),o=[{name:".",code:"bwsp",type:"blob",value:t},{name:".",code:"icvp",type:"blob",value:n},{name:".",code:"vSrn",type:"long",value:1},{name:".",code:"vstl",type:"type",value:"icnv"}];for(const[f,[h,u]]of Object.entries(e.icons)){const p=new Uint8Array(16),m=new DataView(p.buffer);m.setUint32(0,h),m.setUint32(4,u),p.set([255,255,255,255,255,255,0,0],8),o.push({name:f,code:"Iloc",type:"blob",value:p})}o.sort((f,h)=>{const[u,p]=[f.name.toLowerCase(),h.name.toLowerCase()];return u<p?-1:u>p?1:f.code<h.code?-1:f.code>h.code?1:0});const r=4096,s=[0,0,0,0,...Le(o.length),...o.flatMap(Me)];if(s.length>r)throw new Error("Too many icons for one .DS_Store page.");const i=new Uint8Array(4+2*r),a=new DataView(i.buffer),c=f=>4+f;a.setUint32(0,1),i.set([66,117,100,49],c(0)),a.setUint32(c(4),2048),a.setUint32(c(8),2048),a.setUint32(c(12),2048);let l=c(2048);const d=f=>{a.setUint32(l,f),l+=4};d(3),d(0);const y=[2059,37,r|12];for(let f=0;f<256;f++)d(y[f]??0);d(1),i[l++]=4,i.set([68,83,68,66],l),l+=4,d(1);for(let f=0;f<32;f++){const h=f>=6&&f<=10||f>=13&&f<=30?[2**f]:[];d(h.length),h.forEach(d)}return l=c(32),[2,0,o.length,1,r].forEach(d),i.set(s,c(r)),i}function Le(e){return[e>>>24,e>>>16&255,e>>>8&255,e&255]}const Be=3405691582,v=4277009103,Fe=4277009102,xe=29,_e=4208856256,Ge=4208856066,ze=1,Y=3;async function B(e,t){return new Uint8Array(await crypto.subtle.digest(e,t))}function Ve(e){const t=new DataView(e.buffer,e.byteOffset,e.byteLength);if(t.getUint32(0)===Be){const n=t.getUint32(4);return Array.from({length:n},(o,r)=>{const s=8+r*20,i=t.getUint32(s+8);return[i,i+t.getUint32(s+12)]})}return[[0,e.length]]}function je(e){const t=new DataView(e.buffer,e.byteOffset,e.byteLength),n=[];for(const[o]of Ve(e)){const r=t.getUint32(o,!0);if(r!==v&&r!==Fe)throw new Error("The Mac player is not a Mach-O program.");const s=t.getUint32(o+16,!0);let i=o+(r===v?32:28),a;for(let l=0;l<s;l++)t.getUint32(i,!0)===xe&&(a=o+t.getUint32(i+8,!0)),i+=t.getUint32(i+4,!0);if(a===void 0||t.getUint32(a)!==_e)throw new Error("The Mac player is not signed.");const c=t.getUint32(a+8);for(let l=0;l<c;l++){const d=a+t.getUint32(a+12+l*8+4);if(t.getUint32(d)!==Ge)continue;const y=t.getUint8(d+37);if(y!==1&&y!==2)throw new Error(`The Mac player's signature uses an unknown hash (${y}).`);n.push({at:d,hash:y===1?"SHA-1":"SHA-256",hashOffset:t.getUint32(d+16),hashSize:t.getUint8(d+36),specialSlots:t.getUint32(d+24)})}}return n}const X=e=>btoa(String.fromCharCode(...e)),Z=e=>e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),He=`	<key>rules</key>
	<dict>
		<key>^Resources/</key>
		<true/>
		<key>^Resources/.*\\.lproj/</key>
		<dict>
			<key>optional</key>
			<true/>
			<key>weight</key>
			<real>1000</real>
		</dict>
		<key>^Resources/.*\\.lproj/locversion.plist$</key>
		<dict>
			<key>omit</key>
			<true/>
			<key>weight</key>
			<real>1100</real>
		</dict>
		<key>^Resources/Base\\.lproj/</key>
		<dict>
			<key>weight</key>
			<real>1010</real>
		</dict>
		<key>^version.plist$</key>
		<true/>
	</dict>
	<key>rules2</key>
	<dict>
		<key>.*\\.dSYM($|/)</key>
		<dict>
			<key>weight</key>
			<real>11</real>
		</dict>
		<key>^(.*/)?\\.DS_Store$</key>
		<dict>
			<key>omit</key>
			<true/>
			<key>weight</key>
			<real>2000</real>
		</dict>
		<key>^(Frameworks|SharedFrameworks|PlugIns|Plug-ins|XPCServices|Helpers|MacOS|Library/(Automator|Spotlight|LoginItems))/</key>
		<dict>
			<key>nested</key>
			<true/>
			<key>weight</key>
			<real>10</real>
		</dict>
		<key>^.*</key>
		<true/>
		<key>^Info\\.plist$</key>
		<dict>
			<key>omit</key>
			<true/>
			<key>weight</key>
			<real>20</real>
		</dict>
		<key>^PkgInfo$</key>
		<dict>
			<key>omit</key>
			<true/>
			<key>weight</key>
			<real>20</real>
		</dict>
		<key>^Resources/</key>
		<dict>
			<key>weight</key>
			<real>20</real>
		</dict>
		<key>^Resources/.*\\.lproj/</key>
		<dict>
			<key>optional</key>
			<true/>
			<key>weight</key>
			<real>1000</real>
		</dict>
		<key>^Resources/.*\\.lproj/locversion.plist$</key>
		<dict>
			<key>omit</key>
			<true/>
			<key>weight</key>
			<real>1100</real>
		</dict>
		<key>^Resources/Base\\.lproj/</key>
		<dict>
			<key>weight</key>
			<real>1010</real>
		</dict>
		<key>^[^/]+$</key>
		<dict>
			<key>nested</key>
			<true/>
			<key>weight</key>
			<real>10</real>
		</dict>
		<key>^embedded\\.provisionprofile$</key>
		<dict>
			<key>weight</key>
			<real>20</real>
		</dict>
		<key>^version\\.plist$</key>
		<dict>
			<key>weight</key>
			<real>20</real>
		</dict>
	</dict>`;async function ve(e){const t=[...e].sort(([i],[a])=>i<a?-1:i>a?1:0),n=await Promise.all(t.map(async([i,a])=>[i,await B("SHA-1",a),await B("SHA-256",a)])),o=n.map(([i,a])=>`		<key>${Z(i)}</key>
		<data>
		${X(a)}
		</data>
`).join(""),r=n.map(([i,,a])=>`		<key>${Z(i)}</key>
		<dict>
			<key>hash2</key>
			<data>
			${X(a)}
			</data>
		</dict>
`).join(""),s=`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>files</key>
	<dict>
${o}	</dict>
	<key>files2</key>
	<dict>
${r}	</dict>
${He}
</dict>
</plist>
`;return new TextEncoder().encode(s)}async function Ye(e,t,n){const o=await ve(n),r=e.slice(),s=je(r);if(!s.length)throw new Error("The Mac player has no code directory.");for(const i of s){if(i.specialSlots<Y)throw new Error("The Mac player was signed without a bundle (rebuild it with mac/build.sh).");const a=c=>i.at+i.hashOffset-c*i.hashSize;r.set((await B(i.hash,t)).subarray(0,i.hashSize),a(ze)),r.set((await B(i.hash,o)).subarray(0,i.hashSize),a(Y))}return{binary:r,codeResources:o}}const Xe="mac/GameMakerPlayer",K="GameMakerPlayer",Ze=e=>e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");function We(e){return`${e.replace(/[/:\\\u0000-\u001f]+/g,"-").replace(/^[.\s]+|\s+$/g,"").slice(0,64).trim()||"Game"}.app`}function Ke(e){return`com.lewismoten.gamemaker.${e.toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"")||"game"}`}function qe(e){const t=e.version??"1.0",n=[e.author,e.year].filter(Boolean).join(", "),o=`${n?`By ${n}.

`:""}${e.fiction?`${e.fiction}

`:""}Plays with Game-Maker: Sandbox Edition, a web port of Recreational Software Designs' Game-Maker 3.0 (1994).`,r=n?`© ${[e.year,e.author].filter(Boolean).join(" ")}`:"";return`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${[["CFBundleDevelopmentRegion","en"],["CFBundleDisplayName",e.title],["CFBundleExecutable",K],["CFBundleIconFile","AppIcon"],["CFBundleIdentifier",Ke(e.id)],["CFBundleInfoDictionaryVersion","6.0"],["CFBundleName",e.title.slice(0,64)],["CFBundlePackageType","APPL"],["CFBundleShortVersionString",t],["CFBundleVersion",t],["GMCredits",o],["GMSite",ce],["LSApplicationCategoryType","public.app-category.games"],["LSMinimumSystemVersion","11.0"],...r?[["NSHumanReadableCopyright",r]]:[]].map(([a,c])=>`	<key>${a}</key>
	<string>${Ze(c)}</string>
`).join("")}	<key>NSHighResolutionCapable</key>
	<true/>
	<key>NSSupportsAutomaticGraphicsSwitching</key>
	<true/>
</dict>
</plist>
`}function mt(e,t){try{const n=e.get(t);if(!n)return;const o=Q(n),r=ie(e,o,16,12);if(r)return r;const s=e.get(o.scenes[0]?.files[0]??"");if(s&&ee(s))return te(s);if(s&&ne(s)){const i=oe(s),a=re(i);for(let c=0;c<i.frameCount;c++)se(i,c,a);return{width:i.width,height:i.height,pixels:a.pixels,palette:a.palette}}}catch{}}async function q(e){const t=new TextEncoder,n=We(e.title),o=t.encode(qe(e)),{icns:r}=await le(e.picture,e.colors),s=[["Resources/AppIcon.icns",r],["Resources/game.html",t.encode(e.html)]],{binary:i,codeResources:a}=await Ye(e.player,o,s),c=[{path:`${n}/Contents/Info.plist`,data:o,mode:420},{path:`${n}/Contents/PkgInfo`,data:t.encode("APPL????"),mode:420},{path:`${n}/Contents/MacOS/${K}`,data:i,mode:493},...s.map(([l,d])=>({path:`${n}/Contents/${l}`,data:d,mode:420})),{path:`${n}/Contents/_CodeSignature/CodeResources`,data:a,mode:420}];return{name:n,files:c}}const G="THIRD-PARTY-NOTICES.txt",J=e=>new TextEncoder().encode(de("mac",e));function Je(e){return Ne({x:200,y:140,width:600,height:440,iconSize:128,icons:{[e]:[160,170],Applications:[440,170],[G]:[300,330]}})}async function gt(e,t){const{files:n}=await q(e);return ae([...n.map(o=>({name:o.path,data:o.data,mode:32768|o.mode})),{name:G,data:J(e.audio),mode:33188}],t)}async function kt(e,t){const{name:n,files:o}=await q(e),r=Ee([...o.map(s=>({path:s.path,data:s.data,mode:s.mode})),{path:"Applications",symlink:"/Applications",mode:493},{path:G,data:J(e.audio),mode:420},{path:".DS_Store",data:Je(n),mode:420}],{volume:n.replace(/\.app$/,"").slice(0,32),date:t,application:"GAME-MAKER: SANDBOX EDITION"});return Oe(r)}async function wt(e=new URL("./",location.href).href){const t=await fetch(new URL(Xe,e)).catch(()=>{});if(!t?.ok)throw new Error("Could not load the Mac player. Reload Game-Maker: Sandbox Edition while online and try again.");return new Uint8Array(await t.arrayBuffer())}function St(e){const t=e?.background&&/^#([0-9a-f]{6})$/i.exec(e.background);if(!t)return;const n=parseInt(t[1],16),o=[16,8,0].map(r=>Math.round((n>>r&255)*.45).toString(16).padStart(2,"0")).join("");return{top:e.background,bottom:`#${o}`}}export{G as NOTICES_FILE,We as appName,St as boxColors,Ke as bundleId,Je as dmgWindow,wt as fetchMacPlayer,mt as iconPicture,qe as infoPlist,kt as macAppDmg,q as macAppFiles,gt as macAppZip,J as macNotices};
