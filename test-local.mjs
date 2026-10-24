// Run with: GAME_SPEED=.15 PORT=4174 node server.js & node test-local.mjs
const base = 'http://127.0.0.1:4174';
async function post(action, data) {
  const response = await fetch(`${base}/api/${action}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  const result = await response.json();
  if (!response.ok) throw Error(`${action}: ${result.error}`);
  return result;
}
function listen(code, token, onState) {
  const controller = new AbortController();
  (async () => {
    const response = await fetch(`${base}/api/events?code=${code}&token=${token}`, {signal:controller.signal});
    let buffer = '';
    for await (const chunk of response.body) {
      buffer += new TextDecoder().decode(chunk);
      let end;
      while ((end = buffer.indexOf('\n\n')) >= 0) {
        const event = buffer.slice(0,end); buffer = buffer.slice(end+2);
        if (event.startsWith('data: ')) onState(JSON.parse(event.slice(6)));
      }
    }
  })().catch(error => {if (error.name !== 'AbortError') console.error(error);});
  return () => controller.abort();
}
const host = await post('create',{name:'Host'});
const guest = await post('join',{code:host.code,name:'Friend'});
const closeGuest = listen(guest.code,guest.token,()=>{});
const completed = new Promise((resolve,reject) => {
  const seen = new Set();
  const stories = new Set();
  const intros = new Set();
  const timer = setTimeout(()=>reject(Error('Game timed out')),120000);
  const closeHost = listen(host.code,host.token, async state => {
    if (state.status === 'results') {
      if(stories.size!==state.total){reject(Error('Every challenge must have a preceding story scene'));return;}
      clearTimeout(timer); closeHost(); closeGuest(); resolve(state); return;
    }
    if(state.phase==='story'&&!stories.has(state.index)){
      stories.add(state.index);
      if(!(state.phaseDuration>0)){reject(Error('Story duration must be synchronized'));return;}
      try{
        const response=await fetch(`${base}/api/answer`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...host,answer:0})});
        if(response.status!==409)reject(Error('Questions must reject answers during the story'));
      }catch(error){reject(error);}
      return;
    }
    if (state.phase === 'intro' && !intros.has(state.index)) {
      intros.add(state.index);
      try {
        if (state.index === 0) {
          await post('move',{...host,index:0,x:70,y:55});
          await post('discover',{...host,key:'hawker'});
          const duplicate = await post('discover',{...host,key:'hawker'});
          if (!duplicate.already) throw Error('Discovery was awarded twice');
        }
        if (state.index === 1) await Promise.all([post('share',host),post('share',guest)]);
      } catch (error) { reject(error); }
      return;
    }
    if (state.phase !== 'active' || seen.has(state.index)) return;
    seen.add(state.index);
    if (state.challenge.type === 'rhythm') return;
    const answer = state.challenge.type === 'choice' || state.challenge.type === 'intel' ? [0,0,0,1,0,0,0][state.index] : 0;
    try {
      await Promise.all([post('answer',{...host,answer}),post('answer',{...guest,answer: state.index === 0 ? 1 : answer})]);
    } catch (error) { reject(error); }
  });
});
await new Promise(resolve=>setTimeout(resolve,150));
await post('start',host);
const final = await completed;
if (final.result !== 'success' || final.players.length !== 2 || final.players.some(p=>p.points<=0)) throw Error('Unexpected final result');
if (final.players[0].fame <= final.players[1].fame || final.players[0].points <= final.players[1].points) throw Error('Player fame and scores should reflect individual answers');
if (!final.resultReason || !final.events.length) throw Error('Result reason and event recap must be retained');
console.log(`PASS: ${final.total} synchronized scenes, two players, scores ${final.players.map(p=>p.points).join('/')} and crew ${final.result}`);
const solo = await post('create',{name:'Solo'});
const soloFinished = new Promise((resolve,reject) => {
  const seen = new Set();
  const timer = setTimeout(()=>reject(Error('Solo game timed out')),120000);
  const close = listen(solo.code,solo.token,async state => {
    if (state.status === 'results') { clearTimeout(timer); close(); resolve(state); return; }
    if (state.phase !== 'active' || seen.has(state.index)) return;
    seen.add(state.index);
    if (state.challenge.type === 'rhythm') return;
    const answer = [0,0,0,1,0,0,0][state.index];
    try { await post('answer',{...solo,answer}); } catch(error) { reject(error); }
  });
});
await new Promise(resolve=>setTimeout(resolve,150));
await post('start',{...solo,solo:true});
const soloResult = await soloFinished;
if (soloResult.result !== 'success' || soloResult.players.length !== 1) throw Error('Solo playtest failed');
console.log(`PASS: solo playtest completed ${soloResult.total} scenes with ${soloResult.players[0].points} points`);
