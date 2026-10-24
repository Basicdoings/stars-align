const app = document.getElementById('app');
const musicButton = document.getElementById('music');
const song = document.getElementById('song');
const cast = ['Bluezi','Boyd','South Boy','Pluto','Government','Dino','On D','Edna'];
const icons = ['✦','♟','⚡','☄','◆','🦖','✧','♛'];
const saved = JSON.parse(sessionStorage.getItem('starsAlignSession') || 'null');
let session = saved;
let room = null;
let stream = null;
let message = '';
let discoveryNotice = '';
let roomSignature = '';
const placeCoords = {
  street:[[22,67],[70,55],[83,73]], memory:[[24,57],[66,68],[82,58]], dance:[[75,42],[52,66],[18,72]],
  rival:[[72,56],[25,54],[82,75]], chase:[[50,46],[23,72],[79,70]], checkpoint:[[72,48],[57,70],[23,65]], launch:[[68,45],[43,72],[84,62]]
};
const sceneAtmosphere = {
  street: ['AIRPORT ROAD · LIVE', 'Danfo horns, hawkers and late-night arrivals fill the road.'],
  memory: ['MOSAIC LOUNGE · LIVE', 'The Vibe Girls compare routes while the room trades stories.'],
  dance: ['NEON CLUB · LIVE', 'The DJ changes the rhythm and the whole floor answers.'],
  rival: ['COURTYARD · LIVE', 'The rival crew watches every entrance while bikes cut through.'],
  chase: ['LAGOON BRIDGE · LIVE', 'Traffic streams over the water as boats pass underneath.'],
  checkpoint: ['STAR GATE · LIVE', 'Guards, technicians and travelers work around the scanner.'],
  launch: ['LAUNCH PAD · LIVE', 'Ground crew clear the ramp while the ship systems wake up.']
};
const places = {
  street: [['car','Check the car','The crew is still boxed in by traffic.'],['hawker','Talk to the hawker','Cold sachet water, straight from the cooler.'],['crowd','Look at the crowd','They spotted Bluezi the moment the car slowed down.']],
  memory: [['turn','Check the turn','Boyd points towards a quieter street.'],['bus','Look at the danfo','It is blocking half the junction.'],['crowd','Watch the fans','A few fans follow the car on foot.']],
  dance: [['dj','Find the DJ','The DJ waves the crew towards the floor.'],['dancers','Watch the dancers','Edna is already in the middle of the crowd.'],['stall','Check the stall','The grill outside is still going.']],
  rival: [['rivals','Watch the rivals','They are waiting to see your next move.'],['alley','Check the alley','There is space to get around them.'],['bike','Look at the bike','A rider slips through the traffic.']],
  chase: [['bridge','Look at the bridge','The road over the water is still open.'],['traffic','Watch the traffic','Headlights stretch down the road.'],['boat','Look at the water','A boat cuts across below the bridge.']],
  checkpoint: [['scanner','Check the scanner','It needs an exact symbol match.'],['guard','Talk to the guard','The guard points the crew towards the scanner.'],['pass','Check the pass','The symbols are printed in a precise order.']],
  launch: [['gate','Check the gate','Boarding closes when the minute ends.'],['crew','Count the crew','Everybody needs to make their own choice.'],['plane','Look at the plane','It is waiting at the final gate.']]
};
function showMusicState() {
  window.StarsAudio.status();
}
function startMusic() {
  window.StarsAudio.start();
}
showMusicState();
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icon = name => icons[cast.indexOf(name)] || '✦';
const seconds = () => room?.endsAt ? Math.max(0, Math.ceil((room.endsAt - Date.now())/1000)) : 0;
const error = text => { message = text; render(); };
startMusic();
document.addEventListener('pointerdown', startMusic, {capture:true});
document.addEventListener('keydown', startMusic, {capture:true});

