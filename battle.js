// ============================================================
// battle.js — パーティ制ターンバトル（DQ風・コマンド一括入力）
// にく / 起き上がり / 魔物のとくぎ対応
// ============================================================
'use strict';

let BV = null; // バトル描画用ステート

function aliveFoes(foes){ return foes.filter(f=>!f.dead); }

function fieldBgmName(){
  return MAPS[curMap].world && getTile(curMap, hero.x, hero.y)==='~' ? 'sea' : MAPS[curMap].bgm;
}

function physDmg(atk, def){
  const base = atk/2 - def/4;
  if(base <= 0.5) return Math.random()<0.5 ? 0 : 1;
  return Math.max(0, Math.round(base * (0.85 + Math.random()*0.3)));
}

function makeFoe(id, idx, group){
  const m = MONSTERS[id];
  const dup = group.filter(g=>g===id).length > 1;
  return {
    key:id, name: m.name + (dup ? ['Ａ','Ｂ','Ｃ','Ｄ'][group.slice(0,idx).filter(g=>g===id).length] : ''),
    emoji:m.emoji, hp:m.hp, maxhp:m.hp,
    atk:m.atk, def:m.def, agi:m.agi, exp:m.exp, gold:m.gold,
    acts:m.acts || [{w:100,t:'atk'}],
    fireWeak:!!m.fireWeak, iceWeak:!!m.iceWeak, boss:!!m.boss, next:m.next || null,
    tameable: !!m.tame, tameBonus:0,
    defMul:1, asleep:0, poison:false, dead:false, shake:0, deadT:0, transformed:false,
  };
}

function makeMemberState(){
  return G.party.map(()=>({asleep:0, guard:false, atkX:1}));
}
function effDef(i){
  const m = G.party[i];
  let d = Math.floor(mDef(m) * BV.defX);
  if(BV.ms[i].guard) d *= 2;
  return d;
}
function foeDef(f){ return Math.floor(f.def * f.defMul); }

// 敵のターゲット選択（前衛ほど狙われやすい）
function pickTargetIdx(){
  const weights = [5,4,3,2];
  const cands = [];
  G.party.forEach((m,i)=>{ if(m.hp>0) cands.push({i, w:weights[i]||2}); });
  const total = cands.reduce((s,c)=>s+c.w,0);
  let r = Math.random()*total;
  for(const c of cands){ r -= c.w; if(r<0) return c.i; }
  return cands[0].i;
}

