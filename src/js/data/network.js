/* Mumbai Rounds: Suburban rail and metro network: stations, lines and the routing graph. */
'use strict';
/* ============================== network ============================== */
const RS = {
 'Churchgate':[18.9353,72.8270],'Marine Lines':[18.9451,72.8238],'Charni Road':[18.9519,72.8185],'Grant Road':[18.9625,72.8158],'Mumbai Central':[18.9690,72.8195],'Mahalaxmi':[18.9827,72.8240],'Lower Parel':[18.9955,72.8305],'Prabhadevi':[19.0087,72.8363],'Dadar':[19.0186,72.8433],'Matunga Road':[19.0277,72.8465],'Mahim':[19.0410,72.8465],'Bandra':[19.0544,72.8406],'Khar Road':[19.0691,72.8398],'Santacruz':[19.0817,72.8414],'Vile Parle':[19.0996,72.8438],'Andheri':[19.1197,72.8464],'Jogeshwari':[19.1364,72.8489],'Ram Mandir':[19.1508,72.8499],'Goregaon':[19.1646,72.8493],'Malad':[19.1870,72.8484],'Kandivali':[19.2045,72.8517],'Borivali':[19.2290,72.8573],'Dahisar':[19.2502,72.8595],'Mira Road':[19.2812,72.8557],'Bhayandar':[19.3107,72.8520],
 'CSMT':[18.9398,72.8355],'Masjid':[18.9517,72.8386],'Sandhurst Road':[18.9614,72.8393],'Byculla':[18.9795,72.8328],'Chinchpokli':[18.9866,72.8330],'Currey Road':[18.9941,72.8330],'Parel':[19.0085,72.8378],'Matunga':[19.0273,72.8553],'Sion':[19.0470,72.8637],'Kurla':[19.0654,72.8793],'Vidyavihar':[19.0792,72.8973],'Ghatkopar':[19.0860,72.9081],'Vikhroli':[19.1111,72.9281],'Kanjurmarg':[19.1296,72.9281],'Bhandup':[19.1437,72.9371],'Nahur':[19.1543,72.9465],'Mulund':[19.1717,72.9561],'Thane':[19.1860,72.9757],'Kalwa':[19.1962,72.9965],'Mumbra':[19.1900,73.0230],'Diva':[19.1880,73.0420],'Kopar':[19.2105,73.0770],'Dombivli':[19.2183,73.0867],'Thakurli':[19.2270,73.0980],'Kalyan':[19.2356,73.1299],
 'Dockyard Road':[18.9660,72.8440],'Reay Road':[18.9770,72.8440],'Cotton Green':[18.9870,72.8430],'Sewri':[18.9990,72.8545],'Vadala Road':[19.0160,72.8590],'GTB Nagar':[19.0370,72.8650],'Chunabhatti':[19.0520,72.8690],'Tilak Nagar':[19.0670,72.8920],'Chembur':[19.0625,72.9010],'Govandi':[19.0550,72.9150],'Mankhurd':[19.0480,72.9320],'Vashi':[19.0633,72.9990],'Sanpada':[19.0620,73.0110],'Juinagar':[19.0540,73.0180],'Nerul':[19.0330,73.0180],'Seawoods':[19.0220,73.0190],'Belapur CBD':[19.0190,73.0390],'Kharghar':[19.0260,73.0590],'Mansarovar':[19.0160,73.0800],'Khandeshwar':[19.0070,73.0950],'Panvel':[18.9910,73.1210],"King's Circle":[19.0290,72.8570],
 'Airoli':[19.1580,72.9990],'Rabale':[19.1400,73.0030],'Ghansoli':[19.1180,73.0040],'Kopar Khairane':[19.1030,73.0090],'Turbhe':[19.0760,73.0180]
};
const rl = s => s.split('|').map(n => [n, RS[n][0], RS[n][1]]);
const ml = s => s.split(';').map(x => { const [n,a,b] = x.split(','); return [n, +a, +b]; });
const LINES = {
 WR:{label:'Western line',chip:'WR',kind:'rail',color:'var(--l-wr)',wait:4,speed:33,st:rl('Churchgate|Marine Lines|Charni Road|Grant Road|Mumbai Central|Mahalaxmi|Lower Parel|Prabhadevi|Dadar|Matunga Road|Mahim|Bandra|Khar Road|Santacruz|Vile Parle|Andheri|Jogeshwari|Ram Mandir|Goregaon|Malad|Kandivali|Borivali|Dahisar|Mira Road|Bhayandar')},
 CR:{label:'Central line',chip:'CR',kind:'rail',color:'var(--l-cr)',wait:4,speed:31,st:rl('CSMT|Masjid|Sandhurst Road|Byculla|Chinchpokli|Currey Road|Parel|Dadar|Matunga|Sion|Kurla|Vidyavihar|Ghatkopar|Vikhroli|Kanjurmarg|Bhandup|Nahur|Mulund|Thane|Kalwa|Mumbra|Diva|Kopar|Dombivli|Thakurli|Kalyan')},
 HR:{label:'Harbour line',chip:'HR',kind:'rail',color:'var(--l-hr)',wait:6,speed:30,st:rl('CSMT|Masjid|Sandhurst Road|Dockyard Road|Reay Road|Cotton Green|Sewri|Vadala Road|GTB Nagar|Chunabhatti|Kurla|Tilak Nagar|Chembur|Govandi|Mankhurd|Vashi|Sanpada|Juinagar|Nerul|Seawoods|Belapur CBD|Kharghar|Mansarovar|Khandeshwar|Panvel')},
 HRW:{label:'Harbour line (Andheri–Vadala)',chip:'HR',kind:'rail',color:'var(--l-hr)',wait:8,speed:30,st:rl("Goregaon|Ram Mandir|Jogeshwari|Andheri|Vile Parle|Santacruz|Khar Road|Bandra|Mahim|King's Circle|Vadala Road")},
 TH:{label:'Trans-Harbour line',chip:'TH',kind:'rail',color:'var(--l-th)',wait:8,speed:32,st:rl('Thane|Airoli|Rabale|Ghansoli|Kopar Khairane|Turbhe|Sanpada|Vashi')},
 THP:{label:'Trans-Harbour line (to Panvel)',chip:'TH',kind:'rail',color:'var(--l-th)',wait:10,speed:32,st:rl('Thane|Airoli|Rabale|Ghansoli|Kopar Khairane|Turbhe|Juinagar|Nerul|Seawoods|Belapur CBD|Kharghar|Mansarovar|Khandeshwar|Panvel')},
 M1:{label:'Metro 1',chip:'M1',kind:'metro',op:'m1',color:'var(--l-m1)',wait:4,speed:32,st:ml('Versova,19.1318,72.8184;D N Nagar,19.1244,72.8313;Azad Nagar,19.1265,72.8386;Andheri,19.1208,72.8480;Western Express Highway,19.1157,72.8553;Chakala (J B Nagar),19.1113,72.8619;Airport Road,19.1110,72.8740;Marol Naka,19.1086,72.8797;Saki Naka,19.1034,72.8881;Asalpha,19.0964,72.8981;Jagruti Nagar,19.0925,72.9042;Ghatkopar,19.0864,72.9088')},
 M2A:{label:'Metro 2A',chip:'M2A',kind:'metro',op:'mm',color:'var(--l-m2a)',wait:6,speed:32,st:ml('Andheri West (D N Nagar),19.1250,72.8320;Lower Oshiwara,19.1440,72.8340;Oshiwara,19.1530,72.8360;Goregaon West,19.1620,72.8360;Pahadi Goregaon,19.1690,72.8370;Lower Malad,19.1790,72.8360;Malad West,19.1870,72.8360;Valnai,19.1950,72.8370;Dahanukarwadi,19.2030,72.8390;Kandivali West,19.2110,72.8420;Pahadi Eksar,19.2230,72.8440;Borivali West,19.2300,72.8455;Eksar,19.2360,72.8480;Mandapeshwar,19.2410,72.8500;Kandarpada,19.2470,72.8530;Anand Nagar,19.2520,72.8560;Dahisar East,19.2560,72.8645')},
 M7:{label:'Metro 7',chip:'M7',kind:'metro',op:'mm',color:'var(--l-m7)',wait:6,speed:33,st:ml('Gundavali,19.1170,72.8560;Mogra,19.1270,72.8570;Jogeshwari East,19.1370,72.8580;Goregaon East,19.1560,72.8600;Aarey,19.1680,72.8620;Dindoshi,19.1780,72.8630;Kurar,19.1870,72.8640;Akurli,19.1990,72.8640;Poisar,19.2090,72.8650;Magathane,19.2220,72.8650;Devipada,19.2300,72.8650;Rashtriya Udyan,19.2380,72.8655;Ovaripada,19.2460,72.8660;Dahisar East,19.2555,72.8650')},
 M3:{label:'Metro 3 (Aqua)',chip:'M3',kind:'metro',op:'m3',color:'var(--l-m3)',wait:5,speed:40,st:ml('Aarey JVLR,19.1370,72.8750;SEEPZ,19.1260,72.8720;MIDC Andheri,19.1180,72.8700;Marol Naka,19.1090,72.8800;CSMIA T2,19.0990,72.8740;Sahar Road,19.0970,72.8600;CSMIA T1,19.0890,72.8530;Santacruz,19.0800,72.8490;Vidyanagari,19.0730,72.8540;BKC,19.0660,72.8640;Dharavi,19.0450,72.8540;Shitaladevi,19.0390,72.8440;Dadar,19.0200,72.8440;Siddhivinayak,19.0170,72.8310;Worli,19.0080,72.8180;Acharya Atre Chowk,19.0000,72.8150;Science Museum,18.9900,72.8180;Mahalaxmi,18.9830,72.8200;Mumbai Central,18.9710,72.8200;Grant Road,18.9630,72.8180;Girgaon,18.9550,72.8170;Kalbadevi,18.9480,72.8280;CSMT,18.9410,72.8350;Hutatma Chowk,18.9330,72.8330;Churchgate,18.9320,72.8260;Vidhan Bhavan,18.9250,72.8240;Cuffe Parade,18.9160,72.8220')}
};
const NODES = [], ADJ = [];
(function build(){
  for (const [lid, L] of Object.entries(LINES)){
    L.nodes = [];
    L.st.forEach(([name,lat,lng]) => { const id = NODES.length; NODES.push({id, line:lid, name, lat, lng}); ADJ.push([]); L.nodes.push(id); });
    for (let i = 1; i < L.nodes.length; i++){
      const a = L.nodes[i-1], b = L.nodes[i]; const km = hav(NODES[a], NODES[b]) * 1.08; const min = km / L.speed * 60 + 0.4;
      ADJ[a].push({to:b, kind:'ride', km, min}); ADJ[b].push({to:a, kind:'ride', km, min});
    }
  }
  for (let a = 0; a < NODES.length; a++) for (let b = a+1; b < NODES.length; b++){
    const A = NODES[a], B = NODES[b]; if (A.line === B.line) continue;
    const d = hav(A, B); if (d > 0.55) continue;
    const walk = 3 + d * 1000 / 70;
    ADJ[a].push({to:b, kind:'xfer', walk, min: walk + LINES[B.line].wait});
    ADJ[b].push({to:a, kind:'xfer', walk, min: walk + LINES[A.line].wait});
  }
})();
const nodeLabel = n => LINES[n.line].kind === 'metro' ? n.name + ' (' + LINES[n.line].label.replace(' (Aqua)','') + ')' : n.name + ' station';
// area picker: unique named places
const AREAS = (() => { const m = new Map(); for (const n of NODES){ const k = n.name; if (!m.has(k)) m.set(k, {name:k, lat:n.lat, lng:n.lng}); } return [...m.values()].sort((a,b) => a.name.localeCompare(b.name)); })();
