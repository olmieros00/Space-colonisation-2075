# Frontier 2075 Agent Guide

## Project Context
This repo is a modular Three.js space-settlement experience. Before editing, use `outputs/INDEX.md` as the file router, `outputs/BRAND_GUIDELINES.md` for voice/type, and `SOURCE_CODE_BRIEF.md` for architecture notes when present.

## Scale System
`const R = 16` is Earth's radius in scene units.

| Object | Ratio / value |
| --- | --- |
| Earth clouds | `1.012 * R` |
| Earth atmosphere | `1.025 * R` |
| AI1 shells | `1.06 * R`, `1.10 * R`, `1.14 * R` |
| Standard satellite span | `0.045 * R` |
| AI1 Prime span | `0.08 * R` |
| Gateway wide rings | `~0.18 * R` |
| Gateway narrow rings | `~0.09 * R` |
| Gateway spine | `~0.70 * R` |
| Starcloud footprint | `~0.5 * R` |
| Moon radius | `0.27 * R` |
| Orbit camera distance | `2.6 * R` |
| Orbit camera min/max | `1.02 * R` / `6 * R` |

Starcloud also has its own first-person scene with local human scale: `1 unit = 1 metre`. Do not use orbit `R` inside `outputs/scenes/starcloud/`; the deck, buildings, colliders, and vista are metre-scale. The local scene is based on a 5GW Starcloud unit: a ~4000m compute spine, two ~2000m x 4000m solar wings, edge radiators, and a tiled constellation field extending tens of kilometres.

## Palette
- Beskar: `#7a8a9c`
- Charcoal: `#1a1d24`
- Amber: `#ff9a3c`
- Hero gold: `#ffd23f`
- Off-white: `#e8e8e0`

## Run
Serve the project over HTTP:

```bash
python3 -m http.server 8765 -d outputs
```

Then open:

```text
http://127.0.0.1:8765/index.html
```

ES modules require HTTP. `file://` breaks module loading.

## Import Map
`outputs/index.html` loads Three.js through one jsdelivr import map:
- `three@0.160.0`
- `three/addons/` from the matching jsdelivr examples path

Do not add a second CDN for Three.js. Dual Three instances cause subtle runtime and material/type errors.

## Dependency Rules
- `outputs/core/app.js` owns shared mutable state: `interactive`, `animated`, and `satellites`.
- Scene builders receive shared arrays from `app.js`; they do not create alternate global registries.
- Scene files import from `outputs/core/` only.
- Orbit submodules may also import from `outputs/shaders/`.
- Use native ES modules only. There is no bundler, install step, or package manager workflow.

## Standing Anti-Bloat Rules
1. No file over 300 lines. If an edit would exceed it, split first, then add.
2. Extract, do not append: a new subsystem gets a new module, never a tail on an existing file.
3. No duplicate helpers: shared primitives live in `outputs/core/` only.
4. Update `outputs/INDEX.md` on any structural change.
5. Patch stable files; full-file output only for small or actively changing files.

## Health Check
Run the advisory scanner before and after structural work:

```bash
node scripts/health.mjs
```

It reports line budgets, duplicate helper names, unused exports, and stale DOM refs.