async function runBattle(group, opts={}){
  scene = 'battle';
  playBgm(opts.boss ? 'boss' : 'battle');
  SFX.encounter();
  const foes = group.map((id,i)=>makeFoe(id, i, group));
  BV = {foes, boss:!!opts.boss, shake:0, flash:0, defX:1, ms:makeMemberState(), activeIdx:-1, killOrder:[]};

  const seen = new Set();
  const lines = [];
  for(const f of foes){
    const base = MONSTERS[f.key].name;
    if(seen.has(base)) continue;
    seen.add(base);
    const cnt = foes.filter(x=>x.key===f.key).length;
    lines.push(cnt>1 ? `${base}たちが あらわれた！` : `${base}が あらわれた！`);
  }
  await msg(lines);

  for(;;){
    BV.ms.forEach(s=>s.guard=false);

    // --- コマンド入力 ---
    const actions = new Array(G.party.length).fill(null);
    const inputIdxs = [];
    G.party.forEach((m,i)=>{ if(m.hp>0 && BV.ms[i].asleep===0) inputIdxs.push(i); });
    let pi = 0;
    while(pi < inputIdxs.length){
      const i = inputIdxs[pi];
      BV.activeIdx = i;
      const a = await memberCommand(i, foes, opts, pi>0);
      if(a==='back'){ pi--; continue; }
      actions[i] = a;
      if(a.t==='run') break;
      pi++;
    }
    BV.activeIdx = -1;

    // --- にげる ---
    const runner = inputIdxs.find(i=>actions[i] && actions[i].t==='run');
    if(runner!==undefined){
      const m = G.party[runner];
      let escaped = false;
      if(opts.boss || opts.forceTame){
        SFX.miss();
        await msg('みんなは にげだした！', 'しかし まわりこまれてしまった！');
      } else {
        const avgAgi = aliveFoes(foes).reduce((s,f)=>s+f.agi,0) / aliveFoes(foes).length;
        if(Math.random() < (mAgi(m)*2) / (mAgi(m)*2 + avgAgi)){
          SFX.run();
          await msg('みんなは にげだした！');
          escaped = true;
        } else {
          SFX.miss();
          await msg('みんなは にげだした！', 'しかし まわりこまれてしまった！');
        }
      }
      if(escaped){
        BV = null;
        scene = 'field';
        playBgm(fieldBgmName());
        return 'ran';
      }
      actions.fill(null);
    }

    // --- 行動順 ---
    const turns = [];
    G.party.forEach((m,i)=>{
      if(m.hp>0) turns.push({member:i, spd: mAgi(m)*(0.7+Math.random()*0.6)});
    });
    for(const f of aliveFoes(foes)) turns.push({foe:f, spd: f.agi*(0.7+Math.random()*0.6)});
    turns.sort((a,b)=>b.spd-a.spd);

    for(const t of turns){
      if(aliveParty().length===0 || aliveFoes(foes).length===0) break;
      if(t.member!==undefined){
        const i = t.member;
        const m = G.party[i];
        if(m.hp<=0) continue;
        if(BV.ms[i].asleep > 0){
          if(Math.random()<0.5){ BV.ms[i].asleep=0; await msg(`${m.name}は めを さました！`); }
          else { BV.ms[i].asleep--; await msg(`${m.name}は ぐっすり ねむっている……`); continue; }
          continue;
        }
        if(!actions[i]) continue;
        await memberAct(i, actions[i], foes, opts);
      } else {
        const f = t.foe;
        if(f.dead) continue;
        if(f.asleep > 0){
          if(Math.random()<0.5){ f.asleep=0; await msg(`${f.name}は めを さました！`); }
          else { f.asleep--; await msg(`${f.name}は ねむっている……`); continue; }
          continue;
        }
        await enemyAct(f);
      }
    }

    // --- 敵の毒ダメージ（ターン終了時） ---
    for(const f of aliveFoes(foes)){
      if(!f.poison) continue;
      const dmg = ri(3,6) + Math.floor(f.maxhp*0.02);
      f.hp -= dmg; f.shake = 8;
      await msg(`${f.name}は どくに むしばまれている！ ${dmg}の ダメージ！`);
      if(f.hp<=0) await foeDown(f);
    }

    if(aliveParty().length===0){
      await sleep(400);
      BV = null;
      return 'dead';
    }
    for(const f of foes){
      if(!f.dead && f.hp<=0) await foeDown(f);
    }
    if(aliveFoes(foes).length===0){
      stopBgm();
      SFX.levelup();
      await msg(BV.boss ? `${foes[foes.length-1].name}を うちたおした！！` : 'まものたちは われに かえった！');
      const exp = foes.reduce((s,f)=>s+f.exp,0);
      const gold = foes.reduce((s,f)=>s+f.gold,0);
      const killOrder = BV.killOrder;
      BV = null;
      scene = 'field';
      await gainExpGold(exp, gold);
      // --- 起き上がり判定 ---
      await tameCheck(killOrder, opts);
      playBgm(fieldBgmName());
      return 'win';
    }
  }
}

// 倒した順に起き上がりチェック（1戦闘で1体まで）
async function tameCheck(killOrder, opts){
  if(opts.forceTame){
    const f = killOrder.find(x=>x.tameable && !ownsSpecies(x.key));
    if(f) await tameFlow(f.key, {forced:true});
    return;
  }
  for(const f of killOrder){
    if(!f.tameable || f.boss) continue;
    if(ownsSpecies(f.key)) continue;   // 同じ種族は すでに1匹いるので起き上がらない
    const rate = Math.min(0.95, (MONSTERS[f.key].tame||0) + f.tameBonus);
    if(Math.random() < rate){
      await tameFlow(f.key);
      return;
    }
  }
}

