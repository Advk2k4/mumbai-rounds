/* Mumbai Rounds: App state, local storage and the synced Claude artifact database. */
'use strict';
/* ============================== state & storage ============================== */
const DEF_PREFS = {home:{label:'Andheri East (set your home in Settings)', lat:19.1197, lng:72.8464}, trainClass:'second', priority:'balanced', avoidCrowds:true, maxWalk:1.0, budget:10000, workdays:6, visit:45, cycleDay:25};
const S = {
  tab:'go', prefs:JSON.parse(JSON.stringify(DEF_PREFS)), places:{overrides:{}, custom:[]}, days:{}, cycleOff:0, localPending:null,
  go:{from:'home', to:'jaslok', timeMode:'now', time:'10:00', open:null},
  plan:null, planExample:false, ui:{q:'', openLeg:null, openOpt:null}, sheet:null, sync:'connecting'
};
const LS_KEY = 'mumbai-rounds-v1';
const Local = {
  read(){ try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch(e){ return {}; } },
  write(obj){ try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch(e){} },
  patch(fn){ const o = this.read(); fn(o); this.write(o); }
};
const DB = {
  db:null, q:{}, unsub:{},
  async init(){
    let db = null;
    try { db = (window.claude && typeof window.claude.use === 'function') ? await window.claude.use('db') : null; } catch(e){ db = null; }
    if (!db){ this.goLocal(); return; }
    // Check up front whether this viewer can save to the shared copy
    try {
      const u = await window.claude.use('user');
      if (u && typeof u.can === 'function'){ const c = await u.can('data.write'); if (c === false){ this.goLocal(true); return; } }
    } catch(e){}
    this.db = db; S.sync = 'cloud'; renderChrome();
    checkLocalPending();
    const onErr = e => { if (e && (e.code === 'revoked' || e.code === 'not_granted' || e.code === 'capability_disabled')) this.goLocal(); };
    this.unsub.prefs = db.doc('config/prefs').onSnapshot(s => { if (s.exists){ S.prefs = mergePrefs(s.data()); render(); } }, onErr);
    this.unsub.places = db.doc('config/places').onSnapshot(s => { if (s.exists){ const d = s.data(); S.places = {overrides:{...(d.overrides||{})}, custom:[...(d.custom||[])]}; render(); } }, onErr);
    this.rangeKey = ''; this.ensureRange(); this.subPlan();
  },
  goLocal(readonly){
    S.sync = readonly ? 'readonly' : 'local';
    for (const k in this.unsub){ try { this.unsub[k](); } catch(e){} }
    this.unsub = {}; this.db = null;
    const o = Local.read();
    if (o.prefs) S.prefs = mergePrefs(o.prefs);
    if (o.places) S.places = {overrides:o.places.overrides||{}, custom:o.places.custom||[]};
    S.days = o.days || {};
    loadPlanFrom(o.plans && S.plan && o.plans[S.plan.date]);
    renderChrome(); render();
  },
  // keep a live subscription covering the current cycle, the cycle on screen and the planned day's cycle
  ensureRange(){
    if (!this.db) return;
    const starts = [cycleStartFor(todayISO()), viewCycleStart()]; if (S.plan) starts.push(cycleStartFor(S.plan.date));
    const from = starts.reduce((a,b) => a < b ? a : b); const to = starts.map(nextCycleStart).reduce((a,b) => a > b ? a : b);
    const key = from + '|' + to; if (key === this.rangeKey) return; this.rangeKey = key;
    if (this.unsub.days) this.unsub.days();
    this.unsub.days = this.db.collection('days').where('date', '>=', from).where('date', '<', to).onSnapshot(qs => {
      const keep = {}; for (const [k,v] of Object.entries(S.days)) if (k < from || k >= to) keep[k] = v;
      qs.docs.forEach(d => { keep[d.id] = d.data(); }); S.days = keep; render();
    }, () => {});
  },
  subPlan(){
    if (!this.db || !S.plan) return;
    if (this.unsub.plan) this.unsub.plan();
    const date = S.plan.date;
    this.unsub.plan = this.db.doc('plans/' + date).onSnapshot(s => {
      if (planDirty || s.metadata.hasPendingWrites || !S.plan || S.plan.date !== date) return;
      if (s.exists) { loadPlanFrom(s.data()); render(); }
    }, () => {});
  },
  write(path, data){
    if (!this.db){ Local.patch(o => { const [col, id] = path.split('/'); if (col === 'config'){ o[id] = data; } else { o[col] = o[col] || {}; o[col][id] = data; } }); return Promise.resolve(); }
    const prev = this.q[path] || Promise.resolve();
    const p = prev.then(() => this.db.doc(path).set(data)).catch(e => {
      if (e && (e.code === 'invalid_argument' || e.code === 'not_granted' || e.code === 'revoked')){
        const snapshot = {prefs:S.prefs, places:S.places, days:S.days, plans:{}};
        if (S.plan) snapshot.plans[S.plan.date] = S.plan;
        Local.write(snapshot); this.goLocal(true);
        toast('Could not save to the shared copy, so changes stay on this device');
      } else if (e && e.code === 'quota_exceeded'){ toast('Storage is full. Delete some old trips, then try again'); }
      else toast('Not saved: check your connection and try again');
    });
    this.q[path] = p; return p;
  }
};
function mergePrefs(d){ const p = {...JSON.parse(JSON.stringify(DEF_PREFS)), ...(d||{})}; p.home = {...DEF_PREFS.home, ...((d && d.home) || {})}; return p; }
const savePrefs = () => DB.write('config/prefs', S.prefs);
const savePlaces = () => DB.write('config/places', S.places);
function saveDay(date){ const d = S.days[date] || {trips:[]}; d.date = date; d.month = date.slice(0,7); S.days[date] = d; return DB.write('days/' + date, d); }
let planTimer = null, planDirty = false;
function touchPlan(){ S.planExample = false; planDirty = true; clearTimeout(planTimer); planTimer = setTimeout(() => { const snap = JSON.parse(JSON.stringify(S.plan)); DB.write('plans/' + snap.date, snap).finally(() => { planDirty = false; }); }, 900); }
