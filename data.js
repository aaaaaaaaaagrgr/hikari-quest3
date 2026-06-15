// ============================================================
// data.js — ゲームデータ（主人公・魔物・スキル・アイテム・マップ）
// ヒカリの伝説III 〜まもののマーチ〜
// ============================================================
'use strict';

const MAX_LV = 35;

// ---------------- 経験値テーブル (index = level, 累積) ----------------
const EXP_TABLE = [null, 0,
  7, 20, 45, 90, 160, 260, 400, 590, 840,
  1160, 1560, 2050, 2640, 3340, 4200, 5220, 6420, 7840, 9520,
  11500, 13830, 16560, 19750, 23470, 27800, 32830, 38660, 45400, 53180,
  62360, 73190, 85970, 101050, 118840,
];

// ---------------- 主人公（まものつかい） ----------------
function genGrowth(c){
  const t = [null];
  for(let lv=1; lv<=MAX_LV; lv++){
    const n = lv-1;
    t.push({
      hp:  Math.round(c.hp0 + c.hpG*n + c.hpC*n*n),
      mp:  Math.round(c.mp0 + c.mpG*n + c.mpC*n*n),
      str: Math.round(c.st0 + c.stG*n + c.stC*n*n),
      agi: Math.round(c.ag0 + c.agG*n + c.agC*n*n),
    });
  }
  return t;
}

const CLASSES = {
  kota: {
    defName:'ニコ', role:'まものつかい', img:'kota',
    levels: genGrowth({hp0:22,hpG:8.6,hpC:0.10, mp0:4,mpG:4.6,mpC:0.03, st0:7,stG:2.15,stC:0.02, ag0:6,agG:1.7,agC:0.01}),
    start:[], learn:{3:'heal', 6:'song_guard', 9:'song_sleep', 11:'ret', 14:'song_heal', 16:'healra',
                     18:'song_brave', 22:'rezarek', 26:'fullheal', 30:'song_star'},
  },
};

// ---------------- スキル・じゅもん ----------------
// t: dmg/dmgall/heal/healall/fullheal/cure/revive/return/defup/atkup/atkupall/defdown/sleep
//    phys(物理わざ mul,hits,poison)/drain(吸収)/poisonall(全体毒)
const SPELLS = {
  // --- 回復・補助 ---
  heal:      {name:'ヒール',         mp:3,  t:'heal',   min:25, max:35, field:true},
  healra:    {name:'ヒーラ',         mp:6,  t:'heal',   min:75, max:95, field:true},
  fullheal:  {name:'フルヒール',     mp:12, t:'fullheal', field:true},
  healall:   {name:'ヒールオール',   mp:10, t:'healall', min:60, max:80, field:true},
  megahealall:{name:'メガヒールオール', mp:18, t:'healall', min:110, max:140, field:true},
  cure:      {name:'キュア',         mp:2,  t:'cure',   field:true},
  rezarek:   {name:'リザレク',       mp:10, t:'revive', field:true},
  ret:       {name:'リターン',       mp:6,  t:'return', field:true},
  skult:     {name:'スクルト',       mp:4,  t:'defup'},
  bikilt:    {name:'バイキルト',     mp:6,  t:'atkup'},
  lucanan:   {name:'ルカナン',       mp:4,  t:'defdown'},
  sleep:     {name:'スリプル',       mp:3,  t:'sleep'},
  // --- 主人公のうた ---
  song_guard:{name:'まもりのうた',   mp:4,  t:'defup',  song:true},
  song_sleep:{name:'こもりうた',     mp:5,  t:'sleep',  song:true},
  song_heal: {name:'ひかりのうた',   mp:8,  t:'healall', min:45, max:60, field:true, song:true},
  song_brave:{name:'ゆうきのうた',   mp:12, t:'atkupall', mul:1.4, song:true},
  song_star: {name:'ほしのうた',     mp:16, t:'healall', min:90, max:120, field:true, song:true},
  // --- 攻撃じゅもん ---
  fire:      {name:'ファイア',       mp:2,  t:'dmg',    min:8,  max:16, elem:'fire'},
  icebolt:   {name:'アイスボルト',   mp:4,  t:'dmg',    min:22, max:32, elem:'ice'},
  fira:      {name:'ファイラ',       mp:5,  t:'dmg',    min:30, max:46, elem:'fire'},
  thunder:   {name:'サンダー',       mp:8,  t:'dmgall', min:35, max:50},
  blizzard:  {name:'ブリザド',       mp:8,  t:'dmgall', min:32, max:46, elem:'ice'},
  megafire:  {name:'メガファイア',   mp:12, t:'dmg',    min:80, max:115, elem:'fire'},
  gigathunder:{name:'ギガサンダー',  mp:15, t:'dmgall', min:70, max:95},
  meteo:     {name:'メテオ',         mp:18, t:'dmgall', min:85, max:120},
  darkball:  {name:'ダークボール',   mp:5,  t:'dmg',    min:28, max:40},
  darkflare: {name:'ダークフレア',   mp:9,  t:'dmg',    min:48, max:66},
  darknebula:{name:'ダークネビュラ', mp:16, t:'dmgall', min:60, max:80},
  yamiiki:   {name:'やみのいき',     mp:3,  t:'dmgall', min:12, max:18},
  // --- ブレス・全体わざ ---
  br_fire1:  {name:'かえんのいき',   mp:6,  t:'dmgall', min:25, max:35, elem:'fire'},
  br_fire2:  {name:'ごうかのいき',   mp:12, t:'dmgall', min:48, max:62, elem:'fire'},
  br_ice1:   {name:'こおりのいき',   mp:6,  t:'dmgall', min:24, max:34, elem:'ice'},
  br_ice2:   {name:'ぜったいれいど', mp:14, t:'dmgall', min:62, max:82, elem:'ice'},
  br_dark:   {name:'やみのほのお',   mp:12, t:'dmgall', min:45, max:60},
  br_end:    {name:'しゅうえんのほのお', mp:18, t:'dmgall', min:75, max:95},
  tsunami:   {name:'つなみ',         mp:7,  t:'dmgall', min:20, max:30},
  tsunami2:  {name:'おおつなみ',     mp:13, t:'dmgall', min:38, max:52},
  sandstorm: {name:'すなあらし',     mp:5,  t:'dmgall', min:14, max:22},
  quake:     {name:'だいじしん',     mp:13, t:'dmgall', min:45, max:60},
  holybr:    {name:'ホーリーブレス', mp:15, t:'dmgall', min:80, max:100},
  // --- 吸収 ---
  drain1:    {name:'すいけつ',       mp:2,  t:'drain',  min:9,  max:15},
  drain2:    {name:'ドレインビート', mp:5,  t:'drain',  min:22, max:32},
  drain3:    {name:'バンパイアキッス', mp:9, t:'drain', min:42, max:60},
  drainM:    {name:'ミイラドレイン', mp:7,  t:'drain',  min:30, max:45},
  // --- 物理わざ（atk×mul を hits回） ---
  ph_slash:  {name:'きりさく',       mp:2,  t:'phys', mul:1.3},
  ph_smash:  {name:'ぶんまわし',     mp:2,  t:'phys', mul:1.35},
  ph_rock:   {name:'がんせきおとし', mp:4,  t:'phys', mul:1.6},
  ph_lava:   {name:'ようがんパンチ', mp:4,  t:'phys', mul:1.5},
  ph_double: {name:'つばめがえし',   mp:3,  t:'phys', mul:0.8, hits:2},
  ph_triple: {name:'みだれひっかき', mp:6,  t:'phys', mul:0.65, hits:3},
  ph_fang:   {name:'かみくだき',     mp:4,  t:'phys', mul:1.5},
  ph_fang2:  {name:'じごくのキバ',   mp:5,  t:'phys', mul:0.85, hits:2},
  ph_dfang:  {name:'デスファング',   mp:10, t:'phys', mul:2.2},
  ph_zan:    {name:'ざんてつけん',   mp:8,  t:'phys', mul:1.9},
  ph_dance:  {name:'つるぎのまい',   mp:12, t:'phys', mul:0.7, hits:4},
  ph_full:   {name:'ぜんりょくふりおろし', mp:8, t:'phys', mul:2.0},
  ph_drag:   {name:'りゅうのいかり', mp:10, t:'phys', mul:2.0},
  ph_icecr:  {name:'アイスクラッシュ', mp:8, t:'phys', mul:2.0},
  ph_spear:  {name:'もりづき',       mp:3,  t:'phys', mul:1.4},
  ph_poison: {name:'どくばり',       mp:2,  t:'phys', mul:1.0, poison:true},
  ph_poison2:{name:'デスシザー',     mp:6,  t:'phys', mul:1.8, poison:true},
  ph_needle: {name:'デスニードル',   mp:8,  t:'phys', mul:1.6, poison:true},
  ph_needle2:{name:'みだれづき',     mp:4,  t:'phys', mul:0.75, hits:2},
  ph_ffang:  {name:'かえんのキバ',   mp:3,  t:'phys', mul:1.3},
  ph_ffang2: {name:'ごうかのキバ',   mp:8,  t:'phys', mul:1.7},
  // --- 毒・状態 ---
  poisonfog: {name:'どくのきり',     mp:3,  t:'poisonall', min:6, max:10},
  poisonpow: {name:'どくのこな',     mp:4,  t:'poisonall', min:0, max:0},
  sl_powder: {name:'ねむりのこな',   mp:3,  t:'sleep'},
  sl_sonic:  {name:'ねむりのちょうおんぱ', mp:4, t:'sleep'},
  sl_curse:  {name:'のろいのほうたい', mp:4, t:'sleep'},
  howl:      {name:'ハウリング',     mp:3,  t:'defdown'},
  // --- 魔物の回復わざ ---
  fl_heal:   {name:'いやしのかふん', mp:10, t:'healall', min:50, max:70, field:true},
  tr_heal:   {name:'だいちのめぐみ', mp:9,  t:'healall', min:45, max:60, field:true},
  px_dance:  {name:'フェニックスのまい', mp:12, t:'healall', min:70, max:90, field:true},
};