async function foeDown(f){
  if(f.next && !f.transformed){
    f.transformed = true;
    SFX.crit();
    await msg(`${f.name}は がっくりと ひざを ついた……`);
    if(f.key==='nocturne'){
      await msg('「……すばらしい。 なんという ひびき だ。」',
        '「ならば わたしも ほんきの うたで こたえよう──」',
        '「だいにがくしょう、 《めつぼう》！！」');
    } else {
      await msg('「……よくぞ ここまで きたな。」',
        '「だが みせてやろう…… これが しんの ちからだ！！」');
    }
    const nm = MONSTERS[f.next];
    f.key = f.next; f.name = nm.name; f.emoji = nm.emoji;
    f.hp = nm.hp; f.maxhp = nm.hp;
    f.atk = nm.atk; f.def = nm.def; f.agi = nm.agi;
    f.exp = nm.exp; f.gold = nm.gold;
    f.acts = nm.acts || [{w:100,t:'atk'}];
    f.next = null; f.asleep = 0; f.defMul = 1; f.poison = false;
    BV.flash = 14; BV.shake = 16;
    SFX.encounter();
    await msg(`${f.name}が たちはだかった！！`);
  } else {
    f.dead = true; f.deadT = 20;
    SFX.hit();
    if(BV) BV.killOrder.push(f);
    await msg(`${f.name}を たおした！`);
  }
}

// ---------------- コマンド入力 ----------------
async function memberCommand(i, foes, opts, canBack){
  const m = G.party[i];
  for(;;){
    const menu = ['たたかう', m.monster?'とくぎ':'じゅもん','ぼうぎょ','どうぐ'];
    if(!canBack) menu.push('にげる');
    const c = await choiceMenu(menu, {x:16, y:152, w:170, title:m.name, cancelable:true});
    if(c<0){
      if(canBack) return 'back';
      continue;
    }
    if(c===0){
      const t = await chooseFoe(foes);
      if(t===null) continue;
      return {t:'attack', target:t};
    }
    if(c===1){
      const sp = await battleSpellMenu(i, foes);
      if(sp) return sp;
      continue;
    }
    if(c===2) return {t:'guard'};
    if(c===3){
      const it = await battleItemMenu(foes);
      if(it) return it;
      continue;
    }
    if(c===4) return {t:'run'};
  }
}

async function chooseFoe(foes){
  const alive = aliveFoes(foes);
  if(alive.length===1) return alive[0];
  const i = await choiceMenu(alive.map(f=>f.name), {x:200, y:152, title:'どれに？'});
  if(i<0) return null;
  return alive[i];
}

async function battleSpellMenu(i, foes){
  const m = G.party[i];
  if(m.spells.length===0){ await msg(`${m.name}は まだ なにも おぼえていない！`); return null; }
  const items = m.spells.map(id=>({label:SPELLS[id].name, right:`MP${SPELLS[id].mp}`}));
  const si = await choiceMenu(items, {x:200, y:152, title:`MP ${m.mp}/${mMaxMp(m)}`});
  if(si<0) return null;
  const id = m.spells[si];
  const sp = SPELLS[id];
  if(sp.t==='return'){ await msg('たたかいの さいちゅうに となえる じゅもんではない！'); return null; }
  if(m.mp < sp.mp){ await msg('MPが たりない！'); return null; }
  if(sp.t==='dmg' || sp.t==='phys' || sp.t==='drain'){
    const t = await chooseFoe(foes);
    if(t===null) return null;
    return {t:'spell', id, target:t};
  }
  if(sp.t==='heal' || sp.t==='fullheal'){
    const tgt = await chooseMember('だれに？', mm=>mm.hp>0, {x:380, y:152, right:mm=>`${mm.hp}/${mMaxHp(mm)}`});
    if(!tgt) return null;
    return {t:'spell', id, member:tgt};
  }
  if(sp.t==='cure'){
    const tgt = await chooseMember('だれに？', mm=>mm.poison, {x:380, y:152});
    if(!tgt){ await msg('どくに かかっている なかまは いない！'); return null; }
    return {t:'spell', id, member:tgt};
  }
  if(sp.t==='revive'){
    const tgt = await chooseMember('だれに？', mm=>mm.hp<=0, {x:380, y:152});
    if(!tgt){ await msg('ちからつきた なかまは いない！'); return null; }
    return {t:'spell', id, member:tgt};
  }
  if(sp.t==='atkup'){
    const tgt = await chooseMember('だれに？', mm=>mm.hp>0, {x:380, y:152, right:mm=>`こうげき${mAtk(mm)}`});
    if(!tgt) return null;
    return {t:'spell', id, member:tgt};
  }
  return {t:'spell', id};
}

