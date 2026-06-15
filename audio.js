// ============================================================
// audio.js — WebAudio chiptune BGM + SFX (placeholder sound)
// ============================================================
'use strict';

let AC = null;
let soundOn = true;
let curBgmName = null;
let bgmTimer = null;
let bgmStep = 0;

function ensureAudio(){
  if(!AC){
    try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return; }
  }
  if(AC && AC.state === 'suspended') AC.resume();
}

// note name ('C4','F#3') -> frequency
function nfreq(n){
  const m = /^([A-G])(#?)(\d)$/.exec(n);
  if(!m) return 0;
  const base = {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]] + (m[2]?1:0);
  const oct = +m[3];
  return 440 * Math.pow(2,(base - 9)/12 + (oct - 4));
}

function tone(freq, dur, type='square', vol=0.05, when=0, slide=0){
  if(!AC || !soundOn || !freq) return;
  const t = AC.currentTime + when;
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide), t+dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t+dur);
  o.connect(g).connect(AC.destination);
  o.start(t); o.stop(t+dur+0.02);
}

function noiseHit(dur=0.15, vol=0.12, when=0){
  if(!AC || !soundOn) return;
  const t = AC.currentTime + when;
  const len = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, len, AC.sampleRate);
  const d = buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = (Math.random()*2-1) * (1 - i/len);
  const src = AC.createBufferSource(); src.buffer = buf;
  const g = AC.createGain(); g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t+dur);
  src.connect(g).connect(AC.destination);
  src.start(t);
}

// ---------------- SFX ----------------
const SFX = {
  cursor(){ tone(880, .04, 'square', .04); },
  ok(){ tone(660,.05,'square',.05); tone(990,.07,'square',.05,.05); },
  cancel(){ tone(440,.06,'square',.04); tone(330,.08,'square',.04,.05); },
  bump(){ tone(110,.06,'triangle',.06); },
  slash(){ noiseHit(.12,.14); tone(180,.08,'sawtooth',.06,0,-120); },
  hit(){ noiseHit(.18,.16); tone(90,.12,'square',.07,0,-50); },
  crit(){ noiseHit(.25,.2); tone(60,.2,'sawtooth',.1,0,-30); },
  spell(){ for(let i=0;i<6;i++) tone(500+i*180,.08,'square',.05,i*.04); },
  heal(){ ['C5','E5','G5','C6'].forEach((n,i)=>tone(nfreq(n),.12,'triangle',.06,i*.07)); },
  buff(){ ['G4','B4','D5','G5'].forEach((n,i)=>tone(nfreq(n),.1,'square',.05,i*.06)); },
  debuff(){ ['G4','E4','C4','A3'].forEach((n,i)=>tone(nfreq(n),.1,'square',.05,i*.06)); },
  revive(){ ['C4','G4','C5','E5','G5','C6'].forEach((n,i)=>tone(nfreq(n),.16,'triangle',.07,i*.09)); },
  miss(){ tone(300,.1,'square',.04,0,-200); },
  run(){ for(let i=0;i<5;i++) tone(700-i*100,.05,'square',.04,i*.05); },
  encounter(){ for(let i=0;i<8;i++) tone(200+((i%2)*150),.06,'sawtooth',.06,i*.045); },
  levelup(){ ['C5','E5','G5','C6','G5','C6'].forEach((n,i)=>tone(nfreq(n),.14,'square',.06,i*.09)); },
  chest(){ ['A4','C5','E5','A5'].forEach((n,i)=>tone(nfreq(n),.1,'square',.05,i*.06)); },
  crystal(){ ['C5','D5','E5','G5','C6','E6','G6'].forEach((n,i)=>tone(nfreq(n),.2,'triangle',.07,i*.1)); },
  gate(){ tone(80,.8,'sawtooth',.08,0,40); noiseHit(.5,.08,.2); },
  inn(){ ['C4','E4','G4','C5','G4','E4','C4'].forEach((n,i)=>tone(nfreq(n),.16,'triangle',.06,i*.1)); },
  gold(){ tone(1200,.05,'square',.05); tone(1600,.08,'square',.05,.05); },
  die(){ ['B3','A3','G3','F3','E3','D3','C3'].forEach((n,i)=>tone(nfreq(n),.25,'sawtooth',.07,i*.16)); },
  join(){ ['C5','E5','G5','C6','E6','G6','C6','E6'].forEach((n,i)=>tone(nfreq(n),.13,'square',.06,i*.08)); },
  ship(){ tone(nfreq('C3'),.5,'triangle',.08); tone(nfreq('G3'),.5,'triangle',.07,.25); tone(nfreq('C4'),.7,'triangle',.07,.5); },
  step(){},
};

