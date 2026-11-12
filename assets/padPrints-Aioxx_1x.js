import{SANDBOX_COLORS as p}from"./bbsName-C_Z_jafv.js";import{d as x,C as d}from"./chezArt-S9rmEHng.js";const h=[{id:"sandbox",name:"Sandbox BBS",note:"the one it came with"},{id:"chez",name:"THE CHEZ",note:"in tomato red"},{id:"graph",name:"Graph paper",note:"for mapping levels"},{id:"night",name:"Night sky",note:"for space games"},{id:"blue",name:"Plain blue",note:"for grown-ups"}],f="sandbox",l="gm-desk-pad",y="gm-pad-change",g=t=>h.some(e=>e.id===t),E=t=>h.find(e=>e.id===t).name;function z(){try{const t=localStorage.getItem(l);return g(t)?t:f}catch{return f}}function V(t){try{t===f?localStorage.removeItem(l):localStorage.setItem(l,t)}catch{}window.dispatchEvent(new CustomEvent(y,{detail:t}))}const a=156,n=140,$=["#000","#00a","#0a0","#0aa","#a00","#a0a","#a50","#aaa","#555","#55f","#5f5","#5ff","#f55","#f5f","#ff5","#fff"];let m=0;function k(t){const e=[..."SANDBOX"].map((o,r)=>`<text x="${14+r*18.5}" y="38" fill="${$[p[r]]}">${o}</text>`).join(""),i=[[18,10],[44,6],[70,14],[96,8],[128,12],[146,5],[112,22],[30,20]].map(([o,r])=>`<circle cx="${o}" cy="${r}" r="0.9" fill="#fff" opacity="0.8"/>`).join("");return`<defs><linearGradient id="${t}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0f2e"/><stop offset="1" stop-color="#23407c"/></linearGradient></defs>
    <rect width="${a}" height="${n}" fill="url(#${t}-sky)"/>
    ${i}
    <circle cx="132" cy="62" r="9" fill="#ffe7a0" opacity="0.9"/>
    <g font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="22" stroke="#000" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${e}</g>
    <text x="78" y="54" text-anchor="middle" font-family="'Courier New', monospace" font-weight="700" font-size="11" fill="#ff5">-= B B S =-</text>
    <path d="M0 104 Q30 84 62 96 T120 92 T156 98 V140 H0 Z" fill="#b8863d"/>
    <path d="M0 116 Q40 100 84 112 T156 108 V140 H0 Z" fill="#e2bf78"/>
    <g fill="#9c6c2c"><rect x="18" y="80" width="26" height="18"/><rect x="14" y="74" width="8" height="10"/><rect x="40" y="74" width="8" height="10"/><rect x="26" y="70" width="10" height="12"/><path d="M28 98 v-8 a3 3 0 0 1 6 0 v8 z" fill="#5c3c14"/></g>
    <path d="M31 70 v-9 l7 3 -7 3" fill="#f55" stroke="#5c3c14" stroke-width="0.8"/>
    <text x="150" y="132" text-anchor="end" font-family="'Courier New', monospace" font-weight="700" font-size="9" fill="#3a2a10">1-412-555-SAND</text>`}let s;function u(){if(s!==void 0)return s;const t=8,e=document.createElement("canvas");e.width=44*t,e.height=24*t;const i=e.getContext("2d");return i&&x(i,2*t,22*t,t,d.driver,d.teddy),s=i?e.toDataURL():"",s}function w(t){const e=u();return`<defs><linearGradient id="${t}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4f1f2"/><stop offset="1" stop-color="#86cfd4"/></linearGradient></defs>
    <rect width="${a}" height="${n}" fill="url(#${t}-sky)"/>
    <circle cx="128" cy="62" r="20" fill="#fff6c8" opacity="0.7"/>
    <path d="M0 104 Q36 92 78 100 T156 96 V140 H0 Z" fill="#9ccf86"/>
    <rect y="114" width="${a}" height="26" fill="#45464c"/>
    <rect y="114" width="${a}" height="1.5" fill="#2e2f33"/>
    <g fill="#f4f0d8">${[8,40,72,104,136].map(i=>`<rect x="${i}" y="128" width="14" height="2"/>`).join("")}</g>
    <g font-family="'Arial Black', Arial, sans-serif" font-weight="900" text-anchor="middle" paint-order="stroke" stroke-linejoin="round">
      <text x="78" y="30" font-size="25" fill="#e8402c" stroke="#fff" stroke-width="4">THE CHEZ</text>
      <text x="78" y="44" font-size="8" fill="#26262a" letter-spacing="1.5">1976½ CITICAR</text>
    </g>
    ${e?`<image href="${e}" x="10" y="52" width="136" height="74"/>`:""}`}function M(t){return`<defs>
      <pattern id="${t}-fine" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M6 0 V6 H0" fill="none" stroke="#b7d0ee" stroke-width="0.5"/></pattern>
      <pattern id="${t}-bold" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0 V30 H0" fill="none" stroke="#6f9bd6" stroke-width="0.8"/></pattern>
    </defs>
    <rect width="${a}" height="${n}" fill="#fcfcf6"/>
    <rect width="${a}" height="${n}" fill="url(#${t}-fine)"/>
    <rect width="${a}" height="${n}" fill="url(#${t}-bold)"/>
    <g fill="none" stroke="#55565e" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" opacity="0.85">
      <path d="M6 108 H54 M72 108.5 H150"/>
      <path d="M54 108 V122 M72 108.5 V122"/>
      <path d="M58 118 l3 -4 3 4 3 -4 3 4" stroke="#b03a2e"/>
      <path d="M84 84 H120 M96 60 H132 M30 72 H60"/>
      <path d="M112 84 V108 M118 84 V108 M112 90 H118 M112 96 H118 M112 102 H118"/>
      <circle cx="18" cy="100" r="3"/><path d="M18 103 V108 M15 105 H21"/>
      <path d="M26 66 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M44 66 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M90 78 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0"/>
      <path d="M124 60 V44 H136 V60"/>
      <path d="M38 98 q12 -22 30 -26 m-6 -2 l6 2 -3 5" stroke-dasharray="2 2"/>
    </g>
    <g font-family="'Comic Sans MS', 'Marker Felt', 'Chalkboard', cursive" fill="#45464e" opacity="0.9">
      <text x="10" y="22" font-size="11">LEVEL 1</text>
      <text x="10" y="33" font-size="7">jump the pit!</text>
      <text x="122" y="40" font-size="7">EXIT</text>
      <text x="56" y="132" font-size="7" fill="#b03a2e">spikes</text>
    </g>`}function H(t,e){let i=e;const o=()=>(i=(i*1103515245+12345)%2147483648)/2147483648;return Array.from({length:t},()=>[o()*a,o()*n,o()])}function A(t){const e=H(70,1994).map(([o,r,c])=>`<circle cx="${o.toFixed(1)}" cy="${r.toFixed(1)}" r="${(.35+c*.75).toFixed(2)}" fill="#fff" opacity="${(.45+c*.5).toFixed(2)}"/>`).join(""),i=[[30,26],[118,108],[70,120]].map(([o,r])=>`<path d="M${o-4} ${r} H${o+4} M${o} ${r-4} V${r+4}" stroke="#eef2ff" stroke-width="0.7"/>`).join("");return`<defs>
      <linearGradient id="${t}-sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#03041a"/><stop offset="0.6" stop-color="#101848"/><stop offset="1" stop-color="#2a1d58"/></linearGradient>
      <mask id="${t}-moon"><circle cx="122" cy="32" r="15" fill="#fff"/><circle cx="129" cy="27" r="13" fill="#000"/></mask>
      <linearGradient id="${t}-tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0.9"/></linearGradient>
    </defs>
    <rect width="${a}" height="${n}" fill="url(#${t}-sky)"/>
    <path d="M0 96 Q40 70 80 86 T156 70 V100 Q100 118 50 108 T0 120 Z" fill="#6c5aa8" opacity="0.18"/>
    ${e}
    ${i}
    <circle cx="122" cy="32" r="15" fill="#fff1c0" mask="url(#${t}-moon)"/>
    <g transform="rotate(-18 42 92)">
      <ellipse cx="42" cy="92" rx="24" ry="6" fill="none" stroke="#e8c88c" stroke-width="2.2" opacity="0.9"/>
      <circle cx="42" cy="92" r="13" fill="#d98a4a"/>
      <path d="M30 88 Q42 85 54 88 M29.5 95 Q42 98 54.5 95" stroke="#b86a34" stroke-width="2" fill="none"/>
      <path d="M18 92 A24 6 0 0 0 66 92" fill="none" stroke="#f2dcae" stroke-width="2.2"/>
    </g>
    <path d="M70 46 L100 34" stroke="url(#${t}-tail)" stroke-width="1.4" stroke-linecap="round"/>`}function S(t){return`<defs><radialGradient id="${t}-sheen" cx="0.3" cy="0.3" r="0.8"><stop offset="0" stop-color="#2a5296"/><stop offset="1" stop-color="#1d3f7a"/></radialGradient></defs>
    <rect width="${a}" height="${n}" fill="url(#${t}-sheen)"/>
    <text x="148" y="133" text-anchor="end" font-family="Arial, sans-serif" font-weight="700" font-size="6" letter-spacing="1" fill="#2c5092">SQUARE DEAL</text>`}const v={sandbox:k,chez:w,graph:M,night:A,blue:S};function G(t){const e=`pad${++m}`;return`<svg viewBox="0 0 ${a} ${n}" preserveAspectRatio="none" aria-hidden="true">${v[t](e)}</svg>`}export{f as D,y as P,E as a,h as b,g as i,z as l,G as p,V as s};