async function battleItemMenu(foes){
  if(G.inv.length===0){ await msg('どうぐを なにも もっていない！'); return null; }
  const items = G.inv.map(e=>({label:ITEMS[e.id].name + (e.n>1?` x${e.n}`:''), right:''}));
  const i = await choiceMenu(items, {x:200, y:152, title:'どうぐ'});
  if(i<0) return null;
  const id = G.inv[i].id;
  const it = ITEMS[id];
  if(it.t==='meat'){
    const t = await chooseFoe(foes);
    if(t===null) return null;
    return {t:'item', id, target:t};
  }
  if(it.t==='heal' || it.t==='mp'){
    const tgt = await chooseMember('だれに？', mm=>mm.hp>0, {x:380, y:152, right:mm=> it.t==='mp' ? `MP${mm.mp}` : `${mm.hp}/${mMaxHp(mm)}`});
    if(!tgt) return null;
    return {t:'item', id, member:tgt};
  }
  if(it.t==='cure'){
    const tgt = await chooseMember('だれに？', mm=>mm.poison, {x:380, y:152});
    if(!tgt){ await msg('どくに かかっている なかまは いない！'); return null; }
    return {t:'item', id, member:tgt};
  }
  if(it.t==='revive'){
    const tgt = await chooseMember('だれに？', mm=>mm.hp<=0, {x:380, y:152});
    if(!tgt){ await msg('ちからつきた なかまは いない！'); return null; }
    return {t:'item', id, member:tgt};
  }
  await msg('いまは つかえない！');
  return null;
}

// ---------------- 味方の行動 ----------------
async function hitFoe(target, dmg, foes){
  target.hp -= dmg; target.shake = 10;
  await msg(`${target.name}に ${dmg}の ダメージ！`);
  if(target.hp<=0) await foeDown(target);
}

