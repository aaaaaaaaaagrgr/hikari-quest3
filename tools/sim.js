// node tools/sim.js — 戦闘バランスシミュレータ（魔物パーティ対応）
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = {console};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'), ctx);
const {MONSTERS, ITEMS, SPELLS, CLASSES, EXP_TABLE} = vm.runInContext(
  '({MONSTERS, ITEMS, SPELLS, CLASSES, EXP_TABLE})', ctx);

const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function physDmg(atk, def){
  const base = atk/2 - def/4;
  if(base <= 0.5) return Math.random()<0.5 ? 0 : 1;
  return Math.max(0, Math.round(base * (0.85 + Math.random()*0.3)));
}

// 主人公
function mkHero(lv, weapon, armor, shield){
  const g = CLASSES.kota.levels[lv];
  const spells = [...CLASSES.kota.start];
  for(const [l,sp] of Object.entries(CLASSES.kota.learn)) if(+l<=lv) spells.push(sp);
  return {
    id:'kota', hero:true, lv, hp:g.hp, maxhp:g.hp, mp:g.mp, maxmp:g.mp,
    atk: g.str + (weapon?ITEMS[weapon].pow:0),
    def: Math.floor(g.agi/2) + (armor?ITEMS[armor].pow:0) + (shield?ITEMS[shield].pow:0),
    agi: g.agi, spells, atkX:1, asleep:0,
  };
}
// 仲間魔物
function mkAlly(key, lv, charm){
  const a = MONSTERS[key].ally;
  const n = lv-1;
  const cp = s => charm && ITEMS[charm].stat===s ? ITEMS[charm].pow : 0;
  const hp = Math.round(a.hp[0]+a.hp[1]*n), mp = Math.round(a.mp[0]+a.mp[1]*n);
  const st = Math.round(a.st[0]+a.st[1]*n), ag = Math.round(a.ag[0]+a.ag[1]*n) + cp('agi');
  const spells = [];
  for(const [l,sp] of Object.entries(a.learn)) if(+l<=lv) spells.push(sp);
  return {
    id:key, lv, hp, maxhp:hp, mp, maxmp:mp,
    atk: st + cp('atk'),
    def: Math.floor(ag/2) + cp('def'),
    agi: ag, spells, atkX:1, asleep:0,
  };
}
function mkFoe(id){
  const m = MONSTERS[id];
  return {key:id, name:m.name, hp:m.hp, maxhp:m.hp, atk:m.atk, def:m.def, agi:m.agi,
    acts:m.acts||[{w:100,t:'atk'}], fireWeak:!!m.fireWeak, iceWeak:!!m.iceWeak,
    boss:!!m.boss, next:m.next, defMul:1, asleep:0, dead:false};
}
function pickW(acts){
  const t = acts.reduce((s,a)=>s+a.w,0);
  let r = Math.random()*t;
  for(const a of acts){ r-=a.w; if(r<0) return a; }
  return acts[0];
}
const aliveP = p=>p.filter(m=>m.hp>0);
const aliveF = f=>f.filter(x=>!x.dead);

// 期待ダメージ評価
function evalSpell(m, sp, tgt, nFoes){
  if(sp.t==='dmg' || sp.t==='drain'){
    let v = (sp.min+sp.max)/2;
    if(tgt && sp.elem && ((sp.elem==='fire'&&tgt.fireWeak)||(sp.elem==='ice'&&tgt.iceWeak))) v*=1.5;
    return v;
  }
  if(sp.t==='dmgall'){
    let v = (sp.min+sp.max)/2 * Math.min(nFoes, 3);
    if(tgt && sp.elem && ((sp.elem==='fire'&&tgt.fireWeak)||(sp.elem==='ice'&&tgt.iceWeak))) v*=1.5;
    return v;
  }
  if(sp.t==='phys'){
    const hits = sp.hits||1;
    return Math.max(1, (m.atk*m.atkX*sp.mul/2 - (tgt?tgt.def*tgt.defMul:10)/4)) * hits;
  }
  return 0;
}

