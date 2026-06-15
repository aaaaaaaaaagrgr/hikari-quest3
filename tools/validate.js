// node tools/validate.js — データ整合性チェック（ヒカリの伝説III）
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = {console};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'), ctx);

const {WORLD_TILES, MAPS, ENTRANCES, WALKABLE, SHOPS, ITEMS, MONSTERS, ENC_TABLES,
       SPELLS, CLASSES, EXP_TABLE, MAX_LV, WORLD_ENC, ENC_RATE,
       BOOK_SPECIES, PAST_BOSSES, GAKUFU_FLAGS} = vm.runInContext(
  '({WORLD_TILES, MAPS, ENTRANCES, WALKABLE, SHOPS, ITEMS, MONSTERS, ENC_TABLES, SPELLS, CLASSES, EXP_TABLE, MAX_LV, WORLD_ENC, ENC_RATE, BOOK_SPECIES, PAST_BOSSES, GAKUFU_FLAGS})', ctx);

let errors = [], warns = [];
const err = s=>errors.push(s);
const warn = s=>warns.push(s);

// ---- 1. 各マップの行長チェック ----
for(const [id,m] of Object.entries(MAPS)){
  const w = m.tiles[0].length;
  m.tiles.forEach((row,y)=>{
    if(row.length!==w) err(`${id}: row ${y} length ${row.length} != ${w}`);
  });
}

// ---- 2. ワールドの入口タイルがすべて存在するか ----
const found = {};
WORLD_TILES.forEach((row,y)=>{
  [...row].forEach((ch,x)=>{
    if(ENTRANCES[ch]){
      if(found[ch]) err(`world: entrance '${ch}' duplicated at (${x},${y}) and (${found[ch]})`);
      found[ch] = `${x},${y}`;
    }
  });
});
for(const ch of Object.keys(ENTRANCES)){
  if(!found[ch]) err(`world: entrance '${ch}' (${ENTRANCES[ch]}) not found on map`);
}

// ---- 3. exitTo / entry の歩行可否 ----
for(const [id,m] of Object.entries(MAPS)){
  if(!m.exitTo) continue;
  const t = WORLD_TILES[m.exitTo.y]?.[m.exitTo.x];
  if(t===undefined || !WALKABLE.has(t)) err(`${id}: exitTo (${m.exitTo.x},${m.exitTo.y}) tile '${t}' not walkable`);
  if(ENTRANCES[t]) warn(`${id}: exitTo (${m.exitTo.x},${m.exitTo.y}) is entrance tile '${t}' (loop!)`);
}
for(const [id,m] of Object.entries(MAPS)){
  if(!m.entry) continue;
  const t = m.tiles[m.entry.y]?.[m.entry.x];
  if(t===undefined || !WALKABLE.has(t)) err(`${id}: entry (${m.entry.x},${m.entry.y}) tile '${t}' not walkable`);
}