async function memberAct(i, action, foes, opts){
  const m = G.party[i];
  if(action.t==='attack'){
    let target = action.target;
    if(target.dead) target = aliveFoes(foes)[0];
    if(!target) return;
    await msg(`${m.name}の こうげき！`);
    SFX.slash();
    const atk = Math.floor(mAtk(m) * BV.ms[i].atkX);
    if(Math.random() < 1/24){
      const dmg = Math.round(atk * (0.75 + Math.random()*0.25));
      SFX.crit();
      target.hp -= dmg; target.shake = 12;
      BV.flash = 8;
      await msg('かいしんの いちげき！！', `${target.name}に ${dmg}の ダメージ！`);
      if(target.hp<=0) await foeDown(target);
    } else if(Math.random() < 1/24){
      SFX.miss();
      await msg('ミス！ ダメージを あたえられない！');
    } else {
      const dmg = physDmg(atk, foeDef(target));
      await hitFoe(target, dmg, foes);
    }
  }
  else if(action.t==='guard'){
    BV.ms[i].guard = true;
    SFX.buff();
    await msg(`${m.name}は みをまもっている。`);
  }
  else if(action.t==='spell'){
    const sp = SPELLS[action.id];
    if(m.mp < sp.mp){ await msg(`${m.name}は MPが たりない！`); return; }
    m.mp -= sp.mp;
    const verb = sp.song ? 'うたいだした' : (sp.t==='phys'||sp.t==='drain') ? 'はなった' : 'となえた';
    await msg(`${m.name}は ${sp.name}を ${verb}！`);
    SFX.spell();
    BV.flash = 8;
    if(sp.t==='dmg'){
      let target = action.target;
      if(target.dead) target = aliveFoes(foes)[0];
      if(!target) return;
      let dmg = ri(sp.min, sp.max);
      let weak = false;
      if(sp.elem==='fire' && target.fireWeak){ dmg = Math.round(dmg*1.5); weak = true; }
      if(sp.elem==='ice' && target.iceWeak){ dmg = Math.round(dmg*1.5); weak = true; }
      target.hp -= dmg; target.shake = 10;
      await msg((weak?'こうかは ばつぐんだ！ ':'') + `${target.name}に ${dmg}の ダメージ！`);
      if(target.hp<=0) await foeDown(target);
    } else if(sp.t==='phys'){
      let target = action.target;
      if(target.dead) target = aliveFoes(foes)[0];
      if(!target) return;
      const hits = sp.hits || 1;
      const atk = Math.floor(mAtk(m) * BV.ms[i].atkX * sp.mul);
      for(let h=0; h<hits; h++){
        if(target.dead){ target = aliveFoes(foes)[0]; if(!target) break; }
        SFX.slash();
        const dmg = physDmg(atk, foeDef(target));
        await hitFoe(target, dmg, foes);
        if(!target.dead && sp.poison && !target.boss && !target.poison && Math.random()<0.5){
          target.poison = true;
          await msg(`${target.name}は どくに おかされた！`);
        }
      }
    } else if(sp.t==='drain'){
      let target = action.target;
      if(target.dead) target = aliveFoes(foes)[0];
      if(!target) return;
      const dmg = ri(sp.min, sp.max);
      target.hp -= dmg; target.shake = 10;
      const heal = Math.min(Math.floor(dmg/2), mMaxHp(m)-m.hp);
      m.hp += heal;
      await msg(`${target.name}から ${dmg}の せいきを すいとった！`,
        heal>0 ? `${m.name}の HPが ${heal} かいふくした！` : null);
      if(target.hp<=0) await foeDown(target);
    } else if(sp.t==='dmgall'){
      for(const f of aliveFoes(foes)){
        let dmg = ri(sp.min, sp.max);
        if(sp.elem==='fire' && f.fireWeak) dmg = Math.round(dmg*1.5);
        if(sp.elem==='ice' && f.iceWeak) dmg = Math.round(dmg*1.5);
        f.hp -= dmg; f.shake = 10;
        await msg(`${f.name}に ${dmg}の ダメージ！`);
      }
      for(const f of foes) if(!f.dead && f.hp<=0) await foeDown(f);
    } else if(sp.t==='poisonall'){
      for(const f of aliveFoes(foes)){
        if(sp.max>0){
          const dmg = ri(sp.min, sp.max);
          f.hp -= dmg; f.shake = 8;
          await msg(`${f.name}に ${dmg}の ダメージ！`);
        }
        if(!f.dead && !f.boss && !f.poison && Math.random()<0.55){
          f.poison = true;
          await msg(`${f.name}は どくに おかされた！`);
        }
      }
      for(const f of foes) if(!f.dead && f.hp<=0) await foeDown(f);
    } else if(sp.t==='heal'){
      let tgt = action.member;
      if(!tgt || tgt.hp<=0) tgt = aliveParty().sort((a,b)=>(a.hp/mMaxHp(a))-(b.hp/mMaxHp(b)))[0];
      const n = Math.min(ri(sp.min,sp.max), mMaxHp(tgt)-tgt.hp);
      tgt.hp += n;
      SFX.heal();
      await msg(`${tgt.name}の HPが ${n} かいふくした！`);
    } else if(sp.t==='fullheal'){
      let tgt = action.member;
      if(!tgt || tgt.hp<=0) tgt = aliveParty().sort((a,b)=>(a.hp/mMaxHp(a))-(b.hp/mMaxHp(b)))[0];
      tgt.hp = mMaxHp(tgt);
      SFX.heal();
      await msg(`${tgt.name}の HPが かんぜんに かいふくした！`);
    } else if(sp.t==='healall'){
      SFX.heal();
      for(const mm of aliveParty()){
        mm.hp = Math.min(mMaxHp(mm), mm.hp + ri(sp.min,sp.max));
      }
      await msg('みんなの HPが かいふくした！');
    } else if(sp.t==='cure'){
      const tgt = action.member;
      if(tgt && tgt.poison){
        tgt.poison = false;
        SFX.heal();
        await msg(`${tgt.name}の どくが きえさった！`);
      } else await msg('しかし なにも おこらなかった。');
    } else if(sp.t==='revive'){
      const tgt = action.member;
      if(tgt && tgt.hp<=0){
        SFX.revive();
        tgt.hp = Math.floor(mMaxHp(tgt)/2);
        await msg(`${tgt.name}は いきかえった！`);
      } else await msg('しかし なにも おこらなかった。');
    } else if(sp.t==='sleep'){
      for(const f of aliveFoes(foes)){
        if(f.boss || Math.random()<0.25){
          await msg(`しかし ${f.name}には きかなかった！`);
        } else {
          f.asleep = ri(2,3);
          await msg(`${f.name}は ねむってしまった！`);
        }
      }
    } else if(sp.t==='defup'){
      SFX.buff();
      BV.defX = Math.min(1.6, BV.defX + 0.3);
      await msg('みんなの しゅびりょくが あがった！');
    } else if(sp.t==='atkup'){
      const tgt = action.member;
      if(tgt && tgt.hp>0){
        const ti = G.party.indexOf(tgt);
        BV.ms[ti].atkX = 1.8;
        SFX.buff();
        await msg(`${tgt.name}の こうげきりょくが ぐーんと あがった！`);
      } else await msg('しかし なにも おこらなかった。');
    } else if(sp.t==='atkupall'){
      SFX.buff();
      G.party.forEach((mm,ti)=>{
        if(mm.hp>0) BV.ms[ti].atkX = Math.max(BV.ms[ti].atkX, sp.mul||1.4);
      });
      await msg('ゆうきが わいてきた！ みんなの こうげきりょくが あがった！');
    } else if(sp.t==='defdown'){
      SFX.debuff();
      let hit = false;
      for(const f of aliveFoes(foes)){
        if(f.boss && Math.random()<0.5){ await msg(`しかし ${f.name}には きかなかった！`); continue; }
        f.defMul = Math.max(0.4, f.defMul - 0.3);
        hit = true;
      }
      if(hit) await msg('てきの しゅびりょくが さがった！');
    }
  }
  else if(action.t==='item'){
    const it = ITEMS[action.id];
    if(!G.inv.find(e=>e.id===action.id)){ await msg(`${it.name}は もう なかった！`); return; }
    if(it.t==='meat'){
      let target = action.target;
      if(target.dead) target = aliveFoes(foes).find(f=>f.tameable) || aliveFoes(foes)[0];
      if(!target) return;
      removeItem(action.id);
      SFX.chest();
      await msg(`${m.name}は ${target.name}に ${it.name}を なげあたえた！`);
      if(target.boss || !target.tameable){
        await msg(`${target.name}は ぺろりと たいらげた。`, 'しかし なつきそうな ようすは ない……');
      } else if(ownsSpecies(target.key)){
        await msg(`${target.name}は うれしそうに たべた。`, 'でも おなじ しゅぞくの なかまが もう いるよ！',
          '（この しゅぞくは もう なかまに できない）');
      } else {
        target.tameBonus += it.tame;
        const r = Math.min(0.95, (MONSTERS[target.key].tame||0) + target.tameBonus);
        await msg(`${target.name}は むしゃむしゃ たべて`, 'うれしそうに こちらを みている！',
          r>=0.7 ? '（かなり なつきそうだ！）' : r>=0.4 ? '（なつきそうな きがする）' : '（すこし きょりが ちぢまった）');
      }
      return;
    }
    await msg(`${m.name}は ${it.name}を つかった！`);
    if(it.t==='heal'){
      let tgt = action.member;
      if(!tgt || tgt.hp<=0) tgt = aliveParty()[0];
      const n = Math.min(ri(it.min,it.max), mMaxHp(tgt)-tgt.hp);
      tgt.hp += n; removeItem(action.id);
      SFX.heal();
      await msg(`${tgt.name}の HPが ${n} かいふくした！`);
    } else if(it.t==='mp'){
      let tgt = action.member;
      if(!tgt || tgt.hp<=0) tgt = aliveParty()[0];
      const n = Math.min(it.amt, mMaxMp(tgt)-tgt.mp);
      tgt.mp += n; removeItem(action.id);
      SFX.heal();
      await msg(`${tgt.name}の MPが ${n} かいふくした！`);
    } else if(it.t==='cure'){
      const tgt = action.member;
      if(tgt && tgt.poison){
        tgt.poison = false; removeItem(action.id);
        SFX.heal();
        await msg(`${tgt.name}の どくが きえさった！`);
      } else await msg('しかし なにも おこらなかった。');
    } else if(it.t==='revive'){
      const tgt = action.member;
      if(tgt && tgt.hp<=0){
        removeItem(action.id);
        SFX.revive();
        tgt.hp = mMaxHp(tgt);
        await msg(`${tgt.name}は いきかえった！`);
      } else await msg('しかし なにも おこらなかった。');
    }
  }
}

