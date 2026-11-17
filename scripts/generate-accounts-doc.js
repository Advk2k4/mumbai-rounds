#!/usr/bin/env node
// Regenerates docs/accounts.md from src/js/data/accounts.js.
//   node scripts/generate-accounts-doc.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(read('src/js/core/helpers.js') + '\n' + read('src/js/data/accounts.js') +
  '\nthis.BASE = BASE; this.ZONES = ZONES; this.nearestZone = nearestZone;', ctx);
const { BASE, ZONES, nearestZone } = ctx;

const zoneName = Object.fromEntries(ZONES.map(z => [z.id, z.name]));
const status = a => a.flag === 'u' ? '📍 Needs location' : a.flag === 'g' ? '⚠️ Best guess' : '✅ Confirmed';
const cell = s => String(s || '').replace(/\|/g, '/');
const counts = { u: 0, g: 0, ok: 0 };
BASE.forEach(a => counts[a.flag || 'ok']++);

let md = `# Accounts

The ${BASE.length} hospitals and clinics bundled with the app, grouped by the area cluster the app puts them in. This file is generated from [\`src/js/data/accounts.js\`](../src/js/data/accounts.js) by \`node scripts/generate-accounts-doc.js\`. Edit the data there, not here.

| Status | Count | Meaning |
|---|---|---|
| ✅ Confirmed | ${counts.ok} | The name matched a single place. |
| ⚠️ Best guess | ${counts.g} | The name was unclear or several branches exist. The pin is the likeliest match and the app asks the user to confirm it. |
| 📍 Needs location | ${counts.u} | No match was found. The app asks the user to set the location on their first visit. |

Pins are accurate to within a few hundred metres, which is enough for choosing transport. The Maps button in the app searches each hospital by name.

`;

const groups = {};
for (const a of BASE) {
  const z = a.lat == null ? '_none' : (a.z || nearestZone(a));
  (groups[z] = groups[z] || []).push(a);
}
for (const z of [...ZONES.map(z => z.id), '_none']) {
  const list = groups[z];
  if (!list) continue;
  md += `## ${z === '_none' ? 'No location yet' : zoneName[z]}\n\n| Account | Area | Status | Notes |\n|---|---|---|---|\n`;
  for (const a of list) md += `| ${cell(a.name)} | ${cell(a.area) || '–'} | ${status(a)} | ${cell(a.note)} |\n`;
  md += '\n';
}

fs.writeFileSync(path.join(root, 'docs/accounts.md'), md);
console.log(`Wrote docs/accounts.md (${BASE.length} accounts: ${counts.ok} confirmed, ${counts.g} best guess, ${counts.u} missing)`);