// ---------------- アイテム・装備 ----------------
// type: tool / weapon / armor / shield(主人公専用) / charm(魔物専用アクセサリ)
const ITEMS = {
  herb:     {name:'やくそう',         type:'tool', price:8,    t:'heal', min:30, max:40},
  hherb:    {name:'いやしそう',       type:'tool', price:40,   t:'heal', min:85, max:105},
  antidote: {name:'どくけしそう',     type:'tool', price:12,   t:'cure'},
  mwater:   {name:'まほうのみず',     type:'tool', price:90,   t:'mp', amt:30},
  mwater2:  {name:'まほうのせいすい', type:'tool', price:300,  t:'mp', amt:90},
  wing:     {name:'かえりのつばさ',   type:'tool', price:60,   t:'return'},
  lifeorb:  {name:'ふっかつのたま',   type:'tool', price:600,  t:'revive'},
  seedstr:  {name:'ちからのたね',     type:'tool', price:0,    t:'seed', stat:'str', amt:3},
  seeddef:  {name:'まもりのたね',     type:'tool', price:0,    t:'seed', stat:'def', amt:4},
  seedagi:  {name:'すばやさのたね',   type:'tool', price:0,    t:'seed', stat:'agi', amt:5},
  meat1:    {name:'にく',             type:'tool', price:30,   t:'meat', tame:0.15},
  meat2:    {name:'じょうとうにく',   type:'tool', price:180,  t:'meat', tame:0.35},
  meat3:    {name:'まぼろしのにく',   type:'tool', price:1500, t:'meat', tame:0.70},

  w_stick:  {name:'ひのきのぼう',     type:'weapon', price:10,   pow:2},
  w_dagger: {name:'ダガー',           type:'weapon', price:60,   pow:5},
  w_copper: {name:'どうのつるぎ',     type:'weapon', price:150,  pow:9},
  w_iron:   {name:'てつのつるぎ',     type:'weapon', price:450,  pow:15},
  w_steel:  {name:'はがねのつるぎ',   type:'weapon', price:1100, pow:22},
  w_flame:  {name:'ほのおのつるぎ',   type:'weapon', price:2800, pow:31},
  w_dragon: {name:'ドラゴンキラー',   type:'weapon', price:6000, pow:40},
  w_star:   {name:'ほしのつるぎ',     type:'weapon', price:0,    pow:46},
  w_king:   {name:'おうじゃのつるぎ', type:'weapon', price:0,    pow:54},

  a_cloth:  {name:'ぬののふく',       type:'armor', price:15,   pow:2},
  a_leather:{name:'かわのよろい',     type:'armor', price:110,  pow:6},
  a_chain:  {name:'くさりかたびら',   type:'armor', price:450,  pow:11},
  a_steel:  {name:'はがねのよろい',   type:'armor', price:1100, pow:17},
  a_flame:  {name:'ほのおのよろい',   type:'armor', price:2900, pow:24},
  a_dragon: {name:'りゅうのよろい',   type:'armor', price:6300, pow:32},
  a_hikari: {name:'ひかりのよろい',   type:'armor', price:0,    pow:42},

  s_leather:{name:'かわのたて',       type:'shield', price:60,   pow:3},
  s_iron:   {name:'てつのたて',       type:'shield', price:400,  pow:7},
  s_steel:  {name:'はがねのたて',     type:'shield', price:1300, pow:12},
  s_dragon: {name:'りゅうのたて',     type:'shield', price:5800, pow:18},
  s_hikari: {name:'ひかりのたて',     type:'shield', price:0,    pow:25},

  c_pow1:   {name:'きばのおまもり',   type:'charm', price:250,  pow:4,  stat:'atk'},
  c_def1:   {name:'こうらのおまもり', type:'charm', price:250,  pow:5,  stat:'def'},
  c_agi1:   {name:'はねのおまもり',   type:'charm', price:250,  pow:6,  stat:'agi'},
  c_pow2:   {name:'おうごんのキバ',   type:'charm', price:1800, pow:9,  stat:'atk'},
  c_def2:   {name:'りゅうのウロコ',   type:'charm', price:1800, pow:10, stat:'def'},
  c_agi2:   {name:'しっぷうのはね',   type:'charm', price:1800, pow:12, stat:'agi'},
  c_pow3:   {name:'まおうのキバ',     type:'charm', price:7000, pow:16, stat:'atk'},
  c_def3:   {name:'せいりゅうのウロコ', type:'charm', price:7000, pow:16, stat:'def'},
  c_agi3:   {name:'しっぷうのかみかざり', type:'charm', price:7000, pow:18, stat:'agi'},
};

const SHOPS = {
  milte:   ['w_stick','w_dagger','a_cloth','a_leather','s_leather','herb','antidote','meat1'],
  canta:   ['w_copper','w_iron','a_chain','s_iron','herb','antidote','mwater','wing','meat1','c_pow1','c_def1','c_agi1'],
  porto:   ['w_steel','a_steel','s_iron','hherb','mwater','wing','meat1','meat2','c_agi1'],
  oasia:   ['w_flame','a_flame','s_steel','hherb','antidote','mwater','lifeorb','meat2','c_pow2','c_def2'],
  yukine:  ['w_dragon','a_dragon','s_dragon','hherb','mwater2','lifeorb','wing','meat2','c_agi2'],
  tremolo: ['hherb','mwater2','lifeorb','meat3','c_pow3','c_def3','c_agi3'],
};