// ---------------- 敵の行動 ----------------
async function enemyAct(f){
  const act = pickWeighted(f.acts);
  const hurtOne = async (idx, dmg, srcMsg)=>{
    const m = G.party[idx];
    m.hp = Math.max(0, m.hp - dmg);
    if(dmg>0){ SFX.hit(); BV.shake = 12; }
    else SFX.miss();
    const lines = [srcMsg, dmg>0 ? `${m.name}は ${dmg}の ダメージを うけた！` : `${m.name}は ダメージを うけなかった！`];
    if(m.hp<=0) lines.push(`${m.name}は ちからつきた……！`);
    await msg(...lines);
  };
  if(act.t==='atk'){
    const i = pickTargetIdx();
    await hurtOne(i, physDmg(f.atk, effDef(i)), `${f.name}の こうげき！`);
  } else if(act.t==='strong'){
    const i = pickTargetIdx();
    await hurtOne(i, physDmg(Math.round(f.atk*(act.mul||1.4)), effDef(i)), `${f.name}は ${act.msg||'すさまじい こうげきを はなった！'}`);
  } else if(act.t==='double'){
    const i = pickTargetIdx();
    await hurtOne(i, physDmg(f.atk, effDef(i)), `${f.name}の れんぞく こうげき！`);
    if(aliveParty().length>0){
      const j = pickTargetIdx();
      await hurtOne(j, physDmg(f.atk, effDef(j)), 'さらに たたみかけてきた！');
    }
  } else if(act.t==='spell'){
    SFX.spell(); BV.flash = 8;
    const i = pickTargetIdx();
    await hurtOne(i, ri(act.min,act.max), `${f.name}は ${act.name}を となえた！`);
  } else if(act.t==='breath'){
    SFX.spell(); BV.flash = 10;
    await msg(`${f.name}は ${act.name}を はなった！`);
    for(const m of G.party){
      if(m.hp<=0) continue;
      const dmg = ri(act.min, act.max);
      m.hp = Math.max(0, m.hp - dmg);
      SFX.hit(); BV.shake = 10;
      const lines = [`${m.name}は ${dmg}の ダメージを うけた！`];
      if(m.hp<=0) lines.push(`${m.name}は ちからつきた……！`);
      await msg(...lines);
    }
  } else if(act.t==='poison'){
    const i = pickTargetIdx();
    const m = G.party[i];
    await hurtOne(i, ri(act.min,act.max), `${f.name}の ${act.name}！`);
    if(m.hp>0 && !m.poison && Math.random()<0.6){
      m.poison = true;
      await msg(`${m.name}は どくに おかされた！`);
    }
  } else if(act.t==='sleep'){
    await msg(`${f.name}は ${act.name}を ひびかせた！`);
    let any = false;
    for(let i=0;i<G.party.length;i++){
      const m = G.party[i];
      if(m.hp<=0 || BV.ms[i].asleep>0) continue;
      if(Math.random()<0.45){
        BV.ms[i].asleep = ri(1,2);
        any = true;
        await msg(`${m.name}は ねむってしまった！`);
      }
    }
    if(!any) await msg('しかし だれも ねむらなかった！');
  }
}

