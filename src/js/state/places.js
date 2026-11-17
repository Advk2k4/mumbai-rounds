/* Mumbai Rounds: Resolving accounts with user location fixes applied. */
'use strict';
/* ============================== places ============================== */
function homePlace(){ const h = S.prefs.home; return {id:'home', name:'Home', area:h.label, lat:h.lat, lng:h.lng}; }
function acct(id){
  if (id === 'home') return homePlace();
  const b = BASE_MAP[id] || S.places.custom.find(c => c.id === id); if (!b) return null;
  const o = S.places.overrides[id] || {}; const a = {...b, ...o};
  a.custom = !BASE_MAP[id]; a.edited = !!S.places.overrides[id] && o.lat != null;
  if (a.edited){ a.flag = null; }
  if (a.lat == null){ a.zone = null; a.flag = a.flag || 'u'; }
  else a.zone = (!a.edited && b.z) ? b.z : nearestZone(a);
  return a;
}
const allAccts = () => [...BASE.map(b => b.id), ...S.places.custom.map(c => c.id)].map(acct).filter(Boolean);
function nameToId(v){ v = String(v || '').trim().toLowerCase(); if (!v) return null; if (v === 'home' || v.startsWith('home ·')) return 'home'; const a = allAccts().find(x => x.name.toLowerCase() === v); return a ? a.id : null; }
const placeLabel = id => id === 'home' ? 'Home' : ((acct(id) || {}).name || '');