// 汎用AI
function memberAI(m, party, foes, st){
  const inj = aliveP(party).filter(x=>x.hp < x.maxhp*0.55).sort((a,b)=>a.hp/a.maxhp - b.hp/b.maxhp);
  const dead = party.filter(x=>x.hp<=0);
  const has = id => m.spells.includes(id) && m.mp >= SPELLS[id].mp;
  // 蘇生
  if(dead.length && has('rezarek')) return {t:'revive', id:'rezarek', tgt:dead[0]};
  // 全体回復
  if(inj.length>=2){
    for(const id of ['megahealall','healall','px_dance','tr_heal','fl_heal','song_star','song_heal']){
      if(has(id)) return {t:'healall', id};
    }
  }
  // 単体回復
  if(inj.length>=1){
    for(const id of ['fullheal','healra','heal']){
      if(has(id)) return {t:'heal', id, tgt:inj[0]};
    }
  }
  // バフ（ボス戦のみ）
  if(foes.some(f=>f.boss)){
    if(!st.brave && has('song_brave')){ st.brave=1; return {t:'atkupall', id:'song_brave'}; }
    if((st.defupN||0)<2 && (has('skult')||has('song_guard'))){
      st.defupN=(st.defupN||0)+1;
      return {t:'defup', id: m.spells.includes('skult')?'skult':'song_guard'};
    }
    if(!st.bikilt && has('bikilt')){
      st.bikilt=1;
      const best = aliveP(party).sort((a,b)=>b.atk-a.atk)[0];
      return {t:'atkup', id:'bikilt', tgt:best};
    }
  }
  // 攻撃: 最良の選択
  const tgt = aliveF(foes)[0];
  if(!tgt) return {t:'attack', tgt:null};
  let best = {t:'attack', tgt, val: Math.max(1, m.atk*m.atkX/2 - tgt.def*tgt.defMul/4)};
  for(const id of m.spells){
    const sp = SPELLS[id];
    if(!['dmg','dmgall','phys','drain'].includes(sp.t)) continue;
    if(m.mp < sp.mp) continue;
    // MP温存: 雑魚戦では強スキルを撃ちすぎない
    if(!foes.some(f=>f.boss) && sp.mp > m.maxmp*0.25) continue;
    const v = evalSpell(m, sp, tgt, aliveF(foes).length);
    if(v > best.val*1.1){ best = {t:'cast', id, tgt, val:v}; }
  }
  return best;
}

function applyFoeKill(tgt){
  if(tgt.hp>0) return;
  if(tgt.next){
    const nm = MONSTERS[tgt.next];
    Object.assign(tgt,{key:tgt.next,hp:nm.hp,maxhp:nm.hp,atk:nm.atk,def:nm.def,agi:nm.agi,
      acts:nm.acts||[{w:100,t:'atk'}],fireWeak:!!nm.fireWeak,iceWeak:!!nm.iceWeak,next:nm.next||null,defMul:1});
  } else tgt.dead = true;
}

