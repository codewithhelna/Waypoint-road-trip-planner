# Waypoint-road-trip-planner
Road trip planner that replans itself. It checks feasibility, builds an itinerary with fuel/EV stops, food and hotels, and re-optimizes when traffic, weather or delays change, without touching your locked stops. Web app + Android (Capacitor), with live weather, routing and chargers.
<div align="center">

# 🛣️ Waypoint

### Your road trip. Planned. Checked. Replanned.

A road trip planner that doesn't stop thinking once the plan is made.
When traffic, weather or delays change your day, Waypoint reshuffles the stops for you,
and it never touches the ones you locked.

`Web app` · `Installable PWA` · `Android (Capacitor)` · `Live weather & routing`

</div>

---

## ✨ What it does

You tell Waypoint where you're going, what you drive, who's coming and what you like to eat.
It answers three questions, and keeps answering them while you drive:

| | Question | What Waypoint does |
| 🧭 | **Can I make this trip?** | Gives a 🟢 / 🟡 / 🔴 feasibility verdict and explains why: distance, driving time, rest, fuel or charging, driver fatigue, weather. |
| 🗺️ | **What should I do?** | Builds a timeline of stops: food, attractions, chargers, hotel. Each has arrival and departure times, cost, facilities and a reason it was picked. |
| 🔄 | **What now that things changed?** | Re-optimizes the plan when a delay hits, and tells you exactly what it changed. |

## 🔄 The part we're proudest of: dynamic replanning

Hit **Simulate traffic delay** and watch it work. For the built-in demo, a +40 minute jam produces:

> *"Traffic has added 40 minutes. To keep your hotel arrival within the planned window, the optional Sunset Ridge Viewpoint has been removed, Amer Heritage Walk shortened by 25 min, and the charging stop moved."*

The rules it follows:

1. **Protect reservations.** Shorten earlier flexible stops so you still make your table.
2. **Protect your arrival window.** Drop *Optional* stops first, then shorten *Recommended* and *High priority* ones.
3. **Respect opening hours.** Low-priority stops that would arrive after closing are dropped.
4. **Never touch locked stops.** 🔒 Locked / Must-visit stops stay exactly as you set them.

Stops have four priorities: **Locked → High → Recommended → Optional**.

You decide how much freedom the planner gets:

| Mode | Behaviour |
|---|---|
| Manual | Times shift, nothing else changes |
| Suggestions only | Proposes changes, you click *Apply* |
| Smart planning | Applies small fixes, asks before removing a stop |
| Fully dynamic | Applies everything automatically (except locked stops) |

## 🧰 Features at a glance

- ✅ Feasibility check with reasons and alternatives
- ✏️ Editable timeline: lock, move, resize, add, remove and restore stops
- 🔋 Battery % on arrival at every stop (EV-aware)
- 🌦️ Weather along the route, not just at the destination
- 🍽️ Honest reservation labels: *Available · Limited availability · Unavailable · Requires external booking · Not checked*. Nothing is faked.
- 🔔 Notifications for delays, reservation risks and rain
- 🆘 Roadside assistance page with a big SOS button
- 📅 Export your live itinerary as **.ics** (calendar) or **.json**
- 📱 Installable on Android, wrapped for the Play Store with Capacitor
- 🌙 Dark mode and a mobile-first layout

## 🚀 Quick start

You need [Node.js 18+](https://nodejs.org).

```bash
git clone <your-repo-url>
cd waypoint
npm install
npm run server
```

Open **http://localhost:3000** and you're in.

> Want to try it without Node? Run `npx serve www`. Open it over `http://`, not by double-clicking the file, because live data and install need it.

## 🌍 Live data (no keys needed)

Waypoint talks to free, open services out of the box:

| What | Service | Key? |
|---|---|---|
| Place search | Nominatim (OpenStreetMap) | No |
| Route & distance | OSRM | No (no live traffic) |
| Weather | Open-Meteo | No |
| Chargers, restaurants, fuel | Overpass (OpenStreetMap) | No |
| **Live traffic delay** | TomTom | Yes, optional |
| **Richer EV charger data** | Open Charge Map | Yes, optional |

To switch on the optional ones:

```bash
cp .env.example .env     # then paste your keys inside
npm run server
```

Your keys stay on the server and are never sent to the browser. If any service can't be reached, the app falls back to built-in demo data and tells you so.


## 🧪 Try the demo

1. Open **My Trips / Live**.
2. Set the planning level to **Fully dynamic** and click **Demo scenario +40 min**.
3. Watch the timeline update. Changed stops highlight and the old time stays visible.
4. 🔒 Lock the optional viewpoint first, then repeat. Nothing gets removed, and the hotel arrival is flagged as at risk instead.
5. Click **Load live data** to pull real weather and chargers.

## 🛠️ Built with

Vanilla HTML / CSS / JavaScript 

## 🗺️ Roadmap

- [ ] Real accounts and trip sync between web and phone
- [ ] Restaurant, hotel and charging reservations through partner APIs
- [ ] Interactive map (Leaflet / MapLibre)
- [ ] Push notifications while driving
- [ ] Roadside assistance partner integration
- [ ] iOS app

## 📄 License

Add your license here (MIT is a common choice).

<div align="center">

Made for people who'd rather enjoy the drive than babysit the itinerary. 🚗💨

</div>
