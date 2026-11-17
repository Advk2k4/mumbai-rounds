# How the estimates work

Mumbai Rounds doesn't call any maps or transit API. Every time and fare is computed in the browser from a small model of the city, so it works offline and costs nothing to run. This page explains that model and where it falls short.

All the numbers below live in [`src/js/engine/fares.js`](../src/js/engine/fares.js) and [`src/js/engine/routing.js`](../src/js/engine/routing.js).

## 1. Distance and road speed

- **Road distance** is the straight-line (haversine) distance × **1.3**, a typical detour factor for Mumbai streets.
- **Crossing to Navi Mumbai** is routed over the Vashi bridge (Mankhurd → Vashi) or the Airoli bridge, whichever is shorter, with the same 1.3× factor.
- **Road speed:**

  | Time | Speed |
  |---|---|
  | Rush hour (Mon–Sat, 8:00–11:30 and 17:00–21:00) | ~17 km/h |
  | Daytime, otherwise | ~24 km/h |
  | Night (22:00–07:00) | ~32 km/h |
  | Trips over 12 km / over 25 km | +25% / a further +10% (highways and freeways) |

- **Walking** is 4.5 km/h over straight-line distance × 1.25.

## 2. Modes and fares

| Mode | When it's offered | Fare model |
|---|---|---|
| **Walk** | Under ~2.6 km | Free |
| **Auto rickshaw** | Both ends in the suburbs (autos can't go south of Bandra/Sion), no creek crossing, under 20 km | ₹26 for the first 1.5 km, then ₹17.14/km (meter) |
| **Kaali-peeli taxi** | Either end in the island city (south of Mahim/Sion) | ₹31 for the first 1.5 km, then ₹20.66/km |
| **Uber / Ola cab** | Always | ≈ ₹50 + ₹15/km + ₹1.6/min, shown as a range (−10% to +35% in rush hour for surge) |
| **BEST / NMMT bus** | 1.5–22 km | AC fare slabs: ₹12 (≤5 km), ₹20 (≤10), ₹30 (≤15), ₹35 (≤20), ₹40 (≤25), ₹45. Timing allows for a wait and walks; route numbers aren't modelled (check the Chalo app). |
| **Local train** | Via the routing graph | Single-journey slabs by distance. 2nd class ₹5–25, 1st class ₹50–255, AC local ₹35–210. Rail changes count as one ticket. |
| **Metro** | Via the routing graph | ₹10–70 by distance (Metro 1: ₹10–40). A new ticket is charged when you change operator (Metro 1 / Metro 2A+7 / Metro 3). |

Fares were current as of 2025–26. If they change, edit the tables in `fares.js`.

## 3. The rail and metro network

[`src/js/data/network.js`](../src/js/data/network.js) holds 179 station nodes on these lines:

- **Western line**: Churchgate – Bhayandar
- **Central line**: CSMT – Kalyan
- **Harbour line**: CSMT – Panvel, plus the Andheri/Goregaon – Vadala branch
- **Trans-Harbour line**: Thane – Vashi and Thane – Panvel
- **Metro 1**: Versova – Ghatkopar
- **Metro 2A**: Andheri W – Dahisar E
- **Metro 7**: Gundavali – Dahisar E
- **Metro 3 (Aqua line)**: Aarey JVLR – Cuffe Parade

Each line has an average speed (stops included) and an average wait at boarding (4–10 min). Any two stations on different lines within 550 m of each other get a **transfer edge**: a 3-minute walk plus extra time for the distance, plus the new line's wait. Interchanges like Dadar (WR ↔ CR), Andheri (WR ↔ Metro 1) and Marol Naka (Metro 1 ↔ Metro 3) come out of this rule automatically.

## 4. Finding transit routes

For a trip from A to B, the app:

1. Takes the stations within 3 km of A and of B (or the nearest few, up to 6 km).
2. Connects A and B to those stations by **walking**, if within the max-walk setting (1 km by default), or by **auto/taxi** otherwise.
3. Runs **Dijkstra** over the graph four times with different filters:
   - all lines
   - trains only
   - metro only
   - all lines with a strong preference for cheaper routes
4. Turns each distinct path into an option, with exact fares worked out per ticket.

Dijkstra minimises a **generalised cost**: minutes + λ × rupees + comfort penalties.

## 5. Scoring and the "Recommended" tag

Every option, road or transit, gets the same score:

```
score = minutes
      + λ × cost            λ = 0.6 (save money), 0.25 (balanced), 0.08 (save time)
      + walking beyond 12 min × 0.6
      + 3 per change of train/metro
      + 12 if it rides a packed train in rush hour (when "avoid packed trains" is on)
      + 6 for buses (unpredictable routes)
```

At the balanced setting, ₹100 is worth about 25 minutes. The lowest score is tagged **Recommended**. The lowest-cost option and the quickest option get **Cheapest** and **Fastest**. A transit or bus option is dropped when another non-cab option is both at least 2 minutes faster and no more expensive.

## 6. Budget cycle

The budget runs from a configurable day (the **25th** by default) to the day before it in the next month. Within a cycle:

- **Per workday left** = (budget − spent) ÷ remaining workdays, including today (Mon–Sat or Mon–Fri).
- **Cycle-end pace** = spent ÷ elapsed workdays × total workdays.

## Known limitations

- There's **no live traffic, no train timetable and no disruption data**. The Maps button exists to check live conditions before leaving.
- **Bus routes aren't modelled.** Bus options are estimates for "a bus probably goes there".
- Pins are approximate (a few hundred metres), and walks use straight-line distance.
- Surge pricing, night auto fares and parking aren't modelled exactly.
- Monorail and Navi Mumbai Metro aren't included.