function worldStage(id) {
  if (room?.status !== 'playing') return `<div class="world-motion" aria-hidden="true"><div class="world-traffic traffic-one"></div><div class="world-traffic traffic-two"></div><div class="world-walker walker-one"></div><div class="world-light"></div></div>`;
  const canMove = ['intro','review'].includes(room?.phase);
  const items = places[id] || [];
  const hotspots = items.map(([key,label], i) => {
    const found = room?.me?.discoveries?.includes(key);
    const [x,y] = placeCoords[id]?.[i] || [50,50];
    return `<button class="world-hotspot ${found?'found':''}" style="--x:${x};--y:${y}" data-action="discover" data-key="${key}" data-x="${x}" data-y="${y}" type="button" ${found?'disabled':''} aria-label="${esc(label)}"><span>${found?'✓':'✦'}</span><b>${esc(label)}</b></button>`;
  }).join('');
  const destination = room?.challenge?.destination;
  const atmosphere = room?.phase === 'arrival' ? ['DESCENT · LIVE','The lagoon lights rise beneath Bluezi’s flight.'] : sceneAtmosphere[id];
  const showExplore = room?.phase !== 'arrival';
  return `<div class="world-view ${canMove?'':'world-locked'}" data-world data-index="${room?.index ?? -1}" aria-label="Explorable ${esc(room?.phase==='arrival'?'airport arrival':room?.challenge?.setting || 'arrival')} scene"><canvas id="world-canvas" aria-label="3D game world"></canvas>${atmosphere?`<div class="ambient-story" aria-live="polite"><strong>${esc(atmosphere[0])}</strong><span>${esc(atmosphere[1])}</span></div>`:''}${showExplore&&items.length?`<div class="world-hotspots" aria-label="Discoveries">${hotspots}</div>`:''}${showExplore&&destination?`<div class="world-door" aria-hidden="true"><span>NEXT</span>${esc(destination)}</div>`:''}<p class="world-help">${room?.phase==='arrival'?'ARRIVING · MURTALA MUHAMMED AIRPORT':canMove?'Tap the ground or use arrow keys to move · approach ✦ markers':'Movement paused · choose your response'}</p></div>`;
}

function stateSignature(state) {
  return JSON.stringify({...state, players:state.players?.map(({position,...p})=>p)});
}
function patchPlayerPositions(state) {
  window.StarsAudio.setListener(state.players?.find(p=>p.id===state.me?.id)?.position);
  window.StarsWorld?.update(state);
  for (const p of state.players || []) {
    const node = document.querySelector(`[data-player="${CSS.escape(p.id)}"]`);
    if (!node || !p.position) continue;
    node.style.setProperty('--x', p.position.x); node.style.setProperty('--y', p.position.y);
    node.classList.toggle('is-walking', p.position.animation === 'walk');
    for (const facing of ['nw','ne','sw','se']) node.classList.toggle(`facing-${facing}`, p.position.facing === facing);
  }
}

