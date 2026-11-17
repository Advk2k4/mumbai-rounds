/* Mumbai Rounds: Fare tables, road-speed model and regional rules (island city, Navi Mumbai). */
'use strict';
/* ============================== fares & speeds ============================== */
const isIsland = p => p.lat < 19.035 && p.lng < 72.875;          // no autos south of Mahim / Sion
const isNavi = p => p.lng > 72.975 && p.lat < 19.165;
const isPeak = (t, dow) => dow !== 0 && ((t >= 480 && t < 690) || (t >= 1020 && t < 1260));
function roadKm(a, b){
  let d = hav(a, b) * 1.3;
  if (isNavi(a) !== isNavi(b)){
    const m = isNavi(a) ? b : a, n = isNavi(a) ? a : b;
    const bridges = [[{lat:19.047,lng:72.937},{lat:19.062,lng:72.990}],[{lat:19.162,lng:72.960},{lat:19.155,lng:72.995}]];
    d = Math.min(...bridges.map(([w,e]) => (hav(m,w) + hav(w,e) + hav(e,n)) * 1.2));
  }
  return Math.max(d, 0.4);
}
function roadSpeed(km, t, dow){
  let s = isPeak(t, dow) ? 17 : 24;
  if (t < 420 || t >= 1320) s = 32;
  if (km > 12) s *= 1.25; if (km > 25) s *= 1.1;
  return s;
}
const autoFare = km => Math.round(Math.max(26, 26 + (km - 1.5) * 17.14));
const taxiFare = km => Math.round(Math.max(31, 31 + (km - 1.5) * 20.66));
const r5 = n => Math.round(n / 5) * 5;
function cabFare(km, min, peak){ const base = 50 + 15 * km + 1.6 * min; return {lo:r5(base*0.9), hi:r5(base*(peak?1.35:1.12)), mid:r5(base*(peak?1.12:1.0))}; }
function busFare(km){ const s = [[5,12],[10,20],[15,30],[20,35],[25,40]]; for (const [k,f] of s) if (km <= k) return f; return 45; }
const TRAIN = {
  second:[[10,5],[20,10],[45,15],[70,20],[999,25]],
  first:[[10,50],[20,105],[30,140],[45,165],[70,205],[999,255]],
  ac:[[10,35],[20,65],[30,100],[45,135],[70,170],[999,210]]
};
const trainFare = (km, cls) => { for (const [k,f] of TRAIN[cls] || TRAIN.second) if (km <= k) return f; return 25; };
function metroFare(op, km){
  if (op === 'm1'){ if (km <= 3) return 10; if (km <= 8) return 20; if (km <= 10) return 30; return 40; }
  const s = [[3,10],[12,20],[18,30],[24,40],[30,50],[36,60]]; for (const [k,f] of s) if (km <= k) return f; return 70;
}
const LAMBDA = {money:0.6, balanced:0.25, time:0.08};
