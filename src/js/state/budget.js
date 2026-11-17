/* Mumbai Rounds: Budget-cycle maths (25th to 24th by default) and trip logging. */
'use strict';
/* ============================== budget math (cycle runs from the 25th to the 24th) ============================== */
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoDate(d); };
const cycleDayIn = (y, m) => Math.min(Math.max(1, Number(S.prefs.cycleDay) || 25), new Date(y, m + 1, 0).getDate());
function cycleStartFor(iso){ const d = new Date(iso + 'T12:00:00'); let y = d.getFullYear(), m = d.getMonth(); if (d.getDate() < cycleDayIn(y, m)){ m--; if (m < 0){ m = 11; y--; } } return y + '-' + pad2(m + 1) + '-' + pad2(cycleDayIn(y, m)); }
function nextCycleStart(start){ const d = new Date(start + 'T12:00:00'); let y = d.getFullYear(), m = d.getMonth() + 1; if (m > 11){ m = 0; y++; } return y + '-' + pad2(m + 1) + '-' + pad2(cycleDayIn(y, m)); }
function viewCycleStart(){ let s = cycleStartFor(todayISO()); for (let i = 0; i > S.cycleOff; i--) s = cycleStartFor(addDays(s, -1)); for (let i = 0; i < S.cycleOff; i++) s = nextCycleStart(s); return s; }
const shortDate = iso => { const d = new Date(iso + 'T12:00:00'); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };
const cycleLabel = start => { const end = addDays(nextCycleStart(start), -1); return shortDate(start) + ' – ' + shortDate(end) + ' ' + end.slice(0,4); };
function monthInfo(start){
  const endX = nextCycleStart(start); const dates = []; for (let d = start; d < endX; d = addDays(d, 1)) dates.push(d);
  const days = dates.length; const wd = S.prefs.workdays;
  const isWork = i => { const w = new Date(dates[i-1] + 'T12:00:00').getDay(); return w !== 0 && (wd === 6 || w !== 6); };
  const today = todayISO(); const cur = today >= start && today < endX; const past = today >= endX;
  const tday = cur ? dates.indexOf(today) + 1 : (past ? days : 0);
  let total = 0, elapsed = 0, remaining = 0;
  for (let d = 1; d <= days; d++){ if (!isWork(d)) continue; total++; if (d <= tday) elapsed++; if (d >= tday && cur) remaining++; if (!cur && !past) remaining++; }
  const trips = []; for (const [date, doc] of Object.entries(S.days)) if (date >= start && date < endX) for (const tr of (doc.trips || [])) trips.push({...tr, date});
  const spent = trips.reduce((a,t) => a + (Number(t.cost) || 0), 0);
  const budget = Number(S.prefs.budget) || 10000; const left = budget - spent;
  const perDay = remaining > 0 ? left / remaining : 0;
  const projected = elapsed > 0 && cur ? spent / elapsed * total : spent;
  return {start, endX, dates, days, isWork, tday, cur, past, total, elapsed, remaining, trips, spent, budget, left, perDay, projected, label:cycleLabel(start)};
}
function allowanceStrip(){
  const mi = monthInfo(cycleStartFor(todayISO()));
  const pct = Math.min(100, mi.spent / mi.budget * 100);
  const over = mi.spent > mi.budget;
  return `<div class="card allow"><span><b class="num">${rs(mi.spent)}</b> <span class="faint">of ${rs(mi.budget)} · ${mi.label}</span></span>
    <span class="meter" aria-hidden="true"><i class="${over?'over':''}" style="width:${pct.toFixed(1)}%"></i></span>
    <span>${over ? '<span class="pill bad">Over budget</span>' : `≈ <b class="num">${rs(Math.max(0, mi.perDay))}</b> <span class="faint">per workday left</span>`}</span></div>`;
}

/* ============================== trip logging ============================== */
let lastUndo = null;
function logTrips(date, list, msg){
  const d = S.days[date] || {month:date.slice(0,7), trips:[]};
  const before = JSON.parse(JSON.stringify(d.trips || []));
  d.trips = [...(d.trips || []), ...list]; S.days[date] = d; saveDay(date); render();
  lastUndo = () => { S.days[date].trips = before; saveDay(date); render(); };
  toast(msg, true);
}
function tripFromOption(o, d, op, t){
  return {id:uid(), t:toHM(t), from:o.name, to:d.name, mode:op.kind, label:op.title, cost:Math.round(op.cost), parts:op.parts || {}};
}
