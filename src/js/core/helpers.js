/* Mumbai Rounds: Small formatting, date and geometry helpers. */
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rs = n => '₹' + Math.round(n).toLocaleString('en-IN');
const pad2 = n => String(n).padStart(2,'0');
const fmtMin = m => { m = Math.max(1, Math.round(m)); if (m < 60) return m + ' min'; const h = Math.floor(m/60), r = m % 60; return h + ' h' + (r ? ' ' + r + ' min' : ''); };
const toMin = s => { if (!s || !/^\d{1,2}:\d{2}/.test(s)) return null; const [h,m] = s.split(':').map(Number); return h*60+m; };
const toHM = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return pad2(Math.floor(m/60)) + ':' + pad2(m%60); };
const clock = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; let h = Math.floor(m/60); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + ':' + pad2(m%60) + ' ' + ap; };
const isoDate = d => d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate());
const todayISO = () => isoDate(new Date());
const nowMin = () => { const d = new Date(); return d.getHours()*60 + d.getMinutes(); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOWS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const prettyDate = iso => { const d = new Date(iso + 'T12:00:00'); return DOWS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; };
const monthName = ym => { const [y,m] = ym.split('-').map(Number); return ['January','February','March','April','May','June','July','August','September','October','November','December'][m-1] + ' ' + y; };
function hav(a, b){ const r = Math.PI/180, dLa = (b.lat-a.lat)*r, dLo = (b.lng-a.lng)*r; const s = Math.sin(dLa/2)**2 + Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLo/2)**2; return 12742*Math.asin(Math.sqrt(s)); }
