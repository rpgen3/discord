import {diffColor} from 'https://rpgen3.github.io/projector/mjs/diffColor.mjs';
const getTrendCode = (r, g, b) => {
    let s = '';
    if(r === g) s += 'a';
    if(r === b) s += 'b';
    if(g === b) s += 'c';
    if(r < b) s += 'd';
    if(r > b) s += 'e';
    if(r < g) s += 'f';
    if(r > g) s += 'g';
    if(g < b) s += 'h';
    if(g > b) s += 'i';
    return s;
};
const dicMap = new Map,
      codeMap = new Map;
for(const [k, v] of (
    await(await fetch('https://rpgen3.github.io/discord/data.txt')).text())
    .split('\n').filter(v=>v).map(v=>v.split(':').map(v=>v.trim()))
   ) dicMap.set(k, v.slice(1).match(/.{2}/g).map(v=>parseInt(v, 16)));
const add = (r, g, b, v) => {
    const code = getTrendCode(r, g, b);
    if(!codeMap.has(code)) codeMap.set(code, []);
    codeMap.get(code).push(v);
};
for(const [k, v] of dicMap) add(...v, k);
export const getEmoji = (r, g, b, type = 0) => {
    const code = getTrendCode(r, g, b);
    if(!codeMap.has(code)) throw 'missing dic';
    let min = 1, output = null;
    for(const v of codeMap.get(code)) {
        const [r, g, b] = dicMap.get(v),
              dif = diffColor([r, g, b], v, type);
        if(min > dif) {
            min = dif;
            output = v;
        }
    }
    return output;
};
