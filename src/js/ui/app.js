/* Mumbai Rounds: App shell: navigation, rendering, event handling and boot. */
'use strict';
/* ============================== chrome & render ============================== */
const TABS = [['go','Trip','<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'],['plan','Day plan','<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M7.5 13.5h3M7.5 17h6"/>'],['accounts','Accounts','<path d="M4 21V6.5L12 3l8 3.5V21"/><path d="M9.5 21v-5h5v5M12 7.5v4M10 9.5h4"/>'],['budget','Budget','<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>']];
function renderChrome(){
  const btn = ([k,l,ic], small) => `<button data-act="tab" data-tab="${k}" ${S.tab === k ? 'aria-current="page"' : ''}>${small ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg>` : ''}${l}</button>`;
  $('#toptabs').innerHTML = TABS.map(t => btn(t, false)).join('');
  $('#bottomnav').innerHTML = TABS.map(t => btn(t, true)).join('');
  $('#gear').toggleAttribute('aria-current', S.tab === 'settings'); if (S.tab === 'settings') $('#gear').setAttribute('aria-current','page');
  const sy = $('#sync'); sy.className = 'sync ' + S.sync;
  sy.querySelector('span').textContent = {connecting:'Connecting…', cloud:'Synced', local:'This device only', readonly:'View only'}[S.sync];
  sy.title = {connecting:'', cloud:'Trips and plans sync between phone and laptop', local:'Saved in this browser only', readonly:'You can view but not save to the shared copy'}[S.sync];
}
let rafPending = false;
function render(){ if (rafPending) return; rafPending = true; requestAnimationFrame(() => { rafPending = false; doRender(); }); }
function doRender(){
  const ae = document.activeElement; const fid = ae && ae.id === 'acct-q' ? ae.id : null; let ss = null, se = null;
  try { ss = ae.selectionStart; se = ae.selectionEnd; } catch(e){}
  renderChrome(); DB.ensureRange();
  const v = {go:renderGo, plan:renderPlan, accounts:renderAccounts, budget:renderBudget, settings:renderSettings}[S.tab] || renderGo;
  $('#main').innerHTML = v();
  if (fid){ const el = document.getElementById(fid); if (el){ el.focus({preventScroll:true}); try { if (ss != null) el.setSelectionRange(ss, se); } catch(e){} } }
}
let toastTimer = null;
function toast(msg, undo){
  const el = $('#toast'); clearTimeout(toastTimer);
  el.innerHTML = `<div class="toast" role="status"><span>${esc(msg)}</span>${undo ? '<button data-act="undo">Undo</button>' : ''}</div>`;
  toastTimer = setTimeout(() => { el.innerHTML = ''; lastUndo = null; }, 6000);
}

/* ============================== events ============================== */
function findGoOption(key){ const g = S.go; const o = acct(g.from), d = acct(g.to); if (!o || !d) return null; const dow = new Date().getDay(); let t = g.timeMode === 'now' ? nowMin() : (toMin(g.time) ?? 600); if (g.timeMode === 'arrive'){ const est = options(o, d, t - 60, dow); t = t - (est.length ? est[0].min : 45) - 5; } const op = options(o, d, t, dow).find(x => x.key === key); return op ? {o, d, op, t} : null; }
const ACT = {
  tab(b){ S.tab = b.dataset.tab; S.ui.openLeg = null; render(); window.scrollTo({top:0}); },
  'go-swap'(){ const g = S.go; [g.from, g.to] = [g.to, g.from]; g.open = null; render(); },
  'go-when'(b){ S.go.timeMode = b.dataset.v; S.go.open = null; render(); },
  'go-open'(b, e){ if (e.target.closest('a,button')) return; S.go.open = S.go.open === b.dataset.key ? null : b.dataset.key; render(); },
  'go-log'(b){ const r = findGoOption(b.dataset.key); if (!r) return; logTrips(todayISO(), [tripFromOption(r.o, r.d, r.op, r.t)], `Logged ${rs(r.op.cost)} · ${r.op.title}`); },
  'leg-open'(b){ S.ui.openLeg = S.ui.openLeg === b.dataset.leg ? null : b.dataset.leg; render(); },
  'leg-pick'(b, e){ if (e.target.closest('a')) return; S.plan.choice[b.dataset.leg] = b.dataset.key; touchPlan(); render(); },
  'stop-rm'(b){ S.plan.stops.splice(+b.dataset.i, 1); S.plan.choice = {}; touchPlan(); render(); },
  'stop-up'(b){ const i = +b.dataset.i; if (i < 1) return; const s = S.plan.stops; [s[i-1], s[i]] = [s[i], s[i-1]]; S.plan.choice = {}; touchPlan(); render(); },
  'stop-down'(b){ const i = +b.dataset.i; const s = S.plan.stops; if (i >= s.length-1) return; [s[i+1], s[i]] = [s[i], s[i+1]]; S.plan.choice = {}; touchPlan(); render(); },
  'plan-order'(){ autoOrder(); touchPlan(); render(); toast('Stops reordered to cut travel'); },
  'plan-clear'(){ const before = JSON.parse(JSON.stringify(S.plan)); S.plan.stops = []; S.plan.choice = {}; touchPlan(); render(); lastUndo = () => { S.plan = before; touchPlan(); render(); }; toast('Plan cleared', true); },
  'plan-add-id'(b){ if (!S.plan) setPlanDate(todayISO()); if (S.planExample){ S.plan.stops = []; } if (!S.plan.stops.some(s => s.id === b.dataset.id)) S.plan.stops.push({id:b.dataset.id, meet:'', visit:null}); S.plan.choice = {}; touchPlan(); if (S.tab !== 'plan') toast('Added to ' + prettyDate(S.plan.date) + "'s plan"); render(); },
  'zone-plan'(b){ if (!S.plan) setPlanDate(todayISO()); if (S.planExample) S.plan.stops = []; const ids = allAccts().filter(a => a.zone === b.dataset.z && a.lat != null).map(a => a.id); for (const id of ids) if (!S.plan.stops.some(s => s.id === id)) S.plan.stops.push({id, meet:'', visit:null}); autoOrder(); touchPlan(); S.tab = 'plan'; render(); window.scrollTo({top:0}); toast('Added ' + ids.length + ' stops in ' + ZONE_MAP[b.dataset.z].name + '. Remove the ones you are not visiting'); },
  'plan-log'(){ const R = computePlan(); const list = R.legs.map(l => ({...tripFromOption(l.from, l.to, l.chosen, l.dep)})); logTrips(S.plan.date, list, `Logged ${list.length} trips · ${rs(R.cost)}`); },
  'acct-ok'(b){ const a = acct(b.dataset.id); if (!a || a.lat == null) return; S.places.overrides[a.id] = {...(S.places.overrides[a.id] || {}), lat:a.lat, lng:a.lng}; savePlaces(); render(); toast('Confirmed ' + a.name); },
  'acct-go'(b){ S.go.to = b.dataset.id; S.go.from = 'home'; S.go.open = null; S.tab = 'go'; render(); window.scrollTo({top:0}); },
  'edit-loc'(b){ S.sheet = {type:'loc', id:b.dataset.id}; renderSheet(); },
  'add-acct'(){ S.sheet = {type:'add'}; renderSheet(); },
  'add-exp'(){ S.sheet = {type:'exp'}; renderSheet(); },
  'sheet-close'(){ S.sheet = null; renderSheet(); },
  'sheet-bg'(b, e){ if (e.target === b){ S.sheet = null; renderSheet(); } },
  'loc-reset'(){ delete S.places.overrides[S.sheet.id]; savePlaces(); S.sheet = null; renderSheet(); render(); toast('Location reset'); },
  'loc-delete'(){ const id = S.sheet.id; S.places.custom = S.places.custom.filter(c => c.id !== id); delete S.places.overrides[id]; savePlaces(); S.sheet = null; renderSheet(); render(); toast('Account deleted'); },
  'trip-rm'(b){ const {date, id} = b.dataset; const d = S.days[date]; if (!d) return; const before = JSON.parse(JSON.stringify(d.trips)); d.trips = d.trips.filter(t => t.id !== id); saveDay(date); render(); lastUndo = () => { S.days[date].trips = before; saveDay(date); render(); }; toast('Trip deleted', true); },
  cycle(b){ S.cycleOff = Math.min(0, S.cycleOff + Number(b.dataset.d)); render(); },
  'sync-local'(){ uploadLocal(); },
  'sync-skip'(){ Local.patch(x => { x.migrated = true; }); S.localPending = null; render(); },
  'backup-copy'(){ const code = makeBackup(); const box = $('#backup-out'); if (box){ box.value = code; box.hidden = false; box.select(); } try { navigator.clipboard.writeText(code).then(() => toast('Backup code copied'), () => toast('Select the code and copy it')); } catch(e){ toast('Select the code and copy it'); } },
  async 'backup-restore'(){ const o = readBackup(($('#backup-in') || {}).value); if (!o){ toast('That code is not a Mumbai Rounds backup'); return; } try { const c = await importBundle(o); ($('#backup-in') || {}).value = ''; render(); toast(`Added ${c.trips} trip${c.trips===1?'':'s'} and ${c.places} location fix${c.places===1?'':'es'}`); } catch(e){ toast('Could not restore. Check your connection and try again'); } },
  pref(b){ const k = b.dataset.k; let v = b.dataset.v; if (k === 'avoidCrowds') v = v === 'true'; else if (k === 'maxWalk' || k === 'workdays') v = Number(v); S.prefs[k] = v; savePrefs(); render(); },
  undo(){ if (lastUndo){ lastUndo(); lastUndo = null; } $('#toast').innerHTML = ''; }
};
const CH = {
  'go-from'(el){ const id = nameToId(el.value); S.go.badFrom = !id && !!el.value; if (id) S.go.from = id; S.go.open = null; render(); },
  'go-to'(el){ const id = nameToId(el.value); S.go.badTo = !id && !!el.value; if (id) S.go.to = id; S.go.open = null; render(); },
  'go-time'(el){ if (el.value) { S.go.time = el.value; S.go.open = null; render(); } },
  'plan-date'(el){ if (!el.value) return; setPlanDate(el.value); render(); },
  'plan-start'(el){ if (el.value){ S.plan.start = el.value; S.plan.choice = {}; touchPlan(); render(); } },
  'plan-ret'(el){ S.plan.ret = el.checked; touchPlan(); render(); },
  'plan-add'(el){ const id = nameToId(el.value); if (!id || id === 'home'){ return; } if (S.planExample) S.plan.stops = []; if (!S.plan.stops.some(s => s.id === id)) S.plan.stops.push({id, meet:'', visit:null}); S.plan.choice = {}; el.value = ''; touchPlan(); render(); },
  'plan-zone'(el){ if (!el.value) return; ACT['zone-plan']({dataset:{z:el.value}}); },
  'stop-meet'(el){ S.plan.stops[+el.dataset.i].meet = el.value; S.plan.choice = {}; touchPlan(); render(); },
  'stop-visit'(el){ S.plan.stops[+el.dataset.i].visit = Number(el.value); touchPlan(); render(); },
  'trip-amt'(el){ const d = S.days[el.dataset.date]; if (!d) return; const t = d.trips.find(x => x.id === el.dataset.id); if (!t) return; const v = Math.max(0, Math.round(Number(el.value) || 0)); if (v === t.cost) return; t.cost = v; t.parts = {[t.mode === 'transit' ? 'train' : t.mode]: v}; if (t.mode === 'transit') t.mode = 'train'; saveDay(el.dataset.date); render(); },
  'pref-budget'(el){ const v = Math.max(0, Math.round(Number(el.value) || 0)); if (v){ S.prefs.budget = v; savePrefs(); render(); } },
  'pref-visit'(el){ S.prefs.visit = Number(el.value); savePrefs(); render(); },
  'pref-cycle'(el){ const v = Math.round(Number(el.value)); if (v >= 1 && v <= 28){ S.prefs.cycleDay = v; S.cycleOff = 0; savePrefs(); render(); } }
};
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; const f = ACT[b.dataset.act]; if (f) f(b, e); });
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.opt[role=button]')){ e.preventDefault(); e.target.click(); } if (e.key === 'Escape' && S.sheet){ S.sheet = null; renderSheet(); } });
document.addEventListener('change', e => { const el = e.target; const f = el.dataset && CH[el.dataset.ch]; if (f) f(el); });
document.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.in === 'acct-q'){ S.ui.q = e.target.value; render(); } });
document.addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'loc-form'){
    const sh = S.sheet; const err = $('#loc-err');
    const area = $('#loc-area').value.trim(); const pick = $('#loc-pick').value; const c = parseCoords($('#loc-coords').value);
    if (c === 'bad'){ err.textContent = "Couldn't read coordinates. Paste them like 19.1230, 72.8685"; return; }
    if (c === 'far'){ err.textContent = 'Those coordinates are outside the Mumbai region.'; return; }
    let loc = c || (pick ? {lat:+pick.split(',')[0], lng:+pick.split(',')[1]} : null);
    if (sh.type === 'add'){
      const name = $('#loc-name').value.trim(); if (!name){ err.textContent = 'Give the account a name.'; return; }
      if (!loc){ err.textContent = 'Choose the nearest station or paste coordinates.'; return; }
      S.places.custom.push({id:'c-' + uid(), name, area: area || (pick ? $('#loc-pick').selectedOptions[0].textContent : ''), lat:loc.lat, lng:loc.lng});
      savePlaces(); toast('Account added');
    } else if (sh.id === 'home'){
      S.prefs.home = {label: area || S.prefs.home.label, lat: loc ? loc.lat : S.prefs.home.lat, lng: loc ? loc.lng : S.prefs.home.lng}; savePrefs(); toast('Home updated');
    } else {
      const cur = acct(sh.id); const ov = {...(S.places.overrides[sh.id] || {})};
      if (area) ov.area = area;
      if (loc){ ov.lat = loc.lat; ov.lng = loc.lng; }
      else if (cur.lat == null){ err.textContent = 'Choose the nearest station or paste coordinates.'; return; }
      else if (cur.flag === 'g'){ ov.lat = cur.lat; ov.lng = cur.lng; } // confirming a best guess
      if (sh.id.startsWith('c-')){ const cu = S.places.custom.find(x => x.id === sh.id); if (cu){ if (area) cu.area = area; if (loc){ cu.lat = loc.lat; cu.lng = loc.lng; } } }
      else S.places.overrides[sh.id] = ov;
      savePlaces(); toast('Location saved');
    }
    S.sheet = null; renderSheet(); render();
  } else if (e.target.id === 'exp-form'){
    const date = $('#exp-date').value || todayISO(); const amt = Math.round(Number($('#exp-amt').value) || 0); if (!amt) return;
    const mode = $('#exp-mode').value; const note = $('#exp-note').value.trim();
    S.sheet = null; renderSheet();
    logTrips(date, [{id:uid(), t:'', mode, label:MODE_NAME[mode], note: note || MODE_NAME[mode], cost:amt, parts:{[mode]:amt}}], `Added ${rs(amt)}`);
  }
});

/* ============================== boot ============================== */
setPlanDate(todayISO());
// Open a tab straight from the link, e.g. …#plan or …#budget
{ const h = location.hash.slice(1); if (['go','plan','accounts','budget','settings'].includes(h)) S.tab = h; }
(function preload(){ const o = Local.read(); if (o.prefs) S.prefs = mergePrefs(o.prefs); })();
render();
DB.init();
