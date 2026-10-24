# The Branch Adventure

An interactive 3D toy globe for kids, built with three.js in a single HTML file.

**Play it:** https://joevaughn.github.io/the-branch-adventure/

## What you can do
- Spin and zoom a low-poly Earth with flat, Civilization-style terrain and mountain ranges
- Discover 50 wonders and natural wonders, 64 countries, 67 Caribbean islands, 44 cities and 37 animals
- Ride along with realistic planes, ships and helicopters, or watch the ISS orbit
- Follow quests and fill your Explorer Dex
- Sign in with an email to autosave discoveries and quest progress on the current browser
- Launch an Artemis-style rocket with a T-10 countdown and fly to the planets, moons, stars, nebulae and galaxies

## Saved progress
Every visit starts in Guest mode with empty progress. Use **Sign in to save** to restore the profile associated with an email on that browser. Signed-in progress autosaves after discoveries and quest updates; signing out returns to an empty guest game.

The app is hosted as a static site, so profiles are stored only in the browser and do not sync across devices. The normalized email is hashed into a local profile key and is never stored or transmitted.

## Run locally
Open `index.html` in a modern browser, or serve the folder:

```
python3 -m http.server 8000
```

Use the **HQ / FAST** button (bottom right) to switch graphics quality on slower devices.