// ---------------- モンスター ----------------
// 敵としての定義 + ally(仲間時の成長/わざ) + tame(起き上がり基本率)
// ally: {lv0:加入最低Lv, hp:[初期,成長], mp, st, ag, learn:{Lv:わざ}, cry:加入時のひとこと}
const MONSTERS = {
  // --- 序盤（ミルテ周辺・こだまの洞窟）---
  slime:    {name:'スライム',       emoji:'👾', hp:8,  atk:10, def:3,  agi:3,  exp:3,  gold:4, tame:0.40,
             ally:{lv0:1, hp:[14,6.5], mp:[6,5], st:[5,1.6], ag:[6,1.7],
                   learn:{1:'heal',7:'skult',12:'healra',18:'healall',26:'fullheal'}, cry:'ぷるぷる！'}},
  rat:      {name:'おおねずみ',     emoji:'🐀', hp:12, atk:12, def:4,  agi:5,  exp:5,  gold:6, tame:0.35,
             ally:{lv0:1, hp:[16,7], mp:[0,2.2], st:[6,2.0], ag:[9,2.4],
                   learn:{4:'ph_double',16:'ph_triple'}, cry:'チュチュー！'}},
  bat:      {name:'おおこうもり',   emoji:'🦇', hp:10, atk:11, def:2,  agi:8,  exp:4,  gold:5, tame:0.35,
             ally:{lv0:1, hp:[14,6], mp:[4,3.5], st:[5,1.8], ag:[10,2.5],
                   learn:{3:'drain1',12:'drain2',22:'drain3'}, cry:'キィキィ！'}},
  goblin:   {name:'ゴブリン',       emoji:'👺', hp:18, atk:14, def:6,  agi:6,  exp:9,  gold:12, tame:0.30,
             ally:{lv0:2, hp:[20,7.8], mp:[0,2.5], st:[8,2.3], ag:[6,1.6],
                   learn:{5:'ph_smash',15:'bikilt',25:'ph_full'}, cry:'ガハハ！'}},
  bee:      {name:'どくバチ',       emoji:'🐝', hp:16, atk:16, def:4,  agi:12, exp:10, gold:10, tame:0.30,
             acts:[{w:70,t:'atk'},{w:30,t:'poison',name:'どくばり',min:6,max:10}],
             ally:{lv0:3, hp:[16,6.2], mp:[3,3], st:[7,2.1], ag:[12,2.6],
                   learn:{3:'ph_poison',11:'ph_needle2',22:'ph_needle'}, cry:'ブブーン！'}},
  worm:     {name:'マッドワーム',   emoji:'🪱', hp:26, atk:16, def:8,  agi:4,  exp:12, gold:13, tame:0.30,
             ally:{lv0:3, hp:[26,9], mp:[3,3], st:[7,2.0], ag:[4,1.2],
                   learn:{4:'poisonfog',14:'ph_fang',24:'quake'}, cry:'ウネウネ……'}},
  skeleton: {name:'がいこつへい',   emoji:'💀', hp:30, atk:19, def:9,  agi:7,  exp:16, gold:18, tame:0.25,
             ally:{lv0:4, hp:[22,8], mp:[2,2.8], st:[9,2.4], ag:[7,1.8],
                   learn:{6:'ph_slash',13:'ph_double',24:'ph_zan'}, cry:'カタカタ！'}},
  kingslime:{name:'キングスライム', emoji:'👾', hp:60, atk:22, def:14, agi:5,  exp:35, gold:40, tame:0.15,
             acts:[{w:70,t:'atk'},{w:30,t:'strong',mul:1.4,msg:'おもいきり のしかかった！'}],
             ally:{lv0:5, hp:[40,11], mp:[8,5.5], st:[9,2.2], ag:[4,1.3],
                   learn:{1:'heal',8:'healra',14:'skult',20:'healall',28:'megahealall'}, cry:'ぷるぷるぷるーん！'}},
  // --- 王都周辺・もりの旧聖堂 ---
  orc:      {name:'オーク',         emoji:'🐗', hp:42, atk:25, def:12, agi:8,  exp:22, gold:26, tame:0.25,
             ally:{lv0:6, hp:[30,9.5], mp:[0,2.5], st:[11,2.6], ag:[6,1.5],
                   learn:{6:'ph_rock',16:'bikilt',26:'ph_full'}, cry:'ブヒィ！'}},
  mage:     {name:'まどうし',       emoji:'🧙', hp:30, atk:19, def:8,  agi:10, exp:24, gold:32, tame:0.20,
             acts:[{w:55,t:'atk'},{w:45,t:'spell',name:'ファイア',min:10,max:16}],
             ally:{lv0:6, hp:[18,6], mp:[12,6.5], st:[6,1.5], ag:[8,2.0],
                   learn:{1:'fire',7:'icebolt',11:'fira',16:'blizzard',22:'megafire',30:'meteo'}, cry:'フォッフォッ。'}},
  nightbat: {name:'ナイトバット',   emoji:'🦇', hp:26, atk:22, def:6,  agi:14, exp:16, gold:18, tame:0.25,
             ally:{lv0:6, hp:[20,7], mp:[6,4], st:[7,2.0], ag:[13,2.7],
                   learn:{3:'drain1',8:'sl_sonic',16:'drain2',26:'drain3'}, cry:'キキィッ！'}},
  madflower:{name:'マッドフラワー', emoji:'🌺', hp:38, atk:25, def:12, agi:8,  exp:28, gold:34, fireWeak:true, tame:0.22,
             acts:[{w:65,t:'atk'},{w:35,t:'sleep',name:'ねむりのこな'}],
             ally:{lv0:7, hp:[26,8.5], mp:[8,5], st:[8,2.0], ag:[7,1.7],
                   learn:{2:'sl_powder',9:'poisonpow',20:'fl_heal'}, cry:'クネクネ♪'}},
  darkelf:  {name:'ダークエルフ',   emoji:'🧝', hp:46, atk:30, def:14, agi:16, exp:38, gold:48, tame:0.18,
             acts:[{w:60,t:'atk'},{w:40,t:'spell',name:'ファイラ',min:20,max:30}],
             ally:{lv0:8, hp:[26,8], mp:[10,5.5], st:[9,2.2], ag:[12,2.5],
                   learn:{1:'fire',6:'lucanan',12:'fira',18:'bikilt',24:'megafire'}, cry:'……よろしく。'}},
  trent:    {name:'トレント',       emoji:'🌳', hp:60, atk:32, def:18, agi:6,  exp:44, gold:46, fireWeak:true, tame:0.20,
             ally:{lv0:8, hp:[44,12], mp:[6,4.5], st:[10,2.4], ag:[4,1.2],
                   learn:{5:'sl_powder',10:'skult',16:'tr_heal'}, cry:'ザワザワ……'}},
  ghost:    {name:'ゴースト',       emoji:'👻', hp:34, atk:27, def:10, agi:18, exp:30, gold:30, tame:0.20,
             acts:[{w:60,t:'atk'},{w:40,t:'spell',name:'やみのいき',min:14,max:20}],
             ally:{lv0:8, hp:[22,7], mp:[10,5.5], st:[8,2.0], ag:[14,2.6],
                   learn:{4:'yamiiki',13:'darkball',19:'sleep',26:'darkflare'}, cry:'ヒュ〜ドロロ♪'}},
  // --- 海 ---
  seaserpent:{name:'シーサーペント',emoji:'🐍', hp:55, atk:36, def:16, agi:12, exp:50, gold:55, tame:0.18,
             ally:{lv0:10, hp:[36,10.5], mp:[8,5], st:[12,2.6], ag:[10,2.2],
                   learn:{5:'tsunami',15:'tsunami2',25:'ph_fang'}, cry:'シャアアッ！'}},
  merman:   {name:'マーマン',       emoji:'🧜', hp:48, atk:34, def:18, agi:14, exp:46, gold:52, tame:0.18,
             ally:{lv0:10, hp:[32,9.5], mp:[10,5.5], st:[11,2.4], ag:[11,2.3],
                   learn:{4:'heal',9:'ph_spear',17:'healra',23:'tsunami'}, cry:'スイスイ〜！'}},
  // --- 砂漠・ピラミッド ---
  scorpion: {name:'デススコーピオン',emoji:'🦂', hp:60, atk:42, def:24, agi:16, exp:60, gold:60, tame:0.18,
             acts:[{w:65,t:'atk'},{w:35,t:'poison',name:'どくのしっぽ',min:12,max:18}],
             ally:{lv0:12, hp:[38,10], mp:[5,4], st:[13,2.7], ag:[12,2.4],
                   learn:{4:'ph_poison',12:'skult',20:'ph_poison2'}, cry:'カサカサッ！'}},
  mummy:    {name:'ミイラおとこ',   emoji:'🧟', hp:70, atk:44, def:20, agi:10, exp:70, gold:68, tame:0.18,
             acts:[{w:70,t:'atk'},{w:30,t:'sleep',name:'のろいのほうたい'}],
             ally:{lv0:12, hp:[44,11.5], mp:[6,4.5], st:[13,2.7], ag:[8,1.8],
                   learn:{6:'sl_curse',14:'yamiiki',22:'drainM'}, cry:'ウ〜……アア〜……'}},
  sandgolem:{name:'サンドゴーレム', emoji:'🗿', hp:90, atk:47, def:28, agi:6,  exp:82, gold:75, tame:0.15,
             ally:{lv0:13, hp:[55,13], mp:[4,4], st:[14,2.8], ag:[4,1.1],
                   learn:{6:'sandstorm',14:'ph_rock',24:'quake'}, cry:'ゴゴゴ……'}},
  darkmage: {name:'くろまどうし',   emoji:'🧙', hp:55, atk:36, def:16, agi:14, exp:76, gold:92, tame:0.15,
             acts:[{w:50,t:'atk'},{w:50,t:'spell',name:'ファイラ',min:22,max:32}],
             ally:{lv0:13, hp:[28,8], mp:[16,7], st:[9,2.0], ag:[11,2.3],
                   learn:{1:'fire',8:'fira',16:'lucanan',22:'gigathunder',28:'meteo'}, cry:'クックック……'}},
  // --- 火山 ---
  flamewolf:{name:'フレイムウルフ', emoji:'🐺', hp:85, atk:56, def:26, agi:24, exp:110, gold:95, iceWeak:true, tame:0.15,
             ally:{lv0:15, hp:[44,11], mp:[8,5], st:[16,3.0], ag:[17,3.0],
                   learn:{5:'ph_ffang',13:'br_fire1',23:'ph_ffang2'}, cry:'ガウガウ！'}},
  lavagolem:{name:'ラヴァゴーレム', emoji:'🗿', hp:130, atk:62, def:36, agi:8,  exp:140, gold:110, iceWeak:true, tame:0.12,
             ally:{lv0:16, hp:[65,14], mp:[6,4.5], st:[17,3.1], ag:[5,1.2],
                   learn:{8:'ph_lava',18:'br_fire1',28:'br_fire2'}, cry:'ゴゴゴゴ！'}},
  firebird: {name:'ヒノトリ',       emoji:'🐦', hp:75, atk:52, def:22, agi:28, exp:105, gold:90, iceWeak:true, tame:0.10,
             acts:[{w:65,t:'atk'},{w:35,t:'breath',name:'かえんのいき',min:16,max:24}],
             ally:{lv0:15, hp:[38,9.5], mp:[14,6.5], st:[13,2.5], ag:[18,3.2],
                   learn:{7:'br_fire1',15:'rezarek',22:'px_dance',30:'br_fire2'}, cry:'ピュルルル〜♪'}},
  dragon:   {name:'ドラゴン',       emoji:'🐉', hp:120, atk:60, def:30, agi:18, exp:145, gold:130, tame:0.08,
             acts:[{w:60,t:'atk'},{w:40,t:'breath',name:'かえんのいき',min:24,max:34}],
             ally:{lv0:17, hp:[60,13], mp:[10,5.5], st:[18,3.2], ag:[13,2.5],
                   learn:{8:'br_fire1',18:'br_fire2',28:'ph_drag'}, cry:'ガオオオーッ！'}},
  demon:    {name:'デーモン',       emoji:'😈', hp:95, atk:58, def:28, agi:20, exp:130, gold:120, tame:0.10,
             acts:[{w:60,t:'atk'},{w:40,t:'spell',name:'ダークボール',min:30,max:42}],
             ally:{lv0:16, hp:[42,10.5], mp:[16,7], st:[14,2.7], ag:[14,2.6],
                   learn:{6:'darkball',14:'lucanan',20:'darkflare',26:'darknebula'}, cry:'フハハハ！'}},
  // --- 雪原・こおりの大聖堂 ---
  wolf:     {name:'スノーウルフ',   emoji:'🐺', hp:100, atk:64, def:30, agi:30, exp:150, gold:120, tame:0.15,
             ally:{lv0:18, hp:[48,11.5], mp:[6,4.5], st:[17,3.0], ag:[20,3.4],
                   learn:{4:'ph_double',12:'howl',20:'ph_triple'}, cry:'アオ〜ン！'}},
  snowghost:{name:'ブリザードゴースト',emoji:'👻', hp:90, atk:60, def:26, agi:26, exp:145, gold:125, tame:0.15,
             acts:[{w:55,t:'atk'},{w:45,t:'spell',name:'アイスボルト',min:26,max:36}],
             ally:{lv0:18, hp:[40,10], mp:[16,7], st:[13,2.5], ag:[16,2.9],
                   learn:{5:'icebolt',13:'br_ice1',21:'blizzard',28:'br_ice2'}, cry:'ヒュ〜ルルル……'}},
  fgolem:   {name:'フロストゴーレム',emoji:'🗿', hp:150, atk:70, def:40, agi:10, exp:180, gold:150, tame:0.12,
             ally:{lv0:19, hp:[70,14.5], mp:[6,4.5], st:[18,3.2], ag:[6,1.4],
                   learn:{8:'ph_lava',16:'br_ice1',26:'ph_icecr'}, cry:'ゴ……ゴゴ……'}},
  icedevil: {name:'アイスデーモン', emoji:'😈', hp:110, atk:68, def:32, agi:24, exp:175, gold:160, tame:0.10,
             acts:[{w:65,t:'atk'},{w:35,t:'breath',name:'こおりのいき',min:20,max:28}],
             ally:{lv0:20, hp:[48,11], mp:[16,7], st:[16,2.9], ag:[15,2.8],
                   learn:{6:'icebolt',12:'lucanan',18:'br_ice1',26:'br_ice2'}, cry:'ヒョヒョヒョ！'}},
  // --- しらべの塔・やみの島・オペラハウス ---
  hellhound:{name:'ヘルハウンド',   emoji:'🐺', hp:130, atk:78, def:36, agi:32, exp:230, gold:180, tame:0.10,
             acts:[{w:70,t:'atk'},{w:30,t:'double'}],
             ally:{lv0:22, hp:[55,12.5], mp:[10,5.5], st:[19,3.3], ag:[21,3.5],
                   learn:{5:'ph_fang',13:'ph_fang2',21:'br_fire1',28:'ph_dfang'}, cry:'グルルル……ワン！'}},
  archdemon:{name:'アークデーモン', emoji:'😈', hp:150, atk:82, def:40, agi:26, exp:260, gold:220, tame:0.08,
             acts:[{w:55,t:'atk'},{w:45,t:'spell',name:'ダークフレア',min:36,max:48}],
             ally:{lv0:24, hp:[55,12], mp:[20,8], st:[17,3.0], ag:[16,2.9],
                   learn:{8:'darkflare',16:'gigathunder',24:'meteo',30:'darknebula'}, cry:'よかろう、ちからを かそう。'}},
  dknight:  {name:'ダークナイト',   emoji:'🤺', hp:170, atk:88, def:46, agi:28, exp:290, gold:250, tame:0.08,
             acts:[{w:70,t:'atk'},{w:30,t:'strong',mul:1.4,msg:'ざんこくな いちげきを はなった！'}],
             ally:{lv0:24, hp:[60,13], mp:[10,5.5], st:[21,3.5], ag:[16,2.8],
                   learn:{8:'ph_slash',15:'bikilt',22:'ph_zan',29:'ph_dance'}, cry:'わがけんは きみとともに。'}},
  blackdragon:{name:'ブラックドラゴン',emoji:'🐉', hp:210, atk:92, def:42, agi:22, exp:340, gold:300, tame:0.06,
             acts:[{w:60,t:'atk'},{w:40,t:'breath',name:'やみのほのお',min:36,max:48}],
             ally:{lv0:26, hp:[75,15], mp:[14,6.5], st:[22,3.6], ag:[15,2.7],
                   learn:{10:'br_dark',20:'br_fire2',30:'br_end'}, cry:'グオオオオ……！'}},
  // --- 裏ボス（仲間になる隠し魔物） ---
  eden:     {name:'エデン', emoji:'🐲', hp:5200, atk:142, def:58, agi:42, exp:0, gold:0, boss:true,
             acts:[{w:15,t:'atk'},{w:35,t:'breath',name:'せいなるブレス',min:70,max:92},
                   {w:20,t:'spell',name:'ほしのうた',min:60,max:80},{w:15,t:'double'},
                   {w:15,t:'strong',mul:1.5,msg:'ひかりのツメを ふりおろした！'}],
             ally:{lv0:30, hp:[150,18], mp:[40,10], st:[30,4.0], ag:[28,3.6],
                   learn:{1:'holybr',2:'megahealall',3:'meteo'}, cry:'──ともに うたいましょう。'}},

  // ============ III のボス ============
  b_kslime: {name:'あばれキングスライム', emoji:'👾', hp:210, atk:24, def:11, agi:6, exp:100, gold:150, boss:true,
             acts:[{w:55,t:'atk'},{w:30,t:'strong',mul:1.5,msg:'おもいきり のしかかった！'},{w:15,t:'sleep',name:'ねばねばのうた'}]},
  lyrica:   {name:'よるのうたひめ リリカ', emoji:'🧝', hp:480, atk:40, def:18, agi:14, exp:420, gold:500, boss:true,
             acts:[{w:35,t:'atk'},{w:30,t:'spell',name:'やみのしらべ',min:22,max:32},
                   {w:20,t:'sleep',name:'ねむりのハープ'},{w:15,t:'double'}]},
  donga:    {name:'だいちのドンガ', emoji:'🗿', hp:800, atk:56, def:30, agi:10, exp:950, gold:900, boss:true,
             acts:[{w:30,t:'atk'},{w:30,t:'strong',mul:1.5,msg:'ばちを たたきつけた！'},
                   {w:25,t:'breath',name:'じひびきのリズム',min:18,max:26},{w:15,t:'double'}]},
  fagor:    {name:'ねっぷうのファゴル', emoji:'🐦', hp:1100, atk:70, def:30, agi:22, exp:1700, gold:1400, boss:true, iceWeak:true,
             acts:[{w:30,t:'atk'},{w:40,t:'breath',name:'ねっぷうのふえ',min:28,max:38},
                   {w:30,t:'strong',mul:1.4,msg:'もえる つばさで きりさいた！'}]},
  bariton:  {name:'こおりのバリトン', emoji:'😈', hp:1500, atk:84, def:36, agi:20, exp:2600, gold:2100, boss:true,
             acts:[{w:25,t:'atk'},{w:35,t:'breath',name:'こおりのアリア',min:40,max:54},
                   {w:15,t:'sleep',name:'こもりうたのこえ'},{w:25,t:'double'}]},
  b_kirie:  {name:'まものハンター キリエ', emoji:'🏹', hp:1350, atk:93, def:42, agi:32, exp:1500, gold:0, boss:true,
             acts:[{w:40,t:'atk'},{w:35,t:'double'},{w:25,t:'strong',mul:1.6,msg:'ひっさつの やを はなった！'}]},
  nocturne: {name:'やみのしきしゃ ノクターン', emoji:'👿', hp:2000, atk:104, def:46, agi:28, exp:0, gold:0, boss:true, next:'nocturne2',
             acts:[{w:25,t:'atk'},{w:35,t:'spell',name:'やみのレクイエム',min:48,max:64},
                   {w:15,t:'sleep',name:'やみのこもりうた'},{w:25,t:'strong',mul:1.3,msg:'タクトを ふりおろした！'}]},
  nocturne2:{name:'めつぼうのノクターン', emoji:'🐲', hp:2700, atk:118, def:50, agi:32, exp:0, gold:0, boss:true,
             acts:[{w:20,t:'atk'},{w:40,t:'breath',name:'めつぼうのコーダ',min:58,max:74},
                   {w:20,t:'double'},{w:20,t:'strong',mul:1.5,msg:'ぜつぼうの フォルテを たたきつけた！'}]},

  // ============ 過去作ボス（寄り道・ほこらの主） ============
  gaiaworm: {name:'ガイアワーム', emoji:'🐛', hp:260, atk:26, def:12, agi:7, exp:160, gold:200, boss:true,
             acts:[{w:60,t:'atk'},{w:40,t:'strong',mul:1.5,msg:'おおきな あごで かみついた！'}]},
  goblinlord:{name:'ゴブリンロード', emoji:'👺', hp:180, atk:21, def:10, agi:8, exp:110, gold:180, boss:true,
             acts:[{w:55,t:'atk'},{w:30,t:'strong',mul:1.5,msg:'おおきな こんぼうを ふりおろした！'},{w:15,t:'double'}]},
  grantree: {name:'グランツリー', emoji:'🌲', hp:540, atk:39, def:18, agi:9, exp:430, gold:480, boss:true, fireWeak:true,
             acts:[{w:45,t:'atk'},{w:25,t:'sleep',name:'ねむりのこな'},{w:30,t:'strong',mul:1.4,msg:'ふとい えだを ふりおろした！'}]},
  eldertrent:{name:'エルダートレント', emoji:'🌲', hp:660, atk:47, def:21, agi:9, exp:560, gold:600, boss:true, fireWeak:true,
             acts:[{w:45,t:'atk'},{w:25,t:'sleep',name:'ねむりのこな'},{w:30,t:'strong',mul:1.4,msg:'ふとい えだを ふりおろした！'}]},
  kraken:   {name:'かいま クラーケン', emoji:'🐙', hp:750, atk:51, def:22, agi:13, exp:800, gold:850, boss:true,
             acts:[{w:40,t:'atk'},{w:35,t:'double'},{w:25,t:'strong',mul:1.5,msg:'きょだいな あしを たたきつけた！'}]},
  pharaoh:  {name:'おうけのぼうれい ファラオ', emoji:'👻', hp:900, atk:60, def:28, agi:16, exp:1200, gold:1300, boss:true,
             acts:[{w:35,t:'atk'},{w:30,t:'spell',name:'ダークボール',min:34,max:46},{w:20,t:'double'},{w:15,t:'sleep',name:'のろいのすな'}]},
  glacies:  {name:'ひょうま グラシエス', emoji:'⛄', hp:1100, atk:69, def:32, agi:20, exp:1800, gold:1700, boss:true,
             acts:[{w:30,t:'atk'},{w:40,t:'breath',name:'こおりのいき',min:30,max:42},{w:30,t:'double'}]},
  ignis:    {name:'えんりゅう イグニス', emoji:'🐉', hp:1250, atk:77, def:34, agi:18, exp:2100, gold:1900, boss:true, iceWeak:true,
             acts:[{w:30,t:'atk'},{w:40,t:'breath',name:'ごうかのいき',min:34,max:46},{w:30,t:'strong',mul:1.4,msg:'もえさかる ツメで きりさいた！'}]},
  reiga:    {name:'ひょうしょう レイガ', emoji:'🗿', hp:1650, atk:90, def:40, agi:20, exp:3200, gold:2600, boss:true,
             acts:[{w:30,t:'atk'},{w:35,t:'breath',name:'ぜったいれいどのいき',min:46,max:60},{w:20,t:'double'},{w:15,t:'strong',mul:1.4,msg:'こおりの おおなぎなたを ふるった！'}]},
  zarba:    {name:'まおうの ざんえい ザルバ', emoji:'👿', hp:1500, atk:106, def:46, agi:26, exp:0, gold:0, boss:true, next:'zarba2',
             acts:[{w:35,t:'atk'},{w:40,t:'spell',name:'ダークボール',min:50,max:66},{w:25,t:'strong',mul:1.3,msg:'やみの ちからを たたきつけた！'}]},
  zarba2:   {name:'しんのまおう ザルバ', emoji:'🐲', hp:2200, atk:118, def:50, agi:30, exp:6000, gold:5000, boss:true,
             acts:[{w:25,t:'atk'},{w:45,t:'breath',name:'やみのほのお',min:60,max:78},{w:30,t:'double'}]},
  darkgeneral:{name:'まぐんしょう ザガン', emoji:'🤺', hp:2200, atk:115, def:50, agi:28, exp:4200, gold:3600, boss:true,
             acts:[{w:40,t:'atk'},{w:35,t:'strong',mul:1.5,msg:'じごくの けんを たたきつけた！'},{w:25,t:'double'}]},
  noir:     {name:'しんまおうの ざんえい ノワール', emoji:'👿', hp:2000, atk:112, def:50, agi:30, exp:0, gold:0, boss:true, next:'noir2',
             acts:[{w:30,t:'atk'},{w:35,t:'spell',name:'ダークネビュラ',min:52,max:68},{w:20,t:'strong',mul:1.3,msg:'やみの ちからを たたきつけた！'},{w:15,t:'sleep',name:'やみのこもりうた'}]},
  noir2:    {name:'めつぼうの ノワール', emoji:'🐲', hp:2800, atk:126, def:52, agi:34, exp:9000, gold:8000, boss:true,
             acts:[{w:25,t:'atk'},{w:40,t:'breath',name:'しゅうえんのほのお',min:62,max:80},{w:20,t:'double'},{w:15,t:'strong',mul:1.5,msg:'ぜつぼうの いちげきを はなった！'}]},
};

