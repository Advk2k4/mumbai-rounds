/* Mumbai Rounds: Moving data between devices: one-tap upload of offline data and backup codes. */
'use strict';
/* ============================== moving data between devices ============================== */
function countData(o){ let trips = 0; for (const d of Object.values(o.days || {})) trips += (d.trips || []).length; const places = Object.keys((o.places || {}).overrides || {}).length + ((o.places || {}).custom || []).length; const plans = Object.values(o.plans || {}).filter(p => p && (p.stops || []).length).length; return {trips, places, plans, any: trips + places + plans > 0}; }
function checkLocalPending(){ const o = Local.read(); if (o.migrated) return; const c = countData(o); S.localPending = c.any ? c : null; render(); }
function mergeTrips(a, b){ const ids = new Set((a || []).map(t => t.id)); return [...(a || []), ...(b || []).filter(t => !ids.has(t.id))]; }
function mergePlaces(cur, inc){ const out = {overrides:{...(inc.overrides || {}), ...(cur.overrides || {})}, custom:[...(cur.custom || [])]}; const ids = new Set(out.custom.map(c => c.id)); for (const c of (inc.custom || [])) if (!ids.has(c.id)) out.custom.push(c); return out; }
// Merge a bundle {prefs, places, days, plans} into wherever this device saves now
async function importBundle(o){
  const c = countData(o);
  if (DB.db){
    const db = DB.db;
    for (const [date, doc] of Object.entries(o.days || {})){
      if (!(doc.trips || []).length) continue;
      const snap = await db.doc('days/' + date).get(); const cur = snap.exists ? snap.data() : {trips:[]};
      await db.doc('days/' + date).set({...cur, date, month:date.slice(0,7), trips:mergeTrips(cur.trips, doc.trips)});
    }
    if (o.places){ const snap = await db.doc('config/places').get(); await db.doc('config/places').set(mergePlaces(snap.exists ? snap.data() : {}, o.places)); }
    for (const [date, plan] of Object.entries(o.plans || {})){ if (!plan || !(plan.stops || []).length) continue; const snap = await db.doc('plans/' + date).get(); if (!snap.exists) await db.doc('plans/' + date).set(plan); }
    if (o.prefs){ const snap = await db.doc('config/prefs').get(); if (!snap.exists) await db.doc('config/prefs').set(mergePrefs(o.prefs)); }
  } else {
    for (const [date, doc] of Object.entries(o.days || {})){ const cur = S.days[date] || {trips:[]}; S.days[date] = {...cur, date, month:date.slice(0,7), trips:mergeTrips(cur.trips, doc.trips)}; }
    if (o.places) S.places = mergePlaces(S.places, o.places);
    Local.patch(x => { x.days = S.days; x.places = S.places; x.prefs = x.prefs || o.prefs || S.prefs; x.plans = {...(o.plans || {}), ...(x.plans || {})}; });
  }
  return c;
}
async function uploadLocal(){
  const o = Local.read();
  try { const c = await importBundle(o); Local.patch(x => { x.migrated = true; }); S.localPending = null; render(); toast(`Synced ${c.trips} trip${c.trips===1?'':'s'} from this device`); }
  catch(e){ toast('Could not sync this device yet. Check your connection and try again'); }
}
function makeBackup(){
  const o = DB.db ? {prefs:S.prefs, places:S.places, days:S.days, plans:S.plan ? {[S.plan.date]:S.plan} : {}} : Local.read();
  const json = JSON.stringify({v:1, prefs:o.prefs, places:o.places, days:o.days, plans:o.plans});
  return 'MR1.' + btoa(unescape(encodeURIComponent(json)));
}
function readBackup(code){
  code = String(code || '').trim(); if (!code.startsWith('MR1.')) return null;
  try { return JSON.parse(decodeURIComponent(escape(atob(code.slice(4))))); } catch(e){ return null; }
}
