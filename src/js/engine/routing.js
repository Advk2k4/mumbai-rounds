/* Mumbai Rounds: Builds and scores travel options: walk, auto, taxi, cab, bus and multi-leg transit. */
'use strict';
/* ============================== option engine ============================== */
function accessLeg(p, n, t, dow, P){
  const walkKm = hav(p, n) * 1.25;
  if (walkKm <= P.maxWalk) return {mode:'walk', min: walkKm / 4.5 * 60, cost:0, km:walkKm};
  const rk = hav(p, n) * 1.3; const island = isIsland(p) || isIsland(n);
  const min = 3 + rk / roadSpeed(rk, t, dow) * 60;
  return {mode: island ? 'taxi' : 'auto', min, cost: island ? taxiFare(rk) : autoFare(rk), km: rk};
}
function boardPen(line, peak, P){ const L = LINES[line]; if (!peak) return 0; if (L.kind === 'rail') return P.avoidCrowds ? 15 : 3; if (line === 'M1') return P.avoidCrowds ? 5 : 1; return 0; }
function walkPen(min){ return min > 12 ? (min - 12) * 0.6 : 0; }
function nearNodes(p, allow){
  const arr = []; for (const n of NODES){ if (!allow(n.line)) continue; arr.push([hav(p, n), n]); }
  arr.sort((a,b) => a[0] - b[0]);
  const within = arr.filter(x => x[0] <= 3.0);
  return (within.length >= 3 ? within : arr.slice(0, Math.max(4, within.length))).filter(x => x[0] <= 6).map(x => x[1]);
}
function runTransit(o, d, t, dow, P, allow, lam){
  const peak = isPeak(t, dow);
  const N = NODES.length; const dist = new Float64Array(N).fill(Infinity); const prev = new Array(N).fill(null); const done = new Uint8Array(N);
  for (const n of nearNodes(o, allow)){
    const acc = accessLeg(o, n, t, dow, P);
    const w = acc.min + LINES[n.line].wait + lam * acc.cost + boardPen(n.line, peak, P) + walkPen(acc.mode === 'walk' ? acc.min : 0) + (acc.mode !== 'walk' ? 2 : 0) + (LINES[n.line].kind === 'metro' ? lam * 10 : 0);
    if (w < dist[n.id]){ dist[n.id] = w; prev[n.id] = {from:-1, e:{kind:'access', acc, to:n.id}}; }
  }
  const tgt = new Map();
  for (const n of nearNodes(d, allow)){
    const eg = accessLeg(d, n, t, dow, P);
    tgt.set(n.id, {eg, w: eg.min + lam * eg.cost + walkPen(eg.mode === 'walk' ? eg.min : 0) + (eg.mode !== 'walk' ? 2 : 0)});
  }
  let best = Infinity, bestNode = -1;
  for (;;){
    let u = -1, m = Infinity;
    for (let i = 0; i < N; i++) if (!done[i] && dist[i] < m){ m = dist[i]; u = i; }
    if (u < 0 || m >= best) break;
    done[u] = 1;
    const te = tgt.get(u);
    if (te && prev[u].e.kind !== 'access'){ const tot = m + te.w; if (tot < best){ best = tot; bestNode = u; } }
    for (const e of ADJ[u]){
      const to = NODES[e.to]; if (!allow(to.line)) continue;
      let w = e.min;
      if (e.kind === 'ride') w += lam * (LINES[to.line].kind === 'metro' ? 1.2 : 0.25) * e.km;
      else w += 3 + boardPen(to.line, peak, P) + (LINES[to.line].kind === 'metro' && LINES[NODES[u].line].op !== LINES[to.line].op ? lam * 10 : 0);
      if (m + w < dist[e.to]){ dist[e.to] = m + w; prev[e.to] = {from:u, e}; }
    }
  }
  if (bestNode < 0) return null;
  const chain = []; let v = bestNode;
  while (v !== -1){ const p = prev[v]; chain.unshift({node:v, e:p.e, from:p.from}); v = p.from; }
  return {chain, egress: tgt.get(bestNode).eg, peak};
}
function transitOption(o, d, res, P){
  const {chain, egress, peak} = res; const segs = [];
  const first = chain[0];
  segs.push({t:first.e.acc.mode, min:first.e.acc.min, cost:first.e.acc.cost, km:first.e.acc.km, fromL:o.name, toL:nodeLabel(NODES[first.node])});
  let ride = null;
  for (let i = 1; i < chain.length; i++){
    const {node, e, from} = chain[i];
    if (e.kind === 'ride'){
      if (!ride){ const L = LINES[NODES[from].line]; ride = {t:'ride', line:NODES[from].line, fromN:from, toN:node, km:0, min:L.wait, wait:L.wait, stops:0}; }
      ride.toN = node; ride.km += e.km; ride.min += e.min; ride.stops++;
    } else {
      if (ride){ segs.push(ride); ride = null; }
      segs.push({t:'xfer', min:e.walk, fromN:from, toN:node});
    }
  }
  if (ride) segs.push(ride);
  const lastNode = NODES[chain[chain.length-1].node];
  segs.push({t:egress.mode, min:egress.min, cost:egress.cost, km:egress.km, fromL:nodeLabel(lastNode), toL:d.name, egress:true});
  // waits for rides after a transfer are already inside ride.min; drop the xfer's wait double count
  // fares
  const parts = {}; const add = (k, v) => { parts[k] = (parts[k] || 0) + v; };
  let railKm = 0, railFirst = null, mOp = null, mKm = 0, mFirst = null;
  const flushRail = () => { if (railKm > 0){ const f = trainFare(railKm, P.trainClass); railFirst.fare = f; add('train', f); } railKm = 0; railFirst = null; };
  const flushMetro = () => { if (mOp){ const f = metroFare(mOp, mKm); mFirst.fare = f; add('metro', f); } mOp = null; mKm = 0; mFirst = null; };
  for (const s of segs){
    if (s.t === 'ride'){
      const L = LINES[s.line];
      if (L.kind === 'rail'){ flushMetro(); if (!railFirst) railFirst = s; else s.sameTicket = true; railKm += s.km; }
      else { flushRail(); if (mOp && mOp !== L.op) flushMetro(); if (!mFirst) mFirst = s; else s.sameTicket = true; mOp = L.op; mKm += s.km; }
    } else if (s.t === 'auto' || s.t === 'taxi'){ flushRail(); flushMetro(); add(s.t, s.cost); }
  }
  flushRail(); flushMetro();
  const rides = segs.filter(s => s.t === 'ride');
  if (!rides.length) return null;
  const cost = Object.values(parts).reduce((a,b) => a+b, 0);
  const min = segs.reduce((a,s) => a + s.min, 0);
  const lineLabels = [...new Set(rides.map(s => LINES[s.line].label.replace(' (Andheri–Vadala)','').replace(' (to Panvel)','')))];
  const railRide = rides.some(s => LINES[s.line].kind === 'rail');
  const crowded = peak && rides.some(s => LINES[s.line].kind === 'rail' || s.line === 'M1');
  const walkMin = segs.filter(s => s.t === 'walk' || s.t === 'xfer').reduce((a,s) => a + s.min, 0);
  const notes = [];
  if (crowded) notes.push(railRide ? 'Trains are packed at this hour' : 'Metro 1 is crowded at this hour');
  if (railRide) notes.push({second:'2nd class', first:'1st class', ac:'AC local'}[P.trainClass] + ' train fare');
  if (walkMin >= 15) notes.push('About ' + Math.round(walkMin) + ' min on foot in total');
  const transfers = rides.length - 1;
  const sig = 'transit:' + segs.map(s => s.t === 'ride' ? s.line : s.t).join('>');
  return {key:sig, kind:'transit', title:lineLabels.join(' + '), sub:'', segs, min, cost, parts, crowded, transfers, walkMin, notes, mapsMode:'transit'};
}
function roadOptions(o, d, t, dow, P){
  const out = []; const km = roadKm(o, d); const sp = roadSpeed(km, t, dow); const drive = km / sp * 60; const peak = isPeak(t, dow);
  const island = isIsland(o) || isIsland(d); const cross = isNavi(o) !== isNavi(d);
  const walkKm = hav(o, d) * 1.25;
  if (walkKm <= 2.6) out.push({key:'walk', kind:'walk', title:'Walk', sub:walkKm.toFixed(1) + ' km on foot', min: walkKm / 4.5 * 60, cost:0, parts:{}, segs:[{t:'walk', min: walkKm/4.5*60, km:walkKm, fromL:o.name, toL:d.name}], notes:[], mapsMode:'walking', walkMin: walkKm/4.5*60});
  if (!island && !cross && km <= 20){ const min = 3 + drive * 1.05, c = autoFare(km); out.push({key:'auto', kind:'auto', title:'Auto rickshaw', sub:'Meter fare · ' + km.toFixed(1) + ' km', min, cost:c, parts:{auto:c}, segs:[{t:'auto', min, cost:c, km, fromL:o.name, toL:d.name}], notes: km > 12 ? ['Long auto ride; some drivers may refuse'] : [], mapsMode:'driving'}); }
  if (island && km <= 28){ const min = 4 + drive, c = taxiFare(km); out.push({key:'taxi', kind:'taxi', title:'Kaali-peeli taxi', sub:'Meter fare · ' + km.toFixed(1) + ' km', min, cost:c, parts:{taxi:c}, segs:[{t:'taxi', min, cost:c, km, fromL:o.name, toL:d.name}], notes: isIsland(o) ? [] : ['Easier to find near stations than in the suburbs'], mapsMode:'driving'}); }
  { const min = 6 + drive; const f = cabFare(km, drive, peak); out.push({key:'cab', kind:'cab', title:'Uber / Ola cab', sub:'AC, door to door · ' + km.toFixed(1) + ' km', min, cost:f.mid, costLo:f.lo, costHi:f.hi, parts:{cab:f.mid}, segs:[{t:'cab', min, cost:f.mid, km, fromL:o.name, toL:d.name}], notes: peak ? ['Surge pricing likely at this hour'] : [], mapsMode:'driving'}); }
  if (km >= 1.5 && km <= 22){
    const nm = isNavi(o) && isNavi(d); const bmin = 9 + 8 + km / (peak ? 11 : 15) * 60; const c = busFare(km);
    out.push({key:'bus', kind:'bus', title: nm ? 'NMMT bus' : 'BEST bus', sub:'Approximate: route and timing vary', min:bmin, cost:c, parts:{bus:c}, segs:[{t:'walk', min:4, km:0.3, fromL:o.name, toL:'bus stop'}, {t:'bus', min:bmin-8, cost:c, km, fromL:'bus stop', toL:'stop near ' + d.name}, {t:'walk', min:4, km:0.3, fromL:'bus stop', toL:d.name}], notes:['Check the route number in the Chalo app'], mapsMode:'transit'});
  }
  return out;
}
const OPT_CACHE = new Map();
function options(o, d, t, dow){
  const P = S.prefs;
  const key = [o.lat,o.lng,d.lat,d.lng,Math.round(t/15),dow === 0 ? 0 : 1,P.trainClass,P.priority,P.avoidCrowds,P.maxWalk].join('|');
  if (OPT_CACHE.has(key)) return OPT_CACHE.get(key);
  const lam = LAMBDA[P.priority] || 0.25; const peak = isPeak(t, dow);
  let opts = roadOptions(o, d, t, dow, P);
  if (hav(o, d) > 0.9){
    const variants = [[() => true, lam], [l => LINES[l].kind === 'rail', lam], [l => LINES[l].kind === 'metro', lam], [() => true, 0.9]];
    const seen = new Set();
    for (const [allow, l] of variants){
      const r = runTransit(o, d, t, dow, P, allow, l); if (!r) continue;
      const op = transitOption(o, d, r, P); if (!op || seen.has(op.key)) continue;
      seen.add(op.key); opts.push(op);
    }
  }
  // score
  for (const op of opts){
    let sc = op.min + lam * op.cost + walkPen(op.walkMin || 0) + (op.transfers || 0) * 3;
    if (op.kind === 'transit' && op.crowded && P.avoidCrowds) sc += 12;
    if (op.kind === 'bus') sc += 6;
    if (op.kind === 'walk' && op.min > 25) sc += (op.min - 25);
    op.score = sc; op.peak = peak;
  }
  // drop transit/bus options that another non-cab option beats on both time and money
  opts = opts.filter(a => !(a.kind === 'transit' || a.kind === 'bus') || !opts.some(b => b !== a && b.kind !== 'cab' && b.min <= a.min - 2 && b.cost <= a.cost && !(b.kind === 'walk' && b.min > 35)));
  opts.sort((a,b) => a.score - b.score);
  if (opts.length){
    opts[0].tags = ['Recommended'];
    const cheapest = opts.filter(x => x.kind !== 'walk' || x.min <= 30).reduce((a,b) => (b.cost < a.cost || (b.cost === a.cost && b.min < a.min)) ? b : a);
    const fastest = opts.reduce((a,b) => b.min < a.min ? b : a);
    for (const op of opts){ op.tags = op.tags || []; if (op === cheapest && !op.tags.includes('Cheapest')) op.tags.push('Cheapest'); if (op === fastest) op.tags.push('Fastest'); }
  }
  OPT_CACHE.set(key, opts); if (OPT_CACHE.size > 400) OPT_CACHE.delete(OPT_CACHE.keys().next().value);
  return opts;
}
function mapsUrl(o, d, mode){
  const q = p => p.q ? encodeURIComponent(p.q + (/(mumbai|thane)/i.test(p.q) ? '' : ', Mumbai')) : (p.lat + ',' + p.lng);
  return 'https://www.google.com/maps/dir/?api=1&origin=' + (o.id === 'home' ? o.lat + ',' + o.lng : q(o)) + '&destination=' + (d.id === 'home' ? d.lat + ',' + d.lng : q(d)) + '&travelmode=' + mode;
}