function simBattle(party0, group, maxRounds=80){
  const party = party0.map(c=>({...c}));
  const foes = group.map(mkFoe);
  const st = {defX:1};
  let rounds = 0;
  while(rounds++ < maxRounds){
    const acts = [];
    for(const m of aliveP(party)) acts.push({who:'p', m, spd:m.agi*(0.7+Math.random()*0.6)});
    for(const f of aliveF(foes)) acts.push({who:'f', f, spd:f.agi*(0.7+Math.random()*0.6)});
    acts.sort((a,b)=>b.spd-a.spd);
    for(const t of acts){
      if(!aliveP(party).length || !aliveF(foes).length) break;
      if(t.who==='p'){
        const m = t.m;
        if(m.hp<=0) continue;
        if(m.asleep>0){ if(Math.random()<0.5) m.asleep=0; else {m.asleep--; continue;} continue; }
        const a = memberAI(m, party, foes, st);
        if(a.t==='attack'){
          let tgt = (!a.tgt || a.tgt.dead) ? aliveF(foes)[0] : a.tgt;
          if(!tgt) continue;
          let dmg;
          if(Math.random()<1/24) dmg = Math.round(m.atk*m.atkX*(0.75+Math.random()*0.25));
          else if(Math.random()<1/24) dmg = 0;
          else dmg = physDmg(m.atk*m.atkX, tgt.def*tgt.defMul);
          tgt.hp -= dmg;
          applyFoeKill(tgt);
        } else if(a.t==='cast'){
          const sp = SPELLS[a.id]; m.mp -= sp.mp;
          let tgt = a.tgt.dead ? aliveF(foes)[0] : a.tgt;
          if(!tgt) continue;
          if(sp.t==='dmg' || sp.t==='drain'){
            let dmg = ri(sp.min,sp.max);
            if((sp.elem==='fire'&&tgt.fireWeak)||(sp.elem==='ice'&&tgt.iceWeak)) dmg=Math.round(dmg*1.5);
            tgt.hp -= dmg;
            if(sp.t==='drain') m.hp = Math.min(m.maxhp, m.hp + Math.floor(dmg/2));
            applyFoeKill(tgt);
          } else if(sp.t==='dmgall'){
            for(const f of aliveF(foes)){
              let dmg = ri(sp.min,sp.max);
              if((sp.elem==='fire'&&f.fireWeak)||(sp.elem==='ice'&&f.iceWeak)) dmg=Math.round(dmg*1.5);
              f.hp -= dmg;
              applyFoeKill(f);
            }
          } else if(sp.t==='phys'){
            const hits = sp.hits||1;
            for(let h=0;h<hits;h++){
              let tg = tgt.dead ? aliveF(foes)[0] : tgt;
              if(!tg) break;
              tg.hp -= physDmg(m.atk*m.atkX*sp.mul, tg.def*tg.defMul);
              applyFoeKill(tg);
            }
          }
        } else if(a.t==='heal'){
          const sp = SPELLS[a.id]; m.mp -= sp.mp;
          if(sp.t==='fullheal') a.tgt.hp = a.tgt.maxhp;
          else a.tgt.hp = Math.min(a.tgt.maxhp, a.tgt.hp + ri(sp.min,sp.max));
        } else if(a.t==='healall'){
          const sp = SPELLS[a.id]; m.mp -= sp.mp;
          for(const mm of aliveP(party)) mm.hp = Math.min(mm.maxhp, mm.hp + ri(sp.min,sp.max));
        } else if(a.t==='revive'){
          m.mp -= SPELLS.rezarek.mp;
          a.tgt.hp = Math.floor(a.tgt.maxhp/2);
        } else if(a.t==='defup'){
          m.mp -= SPELLS[a.id].mp; st.defX = Math.min(1.6, st.defX+0.3);
        } else if(a.t==='atkup'){
          m.mp -= SPELLS[a.id].mp; if(a.tgt) a.tgt.atkX = 1.8;
        } else if(a.t==='atkupall'){
          m.mp -= SPELLS[a.id].mp;
          for(const mm of aliveP(party)) mm.atkX = Math.max(mm.atkX, SPELLS[a.id].mul||1.4);
        }
      } else {
        const f = t.f;
        if(f.dead) continue;
        if(f.asleep>0){ if(Math.random()<0.5) f.asleep=0; else {f.asleep--; continue;} continue; }
        const act = pickW(f.acts);
        const pickT = ()=>{
          const ws=[5,4,3,2]; const cs=[];
          party.forEach((m,i)=>{ if(m.hp>0) cs.push({m,w:ws[i]||2}); });
          const tw=cs.reduce((s,c)=>s+c.w,0); let r=Math.random()*tw;
          for(const c of cs){ r-=c.w; if(r<0) return c.m; }
          return cs[0].m;
        };
        const hit=(m,dmg)=>{ m.hp = Math.max(0, m.hp-dmg); };
        if(act.t==='atk'){ const m=pickT(); hit(m, physDmg(f.atk, m.def*st.defX)); }
        else if(act.t==='strong'){ const m=pickT(); hit(m, physDmg(Math.round(f.atk*(act.mul||1.4)), m.def*st.defX)); }
        else if(act.t==='double'){ for(let k=0;k<2;k++){ if(!aliveP(party).length)break; const m=pickT(); hit(m, physDmg(f.atk, m.def*st.defX)); } }
        else if(act.t==='spell'){ const m=pickT(); hit(m, ri(act.min,act.max)); }
        else if(act.t==='breath'){ for(const m of aliveP(party)) hit(m, ri(act.min,act.max)); }
        else if(act.t==='poison'){ const m=pickT(); hit(m, ri(act.min,act.max)); }
        else if(act.t==='sleep'){ for(const m of aliveP(party)){ if(Math.random()<0.45) m.asleep=ri(1,2); } }
      }
    }
    if(!aliveP(party).length) return {win:false, rounds};
    if(!aliveF(foes).length) return {win:true, rounds, survivors:aliveP(party).length,
      hpLeft: aliveP(party).reduce((s,m)=>s+m.hp/m.maxhp,0)/aliveP(party).length};
  }
  return {win:false, rounds, timeout:true};
}

