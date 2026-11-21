const r=/\b(THE|The|the)[ \u00a0](CHEZ|Chez)\b/g;function t(e){return e.replace(r,"$1 $2").split(/[^\S\u00a0]+/).map(a=>a.replace(/\u00a0/g," "))}export{t as w};
