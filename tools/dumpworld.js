// node tools/dumpworld.js — ワールドマップを座標定規つきで表示
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ctx = {console};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','data.js'),'utf8'), ctx);
const {WORLD_TILES} = vm.runInContext('({WORLD_TILES})', ctx);
const w = WORLD_TILES[0].length;
let tens = '   ', ones = '   ';
for(let x=0;x<w;x++){ tens += x%10===0 ? String(Math.floor(x/10)) : ' '; ones += String(x%10); }
console.log(tens); console.log(ones);
WORLD_TILES.forEach((row,y)=>console.log(String(y).padStart(2)+' '+row));
