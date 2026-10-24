/* Local scene mixer: one music source, independent ambience/effects buses. */
(() => {
  const presets = {
    airport: {music:.12, cutoff:2600, traffic:.015, chatter:0, children:0, horns:false, cheers:false, wet:.02},
    street: {music:.12, cutoff:1800, traffic:.07, chatter:.13, children:.085, horns:true, cheers:false, wet:.015},
    memory: {music:.3, cutoff:6500, traffic:0, chatter:.22, children:0, horns:false, cheers:false, wet:.09},
    dance: {music:.55, cutoff:15000, traffic:0, chatter:.16, children:0, horns:false, cheers:true, wet:.12},
    rival: {music:.14, cutoff:2300, traffic:.05, chatter:.12, children:0, horns:true, cheers:false, wet:.025},
    chase: {music:.1, cutoff:1700, traffic:.11, chatter:.025, children:0, horns:true, cheers:false, wet:.01},
    checkpoint: {music:.1, cutoff:3000, traffic:.02, chatter:.07, children:0, horns:false, cheers:false, wet:.025},
    launch: {music:.2, cutoff:6500, traffic:.025, chatter:.07, children:0, horns:false, cheers:false, wet:.06}
  };
  const files={horn:'/assets/audio/car-horn.wav',chatter:'/assets/audio/crowd-chatter.mp3',children:'/assets/audio/children-playing.oga',cheer:'/assets/audio/crowd-cheer.mp3',applause:'/assets/audio/crowd-applause.ogg'};
  let saved={};try{saved=JSON.parse(localStorage.getItem('stars-audio')||'{}');}catch{}
  const clamp=value=>Math.min(1,Math.max(0,Number(value)));
  const settings={muted:!!saved.muted};
  for(const [key,value] of Object.entries({music:.55,ambience:.6,effects:.5}))settings[key]=Number.isFinite(saved[key])?clamp(saved[key]):value;
  let ctx, song, master, music, ambience, effects, filter, wet, rumble, musicPan;
  let listener={x:50,y:65};
  let scene='airport',phase='lobby',timer,loading=false,unlocked=false,lastReview='';
  let due={crowd:0,children:0,horn:0,cheer:0,pass:0};
  const buffers=new Map(), live=new Set();
  const rand=(a,b)=>a+Math.random()*(b-a);
  function persist(){try{localStorage.setItem('stars-audio',JSON.stringify(settings));}catch{}}
  function status(){
    const node=document.getElementById('audio-status');
    if(node)node.textContent=settings.muted?'All sound muted':ctx?.state==='running'?'Sound on · scene mix':unlocked?'Tap to resume sound':'Tap anywhere to enable sound';
    const button=document.getElementById('music');
    if(button){button.classList.toggle('on',!settings.muted);button.innerHTML=`♫ <span>${settings.muted?'Sound off':'Sound on'}</span>`;button.setAttribute('aria-label',settings.muted?'Unmute all sound':'Mute all sound');button.setAttribute('aria-pressed',String(!settings.muted));}
  }
  function ramp(param,value,seconds=.5){param.setTargetAtTime(value,ctx.currentTime,seconds);}
  function build(){
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return false;
    ctx=new Audio();song=document.getElementById('song');song.volume=1;
    master=ctx.createGain();master.gain.value=0;
    const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=12;limiter.ratio.value=5;limiter.attack.value=.006;limiter.release.value=.2;
    master.connect(limiter).connect(ctx.destination);
    music=ctx.createGain();ambience=ctx.createGain();effects=ctx.createGain();
    music.connect(master);ambience.connect(master);effects.connect(master);
    filter=ctx.createBiquadFilter();filter.type='lowpass';filter.Q.value=.5;
    musicPan=ctx.createStereoPanner();ctx.createMediaElementSource(song).connect(filter);filter.connect(musicPan).connect(music);
    // Short room reflections; no long echo masking the song or dialogue.
    const room=ctx.createConvolver(), impulse=ctx.createBuffer(2,Math.floor(ctx.sampleRate*.65),ctx.sampleRate);
    for(let c=0;c<2;c++){const data=impulse.getChannelData(c);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,3)*.3;}
    room.buffer=impulse;wet=ctx.createGain();filter.connect(room).connect(wet).connect(music);
    const noise=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=noise.getChannelData(0);
    let last=0;for(let i=0;i<data.length;i++){last=(last+(Math.random()*2-1)*.025)/1.025;data[i]=last*3;}
    const bed=ctx.createBufferSource();bed.buffer=noise;bed.loop=true;
    const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=420;
    rumble=ctx.createGain();rumble.gain.value=0;bed.connect(low).connect(rumble).connect(ambience);bed.start();
    ctx.onstatechange=status;
    timer=setInterval(tick,600);
    return true;
  }
  async function load(){
    if(loading)return;loading=true;
    await Promise.allSettled(Object.entries(files).map(async([key,url])=>{
      try{const response=await fetch(url);if(!response.ok)throw Error(response.status);buffers.set(key,await ctx.decodeAudioData(await response.arrayBuffer()));}
      catch(error){console.warn(`Optional audio unavailable: ${key}`,error.message);}
    }));
  }
  function mix(){
    if(!ctx)return;const p=presets[scene]||presets.airport;
    const duck=phase==='story'||phase==='arrival'?.5:phase==='active'&&scene!=='dance'?.72:1;
    const spatial=['dance','memory','street','rival'].includes(scene);
    const speaker=scene==='dance'?{x:50,y:43}:scene==='memory'?{x:78,y:45}:{x:85,y:38};
    const distance=Math.hypot(speaker.x-listener.x,speaker.y-listener.y);
    const presence=spatial?Math.max(.48,1-distance/110):1;
    ramp(master.gain,settings.muted||document.hidden?0:.78,.12);
    ramp(music.gain,settings.music*p.music*duck*presence,.65);
    ramp(musicPan.pan,spatial?Math.max(-.55,Math.min(.55,(speaker.x-listener.x)/80)):0,.3);
    ramp(ambience.gain,settings.ambience*(phase==='story'?.65:1),.45);
    ramp(effects.gain,settings.effects*(phase==='story'?.6:1),.3);
    ramp(filter.frequency,p.cutoff,.8);ramp(wet.gain,p.wet,.6);ramp(rumble.gain,p.traffic,.8);
  }
  async function start(){
    if(settings.muted||document.hidden)return;
    if(!ctx&&!build()){status();return;}
    // Both calls happen in the initiating gesture, before any asynchronous fetch.
    const resumed=ctx.resume();const playing=song.play();
    await Promise.allSettled([resumed,playing]);unlocked=ctx.state==='running';mix();status();
    if(unlocked)load();
  }
  function stopVoices(){
    if(!ctx)return;const now=ctx.currentTime;
    for(const voice of live){voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(0,now,.06);try{voice.source.stop(now+.3);}catch{}}
  }
  function sample(key,{level=.1,pan=0,length,offset=0,bus='ambience',cutoff=5000,sweep=false}={}){
    if(settings.muted||document.hidden||ctx?.state!=='running'||live.size>=8)return;
    const buffer=buffers.get(key);if(!buffer)return;
    const duration=Math.min(length||buffer.duration,buffer.duration-offset);if(duration<=0)return;
    const source=ctx.createBufferSource(),gain=ctx.createGain(),lp=ctx.createBiquadFilter(),stereo=ctx.createStereoPanner();
    source.buffer=buffer;lp.type='lowpass';lp.frequency.value=cutoff;stereo.pan.value=pan;
    source.connect(lp).connect(gain).connect(stereo).connect(bus==='effects'?effects:ambience);
    const now=ctx.currentTime,fade=Math.min(.7,duration*.2);
    if(sweep){stereo.pan.setValueAtTime(pan,now);stereo.pan.linearRampToValueAtTime(-pan,now+duration);}
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(level,now+fade);gain.gain.setValueAtTime(level,now+duration-fade);gain.gain.linearRampToValueAtTime(0,now+duration);
    const voice={source,gain};live.add(voice);
    source.onended=()=>{live.delete(voice);source.disconnect();gain.disconnect();lp.disconnect();stereo.disconnect();};
    source.start(now,offset,duration);
  }
  function tick(){
    if(ctx?.state!=='running'||settings.muted||document.hidden)return;
    const now=ctx.currentTime,p=presets[scene]||presets.airport;
    ramp(rumble.gain,p.traffic*(.85+Math.sin(now*.65)*.25),.6);
    if(p.chatter&&now>=due.crowd){
      const buffer=buffers.get('chatter');
      if(buffer)sample('chatter',{level:p.chatter,length:11,offset:rand(0,Math.max(0,buffer.duration-11)),pan:rand(-.35,.35),cutoff:scene==='dance'?2800:4200});
      due.crowd=now+10; // Overlap the fades to avoid a hard loop seam.
    }
    if(p.children&&now>=due.children){sample('children',{level:p.children,length:8,offset:rand(0,18),pan:-.65,cutoff:2200});due.children=now+rand(19,32);}
    if(p.horns&&now>=due.horn){sample('horn',{level:rand(.07,.13),pan:rand(-.8,.8),bus:'effects',cutoff:2600,sweep:true});due.horn=now+rand(11,23);}
    if(p.cheers&&now>=due.cheer){sample('cheer',{level:.16,pan:rand(-.55,.55),cutoff:6000});due.cheer=now+rand(22,38);}
  }
  function setScene(id,nextPhase='lobby',eventKey=''){
    id=presets[id]?id:'airport';
    if(id!==scene){stopVoices();scene=id;const now=ctx?.currentTime||0;due={crowd:now,children:now+7,horn:now+rand(3,7),cheer:now+8};}
    phase=nextPhase;mix();
    if(phase==='review'&&eventKey&&lastReview!==eventKey){lastReview=eventKey;if(scene==='dance')sample('applause',{level:.11,length:5,cutoff:5500});}
  }
  function setVolume(key,value){if(!['music','ambience','effects'].includes(key))return;settings[key]=clamp(value);persist();mix();}
  async function toggle(){settings.muted=!settings.muted;persist();if(settings.muted){stopVoices();mix();song?.pause();}else await start();status();}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopVoices();mix();song?.pause();ctx?.suspend().catch(()=>{});}else if(unlocked&&!settings.muted)start();});
  window.addEventListener('pagehide',()=>{clearInterval(timer);stopVoices();song?.pause();ctx?.suspend().catch(()=>{});});
  window.addEventListener('pageshow',event=>{if(event.persisted&&ctx){clearInterval(timer);timer=setInterval(tick,600);if(unlocked)start();}});
  function setListener(position){if(position&&Number.isFinite(position.x)&&Number.isFinite(position.y)){listener=position;mix();}}
  window.StarsAudio={start,setScene,setListener,setVolume,toggle,settings,status};
})();