// 図鑑に載る仲間にできる魔物（34種・図鑑の並び順）
const BOOK_SPECIES = [
  'slime','rat','bat','goblin','bee','worm','skeleton','kingslime',
  'orc','mage','nightbat','madflower','darkelf','trent','ghost',
  'seaserpent','merman','scorpion','mummy','sandgolem','darkmage',
  'flamewolf','lavagolem','firebird','dragon','demon',
  'wolf','snowghost','fgolem','icedevil',
  'hellhound','archdemon','dknight','blackdragon',
];

// 過去作ボス討伐フラグ（寄り道ボス12体）
const PAST_BOSSES = [
  {flag:'pb_goblord', key:'goblinlord', hint:'こだまの洞窟の おくの たからべや'},
  {flag:'pb_gaia',    key:'gaiaworm',   hint:'はじまりの大陸の みなみひがしの はて'},
  {flag:'pb_gran',    key:'grantree',   hint:'はじまりの大陸 きたの もりの おく'},
  {flag:'pb_elder',   key:'eldertrent', hint:'もりの旧聖堂の にしの ま'},
  {flag:'pb_kraken',  key:'kraken',     hint:'ふたつの大陸の あいだの こじま'},
  {flag:'pb_pharaoh', key:'pharaoh',    hint:'ピラミッドの かくしべや'},
  {flag:'pb_glacies', key:'glacies',    hint:'ゆきの大陸の おくち'},
  {flag:'pb_ignis',   key:'ignis',      hint:'とどろきの火山の ひがしの ま'},
  {flag:'pb_reiga',   key:'reiga',      hint:'こおりの大聖堂の ゆきだまりの かげ'},
  {flag:'pb_zarba',   key:'zarba',      hint:'かざんと やみのしまの あいだの こじま'},
  {flag:'pb_dgen',    key:'darkgeneral',hint:'オペラハウスの ろうか'},
  {flag:'pb_noir',    key:'noir',       hint:'ほっきょくの ちいさな ゆきのしま'},
];

