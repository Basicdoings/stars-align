import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const speed = Math.max(.05, Number(process.env.GAME_SPEED || 1));
const rooms = new Map();
const roster = ['Bluezi', 'Boyd', 'South Boy', 'Pluto', 'Government', 'Dino', 'On D', 'Edna'];
const discoveries = {
  street: {car: [22, 67], hawker: [70, 55], crowd: [83, 73]},
  memory: {turn: [24, 57], bus: [66, 68], crowd: [82, 58]},
  dance: {dj: [75, 42], dancers: [52, 66], stall: [18, 72]},
  rival: {rivals: [72, 56], alley: [25, 54], bike: [82, 75]},
  chase: {bridge: [50, 46], traffic: [23, 72], boat: [79, 70]},
  checkpoint: {scanner: [72, 48], guard: [57, 70], pass: [23, 65]},
  launch: {gate: [68, 45], crew: [43, 72], plane: [84, 62]}
};
const collisionZones = {
  district: [[8, 28, 36, 50], [72, 92, 36, 50]],
  lounge: [[43, 58, 52, 65], [74, 92, 36, 50]],
  club: [[42, 59, 38, 51]],
  gate: [[8, 30, 36, 49], [73, 92, 36, 49]]
};
const scenes = [
  {id: 'street', setting: 'district', destination: 'Mosaic Lounge', area: '01 / AIRPORT-EDGE DISTRICT', title: 'Traffic outside the airport', story: 'Traffic has stopped. The crew must choose what matters most before moving on.', type: 'vote', prompt: 'Choose the crew plan. Each option has a clear tradeoff.', options: ['Refresh: steady start, no shortcut', 'Shortcut: faster, rivals notice', 'Wait: protect the car, lose time'], consequences: ['The crew regroups with the hawker.', 'The crew saves time but attracts attention.', 'The car stays safe while the route gets busier.'], time: 60},
  {id: 'memory', setting: 'lounge', destination: 'Neon Club', area: '02 / MOSAIC LOUNGE', title: 'The Vibe Girls know the route', story: 'Different crew members have different pieces of the route. Share the clues on screen, then combine them.', type: 'intel', prompt: 'Which three markers form the safe route, in order?', options: ['🚌  💧  🌙', '💧  🚌  🌙', '🚌  ⭐  🌙'], correct: 0, time: 60},
  {id: 'dance', setting: 'club', destination: 'Rival Courtyard', area: '03 / NEON CLUB', title: 'Edna takes the floor', story: 'The crew reaches the party. Edna calls everyone onto the dance floor.', type: 'rhythm', prompt: 'Tap the pad when the circle pulses. Land three clean taps to pass.', time: 12},
  {id: 'rival', setting: 'district', destination: 'Lagoon Bridge', area: '04 / RIVAL COURTYARD', title: 'A rival crew blocks the way', story: 'The rival crew remembers how you crossed the district. Watch their move and choose how to get past.', type: 'choice', prompt: 'The warning arrow points RIGHT. Which way do you dodge?', options: ['Left', 'Right', 'Duck'], correct: 1, time: 60},
  {id: 'chase', setting: 'district', destination: 'Star Gate', area: '05 / LAGOON BRIDGE', title: 'Pick the next road', story: 'The crew needs one shared route to the gate. Everyone votes before the car moves.', type: 'vote', prompt: 'Which route are you taking?', options: ['Bridge lights', 'Market streets', 'Waterfront'], consequences: ['Open and visible.', 'Busy but full of cover.', 'Quiet, with a longer final turn.'], time: 60},
  {id: 'checkpoint', setting: 'gate', destination: 'Launch Pad', area: '06 / STAR GATE', title: 'Restore the launch route', story: 'The crew powers the scanner and matches the route symbols before boarding.', type: 'choice', prompt: 'The screen reads ★ ◆ ●. Which option restores the route?', options: ['★ ◆ ●', '◆ ★ ●', '★ ● ◆'], correct: 0, time: 60},
  {id: 'launch', setting: 'gate', destination: 'London', area: '07 / LAUNCH PAD', title: 'Get everyone aboard', story: 'Preparation is frozen. The final check needs positive Mission and enough timely confirmations.', type: 'launch', prompt: 'Press LAUNCH before the minute runs out.', time: 60}
];

