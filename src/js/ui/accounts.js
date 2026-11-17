/* Mumbai Rounds: Accounts tab: area clusters, location checks. */
'use strict';
/* ============================== Accounts tab ============================== */
let ZONE_EST = null, ZONE_EST_KEY = '';
function zoneEstimates(){
  const k = [S.prefs.home.lat, S.prefs.home.lng, S.prefs.priority, S.prefs.trainClass, S.prefs.avoidCrowds, S.prefs.maxWalk].join('|');
  if (ZONE_EST && ZONE_EST_KEY === k) return ZONE_EST;
  ZONE_EST = {}; ZONE_EST_KEY = k; const home = homePlace();
  for (const z of ZONES){ const op = options(home, {...z, name:z.name}, 600, 2)[0]; if (op) ZONE_EST[z.id] = op; }
  return ZONE_EST;
}
function acctRow(a, checkMode){
  return `<div class="acct"><div class="acct-main"><div class="acct-name">${esc(a.name)}</div>
    <div class="acct-sub">${a.lat == null ? '<span class="pill bad">Needs location</span> ' : esc(a.area)}${a.flag === 'g' ? ' · <span style="color:var(--warn)">best guess</span>' : ''}${a.edited ? ' · <span style="color:var(--good)">location set by you</span>' : ''}${a.note && a.flag ? '<br>' + esc(a.note) : ''}</div></div>
    <div class="acct-act">${a.flag === 'g' && checkMode ? `<button class="btn sm primary" data-act="acct-ok" data-id="${esc(a.id)}">Correct</button>` : ''}${a.lat != null && !checkMode ? `<button class="btn sm ghost" data-act="acct-go" data-id="${esc(a.id)}" title="Plan a trip here">Trip</button><button class="btn sm ghost" data-act="plan-add-id" data-id="${esc(a.id)}" title="Add to the day plan">+ Plan</button>` : ''}<button class="btn sm ${a.lat == null ? '' : 'ghost'}" data-act="edit-loc" data-id="${esc(a.id)}" aria-label="Edit location of ${esc(a.name)}">${a.lat == null ? 'Set location' : checkMode ? 'Fix' : 'Edit'}</button></div></div>`;
}
function renderAccounts(){
  const all = allAccts(); const q = S.ui.q.trim().toLowerCase();
  const needs = all.filter(a => a.lat == null); const guesses = all.filter(a => a.flag === 'g');
  let body;
  if (q){
    const hits = all.filter(a => (a.name + ' ' + a.area + ' ' + (a.note || '')).toLowerCase().includes(q));
    body = `<div class="card">${hits.length ? hits.map(acctRow).join('') : '<div class="empty">No accounts match that.</div>'}</div>`;
  } else {
    const est = zoneEstimates();
    const zs = ZONES.map(z => ({z, list:all.filter(a => a.zone === z.id)})).filter(x => x.list.length);
    body = `${guesses.length ? `<div class="card" style="margin-bottom:16px"><div class="zone-head"><div class="row" style="justify-content:space-between"><h3>Please check</h3><span class="pill warn">${guesses.length} to confirm</span></div><div class="zone-est">These names on the account list were unclear, so their locations are best guesses. Tap <b>Correct</b> if the place is right, or <b>Fix</b> to move the pin.</div></div>${guesses.map(a => acctRow(a, true)).join('')}</div>` : ''}
    ${needs.length ? `<div class="card" style="margin-bottom:16px"><div class="zone-head"><h3>Needs a location</h3><div class="zone-est">These names didn't match a place I could find. Set a location to include them in plans.</div></div>${needs.map(acctRow).join('')}</div>` : ''}
    <div class="zones">${zs.map(({z, list}) => { const op = est[z.id]; const spread = Math.max(0, ...list.flatMap(a => list.map(b => hav(a,b))));
      return `<section class="zone"><div class="zone-head"><div class="row" style="justify-content:space-between"><h3>${esc(z.name)}</h3><span class="pill">${list.length} account${list.length>1?'s':''}</span></div>
      <div class="zone-est">${esc(z.sub)} · ${spread < 0.3 ? 'same building' : 'within ' + spread.toFixed(1) + ' km'}</div>
      ${op ? `<div class="zone-est">From home ~<b class="num">${fmtMin(op.min)}</b> · <span class="num">${costText(op)}</span> by ${esc(op.title)} <span class="faint">(10 am weekday)</span></div>` : ''}</div>
      ${list.map(acctRow).join('')}
      <div class="zone-foot"><button class="btn sm primary" data-act="zone-plan" data-z="${z.id}">Plan a day here</button><span class="small faint">Visit these together.</span></div></section>`; }).join('')}</div>`;
  }
  return `<div class="pagehead"><div><h2>Accounts</h2><p>${all.length} hospitals and clinics, grouped into areas you can cover in one outing. ${guesses.length} names were unclear, so their locations are best guesses; tap <b>Edit</b> to correct any pin.</p></div>
    <button class="btn" data-act="add-acct">+ Add account</button></div>
    <div class="stack" style="gap:14px"><input class="in" id="acct-q" data-in="acct-q" type="search" placeholder="Search by name or area" value="${esc(S.ui.q)}" autocomplete="off">${body}</div>`;
}
