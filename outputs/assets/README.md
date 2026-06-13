# Optional Local Assets

This folder is intentionally safe to leave empty. Frontier 2075 boots with procedural fallbacks when these files are absent.

Expected filenames:

- `rocket.glb` — Hero launch vehicle for Starbase. Use +Y up, roughly centered on X/Z, base near ground. The app normalizes it to the procedural rocket height.
- `droid.glb` — Service/maintenance droid for Starcloud deck and orbit inspection LOD. Use +Y up, one complete droid at origin.
- `figure.glb` — Human-scale suited figure for habitation scale references. Use +Y up, one standing figure at origin.
- `env_space.hdr` — Space HDRI for orbit, Moon, and Starcloud reflections.
- `env_day.hdr` — Optional daylight HDRI for Starbase.
- `env_interior.hdr` — Optional bright interior HDRI for Gateway Station.

Good asset sources:

- Poly Haven: CC0 HDRIs.
- ambientCG: CC0 materials/HDRIs.
- Kenney: CC0/simple game assets.
- Quaternius: permissive low-poly game assets.
- AI text-to-3D or modeling tools exported as uncompressed `.glb`.

Keep assets same-origin in this folder. Do not add a second Three.js CDN or external runtime dependency.