const GAKUFU_FLAGS = ['g1','g2','g3','g4','g5'];

// 闘技場（たたかいの いしぶみ）で再戦できるボス。弱い順。exp/goldは再戦用に上書き。
// 変身ボス(nocturne/zarba/noir)は第一形態を入れれば連戦で最終形態まで戦える。
const ARENA_BOSSES = [
  {key:'b_kslime',   exp:120,   gold:80},
  {key:'goblinlord', exp:140,   gold:120},
  {key:'gaiaworm',   exp:200,   gold:150},
  {key:'lyrica',     exp:500,   gold:300},
  {key:'grantree',   exp:540,   gold:340},
  {key:'eldertrent', exp:680,   gold:420},
  {key:'kraken',     exp:1000,  gold:600},
  {key:'donga',      exp:1200,  gold:700},
  {key:'pharaoh',    exp:1500,  gold:900},
  {key:'b_kirie',    exp:1800,  gold:1000},
  {key:'fagor',      exp:2000,  gold:1100},
  {key:'glacies',    exp:2200,  gold:1300},
  {key:'ignis',      exp:2600,  gold:1500},
  {key:'bariton',    exp:3000,  gold:1700},
  {key:'reiga',      exp:3800,  gold:2200},
  {key:'darkgeneral',exp:5000,  gold:3000},
  {key:'nocturne',   exp:6500,  gold:4000},
  {key:'zarba',      exp:7500,  gold:5000},
  {key:'noir',       exp:10000, gold:7000},
  {key:'eden',       exp:15000, gold:10000},
];

// ---------------- エンカウントテーブル ----------------
const ENC_TABLES = {
  field1:   [['slime'],['slime','slime'],['rat'],['bat'],['goblin'],['slime','bat'],['bee'],['goblin','rat'],['worm']],
  cave1:    [['goblin'],['skeleton'],['worm'],['bat','bat'],['skeleton','worm'],['goblin','goblin'],['kingslime']],
  field2:   [['orc'],['mage'],['nightbat'],['bee','bee'],['orc','mage'],['madflower'],['nightbat','nightbat']],
  forestA:  [['madflower'],['trent'],['orc'],['darkelf'],['madflower','bee'],['ghost'],['trent','madflower']],
  seido:    [['ghost'],['darkelf'],['trent'],['skeleton','skeleton'],['ghost','darkelf'],['mage','mage'],['darkelf','darkelf']],
  sea:      [['seaserpent'],['merman'],['merman','merman'],['seaserpent','merman'],['kingslime','kingslime']],
  desert:   [['scorpion'],['mummy'],['sandgolem'],['scorpion','scorpion'],['mummy','darkmage']],
  pyramid:  [['mummy'],['darkmage'],['sandgolem'],['mummy','mummy','darkmage'],['scorpion','sandgolem'],['darkmage','darkmage']],
  volcanoF: [['flamewolf'],['firebird'],['flamewolf','firebird']],
  volcano:  [['flamewolf'],['lavagolem'],['firebird','firebird'],['demon'],['dragon'],['demon','flamewolf'],['lavagolem','firebird']],
  snowF:    [['wolf'],['snowghost'],['wolf','wolf'],['snowghost','wolf']],
  icecath:  [['snowghost'],['fgolem'],['icedevil'],['wolf','wolf'],['icedevil','snowghost'],['fgolem','icedevil']],
  towerI:   [['demon'],['darkmage'],['ghost','ghost'],['demon','darkmage'],['dknight']],
  towerD:   [['ghost','ghost'],['demon'],['darkmage','demon'],['dknight'],['icedevil','demon']],
  hiddenF:  [['trent'],['darkelf','darkelf'],['dragon'],['firebird'],['trent','darkelf']],
  darkisle: [['hellhound'],['archdemon'],['hellhound','hellhound']],
  opera:    [['hellhound'],['archdemon'],['dknight'],['blackdragon'],['archdemon','hellhound'],['dknight','archdemon'],['hellhound','hellhound','archdemon']],
};

// ワールドのエンカウント規則（上から順に判定）
const WORLD_ENC = [
  {t:'.,F', zone:[3,15,6,18],   table:null},        // はじまりのほこらの島（安全）
  {t:'.,',  zone:[24,34,26,36], table:null},        // クラーケンの小島（安全）
  {t:'d',   zone:[8,3,18,11],   table:'darkisle'},  // やみの島（オペラハウス）
  {t:'d',   zone:[20,13,22,14], table:'darkisle'},  // ザルバの小島
  {t:'~',   table:'sea'},
  {t:'s',   table:'desert'},
  {t:'d',   table:'volcanoF'},
  {t:'S',   table:'snowF'},
  {t:'.,F', zone:[25,17,31,22], table:'towerI'},    // しらべの塔の島
  {t:'F',   zone:[49,14,57,20], table:'hiddenF'},   // かくれざとの島
  {t:'.,',  zone:[29,33,58,43], table:'field1'},    // はじまりの大陸・南部
  {t:'F',   table:'forestA'},
  {t:'.,',  table:'field2'},
];
// タイルごとのエンカウント率（1/n）
const ENC_RATE = {'.':15, ',':11, 'F':11, 's':13, 'S':13, '~':16, 'd':11};

// ---------------- マップ生成ヘルパー ----------------
function gridBlank(w,h,ch){ return Array.from({length:h},()=>ch.repeat(w)); }
function carve(g,x1,y1,x2,y2,ch='-'){
  for(let y=y1;y<=y2;y++){
    const r=g[y].split('');
    for(let x=x1;x<=x2;x++) r[x]=ch;
    g[y]=r.join('');
  }
}