async function api(action, extra = {}) {
  const response = await fetch(`/api/${action}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code:session?.code, token:session?.token, ...extra})});
  const data = await response.json();
  if (!response.ok) throw Error(data.error || 'Something went wrong');
  return data;
}
function connect() {
  if (stream) stream.close();
  stream = new EventSource(`/api/events?code=${encodeURIComponent(session.code)}&token=${encodeURIComponent(session.token)}`);
  stream.onmessage = event => {
    const previous = room?.index; const nextRoom = JSON.parse(event.data); const signature = stateSignature(nextRoom);
    room = nextRoom; message = ''; if (room.index !== previous) discoveryNotice = '';
    if (signature === roomSignature && document.querySelector('[data-world]')) patchPlayerPositions(room); else render();
    roomSignature = signature;
  };
  stream.onerror = () => { if (!room) error('Reconnecting to the room…'); };
}
function saveSession(data) {
  session = {code:data.code, token:data.token};
  sessionStorage.setItem('starsAlignSession', JSON.stringify(session));
  history.replaceState({}, '', `/?room=${encodeURIComponent(data.code)}`);
  connect();
}
function welcome() {
  const prefill = new URLSearchParams(location.search).get('room') || '';
  return `<section class="scene scene--airport">${worldStage("airport")}<div class="scene-content start-grid"><div class="start-copy"><span class="eyebrow">✦ ONE NIGHT IN LAGOS</span><h1>STARS<br><em>ALIGN.</em></h1><p>Bluezi lands in Lagos, meets the crew and tries to make it back to London. Traffic, a party, a rival crew and a final gate stand in the way.</p><div class="rules-card"><strong>HOW THIS PLAYTEST WORKS</strong><span>Everyone plays on their own screen. Get at least half the crew through each challenge to raise the Mission bar. Keep it above zero and get at least half the crew to hit Launch to win together. Your points decide who tops the scoreboard.</span></div><div class="start-sub">Play solo to test · Or bring 2–8 players · Each answer round allows up to 60 seconds</div></div><div class="panel"><h2 class="panel-title">Get the crew together</h2><div class="fields"><label>Your name<input id="name" maxlength="24" placeholder="What should we call you?" autocomplete="nickname"></label><button class="primary" data-action="create">Create room as Bluezi</button></div><div class="divider">OR JOIN YOUR FRIENDS</div><div class="field-row"><input id="join-code" maxlength="5" value="${esc(prefill)}" placeholder="ROOM CODE" aria-label="Room code"><button class="secondary" data-action="join">Join</button></div><p class="error" role="alert">${esc(message)}</p></div></div></section>`;
}
function lobby() {
  const me = room.players.find(p => p.id === room.me?.id);
  const players = room.players.map(p => p.name).join(', ');
  const taken = new Set(room.players.map(p => p.character));
  const cards = cast.map(name => {
    const owner = room.players.find(p => p.character === name);
    const own = me?.character === name;
    return `<button class="cast-card ${own?'selected':''} ${owner&&!own?'taken':''}" data-action="role" data-character="${esc(name)}" ${owner || room.me?.host ? 'disabled' : ''}><span class="avatar">${icon(name)}</span><strong>${esc(name)}</strong><small>${own?'Your character':owner?esc(owner.name):'Choose character'}</small></button>`;
  }).join('');
  return `<section class="scene scene--airport">${worldStage("airport")}<div class="scene-content"><div class="lobby-header"><div><span class="eyebrow">✦ THE CREW IS ASSEMBLING</span><h1>Who’s outside?</h1><p>Share the code. Everyone joins on their own phone or browser and picks a character.</p><p class="role-note">For this playtest, characters are identities on the scoreboard. Bluezi hosts. Everyone gets the same challenge; character abilities and different routes are planned for a later build.</p></div><div class="room-code"><small>ROOM CODE</small><strong>${esc(room.code)}</strong><button data-action="copy">Copy join link</button></div></div><div class="lobby-bottom"><span class="eyebrow">THE CAST · ${room.players.length}/8 JOINED</span><div class="cast">${cards}</div><div class="lobby-actions">${room.me?.host?`<button class="primary" data-action="start" ${room.players.filter(p=>p.connected).length<2?'disabled':''}>Start with crew →</button><button class="secondary" data-action="solo">Test solo</button>`:`<span class="status-pill">Waiting for Bluezi to start</span>`}<span class="roster-count">${esc(players)}</span></div><p class="error-inline" role="alert">${esc(message || (room.me?.host && room.players.filter(p=>p.connected).length<2 ? 'You can test solo now, or wait for another player.' : ''))}</p></div></div></section>`;
}
function meter(label, value, extra = '') {
  return `<div class="meter"><div class="meter-line"><span>${esc(label)}</span><span>${value}%</span></div><div class="track"><span class="fill ${extra}" style="width:${value}%"></span></div></div>`;
}
function scoreboard() {
  return `<details class="scoreboard"><summary>CREW · ${room.players.length}</summary><div class="rows">${[...room.players].sort((a,b)=>b.points-a.points).map(p=>`<div class="player-row"><span class="avatar">${icon(p.character)}</span><div class="who"><strong>${esc(p.character)} ${p.id===room.me?.id?'(you)':''}</strong><small>${esc(p.name)} · ${p.fame || 0}% fame${!p.connected?' · offline':''}</small></div><span class="score">${p.points}</span></div>`).join('')}</div></details>`;
}
function challengeArea() {
  const s = room.challenge, phase = room.phase;
  if (!s) return '';
  let inner = '';
  if (phase === 'arrival') inner = `<div class="arrival-copy"><span>9:42 PM · DESCENDING INTO LAGOS</span><p>Bluezi’s flight crosses the lagoon lights. Below, the city is already moving — traffic, music and the crew waiting outside.</p><small>Touchdown in <strong class="countdown">${seconds()}</strong>s</small></div>`;
  if (phase === 'intro') inner = `<p class="prompt">${esc(s.story)}</p>${s.type==='intel'?intelPanel():`<p class="state-note">Explore now. The challenge locks movement in <strong class="countdown">${seconds()}</strong>s.</p>`}`;
  if (phase === 'active') {
    const locked = room.me?.answered;
    if (s.type === 'rhythm') {
      inner = `<p class="prompt">${esc(s.prompt)}</p><div><span class="pulse" style="animation-delay:-${Math.max(0,Date.now()-room.startedAt)%750}ms">♪</span><button class="rhythm-pad" data-action="tap">TAP THE BEAT</button></div><p class="state-note">Clean hits: <strong>${room.me?.hits || 0}</strong> · Timing pulses every ¾ second.</p>`;
    } else if (s.type === 'launch') {
      inner = `<p class="prompt">${esc(s.prompt)}</p><button class="primary" data-action="answer" ${locked?'disabled':''}>${locked?'Launch locked in ✓':'🚀  LAUNCH NOW'}</button>`;
    } else {
      inner = `${s.type==='intel'?intelPanel():''}<div class="thought-bubble"><span>${s.type==='vote'?'CREW THOUGHT':'THINK IT THROUGH'}</span><p>${esc(s.prompt)}</p></div><div class="response-list">${s.options.map((option,i)=>`<button class="response ${room.me?.answer===i?'selected':''}" data-action="answer" data-index="${i}" ${locked?'disabled':''}><span>${room.me?.answer===i?'✓':String.fromCharCode(65+i)}</span><strong>${esc(option)}</strong>${s.consequences?.[i]?`<small>${esc(s.consequences[i])}</small>`:''}</button>`).join('')}</div>${locked?'<p class="state-note">Your selected response is shown below the thought. Waiting for the crew…</p>':''}`;
    }
  }
  if (phase === 'review') inner = `<div class="review-label">${room.review?.passed?'✓ Crew passed this round':'✕ Crew missed this round'}</div><p class="prompt">${room.review?.successful || 0} of ${room.review?.total || 0} succeeded; ${room.review?.required || 1} required. Mission ${room.review?.passed?'+8':'−12'}.</p><p class="state-note">${s.type==='vote'?`Crew choice: ${esc(room.review?.route)}.`:s.type==='choice'||s.type==='intel'?`Correct answer: ${esc(s.options[s.correct])}.`:s.type==='rhythm'?'Three clean taps count as a pass.':'Launch confirmations are now frozen.'}${room.review?.perfect?' Perfect crew round — no extra Mission was added.':''}</p>`;
  return `<div class="challenge-panel thought-field ${phase==='arrival'?'arrival-field':''}"><div class="challenge-top"><span>${phase==='arrival'?'FLIGHT SA 247':phase==='review'?'THE RESULT':phase==='intro'?'UP NEXT':'YOUR MOVE'}</span><span class="countdown">${seconds()}s</span></div>${inner}<p class="error-inline" role="alert">${esc(message)}</p></div>`;
}
function intelPanel() {
  const shared = room.sharedClues?.length ? room.sharedClues.map(clue=>`<li>${esc(clue)}</li>`).join('') : '<li>No clues shared yet.</li>';
  return `<div class="intel-card"><span>YOUR CLUE</span><strong>${esc(room.me?.privateClue || 'Waiting for your role…')}</strong><button class="secondary" data-action="share" type="button">Share clue</button><details class="clue-board"><summary>Crew clues (${room.sharedClues?.length||0})</summary><ul>${shared}</ul></details></div>`;
}
function game() {
  const s = room.challenge;
  const me = room.players.find(p => p.id === room.me?.id);
  const benefit = s?.id === 'checkpoint' && room.benefits?.includes('power-cell') ? '<p class="benefit-note">⚡ The club power cell is lighting the correct scanner sequence.</p>' : '';
  const cinematic=['story','arrival'].includes(room.phase);
  return `<section class="scene play-scene scene--${esc(s?.id)} phase-${esc(room.phase)}">${worldStage(s?.id)}<header class="play-hud"><div class="location-chip"><span>CHAPTER ${room.index+1} / ${room.total}</span><h1>${esc(s?.title)}</h1></div>${!cinematic?`<div class="compact-stats"><span>MISSION <b>${room.meter}%</b></span><span>FAME <b>${room.me?.fame||0}</b></span></div>`:''}</header>${cinematic?`<div class="cinema-caption" aria-live="polite"><span id="story-speaker"></span><p id="story-line"></p><div class="story-progress"><i></i><i></i><i></i></div></div>`:room.phase==='intro'?`<div class="explore-toast"><b>Explore the scene</b><span>Meet the crew and inspect the ✦ markers · <strong class="countdown">${seconds()}</strong>s</span></div>`:`<aside class="decision-dock">${benefit}${challengeArea()}</aside>`}${!cinematic?scoreboard():''}${discoveryNotice?`<p class="discover-notice" role="status">${esc(discoveryNotice)}</p>`:''}</section>`;
}

function updateStoryCaption(){
  const speaker=document.getElementById('story-speaker'),line=document.getElementById('story-line');
  if(!speaker||!line)return;
  const beats=room.phase==='arrival'?[['LAGOS · 21:42','A familiar city. An unfamiliar visitor.'],['BLUEZI','Touching down. Tell the crew I am outside.'],['ONE NIGHT ONLY','Before London, one night in Lagos.']]:window.StarsStory[room.challenge?.id];
  if(!beats)return;
  const progress=Math.max(0,Math.min(.999,1-(room.endsAt-Date.now())/(room.phaseDuration||18000)));
  const beat=Math.floor(progress*beats.length);
  if(speaker.textContent!==beats[beat][0])speaker.textContent=beats[beat][0];
  if(line.textContent!==beats[beat][1])line.textContent=beats[beat][1];
  document.querySelectorAll('.story-progress i').forEach((node,index)=>node.classList.toggle('seen',index<=beat));
}
function results() {
  const ranked = [...room.players].sort((a,b)=>b.points-a.points);
  const high = ranked[0]?.points || 0; const winners = ranked.filter(p=>p.points===high);
  const recap = (room.events || []).filter(event=>event.text && !event.text.includes('crew passed') && !event.text.includes('crew missed')).slice(-3);
  return `<section class="scene scene--airport">${worldStage("airport")}<div class="scene-content results"><span class="eyebrow">✦ THE NIGHT IS OVER</span><h1>${room.result==='success'?'The crew made it.':'The crew did not make it.'}</h1><p>${esc(room.resultReason)}</p><p class="leader">Life of the Party: ${winners.map(p=>esc(p.character)).join(' & ')} · ${high} points</p><p class="state-note">Final Mission: ${room.meter}%. The crew result and personal title are independent.</p>${recap.length?`<div class="recap"><strong>YOUR NIGHT, RECAPPED</strong><ul>${recap.map(event=>`<li>${esc(event.text)}</li>`).join('')}</ul></div>`:''}<div class="scoreboard results-board">${ranked.map((p,i)=>`<div class="player-row"><span>${i+1}.</span><span class="avatar">${icon(p.character)}</span><div class="who"><strong>${esc(p.character)}</strong><small>${esc(p.name)} · ${p.fame || 0}% fame</small></div><span class="score">${p.points}</span></div>`).join('')}</div>${room.me?.host?'<button class="primary" data-action="restart">Play again with this crew</button>':'<p class="muted">Waiting for Bluezi to start another round.</p>'}<p class="error-inline" role="alert">${esc(message)}</p></div></section>`;
}
function render() {
  const priorCanvas=document.getElementById('world-canvas');
  const sceneKey=room?.phase==='arrival'?'arrival':String(room?.index);
  const retainWorld=room?.status==='playing'&&priorCanvas?.dataset.sceneKey===sceneKey;
  if(retainWorld)priorCanvas.remove();
  window.StarsAudio.setScene(room?.status==='playing'&&room.phase!=='arrival'?room.challenge?.id:'airport',room?.phase||'lobby',room?.review?.passed?`${room.code}:${room.index}:${room.endsAt}`:'');
  window.StarsAudio.setListener(room?.players?.find(p=>p.id===room.me?.id)?.position);
  app.innerHTML = !room ? welcome() : room.status==='lobby' ? lobby() : room.status==='playing' ? game() : results();
  document.body.classList.toggle('is-playing',room?.status==='playing');
  updateStoryCaption();
  const canvas = document.getElementById('world-canvas');
  if(canvas&&retainWorld){canvas.replaceWith(priorCanvas);window.StarsWorld?.update(room);}
  else if (canvas && window.StarsWorld) {canvas.dataset.sceneKey=sceneKey;window.StarsWorld.mount(canvas, room, destination => moveTo(destination.x, destination.y));}
  else window.StarsWorld?.dispose();
}
async function moveTo(x, y) {
  if (!room || room.status !== 'playing' || !['intro','review'].includes(room.phase)) return;
  await api('move', {index:room.index, x, y});
}
app.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]');
  if (!button) {
    const world = event.target.closest('[data-world]');
    if (event.target.id === 'world-canvas') return;
    if (world && ['intro','review'].includes(room?.phase)) {
      const rect = world.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width * 100;
      const y = (event.clientY - rect.top) / rect.height * 100;
      try { await moveTo(x, y); } catch (err) { error(err.message); }
    }
    return;
  }
  if (button.disabled) return;
  const action = button.dataset.action;
  try {
    if (action==='create' || action==='join') {
      const name = document.getElementById('name')?.value.trim();
      if (!name) return error('Enter your name first.');
      const code = document.getElementById('join-code')?.value.trim().toUpperCase();
      if (action==='join' && code?.length !== 5) return error('Enter the five-character room code.');
      saveSession(await api(action, {name, code}));
    } else if (action==='copy') {
      const link = `${location.origin}/?room=${room.code}`;
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(link);
      else window.prompt('Copy the join link', link);
      button.textContent = 'Copied!';
    } else if (action==='role') await api('role', {character:button.dataset.character});
    else if (action==='start' || action==='restart') await api(action);
    else if (action==='solo') await api('start', {solo:true});
    else if (action==='share') await api('share');
    else if (action==='answer') await api('answer', {answer:Number(button.dataset.index)});
    else if (action==='tap') await api('answer');
    else if (action==='discover') {
      const place = places[room?.challenge?.id]?.find(item => item[0] === button.dataset.key);
      await moveTo(Number(button.dataset.x), Number(button.dataset.y));
      const found = await api('discover', {key:button.dataset.key});
      if (!found.already && place) { discoveryNotice = `${place[2]}  +30 points · +2 fame${found.benefit?` · ${found.benefit}`:''}`; render(); }
    }
  } catch (err) { error(err.message); }
});
document.addEventListener('keydown', async event => {
  if (!room || room.status !== 'playing' || !['intro','review'].includes(room.phase) || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(event.key)) return;
  if (event.target.matches('input,button')) return;
  event.preventDefault();
  const me = room.players.find(p=>p.id===room.me?.id); const pos = me?.position || {x:42,y:74}; const step = 4;
  const dx = ['ArrowLeft','a'].includes(event.key) ? -step : ['ArrowRight','d'].includes(event.key) ? step : 0;
  const dy = ['ArrowUp','w'].includes(event.key) ? -step : ['ArrowDown','s'].includes(event.key) ? step : 0;
  try { await moveTo(pos.x + dx, pos.y + dy); } catch (err) { error(err.message); }
});
musicButton.addEventListener('click',()=>window.StarsAudio.toggle());
for(const slider of document.querySelectorAll('[data-audio-level]')){
  const key=slider.dataset.audioLevel;slider.value=Math.round(window.StarsAudio.settings[key]*100);
  const output=slider.parentElement.querySelector('output');output.textContent=`${slider.value}%`;
  slider.addEventListener('input',()=>{window.StarsAudio.setVolume(key,slider.value/100);output.textContent=`${slider.value}%`;});
}
setInterval(() => { updateStoryCaption(); for (const node of document.querySelectorAll('.countdown')) node.textContent = `${seconds()}${node.closest('.challenge-top')?'s':''}`; }, 250);
if (session?.code && session?.token) connect();
else render();
