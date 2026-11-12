function n(s){const c=s.search(/:|!\s/);if(c<0)return[s,""];const r=s[c]==="!"?c+1:c;return[s.slice(0,r),s.slice(c+1).trim()]}export{n as s};
