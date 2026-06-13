# Project Index — read this before opening any file

## How to run
Serve the `outputs` project root with any static server:

```bash
python3 -m http.server 8765 -d outputs
```

Then open [http://127.0.0.1:8765/index.html](http://127.0.0.1:8765/index.html). ES modules require a server; `file://` will not work.

## File map — open ONLY the relevant file for each task

### core/
| File | Edit when you need to change |
|---|---|
| app.js | Animation loop, renderer setup, shared state, scene switching |
| camera.js | Orbit controls, fly-to zoom, drag/wheel/click behaviour |
| materials.js | Shared colour palette, material definitions, labels, stars, texture loading |
| transitions.js | Iris wipe animation, Starbase launch animation, travel() scene dispatcher |
| ui.js | DOM element refs, mission panel open/close |

### scenes/
| File | Edit when you need to change |
|---|---|
| hub.js | Starbase Texas — rocket, dome, tower, buildings |
| gateway.js | Gateway Station interior — corridor, shuttle, Moon hologram, lighting |
| moon.js | Lunar surface — regolith, GRU Hotel, Earth in sky |
| orbit/index.js | Orbit scene orchestration, camera params |
| orbit/earth.js | Earth sphere — textures, day/night shader, clouds, atmosphere, Moon texture helper |
| orbit/constellation.js | AI1 Walker swarm — 150 satellites, orbital planes, laser links |
| orbit/starcloud.js | Starcloud cluster — solar array, compute modules, formation sats |
| orbit/station.js | Station V — double ring, spokes, rotation, docking hub |

### shaders/
| File | Edit when you need to change |
|---|---|
| earth.glsl.js | Earth vertex + fragment shader strings, procedural fallback, atmosphere shader |

## Scale anchor
`const R = 16` in `core/app.js` is Earth's radius in scene units. Orbit-scene objects are sized as multiples of `R`.

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
