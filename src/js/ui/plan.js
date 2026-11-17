/* Mumbai Rounds: Day plan tab: multi-stop days with meeting times. */
'use strict';
/* ============================== Day plan tab ============================== */
function examplePlan(date){ return {date, start:'09:30', ret:true, stops:[{id:'holy-spirit', meet:'10:00', visit:null},{id:'seven-hills', meet:'', visit:null},{id:'hiranandani', meet:'12:15', visit:null}], choice:{}}; }
function loadPlanFrom(data){
  if (!S.plan) return;
  if (data && data.stops){ S.plan = {date:S.plan.date, start:data.start || '09:30', ret:data.ret !== false, stops:(data.stops || []).map(s => ({id:s.id, meet:s.meet || '', visit:s.visit || null})), choice:data.choice || {}}; S.planExample = false; }
}
function setPlanDate(date){
  S.plan = examplePlan(date); S.planExample = true;
  if (!DB.db){ const o = Local.read(); if (o.plans && o.plans[date]) loadPlanFrom(o.plans[date]); else if (date !== todayISO()) { S.plan.stops = []; S.planExample = false; } }
  else { if (date !== todayISO()){ S.plan.stops = []; S.planExample = false; } DB.subPlan(); }
}
function computePlan(){
  const P = S.plan; const home = homePlace(); const dow = new Date(P.date + 'T12:00:00').getDay();
  let cur = home, t = toMin(P.start) ?? 570; const legs = [], stops = [];
  const legFor = (from, to, i) => {
    const opts = options(from, to, t, dow); if (!opts.length) return null;
    const chosen = opts.find(x => x.key === P.choice[i]) || opts[0];
    return {i, from, to, opts, chosen, dep:t, arr:t + chosen.min};
  };
  P.stops.forEach((st, idx) => {
    const a = acct(st.id);
    if (!a || a.lat == null){ stops.push({idx, st, a, missing:true}); return; }
    const leg = legFor(cur, a, idx); legs.push(leg);
    const arr = t + leg.chosen.min; const meet = toMin(st.meet);
    let status = null; if (meet != null) status = arr <= meet - 5 ? 'ok' : (arr <= meet ? 'tight' : 'late');
    const begin = meet != null ? Math.max(arr, meet) : arr; const visit = Number(st.visit) || S.prefs.visit;
    t = begin + visit;
    stops.push({idx, st, a, leg, arr, meet, status, begin, end:t, visit});
    cur = a;
  });
  let back = null;
  if (P.ret && cur.id !== 'home'){ back = legFor(cur, home, 'ret'); if (back) { legs.push(back); t = back.arr; } }
  const cost = legs.reduce((a,l) => a + l.chosen.cost, 0); const travel = legs.reduce((a,l) => a + l.chosen.min, 0);
  return {legs, stops, back, cost, travel, endT:t, dow};
}
function legBlock(leg, idxKey){
  const open = S.ui.openLeg === String(idxKey); const c = leg.chosen;
  return `<div class="leg"><div class="rail"></div><div class="lbody">
    <div class="legline">${strip(c)}<span class="t">${fmtMin(c.min)}</span><span class="mono faint">${costText(c)}</span>
    ${c.tags && c.tags[0] === 'Recommended' ? '<span class="pill rec">Recommended</span>' : ''}${c.crowded ? '<span class="pill warn">Crowded</span>' : ''}
    <button class="btn sm ghost" data-act="leg-open" data-leg="${idxKey}" aria-expanded="${open}">${open ? 'Close' : 'Change · ' + leg.opts.length + ' options'}</button>
    <a class="btn sm ghost" href="${mapsUrl(leg.from, leg.to, c.mapsMode)}" target="_blank" rel="noopener">Maps ↗</a></div>
    ${open ? `<div class="opts" style="margin-top:10px">${leg.opts.map(op => `<div class="opt ${op.key === c.key ? 'sel' : ''}" role="button" tabindex="0" data-act="leg-pick" data-leg="${idxKey}" data-key="${esc(op.key)}">
      <div class="opt-top"><div><div class="opt-title">${esc(op.title)}</div><div class="opt-sub">${esc(op.kind === 'transit' ? (op.transfers ? op.transfers + ' change' + (op.transfers>1?'s':'') : 'No changes') : op.sub)}</div></div><div class="opt-nums"><div class="t">${fmtMin(op.min)}</div><div class="c">${costText(op)}</div></div></div>
      ${strip(op)}${tagPills(op)}${op.key === c.key ? stepList(op) : ''}</div>`).join('')}</div>` : ''}
  </div></div>`;
}
function renderPlan(){
  if (!S.plan) setPlanDate(todayISO());
  const P = S.plan; const R = computePlan(); const home = homePlace();
  const mi = monthInfo(cycleStartFor(P.date));
  const inPlan = new Set(P.stops.map(s => s.id));
  const nearby = [];
  for (const a of allAccts()){ if (a.lat == null || inPlan.has(a.id)) continue; let best = 99, near = null; for (const s of R.stops) if (s.a && s.a.lat != null){ const dd = hav(a, s.a); if (dd < best){ best = dd; near = s.a; } } if (best <= 1.6) nearby.push({a, best, near}); }
  nearby.sort((x,y) => x.best - y.best);
  const zoneOpts = ZONES.map(z => { const n = allAccts().filter(a => a.zone === z.id).length; return n ? `<option value="${z.id}">${esc(z.name)} (${n})</option>` : ''; }).join('');
  let tl = `<div class="stop home"><div class="clock">${clock(toMin(P.start) ?? 570)}</div><div class="body"><div class="stop-name">Leave home</div><div class="stop-meta">${esc(S.prefs.home.label)}</div></div></div>`;
  for (const s of R.stops){
    if (s.missing){ tl += `<div class="stop"><div class="clock">–</div><div class="body"><div class="stop-name">${esc(s.a ? s.a.name : 'Unknown account')}</div><div class="stop-meta"><span class="pill bad">No location</span> Skipped until you set where it is. <button class="btn sm" data-act="edit-loc" data-id="${esc(s.st.id)}">Set location</button> <button class="btn sm ghost" data-act="stop-rm" data-i="${s.idx}">Remove</button></div></div></div>`; continue; }
    tl += legBlock(s.leg, s.idx);
    const st = s.status === 'ok' ? `<span class="pill good">On time · ${Math.round(s.meet - s.arr)} min spare</span>` : s.status === 'tight' ? `<span class="pill warn">Tight · ${Math.round(s.meet - s.arr)} min spare</span>` : s.status === 'late' ? `<span class="pill bad">Late by ${Math.round(s.arr - s.meet)} min</span>` : '';
    const lateTip = s.status === 'late' ? (() => { const fast = s.leg.opts.reduce((a,b) => b.min < a.min ? b : a); const need = s.arr - s.meet; return fast.key !== s.leg.chosen.key && s.leg.chosen.min - fast.min >= need ? `<div class="small muted" style="margin-top:6px">${esc(fast.title)} gets you there by ${clock(s.leg.dep + fast.min)}. <button class="btn sm" data-act="leg-pick" data-leg="${s.idx}" data-key="${esc(fast.key)}">Switch</button></div>` : `<div class="small muted" style="margin-top:6px">Start earlier, or move this meeting to ${clock(s.arr + 5)}.</div>`; })() : '';
    tl += `<div class="stop"><div class="clock">${clock(s.arr)}</div><div class="body">
      <div class="row" style="justify-content:space-between;gap:8px;align-items:flex-start"><div style="min-width:0"><div class="stop-name">${esc(s.a.name)}</div>
      <div class="stop-meta"><span>${esc(s.a.area)}</span>${s.a.flag === 'g' ? '<span class="pill warn">Best-guess location</span>' : ''}${s.meet != null ? `<span>Meeting ${clock(s.meet)}</span>` : ''}<span>Leave ~${clock(s.end)}</span></div></div>${st}</div>
      ${s.meet != null ? `<div class="small faint" style="margin-top:4px">Leave the previous stop by ${clock(s.meet - s.leg.chosen.min - 5)} to be 5 min early.</div>` : ''}${lateTip}
      <div class="stopctl">
        <label class="f" for="meet-${s.idx}">Meeting time<input class="in" type="time" id="meet-${s.idx}" data-ch="stop-meet" data-i="${s.idx}" value="${esc(s.st.meet)}"></label>
        <label class="f" for="visit-${s.idx}">Time there<select class="in" id="visit-${s.idx}" data-ch="stop-visit" data-i="${s.idx}">${[20,30,45,60,90,120].map(v => `<option value="${v}" ${v === s.visit ? 'selected' : ''}>${v} min</option>`).join('')}</select></label>
        <div class="row" style="gap:4px;margin-left:auto"><button class="btn sm ghost" data-act="stop-up" data-i="${s.idx}" aria-label="Move up" ${s.idx === 0 ? 'disabled' : ''}>↑</button><button class="btn sm ghost" data-act="stop-down" data-i="${s.idx}" aria-label="Move down" ${s.idx === P.stops.length-1 ? 'disabled' : ''}>↓</button><button class="btn sm ghost" data-act="stop-rm" data-i="${s.idx}">Remove</button></div>
      </div></div></div>`;
  }
  if (R.back){ tl += legBlock(R.back, 'ret') + `<div class="stop home"><div class="clock">${clock(R.back.arr)}</div><div class="body"><div class="stop-name">Home</div></div></div>`; }
  const pace = mi.remaining > 0 ? mi.left / mi.remaining : 0;
  const vs = R.cost <= pace ? `<span class="pill good">Within daily allowance</span>` : `<span class="pill warn">${rs(R.cost - Math.max(0,pace))} over today's allowance</span>`;
  const side = `<div class="card pad formgrid side">
    <div class="two"><label class="f" for="plan-date">Date<input class="in" type="date" id="plan-date" data-ch="plan-date" value="${esc(P.date)}"></label>
    <label class="f" for="plan-start">Leave home at<input class="in" type="time" id="plan-start" data-ch="plan-start" value="${esc(P.start)}"></label></div>
    <label class="row small" style="gap:8px;font-weight:600"><input type="checkbox" id="plan-ret" data-ch="plan-ret" ${P.ret ? 'checked' : ''}> Include the trip back home</label>
    <label class="f" for="plan-add">Add an account<input class="in" id="plan-add" list="acct-list" data-ch="plan-add" placeholder="Type a hospital name" autocomplete="off"></label>
    <label class="f" for="plan-zone">Or add a whole cluster<select class="in" id="plan-zone" data-ch="plan-zone"><option value="">Choose an area…</option>${zoneOpts}</select></label>
    <div class="row"><button class="btn" data-act="plan-order" ${P.stops.length < 2 ? 'disabled' : ''}>Best visit order</button><button class="btn ghost" data-act="plan-clear" ${!P.stops.length ? 'disabled' : ''}>Clear</button></div>
    <p class="small faint" style="margin:0">Stops with a meeting time stay in time order. <b>Best visit order</b> fits the others in where they add the least travel.</p>
    ${nearby.length ? `<div class="details" style="margin-top:0"><div class="eyebrow" style="margin-bottom:6px">Also close by</div>${nearby.slice(0,6).map(x => `<div class="row" style="justify-content:space-between;padding:4px 0;flex-wrap:nowrap"><span class="small" style="min-width:0"><b>${esc(x.a.name)}</b><br><span class="faint">${x.best.toFixed(1)} km from ${esc(x.near.name)}</span></span><button class="btn sm" data-act="plan-add-id" data-id="${esc(x.a.id)}">Add</button></div>`).join('')}</div>` : ''}
  </div>`;
  const body = P.stops.length ? `<div class="stack" style="gap:14px">
      <div class="totals"><div><span>Travel</span><b>${fmtMin(R.travel)}</b></div><div><span>Est. cost</span><b>${rs(R.cost)}</b></div><div><span>Done by</span><b>${clock(R.endT)}</b></div></div>
      <div class="row">${vs}<span class="small faint">Daily allowance ≈ ${rs(Math.max(0,pace))} (${rs(mi.left)} left over ${mi.remaining} workday${mi.remaining===1?'':'s'})</span></div>
      <div class="timeline">${tl}</div>
      <div class="card pad row" style="justify-content:space-between"><span class="small muted">Travelled this plan? Log every leg to the budget in one tap. You can edit amounts later.</span><button class="btn primary" data-act="plan-log">Log ${R.legs.length} trip${R.legs.length===1?'':'s'} · ${rs(R.cost)}</button></div>
    </div>` : `<div class="card empty">No visits planned for ${prettyDate(P.date)}. Add accounts on the left, or pick a cluster from the <b>Accounts</b> tab.</div>`;
  return `<div class="pagehead"><div><h2>Day plan · ${prettyDate(P.date)}</h2><p>Line up the day's visits. Each leg picks the recommended way to travel, and you can change any of them.</p></div></div>
  <div class="stack" style="gap:16px">${S.planExample ? `<div class="banner info"><span><b>Example plan.</b> These three Andheri East and Powai stops show how it works. Add your real visits, or clear it.</span></div>` : ''}
  <div class="split">${side}<div>${body}</div></div></div>${acctDatalist()}`;
}
function autoOrder(){
  const P = S.plan; const home = homePlace();
  const withLoc = P.stops.filter(s => { const a = acct(s.id); return a && a.lat != null; });
  const missing = P.stops.filter(s => !withLoc.includes(s));
  const timed = withLoc.filter(s => toMin(s.meet) != null).sort((a,b) => toMin(a.meet) - toMin(b.meet));
  const free = withLoc.filter(s => toMin(s.meet) == null).sort((a,b) => hav(home, acct(b.id)) - hav(home, acct(a.id)));
  let seq = [...timed];
  const pt = s => acct(s.id);
  for (const f of free){
    let bestI = 0, bestC = Infinity;
    for (let i = 0; i <= seq.length; i++){
      const prev = i === 0 ? home : pt(seq[i-1]); const next = i === seq.length ? (P.ret ? home : null) : pt(seq[i]);
      const c = hav(prev, pt(f)) + (next ? hav(pt(f), next) - hav(prev, next) : 0);
      if (c < bestC){ bestC = c; bestI = i; }
    }
    seq.splice(bestI, 0, f);
  }
  P.stops = [...seq, ...missing]; P.choice = {};
}