function trial(name, party, group, n=200){
  let wins=0, rsum=0, surv=0, hp=0, to=0;
  for(let i=0;i<n;i++){
    const r = simBattle(party, group);
    if(r.win){ wins++; rsum+=r.rounds; surv+=r.survivors; hp+=r.hpLeft; }
    if(r.timeout) to++;
  }
  const wr = (wins/n*100).toFixed(0);
  console.log(`${name.padEnd(36)} 勝率${String(wr).padStart(3)}%  平均${wins?(rsum/wins).toFixed(1):'-'}R  生存${wins?(surv/wins).toFixed(1):'-'}  残HP${wins?(hp/wins*100).toFixed(0):'-'}%${to?`  timeout${to}`:''}`);
}

console.log('=== III ボス戦（想定レベル・想定装備） ===');
trial('S1.あばれキングスライム(Lv5)', [
  mkHero(5,'w_copper','a_leather','s_leather'),
  mkAlly('slime',5,null), mkAlly('goblin',5,null),
], ['b_kslime']);
trial('S2.リリカ(Lv10)', [
  mkHero(10,'w_iron','a_chain','s_iron'),
  mkAlly('slime',9,'c_def1'), mkAlly('skeleton',9,'c_pow1'), mkAlly('orc',9,'c_pow1'),
], ['lyrica']);
trial('S3.ドンガ(Lv14)', [
  mkHero(14,'w_steel','a_steel','s_iron'),
  mkAlly('kingslime',13,'c_def1'), mkAlly('darkelf',13,'c_pow1'), mkAlly('orc',13,'c_pow1'),
], ['donga']);
trial('S4.ファゴル(Lv18)', [
  mkHero(18,'w_flame','a_flame','s_steel'),
  mkAlly('kingslime',17,'c_def2'), mkAlly('mage',17,'c_agi1'), mkAlly('scorpion',17,'c_pow2'),
], ['fagor']);
trial('S5.バリトン(Lv21)', [
  mkHero(21,'w_dragon','a_flame','s_steel'),
  mkAlly('kingslime',20,'c_def2'), mkAlly('mage',20,'c_agi1'), mkAlly('flamewolf',20,'c_pow2'),
], ['bariton']);
trial('S6.キリエ(Lv23)', [
  mkHero(23,'w_dragon','a_dragon','s_dragon'),
  mkAlly('kingslime',22,'c_def2'), mkAlly('mage',22,'c_agi1'), mkAlly('dragon',22,'c_pow2'),
], ['b_kirie']);
trial('S7.ノクターン(Lv28)', [
  mkHero(28,'w_star','a_dragon','s_dragon'),
  mkAlly('kingslime',27,'c_def2'), mkAlly('dragon',27,'c_pow2'), mkAlly('demon',27,'c_agi2'),
], ['nocturne']);
trial('S7b.ノクターン(Lv30ガチ)', [
  mkHero(30,'w_star','a_hikari','s_hikari'),
  mkAlly('kingslime',29,'c_def3'), mkAlly('blackdragon',29,'c_pow3'), mkAlly('dknight',29,'c_pow3'),
], ['nocturne']);

