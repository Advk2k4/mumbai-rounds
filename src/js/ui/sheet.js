/* Mumbai Rounds: Bottom sheet: location editor, add account, add expense. */
'use strict';
/* ============================== sheet (location editor, add expense) ============================== */
function renderSheet(){
  const el = $('#sheet'); const sh = S.sheet;
  if (!sh){ el.innerHTML = ''; return; }
  let inner = '';
  if (sh.type === 'loc' || sh.type === 'add'){
    const isHome = sh.id === 'home'; const a = sh.type === 'add' ? {name:'', area:''} : (isHome ? {name:'Home', area:S.prefs.home.label, lat:S.prefs.home.lat, lng:S.prefs.home.lng} : acct(sh.id));
    inner = `<h3>${sh.type === 'add' ? 'Add an account' : isHome ? 'Home location' : 'Location: ' + esc(a.name)}</h3>
    ${a.note ? `<p class="small muted">${esc(a.note)}</p>` : ''}
    <form class="formgrid" id="loc-form" style="margin-top:12px">
      ${sh.type === 'add' ? `<label class="f" for="loc-name">Name<input class="in" id="loc-name" required autocomplete="off"></label>` : ''}
      <label class="f" for="loc-area">${isHome ? 'Address label' : 'Area (shown under the name)'}<input class="in" id="loc-area" value="${esc(a.area || '')}" autocomplete="off"></label>
      <label class="f" for="loc-pick">Nearest station or area<select class="in" id="loc-pick"><option value="">Keep the current pin</option>${AREAS.map(x => `<option value="${x.lat},${x.lng}">${esc(x.name)}</option>`).join('')}</select></label>
      <label class="f" for="loc-coords">Or paste a Google Maps link or coordinates (more exact)<input class="in" id="loc-coords" placeholder="19.1230, 72.8685" autocomplete="off"></label>
      <p class="small faint" style="margin:0">On your phone: open Google Maps, press and hold on the building, then copy the coordinates shown at the top.</p>
      ${a.lat != null ? `<p class="small faint mono" style="margin:0">Current pin: ${Number(a.lat).toFixed(4)}, ${Number(a.lng).toFixed(4)}${a.q ? ` · <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.q)}" target="_blank" rel="noopener">find on Maps ↗</a>` : ''}</p>` : ''}
      <span class="hint" id="loc-err"></span>
      <div class="row" style="justify-content:flex-end">${sh.type === 'loc' && !isHome && S.places.overrides[sh.id] ? `<button type="button" class="btn ghost" data-act="loc-reset">Reset to original</button>` : ''}${sh.type === 'loc' && a.custom ? `<button type="button" class="btn ghost" data-act="loc-delete">Delete account</button>` : ''}<button type="button" class="btn" data-act="sheet-close">Cancel</button><button class="btn primary" type="submit">Save</button></div>
    </form>`;
  } else if (sh.type === 'exp'){
    inner = `<h3>Add an expense</h3><form class="formgrid" id="exp-form" style="margin-top:12px">
      <div class="two"><label class="f" for="exp-date">Date<input class="in" type="date" id="exp-date" value="${todayISO()}" required></label>
      <label class="f" for="exp-amt">Amount (₹)<input class="in" type="number" min="1" step="1" inputmode="numeric" id="exp-amt" required></label></div>
      <label class="f" for="exp-mode">Mode<select class="in" id="exp-mode">${['auto','taxi','cab','bus','train','metro','other'].map(m => `<option value="${m}">${MODE_NAME[m]}</option>`).join('')}</select></label>
      <label class="f" for="exp-note">Note<input class="in" id="exp-note" placeholder="e.g. Andheri → Nanavati" autocomplete="off"></label>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="sheet-close">Cancel</button><button class="btn primary" type="submit">Add</button></div></form>`;
  }
  el.innerHTML = `<div class="sheet-bg" data-act="sheet-bg"><div class="sheet" role="dialog" aria-modal="true">${inner}</div></div>`;
  const f = el.querySelector('input.in:not([type=date])'); if (f) f.focus({preventScroll:true});
}
function parseCoords(s){
  s = String(s || '').trim(); if (!s) return null;
  let m = s.match(/@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/) || s.match(/[?&](?:q|query|ll|destination)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/) || s.match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/);
  if (!m) return 'bad';
  const lat = +m[1], lng = +m[2];
  if (lat < 18.8 || lat > 19.6 || lng < 72.7 || lng > 73.4) return 'far';
  return {lat, lng};
}