function code() {
  let value;
  do { value = Array.from(crypto.randomBytes(5), n => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 32]).join(''); } while (rooms.has(value));
  return value;
}
function send(res, data, status = 200) {
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
  res.end(JSON.stringify(data));
}
function newPlayer(name, character) {
  return {id: crypto.randomUUID(), token: crypto.randomUUID(), name, character, points: 0, fame: 0, connections: 0, answered: false, answer: null, hits: new Set(), collected: new Set(), position: {x: 42, y: 74, facing: 'se', animation: 'idle'}, answeredAt: 0, lastMove: 0};
}
function player(room, token) { return room?.players.find(p => p.token === token); }
function eligiblePlayers(room) { return [...(room.eligibleIds || [])].map(id => room.players.find(p => p.id === id)).filter(Boolean); }
function clueFor(room, p) {
  if (scenes[room.index]?.type !== 'intel') return null;
  const eligible = eligiblePlayers(room);
  if (eligible.length <= 1) return 'Full route: 🚌 then 💧 then 🌙.';
  const role = Math.max(0, eligible.findIndex(x => x.id === p.id)) % 2;
  return role === 0 ? 'Route start: the bus is first.' : 'Route finish: water, then the moon.';
}
function publicRoom(room, token) {
  const me = player(room, token);
  const s = scenes[room.index];
  const challenge = s ? {...s} : null;
  if (challenge && room.phase !== 'review') delete challenge.correct;
  const currentDiscoveries = me && s ? [...me.collected].filter(key => key.startsWith(`${s.id}:`)).map(key => key.split(':')[1]) : [];
  return {
    code: room.code, status: room.status, phase: room.phase, endsAt: room.endsAt, phaseDuration: room.phaseDuration, startedAt: room.startedAt,
    index: room.index, total: scenes.length, challenge, meter: room.meter, result: room.result,
    resultReason: room.resultReason, review: room.review, eligibleCount: room.eligibleIds?.size || 0,
    sharedClues: [...(room.sharedClues || [])], benefits: [...room.benefits], events: room.events.slice(-8),
    players: room.players.map(p => ({id: p.id, name: p.name, character: p.character, points: p.points, fame: p.fame, connected: p.connections > 0, answered: p.answered, hits: p.hits.size, position: p.position})),
    me: me ? {id: me.id, host: room.host === me.id, character: me.character, fame: me.fame, answered: me.answered, answer: me.answer, hits: me.hits.size, discoveries: currentDiscoveries, privateClue: clueFor(room, me)} : null
  };
}
function broadcast(room) {
  for (const [res, token] of room.listeners) {
    try { res.write(`data: ${JSON.stringify(publicRoom(room, token))}\n\n`); } catch { room.listeners.delete(res); }
  }
}
function setPhase(room, phase, ms) { room.phase = phase; room.phaseDuration = ms; room.endsAt = Date.now() + ms; broadcast(room); }
function placeCrew(room) {
  room.players.forEach((p, i) => { p.position = {x: 34 + (i % 4) * 8, y: 68 + Math.floor(i / 4) * 10, facing: 'se', animation: 'idle'}; });
}
function next(room) {
  room.index++;
  if (room.index >= scenes.length) {
    room.status = 'results'; room.phase = 'end'; room.endsAt = 0;
    room.result = room.meter > 0 && room.launchSuccess ? 'success' : 'retry';
    room.resultReason = room.meter <= 0 ? 'Mission reached zero.' : !room.launchSuccess ? 'Too few launch confirmations arrived before the deadline.' : 'Mission stayed positive and the crew confirmed launch.';
  } else {
    for (const p of room.players) { p.answered = false; p.answer = null; p.hits = new Set(); p.answeredAt = 0; }
    room.eligibleIds = new Set(room.players.filter(p => p.connections > 0).map(p => p.id));
    if (!room.eligibleIds.size && room.players[0]) room.eligibleIds.add(room.players[0].id);
    room.sharedClues = new Set();
    placeCrew(room);
    const openingFlight = room.index === 0;
    setPhase(room, openingFlight ? 'arrival' : 'story', (openingFlight ? 8500 : 18000) * speed);
  }
  broadcast(room);
}
function resolve(room) {
  if (room.phase !== 'active') return;
  const scene = scenes[room.index];
  const players = eligiblePlayers(room);
  const total = Math.max(1, players.length);
  let successful = 0;
  if (scene.type === 'vote') {
    const votes = scene.options.map(() => 0);
    for (const p of players) if (Number.isInteger(p.answer)) votes[p.answer]++;
    const winner = votes.indexOf(Math.max(...votes));
    room.voteResult = scene.options[winner];
    successful = votes[winner];
    for (const p of players) if (p.answer === winner) { p.points += 200; p.fame = Math.min(100, p.fame + 13); }
    room.events.push({stage: scene.id, text: scene.consequences?.[winner] || `The crew chose ${scene.options[winner]}.`});
  } else if (scene.type === 'rhythm') {
    for (const p of players) { if (p.hits.size >= 3) { successful++; p.fame = Math.min(100, p.fame + 13); } p.points += p.hits.size * 75; }
  } else if (scene.type === 'launch') {
    for (const p of players) if (p.answered) { successful++; p.points += 400; p.fame = Math.min(100, p.fame + 13); }
    room.launchSuccess = successful >= Math.ceil(total / 2);
  } else {
    for (const p of players) if (p.answer === scene.correct) {
      successful++; p.points += 200 + Math.max(0, Math.round(100 * (room.endsAt - p.answeredAt) / (scene.time * 1000))); p.fame = Math.min(100, p.fame + 13);
    }
  }
  const required = Math.ceil(total / 2);
  const passed = successful >= required;
  room.meter = Math.max(0, Math.min(100, room.meter + (passed ? 8 : -12)));
  room.review = {passed, successful, total, required, route: room.voteResult || null, perfect: successful === total};
  room.events.push({stage: scene.id, text: `${scene.title}: ${passed ? 'crew passed' : 'crew missed'} (${successful}/${total}).`});
  room.phase = 'review'; room.endsAt = Date.now() + 5000 * speed;
  broadcast(room);
}

setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (room.status === 'playing' && now >= room.endsAt) {
      if (room.phase === 'arrival') setPhase(room, 'story', 18000 * speed);
      else if (room.phase === 'story') setPhase(room, 'intro', 10000 * speed);
      else if (room.phase === 'intro') { room.phase = 'active'; room.startedAt = now; room.endsAt = now + scenes[room.index].time * 1000 * speed; for (const p of room.players) p.position.animation = 'idle'; broadcast(room); }
      else if (room.phase === 'active') resolve(room);
      else if (room.phase === 'review') { room.voteResult = null; next(room); }
    }
  }
}, 150);
setInterval(() => { const cutoff = Date.now() - 86400000; for (const [key, room] of rooms) if (room.created < cutoff) rooms.delete(key); }, 60000);

async function body(req) {
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 10000) throw new Error('Request too large'); }
  return JSON.parse(raw || '{}');
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local');
  if (url.pathname === '/api/events' && req.method === 'GET') {
    const room = rooms.get(url.searchParams.get('code')?.toUpperCase());
    const p = player(room, url.searchParams.get('token'));
    if (!p) return send(res, {error: 'Room or player not found'}, 404);
    res.writeHead(200, {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no'});
    p.connections++; room.listeners.set(res, p.token);
    res.write(`data: ${JSON.stringify(publicRoom(room, p.token))}\n\n`); broadcast(room);
    const beat = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 15000);
    req.on('close', () => { clearInterval(beat); room.listeners.delete(res); p.connections = Math.max(0, p.connections - 1); broadcast(room); });
    return;
  }
  if (url.pathname.startsWith('/api/') && req.method === 'POST') {
    try {
      const data = await body(req);
      if (url.pathname === '/api/create') {
        const room = {code: code(), players: [], listeners: new Map(), status: 'lobby', phase: 'lobby', index: -1, meter: 60, endsAt: 0, result: null, created: Date.now(), benefits: new Set(), events: []};
        const p = newPlayer(String(data.name || 'Player').trim().slice(0, 24), 'Bluezi');
        room.players.push(p); room.host = p.id; rooms.set(room.code, room);
        return send(res, {code: room.code, token: p.token});
      }
      const room = rooms.get(String(data.code || '').toUpperCase());
      if (!room) return send(res, {error: 'Room code not found'}, 404);
      if (url.pathname === '/api/join') {
        if (room.status !== 'lobby') return send(res, {error: 'This match has already started'}, 409);
        if (room.players.length >= 8) return send(res, {error: 'This room is full'}, 409);
        const available = roster.find(c => !room.players.some(p => p.character === c));
        const p = newPlayer(String(data.name || 'Player').trim().slice(0, 24), available);
        room.players.push(p); broadcast(room); return send(res, {code: room.code, token: p.token});
      }
      const p = player(room, data.token);
      if (!p) return send(res, {error: 'Player session expired'}, 403);
      if (url.pathname === '/api/role') {
        if (room.status !== 'lobby') return send(res, {error: 'Character selection is closed'}, 409);
        if (p.id === room.host || data.character === 'Bluezi') return send(res, {error: 'Bluezi is the host character'}, 409);
        if (!roster.includes(data.character) || room.players.some(other => other !== p && other.character === data.character)) return send(res, {error: 'Character already taken'}, 409);
        p.character = data.character; broadcast(room); return send(res, {ok: true});
      }
      if (url.pathname === '/api/start' || url.pathname === '/api/restart') {
        if (p.id !== room.host) return send(res, {error: 'Only the host can do that'}, 403);
        if (url.pathname === '/api/start' && (room.status !== 'lobby' || room.players.filter(x => x.connections > 0).length < (data.solo === true ? 1 : 2))) return send(res, {error: data.solo === true ? 'Reconnect before starting' : 'Wait for at least two connected players'}, 409);
        if (url.pathname === '/api/restart' && room.status !== 'results') return send(res, {error: 'Finish this match first'}, 409);
        Object.assign(room, {status: 'playing', index: -1, meter: 60, result: null, resultReason: null, review: null, launchSuccess: false, benefits: new Set(), events: []});
        for (const x of room.players) { x.points = 0; x.fame = 0; x.collected = new Set(); }
        next(room); return send(res, {ok: true});
      }
      if (url.pathname === '/api/move') {
        if (room.status !== 'playing' || !['intro', 'review'].includes(room.phase)) return send(res, {error: 'Movement is unavailable during this moment'}, 409);
        if (Number(data.index) !== room.index) return send(res, {error: 'Scene changed'}, 409);
        const x = Math.max(8, Math.min(92, Number(data.x))); const y = Math.max(36, Math.min(88, Number(data.y)));
        if (!Number.isFinite(x) || !Number.isFinite(y)) return send(res, {error: 'Invalid destination'}, 400);
        const setting = scenes[room.index]?.setting || 'district';
        if (collisionZones[setting]?.some(([left,right,top,bottom]) => x >= left && x <= right && y >= top && y <= bottom)) return send(res, {error: 'That route is blocked'}, 409);
        const dx = x - p.position.x, dy = y - p.position.y;
        p.position = {x, y, facing: Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'sw' : 'ne') : (dy < 0 ? 'nw' : 'se'), animation: 'walk'};
        p.lastMove = Date.now(); broadcast(room); return send(res, {ok: true});
      }
      if (url.pathname === '/api/share') {
        if (room.status !== 'playing' || scenes[room.index]?.type !== 'intel') return send(res, {error: 'There is no clue to share here'}, 409);
        const clue = clueFor(room, p); if (clue) room.sharedClues.add(clue);
        broadcast(room); return send(res, {ok: true});
      }
      if (url.pathname === '/api/answer') {
        if (room.status !== 'playing' || room.phase !== 'active' || Date.now() > room.endsAt) return send(res, {error: 'This challenge has closed'}, 409);
        if (!room.eligibleIds.has(p.id)) return send(res, {error: 'You joined after this round began'}, 409);
        const scene = scenes[room.index];
        if (scene.type === 'rhythm') {
          const beatIndex = Math.round((Date.now() - room.startedAt) / (750 * speed));
          const offset = Math.abs(Date.now() - room.startedAt - beatIndex * 750 * speed);
          if (beatIndex >= 1 && beatIndex <= 14 && offset <= 260 * speed && !p.hits.has(beatIndex)) p.hits.add(beatIndex);
          broadcast(room); return send(res, {ok: true, hits: p.hits.size});
        }
        if (p.answered) return send(res, {error: 'Answer already locked in'}, 409);
        if (scene.type === 'launch') { p.answered = true; p.answeredAt = Date.now(); }
        else if (Number.isInteger(data.answer) && data.answer >= 0 && data.answer < scene.options.length) { p.answer = data.answer; p.answered = true; p.answeredAt = Date.now(); }
        else return send(res, {error: 'Choose an answer'}, 400);
        if (eligiblePlayers(room).every(x => x.answered)) resolve(room); else broadcast(room);
        return send(res, {ok: true});
      }
      if (url.pathname === '/api/discover') {
        const scene = scenes[room.index]; const key = String(data.key || ''); const spot = discoveries[scene?.id]?.[key]; const discoveryId = `${scene?.id}:${key}`;
        if (room.status !== 'playing' || !['intro', 'review'].includes(room.phase) || !spot) return send(res, {error: 'Explore between live challenges'}, 409);
        if (p.collected.has(discoveryId)) return send(res, {ok: true, already: true});
        if (Math.hypot(p.position.x - spot[0], p.position.y - spot[1]) > 16) return send(res, {error: 'Move closer to inspect that'}, 409);
        p.collected.add(discoveryId); p.points += 30; p.fame = Math.min(100, p.fame + 2);
        let benefit = null;
        if (scene.id === 'dance' && key === 'stall' && !room.benefits.has('power-cell')) {
          room.benefits.add('power-cell'); benefit = 'Power cell secured for the Star Gate.'; room.events.push({stage: scene.id, text: benefit});
        }
        broadcast(room); return send(res, {ok: true, points: 30, benefit});
      }
      return send(res, {error: 'Unknown action'}, 404);
    } catch (error) { console.error(error); return send(res, {error: 'Invalid request'}, 400); }
  }
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  let decoded; try { decoded = decodeURIComponent(requested); } catch { return send(res, {error: 'Invalid path'}, 400); }
  const file = path.resolve(root, '.' + decoded);
  if (!file.startsWith(root + path.sep)) return send(res, {error: 'Not found'}, 404);
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return send(res, {error: 'Not found'}, 404);
    const ext = path.extname(file); const mime = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.mp3': 'audio/mpeg', '.json': 'application/json'}[ext] || 'application/octet-stream';
    res.writeHead(200, {'Content-Type': mime, 'Content-Length': stat.size}); fs.createReadStream(file).pipe(res);
  });
});
const port = Number(process.env.PORT || 4173);
server.listen(port, '0.0.0.0', () => console.log(`Stars Align local address: http://localhost:${port}`));