// ---------------- ワールドマップ (60 x 46) ----------------
// 記号: ~水 .草 ,茂み F森 m山 S雪 s砂 d荒地 =橋 g門 L溶岩
// 入口: 1ミルテ村 2王都カンタービレ 3ポルト 4オアシア 5ユキネ 6トレモロ
//       cこだまの洞窟 f旧聖堂 pピラミッド v火山 i大聖堂 tしらべの塔 Xオペラハウス eはじまりのほこら
const WORLD_TILES = [
"~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~", // 0
"~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~", // 1
"~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~", // 2
"~~~~~~~~mmmmmmmmmmm~~~~~SSSSSSSSSSSSSSSSSSSSSSSSSSSSS~~~~~~~", // 3
"~~~~~~~~mdddddddddm~~~~~SSSSSSSSSSSSSSSSSSSSSSSSSSSSS~~~~~~~", // 4
"~~~~~~~~mdddddddddm~~~~~SSSSSSSSSSSSmmmSSSSSSSSSSSSSS~~~~~~~", // 5
"~~~~~~~~mddddXddddm~~~~~SSSSSSSSSSSSSSSSSSSSmimSSSSSS~~~~~~~", // 6
"~~~~~~~~mdddddddddm~~~~~SSSSSSSSSSSSSSSSSSSSSSSSSSSSS~SSSS~~", // 7
"~~~~~~~~mdddddddddm~~~~~SSSSSSSSSSSSSSSSSSSSSSSSSSSSS~SSSS~~", // 8
"~~~~~~~~mdddddddddm~~~~~SSSS5SSSSSSSSSSSSSSSSSSSSSSSS~~~~~~~", // 9
"~~~~~~~~mdddddddddm~~~~~SSSSSSSSSSSSSSSSSSSSSSSSSSSSS~~~~~~~", // 10
"~~~~~~~~mmmmmgmmmmm~~~~~SSSSSSSSSSSSSSSSSSSSSSSSSSSSS~~~~~~~", // 11
"~~~~~~~~~~~~~~~~~~~~~~~~SSSSSSSSSSSSSSSSSSSSSSSSSSSSS~~~~~~~", // 12
"~~~~~~~~~~~~~~~~~~~~dddd~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~", // 13
"~~~~~~~~~~~~~~~~~~~~dddd~~~~~~~~~~~~~~~~~~~~~~~~~FFFFFFFFF~~", // 14
"~~~....~ddddddddddd~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~FFFFFFFFF~~", // 15
"~~~.e..~dmmddddmmdd~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~FFFFFFFFF~~", // 16
"~~~....~ddLdddddLdd~~~~~~..FFF..~~~~~~~~~~~~~~~~~FFFF6FFFF~~", // 17
"~~~....~dddddvddddd~~~~~~.......~~~~~~~~~~~~~~~~~FFFFFFFFF~~", // 18
"~~~~~~~~dmdddddddmd~~~~~~...t...~~~~~~~~~~~~~~~~~FFFFFFFFF~~", // 19
"~~~~~~~~dmmddddmmdd~~~~~~.......~~~~~~~~~~~~~~~~~FFFFFFFFF~~", // 20
"~~~~~~~~ddddddddddd~~~~~~.......~~~~~~~~~~~~~~~~~~~~~~~~~~~~", // 21
"~~~~~~~~ddddddddddd~~~~~~.FF.FF.~~~~~~~~~~~~~~~~~~~~~~~~~~~~", // 22
"~~~~~~~~ddddddddddd~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~", // 23
"~~~~~~~~~~~~~~~~~~~~~~~~~~~~~................FFFFFFFFFFFF..~", // 24
"~~~~~~~~~~~~~~~~~~~~~~~~~~~~~................FFFFFFFfFFFF..~", // 25
"~~~~~~~~~~~~~~~~~~~~~~~~~~~~~................FFFFFFFFFFFF..~", // 26
"~~~~~~~~~~~~~~~~~~~~~~~~~~~~~................FFFFFFFFFFFF..~", // 27
"~~~sssssssssssssssssss~~~~~~~............2.................~", // 28
"~~~sssssssssssssssssss~~~~~~~3.............................~", // 29
"~~~sssssssssssssssssss~~~~~~~..............................~", // 30
"~~~sssssmmmsssssssssss~~~~~~~..............................~", // 31
"~~~sssssssssssssssssss~~~~~~~..mmmmmmmmmmmmm.mmmmmmmmmmmmm.~", // 32
"~~~sssssssss4sssssssss~~~~~~~..............................~", // 33
"~~~sssssssssssssssssss~~...~~....,,,,,.....................~", // 34
"~~~sssssssssssssssssss~~...~~..............................~", // 35
"~~~sssssssssssmmmsssss~~...~~........................,,,c..~", // 36
"~~~sssssssssssssssssss~~~~~~~................mmmm..........~", // 37
"~~~sssssssssssssssssss~~~~~~~......,,,,,........1..........~", // 38
"~~~sssspssssssssssssss~~~~~~~..............................~", // 39
"~~~sssssssssssssssssss~~~~~~~............,,,,,,,...........~", // 40
"~~~sssssssssssssssssss~~~~~~~..............................~", // 41
"~~~sssssssssmmmmssssss~~~~~~~..............................~", // 42
"~~~sssssssssssssssssss~~~~~~~..............................~", // 43
"~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~", // 44
"~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~", // 45
];

// ---------------- 町マップ ----------------
const MILTE_TILES = [
"TTTTTTTTTTTTTTTTTTTTTT",
"T....................T",
"T.rrrr..bbbb..rrrr...T",
"T.WnnW..WnnW..WnnW...T",
"T.WWDW..WWDW..WWDW...T",
"T....................T",
"T.rrrr...............T",
"T.WnnW.....~~~.......T",
"T.WWDW.....~~~.......T",
"T....................T",
"T....................T",
"T....................T",
"T....................T",
"TTTTTTTTTT>>TTTTTTTTTT",
];

const CANTA_TILES = [
"TTTTTTTTTTTTTTTTTTTTTTTTTTTT",
"T..........................T",
"T...BBBBBBBBBBBBBBBBBBBB...T",
"T...B__________________B...T",
"T...B__________________B...T",
"T...B__________________B...T",
"T...BBBBBBBB_kk_BBBBBBBB...T",
"T............kk............T",
"T.rrrr.rrrr..kk..bbbb.rrrr.T",
"T.WnnW.WnnW..kk..WnnW.WnnW.T",
"T.WWDW.WWDW..kk..WWDW.WWDW.T",
"T............kk............T",
"T............kk............T",
"T.rrrr.......kk.......rrrr.T",
"T.WnnW.......kk.......WnnW.T",
"T.WWDW.......kk.......WWDW.T",
"T............kk............T",
"TTTTTTTTTTTTT>>TTTTTTTTTTTTT",
];

const PORTO_TILES = [
"TTTTTTTTTTTTTTTTTTTTTTTT",
"T......................T",
"T.rrrr..bbbb..rrrr.....T",
"T.WnnW..WnnW..WnnW.....T",
"T.WWDW..WWDW..WWDW.....T",
"T......................T",
"T......................T",
"T..rrrr................T",
"T..WnnW................T",
"T..WWDW................T",
"T......................T",
"T.~~~~~~~~~KK~~~~~~~~~.T",
"T.~~~~~~~~~KK~~~~~~~~~.T",
"TTTTTTTTTTT>>TTTTTTTTTTT",
];

const OASIA_TILES = [
"TTTTTTTTTTTTTTTTTTTT",
"TssssssssssssssssssT",
"TsrrrrssbbbbssrrrrsT",
"TsWnnWssWnnWssWnnWsT",
"TsWWDWssWWDWssWWDWsT",
"TssssssssssssssssssT",
"TsrrrrsssssssssssssT",
"TsWnnWsssssssssssssT",
"TsWWDWsssssssssssssT",
"TssssssssssssssssssT",
"TssssssssssssssssssT",
"TssssssssssssssssssT",
"TTTTTTTTT>>TTTTTTTTT",
];

const YUKINE_TILES = [
"TTTTTTTTTTTTTTTTTT",
"TSSSSSSSSSSSSSSSST",
"TSbbbbSSSSrrrrSSST",
"TSWnnWSSSSWnnWSSST",
"TSWWDWSSSSWWDWSSST",
"TSSSSSSSSSSSSSSSST",
"TSrrrrSSSSSSSSSSST",
"TSWnnWSSSSSSSSSSST",
"TSWWDWSSSSSSSSSSST",
"TSSSSSSSSSSSSSSSST",
"TSSSSSSSSSSSSSSSST",
"TTTTTTTT>>TTTTTTTT",
];

const TREMOLO_TILES = [
"TTTTTTTTTTTTTTTT",
"T..............T",
"T.rrrr....bbbb.T",
"T.WnnW....WnnW.T",
"T.WWDW....WWDW.T",
"T..............T",
"T..............T",
"T....~~~~......T",
"T..............T",
"T..............T",
"TTTTTTT>>TTTTTTT",
];

// ---------------- ダンジョン（自動彫刻） ----------------
function buildCave1(){            // こだまの洞窟 28x20
  const g = gridBlank(28,20,'#');
  carve(g,11,15,17,18);   // 入口の間
  carve(g,14,11,14,15);   // 通路
  carve(g,5,7,22,11);     // 大広間
  carve(g,5,4,5,7);       // 西通路
  carve(g,2,1,9,4);       // ボスの間
  carve(g,22,3,25,7);     // 東宝物庫（ゴブリンロード）
  carve(g,7,11,7,14);     // 袋小路
  carve(g,14,18,14,18,'>');
  return g;
}
function buildSeido(){            // もりの旧聖堂 26x20
  const g = gridBlank(26,20,'#');
  carve(g,10,14,16,17);   // 入口の間
  carve(g,13,10,13,14);   // 通路
  carve(g,4,6,21,10);     // 大広間
  carve(g,2,2,8,4);       // 西の間（エルダートレント）
  carve(g,5,4,5,6);
  carve(g,17,2,23,4);     // 東の間
  carve(g,20,4,20,6);
  carve(g,11,1,15,3);     // ボスの間（リリカ）
  carve(g,13,3,13,6);
  carve(g,2,9,3,9);       // 袋小路
  carve(g,13,17,13,17,'>');
  return g;
}
function buildPyramid(){          // すなのピラミッド 30x22
  const g = gridBlank(30,22,'#');
  carve(g,12,17,18,20);   // 入口の間
  carve(g,15,13,15,17);   // 通路
  carve(g,5,9,24,13);     // 大広間
  carve(g,3,4,9,7);       // 西の翼
  carve(g,6,7,6,9);
  carve(g,20,4,26,7);     // 東の翼
  carve(g,23,7,23,9);
  carve(g,13,1,17,4);     // ボスの間（ドンガ）
  carve(g,15,4,15,9);
  carve(g,3,11,4,12);     // 隠し小部屋（ファラオ）
  carve(g,15,20,15,20,'>');
  return g;
}
function buildVolcano(){          // とどろきの火山 28x20
  const g = gridBlank(28,20,'#');
  carve(g,11,15,17,18);   // 入口の間
  carve(g,14,12,14,15);   // 通路
  carve(g,4,8,23,12);     // 大広間
  carve(g,4,4,10,6);      // 西の間
  carve(g,7,6,7,8);
  carve(g,17,4,23,6);     // 東の間（イグニス）
  carve(g,20,6,20,8);
  carve(g,12,1,16,3);     // ボスの間（ファゴル）
  carve(g,14,3,14,8);
  carve(g,14,18,14,18,'>');
  return g;
}
function buildIceCath(){          // こおりの大聖堂 28x20
  const g = gridBlank(28,20,'#');
  carve(g,11,15,17,18);   // 入口の間
  carve(g,14,13,14,15);   // 通路
  carve(g,3,10,24,13);    // 下広間
  carve(g,4,4,4,10);      // 西階段
  carve(g,23,4,23,10);    // 東階段
  carve(g,4,4,23,5);      // 上広間
  carve(g,12,1,16,3);     // ボスの間（バリトン）
  carve(g,14,3,14,4);
  carve(g,2,12,3,12);     // 袋小路（レイガ）
  carve(g,14,18,14,18,'>');
  return g;
}
function buildTower(){            // しらべの塔 24x18
  const g = gridBlank(24,18,'#');
  carve(g,9,13,14,16);    // 入口の間
  carve(g,11,9,11,13);    // 細い通路（番人がふさぐ）
  carve(g,4,5,19,9);      // 大広間
  carve(g,11,3,11,5);     // 上への通路
  carve(g,9,1,14,3);      // 頂上の間（キリエ）
  carve(g,11,16,11,16,'>');
  return g;
}
function buildOpera(){            // やみのオペラハウス 32x26
  const g = gridBlank(32,26,'#');
  carve(g,13,21,19,24);   // 入口ホール
  carve(g,16,17,16,21);   // 通路
  carve(g,6,13,26,17);    // 観客席ホール
  carve(g,3,8,9,11);      // 西の楽屋
  carve(g,6,11,6,13);
  carve(g,23,8,29,11);    // 東の楽屋
  carve(g,26,11,26,13);
  carve(g,16,8,16,13);    // 北回廊（ザガンが塞ぐ）
  carve(g,8,5,24,7);      // 舞台そで
  carve(g,16,4,16,5);
  carve(g,12,1,20,3);     // 大舞台（ノクターン）
  carve(g,16,24,16,24,'>');
  return g;
}
function buildOrigin(){           // はじまりのほこら 20x16
  const g = gridBlank(20,16,'#');
  carve(g,3,3,16,12);     // 大広間
  carve(g,8,12,11,14);    // 入口
  carve(g,9,14,9,14,'>');
  return g;
}

