/* Mumbai Rounds: Budget tab: cycle summary, pace chart, logged trips. */
'use strict';
/* ============================== Budget tab ============================== */
function budgetChart(mi){
  const W = 640, H = 210, L = 48, Rr = 14, T = 14, B = 28;
  const byDay = new Array(mi.days + 1).fill(0); for (const t of mi.trips) byDay[mi.dates.indexOf(t.date) + 1] += Number(t.cost) || 0;
  const cum = []; let c = 0; const lastDay = mi.cur ? mi.tday : mi.days; for (let d = 1; d <= mi.days; d++){ c += byDay[d]; cum[d] = c; }
  let wdc = 0; const ideal = []; for (let d = 1; d <= mi.days; d++){ if (mi.isWork(d)) wdc++; ideal[d] = mi.budget * wdc / Math.max(1, mi.total); }
  const ymax = Math.max(mi.budget, c, mi.projected) * 1.08; const step = ymax > 16000 ? 5000 : 2500;
  const x = d => L + (d - 1) / (mi.days - 1) * (W - L - Rr); const y = v => T + (1 - v / ymax) * (H - T - B);
  let g = '';
  for (let v = 0; v <= ymax; v += step) g += `<line x1="${L}" x2="${W-Rr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line-2)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="var(--ink-3)" font-family="IBM Plex Mono,monospace">${v >= 1000 ? (v/1000) + 'k' : v}</text>`;
  for (const d of [1, 8, 15, 22, mi.days]) g += `<text x="${x(d)}" y="${H-8}" text-anchor="${d === 1 ? 'start' : d === mi.days ? 'end' : 'middle'}" font-size="11" fill="var(--ink-3)" font-family="IBM Plex Mono,monospace">${shortDate(mi.dates[d-1])}</text>`;
  const idealPts = ideal.slice(1).map((v,i) => `${x(i+1).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  g += `<polyline points="${idealPts}" fill="none" stroke="var(--ink-3)" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  g += `<line x1="${L}" x2="${W-Rr}" y1="${y(mi.budget)}" y2="${y(mi.budget)}" stroke="var(--warn)" stroke-width="1"/><text x="${W-Rr}" y="${y(mi.budget)-5}" text-anchor="end" font-size="11" fill="var(--warn)" font-weight="600">Budget ${rs(mi.budget)}</text>`;
  if (lastDay >= 1){
    const pts = []; for (let d = 1; d <= lastDay; d++) pts.push(`${x(d).toFixed(1)},${y(cum[d]).toFixed(1)}`);
    g += `<polygon points="${x(1)},${y(0)} ${pts.join(' ')} ${x(lastDay)},${y(0)}" fill="var(--accent)" opacity=".12"/>`;
    g += `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>`;
    g += `<circle cx="${x(lastDay)}" cy="${y(cum[lastDay])}" r="4.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`;
    const lx = x(lastDay), anchor = lx > W - 120 ? 'end' : 'start', dx = anchor === 'end' ? -8 : 8;
    g += `<text x="${lx+dx}" y="${y(cum[lastDay])-8}" text-anchor="${anchor}" font-size="12" font-weight="700" fill="var(--ink)" font-family="IBM Plex Mono,monospace">${rs(cum[lastDay])}</text>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Cumulative spend this budget cycle against budget pace">${g}</svg>`;
}
function renderBudget(){
  const mi = monthInfo(viewCycleStart());
  const parts = {}; for (const t of mi.trips){ const p = t.parts && Object.keys(t.parts).length ? t.parts : {[t.mode === 'transit' ? 'train' : (MODE_NAME[t.mode] ? t.mode : 'other')]: Number(t.cost) || 0}; for (const [k,v] of Object.entries(p)) parts[k] = (parts[k] || 0) + v; }
  const ptot = Object.values(parts).reduce((a,b) => a+b, 0);
  const order = ['auto','taxi','cab','bus','train','metro','other'].filter(k => parts[k] > 0);
  const byDate = {}; for (const t of mi.trips) (byDate[t.date] = byDate[t.date] || []).push(t);
  const dates = Object.keys(byDate).sort().reverse();
  const over = mi.projected > mi.budget;
  const cabShare = ptot ? (parts.cab || 0) / ptot : 0;
  let advice = '';
  if (mi.cur && mi.trips.length && over) advice = `<div class="banner warn"><span>At this pace the cycle ends near <b>${rs(mi.projected)}</b>, about ${rs(mi.projected - mi.budget)} over. ${cabShare > 0.35 ? 'Cabs are ' + Math.round(cabShare*100) + '% of spending; switching a few cab legs to metro or train closes most of the gap.' : 'Planning visits by cluster cuts the number of long trips.'}</span></div>`;
  else if (mi.cur && mi.trips.length) advice = `<div class="banner info"><span>On track: this cycle should end near <b>${rs(mi.projected)}</b>, under the ${rs(mi.budget)} budget.</span></div>`;
  return `<div class="pagehead"><div><h2>Travel budget</h2><p>Trips you log from a plan or trip land here. Amounts are editable, so replace estimates with what you actually paid.</p></div>
    <div class="row"><button class="btn sm" data-act="cycle" data-d="-1" aria-label="Previous budget cycle">‹</button><b class="num" style="font-family:var(--f-body)">${mi.label}</b><button class="btn sm" data-act="cycle" data-d="1" aria-label="Next budget cycle" ${S.cycleOff >= 0 ? 'disabled' : ''}>›</button></div></div>
    ${syncBanner()}
  <div class="stack" style="gap:16px">
    <div class="kpis">
      <div class="kpi"><span>Spent</span><b>${rs(mi.spent)}</b><small>${mi.trips.length} trip${mi.trips.length===1?'':'s'} logged</small></div>
      <div class="kpi"><span>Left</span><b style="color:${mi.left < 0 ? 'var(--bad)' : 'inherit'}">${rs(mi.left)}</b><small>of ${rs(mi.budget)}</small></div>
      <div class="kpi"><span>Per workday</span><b>${mi.cur || !mi.past ? rs(Math.max(0, mi.perDay)) : '–'}</b><small>${mi.cur ? mi.remaining + ' workday' + (mi.remaining===1?'':'s') + ' left, incl. today' : (mi.past ? 'cycle closed' : 'upcoming')}</small></div>
      <div class="kpi"><span>Cycle-end pace</span><b style="color:${over ? 'var(--warn)' : 'inherit'}">${mi.cur && mi.elapsed ? rs(mi.projected) : '–'}</b><small>if you keep spending like this</small></div>
    </div>
    ${advice}
    <div class="card pad"><div class="sectionhead"><h2 style="font-size:18px">Spend so far vs. budget pace</h2><span class="small faint">Solid: what you've logged · Dashed: even spending across workdays</span></div><div class="chartwrap">${budgetChart(mi)}</div></div>
    ${ptot ? `<div class="card pad"><div class="sectionhead"><h2 style="font-size:18px">Where it went</h2></div>
      <div class="stack-bar">${order.map(k => `<i style="width:${(parts[k]/ptot*100).toFixed(2)}%;background:${MODE_COLOR[k]}" title="${MODE_NAME[k]} ${rs(parts[k])}"></i>`).join('')}</div>
      <div class="legend">${order.map(k => `<span><i style="background:${MODE_COLOR[k]}"></i>${MODE_NAME[k]} <b class="num">${rs(parts[k])}</b></span>`).join('')}</div></div>` : ''}
    <div class="card pad"><div class="sectionhead"><h2 style="font-size:18px">Logged trips</h2><button class="btn sm" data-act="add-exp">+ Add expense</button></div>
      ${dates.length ? `<div class="trips">${dates.map(dt => `<div class="tday"><div class="tday-h"><span>${prettyDate(dt)}</span><span class="num">${rs(byDate[dt].reduce((a,t)=>a+(Number(t.cost)||0),0))}</span></div>
        ${byDate[dt].map(t => { const m = MODE_NAME[t.mode] ? t.mode : (t.mode === 'transit' ? 'train' : 'other'); return `<div class="trip"><span class="mode" style="background:${MODE_COLOR[m]}${m==='auto'?';color:#1C1A10':''}">${esc(t.mode === 'transit' ? 'Train/Metro' : (MODE_NAME[m]||'Other'))}</span>
          <span class="what">${t.t ? `<span class="mono faint">${clock(toMin(t.t))}</span> ` : ''}${esc(t.from ? t.from + ' → ' + t.to : (t.note || t.label || ''))}${t.from && t.label ? ` <span class="faint">· ${esc(t.label)}</span>` : ''}</span>
          <input class="in" type="number" min="0" step="1" inputmode="numeric" id="amt-${esc(t.id)}" data-ch="trip-amt" data-date="${dt}" data-id="${esc(t.id)}" value="${Math.round(Number(t.cost)||0)}" aria-label="Amount paid">
          <button class="btn sm ghost" data-act="trip-rm" data-date="${dt}" data-id="${esc(t.id)}" aria-label="Delete trip">✕</button></div>`; }).join('')}</div>`).join('')}</div>`
      : `<div class="empty">Nothing logged for ${mi.label} yet. Use <b>I took this</b> on a trip option, <b>Log trips</b> on a day plan, or add an expense by hand.</div>`}
    </div></div>`;
}