console.log('--- 過去作ボス（寄り道） ---');
trial('P1.ゴブリンロード(Lv6)', [
  mkHero(6,'w_copper','a_leather','s_leather'),
  mkAlly('slime',6,null), mkAlly('goblin',6,null),
], ['goblinlord']);
trial('P2.ガイアワーム(Lv8)', [
  mkHero(8,'w_iron','a_leather','s_leather'),
  mkAlly('slime',7,null), mkAlly('skeleton',7,'c_pow1'), mkAlly('bee',7,null),
], ['gaiaworm']);
trial('P3.グランツリー(Lv11)', [
  mkHero(11,'w_iron','a_chain','s_iron'),
  mkAlly('slime',10,'c_def1'), mkAlly('mage',10,'c_agi1'), mkAlly('orc',10,'c_pow1'),
], ['grantree']);
trial('P4.エルダートレント(Lv13)', [
  mkHero(13,'w_steel','a_chain','s_iron'),
  mkAlly('kingslime',12,'c_def1'), mkAlly('mage',12,'c_agi1'), mkAlly('orc',12,'c_pow1'),
], ['eldertrent']);
trial('P5.クラーケン(Lv15)', [
  mkHero(15,'w_steel','a_steel','s_iron'),
  mkAlly('kingslime',14,'c_def1'), mkAlly('mage',14,'c_agi1'), mkAlly('darkelf',14,'c_pow1'),
], ['kraken']);
trial('P6.ファラオ(Lv17)', [
  mkHero(17,'w_flame','a_flame','s_steel'),
  mkAlly('kingslime',16,'c_def2'), mkAlly('mage',16,'c_agi1'), mkAlly('scorpion',16,'c_pow2'),
], ['pharaoh']);
trial('P7.グラシエス(Lv20)', [
  mkHero(20,'w_dragon','a_flame','s_steel'),
  mkAlly('kingslime',19,'c_def2'), mkAlly('mage',19,'c_agi1'), mkAlly('flamewolf',19,'c_pow2'),
], ['glacies']);
trial('P8.イグニス(Lv22)', [
  mkHero(22,'w_dragon','a_dragon','s_steel'),
  mkAlly('kingslime',21,'c_def2'), mkAlly('snowghost',21,'c_agi2'), mkAlly('flamewolf',21,'c_pow2'),
], ['ignis']);
trial('P9.レイガ(Lv25)', [
  mkHero(25,'w_dragon','a_dragon','s_dragon'),
  mkAlly('kingslime',24,'c_def2'), mkAlly('snowghost',24,'c_agi2'), mkAlly('dragon',24,'c_pow2'),
], ['reiga']);
trial('P10.ザルバ(Lv28)', [
  mkHero(28,'w_star','a_dragon','s_dragon'),
  mkAlly('kingslime',27,'c_def3'), mkAlly('dragon',27,'c_pow2'), mkAlly('demon',27,'c_agi2'),
], ['zarba']);
trial('P11.ザガン(Lv30)', [
  mkHero(30,'w_star','a_hikari','s_hikari'),
  mkAlly('kingslime',29,'c_def3'), mkAlly('blackdragon',29,'c_pow3'), mkAlly('archdemon',29,'c_agi3'),
], ['darkgeneral']);
trial('P12.ノワール(Lv32)', [
  mkHero(32,'w_king','a_hikari','s_hikari'),
  mkAlly('kingslime',31,'c_def3'), mkAlly('blackdragon',31,'c_pow3'), mkAlly('dknight',31,'c_pow3'),
], ['noir']);

console.log('--- 裏ボス ---');
trial('E1.エデン(Lv34フル)', [
  mkHero(34,'w_king','a_hikari','s_hikari'),
  mkAlly('kingslime',33,'c_def3'), mkAlly('blackdragon',33,'c_pow3'), mkAlly('dknight',33,'c_pow3'),
], ['eden']);
trial('E1b.エデン(Lv35カンスト)', [
  mkHero(35,'w_king','a_hikari','s_hikari'),
  mkAlly('firebird',35,'c_agi3'), mkAlly('blackdragon',35,'c_pow3'), mkAlly('dknight',35,'c_pow3'),
], ['eden']);

console.log('=== ザコ戦サンプル ===');
trial('草原 slime x2 (Lv1 hero+slime)', [mkHero(1,'w_stick',null,null), mkAlly('slime',1,null)], ['slime','slime']);
trial('草原 bee (Lv2)', [mkHero(2,'w_stick','a_cloth',null), mkAlly('slime',2,null)], ['bee']);
trial('洞窟 skeleton+worm (Lv4)', [
  mkHero(4,'w_copper','a_leather','s_leather'), mkAlly('slime',4,null), mkAlly('goblin',4,null)], ['skeleton','worm']);
trial('海 serpent+merman (Lv13)', [
  mkHero(13,'w_steel','a_chain','s_iron'), mkAlly('kingslime',12,'c_def1'),
  mkAlly('mage',12,'c_agi1'), mkAlly('orc',12,'c_pow1')], ['seaserpent','merman']);
trial('オペラ hh+hh+arch (Lv29)', [
  mkHero(29,'w_star','a_hikari','s_hikari'), mkAlly('kingslime',28,'c_def3'),
  mkAlly('blackdragon',28,'c_pow3'), mkAlly('dknight',28,'c_pow3')],
  ['hellhound','hellhound','archdemon']);
