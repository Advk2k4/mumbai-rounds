/* Mumbai Rounds: Settings tab: preferences, budget cycle, sync and backup. */
'use strict';
/* ============================== Settings ============================== */
function renderSettings(){
  const P = S.prefs;
  const seg = (key, vals) => `<div class="seg" role="group">${vals.map(([v,l]) => `<button data-act="pref" data-k="${key}" data-v="${v}" aria-pressed="${String(P[key]) === String(v)}">${l}</button>`).join('')}</div>`;
  return `<div class="pagehead"><div><h2>Settings</h2><p>These shape which option gets recommended. Changes sync to every device where the app is open.</p></div></div>
  <div class="stack" style="gap:14px;max-width:760px">
    <div class="card pad stack"><span class="eyebrow">Home</span><div class="row" style="justify-content:space-between"><span><b>${esc(P.home.label)}</b><br><span class="small faint mono">${P.home.lat.toFixed(4)}, ${P.home.lng.toFixed(4)}</span></span><button class="btn sm" data-act="edit-loc" data-id="home">Change</button></div></div>
    <div class="card pad stack"><span class="eyebrow">What matters most</span>${seg('priority', [['money','Save money'],['balanced','Balanced'],['time','Save time']])}
      <p class="small muted" style="margin:0">Balanced treats ₹100 as worth about 25 minutes. Save money leans on trains and walking; save time leans on cabs and autos.</p></div>
    <div class="card pad stack"><span class="eyebrow">Train ticket</span>${seg('trainClass', [['second','2nd class'],['first','1st class'],['ac','AC local']])}
      <p class="small muted" style="margin:0">If you take trains most days, a monthly pass from the UTS app usually costs less than singles.</p></div>
    <div class="card pad stack"><span class="eyebrow">Rush hour</span>${seg('avoidCrowds', [['true','Avoid packed trains'],['false','Crowds are fine']])}
      <p class="small muted" style="margin:0">Rush hour here is 8–11:30 am and 5–9 pm, Monday to Saturday.</p></div>
    <div class="card pad stack"><span class="eyebrow">Longest walk to a station</span>${seg('maxWalk', [['0.5','500 m'],['1','1 km'],['1.5','1.5 km']])}</div>
    <div class="card pad stack"><span class="eyebrow">Budget</span><div class="two">
      <label class="f" for="pref-budget">Monthly travel budget (₹)<input class="in" type="number" min="0" step="500" id="pref-budget" data-ch="pref-budget" value="${P.budget}"></label>
      <label class="f" for="pref-visit">Default time at each visit<select class="in" id="pref-visit" data-ch="pref-visit">${[20,30,45,60,90].map(v => `<option value="${v}" ${v === Number(P.visit) ? 'selected':''}>${v} min</option>`).join('')}</select></label></div>
      <label class="f" for="pref-cycle" style="max-width:260px">Budget cycle starts on day<input class="in" type="number" min="1" max="28" step="1" id="pref-cycle" data-ch="pref-cycle" value="${Number(P.cycleDay) || 25}"></label>
      <p class="small muted" style="margin:0">The current cycle is ${cycleLabel(cycleStartFor(todayISO()))}. The ₹${Number(P.budget).toLocaleString('en-IN')} resets on the ${ordinal(Number(P.cycleDay) || 25)} of each month.</p>
      <span class="eyebrow" style="margin-top:4px">Work week</span>${seg('workdays', [['5','Mon–Fri'],['6','Mon–Sat']])}</div>
    ${syncCard()}
    <details class="card pad details" style="margin:0"><summary>How the estimates work</summary>
      <ul>
        <li><b>Routes</b> cover the Western, Central, Harbour and Trans-Harbour locals, plus Metro 1, 2A, 7 and 3 (Aqua line, Aarey–Cuffe Parade). Walks, autos or taxis connect you to stations.</li>
        <li><b>Auto</b>: ₹26 minimum, ~₹17/km. Autos can't go south of Bandra/Sion, so the island city uses kaali-peeli taxis (₹31 minimum, ~₹21/km).</li>
        <li><b>Cab</b>: roughly Uber Go/Ola Mini pricing, shown as a range because surge varies. <b>BEST bus</b>: AC fare slabs from ₹12; route numbers aren't modelled.</li>
        <li><b>Train</b>: single-journey slabs (2nd class ₹5–25). <b>Metro</b>: ₹10–70 by distance, with a new ticket for each operator.</li>
        <li><b>Road time</b> uses straight-line distance ×1.3 at ~17 km/h in rush hour and ~24 km/h otherwise, faster on long highway runs. Use the Maps button for live traffic.</li>
        <li><b>Pins</b> are within a few hundred metres, which is close enough to choose transport. Maps searches each hospital by name.</li>
      </ul></details>
  </div>`;
}

