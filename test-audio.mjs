import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

// Behavioural checks: scene isolation, one audio graph, mute and persistence.
let clock=0, contextCount=0, mediaCount=0, tick, paused=0, played=0;
const starts=[],stops=[],events={},saved={};
class Param{value=0;setTargetAtTime(v){this.value=v;}setValueAtTime(v){this.value=v;}linearRampToValueAtTime(v){this.value=v;}cancelScheduledValues(){}}
class Node{gain=new Param();frequency=new Param();Q=new Param();pan=new Param();threshold=new Param();knee=new Param();ratio=new Param();attack=new Param();release=new Param();connect(node){return node;}disconnect(){}start(){starts.push(this.buffer?.file||'procedural');}stop(){stops.push(this.buffer?.file||'procedural');this.onended?.();}}
class AudioContext{
  constructor(){contextCount++;}state='suspended';sampleRate=100;destination=new Node();get currentTime(){return clock;}
  createGain(){return new Node();}createDynamicsCompressor(){return new Node();}createBiquadFilter(){return new Node();}createConvolver(){return new Node();}createStereoPanner(){return new Node();}createBufferSource(){return new Node();}
  createMediaElementSource(){mediaCount++;return new Node();}createBuffer(c,n){return{getChannelData:()=>new Float32Array(n),duration:n/100};}
  async decodeAudioData(data){return{file:data.file,duration:60};}async resume(){this.state='running';}async suspend(){this.state='suspended';}
}
const song={volume:0,play:async()=>{played++;},pause:()=>{paused++;}};
const status={textContent:''},button={classList:{toggle(){}},setAttribute(){}};
const sandbox={console,Math,Number,Map,Set,Promise,AudioContext,localStorage:{getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v},setInterval:fn=>{tick=fn;return 1;},clearInterval(){},document:{hidden:false,getElementById:id=>id==='song'?song:id==='music'?button:status,addEventListener:(name,fn)=>events[name]=fn},fetch:async url=>({ok:true,arrayBuffer:async()=>({file:url.split('/').at(-1)})}),addEventListener:(name,fn)=>events[name]=fn};
sandbox.window=sandbox;
vm.runInNewContext(await fs.readFile(new URL('./public/audio-mixer.js',import.meta.url),'utf8'),sandbox);
const audio=sandbox.StarsAudio;
await audio.start();await new Promise(resolve=>setImmediate(resolve));await audio.start();
assert.equal(contextCount,1);assert.equal(mediaCount,1);
audio.setScene('street','intro');clock=40;tick();
assert(starts.includes('car-horn.wav'));assert(starts.includes('children-playing.oga'));assert(starts.includes('crowd-chatter.mp3'));
const count=starts.length;audio.setScene('dance','active');clock=80;tick();
assert(stops.includes('children-playing.oga'),'Street voices must fade out when entering a club');
assert(!starts.slice(count).includes('children-playing.oga'));assert(!starts.slice(count).includes('car-horn.wav'));assert(starts.includes('crowd-cheer.mp3'));
await audio.toggle();const mutedCount=starts.length;clock=150;tick();assert.equal(starts.length,mutedCount);assert(paused>0);
audio.setVolume('music',.2);assert.equal(JSON.parse(saved['stars-audio']).music,.2);
await audio.toggle();assert(played>1);assert.equal(mediaCount,1);
sandbox.document.hidden=true;events.visibilitychange();assert.equal(status.textContent.includes('muted'),false);
const hiddenCount=starts.length;clock=220;tick();assert.equal(starts.length,hiddenCount);
console.log('PASS: one audio graph, scene-specific sounds, scene cleanup, mute, volume persistence, hidden-tab silence');
