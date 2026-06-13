# Project Index — read this before opening any file

## How to run
Serve the `outputs` project root with any static server:

```bash
python3 -m http.server 8765 -d outputs
```

Then open [http://127.0.0.1:8765/index.html](http://127.0.0.1:8765/index.html). ES modules require a server; `file://` will not work.

## Root files
| File | Purpose |
|---|---|
| AGENTS.md | Auto-loaded working rules, scale anchors, palette, import-map constraints, anti-bloat rules |
| README.md | Minimal run instructions for the GitHub repo |
| scripts/health.mjs | Advisory source scanner: line budgets, duplicate helpers, unused exports, stale UI ids |

## File map — open ONLY the relevant file for each task

### core/
| File | Edit when you need to change |
|---|---|
| app.js | Animation loop, renderer setup, shared state, scene switching |
| camera.js | Orbit controls, fly-to zoom, Starcloud inspection sub-state, drag/wheel/click behaviour |
| cinema.js | Parked cinematic title cards, crawl copy, hyperspace/projection transition timing |
| constants.js | Shared scale constants, currently `R = 16` |
| labels.js | Canvas sprite label system and label-tier typography |
| materials.js | Shared colour palette, material definitions, stars, texture loading |
| primitives.js | Shared `box`, `cyl`, and `shadowAll` mesh helpers |
| transitions.js | Iris wipe animation, Starbase launch animation, travel() scene dispatcher |
| ui.js | DOM element refs, mission panel open/close |
| walkCamera.js | Pointer-lock first-person deck walking and collision for the Starcloud scene |

### scenes/
| File | Edit when you need to change |
|---|---|
| gateway.js | Gateway Station interior — corridor, shuttle, Moon hologram, lighting |
| moon.js | Lunar surface — regolith, Imbrium Haven, Earth in sky |
| hub/index.js | Starbase Texas scene entry point and daylight setup |
| hub/structures.js | Starbase rocket, pad, towers, campus, props, ground |
| hub/textures.js | Starbase procedural canvas textures |
| orbit/index.js | Orbit scene orchestration, camera params |
| orbit/earth.js | Earth sphere — textures, day/night shader, clouds, atmosphere, Moon texture helper |
| orbit/constellation.js | Guardian Net Walker swarm — 150 satellites, orbital planes, laser links |
| orbit/starcloud.js | Starcloud cluster — solar array, compute modules, inspection massing, habitation silhouettes |
| orbit/station.js | Gateway exterior — 8-ring expansion station, spokes, rotation, docking hub |
| starcloud/index.js | Starcloud first-person scene orchestration, camera setup, UI state |
| starcloud/structure.js | Walkable deck, collision bounds, central spine, kilometre-scale vista silhouette |
| starcloud/buildings.js | Habitation building massing and building colliders |
| starcloud/props.js | Deck crates, antennae, and simple droid scale references |

### shaders/
| File | Edit when you need to change |
|---|---|
| earth.glsl.js | Earth vertex + fragment shader strings, procedural fallback, atmosphere shader |

## Scale anchor
`const R = 16` in `core/app.js` is Earth's radius in scene units. Orbit-scene objects are sized as multiples of `R`.

## Deleted / retired files
- `outputs/interactive-aircraft.html` was a stale duplicate. Use `outputs/index.html`.

## Starcloud inspection mode
When Starcloud Atlas is focused, `ENTER STRUCTURE` appears above the Earth View button. It switches the shared orbit camera into a Starcloud-only inspection sub-state with a local pivot on the structure, `near = 0.01`, `far = 200`, and inspection zoom bounds of `0.05` to `3` scene units. `↺ EXIT STRUCTURE` returns to the normal Starcloud focus view; `↺ EARTH VIEW` still resets to the Earth-orbit camera.

Starcloud orbit model scale: the ~8 unit footprint represents ~358m, so human-scale references use ~0.0224 units per meter.

Starcloud first-person scene scale: `1 unit = 1 metre`. The walkable district is roughly 300m x 120m, with low-detail solar-array and hull vistas extending kilometres along the structure. `ENTER STRUCTURE` from the focused orbit Starcloud now travels to this scene; `RETURN TO ORBIT` travels back to Earth orbit.

## Dependency rules
- `core/app.js` imports from scene files and owns shared mutable state.
- Scene files import from `core/` only, except orbit scene submodules that import `shaders/earth.glsl.js`.
- Shared mutable arrays (`interactive`, `animated`, `satellites`) are owned by `core/app.js` and passed to builders.
- Native ES modules only; no bundler, build step, or npm install.
- Three.js is loaded through the import map in `index.html`.

## Current status
- [x] hub — functional, modularized
- [x] orbit/earth — photoreal texture pass with procedural fallback
- [x] orbit/constellation — Walker pattern implemented
- [x] orbit/starcloud — orbital data center implemented
- [x] orbit/station — Station V implemented
- [x] gateway — functional, lighting fix preserved
- [x] moon — functional, stars + Earth-in-sky preserved