// ---------------- BGM ----------------
// each: { bpm, mel:[note|0,...], bass:[note|0,...] }  (8th-note steps)
const BGMS = {
  title:{ bpm:104,
    mel:['C4','G4','C5','E5',0,'D5','C5',0,'E5',0,'D5','C5','A4',0,'G4',0,
         'A4','C5','E5','G5',0,'F5','E5',0,'D5','E5','D5','C5','B4',0,'C5',0],
    bass:['C3',0,'G3',0,'C3',0,'G3',0,'A3',0,'E3',0,'F3',0,'G3',0,
          'F3',0,'C3',0,'A3',0,'E3',0,'F3',0,'G3',0,'C3',0,'G3',0] },
  field:{ bpm:126,
    mel:['G4','C5',0,'C5','B4','C5','D5',0,'E5',0,'D5','C5','B4','G4',0,0,
         'A4','B4','C5','A4','G4','E4','G4',0,'E4','D4','C4',0,'D4','E4','G4',0],
    bass:['C3',0,'G3',0,'C3',0,'G3',0,'A3',0,'E3',0,'F3',0,'G3',0,
          'F3',0,'C3',0,'A3',0,'E3',0,'F3',0,'G3',0,'C3',0,'G3',0] },
  town:{ bpm:108,
    mel:['F4','A4','C5',0,'A4',0,'G4',0,'E4','G4','B4',0,'G4',0,'F4',0,
         'F4','A4','C5','D5','C5',0,'A4',0,'G4','A4','G4','F4','E4',0,'F4',0],
    bass:['F3',0,'C3',0,'G3',0,'C3',0,'C3',0,'G3',0,'C3',0,'C3',0,
          'F3',0,'C3',0,'A3',0,'F3',0,'C3',0,'G3',0,'F3',0,'C3',0] },
  dungeon:{ bpm:92,
    mel:['A3','C4','E4',0,'D4',0,'C4',0,'B3',0,'D4',0,'C4',0,'A3',0,
         'A3','C4','E4',0,'F4',0,'E4',0,'D4','C4','B3',0,'A3',0,0,0],
    bass:['A2',0,0,0,'E3',0,0,0,'G2',0,0,0,'A2',0,0,0,
          'F2',0,0,0,'E2',0,0,0,'D2',0,0,0,'E2',0,0,0] },
  battle:{ bpm:152,
    mel:['A4','A4','E5','A4','G5','E5','C5','A4','F5','E5','D5','C5','B4','C5','D5','E5',
         'A4','A4','E5','A4','G5','E5','C5','A4','D5','E5','F5','E5','D5','C5','B4',0],
    bass:['A2','A3','A2','A3','A2','A3','A2','A3','F2','F3','F2','F3','G2','G3','G2','G3',
          'A2','A3','A2','A3','A2','A3','A2','A3','D3','D3','E3','E3','E2','E2','E3',0] },
  boss:{ bpm:168,
    mel:['D4','D4','A4','D4','C5','A4','F4','D4','D#4','D#4','A#4','D#4','C5','A#4','G4','D#4',
         'D4','D4','A4','D4','C5','A4','F4','D4','G4','A4','A#4','A4','G4','F4','E4','C#4'],
    bass:['D2','D3','D2','D3','D2','D3','D2','D3','D#2','D#3','D#2','D#3','D#2','D#3','D#2','D#3',
          'D2','D3','D2','D3','D2','D3','D2','D3','A2','A2','A#2','A#2','A2','A2','A2','A2'] },
  sea:{ bpm:96,
    mel:['E4','G4','B4','E5',0,'D5','B4',0,'C5',0,'B4','A4','G4',0,'E4',0,
         'F4','A4','C5','F5',0,'E5','C5',0,'D5','C5','B4','A4','B4',0,'E4',0],
    bass:['E3',0,'B3',0,'E3',0,'B3',0,'A3',0,'E3',0,'B2',0,'B3',0,
          'F3',0,'C4',0,'F3',0,'C4',0,'G3',0,'D3',0,'E3',0,'B2',0] },
  final:{ bpm:140,
    mel:['C4','C4','G4','C4','A#4','G4','D#4','C4','C#4','C#4','G#4','C#4','B4','G#4','F4','C#4',
         'D4','D4','A4','D4','C5','A4','F4','D4','D#4','F4','G4','G#4','A#4','C5','D5','D#5'],
    bass:['C2','C3','C2','C3','C2','C3','C2','C3','C#2','C#3','C#2','C#3','C#2','C#3','C#2','C#3',
          'D2','D3','D2','D3','D2','D3','D2','D3','D#2','D#3','F2','F3','G2','G3','G#2','A#2'] },
  ending:{ bpm:116,
    mel:['C5',0,'G4',0,'A4','B4','C5','D5','E5',0,'C5',0,'G5',0,'E5',0,
         'F5','E5','D5','C5','D5','C5','B4','A4','G4','A4','B4','C5','D5',0,'C5',0],
    bass:['C3',0,'G3',0,'F3',0,'G3',0,'C3',0,'G3',0,'C3',0,'G3',0,
          'F3',0,'C3',0,'G3',0,'E3',0,'F3',0,'G3',0,'C3',0,'G3',0] },
};

function playBgm(name){
  curBgmName = name;
  if(bgmTimer){ clearInterval(bgmTimer); bgmTimer = null; }
  if(!soundOn || !AC || !BGMS[name]) return;
  const trk = BGMS[name];
  const stepDur = 60 / trk.bpm / 2; // 8th note
  bgmStep = 0;
  bgmTimer = setInterval(()=>{
    if(!soundOn) return;
    const i = bgmStep % trk.mel.length;
    const m = trk.mel[i], b = trk.bass[i];
    if(m) tone(nfreq(m), stepDur*0.92, 'square', 0.035);
    if(b) tone(nfreq(b), stepDur*0.92, 'triangle', 0.05);
    bgmStep++;
  }, stepDur*1000);
}

function stopBgm(){
  curBgmName = null;
  if(bgmTimer){ clearInterval(bgmTimer); bgmTimer = null; }
}

function toggleSound(){
  soundOn = !soundOn;
  if(soundOn){ ensureAudio(); if(curBgmName) playBgm(curBgmName); }
  else if(bgmTimer){ clearInterval(bgmTimer); bgmTimer = null; }
  return soundOn;
}