// ---------------- バトル描画 ----------------
const BATTLE_BG_COLOR = {
  world: ['#79b4e8','#3f9e3f'],
  sea:   ['#79b4e8','#2b59c3'],
  cave1: ['#241a12','#4a3b2a'],
  seido: ['#10261a','#2e5238'],
  pyramid:['#3a2c14','#8a6c34'],
  volcano:['#2a0f0a','#6a3020'],
  icecath:['#16243c','#3e5a7c'],
  tower: ['#2a2a3c','#55556a'],
  opera: ['#170f20','#332441'],
  origin:['#1a1a30','#44446a'],
};

function drawBattle(){
  if(!BV){ ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H); return; }
  let bgKey = curMap;
  if(curMap==='world' && getTile('world',hero.x,hero.y)==='~') bgKey = 'sea';
  const colors = BATTLE_BG_COLOR[bgKey] || BATTLE_BG_COLOR.world;
  ctx.save();
  if(BV.shake>0){ ctx.translate(ri(-4,4), ri(-4,4)); BV.shake--; }
  const bgName = pickOk(BATTLE_BG_IMG[bgKey] || []) || 'bg_grassland';
  if(imgOk(bgName)){
    ctx.imageSmoothingEnabled = false;
    const im = IMG[bgName];
    const dw = W+16, dh = dw * im.naturalHeight/im.naturalWidth;
    ctx.drawImage(im, -8, -8, dw, dh);
    if(dh < H+8){ ctx.fillStyle = colors[1]; ctx.fillRect(-8, dh-8, dw, H+16-dh); }
  } else {
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, colors[0]); g.addColorStop(1, colors[1]);
    ctx.fillStyle = g; ctx.fillRect(-8,-8,W+16,H+16);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(W/2, 278, 260, 38, 0, 0, 7); ctx.fill();

  const alive = BV.foes;
  const n = alive.length;
  const spread = n>=4 ? 150 : 180;
  alive.forEach((f, i)=>{
    if(f.dead && f.deadT<=0) return;
    const fx = W/2 + (i-(n-1)/2)*spread;
    const groundY = 268;
    let size = f.boss ? 196 : 120;
    if(n>=3) size = f.boss ? 168 : 98;
    if(n>=4) size = f.boss ? 150 : 86;
    const fy = groundY - size/2;
    if(f.dead){ f.deadT--; ctx.globalAlpha = Math.max(0, f.deadT/20); }
    let ox = 0, oy = 0;
    if(f.shake>0){ ox = ri(-4,4); oy = ri(-2,2); f.shake--; }
    if(!f.dead && !f.boss) oy += Math.sin(frame/20 + i*2)*4;
    if(!f.dead && f.boss) oy += Math.sin(frame/26)*6;
    if(!f.dead){
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.ellipse(fx+ox, groundY+6, size*0.30, size*0.09, 0, 0, 7); ctx.fill();
    }
    if(!drawSpriteCenter(monImg(f.key), fx+ox, fy+oy, size)){
      emoji(f.emoji, fx+ox, fy+oy, f.boss?130:84);
    }
    ctx.globalAlpha = 1;
    if(!f.dead){
      txt(f.name, fx, 312, 14, '#fff', 'center');
      const bw = 90;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(fx-bw/2, 318, bw, 8);
      const r = Math.max(0, f.hp/f.maxhp);
      ctx.fillStyle = r>0.5 ? '#5ad65a' : r>0.25 ? '#ffd34d' : '#ff6b5a';
      ctx.fillRect(fx-bw/2+1, 319, (bw-2)*r, 6);
      if(f.asleep>0) emoji('💤', fx+30, fy-30, 20);
      if(f.poison) emoji('☠️', fx-34, fy-30, 16);
      if(f.tameBonus>0) emoji('🍖', fx+34, fy+6, 16);
    }
  });
  ctx.restore();
  if(BV.flash>0){
    ctx.fillStyle = `rgba(255,255,255,${BV.flash/24})`;
    ctx.fillRect(0,0,W,H);
    BV.flash--;
  }
  drawStatus(BV.activeIdx);
  if(BV.defX>1){
    txt(`🛡×${BV.defX.toFixed(1)}`, W-20, 120, 14, '#9fd0ff', 'right');
  }
}
