# Monrovia City

An open-world 3D game set in Monrovia, Liberia, playable in the browser. Steal cars, drive yellow taxis
and kekes down Broad Street, outrun the LNP, and hustle your way from Mamba Point to Red Light Market.

Built with [Three.js](https://threejs.org) and [Vite](https://vite.dev). The city layout, buildings and
landmarks are generated in code, and so is all the sound, including the car radio.

## Play

```bash
npm install
npm run dev        # http://localhost:5173
```

`npm run build` makes a static site in `dist/` (deployed to GitHub Pages by `.github/workflows/deploy.yml`
on every push to `main`). `npm run build:single` inlines everything into one self-contained
`dist-single/index.html` you can open or share as a single file.

## Controls

| Keys | Action |
| --- | --- |
| `W A S D` / arrows | move, drive |
| Mouse (click to capture) | look around |
| `Shift` | sprint |
| `Space` | jump / handbrake |
| `F` or `E` | get in, get out, or jack a car |
| `J` or left click | punch |
| `H` | horn |
| `Q` | siren (in a police car) |
| `T` | start or stop a taxi job (in a yellow taxi) |
| `M` | city map |
| `C` | near / far camera |
| `R` | radio on / off |
| `P` | pause |

On phones and tablets an on-screen joystick and buttons appear; drag the screen to look.

## What's in the city

- **Districts:** Mamba Point, West Point, Waterside, Snapper Hill, Downtown, Capitol Hill, Sinkor,
  Paynesville, Providence Island and Bushrod Island / Freeport, joined by the Gabriel Tucker Bridge.
- **Landmarks:** Ducor Hotel, Cape Mesurado Lighthouse, Waterside Market, Masonic Temple, LNP Headquarters,
  City Hall, the Capitol, the Executive Mansion, JFK Medical Center, SKD Sports Complex, Red Light Market
  and the Freeport docks.
- **Streets:** Broad, Carey, Ashmun, Water, Randall, Mechlin, Buchanan, Center, Gurley, Lynch, Camp Johnson
  Road, Tubman Boulevard, UN Drive and more.
- **Traffic:** yellow taxis, kekes, money buses, Land Cruisers, pickups and the odd sports car, driving on
  the right and stopping for people (mostly).
- **Wanted level:** punching people, running them over or jacking cars near the police raises your stars.
  Police cruisers chase you along the road network; at three stars a helicopter joins in. Break line of
  sight to cool down, or pay for a respray at a pink garage.
- **Jobs:** Waterside Hustle (delivery), Ducor Dash (race), Freeport Run (steal and deliver), Lose the Heat
  (escape), plus taxi fares in any yellow taxi.
- **Collectibles:** 24 hidden Lone Stars.
- **Day and night:** a full day lasts 10 minutes; windows, street lamps and the lighthouse light up at night.

Progress (money, finished jobs, Lone Stars) is saved in your browser.

## Code map

| File | What it does |
| --- | --- |
| `src/config.js` | Map layout: land, streets, districts, landmarks |
| `src/world.js` | Builds the city geometry, merged into a handful of draw calls |
| `src/roads.js` | Road graph used by traffic, police pathfinding and street names |
| `src/collision.js` | Spatial hash of static boxes, shoreline checks |
| `src/vehicles.js` | Car models and arcade driving physics |
| `src/traffic.js`, `src/peds.js`, `src/police.js` | AI drivers, pedestrians, wanted level |
| `src/missions.js`, `src/pickups.js` | Jobs, taxi fares, Lone Stars, cash |
| `src/hud.js`, `src/input.js`, `src/audio.js`, `src/sky.js` | HUD and minimap, controls, synthesised sound, day/night |
| `src/main.js` | Game loop that ties it all together |

## Credits

Car, character and palm tree models are by [Kenney](https://kenney.nl), released under CC0, taken from the
[pmndrs market assets](https://github.com/pmndrs/market-assets) collection. They were decompressed and
quantized with [glTF-Transform](https://gltf-transform.dev) and live in `src/assets/models/`. The characters are
rigged models posed in code (`src/character.js`) and their textures are recoloured at load time
(`src/assets.js`) for Liberian skin tones and varied clothing.
