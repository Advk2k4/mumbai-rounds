/* Mumbai Rounds: Trip tab: compare ways to get from A to B. */
'use strict';
/* ============================== Trip tab ============================== */
function acctDatalist(){ return `<datalist id="acct-list"><option value="Home">${esc(S.prefs.home.label)}</option>${allAccts().filter(a => a.lat != null).map(a => `<option value="${esc(a.name)}">${esc(a.area)}</option>`).join('')}</datalist>`; }
function renderGo(){
  const g = S.go; const o = acct(g.from), d = acct(g.to);
  const now = new Date(); const dow = now.getDay();
  let t = g.timeMode === 'now' ? nowMin() : (toMin(g.time) ?? 600);
  let arriveBy = g.timeMode === 'arrive' ? t : null;
  let opts = [];
  const ready = o && d && o.lat != null && d.lat != null && o.id !== d.id;
  if (ready){
    if (arriveBy != null){ const est = options(o, d, arriveBy - 60, dow); const guess = est.length ? est[0].min : 45; t = arriveBy - guess - 5; }
    opts = options(o, d, t, dow);
  }
  const form = `<div class="card pad formgrid side">
    <label class="f" for="go-from">From<input class="in" id="go-from" list="acct-list" data-ch="go-from" value="${esc(o ? o.name : '')}" placeholder="Home or an account" autocomplete="off"></label>
    <button class="btn sm ghost swap" data-act="go-swap" aria-label="Swap from and to">⇅ Swap</button>
    <label class="f" for="go-to">To<input class="in" id="go-to" list="acct-list" data-ch="go-to" value="${esc(d ? d.name : '')}" placeholder="Search hospitals and clinics" autocomplete="off"></label>
    ${(g.badTo || g.badFrom) ? `<span class="hint">Pick a name from the suggestions list.</span>` : ''}
    <div class="stack" style="gap:8px"><span class="eyebrow">When</span>
      <div class="seg" role="group" aria-label="When">
        <button data-act="go-when" data-v="now" aria-pressed="${g.timeMode==='now'}">Leave now</button>
        <button data-act="go-when" data-v="leave" aria-pressed="${g.timeMode==='leave'}">Leave at</button>
        <button data-act="go-when" data-v="arrive" aria-pressed="${g.timeMode==='arrive'}">Arrive by</button>
      </div>
      ${g.timeMode !== 'now' ? `<input class="in" type="time" id="go-time" data-ch="go-time" value="${esc(g.time)}">` : ''}
    </div>
    ${d && d.flag ? `<div class="banner warn">${d.flag === 'u' ? 'This account has no location yet.' : 'Location is a best guess: ' + esc(d.note || '')} <button class="btn sm" data-act="edit-loc" data-id="${esc(d.id)}">Fix location</button></div>` : ''}
    <p class="small faint" style="margin:0">Times and fares are estimates for ${DOWS[dow]} around ${clock(t)}${isPeak(t,dow) ? ' (rush hour)' : ''}. Tap <b>Maps</b> on any option to check live traffic.</p>
  </div>`;
  let list;
  if (!ready) list = `<div class="card empty">${d && d.lat == null ? 'Set a location for this account to see options.' : 'Pick where you are starting and where you are going.'}</div>`;
  else list = `<div class="opts">${opts.map(op => {
    const open = S.go.open === op.key;
    const leaveBy = arriveBy != null ? `<span class="pill">Leave by ${clock(arriveBy - op.min - 5)}</span>` : `<span class="pill">Arrive ~${clock(t + op.min)}</span>`;
    return `<div class="opt ${open ? 'sel' : ''}" role="button" tabindex="0" data-act="go-open" data-key="${esc(op.key)}" aria-expanded="${open}">
      <div class="opt-top"><div><div class="opt-title">${esc(op.title)}</div><div class="opt-sub">${esc(op.kind === 'transit' ? (op.transfers ? op.transfers + (op.transfers > 1 ? ' changes' : ' change') : 'No changes') : op.sub)}</div></div>
      <div class="opt-nums"><div class="t">${fmtMin(op.min)}</div><div class="c">${costText(op)}</div></div></div>
      ${strip(op)}
      <div class="row" style="gap:6px">${leaveBy}${tagPills(op, true)}</div>
      ${open ? `${stepList(op)}${op.notes.length ? `<p class="small muted" style="margin:0">${op.notes.map(esc).join(' · ')}</p>` : ''}
      <div class="opt-actions"><a class="btn sm" href="${mapsUrl(o, d, op.mapsMode)}" target="_blank" rel="noopener">Maps ↗</a><button class="btn sm primary" data-act="go-log" data-key="${esc(op.key)}">I took this · log ${op.cost ? rs(op.cost) : '₹0'}</button></div>` : ''}
    </div>`; }).join('')}</div>`;
  return `<div class="pagehead"><div><h2>Plan a trip</h2><p>Compare auto, train, metro, bus and cab for one trip. Tap an option for step-by-step directions.</p></div></div>
  <div class="stack" style="gap:16px">${syncBanner()}${allowanceStrip()}<div class="split">${form}<div>${list}</div></div></div>${acctDatalist()}`;
}