// ---------------- マップ定義 ----------------
const MAPS = {
  world: {
    name:'うたの大陸と ななつの海', tiles:WORLD_TILES, bgm:'field', world:true, pad:'~',
    npcs:[],
    objects:[
      // 過去作ボス（ワールド上のぬし）
      {id:'wb_gaia', type:'boss', x:56, y:41, monster:'gaiaworm', flag:'pb_gaia',
       reward:{item:'seedstr', n:2},
       pre:['だいちが もりあがり きょだいな いもむしが あらわれた！','かつて 1だいめゆうしゃが たおした まもの──','《ガイアワーム》だ！！']},
      {id:'wb_gran', type:'boss', x:55, y:26, monster:'grantree', flag:'pb_gran',
       reward:{item:'seeddef', n:2},
       pre:['もりの おくに ふるい おおきが そびえている……','《グランツリー》が めを さました！']},
      {id:'wb_kraken', type:'boss', x:25, y:35, monster:'kraken', flag:'pb_kraken',
       reward:{item:'c_agi2'},
       pre:['こじまの まわりの うみが さかまいている……','かいま 《クラーケン》が すがたを あらわした！！']},
      {id:'wb_glacies', type:'boss', x:33, y:5, monster:'glacies', flag:'pb_glacies',
       reward:{item:'c_pow2'},
       pre:['ふぶきの おくに こおりの きょぞうが たたずんでいる……','ひょうま 《グラシエス》が うごきだした！！']},
      {id:'wb_zarba', type:'boss', x:21, y:13, monster:'zarba', flag:'pb_zarba',
       reward:{item:'a_hikari'},
       pre:['くろい きりが しまを おおっている……','20ねんまえ ほろぼされた まおうの ざんえい──','《ザルバ》が よみがえった！！']},
      {id:'wb_noir', type:'boss', x:56, y:8, monster:'noir', flag:'pb_noir',
       reward:{item:'w_king'},
       pre:['ゆきの しまに やみが うずまいている……','しんまおうの ざんえい 《ノワール》が','さいごの ちからを ふりしぼり たちはだかる！！']},
    ],
  },
  milte: {
    name:'ミルテむら', tiles:MILTE_TILES, bgm:'town', town:true, pad:'T',
    entry:{x:10,y:12}, exitTo:{x:48,y:39},
    npcs:[
      {x:4, y:5, emoji:'👩', inn:8},
      {x:10,y:5, emoji:'👨', shop:'milte'},
      {x:16,y:5, emoji:'👴', event:'monta'},
      {x:4, y:9, emoji:'⛪', church:true},
      {x:7, y:10,emoji:'👵', msg:['メニュー(Xキー)から いつでも セーブできるよ。','こまめに セーブするんだよ。']},
      {x:14,y:8, emoji:'🧒', msg:['まものに 《にく》を あげると なかよくなりやすいんだ！','たたかいのとき どうぐで にくを なげてみて！'], wander:true},
      {x:17,y:10,emoji:'👨', msg:['きゅうに まものたちが あばれだした…','ひがしの こだまの洞窟から へんな うたが きこえるんだ。'], wander:true},
      {x:5, y:11,emoji:'👩', msg:['きたの とうげを こえると 王都カンタービレ。','ガルドおうさまは きさくな おかたよ。'], wander:true},
    ],
    objects:[],
  },
  canta: {
    name:'王都カンタービレ', tiles:CANTA_TILES, bgm:'town', town:true, pad:'T',
    entry:{x:13,y:16}, exitTo:{x:41,y:29},
    npcs:[
      {x:13,y:4, emoji:'👑', event:'king'},
      {x:11,y:4, emoji:'🦸', event:'ryuka3'},
      {x:15,y:4, emoji:'🧙', event:'mira3'},
      {x:17,y:4, emoji:'🙏', event:'sena3'},
      {x:12,y:5, emoji:'💂', msg:['ここは カンタービレじょう。','ガルドおうさまが おまちかねだ。とおられよ。']},
      {x:16,y:5, emoji:'💂', msg:['せかいじゅうの まものが きゅうに きょうぼうかした…','《やみのうた》の しわざだと いうのだが。']},
      {x:14,y:8, emoji:'🏹', event:'kirie1', unless:'k1'},
      {x:4, y:11,emoji:'👩', inn:24},
      {x:9, y:11,emoji:'👨', shop:'canta'},
      {x:18,y:11,emoji:'⛪', church:true},
      {x:23,y:11,emoji:'⛺', event:'ranch'},
      {x:6, y:16,emoji:'🧒', msg:['おしろに でんせつの ゆうしゃリュカさまが いるんだよ！','20ねんまえ しんまおうノワールを たおしたんだって！'], wander:true},
      {x:20,y:16,emoji:'👨', msg:['まものを なかまにする わかものが いると きいたが…','おお、 きみのことか！ たのもしいねえ。'], wander:true},
    ],
    objects:[],
  },
  porto: {
    name:'みなとまち ポルト', tiles:PORTO_TILES, bgm:'town', town:true, pad:'T',
    entry:{x:11,y:10}, exitTo:{x:30,y:29},
    npcs:[
      {x:4, y:5, emoji:'👩', inn:60},
      {x:10,y:5, emoji:'👨', shop:'porto'},
      {x:16,y:5, emoji:'⛪', church:true},
      {x:13,y:10,emoji:'💂', event:'harbor'},
      {x:3, y:6, emoji:'⛺', event:'ranch'},
      {x:8, y:6, emoji:'🏹', event:'kirie2', unless:'k2', requires:'ship'},
      {x:6, y:9, emoji:'👴', msg:['みなみの さばくの まち オアシアには','ふしぎな たいこの おとが ひびいてくるそうだ…'], wander:true},
      {x:17,y:7, emoji:'🧒', msg:['ふたつの大陸の あいだの こじまに','まっかな おっきい タコが いるんだって！ こわ〜い！'], wander:true},
      {x:19,y:9, emoji:'👵', msg:['きたのうみの ゆきの大陸には ユキネというむらが ある。','こおりの大聖堂の うたごえは おそろしいぞ…'], wander:true},
    ],
    objects:[],
  },
  oasia: {
    name:'さばくのまち オアシア', tiles:OASIA_TILES, bgm:'town', town:true, pad:'T',
    entry:{x:9,y:11}, exitTo:{x:12,y:34},
    npcs:[
      {x:4, y:5, emoji:'👩', inn:120},
      {x:10,y:5, emoji:'👨', shop:'oasia'},
      {x:16,y:5, emoji:'⛪', church:true},
      {x:13,y:8, emoji:'⛺', event:'ranch'},
      {x:4, y:9, emoji:'👴', msg:['にしの ピラミッドから ドンドコ ドンドコ…','よるも ねむれん たいこのおとが ひびいてくるのじゃ。']},
      {x:12,y:7, emoji:'🏹', event:'kirie3', unless:'k3', requires:'g3'},
      {x:8, y:9, emoji:'🧒', msg:['さばくの まものは どくをつかうよ！','どくけしそうを わすれずにね！'], wander:true},
      {x:15,y:9, emoji:'👨', msg:['ピラミッドには かくしべやが あるという…','おうけのぼうれいが ねむっているとか なんとか。'], wander:true},
    ],
    objects:[],
  },
  yukine: {
    name:'ゆきのむら ユキネ', tiles:YUKINE_TILES, bgm:'town', town:true, pad:'T',
    entry:{x:8,y:10}, exitTo:{x:28,y:10},
    npcs:[
      {x:4, y:5, emoji:'👵', inn:200},
      {x:12,y:5, emoji:'👨', shop:'yukine'},
      {x:4, y:9, emoji:'⛪', church:true},
      {x:13,y:9, emoji:'⛺', event:'ranch'},
      {x:8, y:6, emoji:'👴', msg:['ひがしの こおりの大聖堂に やみの楽団の バリトンがいる。','あの こえを きいた ものは ねむったまま おきられんとか…'], wander:true},
      {x:13,y:8, emoji:'🧒', msg:['にしの おくちで うごく こおりの きょぞうを みたよ！','むかしばなしの グラシエスに そっくりだった！'], wander:true},
      {x:11,y:9, emoji:'👩', msg:['5つの がくふが そろったら うみの まんなかの','しらべの塔へ いくのよ。 ひかりのうたが まっているわ。'], wander:true},
    ],
    objects:[],
  },
  tremolo: {
    name:'かくれざと トレモロ', tiles:TREMOLO_TILES, bgm:'town', town:true, pad:'T',
    entry:{x:7,y:9}, exitTo:{x:53,y:18},
    npcs:[
      {x:4, y:5, emoji:'👴', event:'tremelder'},
      {x:12,y:5, emoji:'👨', shop:'tremolo'},
      {x:3, y:8, emoji:'👩', inn:150},
      {x:12,y:8, emoji:'⛺', event:'ranch'},
      {x:11,y:8, emoji:'🧒', msg:['ここは まものと にんげんが いっしょにくらす さと！','きみの なかまたちも きっと よろこぶよ♪'], wander:true},
    ],
    objects:[],
  },
  cave1: {
    name:'こだまの洞窟', tiles:buildCave1(), bgm:'dungeon', dungeon:true, pad:'#',
    entry:{x:14,y:17}, exitTo:{x:56,y:37}, enc:{table:'cave1', rate:13},
    npcs:[],
    objects:[
      {id:'c1_h', type:'chest', x:21, y:8,  item:'herb'},
      {id:'c1_s', type:'chest', x:7,  y:14, item:'seedstr'},
      {id:'c1_m', type:'chest', x:25, y:6,  item:'meat2'},
      {id:'c1_pb',type:'boss',  x:23, y:4,  monster:'goblinlord', flag:'pb_goblord',
       reward:{item:'meat2', n:3},
       pre:['たからべやの おくに みどりいろの おおおとこが…','1だいめゆうしゃの しゅくてき──','《ゴブリンロード》が こんぼうを かまえた！']},
      {id:'c1_b', type:'boss',  x:5,  y:2,  monster:'b_kslime', flag:'g1', gakufu:true,
       pre:['どうくつの おくで キングスライムが くるしんでいる…！','からだじゅうから やみのおとが あふれだしている！','たすけるには たたかって めをさまさせる しかない！']},
    ],
  },
  seido: {
    name:'もりの旧聖堂', tiles:buildSeido(), bgm:'dungeon', dungeon:true, pad:'#',
    entry:{x:13,y:16}, exitTo:{x:52,y:26}, enc:{table:'seido', rate:13},
    npcs:[],
    objects:[
      {id:'se_m', type:'chest', x:22, y:3, item:'mwater'},
      {id:'se_d', type:'chest', x:2,  y:9, item:'seeddef'},
      {id:'se_g', type:'chest', x:7,  y:3, gold:300},
      {id:'se_pb',type:'boss',  x:3,  y:3, monster:'eldertrent', flag:'pb_elder',
       reward:{item:'c_def2'},
       pre:['にしの まに ふるい おおきが ねむっている……','2だいめゆうしゃが たおした もりのぬし──','《エルダートレント》が めを さました！']},
      {id:'se_b', type:'boss',  x:13, y:2, monster:'lyrica', flag:'g2', gakufu:true,
       pre:['せいどうの さいだんに うつくしい うたごえが ひびく…','「あら… わたしの コンサートの じゃまを するきかしら？」','やみの楽団 うたひめ 《リリカ》が ハープを かまえた！']},
    ],
  },
  pyramid: {
    name:'すなのピラミッド', tiles:buildPyramid(), bgm:'dungeon', dungeon:true, pad:'#',
    entry:{x:15,y:19}, exitTo:{x:7,y:40}, enc:{table:'pyramid', rate:13},
    npcs:[],
    objects:[
      {id:'py_g', type:'chest', x:4,  y:5,  item:'seedagi'},
      {id:'py_h', type:'chest', x:25, y:5,  item:'hherb'},
      {id:'py_w', type:'chest', x:26, y:6,  gold:800},
      {id:'py_pb',type:'boss',  x:3,  y:11, monster:'pharaoh', flag:'pb_pharaoh',
       reward:{gold:3000},
       pre:['かくしべやの くうきが つめたく しずんでいる……','おうけのぼうれい 《ファラオ》が','やすらかな ねむりを やぶられ いかりに もえる！']},
      {id:'py_c', type:'chest', x:3,  y:12, item:'meat2'},
      {id:'py_b', type:'boss',  x:15, y:2,  monster:'donga', flag:'g3', gakufu:true,
       pre:['げんしつに ばくおんが とどろく！ ドンドコ！ ドンドコ！','「オレの リズムに あわせて ふるえるがいい！」','やみの楽団 だいこうち 《ドンガ》だ！！']},
    ],
  },
  volcano: {
    name:'とどろきの火山', tiles:buildVolcano(), bgm:'dungeon', dungeon:true, pad:'#',
    entry:{x:14,y:17}, exitTo:{x:13,y:19}, enc:{table:'volcano', rate:13},
    npcs:[],
    objects:[
      {id:'v_g', type:'chest', x:5,  y:5,  gold:1500},
      {id:'v_s', type:'chest', x:4,  y:12, item:'seedstr'},
      {id:'v_m', type:'chest', x:10, y:4,  item:'meat3'},
      {id:'v_pb',type:'boss',  x:22, y:5,  monster:'ignis', flag:'pb_ignis',
       reward:{item:'meat3', n:2},
       pre:['ようがんの いけから ねっぷうが ふきあげる……！','えんりゅう 《イグニス》が ふたたび つばさを ひろげた！！']},
      {id:'v_c', type:'chest', x:17, y:4,  item:'lifeorb'},
      {id:'v_b', type:'boss',  x:14, y:2,  monster:'fagor', flag:'g4', gakufu:true,
       pre:['かこうに かんだかい ふえのねが ひびきわたる！','「あつい あついと よろこべ！ もっと もりあげてやる！」','やみの楽団 ふえふき 《ファゴル》だ！！']},
    ],
  },
  icecath: {
    name:'こおりの大聖堂', tiles:buildIceCath(), bgm:'dungeon', dungeon:true, pad:'#',
    entry:{x:14,y:17}, exitTo:{x:45,y:7}, enc:{table:'icecath', rate:13},
    npcs:[],
    objects:[
      {id:'ic_g', type:'chest', x:4,  y:10, gold:2500},
      {id:'ic_m', type:'chest', x:23, y:10, item:'mwater2'},
      {id:'ic_pb',type:'boss',  x:2,  y:12, monster:'reiga', flag:'pb_reiga',
       reward:{item:'c_def3'},
       pre:['ゆきだまりの かげに きょだいな こおりの ぞうが……','ひょうしょう 《レイガ》が なぎなたを かまえた！！']},
      {id:'ic_b', type:'boss',  x:14, y:2,  monster:'bariton', flag:'g5', gakufu:true,
       pre:['だいせいどうに ふかく ひくい うたごえが ながれる……','「ねむれ…… ねむれ…… えいえんの ゆめのなかへ……」','やみの楽団 うたごえ 《バリトン》だ！！']},
    ],
  },
  tower: {
    name:'しらべの塔', tiles:buildTower(), bgm:'dungeon', dungeon:true, pad:'#',
    entry:{x:11,y:15}, exitTo:{x:28,y:20}, enc:{table:'towerD', rate:15},
    npcs:[
      {x:11, y:11, emoji:'👴', event:'towerkeeper', unless:'toweropen'},
    ],
    objects:[
      {id:'tw_w', type:'chest', x:5,  y:6, item:'w_star'},
      {id:'tw_g', type:'chest', x:18, y:6, gold:2000},
      {id:'tw_m', type:'chest', x:18, y:8, item:'meat3'},
      {id:'tw_b', type:'boss',  x:11, y:2, monster:'b_kirie', flag:'kduel',
       pre:['とうの ちょうじょうに キリエが たっていた。','「やっぱり きたのね。 ……ここから さきは わたさない。」','「まものを つれた あんたを しんよう できないの！」','「わたしに かてたら みとめて あげる！！」']},
    ],
  },
  opera: {
    name:'やみのオペラハウス', tiles:buildOpera(), bgm:'final', dungeon:true, pad:'#',
    entry:{x:16,y:23}, exitTo:{x:13,y:7}, enc:{table:'opera', rate:12},
    npcs:[
      {x:14, y:22, emoji:'🏹', event:'kirie5', unless:'k5'},
    ],
    objects:[
      {id:'op_g', type:'chest', x:9,  y:6,  gold:3000},
      {id:'op_l', type:'chest', x:23, y:6,  item:'lifeorb'},
      {id:'op_p', type:'chest', x:4,  y:9,  item:'c_pow3'},
      {id:'op_m', type:'chest', x:24, y:9,  item:'meat3'},
      {id:'op_w', type:'chest', x:28, y:9,  item:'mwater2'},
      {id:'op_pb',type:'boss',  x:16, y:10, monster:'darkgeneral', flag:'pb_dgen',
       reward:{item:'s_hikari'},
       pre:['「ここから さきは とおさぬ。」','「ノクターンさまの ぶたいを けがす ものよ──」','「まぐんしょう ザガンが あいてに なろう！」'],
       win:['ザガンは くずれおちた…','「みごとだ…… ゆけ、 わかき まものつかいよ……」']},
      {id:'op_b', type:'boss',  x:16, y:2,  monster:'nocturne', flag:'clear', final:true,
       pre:['ぶたいの うえで くろい タクトが ゆれている。','「ようこそ わたしの オペラへ。」','「まものたちの ひめいは さいこうの がくきょく──」','「フィナーレは きみたちの ぜつぼうで かざろう！！」']},
    ],
  },
  origin: {
    name:'はじまりのほこら', tiles:buildOrigin(), bgm:'dungeon', dungeon:true, pad:'#',
    entry:{x:9,y:13}, exitTo:{x:4,y:17},
    npcs:[
      // エデン撃破後、いた場所に《たたかいの いしぶみ》が現れて全ボスと再戦できる
      {x:9, y:4, emoji:'🗿', event:'arena', requires:'b_eden'},
    ],
    objects:[
      {id:'or_b', type:'boss', x:9, y:4, monster:'eden', flag:'b_eden', eden:true,
       pre:['ほこらの おくで しろい りゅうが しずかに めを ひらいた。','「……すべての まものと こころを かわした こよ。」','「すべての ぬしたちを こえてきた こよ。」','「わたしは エデン。 さいしょの うた、 さいしょの まもの。」','「さあ── あなたの うたを きかせてちょうだい！！」']},
    ],
  },
};

// ワールドの入口タイル → マップ
const ENTRANCES = {
  '1':'milte', '2':'canta', '3':'porto', '4':'oasia', '5':'yukine', '6':'tremolo',
  'c':'cave1', 'f':'seido', 'p':'pyramid', 'v':'volcano', 'i':'icecath', 't':'tower', 'X':'opera', 'e':'origin',
};

// タイル歩行可否。'g'はゲート、'~'は船所持時のみ（game.jsで特別処理）
const WALKABLE = new Set(['.', ',', 'F', 'S', 's', 'd', '=', '-', '>', '_', 'k', 'K',
  '1','2','3','4','5','6','c','f','p','v','i','t','X','e']);
// NPCが徘徊できるタイル
const WANDER_OK = new Set(['.', 'S', 's', '_', 'k', 'F']);