const ordinal = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
function syncBanner(){
  if (S.sync === 'cloud' && S.localPending) return `<div class="banner info"><span><b>This device has ${S.localPending.trips} trip${S.localPending.trips===1?'':'s'}${S.localPending.places ? ' and ' + S.localPending.places + ' location fix' + (S.localPending.places===1?'':'es') : ''} saved before sync was on.</b> Add them to the synced copy so they show on every device.</span><span class="row"><button class="btn sm primary" data-act="sync-local">Sync them now</button><button class="btn sm ghost" data-act="sync-skip">Ignore</button></span></div>`;
  if (S.sync === 'readonly') return `<div class="banner warn"><span><b>Not syncing yet.</b> Changes are saved on this device only. To sync your phone and laptop, the owner needs to share this page with your email as an <b>Editor</b>, not by link. Open it once on each device after that.</span></div>`;
  if (S.sync === 'local') return `<div class="banner warn"><span><b>Saving on this device only.</b> Open the app from its claude.ai link, signed in, to sync between devices.</span></div>`;
  return '';
}
function syncCard(){
  const st = {cloud:'<span class="pill good">Syncing</span> Trips, plans, location fixes and settings save to one shared copy. Changes on your phone show on your laptop within seconds, and vice versa.', readonly:'<span class="pill warn">Not syncing</span> This account can view the page but not save to it, so changes are kept on this device.', local:'<span class="pill warn">This device only</span> This copy isn\'t connected to claude.ai, so changes are kept in this browser.', connecting:'Connecting…'}[S.sync];
  return `<div class="card pad stack"><span class="eyebrow">Phone and laptop sync</span><p class="small" style="margin:0">${st}</p>
    ${S.sync !== 'cloud' ? `<ol class="small muted" style="margin:0;padding-left:18px"><li>The owner opens this page's <b>Share</b> menu and invites your email address as an <b>Editor</b>. An Editor invited by email can save; someone who only has the link can't.</li><li>Sign in to claude.ai with that email on both your phone and your laptop, and open the link.</li><li>The badge at the top changes to <b>Synced</b>. Anything saved on a device before that can be added to the synced copy with one tap.</li></ol>` : ''}
    ${syncBanner()}
    <details class="details" style="margin:0"><summary>Move data by hand with a backup code</summary>
      <p>Use this if sync isn't set up yet: copy the code on one device, send it to yourself, and paste it on the other. Trips are merged, never duplicated.</p>
      <div class="row"><button class="btn sm" data-act="backup-copy">Copy backup code</button></div>
      <textarea class="in" id="backup-out" rows="3" readonly hidden style="font-family:var(--f-mono);font-size:12px;margin-top:8px"></textarea>
      <label class="f" for="backup-in" style="margin-top:10px">Paste a backup code from another device<textarea class="in" id="backup-in" rows="3" style="font-family:var(--f-mono);font-size:12px" placeholder="MR1.…"></textarea></label>
      <div class="row" style="margin-top:8px"><button class="btn sm primary" data-act="backup-restore">Add to this device</button></div>
    </details></div>`;
}
