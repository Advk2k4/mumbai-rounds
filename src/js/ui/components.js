/* Mumbai Rounds: Shared UI pieces: route strips, step lists, tags. */
'use strict';
/* ============================== UI: pieces ============================== */
const MODE_COLOR = {walk:'var(--m-walk)', auto:'var(--m-auto)', taxi:'var(--m-taxi)', cab:'var(--m-cab)', bus:'var(--m-bus)', train:'var(--m-train)', metro:'var(--m-metro)', transit:'var(--m-train)', other:'var(--ink-3)'};
const MODE_NAME = {walk:'Walk', auto:'Auto', taxi:'Taxi', cab:'Cab', bus:'Bus', train:'Train', metro:'Metro', other:'Other'};
function chipFor(s){
  if (s.t === 'walk' || s.t === 'xfer') return `<span class="chip walk">Walk <span class="n">${Math.max(1, Math.round(s.min))}</span></span>`;
  if (s.t === 'ride'){ const L = LINES[s.line]; return `<span class="chip" style="background:${L.color}">${L.chip} <span class="n">${Math.round(s.min)}</span></span>`; }
  const lab = {auto:'Auto', taxi:'Taxi', cab:'Cab', bus:'Bus'}[s.t] || s.t;
  const col = s.t === 'taxi' ? 'background:var(--m-taxi);color:var(--m-taxi-ink)' : 'background:' + MODE_COLOR[s.t];
  return `<span class="chip" style="${col}${s.t==='auto'?';color:#1C1A10':''}">${lab} <span class="n">${Math.round(s.min)}</span></span>`;
}
const strip = op => `<div class="strip" aria-label="Route">${op.segs.map(chipFor).join('<span class="arr" aria-hidden="true">›</span>')}</div>`;
function stepList(op){
  return `<ul class="steps">${op.segs.map(s => {
    let col = MODE_COLOR[s.t] || 'var(--m-walk)', txt = '', right = fmtMin(s.min);
    if (s.t === 'walk') txt = `Walk ${s.km ? s.km.toFixed(1) + ' km ' : ''}to ${esc(s.toL)}`;
    else if (s.t === 'auto' || s.t === 'taxi') { txt = `${s.t === 'auto' ? 'Auto' : 'Taxi'} ${s.egress ? 'from ' + esc(s.fromL) + ' to ' + esc(s.toL) : 'to ' + esc(s.toL)}`; right += ' · ' + rs(s.cost); }
    else if (s.t === 'cab') { txt = `Cab to ${esc(s.toL)}`; right += ' · ' + (op.costLo ? rs(op.costLo) + '–' + rs(op.costHi).slice(1) : rs(s.cost)); }
    else if (s.t === 'bus') { txt = `Bus to ${esc(s.toL)}`; right += ' · ' + rs(s.cost); }
    else if (s.t === 'xfer') { const a = NODES[s.fromN], b = NODES[s.toN]; txt = `Change at ${esc(a.name)}: walk to ${esc(nodeLabel(b))}`; }
    else if (s.t === 'ride') { const L = LINES[s.line]; col = L.color; txt = `<b>${esc(L.label)}</b> ${esc(NODES[s.fromN].name)} → ${esc(NODES[s.toN].name)} <span class="faint">· ${s.stops} stop${s.stops>1?'s':''}, incl. ~${s.wait} min wait</span>`; right += s.sameTicket ? ' · same ticket' : (s.fare != null ? ' · ' + rs(s.fare) : ''); }
    return `<li><span class="dot" style="background:${col}"></span><span>${txt}</span><span class="r">${right}</span></li>`;
  }).join('')}</ul>`;
}
function costText(op){ return op.costLo ? `${rs(op.costLo)}–${rs(op.costHi).slice(1)}` : (op.cost ? rs(op.cost) : 'Free'); }
function tagPills(op, bare){
  const t = (op.tags || []).map(x => `<span class="pill ${x === 'Recommended' ? 'rec' : 'acc'}">${x}</span>`);
  if (op.crowded) t.push(`<span class="pill warn">Crowded now</span>`);
  if (op.kind === 'cab') t.push(`<span class="pill">AC</span>`);
  if (op.kind === 'transit' && op.segs.some(s => s.t === 'ride' && s.line === 'M3')) t.push(`<span class="pill">AC metro</span>`);
  if (bare) return t.join('');
  return t.length ? `<div class="tags">${t.join('')}</div>` : '';
}