// ---- 4. BFS到達チェック ----
function bfs(map, sx, sy, extraPass){
  const h = map.tiles.length, w = map.tiles[0].length;
  const seen = Array.from({length:h},()=>new Array(w).fill(false));
  const q = [[sx,sy]];
  seen[sy][sx] = true;
  while(q.length){
    const [x,y] = q.shift();
    for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){
      const nx=x+dx, ny=y+dy;
      if(nx<0||ny<0||nx>=w||ny>=h||seen[ny][nx]) continue;
      const t = map.tiles[ny][nx];
      if(!(WALKABLE.has(t) || (extraPass && extraPass.includes(t)))) continue;
      seen[ny][nx] = true;
      q.push([nx,ny]);
    }
  }
  return seen;
}
function adjacentReached(seen, x, y){
  return [[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>seen[y+dy]?.[x+dx]);
}
for(const [id,m] of Object.entries(MAPS)){
  if(id==='world' || !m.entry) continue;
  const seen = bfs(m, m.entry.x, m.entry.y);
  for(const o of (m.objects||[])){
    if(!adjacentReached(seen, o.x, o.y)) err(`${id}: object ${o.id} at (${o.x},${o.y}) unreachable`);
  }
  for(const n of (m.npcs||[])){
    if(!adjacentReached(seen, n.x, n.y)) err(`${id}: npc '${n.emoji}' at (${n.x},${n.y}) unreachable`);
  }
  let exitOk = false;
  m.tiles.forEach((row,y)=>[...row].forEach((ch,x)=>{ if(ch==='>' && seen[y][x]) exitOk = true; }));
  if(!exitOk) err(`${id}: exit '>' unreachable from entry`);
}

// ---- 5. ワールドBFS: 徒歩（ミルテ前から）----
const wm = MAPS.world;
const start = MAPS.milte.exitTo;
const seenFoot = bfs(wm, start.x, start.y);
const FOOT_REQUIRED = ['1','2','3','c','f'];
for(const ch of FOOT_REQUIRED){
  const [x,y] = found[ch].split(',').map(Number);
  if(!seenFoot[y][x]) err(`world(foot): entrance '${ch}' (${ENTRANCES[ch]}) unreachable from milte`);
}
for(const ch of ['4','5','6','p','v','i','t','X','e']){
  const [x,y] = found[ch].split(',').map(Number);
  if(seenFoot[y][x]) warn(`world(foot): entrance '${ch}' (${ENTRANCES[ch]}) reachable WITHOUT ship!?`);
}

// ---- 6. ワールドBFS: 船あり ----
const seenShip = bfs(wm, start.x, start.y, '~g');
for(const ch of Object.keys(ENTRANCES)){
  const [x,y] = found[ch].split(',').map(Number);
  if(!seenShip[y][x]) err(`world(ship): entrance '${ch}' (${ENTRANCES[ch]}) unreachable`);
}
// ワールド上のボス・オブジェクトに隣接到達できるか
for(const o of (wm.objects||[])){
  const t = WORLD_TILES[o.y]?.[o.x];
  if(t===undefined || !WALKABLE.has(t)) err(`world: object ${o.id} on non-walkable tile '${t}'`);
  if(!adjacentReached(seenShip, o.x, o.y)) err(`world: object ${o.id} at (${o.x},${o.y}) unreachable by ship`);
}

// ---- 7. ゲートがないとオペラハウスに行けないか ----
{
  const seenNoGate = bfs(wm, start.x, start.y, '~');
  const [x,y] = found['X'].split(',').map(Number);
  if(seenNoGate[y][x]) err(`world: opera reachable WITHOUT opening gate!?`);
}

// ---- 8. データ参照整合 ----
for(const [sid, stock] of Object.entries(SHOPS)){
  for(const id of stock) if(!ITEMS[id]) err(`shop ${sid}: unknown item '${id}'`);
}
for(const [tid, groups] of Object.entries(ENC_TABLES)){
  for(const g of groups) for(const mid of g) if(!MONSTERS[mid]) err(`enc ${tid}: unknown monster '${mid}'`);
}
for(const rule of WORLD_ENC){
  if(rule.table && !ENC_TABLES[rule.table]) err(`WORLD_ENC: unknown table '${rule.table}'`);
}
for(const [id,m] of Object.entries(MAPS)){
  if(m.enc && !ENC_TABLES[m.enc.table]) err(`${id}: unknown enc table '${m.enc.table}'`);
  for(const o of (m.objects||[])){
    if(o.type==='boss' && !MONSTERS[o.monster]) err(`${id}: unknown boss monster '${o.monster}'`);
    if(o.type==='chest' && o.item && !ITEMS[o.item]) err(`${id}: unknown chest item '${o.item}'`);
    if(o.reward && o.reward.item && !ITEMS[o.reward.item]) err(`${id}: unknown reward item '${o.reward.item}'`);
  }
  for(const n of (m.npcs||[])){
    if(n.shop && !SHOPS[n.shop]) err(`${id}: unknown shop '${n.shop}'`);
  }
}
for(const [cid,c] of Object.entries(CLASSES)){
  for(const sp of c.start) if(!SPELLS[sp]) err(`class ${cid}: unknown start spell '${sp}'`);
  for(const [lv,sp] of Object.entries(c.learn)){
    if(!SPELLS[sp]) err(`class ${cid}: unknown learn spell '${sp}'`);
    if(+lv > MAX_LV) err(`class ${cid}: learn level ${lv} > MAX_LV`);
  }
  if(c.levels.length !== MAX_LV+1) err(`class ${cid}: levels length ${c.levels.length}`);
}
if(EXP_TABLE.length !== MAX_LV+1) err(`EXP_TABLE length ${EXP_TABLE.length} != ${MAX_LV+1}`);
for(let i=2;i<=MAX_LV;i++) if(EXP_TABLE[i]<=EXP_TABLE[i-1]) err(`EXP_TABLE not increasing at lv${i}`);
for(const [mid,m] of Object.entries(MONSTERS)){
  if(m.next && !MONSTERS[m.next]) err(`monster ${mid}: unknown next '${m.next}'`);
  if(m.acts){
    const tw = m.acts.reduce((s,a)=>s+a.w,0);
    if(tw<=0) err(`monster ${mid}: acts weight 0`);
  }
  if(m.ally){
    for(const [lv,sp] of Object.entries(m.ally.learn||{})){
      if(!SPELLS[sp]) err(`ally ${mid}: unknown skill '${sp}'`);
      if(+lv > MAX_LV) err(`ally ${mid}: learn level ${lv} > MAX_LV`);
    }
    for(const k of ['hp','mp','st','ag']){
      if(!Array.isArray(m.ally[k]) || m.ally[k].length!==2) err(`ally ${mid}: bad stat '${k}'`);
    }
    if(!m.ally.cry) warn(`ally ${mid}: no cry`);
  }
  if(m.tame && !m.ally) err(`monster ${mid}: tameable but no ally def`);
}

// ---- 9. 図鑑・ボスの網羅チェック ----
const encountable = new Set();
for(const groups of Object.values(ENC_TABLES))
  for(const g of groups) for(const mid of g) encountable.add(mid);
for(const key of BOOK_SPECIES){
  if(!MONSTERS[key]) { err(`book: unknown species '${key}'`); continue; }
  if(!MONSTERS[key].tame) err(`book: species '${key}' is not tameable`);
  if(!encountable.has(key)) err(`book: species '${key}' never appears in any encounter table`);
}
for(const mid of encountable){
  if(MONSTERS[mid].tame && !BOOK_SPECIES.includes(mid)) warn(`monster '${mid}' tameable but not in book`);
}
// 過去ボスのフラグがすべてマップ上のボスオブジェクトに対応するか
const bossFlags = new Set();
for(const m of Object.values(MAPS))
  for(const o of (m.objects||[])) if(o.type==='boss') bossFlags.add(o.flag);
for(const b of PAST_BOSSES){
  if(!bossFlags.has(b.flag)) err(`pastboss flag '${b.flag}' has no boss object on any map`);
  if(!MONSTERS[b.key]) err(`pastboss '${b.key}' unknown`);
}
for(const f of GAKUFU_FLAGS){
  if(!bossFlags.has(f)) err(`gakufu flag '${f}' has no boss object`);
}
// アイテム種別チェック
for(const [iid,it] of Object.entries(ITEMS)){
  if(it.type==='charm' && !['atk','def','agi'].includes(it.stat)) err(`item ${iid}: charm without stat`);
  if(it.t==='meat' && !(it.tame>0)) err(`item ${iid}: meat without tame`);
}

// ---- 結果 ----
console.log('=== validate.js ===');
if(errors.length===0) console.log('OK: no errors');
else { console.log(`ERRORS (${errors.length}):`); errors.forEach(e=>console.log('  x ' + e)); }
if(warns.length){ console.log(`WARNINGS (${warns.length}):`); warns.forEach(w=>console.log('  ! ' + w)); }
process.exit(errors.length ? 1 : 0);
